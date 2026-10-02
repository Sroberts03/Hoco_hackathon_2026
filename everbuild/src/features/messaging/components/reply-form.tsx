"use client";

import { useActionState, useEffect, useRef } from "react";
import { Alert, buttonClass } from "@/components/ui";
import { MAX_MESSAGE_LENGTH } from "../lib/config";
import type { MessageFormState } from "../lib/types";
import { sendReply } from "../server/actions";

export function ReplyForm({ threadId }: { threadId: string }) {
  const [state, action, pending] = useActionState<MessageFormState, FormData>(sendReply, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="space-y-2">
      <input type="hidden" name="threadId" value={threadId} />
      <label htmlFor="reply-body" className="sr-only">
        Reply
      </label>
      <textarea
        id="reply-body"
        name="body"
        rows={3}
        required
        maxLength={MAX_MESSAGE_LENGTH}
        placeholder="Write a reply"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
        }}
        className="block w-full rounded-md border border-line bg-surface px-3 py-2.5 text-[15px] placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
      />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">⌘/Ctrl + Enter to send</span>
        <button type="submit" disabled={pending} className={buttonClass("primary", "sm")}>
          {pending ? "Sending…" : "Send"}
        </button>
      </div>
    </form>
  );
}
