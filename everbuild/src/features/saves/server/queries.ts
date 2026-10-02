import "server-only";
import { db } from "@/lib/supabase/admin";

export async function isSaved(userId: string, projectId: string): Promise<boolean> {
  const { data } = await db()
    .from("saved_projects")
    .select("project_id")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .maybeSingle();
  return Boolean(data);
}
