import "server-only";
import { db } from "@/lib/supabase/admin";
import { storagePaths } from "@/features/media/lib/config";
import { downloadObject, objectInfo, removeFolder, signedUploadUrl } from "@/features/media/server/storage";
import { IMAGE_TYPES, LIMITS, type FileInfo, type UploadSlot, type ValidNewProject } from "../lib/new-project";
import { extractWebAppBundle } from "./bundle";

/** Where each uploaded file lands. The ZIP is temporary; it's unpacked into appDir. */
function uploadPath(projectId: string, slot: UploadSlot): string {
  const names: Record<UploadSlot, string> = { bundle: "upload/bundle.zip", video: "video.mp4", cover: "cover", poster: "poster" };
  return storagePaths.file(projectId, names[slot]);
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "project";

export type DraftCreated = { projectId: string; uploads: { slot: UploadSlot; url: string }[] };

/** Inserts the draft and its tags, then issues one signed upload URL per file. */
export async function createDraft(ownerId: string, p: ValidNewProject): Promise<DraftCreated | null> {
  const { data: tagRows, error: tagError } = await db().from("tags").select("id, name").in("name", p.tags);
  if (tagError || tagRows.length !== p.tags.length) return null;

  const { data: row, error } = await db()
    .from("projects")
    .insert({
      owner_id: ownerId,
      title: p.title,
      slug: slug(p.title),
      description: p.description,
      project_type: p.type,
      project_status: p.status,
      industry: p.industry,
      looking_for: p.lookingFor,
      github_repo: p.githubRepo,
      publication_status: "draft",
    })
    .select("id")
    .single();
  if (error) return null;

  const projectId: string = row.id;
  const { error: linkError } = await db()
    .from("project_tags")
    .insert(tagRows.map((t) => ({ project_id: projectId, tag_id: t.id })));
  if (linkError) {
    await discardDraft(projectId);
    return null;
  }

  const uploads: DraftCreated["uploads"] = [];
  for (const slot of Object.keys(p.files) as UploadSlot[]) {
    const url = await signedUploadUrl(uploadPath(projectId, slot));
    if (!url) {
      await discardDraft(projectId);
      return null;
    }
    uploads.push({ slot, url });
  }
  return { projectId, uploads };
}

/**
 * Checks what the browser actually uploaded and records it as project media.
 * Web-app ZIPs are unpacked here. Returns a user-facing error on failure.
 */
export async function attachUploads(projectId: string, files: ValidNewProject["files"]): Promise<string | null> {
  const insertMedia = async (mediaType: string, slot: UploadSlot, file: FileInfo, size: number, mimeType: string) => {
    const { data, error } = await db()
      .from("project_media")
      .insert({
        project_id: projectId,
        media_type: mediaType,
        storage_path: slot === "bundle" ? storagePaths.appDir(projectId) : uploadPath(projectId, slot),
        mime_type: mimeType,
        file_size_bytes: size,
        original_filename: file.name.slice(0, 255),
      })
      .select("id")
      .single();
    return error ? null : (data.id as string);
  };

  let coverId: string | null = null;

  if (files.bundle) {
    const zipPath = uploadPath(projectId, "bundle");
    const info = await objectInfo(zipPath);
    if (!info) return "Your ZIP didn't finish uploading. Please try again.";
    if (info.size > LIMITS.bundleBytes) return "The ZIP is too large.";
    const blob = await downloadObject(zipPath);
    if (!blob) return "Your ZIP didn't finish uploading. Please try again.";

    const result = await extractWebAppBundle(new Uint8Array(await blob.arrayBuffer()), storagePaths.appDir(projectId));
    await removeFolder(storagePaths.file(projectId, "upload"));
    if (!result.ok) return result.error;
    if (!(await insertMedia("web_app_bundle", "bundle", files.bundle, result.bytes, "application/zip"))) return "We couldn't save your web app.";
  }

  if (files.video) {
    const info = await objectInfo(uploadPath(projectId, "video"));
    if (!info) return "Your video didn't finish uploading. Please try again.";
    if (info.mimeType !== "video/mp4" || info.size > LIMITS.videoBytes) return "The video must be an MP4 under 100 MB.";
    if (!(await insertMedia("primary_video", "video", files.video, info.size, info.mimeType))) return "We couldn't save your video.";
  }

  for (const [slot, mediaType] of [["poster", "poster_image"], ["cover", "cover_image"]] as const) {
    const file = files[slot];
    if (!file) continue;
    const info = await objectInfo(uploadPath(projectId, slot));
    // A missing or odd poster is not worth failing over; a bad cover is.
    const valid = info && (IMAGE_TYPES as readonly string[]).includes(info.mimeType) && info.size <= LIMITS.imageBytes;
    if (!valid) {
      if (slot === "cover") return "The cover must be a PNG, JPEG, or WebP image under 5 MB.";
      continue;
    }
    const id = await insertMedia(mediaType, slot, file, info.size, info.mimeType);
    if (id) coverId = id; // cover wins over poster: it's processed last
  }

  if (coverId) await db().from("projects").update({ cover_asset_id: coverId }).eq("id", projectId);
  return null;
}

/** Removes a never-published draft and its files. */
export async function discardDraft(projectId: string): Promise<void> {
  await removeFolder(storagePaths.root(projectId));
  await db().from("projects").delete().eq("id", projectId).is("first_published_at", null);
}
