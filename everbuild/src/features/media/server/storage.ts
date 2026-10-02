import "server-only";
import { db } from "@/lib/supabase/admin";
import { MEDIA_BUCKET, SIGNED_URL_TTL_SECONDS } from "../lib/config";

export async function downloadObject(path: string): Promise<Blob | null> {
  const { data, error } = await db().storage.from(MEDIA_BUCKET).download(path);
  if (error) return null;
  return data;
}

export async function signedObjectUrl(path: string): Promise<string | null> {
  const { data, error } = await db().storage.from(MEDIA_BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) return null;
  return data.signedUrl;
}

export async function uploadObject(path: string, body: Blob | Uint8Array, contentType: string): Promise<boolean> {
  const { error } = await db().storage.from(MEDIA_BUCKET).upload(path, body, { contentType, upsert: true });
  return !error;
}

/** One-time URL the browser PUTs a file to, so large uploads skip the Next.js server. */
export async function signedUploadUrl(path: string): Promise<string | null> {
  const { data, error } = await db().storage.from(MEDIA_BUCKET).createSignedUploadUrl(path, { upsert: true });
  if (error) return null;
  return data.signedUrl;
}

/** Size and stored content type of an object, or null if it doesn't exist. */
export async function objectInfo(path: string): Promise<{ size: number; mimeType: string } | null> {
  const slash = path.lastIndexOf("/");
  const name = path.slice(slash + 1);
  const { data } = await db().storage.from(MEDIA_BUCKET).list(path.slice(0, slash), { search: name, limit: 10 });
  const file = data?.find((f) => f.name === name && f.id !== null);
  if (!file) return null;
  return { size: Number(file.metadata?.size ?? 0), mimeType: String(file.metadata?.mimetype ?? "") };
}

/** Deletes every object under a folder (storage has no cascade). */
export async function removeFolder(prefix: string): Promise<void> {
  const files: string[] = [];
  const collect = async (dir: string) => {
    const { data } = await db().storage.from(MEDIA_BUCKET).list(dir, { limit: 1000 });
    for (const item of data ?? []) {
      const full = `${dir}/${item.name}`;
      if (item.id === null) await collect(full);
      else files.push(full);
    }
  };
  await collect(prefix);
  for (let i = 0; i < files.length; i += 100) {
    await db().storage.from(MEDIA_BUCKET).remove(files.slice(i, i + 100));
  }
}
