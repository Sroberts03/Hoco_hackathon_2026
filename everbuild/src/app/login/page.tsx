import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/features/auth/server/viewer";
import { safeNext } from "@/features/auth/lib/redirects";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : undefined);
  if (await getViewer()) redirect(next);

  const initialError =
    params.error === "confirm" ? "That confirmation link is invalid or has expired. Try logging in or sign up again." : undefined;

  return (
    <AuthShell title="Welcome back" subtitle="Log in to save projects, comment, and message creators.">
      <LoginForm next={next} initialError={initialError} />
    </AuthShell>
  );
}
