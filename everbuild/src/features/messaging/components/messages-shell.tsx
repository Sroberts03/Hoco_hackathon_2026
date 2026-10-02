import { plural } from "@/lib/format";
import type { ThreadSummary } from "../lib/types";
import { InboxList } from "./inbox-list";

/**
 * One chat window: conversation list on the left, the open thread on the
 * right, sized to the viewport so messages scroll inside it. On small screens
 * only one side shows at a time: the list on /messages, the thread on
 * /messages/[id].
 */
export function MessagesShell({
  threads,
  activeId,
  children,
}: {
  threads: ThreadSummary[];
  activeId?: string;
  children: React.ReactNode;
}) {
  const showingThread = Boolean(activeId);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="grid h-[calc(100dvh-9rem)] min-h-[30rem] overflow-hidden rounded-xl border border-line bg-surface lg:h-[calc(100dvh-14rem)] lg:grid-cols-[22rem_1fr]">
        <aside className={`${showingThread ? "hidden lg:flex" : "flex"} min-h-0 flex-col border-line lg:border-r`}>
          <div className="flex items-baseline justify-between border-b border-line px-5 py-4">
            <h1 className="text-lg font-semibold tracking-tight">Messages</h1>
            {threads.length ? <span className="text-xs text-muted">{plural(threads.length, "conversation")}</span> : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <InboxList threads={threads} activeId={activeId} />
          </div>
        </aside>
        <section className={`${showingThread ? "flex" : "hidden lg:flex"} min-h-0 min-w-0 flex-col`}>{children}</section>
      </div>
    </main>
  );
}

/** Right-hand pane on /messages before a conversation is picked (desktop only). */
export function NoThreadSelected({ hasThreads }: { hasThreads: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h9A1.5 1.5 0 0 1 16 5.5v6a1.5 1.5 0 0 1-1.5 1.5H9l-3.5 3v-3h0A1.5 1.5 0 0 1 4 11.5z" strokeLinejoin="round" />
        </svg>
      </span>
      <h2 className="mt-3 font-medium">{hasThreads ? "Pick a conversation" : "Your inbox is empty"}</h2>
      <p className="mt-1 max-w-xs text-sm text-muted">
        {hasThreads
          ? "Choose someone on the left to read and reply to your messages."
          : "Start a conversation from any project page with the “Message” button."}
      </p>
    </div>
  );
}
