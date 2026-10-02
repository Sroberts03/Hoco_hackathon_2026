"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/features/auth/server/viewer";
import { UUID_RE } from "@/features/projects/server/access";
import { db } from "@/lib/supabase/admin";
import { isCandidateStage } from "../lib/types";

export async function moveCandidate(creatorId: string, stage: string): Promise<{ error?: string }> {
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "company") return { error: "Log in as a company to move candidates." };
  if (!UUID_RE.test(creatorId) || !isCandidateStage(stage)) return { error: "Invalid candidate or stage." };
  const { data, error } = await db().from("company_candidates")
    .update({ stage }).eq("company_id", viewer.id).eq("creator_id", creatorId).select("creator_id").maybeSingle();
  if (error || !data) return { error: "Couldn't move this candidate. Try again." };
  revalidatePath("/dashboard");
  return {};
}
