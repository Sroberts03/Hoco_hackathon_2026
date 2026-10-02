import "server-only";
import { db } from "@/lib/supabase/admin";
import { VIEW_DEBOUNCE_MINUTES } from "../lib/views";

/**
 * Counts a "meaningful" view: one per viewer (user id or anonymous session)
 * per project per debounce window. Owners viewing their own work don't count.
 * Individual viewer identities are never exposed.
 */
export async function recordView(projectId: string, viewerKey: string, ownerId: string): Promise<boolean> {
  if (viewerKey === ownerId) return false;

  const since = new Date(Date.now() - VIEW_DEBOUNCE_MINUTES * 60_000).toISOString();
  const { data: recent } = await db()
    .from("project_views")
    .select("id")
    .eq("project_id", projectId)
    .eq("viewer_key", viewerKey)
    .gte("viewed_at", since)
    .limit(1);
  if (recent?.length) return false;

  const { error } = await db().from("project_views").insert({ project_id: projectId, viewer_key: viewerKey });
  if (error) return false;

  // Read-modify-write is fine at MVP scale; views_count is the debounced total used by ranking.
  const { data: p } = await db().from("projects").select("views_count").eq("id", projectId).single();
  if (p) await db().from("projects").update({ views_count: p.views_count + 1 }).eq("id", projectId);
  return true;
}
