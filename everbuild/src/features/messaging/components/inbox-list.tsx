import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { formatRelative } from "@/lib/format";
import type { ThreadSummary } from "../lib/types";
import { ParticipantName } from "./participant-name";

export function InboxList({ threads, activeId }: { threads: ThreadSummary[]; activeId?: string }) {
  if (!threads.length) {
    return (
      <div className="px-6 py-12 text-center">
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
    <ul className="divide-y divide-line">
      {threads.map((t) => {
        const active = t.id === activeId;
        return (
          <li key={t.id}>
            <Link
              href={`/messages/${t.id}`}
              aria-current={active ? "page" : undefined}
              className={`relative flex gap-3 px-5 py-3.5 transition-colors ${active ? "bg-accent-soft/60" : "hover:bg-surface-2"}`}
            >
              {active ? <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-accent" /> : null}
              <Avatar name={t.other.name} src={t.other.avatarUrl} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    <ParticipantName person={t.other} />
                  </span>
                  <span className="shrink-0 text-xs text-muted">{formatRelative(t.updatedAt)}</span>
                </div>
                {t.project ? <p className="mt-0.5 truncate text-xs font-medium text-accent">{t.project.title}</p> : null}
                {t.lastMessage ? (
                  <p className="mt-0.5 truncate text-sm text-muted">
                    {t.lastMessage.fromMe ? <span className="text-muted/80">You: </span> : null}
                    {t.lastMessage.body}
                  </p>
                ) : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
