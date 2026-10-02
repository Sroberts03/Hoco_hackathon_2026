import type { Metadata } from "next";
import { requireViewer } from "@/features/auth/server/viewer";
import { listThreadsForUser } from "@/features/messaging/server/threads";
import { InboxList } from "@/features/messaging/components/inbox-list";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const viewer = await requireViewer("/messages");
  const threads = await listThreadsForUser(viewer.id);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
      <p className="mt-1 text-sm text-muted">One-to-one conversations with creators and companies.</p>
      <div className="mt-6">
        <InboxList threads={threads} />
      </div>
    </main>
  );
}
