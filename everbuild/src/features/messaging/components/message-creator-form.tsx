"use client";

import { useActionState, useState } from "react";
import { Alert, buttonClass } from "@/components/ui";
import { MAX_MESSAGE_LENGTH } from "../lib/config";
import type { MessageFormState } from "../lib/types";
import { startConversation } from "../server/actions";

/** "Message creator" button that expands into a short composer. Sends, then opens the thread. */
export function MessageCreatorForm({
  recipientId,
  recipientName,
  projectId,
  projectTitle,
}: {
  recipientId: string;
  recipientName: string;
  projectId?: string;
  projectTitle?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<MessageFormState, FormData>(startConversation, {});

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={buttonClass("secondary", "md")}>
        <MailIcon />
        Message {recipientName.split(" ")[0]}
      </button>
    );
  }

  return (
    <form action={action} className="w-full space-y-2 rounded-lg border border-line bg-surface p-4">
      <input type="hidden" name="recipientId" value={recipientId} />
      {projectId ? <input type="hidden" name="projectId" value={projectId} /> : null}
      <label htmlFor="message-body" className="block text-sm font-medium">
        {projectId && projectTitle ? (
          <>Message {recipientName} about <span className="text-accent">{projectTitle}</span></>
        ) : (
          <>Message {recipientName}</>
        )}
      </label>
      <textarea
        id="message-body"
        name="body"
        rows={4}
        required
        autoFocus
        maxLength={MAX_MESSAGE_LENGTH}
        placeholder="Introduce yourself and say what caught your eye."
        className="block w-full rounded-md border border-line bg-surface px-3 py-2.5 text-[15px] placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
      />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className={buttonClass("ghost", "sm")}>
          Cancel
        </button>
        <button type="submit" disabled={pending} className={buttonClass("primary", "sm")}>
          {pending ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="2" y="3.5" width="12" height="9" rx="1.5" />
      <path d="m2.5 4.5 5.5 4 5.5-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
