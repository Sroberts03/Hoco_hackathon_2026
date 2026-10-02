import type { Metadata } from "next";
import Link from "next/link";
import { requireViewer } from "@/features/auth/server/viewer";
import { buttonClass } from "@/components/ui";
import { getSavedProjects } from "@/features/saves/server/queries";
import { ProjectCard } from "@/features/projects/components/project-card";
import { SaveButton } from "@/features/saves/components/save-button";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const viewer = await requireViewer("/dashboard");
  const isCompany = viewer.role === "company";
  const savedProjects = await getSavedProjects(viewer.id);

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

      {!isCompany ? (
        <section className="mt-8 rounded-xl border border-dashed border-line bg-surface p-6">
          <h2 className="font-medium">Your projects</h2>
          <p className="mt-1 text-sm text-muted">
            Projects you publish will show up here. You can first-publish up to three projects in any six-month window.
          </p>
        </section>
      ) : null}

      <section className="mt-8" aria-labelledby="saved-projects-heading">
        <h2 id="saved-projects-heading" className="font-medium">Your saved projects ({savedProjects.length})</h2>
        {savedProjects.length ? (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {savedProjects.map((project) => (
              <ProjectCard key={project.id} project={project}>
                <div className="flex flex-wrap items-center gap-3 border-t border-line p-4">
                  {project.archived ? <span className="rounded bg-surface-2 px-2 py-1 text-xs text-muted">Archived</span> : null}
                  <SaveButton projectId={project.id} initialSaved />
                </div>
              </ProjectCard>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-line bg-surface p-6">
            <p className="text-sm text-muted">You haven’t saved any projects yet.</p>
            <Link href="/discover" className={buttonClass("primary", "sm") + " mt-3"}>Discover projects</Link>
          </div>
        )}
      </section>
    </main>
  );
}
