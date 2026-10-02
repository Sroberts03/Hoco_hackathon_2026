import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { ReportButton } from "@/features/safety/components/report-button";
import { profileHref, type ThreadDetail } from "../lib/types";
import { MessageList } from "./message-list";
import { ParticipantName } from "./participant-name";
import { ReplyForm } from "./reply-form";

export function ThreadView({ thread }: { thread: ThreadDetail }) {
  const { other } = thread;

  return (
    <>
      <header className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
        <Link href="/messages" className="-ml-1 rounded-md p-1 text-muted hover:bg-surface-2 hover:text-ink lg:hidden" aria-label="All messages">
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="m12 5-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <Link href={profileHref(other)} className="shrink-0" tabIndex={-1} aria-hidden>
          <Avatar name={other.name} src={other.avatarUrl} size="lg" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={profileHref(other)} className="hover:underline">
            <ParticipantName person={other} />
          </Link>
          <p className="truncate text-sm text-muted">
            {other.role === "company" ? "Company" : "Creator"}
            {thread.project ? (
              <>
                {" · about "}
                <Link href={`/projects/${thread.project.id}`} className="font-medium text-accent hover:underline">
                  {thread.project.title}
                </Link>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <Link href={profileHref(other)} className="hidden text-sm text-muted hover:text-ink sm:inline">
            View profile
          </Link>
          <ReportButton targetType="thread" targetId={thread.id} label="Report" />
        </div>
      </header>

      <MessageList key={thread.id} messages={thread.messages} other={other} />

      <div className="border-t border-line px-4 py-3 sm:px-5">
        {thread.blocked ? (
          <p className="py-2 text-center text-sm text-muted">You can&apos;t reply to this conversation.</p>
        ) : (
          <ReplyForm threadId={thread.id} recipientName={other.name} />
        )}
      </div>
    </>
  );
}
