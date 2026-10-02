import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const require = createRequire(import.meta.url);
function load(relativePath, mocks = {}) {
  const filename = fileURLToPath(new URL(relativePath, root));
  const output = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} };
  runInNewContext(output, {
    exports: loadedModule.exports, module: loadedModule,
    require: (id) => id in mocks ? mocks[id] : require(id),
  }, { filename });
  return loadedModule.exports;
}

const stages = load("src/features/candidates/lib/types.ts");
const companyId = "11111111-1111-4111-8111-111111111111";
const creatorId = "22222222-2222-4222-8222-222222222222";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function actions(viewer, result = { data: { creator_id: creatorId }, error: null }) {
  const filters = [];
  const updates = [];
  const revalidated = [];
  const query = {
    update(value) { updates.push(value); return this; },
    eq(key, value) { filters.push([key, value]); return this; },
    select() { return this; },
    async maybeSingle() { return result; },
  };
  return {
    ...load("src/features/candidates/server/actions.ts", {
      "next/cache": { revalidatePath: (path) => revalidated.push(path) },
      "@/features/auth/server/viewer": { getViewer: async () => viewer },
      "@/features/projects/server/access": { UUID_RE: uuid },
      "@/lib/supabase/admin": { db: () => ({ from: () => query }) },
      "../lib/types": stages,
    }), filters, updates, revalidated,
  };
}

test("signed-out users and creators cannot move company candidates", async () => {
  for (const viewer of [null, { id: creatorId, role: "creator" }]) {
    const action = actions(viewer);
    assert.ok((await action.moveCandidate(creatorId, "hired")).error);
    assert.equal(action.updates.length, 0);
  }
});

test("invalid stages and IDs cannot reach the database", async () => {
  const action = actions({ id: companyId, role: "company" });
  for (const [id, stage] of [[creatorId, "unknown"], [creatorId, "toString"], ["invalid", "hired"]]) {
    assert.ok((await action.moveCandidate(id, stage)).error);
  }
  assert.equal(action.updates.length, 0);
});

test("each stage change is scoped to the authenticated company and refreshes the board", async () => {
  for (const stage of Object.keys(stages.CANDIDATE_STAGES)) {
    const action = actions({ id: companyId, role: "company" });
    assert.equal((await action.moveCandidate(creatorId, stage)).error, undefined);
    assert.equal(action.updates[0].stage, stage);
    assert.deepEqual(action.filters, [["company_id", companyId], ["creator_id", creatorId]]);
    assert.deepEqual(action.revalidated, ["/dashboard"]);
  }
});

test("missing candidates or database errors return an error without reporting success", async () => {
  for (const result of [{ data: null, error: null }, { data: null, error: { message: "offline" } }]) {
    const action = actions({ id: companyId, role: "company" }, result);
    assert.ok((await action.moveCandidate(creatorId, "messaged")).error);
    assert.equal(action.revalidated.length, 0);
  }
});

test("saving multiple projects by one creator preserves their existing candidate stage", async () => {
  const records = new Map();
  const queries = load("src/features/candidates/server/queries.ts", {
    "server-only": {},
    "@/lib/supabase/admin": { db: () => ({ from: (table) => table === "projects" ? {
      select() { return this; }, eq() { return this; },
      async single() { return { data: { owner_id: creatorId }, error: null }; },
    } : {
      async upsert(row, options) {
        assert.equal(options.onConflict, "company_id,creator_id");
        assert.equal(options.ignoreDuplicates, true);
        const key = `${row.company_id}:${row.creator_id}`;
        if (!records.has(key)) records.set(key, { ...row, stage: "potential_candidate" });
        return { error: null };
      },
    } }) },
  });
  await queries.addProjectCandidate(companyId, "first-project");
  assert.equal(records.size, 1);
  const candidate = records.get(`${companyId}:${creatorId}`);
  assert.equal(candidate.stage, "potential_candidate");
  candidate.stage = "interview_scheduled";
  await queries.addProjectCandidate(companyId, "second-project");
  assert.equal(records.size, 1);
  assert.equal(candidate.stage, "interview_scheduled");
});
