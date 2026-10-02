import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createAuthClient } from "@/lib/supabase/server";
import { safeNext } from "../lib/redirects";

/**
 * Handles Supabase email confirmation links.
 * Supports both the PKCE `code` flow and the `token_hash` email-template flow.
 */
export async function handleEmailConfirmation(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createAuthClient();
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("Missing confirmation token") };

  return NextResponse.redirect(error ? `${origin}/login?error=confirm` : `${origin}${next}`);
}
