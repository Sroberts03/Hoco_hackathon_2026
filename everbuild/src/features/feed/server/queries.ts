import "server-only";
import { db } from "@/lib/supabase/admin";
import type { Availability } from "@/features/profiles/lib/constants";
import type { ProjectStatus, ProjectType } from "@/features/projects/lib/constants";
import type { Industry } from "@/features/projects/lib/industries";
import { AUTO_ARCHIVE_AFTER_MONTHS } from "../lib/config";
import type { FeedProject } from "../lib/types";

type Row = {
  id: string;
  title: string;
  description: string;
  project_type: ProjectType;
  project_status: ProjectStatus;
  industry: Industry | null;
  looking_for: string | null;
  general_location: string | null;
  published_at: string;
  last_republished_at: string | null;
  views_count: number;
  owner: {
    id: string;
    display_name: string;
    general_location: string | null;
    creator_profiles: { availability: Availability } | null;
  } | null;
  project_tags: { tags: { name: string } | null }[];
};

/**
 * Lazy auto-archive: published projects whose latest publication/renewal is
 * older than the archive window leave the feed. Runs before each feed load so
 * it works without a scheduler. Nothing is deleted.
 */
export async function archiveExpiredProjects(now = new Date()): Promise<void> {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - AUTO_ARCHIVE_AFTER_MONTHS);
  const c = cutoff.toISOString();

  const { error } = await db()
    .from("projects")
    .update({ publication_status: "archived", archived_at: now.toISOString() })
    .eq("publication_status", "published")
    .or(`and(last_republished_at.is.null,published_at.lt.${c}),last_republished_at.lt.${c}`);
  if (error) console.error("archiveExpiredProjects failed", error);
}

/** Every project eligible for the public feed, with its engagement counts. */
export async function loadFeedCandidates(): Promise<FeedProject[]> {
  const { data, error } = await db()
    .from("projects")
    .select(
      `id, title, description, project_type, project_status, industry, looking_for, general_location,
       published_at, last_republished_at, views_count,
       owner:users!projects_owner_id_fkey(id, display_name, general_location, creator_profiles(availability)),
       project_tags(tags(name))`,
    )
    .eq("publication_status", "published")
    .eq("publication_destination", "active_feed")
    .eq("visibility", "public")
    .not("published_at", "is", null);

  if (error) throw new Error(`Failed to load feed: ${error.message}`);
  const rows = (data ?? []) as unknown as Row[];

  const ids = rows.map((r) => r.id);
  const counts = new Map<string, { comments: number; saves: number }>();
  if (ids.length) {
    const { data: engagement, error: engErr } = await db()
      .from("project_engagement")
      .select("project_id, comment_count, save_count")
      .in("project_id", ids);
    if (engErr) throw new Error(`Failed to load engagement: ${engErr.message}`);
    for (const e of engagement ?? []) counts.set(e.project_id, { comments: e.comment_count, saves: e.save_count });
  }

  return rows.map((r) => {
    const activeSince = new Date(r.last_republished_at ?? r.published_at);
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      type: r.project_type,
      status: r.project_status,
      industry: r.industry,
      tags: r.project_tags.map((pt) => pt.tags?.name).filter((n): n is string => Boolean(n)),
      lookingFor: r.looking_for,
      location: r.general_location,
      owner: {
        id: r.owner?.id ?? "",
        name: r.owner?.display_name ?? "Unknown creator",
        location: r.owner?.general_location ?? null,
        availability: r.owner?.creator_profiles?.availability ?? null,
      },
      activeSince,
      views: r.views_count,
      comments: counts.get(r.id)?.comments ?? 0,
      saves: counts.get(r.id)?.saves ?? 0,
    };
  });
}
