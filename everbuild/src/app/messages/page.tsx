import type { Metadata } from "next";
import { requireViewer } from "@/features/auth/server/viewer";
import { listThreadsForUser } from "@/features/messaging/server/threads";
import { MessagesShell, NoThreadSelected } from "@/features/messaging/components/messages-shell";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const viewer = await requireViewer("/messages");
  const threads = await listThreadsForUser(viewer.id);

  return (
    <MessagesShell threads={threads}>
      <NoThreadSelected hasThreads={threads.length > 0} />
    </MessagesShell>
  );
}
