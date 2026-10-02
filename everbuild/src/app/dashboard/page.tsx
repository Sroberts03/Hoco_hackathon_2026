import type { Metadata } from "next";
import Link from "next/link";
import { requireViewer } from "@/features/auth/server/viewer";
import { buttonClass } from "@/components/ui";
import { getSavedProjects } from "@/features/saves/server/queries";
import { ProjectCard } from "@/features/projects/components/project-card";
import { SaveButton } from "@/features/saves/components/save-button";
import { CandidateBoard } from "@/features/candidates/components/candidate-board";
import { getCompanyCandidates } from "@/features/candidates/server/queries";
import type { Candidate } from "@/features/candidates/lib/types";
import { NewProjectButton } from "@/features/projects/components/new-project/new-project-button";
import { PROJECT_TYPES } from "@/features/projects/lib/constants";
import { listOwnedProjects } from "@/features/projects/server/owned";
import { getPublicationAllowance } from "@/features/projects/server/publishing";
import { formatDate, formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

const PUBLICATION_LABELS = { draft: "Draft", published: "Published", archived: "Archived" } as const;

export default async function DashboardPage() {
  const viewer = await requireViewer("/dashboard");
  const isCompany = viewer.role === "company";
  const [savedProjects, allowance, projects] = await Promise.all([
    getSavedProjects(viewer.id),
    isCompany ? null : getPublicationAllowance(viewer.id),
    isCompany ? [] : listOwnedProjects(viewer.id),
  ]);
  let candidates: Candidate[] = [];
  let candidateError = false;
  if (isCompany) {
    try {
      candidates = await getCompanyCandidates(viewer.id);
    } catch (error) {
      console.error("Couldn't load candidate board", error);
      candidateError = true;
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
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
        </div>
        {allowance ? <NewProjectButton allowance={allowance} /> : null}
      </div>

      {isCompany ? (
        candidateError ? (
          <section className="mt-8 rounded-xl border border-line bg-surface p-6">
            <h2 className="font-medium">Candidate board</h2>
            <p role="alert" className="mt-1 text-sm text-danger">Couldn’t load your candidates. Please try refreshing the dashboard.</p>
          </section>
        ) : <CandidateBoard candidates={candidates} />
      ) : null}

      {!isCompany ? (
        <section className="mt-8 rounded-xl border border-line bg-surface">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-4">
            <h2 className="font-medium">Your projects</h2>
            {allowance ? (
              <p className="text-sm text-muted">
                {allowance.remaining > 0
                  ? `${allowance.remaining} of ${allowance.max} publications left in this six-month window`
                  : `All ${allowance.max} publications used${allowance.nextSlotAt ? `; next opens ${formatDate(allowance.nextSlotAt)}` : ""}`}
              </p>
            ) : null}
          </div>
          {projects.length ? (
            <ul className="divide-y divide-line">
              {projects.map((p) => (
                <li key={p.id}>
                  <Link href={`/projects/${p.id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-surface-2">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{p.title}</span>
                      <span className="text-xs text-muted">
                        {PROJECT_TYPES[p.type]} · edited {formatRelative(p.updatedAt)}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.publicationStatus === "published" ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted"
                      }`}
                    >
                      {PUBLICATION_LABELS[p.publicationStatus]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-muted">No projects yet. Use “Add project” to add your first one.</p>
          )}
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
