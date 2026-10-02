import Link from "next/link";
import type { Viewer } from "@/features/auth/lib/types";
import { loginUrl } from "@/features/auth/lib/redirects";
import { CommentSection } from "@/features/comments/components/comment-section";
import type { ProjectComment } from "@/features/comments/lib/types";
import { MessageCreatorForm } from "@/features/messaging/components/message-creator-form";
import { AVAILABILITY } from "@/features/profiles/lib/constants";
import { SaveButton } from "@/features/saves/components/save-button";
import { ReportButton } from "@/features/safety/components/report-button";
import { buttonClass } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { PROJECT_STATUSES, PROJECT_TYPES } from "../../lib/constants";
import { INDUSTRIES } from "../../lib/industries";
import type { ProjectDetail } from "../../lib/types";
import { ProjectViewer } from "./project-viewer";
import { ViewTracker } from "./view-tracker";

type Props = {
  project: ProjectDetail;
  comments: ProjectComment[];
  viewer: Viewer | null;
  saved: boolean;
  canComment: boolean;
};

export function ProjectPage({ project, comments, viewer, saved, canComment }: Props) {
  const p = project;
  const isOwner = viewer?.id === p.owner.id;
  const isTeam = isOwner || p.collaborators.some((c) => c.id === viewer?.id);
  const activeSince = p.lastRepublishedAt ?? p.publishedAt;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <ViewTracker projectId={p.id} />

      <Link href="/discover" className="text-sm text-muted hover:text-ink">
        ← Discover
      </Link>

      <StatusBanner project={p} isTeam={isTeam} />

      <header className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-1.5 text-sm font-medium text-muted">
            {p.industry ? (
              <>
                <span className="text-ink">{INDUSTRIES[p.industry]}</span>
                <span aria-hidden>·</span>
              </>
            ) : null}
            <span>{PROJECT_TYPES[p.type]}</span>
            <span aria-hidden>·</span>
            <span className={p.status === "seeking_collaborators" ? "text-accent" : undefined}>{PROJECT_STATUSES[p.status]}</span>
          </p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight sm:text-4xl">{p.title}</h1>
          <p className="mt-2 text-[15px] text-muted">
            By <Link href={`/users/${p.owner.id}`} className="font-medium text-ink hover:underline">{p.owner.name}</Link>
            {p.collaborators.length ? <> with {p.collaborators.map((c) => c.name).join(", ")}</> : null}
            {activeSince ? <> · {formatDate(activeSince)}</> : null}
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-2">
          {viewer ? (
            <>
              <SaveButton projectId={p.id} initialSaved={saved} />
              {!isOwner && p.publicationStatus !== "draft" ? (
                <MessageCreatorForm recipientId={p.owner.id} recipientName={p.owner.name} projectId={p.id} projectTitle={p.title} />
              ) : null}
            </>
          ) : (
            <>
              <Link href={loginUrl(`/projects/${p.id}`)} className={buttonClass("primary", "md")}>
                Log in to save
              </Link>
              <Link href={loginUrl(`/projects/${p.id}`)} className={buttonClass("secondary", "md")}>
                Log in to message {p.owner.name.split(" ")[0]}
              </Link>
            </>
          )}
        </div>
      </header>

      <div className="mt-6">
        <ProjectViewer
          title={p.title}
          type={p.type}
          hostedAppUrl={p.media.hostedAppUrl}
          videoUrl={p.media.videoUrl}
          posterUrl={p.media.posterUrl}
        />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="about-heading">
            <h2 id="about-heading" className="text-lg font-semibold">
              About this project
            </h2>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink/90">
              {p.description || "No description yet."}
            </p>
            {p.lookingFor ? (
              <div className="mt-5 rounded-lg border border-accent/30 bg-accent-soft px-4 py-3">
                <p className="text-sm font-medium text-accent">Looking for</p>
                <p className="mt-1 text-[15px]">{p.lookingFor}</p>
              </div>
            ) : null}
          </section>

          <CommentSection projectId={p.id} ownerId={p.owner.id} comments={comments} viewer={viewer} canComment={canComment} />
        </div>

        <aside className="space-y-6">
          <SidebarCard title="Creator">
            <Link href={`/users/${p.owner.id}`} className="font-medium hover:underline">{p.owner.name}</Link>
            <p className="text-sm text-muted">{[p.owner.location, p.owner.education].filter(Boolean).join(" · ")}</p>
            {p.owner.availability ? (
              <p
                className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  p.owner.availability === "not_currently_available" ? "bg-surface-2 text-muted" : "bg-accent-soft text-accent"
                }`}
              >
                {AVAILABILITY[p.owner.availability]}
              </p>
            ) : null}
            {p.owner.bio ? <p className="mt-3 text-sm leading-relaxed text-muted">{p.owner.bio}</p> : null}
          </SidebarCard>

          {p.collaborators.length ? (
            <SidebarCard title="Collaborators">
              <ul className="space-y-2.5">
                {p.collaborators.map((c) => (
                  <li key={c.id} className="text-sm">
                    <span className="font-medium">{c.name}</span>
                    {c.role ? <span className="text-muted"> · {c.role}</span> : null}
                  </li>
                ))}
              </ul>
            </SidebarCard>
          ) : null}

          {p.tags.length ? (
            <SidebarCard title="Skills and topics">
              <ul className="flex flex-wrap gap-1.5">
                {p.tags.map((t) => (
                  <li key={t.name}>
                    <Link
                      href={`/discover?tag=${encodeURIComponent(t.name)}`}
                      className="inline-block rounded bg-surface-2 px-2 py-1 text-xs text-muted hover:text-ink"
                    >
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </SidebarCard>
          ) : null}

          <SidebarCard title="Details">
            <dl className="space-y-2 text-sm">
              <Detail label="Views" value={p.stats.views.toLocaleString("en-US")} />
              <Detail label="Saves" value={p.stats.saves.toLocaleString("en-US")} />
              <Detail label="Comments" value={p.stats.comments.toLocaleString("en-US")} />
              {p.publishedAt ? <Detail label="Published" value={formatDate(p.publishedAt)} /> : null}
              {p.lastRepublishedAt ? <Detail label="Renewed" value={formatDate(p.lastRepublishedAt)} /> : null}
              {p.location ? <Detail label="Location" value={p.location} /> : null}
            </dl>
          </SidebarCard>

          {viewer && !isOwner ? (
            <div className="flex justify-end">
              <ReportButton targetType="project" targetId={p.id} label="Report project" />
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

function StatusBanner({ project, isTeam }: { project: ProjectDetail; isTeam: boolean }) {
  const messages: string[] = [];
  if (project.publicationStatus === "archived") {
    messages.push(
      `Archived${project.archivedAt ? ` on ${formatDate(project.archivedAt)}` : ""}. This project no longer appears in the main feed${
        isTeam ? "; you can renew it to bring it back" : ""
      }.`,
    );
  }
  if (project.publicationStatus === "draft") messages.push("Draft. Only you and your collaborators can see this page.");
  if (project.visibility === "unlisted" && project.publicationStatus === "published") {
    messages.push("Unlisted. Only people with the link can find this project.");
  }
  if (!messages.length) return null;

  return (
    <div role="status" className="mt-4 rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm text-ink">
      {messages.map((m) => (
        <p key={m}>{m}</p>
      ))}
    </div>
  );
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h2>
      {children}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{value}</dd>
    </div>
  );
}

