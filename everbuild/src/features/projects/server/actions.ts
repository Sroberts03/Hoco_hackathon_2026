"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { db } from "@/lib/supabase/admin";
import { getViewer } from "@/features/auth/server/viewer";
import { ANON_SESSION_COOKIE } from "@/features/auth/lib/session";
import { validateNewProject, type FileInfo, type NewProjectInput, type UploadSlot } from "../lib/new-project";
import { UUID_RE } from "./access";
import { attachUploads, createDraft, discardDraft, type DraftCreated } from "./create";
import { publishDraft } from "./publishing";
import { recordView } from "./views";

/** Called once by the project page after it mounts in the browser. */
export async function trackProjectView(projectId: string): Promise<void> {
  if (!UUID_RE.test(projectId)) return;

  const viewer = await getViewer();
  const anon = (await cookies()).get(ANON_SESSION_COOKIE)?.value;
  const viewerKey = viewer?.id ?? (anon ? `anon:${anon}` : null);
  if (!viewerKey) return;

  const { data: project } = await db()
    .from("projects")
    .select("owner_id, publication_status")
    .eq("id", projectId)
    .maybeSingle();
  if (!project || project.publication_status === "draft") return;

  await recordView(projectId, viewerKey, project.owner_id);
}

// ---------------------------------------------------------------------------
// Creating a project from the "New project" modal. Three steps, because files
// go straight from the browser to storage (they're too big for an action):
//   1. createProject: validate, insert the draft, return signed upload URLs.
//   2. The browser PUTs each file to its URL.
//   3. completeProject: verify the uploads, unpack ZIPs, optionally publish.
// If step 2 or 3 fails, the new draft is discarded so the creator can retry.
// ---------------------------------------------------------------------------

export type CreateProjectResult = ({ ok: true } & DraftCreated) | { ok: false; error: string };
export type CompleteProjectResult = { ok: true; projectId: string; published: boolean; notice?: string } | { ok: false; error: string };

export async function createProject(raw: NewProjectInput): Promise<CreateProjectResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Log in to add a project." };
  if (viewer.role !== "creator") return { ok: false, error: "Only creator accounts can publish projects." };

  const checked = validateNewProject(cleanInput(raw));
  if (!checked.ok) return checked;

  const draft = await createDraft(viewer.id, checked.project);
  if (!draft) return { ok: false, error: "We couldn't create your project. Please try again." };
  return { ok: true, ...draft };
}

export async function completeProject(projectId: string, raw: NewProjectInput, publish: boolean): Promise<CompleteProjectResult> {
  const viewer = await getViewer();
  const project = viewer && UUID_RE.test(projectId) ? await ownDraft(projectId, viewer.id) : null;
  if (!viewer || !project) return { ok: false, error: "That project couldn't be found." };

  const checked = validateNewProject(cleanInput(raw));
  if (!checked.ok) {
    await discardDraft(projectId);
    return checked;
  }

  const error = await attachUploads(projectId, checked.project.files);
  if (error) {
    await discardDraft(projectId);
    return { ok: false, error };
  }

  let published = false;
  let notice: string | undefined;
  if (publish) {
    const result = await publishDraft(projectId, viewer.id);
    if (result.ok) published = true;
    else notice = result.error;
  }

  revalidatePath("/dashboard");
  if (published) revalidatePath("/discover");
  return { ok: true, projectId, published, notice };
}

/** Called when the browser's upload fails, so a half-made draft doesn't linger. */
export async function discardNewProject(projectId: string): Promise<void> {
  const viewer = await getViewer();
  if (!viewer || !UUID_RE.test(projectId)) return;
  if (await ownDraft(projectId, viewer.id)) await discardDraft(projectId);
}

async function ownDraft(projectId: string, ownerId: string) {
  const { data } = await db()
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("owner_id", ownerId)
    .eq("publication_status", "draft")
    .is("first_published_at", null)
    .maybeSingle();
  if (!data) return null;
  // Uploads are attached once; a draft that already has media is past this flow.
  const { count } = await db().from("project_media").select("id", { count: "exact", head: true }).eq("project_id", projectId);
  return count ? null : data;
}

/** Actions receive whatever the client sends; coerce it to the expected shape. */
function cleanInput(raw: unknown): NewProjectInput {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const file = (v: unknown): FileInfo | undefined => {
    if (!v || typeof v !== "object") return undefined;
    const f = v as Record<string, unknown>;
    return typeof f.size === "number" && Number.isFinite(f.size) ? { name: str(f.name), size: f.size, type: str(f.type) } : undefined;
  };
  const files = (r.files && typeof r.files === "object" ? r.files : {}) as Record<string, unknown>;
  const slots: UploadSlot[] = ["bundle", "video", "cover", "poster"];

  return {
    title: str(r.title),
    description: str(r.description),
    type: str(r.type),
    status: str(r.status),
    industry: str(r.industry),
    tags: Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === "string").slice(0, 50) : [],
    lookingFor: str(r.lookingFor),
    webAppSource: str(r.webAppSource),
    githubUrl: str(r.githubUrl),
    files: Object.fromEntries(slots.map((s) => [s, file(files[s])]).filter(([, f]) => f)),
  };
}
