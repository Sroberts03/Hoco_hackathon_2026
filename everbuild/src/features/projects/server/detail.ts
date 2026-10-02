import "server-only";
import { cache } from "react";
import { db } from "@/lib/supabase/admin";
import { hostedAppUrl, mediaUrl } from "@/features/media/lib/config";
import type { Availability } from "@/features/profiles/lib/constants";
import type { ProjectStatus, ProjectType } from "../lib/constants";
import type { Industry } from "../lib/industries";
import type { ProjectDetail, PublicationStatus } from "../lib/types";
import { canViewProject, UUID_RE } from "./access";

type MediaRow = { id: string; media_type: string };

type Row = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  project_type: ProjectType;
  project_status: ProjectStatus;
  industry: Industry | null;
  publication_status: PublicationStatus;
  visibility: "public" | "unlisted";
  looking_for: string | null;
  general_location: string | null;
  published_at: string | null;
  last_republished_at: string | null;
  archived_at: string | null;
  cover_asset_id: string | null;
  views_count: number;
  owner: {
    id: string;
    display_name: string;
    general_location: string | null;
    creator_profiles: { bio: string | null; education: string | null; availability: Availability } | null;
  } | null;
  project_tags: { tags: { name: string; category: string } | null }[];
  project_media: MediaRow[];
  project_collaborators: {
    role: string | null;
    display_order: number;
    user: { id: string; display_name: string; general_location: string | null } | null;
  }[];
};

/**
 * Loads a project for the project page, or null if it doesn't exist or the
 * viewer may not see it (drafts are owner/collaborator only).
 */
export const getProjectDetail = cache(async (id: string, viewerId: string | null): Promise<ProjectDetail | null> => {
  if (!UUID_RE.test(id)) return null;

  const { data, error } = await db()
    .from("projects")
    .select(
      `id, owner_id, title, description, project_type, project_status, industry, publication_status, visibility,
       looking_for, general_location, published_at, last_republished_at, archived_at, cover_asset_id, views_count,
       owner:users!projects_owner_id_fkey(id, display_name, general_location, creator_profiles(bio, education, availability)),
       project_tags(tags(name, category)),
       project_media!project_media_project_id_fkey(id, media_type),
       project_collaborators(role, display_order, user:users!project_collaborators_user_id_fkey(id, display_name, general_location))`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load project: ${error.message}`);
  if (!data) return null;

  const r = data as unknown as Row;
  const collaborators = [...r.project_collaborators]
    .sort((a, b) => a.display_order - b.display_order)
    .filter((c) => c.user)
    .map((c) => ({ id: c.user!.id, name: c.user!.display_name, location: c.user!.general_location, role: c.role }));

  if (!canViewProject(r, viewerId, collaborators.map((c) => c.id))) return null;

  const { data: engagement } = await db()
    .from("project_engagement")
    .select("comment_count, save_count")
    .eq("project_id", r.id)
    .maybeSingle();

  const byType = (t: string) => r.project_media.find((m) => m.media_type === t);
  const video = byType("primary_video");
  const poster = byType("poster_image");
  const bundle = byType("web_app_bundle");
  const coverId = r.cover_asset_id ?? byType("cover_image")?.id ?? poster?.id ?? null;

  return {
    id: r.id,
    title: r.title,
    description: r.description,
    type: r.project_type,
    status: r.project_status,
    industry: r.industry,
    publicationStatus: r.publication_status,
    visibility: r.visibility,
    lookingFor: r.looking_for,
    location: r.general_location ?? r.owner?.general_location ?? null,
    publishedAt: r.published_at,
    lastRepublishedAt: r.last_republished_at,
    archivedAt: r.archived_at,
    tags: r.project_tags.map((t) => t.tags).filter((t): t is { name: string; category: string } => Boolean(t)),
    owner: {
      id: r.owner?.id ?? r.owner_id,
      name: r.owner?.display_name ?? "Unknown creator",
      location: r.owner?.general_location ?? null,
      bio: r.owner?.creator_profiles?.bio ?? null,
      education: r.owner?.creator_profiles?.education ?? null,
      availability: r.owner?.creator_profiles?.availability ?? null,
    },
    collaborators,
    media: {
      hostedAppUrl: r.project_type === "web_app" && bundle ? hostedAppUrl(r.id) : null,
      videoUrl: r.project_type === "video" && video ? mediaUrl(video.id) : null,
      posterUrl: poster ? mediaUrl(poster.id) : null,
      coverUrl: coverId ? mediaUrl(coverId) : null,
    },
    stats: {
      views: r.views_count,
      comments: engagement?.comment_count ?? 0,
      saves: engagement?.save_count ?? 0,
    },
  };
});
