import Link from "next/link";
import { SORT_MODES, type SortMode } from "../lib/config";

export function SortTabs({ current, hrefFor }: { current: SortMode; hrefFor: (mode: SortMode) => string }) {
  return (
    <nav aria-label="Sort projects" className="inline-flex rounded-md border border-line bg-surface p-0.5 text-sm">
      {(Object.entries(SORT_MODES) as [SortMode, string][]).map(([mode, label]) => (
        <Link
          key={mode}
          href={hrefFor(mode)}
          scroll={false}
          aria-current={mode === current ? "page" : undefined}
          className={`rounded px-3 py-1.5 transition-colors ${
            mode === current ? "bg-surface-2 font-medium text-ink" : "text-muted hover:text-ink"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
