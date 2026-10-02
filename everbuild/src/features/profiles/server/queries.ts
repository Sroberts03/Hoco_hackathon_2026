import "server-only";
import { cache } from "react";
import { db } from "@/lib/supabase/admin";
import { mediaUrl } from "@/features/media/lib/config";
import { UUID_RE } from "@/features/projects/server/access";
import type { Availability } from "../lib/constants";
import type { PublicProfile, ProfileLink, ProfileProject } from "../lib/types";

type Row = {
  id: string;
  role: "creator" | "company";
  display_name: string;
  avatar_path: string | null;
  general_location: string | null;
  creator_profiles: {
    bio: string | null;
    interests: string[];
    education: string | null;
    availability: Availability;
    links: Record<string, unknown>;
  } | null;
  company_profiles: {
    company_name: string;
    description: string | null;
    industry_tags: string[];
    interests: string[];
    website: string | null;
    links: Record<string, unknown>;
    is_verified: boolean;
  } | null;
};

type ProjectRow = {
  id: string;
  title: string;
  description: string;
  project_type: ProfileProject["type"];
  project_status: ProfileProject["status"];
  views_count: number;
  cover_asset_id: string | null;
};

function linksFromJson(value: Record<string, unknown> | null | undefined): ProfileLink[] {
  if (!value) return [];
  return Object.entries(value)
    .filter(([, href]) => typeof href === "string" && href.length > 0)
    .map(([label, href]) => ({ label, href: href as string }));
}

export const getPublicProfile = cache(async (id: string): Promise<PublicProfile | null> => {
  if (!UUID_RE.test(id)) return null;

  const { data, error } = await db()
    .from("users")
    .select(
      `id, role, display_name, avatar_path, general_location,
       creator_profiles(bio, interests, education, availability, links),
       company_profiles(company_name, description, industry_tags, interests, website, links, is_verified)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load profile: ${error.message}`);
  if (!data) return null;

  const profile = data as unknown as Row;
  const creator = profile.creator_profiles;
  const company = profile.company_profiles;
  const { data: projectRows, error: projectError } = await db()
    .from("projects")
    .select("id, title, description, project_type, project_status, views_count, cover_asset_id")
    .eq("owner_id", id)
    .eq("publication_status", "published")
    .eq("visibility", "public")
    .order("published_at", { ascending: false });
  if (projectError) throw new Error(`Failed to load profile projects: ${projectError.message}`);

  const projects = (projectRows ?? []) as unknown as ProjectRow[];
  const projectIds = projects.map((project) => project.id);
  const counts = new Map<string, { comments: number; saves: number }>();
  if (projectIds.length) {
    const { data: engagement, error: engagementError } = await db()
      .from("project_engagement")
      .select("project_id, comment_count, save_count")
      .in("project_id", projectIds);
    if (engagementError) throw new Error(`Failed to load profile project engagement: ${engagementError.message}`);
    for (const row of engagement ?? []) {
      counts.set(row.project_id, { comments: row.comment_count, saves: row.save_count });
    }
  }

  return {
    id: profile.id,
    role: profile.role,
    displayName: profile.display_name,
    avatarPath: profile.avatar_path,
    location: profile.general_location,
    bio: creator?.bio ?? company?.description ?? null,
    interests: creator?.interests ?? company?.interests ?? [],
    education: creator?.education ?? null,
    availability: creator?.availability ?? null,
    links: [
      ...(company?.website ? [{ label: "Website", href: company.website }] : []),
      ...linksFromJson(creator?.links),
      ...linksFromJson(company?.links),
    ],
    companyName: company?.company_name ?? null,
    industryTags: company?.industry_tags ?? [],
    website: company?.website ?? null,
    isVerified: Boolean(company?.is_verified),
    projects: projects.map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description,
      type: project.project_type,
      status: project.project_status,
      coverUrl: project.cover_asset_id ? mediaUrl(project.cover_asset_id) : null,
      views: project.views_count,
      comments: counts.get(project.id)?.comments ?? 0,
      saves: counts.get(project.id)?.saves ?? 0,
    })),
  };
});
