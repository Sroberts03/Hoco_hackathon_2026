import "server-only";
import { NextResponse } from "next/server";
import { db } from "@/lib/supabase/admin";
import { canViewProject, UUID_RE } from "@/features/projects/server/access";
import { getViewer } from "@/features/auth/server/viewer";
import { mimeForPath, storagePaths } from "../lib/config";
import { downloadObject, signedObjectUrl } from "./storage";

const notFound = () => new NextResponse("Not found", { status: 404 });

/** GET /media/:mediaId: checks access, then redirects to a short-lived signed storage URL. */
export async function serveMedia(mediaId: string): Promise<Response> {
  if (!UUID_RE.test(mediaId)) return notFound();

  const { data: media } = await db()
    .from("project_media")
    .select("storage_path, media_type, project:projects!project_media_project_id_fkey(owner_id, publication_status)")
    .eq("id", mediaId)
    .maybeSingle();
  if (!media || media.media_type === "web_app_bundle" || media.media_type === "source_bundle") return notFound();

  const project = media.project as unknown as { owner_id: string; publication_status: "draft" | "published" | "archived" } | null;
  if (!project) return notFound();
  if (project.publication_status === "draft") {
    const viewer = await getViewer();
    if (!canViewProject(project, viewer?.id ?? null)) return notFound();
  }

  const url = await signedObjectUrl(media.storage_path);
  if (!url) return notFound();
  return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "private, max-age=300" } });
}

/**
 * Sandbox policy for hosted web apps. The iframe also sets sandbox="allow-scripts";
 * repeating it as a CSP header keeps the file sandboxed even if opened directly.
 * Without allow-same-origin the app gets an opaque origin: no access to
 * Everbuild's cookies, storage, or DOM.
 */
const HOSTED_HEADERS = {
  "Content-Security-Policy": "sandbox allow-scripts; frame-ancestors 'self'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "public, max-age=60",
};

/** Rejects traversal and odd segments; returns a safe relative path or null. */
export function safeRelativePath(segments: string[]): string | null {
  if (!segments.length) return null;
  for (const s of segments) {
    if (!s || s === "." || s === ".." || s.includes("\\") || s.includes("\0") || s.startsWith("/")) return null;
  }
  return segments.join("/");
}

/** GET /hosted/:projectId/...path: serves a static file from a published project's web-app bundle. */
export async function serveHostedFile(projectId: string, segments: string[]): Promise<Response> {
  if (!UUID_RE.test(projectId)) return notFound();
  const rel = safeRelativePath(segments);
  if (!rel) return notFound();

  // The sandboxed iframe sends no cookies, so drafts are never served here.
  const { data: project } = await db()
    .from("projects")
    .select("publication_status, project_type")
    .eq("id", projectId)
    .maybeSingle();
  if (!project || project.project_type !== "web_app" || project.publication_status === "draft") return notFound();

  const blob = await downloadObject(`${storagePaths.appDir(projectId)}/${rel}`);
  if (!blob) return notFound();

  return new Response(blob, { headers: { ...HOSTED_HEADERS, "Content-Type": mimeForPath(rel) } });
}
