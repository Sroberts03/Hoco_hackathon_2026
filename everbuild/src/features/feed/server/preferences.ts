import "server-only";
import { db } from "@/lib/supabase/admin";
import { parseSavedFilters } from "../lib/filters";
import type { SavedFeedFilters } from "../lib/types";

export type CompanyFeedContext = {
  interests: string[];
  savedFilters: SavedFeedFilters | null;
};

/** A company's interest tags and saved default filters. */
export async function getCompanyFeedContext(userId: string): Promise<CompanyFeedContext> {
  const [{ data: company }, { data: prefs }] = await Promise.all([
    db().from("company_profiles").select("interests").eq("user_id", userId).maybeSingle(),
    db().from("feed_preferences").select("filters").eq("user_id", userId).maybeSingle(),
  ]);
  return {
    interests: company?.interests ?? [],
    savedFilters: prefs ? parseSavedFilters(prefs.filters) : null,
  };
}

export async function saveFeedDefaults(userId: string, filters: SavedFeedFilters): Promise<void> {
  const { error } = await db()
    .from("feed_preferences")
    .upsert({ user_id: userId, filters, updated_at: new Date().toISOString() });
  if (error) throw new Error(`Failed to save feed defaults: ${error.message}`);
}

export async function clearFeedDefaults(userId: string): Promise<void> {
  const { error } = await db().from("feed_preferences").delete().eq("user_id", userId);
  if (error) throw new Error(`Failed to clear feed defaults: ${error.message}`);
}
