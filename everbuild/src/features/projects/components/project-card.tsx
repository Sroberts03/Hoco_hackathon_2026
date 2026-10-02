import Link from "next/link";
import { PROJECT_STATUSES, PROJECT_TYPES, type ProjectStatus, type ProjectType } from "../lib/constants";
import { INDUSTRIES, type Industry } from "../lib/industries";
import { ProjectCover } from "./project-cover";

export type ProjectCardData = {
  id: string;
  title: string;
  type: ProjectType;
  status: ProjectStatus;
  industry: Industry | null;
  tags: string[];
  lookingFor: string | null;
  location: string | null;
  owner: { name: string; location: string | null };
  views: number;
  comments: number;
  saves: number;
};

const MAX_TAGS = 3;

export function ProjectCard({
  project,
  highlightTags = [],
  children,
}: {
  project: ProjectCardData;
  /** Tags to emphasize, e.g. ones matching the viewer's filters or interests. */
  highlightTags?: string[];
  /** Optional extra content under the card body (e.g. ranking details). */
  children?: React.ReactNode;
}) {
  const location = project.location ?? project.owner.location;
  const tags = [...project.tags].sort((a, b) => Number(highlightTags.includes(b)) - Number(highlightTags.includes(a)));
  const extra = tags.length - MAX_TAGS;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)]">
      <Link href={`/projects/${project.id}`} className="flex flex-1 flex-col focus-visible:outline-2 focus-visible:outline-accent">
        <div className="aspect-[16/10] border-b border-line">
          <ProjectCover id={project.id} title={project.title} type={project.type} />
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted">
            {project.industry ? (
              <>
                <span className="truncate text-ink">{INDUSTRIES[project.industry]}</span>
                <span aria-hidden>·</span>
              </>
            ) : null}
            <span className="shrink-0">{PROJECT_TYPES[project.type]}</span>
            <span aria-hidden>·</span>
            <span className={`truncate ${project.status === "seeking_collaborators" ? "text-accent" : ""}`}>
              {PROJECT_STATUSES[project.status]}
            </span>
          </div>
          <h3 className="mt-1 line-clamp-2 font-semibold leading-snug text-ink group-hover:underline group-hover:decoration-line group-hover:underline-offset-4">
            {project.title}
          </h3>
          <p className="mt-1 truncate text-sm text-muted">
            {project.owner.name}
            {location ? <span className="text-muted/80"> · {location}</span> : null}
          </p>

          {tags.length ? (
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tags">
              {tags.slice(0, MAX_TAGS).map((t) => (
                <li
                  key={t}
                  className={`rounded px-1.5 py-0.5 text-xs ${
                    highlightTags.includes(t) ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted"
                  }`}
                >
                  {t}
                </li>
              ))}
              {extra > 0 ? <li className="px-1 py-0.5 text-xs text-muted">+{extra}</li> : null}
            </ul>
          ) : null}

          {project.lookingFor ? (
            <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">
              <span className="font-medium text-ink">Looking for:</span> {project.lookingFor}
            </p>
          ) : null}

          <dl className="mt-auto flex gap-4 pt-4 text-xs text-muted">
            <Stat label="views" value={project.views} />
            <Stat label="comments" value={project.comments} />
            <Stat label="saves" value={project.saves} />
          </dl>
        </div>
      </Link>
      {children}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex gap-1">
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="font-medium text-ink tabular-nums">{value.toLocaleString("en-US")}</span> {label}
      </dd>
    </div>
  );
}
