import type { Availability } from "@/features/profiles/lib/constants";
import type { ProjectStatus, ProjectType } from "@/features/projects/lib/constants";
import type { Industry } from "@/features/projects/lib/industries";
import type { FreshnessRange } from "./config";

/** Hard filters a viewer can apply to the feed. */
export type FeedFilters = {
  q: string;
  tags: string[];
  types: ProjectType[];
  statuses: ProjectStatus[];
  industries: Industry[];
  location: string;
  availability: Availability[];
  freshness: FreshnessRange | null;
};

/** Filters that can be saved as a company's defaults (everything except free text). */
export type SavedFeedFilters = Omit<FeedFilters, "q">;

/** A published project as the feed sees it, before ranking. */
export type FeedProject = {
  id: string;
  title: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  industry: Industry | null;
  tags: string[];
  lookingFor: string | null;
  location: string | null;
  owner: {
    id: string;
    name: string;
    location: string | null;
    availability: Availability | null;
  };
  /** Most recent of published_at / last_republished_at. */
  activeSince: Date;
  views: number;
  comments: number;
  saves: number;
};

export type ScoreBreakdown = {
  relevance: number;
  impact: number;
  freshness: number;
  exploration: number;
  total: number;
};

export type RankedProject = FeedProject & { score: ScoreBreakdown };
