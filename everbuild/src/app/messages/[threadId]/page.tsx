import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireViewer } from "@/features/auth/server/viewer";
import { UUID_RE } from "@/features/projects/server/access";
import { getThreadForUser, listThreadsForUser } from "@/features/messaging/server/threads";
import { InboxList } from "@/features/messaging/components/inbox-list";
import { ThreadView } from "@/features/messaging/components/thread-view";

export const metadata: Metadata = { title: "Conversation" };

export default async function ThreadPage({ params }: PageProps<"/messages/[threadId]">) {
  const { threadId } = await params;
  const viewer = await requireViewer(`/messages/${threadId}`);
  if (!UUID_RE.test(threadId)) notFound();

  const [thread, threads] = await Promise.all([getThreadForUser(threadId, viewer.id), listThreadsForUser(viewer.id)]);
  if (!thread) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/messages" className="text-sm text-muted hover:text-ink lg:hidden">
        ← All messages
      </Link>
      <div className="mt-4 grid gap-6 lg:mt-0 lg:grid-cols-[20rem_1fr]">
        <aside className="hidden lg:block">
          <h1 className="mb-4 text-lg font-semibold">Messages</h1>
          <InboxList threads={threads} activeId={thread.id} />
        </aside>
        <section aria-label={`Conversation with ${thread.other.name}`}>
          <ThreadView thread={thread} />
        </section>
      </div>
    </main>
  );
}
