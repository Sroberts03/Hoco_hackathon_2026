import "server-only";

export type ProjectAccessFields = {
  owner_id: string;
  publication_status: "draft" | "published" | "archived";
};

/**
 * Who can open a project page:
 * - published and archived projects: anyone with the URL (unlisted ones too);
 * - drafts: only the owner and collaborators.
 */
export function canViewProject(project: ProjectAccessFields, viewerId: string | null, collaboratorIds: string[] = []): boolean {
  if (project.publication_status !== "draft") return true;
  return viewerId !== null && (viewerId === project.owner_id || collaboratorIds.includes(viewerId));
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
