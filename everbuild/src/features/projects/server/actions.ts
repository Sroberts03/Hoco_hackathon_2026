"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/supabase/admin";
import { getViewer } from "@/features/auth/server/viewer";
import { ANON_SESSION_COOKIE } from "@/features/auth/lib/session";
import { UUID_RE } from "./access";
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
