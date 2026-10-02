import type { Metadata } from "next";
import Link from "next/link";
import { requireViewer } from "@/features/auth/server/viewer";
import { buttonClass } from "@/components/ui";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const viewer = await requireViewer("/dashboard");
  const isCompany = viewer.role === "company";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm text-muted">{isCompany ? "Company account" : "Creator account"}</p>
      <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight">
        {viewer.displayName}
        {isCompany && viewer.isVerifiedCompany ? (
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">Verified</span>
        ) : null}
      </h1>
      <p className="mt-1 text-sm text-muted">{viewer.email}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={`/users/${viewer.id}`} className={buttonClass("primary", "sm")}>
          View profile
        </Link>
      </div>

      <section className="mt-8 rounded-xl border border-dashed border-line bg-surface p-6">
        <h2 className="font-medium">{isCompany ? "Your saved projects" : "Your projects"}</h2>
        <p className="mt-1 text-sm text-muted">
          {isCompany
            ? "Projects you save while browsing will show up here."
            : "Projects you publish will show up here. You can first-publish up to three projects in any six-month window."}
        </p>
      </section>
    </main>
  );
}
