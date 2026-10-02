import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase/server";
import { db } from "@/lib/supabase/admin";
import { loginUrl } from "../lib/redirects";
import type { Role, Viewer } from "../lib/types";

/** The signed-in user with their Everbuild profile, or null. Memoized per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await db()
    .from("users")
    .select("role, display_name, company_profiles(is_verified)")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  const company = profile.company_profiles as unknown as { is_verified: boolean } | null;
  return {
    id: user.id,
    email: user.email ?? "",
    role: profile.role as Role,
    displayName: profile.display_name,
    isVerifiedCompany: Boolean(company?.is_verified),
  };
});

/** Use in private pages and Server Actions. Redirects to /login if signed out. */
export async function requireViewer(next?: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(loginUrl(next));
  return viewer;
}
