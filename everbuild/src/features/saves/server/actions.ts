"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase/admin";
import { getViewer } from "@/features/auth/server/viewer";
import { UUID_RE } from "@/features/projects/server/access";
import { addProjectCandidate } from "@/features/candidates/server/queries";

/** Save or unsave a project for the signed-in user. Returns the new saved state. */
export async function setProjectSaved(projectId: string, saved: boolean): Promise<{ saved: boolean; error?: string }> {
  const viewer = await getViewer();
  if (!viewer) return { saved: !saved, error: "Log in to save projects." };
  if (!UUID_RE.test(projectId)) return { saved: !saved, error: "Unknown project." };

  const { error } = saved
    ? await db().from("saved_projects").upsert({ user_id: viewer.id, project_id: projectId }, { ignoreDuplicates: true })
    : await db().from("saved_projects").delete().eq("user_id", viewer.id).eq("project_id", projectId);

  if (error) return { saved: !saved, error: "Couldn't update. Try again." };
  let candidateError: string | undefined;
  if (saved && viewer.role === "company") {
    try {
      await addProjectCandidate(viewer.id, projectId);
    } catch (error) {
      console.error("Couldn't add saved project's candidate", error);
      candidateError = "Project saved, but the candidate board couldn't update. Reopen the dashboard to retry.";
    }
  }
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  return { saved, ...(candidateError ? { error: candidateError } : {}) };
}
