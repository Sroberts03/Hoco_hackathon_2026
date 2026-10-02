import "server-only";
import { unzipSync } from "fflate";
import { mimeForPath } from "@/features/media/lib/config";
import { safeRelativePath } from "@/features/media/server/serve";
import { uploadObject } from "@/features/media/server/storage";
import { LIMITS } from "../lib/new-project";

type Extracted = { ok: true; files: number; bytes: number } | { ok: false; error: string };

/** Finder and editor clutter that never belongs in a hosted app. */
const IGNORED = /(^|\/)(__MACOSX|\.DS_Store|Thumbs\.db|\.git)(\/|$)/;

/**
 * Unpacks a web-app ZIP into appDir. Only static files are stored; nothing is
 * executed on the server. Rejects archives that escape the folder, hold too
 * many files, or unpack too large, and requires an index.html. A single
 * top-level folder (what "Compress folder" produces) is stripped.
 */
export async function extractWebAppBundle(zip: Uint8Array, appDir: string): Promise<Extracted> {
  let declared = 0;
  let count = 0;
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(zip, {
      // Runs before each entry is inflated, so oversized archives stop early.
      filter: (f) => {
        if (f.name.endsWith("/") || IGNORED.test(f.name)) return false;
        declared += f.originalSize;
        count++;
        if (count > LIMITS.bundleFiles || declared > LIMITS.bundleUnzippedBytes) throw new Error("too_big");
        return true;
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "too_big") {
      return { ok: false, error: `The ZIP is too large once unpacked. Keep it under ${LIMITS.bundleFiles} files and ${LIMITS.bundleUnzippedBytes / 1024 / 1024} MB.` };
    }
    return { ok: false, error: "That file isn't a valid ZIP archive." };
  }

  const paths: [string, Uint8Array][] = [];
  for (const [name, data] of Object.entries(entries)) {
    if (name.startsWith("/") || /^[A-Za-z]:/.test(name)) return { ok: false, error: "The ZIP contains files with absolute paths." };
    const rel = safeRelativePath(name.split("/"));
    if (!rel) return { ok: false, error: "The ZIP contains files outside its folder (like ../). Re-create it from your project folder." };
    paths.push([rel, data]);
  }

  const root = commonRoot(paths.map(([p]) => p));
  const files = paths.map(([p, data]) => [p.slice(root.length), data] as const);
  if (!files.some(([p]) => p === "index.html")) {
    return { ok: false, error: "The ZIP needs an index.html at its top level (or inside a single top-level folder)." };
  }

  // Actual unpacked sizes can differ from what the archive declared.
  const bytes = files.reduce((n, [, d]) => n + d.length, 0);
  if (bytes > LIMITS.bundleUnzippedBytes) return { ok: false, error: "The ZIP is too large once unpacked." };

  for (let i = 0; i < files.length; i += 8) {
    const batch = files.slice(i, i + 8);
    const results = await Promise.all(batch.map(([p, d]) => uploadObject(`${appDir}/${p}`, d, mimeForPath(p))));
    if (results.includes(false)) return { ok: false, error: "We couldn't store your web app's files. Please try again." };
  }
  return { ok: true, files: files.length, bytes };
}

/** "my-app/" when every file sits inside that one folder and there's no root index.html. */
function commonRoot(paths: string[]): string {
  if (paths.includes("index.html")) return "";
  const first = paths[0]?.split("/")[0];
  if (!first || !paths.every((p) => p.startsWith(`${first}/`))) return "";
  return `${first}/`;
}
