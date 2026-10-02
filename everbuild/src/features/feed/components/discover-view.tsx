import Link from "next/link";
import type { Viewer } from "@/features/auth/lib/types";
import { ProjectCard } from "@/features/projects/components/project-card";
import { NewProjectButton } from "@/features/projects/components/new-project/new-project-button";
import type { PublicationAllowance } from "@/features/projects/lib/types";
import { buttonClass } from "@/components/ui";
import { FEED_PAGE_SIZE, type SortMode } from "../lib/config";
import { countActiveFilters, filtersToSearchParams } from "../lib/filters";
import type { FeedResult } from "../server/feed";
import { DefaultsBar } from "./defaults-bar";
import { FilterPanel } from "./filter-panel";
import { ScoreDetails } from "./score-details";
import { SortTabs } from "./sort-tabs";

export function DiscoverView({
  feed,
  viewer,
  allowance,
  explain,
}: {
  feed: FeedResult;
  viewer: Viewer | null;
  /** Present for creators, who get the "New project" button. */
  allowance: PublicationAllowance | null;
  explain: boolean;
}) {
  const { filters, sort, usingDefaults, savedDefaults } = feed;
  const hasSavedDefaults = Boolean(savedDefaults);
  const activeCount = countActiveFilters(filters);

  // While defaults are in effect, links keep the URL filter-free so defaults stay applied.
  const filterQuery = usingDefaults ? new URLSearchParams() : filtersToSearchParams(filters);
  const href = (extra: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(filterQuery);
    if (hasSavedDefaults && !usingDefaults) sp.set("defaults", "off");
    for (const [k, v] of Object.entries(extra)) if (v) sp.set(k, v);
    const s = sp.toString();
    return s ? `/discover?${s}` : "/discover";
  };
  const current = {
    sort: sort === "recommended" ? undefined : sort,
    explain: explain ? "1" : undefined,
  };
  const highlightTags = [...new Set([...filters.tags, ...feed.companyInterests])];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Discover projects</h1>
          <p className="text-sm text-muted">
            Real work, running right here. {viewer ? null : "Browse freely, and sign in to save projects or contact creators."}
          </p>
        </div>
        {allowance ? <NewProjectButton allowance={allowance} /> : null}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
          <FilterPanel
            key={filterQuery.toString() + String(usingDefaults)}
            filters={filters}
            sort={sort}
            locations={feed.locations}
            activeCount={activeCount}
            hasSavedDefaults={hasSavedDefaults}
          />
        </aside>

        <section aria-label="Projects" className="min-w-0 space-y-5">
          {viewer?.role === "company" ? (
            <DefaultsBar
              usingDefaults={usingDefaults}
              hasSavedDefaults={hasSavedDefaults}
              activeCount={activeCount}
              query={filtersToSearchParams(filters).toString()}
              companyInterests={feed.companyInterests}
            />
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted" aria-live="polite">
              <span className="font-medium text-ink">{feed.total}</span> {feed.total === 1 ? "project" : "projects"}
            </p>
            <div className="flex items-center gap-3">
              {sort === "recommended" ? (
                <Link
                  href={href({ ...current, explain: explain ? undefined : "1" })}
                  scroll={false}
                  className="text-sm text-muted hover:text-ink"
                >
                  {explain ? "Hide ranking details" : "Why this order?"}
                </Link>
              ) : null}
              <SortTabs current={sort} hrefFor={(mode: SortMode) => href({ ...current, sort: mode === "recommended" ? undefined : mode })} />
            </div>
          </div>

          {feed.projects.length ? (
            <>
              <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {feed.projects.map((p, i) => (
                  <li key={p.id} className="flex">
                    <div className="flex w-full flex-col [&>article]:flex-1">
                      <ProjectCard project={p} highlightTags={highlightTags}>
                        {explain && sort === "recommended" ? <ScoreDetails score={p.score} rank={i + 1} /> : null}
                      </ProjectCard>
                    </div>
                  </li>
                ))}
              </ul>
              {feed.total > feed.limit ? (
                <div className="flex justify-center pt-2">
                  <Link href={href({ ...current, limit: String(feed.limit + FEED_PAGE_SIZE) })} scroll={false} className={buttonClass("secondary", "md")}>
                    Show more projects
                  </Link>
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState hasFilters={activeCount > 0} clearHref={hasSavedDefaults ? "/discover?defaults=off" : "/discover"} />
          )}
        </section>
      </div>
    </main>
  );
}

function EmptyState({ hasFilters, clearHref }: { hasFilters: boolean; clearHref: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-14 text-center">
      <h2 className="font-medium">{hasFilters ? "No projects match these filters" : "No projects published yet"}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
        {hasFilters
          ? "Try removing a filter or two. Tag filters match projects with any of the selected tags."
          : "Published projects will show up here."}
      </p>
      {hasFilters ? (
        <Link href={clearHref} className={buttonClass("secondary", "sm", "mt-5")}>
          Clear all filters
        </Link>
      ) : null}
    </div>
  );
}
