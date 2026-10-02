import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireViewer } from "@/features/auth/server/viewer";
import { UUID_RE } from "@/features/projects/server/access";
import { getThreadForUser, listThreadsForUser } from "@/features/messaging/server/threads";
import { MessagesShell } from "@/features/messaging/components/messages-shell";
import { ThreadView } from "@/features/messaging/components/thread-view";

export const metadata: Metadata = { title: "Conversation" };

export default async function ThreadPage({ params }: PageProps<"/messages/[threadId]">) {
  const { threadId } = await params;
  const viewer = await requireViewer(`/messages/${threadId}`);
  if (!UUID_RE.test(threadId)) notFound();

  const [thread, threads] = await Promise.all([getThreadForUser(threadId, viewer.id), listThreadsForUser(viewer.id)]);
  if (!thread) notFound();

  return (
    <MessagesShell threads={threads} activeId={thread.id}>
      <ThreadView thread={thread} />
    </MessagesShell>
  );
}
