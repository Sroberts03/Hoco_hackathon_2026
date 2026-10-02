import "server-only";
import { db } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/format";
import { MAX_PROJECT_SUBMISSIONS_PER_ROLLING_SIX_MONTHS, PUBLICATION_WINDOW_MONTHS } from "../lib/constants";
import type { PublicationAllowance } from "../lib/types";

function windowStart(now = new Date()): Date {
  const d = new Date(now);
  d.setMonth(d.getMonth() - PUBLICATION_WINDOW_MONTHS);
  return d;
}

/** Slots used in the rolling window, read from the immutable ledger. */
export async function getPublicationAllowance(creatorId: string): Promise<PublicationAllowance> {
  const { data, error } = await db()
    .from("project_publications")
    .select("first_published_at")
    .eq("creator_id", creatorId)
    .gt("first_published_at", windowStart().toISOString())
    .order("first_published_at", { ascending: true });
  if (error) throw new Error(`Failed to load publication allowance: ${error.message}`);

  const max = MAX_PROJECT_SUBMISSIONS_PER_ROLLING_SIX_MONTHS;
  const used = data.length;
  let nextSlotAt: string | null = null;
  if (used >= max) {
    // The oldest submission that must expire before a slot opens.
    const freeing = new Date(data[used - max].first_published_at);
    freeing.setMonth(freeing.getMonth() + PUBLICATION_WINDOW_MONTHS);
    nextSlotAt = freeing.toISOString();
  }
  return { used, max, remaining: Math.max(0, max - used), nextSlotAt };
}

/**
 * First-publishes a draft to the active feed: checks the limit, writes the
 * ledger row, then flips the project live. Returns an error if no slot is free.
 */
export async function publishDraft(projectId: string, creatorId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const allowance = await getPublicationAllowance(creatorId);
  if (allowance.remaining === 0) {
    const when = allowance.nextSlotAt ? formatDate(allowance.nextSlotAt) : "later";
    return { ok: false, error: `You've used all ${allowance.max} publications for this six-month window. Your project was saved as a draft; you can publish it on ${when}.` };
  }

  const now = new Date().toISOString();
  const { error: ledgerError } = await db().from("project_publications").insert({
    creator_id: creatorId,
    project_id: projectId,
    first_published_at: now,
    destination: "active_feed",
  });
  // A unique violation means it was already first-published, which costs no new slot.
  if (ledgerError && ledgerError.code !== "23505") return { ok: false, error: "We couldn't publish your project. It was saved as a draft." };

  const { error } = await db()
    .from("projects")
    .update({ publication_status: "published", publication_destination: "active_feed", published_at: now, first_published_at: now })
    .eq("id", projectId)
    .is("first_published_at", null);
  if (error) return { ok: false, error: "We couldn't publish your project. It was saved as a draft." };
  return { ok: true };
}
