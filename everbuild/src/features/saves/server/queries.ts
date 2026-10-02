import "server-only";
import { db } from "@/lib/supabase/admin";
import { mediaUrl } from "@/features/media/lib/config";
import type { ProjectCardData } from "@/features/projects/components/project-card";

type SavedProjectRow = {
  project: {
    id: string;
    title: string;
    project_type: ProjectCardData["type"];
    project_status: ProjectCardData["status"];
    publication_status: "published" | "archived";
    industry: ProjectCardData["industry"];
    looking_for: string | null;
    cover_asset_id: string | null;
    general_location: string | null;
    views_count: number;
    owner: { display_name: string; general_location: string | null } | null;
    project_tags: { tags: { name: string } | null }[];
  };
};

/** Private bookmarks, newest save first; archived and unlisted projects remain available. */
export async function getSavedProjects(userId: string): Promise<(ProjectCardData & { archived: boolean })[]> {
  const { data, error } = await db()
    .from("saved_projects")
    .select(`created_at, project:projects!inner(
      id, title, project_type, project_status, publication_status, industry,
      looking_for, cover_asset_id, general_location, views_count,
      owner:users!projects_owner_id_fkey(display_name, general_location),
      project_tags(tags(name))
    )`)
    .eq("user_id", userId)
    .in("project.publication_status", ["published", "archived"])
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load saved projects: ${error.message}`);

  const rows = (data ?? []) as unknown as SavedProjectRow[];
  if (!rows.length) return [];
  const { data: engagement, error: engagementError } = await db()
    .from("project_engagement")
    .select("project_id, comment_count, save_count")
    .in("project_id", rows.map(({ project }) => project.id));
  if (engagementError) throw new Error(`Failed to load saved project engagement: ${engagementError.message}`);
  const counts = new Map((engagement ?? []).map((row) => [row.project_id, row]));

  return rows.map(({ project }) => ({
    id: project.id,
    title: project.title,
    type: project.project_type,
    status: project.project_status,
    archived: project.publication_status === "archived",
    industry: project.industry,
    tags: project.project_tags.flatMap(({ tags }) => tags ? [tags.name] : []),
    lookingFor: project.looking_for,
    coverUrl: project.cover_asset_id ? mediaUrl(project.cover_asset_id) : null,
    location: project.general_location,
    owner: { name: project.owner?.display_name ?? "Unknown creator", location: project.owner?.general_location ?? null },
    views: project.views_count,
    comments: counts.get(project.id)?.comment_count ?? 0,
    saves: counts.get(project.id)?.save_count ?? 0,
  }));
}

export async function isSaved(userId: string, projectId: string): Promise<boolean> {
  const { data } = await db()
    .from("saved_projects")
    .select("project_id")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .maybeSingle();
  return Boolean(data);
}
