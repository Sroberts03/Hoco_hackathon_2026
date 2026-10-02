import Link from "next/link";
import type { Viewer } from "@/features/auth/lib/types";
import { loginUrl } from "@/features/auth/lib/redirects";
import { MessageCreatorForm } from "@/features/messaging/components/message-creator-form";
import { ProjectCard } from "@/features/projects/components/project-card";
import { AVAILABILITY } from "../lib/constants";
import type { PublicProfile } from "../lib/types";
import { ProfileForm } from "./profile-form";

export function ProfilePage({ profile, viewer }: { profile: PublicProfile; viewer: Viewer | null }) {
  const isOwner = viewer?.id === profile.id;
  const displayRole = profile.role === "creator" ? "Creator" : "Company";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <Link href="/discover" className="text-sm text-muted hover:text-ink">
        ← Discover projects
      </Link>

      <header className="mt-5 rounded-xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <Avatar profile={profile} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted">{displayRole}</p>
              <h1 className="mt-1 flex flex-wrap items-center gap-2 text-3xl font-semibold tracking-tight">
                {profile.displayName}
                {profile.isVerified ? <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">Verified</span> : null}
              </h1>
              {profile.location ? <p className="mt-2 text-sm text-muted">{profile.location}</p> : null}
            </div>
          </div>
          {!isOwner && profile.role === "creator" ? (
            viewer ? (
              <MessageCreatorForm recipientId={profile.id} recipientName={profile.displayName} />
            ) : (
              <Link href={loginUrl(`/users/${profile.id}`)} className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover">
                Log in to message
              </Link>
            )
          ) : null}
        </div>

        <div className="mt-6 grid gap-6 border-t border-line pt-6 md:grid-cols-[1fr_18rem]">
          <div>
            {profile.bio ? <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink/90">{profile.bio}</p> : <p className="text-sm text-muted">This profile hasn’t added a bio yet.</p>}
            {profile.role === "creator" && profile.education ? (
              <p className="mt-4 text-sm text-muted">
                <span className="font-medium text-ink">Education:</span> {profile.education}
              </p>
            ) : null}
            {profile.role === "creator" && profile.availability ? (
              <span className="mt-4 inline-block rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
                {AVAILABILITY[profile.availability]}
              </span>
            ) : null}
          </div>
          <aside className="space-y-4">
            {profile.role === "company" && profile.industryTags.length ? <TagGroup label="Industries" values={profile.industryTags} /> : null}
            {profile.interests.length ? <TagGroup label={profile.role === "creator" ? "Interests" : "Company interests"} values={profile.interests} /> : null}
            {profile.links.length ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Links</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {profile.links.map((link) => (
                    <li key={`${link.label}-${link.href}`}>
                      <a href={link.href} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </header>

      {isOwner ? <div className="mt-8"><ProfileForm profile={profile} /></div> : null}

      <section className="mt-10" aria-labelledby="profile-projects-heading">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted">Public work</p>
            <h2 id="profile-projects-heading" className="mt-1 text-2xl font-semibold tracking-tight">
              {profile.role === "creator" ? "Projects" : "Projects from this company"}
            </h2>
          </div>
          <span className="text-sm text-muted">{profile.projects.length} {profile.projects.length === 1 ? "project" : "projects"}</span>
        </div>
        {profile.projects.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profile.projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={{
                  id: project.id,
                  title: project.title,
                  type: project.type,
                  status: project.status,
                  industry: null,
                  tags: [],
                  lookingFor: null,
                  coverUrl: project.coverUrl,
                  location: profile.location,
                  owner: { name: profile.displayName, location: profile.location },
                  views: project.views,
                  comments: project.comments,
                  saves: project.saves,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-line bg-surface p-6 text-sm text-muted">
            No public projects yet.
          </div>
        )}
      </section>
    </main>
  );
}

function Avatar({ profile }: { profile: PublicProfile }) {
  const initials = profile.displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return profile.avatarPath ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={profile.avatarPath} alt="" className="h-16 w-16 shrink-0 rounded-full border border-line object-cover sm:h-20 sm:w-20" />
  ) : (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xl font-semibold text-accent sm:h-20 sm:w-20" aria-hidden>
      {initials || "E"}
    </div>
  );
}

function TagGroup({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {values.map((value) => <li key={value} className="rounded bg-surface-2 px-2 py-1 text-xs text-muted">{value}</li>)}
      </ul>
    </div>
  );
}
