import "server-only";
import { db } from "@/lib/supabase/admin";
import { isBlockedEitherWay } from "@/features/safety/server/blocks";
import { MAX_MESSAGE_LENGTH, MESSAGE_COOLDOWN_SECONDS, MESSAGES_PER_HOUR_LIMIT } from "../lib/config";
import type { Participant, ThreadDetail, ThreadSummary } from "../lib/types";

type UserRow = { id: string; display_name: string; role: "creator" | "company"; company_profiles: { is_verified: boolean } | null };
type ThreadRow = {
  id: string;
  participant_a_id: string;
  participant_b_id: string;
  updated_at: string;
  a: UserRow | null;
  b: UserRow | null;
  project: { id: string; title: string } | null;
};

const THREAD_SELECT = `id, participant_a_id, participant_b_id, updated_at,
  a:users!message_threads_participant_a_id_fkey(id, display_name, role, company_profiles(is_verified)),
  b:users!message_threads_participant_b_id_fkey(id, display_name, role, company_profiles(is_verified)),
  project:projects!message_threads_project_id_fkey(id, title)`;

function toParticipant(u: UserRow | null): Participant {
  return {
    id: u?.id ?? "",
    name: u?.display_name ?? "Deleted user",
    role: u?.role ?? "creator",
    isVerifiedCompany: Boolean(u?.company_profiles?.is_verified),
  };
}

const otherSide = (t: ThreadRow, me: string) => toParticipant(t.participant_a_id === me ? t.b : t.a);

/** Returns a user-facing reason the message can't be sent, or null. */
export async function checkCanSend(senderId: string, recipientId: string, body: string): Promise<string | null> {
  if (senderId === recipientId) return "You can't message yourself.";
  if (!body) return "Write a message first.";
  if (body.length > MAX_MESSAGE_LENGTH) return `Messages can be up to ${MAX_MESSAGE_LENGTH} characters.`;
  if (await isBlockedEitherWay(senderId, recipientId)) return "You can't message this person.";

  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { data: recent } = await db()
    .from("messages")
    .select("created_at")
    .eq("sender_id", senderId)
    .gte("created_at", hourAgo)
    .order("created_at", { ascending: false });
  if (recent?.length) {
    if (Date.now() - new Date(recent[0].created_at).getTime() < MESSAGE_COOLDOWN_SECONDS * 1000) {
      return "You're sending messages too quickly. Wait a few seconds.";
    }
    if (recent.length >= MESSAGES_PER_HOUR_LIMIT) return "You've hit the hourly message limit. Try again later.";
  }
  return null;
}

/** Finds the existing thread for this pair (+ project) or creates it. */
export async function findOrCreateThread(a: string, b: string, projectId: string | null): Promise<string> {
  let query = db()
    .from("message_threads")
    .select("id")
    .or(`and(participant_a_id.eq.${a},participant_b_id.eq.${b}),and(participant_a_id.eq.${b},participant_b_id.eq.${a})`);
  query = projectId ? query.eq("project_id", projectId) : query.is("project_id", null);
  const { data: existing } = await query.limit(1);
  if (existing?.length) return existing[0].id;

  const { data, error } = await db()
    .from("message_threads")
    .insert({ participant_a_id: a, participant_b_id: b, project_id: projectId })
    .select("id")
    .single();
  if (error) {
    // Lost a race with a concurrent insert: the unique index guarantees one thread.
    const { data: retry } = await query.limit(1);
    if (retry?.length) return retry[0].id;
    throw new Error(`Failed to create thread: ${error.message}`);
  }
  return data.id;
}

export async function insertMessage(threadId: string, senderId: string, body: string): Promise<void> {
  const { error } = await db().from("messages").insert({ thread_id: threadId, sender_id: senderId, body });
  if (error) throw new Error(`Failed to send message: ${error.message}`);
  await db().from("message_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
}

export async function listThreadsForUser(userId: string): Promise<ThreadSummary[]> {
  const { data, error } = await db()
    .from("message_threads")
    .select(THREAD_SELECT)
    .or(`participant_a_id.eq.${userId},participant_b_id.eq.${userId}`)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`Failed to load inbox: ${error.message}`);
  const threads = (data ?? []) as unknown as ThreadRow[];
  if (!threads.length) return [];

  const { data: msgs } = await db()
    .from("messages")
    .select("thread_id, sender_id, body, created_at, deleted_at")
    .in("thread_id", threads.map((t) => t.id))
    .order("created_at", { ascending: false });
  const last = new Map<string, { body: string; fromMe: boolean; createdAt: string }>();
  for (const m of msgs ?? []) {
    if (last.has(m.thread_id)) continue;
    last.set(m.thread_id, { body: m.deleted_at ? "Message deleted" : m.body, fromMe: m.sender_id === userId, createdAt: m.created_at });
  }

  return threads.map((t) => ({
    id: t.id,
    other: otherSide(t, userId),
    project: t.project,
    lastMessage: last.get(t.id) ?? null,
    updatedAt: t.updated_at,
  }));
}

/** A thread and its messages, or null if the user isn't a participant. */
export async function getThreadForUser(threadId: string, userId: string): Promise<ThreadDetail | null> {
  const { data } = await db().from("message_threads").select(THREAD_SELECT).eq("id", threadId).maybeSingle();
  const t = data as unknown as ThreadRow | null;
  if (!t || (t.participant_a_id !== userId && t.participant_b_id !== userId)) return null;

  const other = otherSide(t, userId);
  const [{ data: msgs }, blocked] = await Promise.all([
    db().from("messages").select("id, sender_id, body, created_at, deleted_at").eq("thread_id", threadId).order("created_at"),
    isBlockedEitherWay(userId, other.id),
  ]);

  return {
    id: t.id,
    other,
    project: t.project,
    blocked,
    messages: (msgs ?? []).map((m) => ({
      id: m.id,
      body: m.deleted_at ? null : m.body,
      createdAt: m.created_at,
      fromMe: m.sender_id === userId,
    })),
  };
}

/** The other participant's id, if `userId` is in the thread. */
export async function threadRecipient(threadId: string, userId: string): Promise<string | null> {
  const { data } = await db().from("message_threads").select("participant_a_id, participant_b_id").eq("id", threadId).maybeSingle();
  if (!data) return null;
  if (data.participant_a_id === userId) return data.participant_b_id;
  if (data.participant_b_id === userId) return data.participant_a_id;
  return null;
}
