import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getViewer } from "@/features/auth/server/viewer";
import { getProjectDetail } from "@/features/projects/server/detail";
import { ProjectPage } from "@/features/projects/components/detail/project-page";
import { listProjectComments } from "@/features/comments/server/queries";
import { isSaved } from "@/features/saves/server/queries";
import { hasBlocked } from "@/features/safety/server/blocks";

export async function generateMetadata({ params }: PageProps<"/projects/[id]">): Promise<Metadata> {
  const { id } = await params;
  const viewer = await getViewer();
  const project = await getProjectDetail(id, viewer?.id ?? null);
  if (!project) return { title: "Project not found" };
  return {
    title: project.title,
    description: project.description.slice(0, 160),
    robots: project.visibility === "unlisted" || project.publicationStatus === "draft" ? { index: false } : undefined,
  };
}

export default async function ProjectRoute({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const viewer = await getViewer();
  const project = await getProjectDetail(id, viewer?.id ?? null);
  if (!project) notFound();

  const [comments, saved, blockedByOwner] = await Promise.all([
    listProjectComments(project.id, viewer?.id ?? null, project.owner.id),
    viewer ? isSaved(viewer.id, project.id) : Promise.resolve(false),
    viewer ? hasBlocked(project.owner.id, viewer.id) : Promise.resolve(false),
  ]);

  return (
    <ProjectPage
      project={project}
      comments={comments}
      viewer={viewer}
      saved={saved}
      canComment={project.publicationStatus !== "draft" && !blockedByOwner}
    />
  );
}
