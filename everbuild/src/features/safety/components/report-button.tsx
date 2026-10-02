"use client";

import { useActionState } from "react";
import { Alert, buttonClass } from "@/components/ui";
import { REPORT_REASONS, type ReportTarget } from "../lib/constants";
import { submitReport, type ReportState } from "../server/actions";

/** Small disclosure with a report form. Reports are stored for moderator review. */
export function ReportButton({
  targetType,
  targetId,
  label = "Report",
  className = "",
}: {
  targetType: ReportTarget;
  targetId: string;
  label?: string;
  className?: string;
}) {
  const [state, action, pending] = useActionState<ReportState, FormData>(submitReport, {});

  return (
    <details className={`group relative ${className}`}>
      <summary className="cursor-pointer list-none text-sm text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
        {label}
      </summary>
      <div className="absolute right-0 z-10 mt-2 w-72 rounded-lg border border-line bg-surface p-4 shadow-lg">
        {state.ok ? (
          <Alert tone="notice">Thanks. We&apos;ll review this report.</Alert>
        ) : (
          <form action={action} className="space-y-3">
            <input type="hidden" name="targetType" value={targetType} />
            <input type="hidden" name="targetId" value={targetId} />
            <fieldset className="space-y-1.5">
              <legend className="mb-1 text-sm font-medium">Why are you reporting this?</legend>
              {Object.entries(REPORT_REASONS).map(([value, text], i) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="reason" value={value} defaultChecked={i === 0} className="accent-[var(--accent)]" />
                  {text}
                </label>
              ))}
            </fieldset>
            <textarea
              name="details"
              rows={2}
              maxLength={1000}
              placeholder="Details (optional)"
              className="block w-full rounded-md border border-line bg-surface px-2.5 py-2 text-sm focus:border-accent focus:outline-none"
            />
            {state.error ? <Alert tone="error">{state.error}</Alert> : null}
            <button type="submit" disabled={pending} className={buttonClass("secondary", "sm", "w-full")}>
              {pending ? "Sending…" : "Submit report"}
            </button>
          </form>
        )}
      </div>
    </details>
  );
}
