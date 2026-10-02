"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireViewer } from "@/features/auth/server/viewer";
import { parseFilters, toSavedFilters } from "../lib/filters";
import { clearFeedDefaults, saveFeedDefaults } from "./preferences";

/** Save the filters currently in the URL as the company's default feed. */
export async function saveCurrentFiltersAsDefault(formData: FormData) {
  const viewer = await requireViewer("/discover");
  if (viewer.role !== "company") throw new Error("Only company accounts can save default filters.");

  const query = new URLSearchParams(String(formData.get("query") ?? ""));
  const params: Record<string, string[]> = {};
  for (const [k, v] of query) (params[k] ??= []).push(v);
  await saveFeedDefaults(viewer.id, toSavedFilters(parseFilters(params)));
  revalidatePath("/discover");
  redirect("/discover");
}

export async function clearDefaultFilters() {
  const viewer = await requireViewer("/discover");
  if (viewer.role !== "company") throw new Error("Only company accounts have default filters.");

  await clearFeedDefaults(viewer.id);
  revalidatePath("/discover");
  redirect("/discover");
}
