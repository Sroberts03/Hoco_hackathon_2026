import "server-only";
import { db } from "@/lib/supabase/admin";
import type { ProjectComment } from "../lib/types";

type Row = {
  id: string;
  body: string;
  created_at: string;
  hidden_at: string | null;
  author: {
    id: string;
    display_name: string;
    role: "creator" | "company";
    company_profiles: { is_verified: boolean } | null;
  } | null;
};

/**
 * Comments in chronological order. Deleted comments are never returned.
 * Hidden comments are only shown to the project owner and the comment's author.
 */
export async function listProjectComments(projectId: string, viewerId: string | null, ownerId: string): Promise<ProjectComment[]> {
  const { data, error } = await db()
    .from("comments")
    .select("id, body, created_at, hidden_at, author:users!comments_author_id_fkey(id, display_name, role, company_profiles(is_verified))")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Failed to load comments: ${error.message}`);

  return ((data ?? []) as unknown as Row[])
    .filter((c) => c.author)
    .filter((c) => !c.hidden_at || viewerId === ownerId || viewerId === c.author!.id)
    .map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.created_at,
      hidden: Boolean(c.hidden_at),
      author: {
        id: c.author!.id,
        name: c.author!.display_name,
        role: c.author!.role,
        isVerifiedCompany: Boolean(c.author!.company_profiles?.is_verified),
      },
    }));
}
