"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui";
import { MAX_MESSAGE_LENGTH } from "../lib/config";
import type { MessageFormState } from "../lib/types";
import { sendReply } from "../server/actions";

/** Grows with the text up to this height, then scrolls. */
const MAX_HEIGHT_PX = 180;

/** Chat-style composer: Enter sends, Shift+Enter adds a line. */
export function ReplyForm({ threadId, recipientName }: { threadId: string; recipientName: string }) {
  const [state, action, pending] = useActionState<MessageFormState, FormData>(sendReply, {});
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [hasText, setHasText] = useState(false);
  const [sentAt, setSentAt] = useState(state.ok);

  // A successful send empties the box (state adjusted during render, not in an effect).
  if (state.ok !== sentAt) {
    setSentAt(state.ok);
    setHasText(false);
  }

  useEffect(() => {
    if (!state.ok) return;
    formRef.current?.reset();
    fit(inputRef.current);
    inputRef.current?.focus();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="space-y-2">
      <input type="hidden" name="threadId" value={threadId} />
      <div className="flex items-end gap-2 rounded-xl border border-line bg-surface py-1.5 pl-3.5 pr-1.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25">
        <label htmlFor="reply-body" className="sr-only">
          Reply to {recipientName}
        </label>
        <textarea
          ref={inputRef}
          id="reply-body"
          name="body"
          rows={1}
          required
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder={`Message ${recipientName.split(" ")[0]}…`}
          onInput={(e) => {
            setHasText(e.currentTarget.value.trim().length > 0);
            fit(e.currentTarget);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (hasText && !pending) e.currentTarget.form?.requestSubmit();
            }
          }}
          className="block max-h-[180px] min-h-9 flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-6 placeholder:text-muted/70 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!hasText || pending}
          aria-label="Send"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-ink transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? (
            <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          ) : (
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M3.1 2.6a.75.75 0 0 1 .82-.1l13 6.75a.75.75 0 0 1 0 1.33l-13 6.75a.75.75 0 0 1-1.05-.9L4.9 10 2.87 3.57a.75.75 0 0 1 .23-.97ZM6.2 10.75l-1.4 4.4 9.6-5.15-9.6-5.15 1.4 4.4h4.55a.75.75 0 0 1 0 1.5z" />
            </svg>
          )}
        </button>
      </div>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <p className="hidden px-1 text-[11px] text-muted sm:block">
        <kbd className="font-sans font-medium">Enter</kbd> to send · <kbd className="font-sans font-medium">Shift + Enter</kbd> for a new line
      </p>
    </form>
  );
}

function fit(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
}
