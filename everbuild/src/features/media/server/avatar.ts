import "server-only";
import { NextResponse } from "next/server";
import { db } from "@/lib/supabase/admin";
import { UUID_RE } from "@/features/projects/server/access";
import { signedObjectUrl } from "./storage";

export async function serveAvatar(userId: string): Promise<Response> {
  if (!UUID_RE.test(userId)) return new NextResponse("Not found", { status: 404 });

  const { data } = await db().from("users").select("avatar_path").eq("id", userId).maybeSingle();
  const path = data?.avatar_path;
  if (!path || !path.startsWith(`avatars/${userId}/`)) return new NextResponse("Not found", { status: 404 });

  const url = await signedObjectUrl(path);
  if (!url) return new NextResponse("Not found", { status: 404 });
  return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "private, max-age=300" } });
}
