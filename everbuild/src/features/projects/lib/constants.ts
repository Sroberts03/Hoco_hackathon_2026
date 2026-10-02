export const PROJECT_TYPES = {
  web_app: "Web app",
  video: "Video",
} as const;

export const PROJECT_STATUSES = {
  idea: "Idea",
  in_progress: "In progress",
  complete: "Complete",
  maintained: "Maintained",
  seeking_collaborators: "Seeking collaborators",
} as const;

export type ProjectType = keyof typeof PROJECT_TYPES;
export type ProjectStatus = keyof typeof PROJECT_STATUSES;

export function isProjectType(v: string): v is ProjectType {
  return v in PROJECT_TYPES;
}

export function isProjectStatus(v: string): v is ProjectStatus {
  return v in PROJECT_STATUSES;
}

/**
 * Publication limit: a creator may first-publish at most this many projects in
 * any rolling window. Republishing an already-published project is free.
 */
export const MAX_PROJECT_SUBMISSIONS_PER_ROLLING_SIX_MONTHS = 3;
export const PUBLICATION_WINDOW_MONTHS = 6;
