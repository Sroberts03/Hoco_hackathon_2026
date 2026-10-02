"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase/server";
import { safeNext } from "../lib/redirects";
import type { AuthFormState } from "../lib/types";
import { readSignIn, readSignUp, validateSignIn, validateSignUp } from "../lib/validation";
import { createProfileForNewUser } from "./profiles";

async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const input = readSignUp(formData);
  const next = safeNext(formData.get("next"));
  const fields = { role: input.role, name: input.name, email: input.email };

  const invalid = validateSignUp(input);
  if (invalid) return { error: invalid, fields };

  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${await siteOrigin()}/auth/confirm?next=${encodeURIComponent(next)}`,
      data: { display_name: input.name, role: input.role },
    },
  });

  if (error) return { error: error.message, fields };
  // Supabase returns a user with no identities when the email is already registered.
  if (!data.user || data.user.identities?.length === 0) {
    return { error: "An account with this email already exists. Try logging in.", fields };
  }

  if (!(await createProfileForNewUser(data.user.id, input.role, input.name))) {
    await supabase.auth.signOut();
    return { error: "We couldn't create your profile. Please try again.", fields };
  }

  if (!data.session) {
    return { notice: `Check ${input.email} for a confirmation link to finish signing up.`, fields };
  }
  redirect(next);
}

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const input = readSignIn(formData);
  const next = safeNext(formData.get("next"));
  const fields = { email: input.email };

  const invalid = validateSignIn(input);
  if (invalid) return { error: invalid, fields };

  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signInWithPassword(input);
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Confirm your email first. Check your inbox for the link.", fields };
    }
    return { error: "Incorrect email or password.", fields };
  }
  redirect(next);
}

export async function signOut() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/");
}
