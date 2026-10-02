import Link from "next/link";
import { formatRelative } from "@/lib/format";
import type { ThreadSummary } from "../lib/types";
import { ParticipantName } from "./participant-name";

export function InboxList({ threads, activeId }: { threads: ThreadSummary[]; activeId?: string }) {
  if (!threads.length) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center">
        <h2 className="font-medium">No conversations yet</h2>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
          Messages you send or receive about projects will show up here.
        </p>
        <Link href="/discover" className="mt-4 inline-block text-sm font-medium text-accent hover:underline">
          Browse projects
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {threads.map((t) => (
        <li key={t.id}>
          <Link
            href={`/messages/${t.id}`}
            aria-current={t.id === activeId ? "page" : undefined}
            className={`block px-4 py-3.5 transition-colors hover:bg-surface-2 ${t.id === activeId ? "bg-surface-2" : ""}`}
          >
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <ParticipantName person={t.other} />
              <span className="shrink-0 text-xs text-muted">{formatRelative(t.updatedAt)}</span>
            </div>
            {t.project ? <p className="mt-0.5 truncate text-xs text-accent">Re: {t.project.title}</p> : null}
            {t.lastMessage ? (
              <p className="mt-1 truncate text-sm text-muted">
                {t.lastMessage.fromMe ? "You: " : ""}
                {t.lastMessage.body}
              </p>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
