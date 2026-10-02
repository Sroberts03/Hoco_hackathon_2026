import type { Availability } from "@/features/profiles/lib/constants";
import type { ProjectStatus, ProjectType } from "./constants";
import type { Industry } from "./industries";

export type PublicationStatus = "draft" | "published" | "archived";

export type ProjectPerson = {
  id: string;
  name: string;
  location: string | null;
};

export type ProjectDetail = {
  id: string;
  title: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  industry: Industry | null;
  publicationStatus: PublicationStatus;
  visibility: "public" | "unlisted";
  lookingFor: string | null;
  location: string | null;
  publishedAt: string | null;
  lastRepublishedAt: string | null;
  archivedAt: string | null;
  tags: { name: string; category: string }[];
  owner: ProjectPerson & {
    bio: string | null;
    education: string | null;
    availability: Availability | null;
  };
  collaborators: (ProjectPerson & { role: string | null })[];
  media: {
    /** Present for web apps that have an uploaded bundle. */
    hostedAppUrl: string | null;
    /** Canonical "owner/repo[/tree/ref/path]" for web apps run from GitHub via StackBlitz. */
    githubRepo: string | null;
    videoUrl: string | null;
    posterUrl: string | null;
    coverUrl: string | null;
  };
  stats: { views: number; comments: number; saves: number };
};
