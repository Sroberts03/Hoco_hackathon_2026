"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase/admin";
import { getViewer } from "@/features/auth/server/viewer";
import { UUID_RE } from "@/features/projects/server/access";
import { hasBlocked } from "@/features/safety/server/blocks";
import { MAX_COMMENT_LENGTH, type CommentFormState } from "../lib/types";

export async function addComment(_prev: CommentFormState, formData: FormData): Promise<CommentFormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Log in to comment." };

  const projectId = String(formData.get("projectId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!UUID_RE.test(projectId)) return { error: "Unknown project." };
  if (!body) return { error: "Write a comment first." };
  if (body.length > MAX_COMMENT_LENGTH) return { error: `Comments can be up to ${MAX_COMMENT_LENGTH} characters.` };

  const { data: project } = await db().from("projects").select("owner_id, publication_status").eq("id", projectId).maybeSingle();
  if (!project || project.publication_status === "draft") return { error: "This project isn't accepting comments." };
  if (await hasBlocked(project.owner_id, viewer.id)) return { error: "You can't comment on this project." };

  const { error } = await db().from("comments").insert({ project_id: projectId, author_id: viewer.id, body });
  if (error) return { error: "Couldn't post your comment. Try again." };

  revalidatePath(`/projects/${projectId}`);
  return { ok: Date.now() };
}

/** Authors can delete their own comments (soft delete). */
export async function deleteComment(commentId: string): Promise<void> {
  const viewer = await getViewer();
  if (!viewer || !UUID_RE.test(commentId)) return;

  const { data: comment } = await db().from("comments").select("author_id, project_id").eq("id", commentId).maybeSingle();
  if (!comment || comment.author_id !== viewer.id) return;

  await db().from("comments").update({ deleted_at: new Date().toISOString() }).eq("id", commentId);
  revalidatePath(`/projects/${comment.project_id}`);
}

/** Project owners can hide or unhide comments on their projects. */
export async function setCommentHidden(commentId: string, hidden: boolean): Promise<void> {
  const viewer = await getViewer();
  if (!viewer || !UUID_RE.test(commentId)) return;

  const { data: comment } = await db()
    .from("comments")
    .select("project_id, project:projects!comments_project_id_fkey(owner_id)")
    .eq("id", commentId)
    .maybeSingle();
  const ownerId = (comment?.project as unknown as { owner_id: string } | null)?.owner_id;
  if (!comment || ownerId !== viewer.id) return;

  await db().from("comments").update({ hidden_at: hidden ? new Date().toISOString() : null }).eq("id", commentId);
  revalidatePath(`/projects/${comment.project_id}`);
}
