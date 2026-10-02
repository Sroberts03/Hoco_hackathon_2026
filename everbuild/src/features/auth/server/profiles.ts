import "server-only";
import { db } from "@/lib/supabase/admin";
import type { Role } from "../lib/types";

/**
 * Creates the Everbuild profile rows for a freshly signed-up auth user.
 * If anything fails, the auth user is deleted so the email can be reused.
 */
export async function createProfileForNewUser(userId: string, role: Role, name: string): Promise<boolean> {
  const { error: userErr } = await db().from("users").insert({ id: userId, role, display_name: name });

  const { error: profileErr } = userErr
    ? { error: userErr }
    : role === "company"
      ? await db().from("company_profiles").insert({ user_id: userId, company_name: name })
      : await db().from("creator_profiles").insert({ user_id: userId });

  if (userErr || profileErr) {
    console.error("Profile creation failed", userErr ?? profileErr);
    await db().auth.admin.deleteUser(userId);
    return false;
  }
  return true;
}
