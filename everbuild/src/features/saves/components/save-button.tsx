"use client";

import { useOptimistic, useState, useTransition } from "react";
import { buttonClass } from "@/components/ui";
import { setProjectSaved } from "../server/actions";

export function SaveButton({ projectId, initialSaved }: { projectId: string; initialSaved: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [optimistic, setOptimistic] = useOptimistic(saved);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      const next = !saved;
      setOptimistic(next);
      setError(null);
      const res = await setProjectSaved(projectId, next);
      setSaved(res.saved);
      if (res.error) setError(res.error);
    });

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={optimistic}
        className={buttonClass(optimistic ? "secondary" : "primary", "md")}
      >
        <BookmarkIcon filled={optimistic} />
        {optimistic ? "Saved" : "Save project"}
      </button>
      {error ? (
        <span role="alert" className="text-xs text-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
      <path
        d="M4 2.5h8a.5.5 0 0 1 .5.5v10.6a.3.3 0 0 1-.48.24L8 10.9l-4.02 2.94a.3.3 0 0 1-.48-.24V3a.5.5 0 0 1 .5-.5Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
