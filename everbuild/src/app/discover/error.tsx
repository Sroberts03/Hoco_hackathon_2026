"use client";

import { buttonClass } from "@/components/ui";

export default function DiscoverError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-20 text-center">
      <h1 className="text-xl font-semibold">We couldn&apos;t load projects</h1>
      <p className="mt-2 text-sm text-muted">
        Something went wrong while loading the feed. Try again in a moment.
        {error.digest ? <span className="mt-1 block font-mono text-xs">Reference: {error.digest}</span> : null}
      </p>
      <button type="button" onClick={() => retry()} className={buttonClass("secondary", "md", "mt-6")}>
        Try again
      </button>
    </main>
  );
}
