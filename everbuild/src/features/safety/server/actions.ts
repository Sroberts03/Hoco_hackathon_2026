"use server";

import { db } from "@/lib/supabase/admin";
import { getViewer } from "@/features/auth/server/viewer";
import { UUID_RE } from "@/features/projects/server/access";
import { MAX_REPORT_DETAILS, REPORT_REASONS, REPORT_TARGETS, type ReportTarget } from "../lib/constants";

export type ReportState = { ok?: boolean; error?: string };

/** Stores a report for moderator review. */
export async function submitReport(_prev: ReportState, formData: FormData): Promise<ReportState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Log in to report content." };

  const targetType = String(formData.get("targetType") ?? "") as ReportTarget;
  const targetId = String(formData.get("targetId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const details = String(formData.get("details") ?? "").trim().slice(0, MAX_REPORT_DETAILS);

  if (!REPORT_TARGETS.includes(targetType) || !UUID_RE.test(targetId)) return { error: "Something went wrong. Please try again." };
  if (!(reason in REPORT_REASONS)) return { error: "Choose a reason." };

  const { error } = await db().from("reports").insert({
    reporter_id: viewer.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    details: details || null,
  });
  if (error) return { error: "We couldn't submit your report. Please try again." };
  return { ok: true };
}
