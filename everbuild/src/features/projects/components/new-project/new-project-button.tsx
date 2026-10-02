"use client";

import { useRef, useState } from "react";
import { buttonClass } from "@/components/ui";
import type { PublicationAllowance } from "../../lib/types";
import { NewProjectForm } from "./new-project-form";

/** "+ New project" button that opens the create-project modal. Creators only. */
export function NewProjectButton({ allowance, className = "" }: { allowance: PublicationAllowance; className?: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  // Bumped on each open so the form starts empty every time.
  const [session, setSession] = useState(0);

  const open = () => {
    setSession((n) => n + 1);
    dialogRef.current?.showModal();
  };
  const close = () => {
    if (!busy) dialogRef.current?.close();
  };

  return (
    <>
      <button type="button" onClick={open} className={buttonClass("primary", "md", className)}>
        <span aria-hidden className="text-lg leading-none">+</span>
        Add project
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="new-project-title"
        onCancel={(e) => {
          if (busy) e.preventDefault(); // Esc can't abandon an upload halfway
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close(); // click on the backdrop
        }}
        className="fixed inset-0 m-auto h-fit max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-xl border border-line bg-surface p-0 text-ink shadow-xl backdrop:bg-ink/50"
      >
        <div className="max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-6 py-4">
            <h2 id="new-project-title" className="text-lg font-semibold tracking-tight">
              New project
            </h2>
            <button type="button" onClick={close} disabled={busy} aria-label="Close" className={buttonClass("ghost", "sm", "-mr-2 text-muted")}>
              ✕
            </button>
          </div>
          {session > 0 ? <NewProjectForm key={session} allowance={allowance} onBusyChange={setBusy} onCancel={close} /> : null}
        </div>
      </dialog>
    </>
  );
}
