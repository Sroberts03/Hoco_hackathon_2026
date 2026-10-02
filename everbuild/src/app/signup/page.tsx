import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/features/auth/server/viewer";
import { safeNext } from "@/features/auth/lib/redirects";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignupForm } from "@/features/auth/components/signup-form";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : undefined);
  if (await getViewer()) redirect(next);

  return (
    <AuthShell title="Create your Everbuild account" subtitle="Anyone can publish. Companies can browse, save, and reach out.">
      <SignupForm next={next} defaultRole={params.role === "company" ? "company" : "creator"} />
    </AuthShell>
  );
}
