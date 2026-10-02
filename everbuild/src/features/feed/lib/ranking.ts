import {
  EXPLORATION_BUCKET_DAYS,
  FRESHNESS_HALF_LIFE_DAYS,
  IMPACT_DECAY_HALF_LIFE_DAYS,
  IMPACT_WEIGHTS,
  RANKING_WEIGHTS,
  RELEVANCE_TAG_SHARE,
  type SortMode,
} from "./config";
import { stableUnitHash } from "@/lib/hash";
import { searchTerms } from "./filters";
import type { FeedProject, RankedProject, ScoreBreakdown } from "./types";

// Deterministic, explainable ranking. Every component is in [0, 1].
// See ./config.ts for the weights and the formula.

const DAY_MS = 24 * 60 * 60 * 1000;

export type RankingContext = {
  /** Tags the viewer cares about: active tag filters plus company interests. */
  interestTags: string[];
  query: string;
  /** Viewer or company id (or "anon"); keeps the exploration order stable per viewer. */
  seedKey: string;
  now: Date;
};

export function ageInDays(p: FeedProject, now: Date): number {
  return Math.max(0, (now.getTime() - p.activeSince.getTime()) / DAY_MS);
}

const halfLife = (ageDays: number, halfLifeDays: number) => Math.pow(0.5, ageDays / halfLifeDays);

export function explorationBucket(now: Date): number {
  return Math.floor(now.getTime() / (EXPLORATION_BUCKET_DAYS * DAY_MS));
}

function relevanceScore(p: FeedProject, interestTags: string[], terms: string[]): number {
  const tagScore = interestTags.length ? p.tags.filter((t) => interestTags.includes(t)).length / interestTags.length : null;

  let textScore: number | null = null;
  if (terms.length) {
    const title = p.title.toLowerCase();
    const body = `${p.description} ${p.tags.join(" ")}`.toLowerCase();
    const hits = terms.reduce((sum, t) => sum + (title.includes(t) ? 1 : body.includes(t) ? 0.5 : 0), 0);
    textScore = hits / terms.length;
  }

  if (tagScore !== null && textScore !== null) return RELEVANCE_TAG_SHARE * tagScore + (1 - RELEVANCE_TAG_SHARE) * textScore;
  return tagScore ?? textScore ?? 0;
}

/** Score every project. Impact is normalized against the max within this result set. */
export function scoreProjects(projects: FeedProject[], ctx: RankingContext): RankedProject[] {
  const terms = searchTerms(ctx.query);
  const bucket = explorationBucket(ctx.now);

  const decayed = projects.map((p) => {
    const decay = halfLife(ageInDays(p, ctx.now), IMPACT_DECAY_HALF_LIFE_DAYS);
    return {
      views: Math.log1p(p.views) * decay,
      comments: Math.log1p(p.comments) * decay,
      saves: Math.log1p(p.saves) * decay,
    };
  });
  const max = {
    views: Math.max(0, ...decayed.map((d) => d.views)),
    comments: Math.max(0, ...decayed.map((d) => d.comments)),
    saves: Math.max(0, ...decayed.map((d) => d.saves)),
  };
  const norm = (v: number, m: number) => (m > 0 ? v / m : 0);

  return projects.map((p, i) => {
    const d = decayed[i];
    const impact =
      IMPACT_WEIGHTS.views * norm(d.views, max.views) +
      IMPACT_WEIGHTS.comments * norm(d.comments, max.comments) +
      IMPACT_WEIGHTS.saves * norm(d.saves, max.saves);
    const relevance = relevanceScore(p, ctx.interestTags, terms);
    const freshness = halfLife(ageInDays(p, ctx.now), FRESHNESS_HALF_LIFE_DAYS);
    const exploration = stableUnitHash(`${ctx.seedKey}:${p.id}:${bucket}`);

    const total =
      RANKING_WEIGHTS.relevance * relevance +
      RANKING_WEIGHTS.impact * impact +
      RANKING_WEIGHTS.freshness * freshness +
      RANKING_WEIGHTS.exploration * exploration;

    const score: ScoreBreakdown = { relevance, impact, freshness, exploration, total };
    return { ...p, score };
  });
}

/** Sort scored projects. Ties break on id so the order is fully deterministic. */
export function sortProjects(projects: RankedProject[], mode: SortMode): RankedProject[] {
  const byId = (a: RankedProject, b: RankedProject) => a.id.localeCompare(b.id);
  const sorted = [...projects];
  switch (mode) {
    case "newest":
      return sorted.sort((a, b) => b.activeSince.getTime() - a.activeSince.getTime() || byId(a, b));
    case "popular":
      return sorted.sort((a, b) => b.score.impact - a.score.impact || byId(a, b));
    default:
      return sorted.sort((a, b) => b.score.total - a.score.total || byId(a, b));
  }
}
