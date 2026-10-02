import { ALL_TAGS } from "@/features/projects/lib/taxonomy";
import { isAvailability } from "@/features/profiles/lib/constants";
import { isProjectStatus, isProjectType } from "@/features/projects/lib/constants";
import { INDUSTRIES, isIndustry } from "@/features/projects/lib/industries";
import { FRESHNESS_RANGES, SORT_MODES, type FreshnessRange, type SortMode } from "./config";
import type { FeedFilters, FeedProject, SavedFeedFilters } from "./types";

type SearchParams = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined): string[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const one = (v: string | string[] | undefined): string => (Array.isArray(v) ? (v[0] ?? "") : (v ?? "")).trim();

export const EMPTY_FILTERS: FeedFilters = {
  q: "",
  tags: [],
  types: [],
  statuses: [],
  industries: [],
  location: "",
  availability: [],
  freshness: null,
};

/** Keys that count as "the viewer chose filters", which suppresses saved defaults. */
const FILTER_KEYS = ["q", "tag", "type", "status", "industry", "location", "availability", "fresh"];

export function hasFilterParams(params: SearchParams): boolean {
  return FILTER_KEYS.some((k) => params[k] !== undefined && one(params[k]) !== "");
}

/** Parse untrusted query params into validated filters. Unknown values are dropped. */
export function parseFilters(params: SearchParams): FeedFilters {
  const fresh = one(params.fresh);
  return {
    q: one(params.q).slice(0, 200),
    tags: [...new Set(list(params.tag).filter((t) => ALL_TAGS.includes(t)))],
    types: list(params.type).filter(isProjectType),
    statuses: list(params.status).filter(isProjectStatus),
    industries: [...new Set(list(params.industry).filter(isIndustry))],
    location: one(params.location).slice(0, 100),
    availability: list(params.availability).filter(isAvailability),
    freshness: fresh in FRESHNESS_RANGES ? (fresh as FreshnessRange) : null,
  };
}

export function parseSort(params: SearchParams): SortMode {
  const s = one(params.sort);
  return s in SORT_MODES ? (s as SortMode) : "recommended";
}

/** Validate a stored filters JSON blob (shape may be stale or hand-edited). */
export function parseSavedFilters(raw: unknown): SavedFeedFilters {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  return toSavedFilters(parseFilters({
    tag: arr(r.tags),
    type: arr(r.types),
    status: arr(r.statuses),
    industry: arr(r.industries),
    location: typeof r.location === "string" ? r.location : "",
    availability: arr(r.availability),
    fresh: typeof r.freshness === "string" ? r.freshness : "",
  }));
}

/** Drop free-text search; it is never part of saved defaults. */
export function toSavedFilters(f: FeedFilters): SavedFeedFilters {
  return {
    tags: f.tags,
    types: f.types,
    statuses: f.statuses,
    industries: f.industries,
    location: f.location,
    availability: f.availability,
    freshness: f.freshness,
  };
}

/** Serialize filters (+ extras such as sort) back into a query string. */
export function filtersToSearchParams(filters: FeedFilters, extra: Record<string, string | undefined> = {}): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  filters.tags.forEach((t) => sp.append("tag", t));
  filters.types.forEach((t) => sp.append("type", t));
  filters.statuses.forEach((s) => sp.append("status", s));
  filters.industries.forEach((i) => sp.append("industry", i));
  if (filters.location) sp.set("location", filters.location);
  filters.availability.forEach((a) => sp.append("availability", a));
  if (filters.freshness) sp.set("fresh", filters.freshness);
  for (const [k, v] of Object.entries(extra)) if (v) sp.set(k, v);
  return sp;
}

export function countActiveFilters(f: FeedFilters): number {
  return (
    (f.q ? 1 : 0) +
    f.tags.length +
    f.types.length +
    f.statuses.length +
    f.industries.length +
    (f.location ? 1 : 0) +
    f.availability.length +
    (f.freshness ? 1 : 0)
  );
}

export function searchTerms(q: string): string[] {
  return q
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Hard filters. Within a group values are OR'd (any selected tag matches);
 * across groups they are AND'd. Every search term must appear in the title,
 * description, or tags.
 */
export function matchesFilters(p: FeedProject, f: FeedFilters, now: Date): boolean {
  if (f.types.length && !f.types.includes(p.type)) return false;
  if (f.statuses.length && !f.statuses.includes(p.status)) return false;
  if (f.industries.length && !(p.industry && f.industries.includes(p.industry))) return false;
  if (f.tags.length && !p.tags.some((t) => f.tags.includes(t))) return false;
  if (f.location && (p.location ?? p.owner.location) !== f.location) return false;
  if (f.availability.length && !(p.owner.availability && f.availability.includes(p.owner.availability))) return false;
  if (f.freshness && now.getTime() - p.activeSince.getTime() > Number(f.freshness) * DAY_MS) return false;

  const terms = searchTerms(f.q);
  if (terms.length) {
    const industry = p.industry ? INDUSTRIES[p.industry] : "";
    const haystack = `${p.title} ${p.description} ${p.tags.join(" ")} ${industry}`.toLowerCase();
    if (!terms.every((t) => haystack.includes(t))) return false;
  }
  return true;
}
