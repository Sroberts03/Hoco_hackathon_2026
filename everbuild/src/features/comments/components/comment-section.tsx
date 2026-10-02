import Link from "next/link";
import type { Viewer } from "@/features/auth/lib/types";
import { loginUrl } from "@/features/auth/lib/redirects";
import { ReportButton } from "@/features/safety/components/report-button";
import { buttonClass } from "@/components/ui";
import { formatRelative } from "@/lib/format";
import { deleteComment, setCommentHidden } from "../server/actions";
import type { ProjectComment } from "../lib/types";
import { CommentForm } from "./comment-form";

type Props = {
  projectId: string;
  ownerId: string;
  comments: ProjectComment[];
  viewer: Viewer | null;
  canComment: boolean;
};

export function CommentSection({ projectId, ownerId, comments, viewer, canComment }: Props) {
  const isOwner = viewer?.id === ownerId;

  return (
    <section aria-labelledby="comments-heading" className="space-y-5">
      <h2 id="comments-heading" className="text-lg font-semibold">
        Comments <span className="font-normal text-muted">({comments.filter((c) => !c.hidden).length})</span>
      </h2>

      {comments.length ? (
        <ol className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className={`rounded-lg border border-line bg-surface p-4 ${c.hidden ? "opacity-70" : ""}`}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="font-medium">{c.author.name}</span>
                {c.author.id === ownerId ? <Badge>Creator</Badge> : null}
                {c.author.role === "company" ? <Badge>{c.author.isVerifiedCompany ? "Verified company" : "Company"}</Badge> : null}
                <span className="text-muted">· {formatRelative(c.createdAt)}</span>
                {c.hidden ? <span className="text-xs font-medium text-danger">Hidden by the creator</span> : null}
              </div>
              <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed">{c.body}</p>

              {viewer ? (
                <div className="mt-3 flex items-center gap-4 text-sm">
                  {viewer.id === c.author.id ? (
                    <form action={deleteComment.bind(null, c.id)}>
                      <button type="submit" className="text-muted hover:text-danger">
                        Delete
                      </button>
                    </form>
                  ) : null}
                  {isOwner && viewer.id !== c.author.id ? (
                    <form action={setCommentHidden.bind(null, c.id, !c.hidden)}>
                      <button type="submit" className="text-muted hover:text-ink">
                        {c.hidden ? "Unhide" : "Hide"}
                      </button>
                    </form>
                  ) : null}
                  {viewer.id !== c.author.id ? <ReportButton targetType="comment" targetId={c.id} /> : null}
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted">No comments yet. Be the first to share feedback.</p>
      )}

      {viewer ? (
        canComment ? (
          <CommentForm projectId={projectId} />
        ) : (
          <p className="text-sm text-muted">Comments aren&apos;t available for you on this project.</p>
        )
      ) : (
        <div className="rounded-lg border border-dashed border-line px-4 py-5 text-sm text-muted">
          <Link href={loginUrl(`/projects/${projectId}`)} className={buttonClass("secondary", "sm", "mr-3")}>
            Log in to comment
          </Link>
          Comments are open to anyone with an Everbuild account.
        </div>
      )}
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded bg-accent-soft px-1.5 py-0.5 text-xs font-medium text-accent">{children}</span>;
}
