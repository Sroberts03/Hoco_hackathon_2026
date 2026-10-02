// Feed ranking configuration. All tuning lives here; see ./ranking.ts.
//
//   score = 0.30·relevance + 0.40·impact + 0.15·freshness + 0.15·exploration
//
// relevance   tag overlap with active filters / company interests, plus text match
// impact      log1p-scaled, age-decayed views, comments, saves, normalized within the result set
// freshness   smooth exponential decay since publication (or renewal)
// exploration stable hash of (viewer, project, week) so the order is reproducible
//             within a week but rotates over time, giving newer projects exposure

export const RANKING_WEIGHTS = {
  relevance: 0.3,
  impact: 0.4,
  freshness: 0.15,
  exploration: 0.15,
} as const;

export const IMPACT_WEIGHTS = {
  views: 0.45,
  comments: 0.3,
  saves: 0.25,
} as const;

/** Impact signals lose half their weight every N days, so old hits can't dominate forever. */
export const IMPACT_DECAY_HALF_LIFE_DAYS = 120;
/** Freshness halves every N days. */
export const FRESHNESS_HALF_LIFE_DAYS = 21;
/** The exploration hash rotates once per bucket. */
export const EXPLORATION_BUCKET_DAYS = 7;

/** Within relevance: share given to tag overlap vs. text match when both apply. */
export const RELEVANCE_TAG_SHARE = 0.6;

/** Published projects drop out of the feed (auto-archive) after this long without renewal. */
export const AUTO_ARCHIVE_AFTER_MONTHS = 6;

export const FEED_PAGE_SIZE = 24;

export const SORT_MODES = {
  recommended: "Recommended",
  newest: "Newest",
  popular: "Popular",
} as const;

export type SortMode = keyof typeof SORT_MODES;

export const FRESHNESS_RANGES = {
  "7": "Past week",
  "30": "Past month",
  "90": "Past 3 months",
  "180": "Past 6 months",
} as const;

export type FreshnessRange = keyof typeof FRESHNESS_RANGES;
