import Link from "next/link";
import { ReportButton } from "@/features/safety/components/report-button";
import { formatDate, formatRelative } from "@/lib/format";
import { deleteMessage } from "../server/actions";
import type { ThreadDetail } from "../lib/types";
import { ParticipantName } from "./participant-name";
import { ReplyForm } from "./reply-form";

export function ThreadView({ thread }: { thread: ThreadDetail }) {
  return (
    <div className="flex flex-col rounded-xl border border-line bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <ParticipantName person={thread.other} />
          {thread.project ? (
            <p className="mt-0.5 text-sm text-muted">
              About{" "}
              <Link href={`/projects/${thread.project.id}`} className="font-medium text-accent hover:underline">
                {thread.project.title}
              </Link>
            </p>
          ) : null}
        </div>
        <ReportButton targetType="thread" targetId={thread.id} label="Report conversation" />
      </header>

      <ol className="space-y-4 px-5 py-5">
        {thread.messages.map((m) => (
          <li key={m.id} className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%] sm:max-w-[70%]">
              <div
                className={`rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
                  m.body === null
                    ? "border border-dashed border-line italic text-muted"
                    : m.fromMe
                      ? "bg-accent text-accent-ink"
                      : "bg-surface-2 text-ink"
                }`}
              >
                <p className="whitespace-pre-line">{m.body ?? "Message deleted"}</p>
              </div>
              <div className={`mt-1 flex gap-3 text-xs text-muted ${m.fromMe ? "justify-end" : ""}`}>
                <time dateTime={m.createdAt} title={formatDate(m.createdAt)}>
                  {m.fromMe ? "Sent" : "Received"} {formatRelative(m.createdAt)}
                </time>
                {m.fromMe && m.body !== null ? (
                  <form action={deleteMessage.bind(null, m.id)}>
                    <button type="submit" className="hover:text-danger">
                      Delete
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="border-t border-line px-5 py-4">
        {thread.blocked ? (
          <p className="text-sm text-muted">You can&apos;t reply to this conversation.</p>
        ) : (
          <ReplyForm threadId={thread.id} />
        )}
      </div>
    </div>
  );
}
