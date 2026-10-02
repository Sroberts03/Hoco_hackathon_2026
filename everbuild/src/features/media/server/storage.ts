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
