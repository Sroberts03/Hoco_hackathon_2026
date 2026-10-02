import "server-only";
import type { Viewer } from "@/features/auth/lib/types";
import { FEED_PAGE_SIZE, type SortMode } from "../lib/config";
import { EMPTY_FILTERS, hasFilterParams, matchesFilters, parseFilters, parseSort } from "../lib/filters";
import { scoreProjects, sortProjects } from "../lib/ranking";
import type { FeedFilters, RankedProject, SavedFeedFilters } from "../lib/types";
import { getCompanyFeedContext } from "./preferences";
import { archiveExpiredProjects, loadFeedCandidates } from "./queries";

type SearchParams = Record<string, string | string[] | undefined>;

export type FeedResult = {
  projects: RankedProject[];
  total: number;
  limit: number;
  filters: FeedFilters;
  sort: SortMode;
  /** True when the company's saved defaults were applied because the URL had no filters. */
  usingDefaults: boolean;
  savedDefaults: SavedFeedFilters | null;
  companyInterests: string[];
  /** Locations present in the feed, for the location filter. */
  locations: string[];
};

export async function getFeed(params: SearchParams, viewer: Viewer | null): Promise<FeedResult> {
  const now = new Date();
  await archiveExpiredProjects(now);

  const [candidates, company] = await Promise.all([
    loadFeedCandidates(),
    viewer?.role === "company" ? getCompanyFeedContext(viewer.id) : Promise.resolve(null),
  ]);

  const savedDefaults = company?.savedFilters ?? null;
  const usingDefaults = Boolean(savedDefaults) && !hasFilterParams(params) && params.defaults !== "off";
  const filters: FeedFilters = usingDefaults ? { ...EMPTY_FILTERS, ...savedDefaults } : parseFilters(params);
  const sort = parseSort(params);
  const companyInterests = company?.interests ?? [];

  const matching = candidates.filter((p) => matchesFilters(p, filters, now));
  const scored = scoreProjects(matching, {
    interestTags: [...new Set([...filters.tags, ...companyInterests])],
    query: filters.q,
    seedKey: viewer?.id ?? "anon",
    now,
  });
  const sorted = sortProjects(scored, sort);

  const requested = Number(Array.isArray(params.limit) ? params.limit[0] : params.limit);
  const limit = Number.isFinite(requested) && requested > 0 ? Math.min(requested, 500) : FEED_PAGE_SIZE;

  const locations = [...new Set(candidates.map((p) => p.location ?? p.owner.location).filter((l): l is string => !!l))].sort();

  return {
    projects: sorted.slice(0, limit),
    total: sorted.length,
    limit,
    filters,
    sort,
    usingDefaults,
    savedDefaults,
    companyInterests,
    locations,
  };
}
