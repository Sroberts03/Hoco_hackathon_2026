"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase/admin";
import { getViewer } from "@/features/auth/server/viewer";
import { UUID_RE } from "@/features/projects/server/access";
import type { MessageFormState } from "../lib/types";
import { checkCanSend, findOrCreateThread, insertMessage, threadRecipient } from "./threads";

/** Starts (or continues) a conversation with a creator, optionally about a project. */
export async function startConversation(_prev: MessageFormState, formData: FormData): Promise<MessageFormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Log in to send messages." };

  const recipientId = String(formData.get("recipientId") ?? "");
  const projectIdRaw = String(formData.get("projectId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!UUID_RE.test(recipientId)) return { error: "Unknown recipient." };
  const projectId = UUID_RE.test(projectIdRaw) ? projectIdRaw : null;

  const problem = await checkCanSend(viewer.id, recipientId, body);
  if (problem) return { error: problem };

  if (projectId) {
    const { data: p } = await db().from("projects").select("publication_status").eq("id", projectId).maybeSingle();
    if (!p || p.publication_status === "draft") return { error: "This project can't be messaged about." };
  }

  const threadId = await findOrCreateThread(viewer.id, recipientId, projectId);
  await insertMessage(threadId, viewer.id, body);
  revalidatePath("/messages");
  redirect(`/messages/${threadId}`);
}

export async function sendReply(_prev: MessageFormState, formData: FormData): Promise<MessageFormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Log in to send messages." };

  const threadId = String(formData.get("threadId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!UUID_RE.test(threadId)) return { error: "Unknown conversation." };

  const recipientId = await threadRecipient(threadId, viewer.id);
  if (!recipientId) return { error: "Unknown conversation." };

  const problem = await checkCanSend(viewer.id, recipientId, body);
  if (problem) return { error: problem };

  await insertMessage(threadId, viewer.id, body);
  revalidatePath(`/messages/${threadId}`);
  revalidatePath("/messages");
  return { ok: Date.now() };
}

/** Senders can delete their own messages; the thread shows a placeholder. */
export async function deleteMessage(messageId: string): Promise<void> {
  const viewer = await getViewer();
  if (!viewer || !UUID_RE.test(messageId)) return;

  const { data: m } = await db().from("messages").select("sender_id, thread_id").eq("id", messageId).maybeSingle();
  if (!m || m.sender_id !== viewer.id) return;

  await db().from("messages").update({ deleted_at: new Date().toISOString() }).eq("id", messageId);
  revalidatePath(`/messages/${m.thread_id}`);
}
