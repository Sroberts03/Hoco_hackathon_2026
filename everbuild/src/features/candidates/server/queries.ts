import "server-only";
import { db } from "@/lib/supabase/admin";
import type { Candidate, CandidateStage } from "../lib/types";

/** Insert once; saving another project never resets a creator's existing stage. */
export async function addProjectCandidate(companyId: string, projectId: string): Promise<void> {
  const { data: project, error } = await db().from("projects").select("owner_id").eq("id", projectId).single();
  if (error) throw new Error(`Failed to load candidate owner: ${error.message}`);
  const { error: insertError } = await db().from("company_candidates").upsert(
    { company_id: companyId, creator_id: project.owner_id },
    { onConflict: "company_id,creator_id", ignoreDuplicates: true },
  );
  if (insertError) throw new Error(`Failed to add candidate: ${insertError.message}`);
}

type CandidateRow = {
  creator_id: string;
  stage: CandidateStage;
  creator: { user: { display_name: string; general_location: string | null } | null; bio: string | null } | null;
};

export async function getCompanyCandidates(companyId: string): Promise<Candidate[]> {
  // Reconcile older saves and retry any candidate insertion that failed after a save.
  const { data: saves, error: savesError } = await db().from("saved_projects")
    .select("project:projects!inner(owner_id)").eq("user_id", companyId);
  if (savesError) throw new Error(`Failed to load candidate saves: ${savesError.message}`);
  const ownerIds = [...new Set((saves ?? []).map((save) =>
    (save.project as unknown as { owner_id: string }).owner_id))];
  if (ownerIds.length) {
    const { data: creators, error: creatorsError } = await db().from("creator_profiles").select("user_id").in("user_id", ownerIds);
    if (creatorsError) throw new Error(`Failed to load creators: ${creatorsError.message}`);
    if (creators?.length) {
      const { error } = await db().from("company_candidates").upsert(
        creators.map((creator) => ({ company_id: companyId, creator_id: creator.user_id })),
        { onConflict: "company_id,creator_id", ignoreDuplicates: true },
      );
      if (error) throw new Error(`Failed to sync candidates: ${error.message}`);
    }
  }

  const { data, error } = await db().from("company_candidates")
    .select("creator_id, stage, creator:creator_profiles!company_candidates_creator_id_fkey(bio, user:users!creator_profiles_user_id_fkey(display_name, general_location))")
    .eq("company_id", companyId).order("created_at", { ascending: true }).order("creator_id");
  if (error) throw new Error(`Failed to load candidates: ${error.message}`);
  return ((data ?? []) as unknown as CandidateRow[]).map((row) => ({
    id: row.creator_id,
    name: row.creator?.user?.display_name ?? "Unknown creator",
    location: row.creator?.user?.general_location ?? null,
    bio: row.creator?.bio ?? null,
    stage: row.stage,
  }));
}
