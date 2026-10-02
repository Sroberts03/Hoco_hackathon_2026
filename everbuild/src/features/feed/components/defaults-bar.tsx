import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { clearDefaultFilters, saveCurrentFiltersAsDefault } from "../server/actions";

type Props = {
  usingDefaults: boolean;
  hasSavedDefaults: boolean;
  activeCount: number;
  /** Current filter query string (without sort), used when saving. */
  query: string;
  companyInterests: string[];
};

/** Company-only controls for default feed filters. */
export function DefaultsBar({ usingDefaults, hasSavedDefaults, activeCount, query, companyInterests }: Props) {
  if (usingDefaults) {
    return (
      <Bar>
        <p>
          <span className="font-medium text-ink">Showing your default filters.</span>{" "}
          <span className="text-muted">Change anything on the left to explore beyond them.</span>
        </p>
        <div className="flex items-center gap-2">
          <Link href="/discover?defaults=off" className={buttonClass("ghost", "sm")}>
            Show all projects
          </Link>
          <form action={clearDefaultFilters}>
            <button type="submit" className={buttonClass("ghost", "sm", "text-muted")}>
              Remove defaults
            </button>
          </form>
        </div>
      </Bar>
    );
  }

  if (activeCount === 0 && !hasSavedDefaults) {
    return companyInterests.length ? (
      <Bar>
        <p className="text-muted">
          Projects matching your interests ({companyInterests.join(", ")}) rank higher. Pick filters and save them as
          your default feed.
        </p>
      </Bar>
    ) : null;
  }

  return (
    <Bar>
      <p className="text-muted">
        {activeCount ? "Want to start here every time?" : "You're viewing all projects."}
      </p>
      <div className="flex items-center gap-2">
        {hasSavedDefaults ? (
          <Link href="/discover" className={buttonClass("ghost", "sm")}>
            Back to my defaults
          </Link>
        ) : null}
        {activeCount ? (
          <form action={saveCurrentFiltersAsDefault}>
            <input type="hidden" name="query" value={query} />
            <button type="submit" className={buttonClass("secondary", "sm")}>
              {hasSavedDefaults ? "Replace my defaults" : "Save as my default feed"}
            </button>
          </form>
        ) : null}
      </div>
    </Bar>
  );
}

function Bar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-accent-soft/60 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      {children}
    </div>
  );
}
