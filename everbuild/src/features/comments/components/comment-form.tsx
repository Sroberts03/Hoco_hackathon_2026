"use client";

import { useActionState, useEffect, useRef } from "react";
import { Alert, buttonClass } from "@/components/ui";
import { addComment } from "../server/actions";
import { MAX_COMMENT_LENGTH, type CommentFormState } from "../lib/types";

export function CommentForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState<CommentFormState, FormData>(addComment, {});
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the box after a successful post.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="space-y-2">
      <input type="hidden" name="projectId" value={projectId} />
      <label htmlFor="comment-body" className="sr-only">
        Add a comment
      </label>
      <textarea
        id="comment-body"
        name="body"
        rows={3}
        required
        maxLength={MAX_COMMENT_LENGTH}
        placeholder="Share feedback or ask the creator a question"
        className="block w-full rounded-md border border-line bg-surface px-3 py-2.5 text-[15px] placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
      />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={buttonClass("primary", "sm")}>
          {pending ? "Posting…" : "Post comment"}
        </button>
      </div>
    </form>
  );
}
