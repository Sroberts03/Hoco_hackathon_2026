import "server-only";
import { db } from "@/lib/supabase/admin";
import type { ProjectType } from "../lib/constants";
import type { PublicationStatus } from "../lib/types";

export type OwnedProject = {
  id: string;
  title: string;
  type: ProjectType;
  publicationStatus: PublicationStatus;
  updatedAt: string;
};

/** A creator's own projects, drafts included, most recently edited first. */
export async function listOwnedProjects(ownerId: string): Promise<OwnedProject[]> {
  const { data, error } = await db()
    .from("projects")
    .select("id, title, project_type, publication_status, updated_at")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`Failed to load projects: ${error.message}`);
  return data.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.project_type,
    publicationStatus: r.publication_status,
    updatedAt: r.updated_at,
  }));
}
