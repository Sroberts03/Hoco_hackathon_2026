// Rules for creating a project. Shared by the modal (instant feedback) and the
// Server Actions (authoritative), so both enforce the same limits.

import { isProjectStatus, isProjectType, type ProjectStatus, type ProjectType } from "./constants";
import { parseGitHubRepo } from "./github";
import { isIndustry, type Industry } from "./industries";
import { isCuratedTag } from "./taxonomy";

const MB = 1024 * 1024;

export const LIMITS = {
  title: 100,
  description: 5000,
  lookingFor: 300,
  tags: 8,
  /** Matches the storage bucket's per-file limit. */
  videoBytes: 100 * MB,
  bundleBytes: 50 * MB,
  bundleUnzippedBytes: 100 * MB,
  bundleFiles: 500,
  imageBytes: 5 * MB,
} as const;

export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

/** Files the browser uploads straight to storage after the draft is created. */
export type UploadSlot = "bundle" | "video" | "cover" | "poster";
export type FileInfo = { name: string; size: number; type: string };

export type NewProjectInput = {
  title: string;
  description: string;
  type: string;
  status: string;
  industry: string;
  tags: string[];
  lookingFor: string;
  /** Web apps only: "upload" a ZIP or run from "github". */
  webAppSource: string;
  githubUrl: string;
  files: Partial<Record<UploadSlot, FileInfo>>;
};

export type ValidNewProject = {
  title: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  industry: Industry | null;
  tags: string[];
  lookingFor: string | null;
  githubRepo: string | null;
  files: Partial<Record<UploadSlot, FileInfo>>;
};

const MAX_MB = (bytes: number) => `${Math.round(bytes / MB)} MB`;

/** Returns the cleaned project, or a user-facing error. */
export function validateNewProject(input: NewProjectInput): { ok: true; project: ValidNewProject } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error });

  const title = input.title.trim();
  const description = input.description.trim();
  const lookingFor = input.lookingFor.trim();
  if (!title) return fail("Give your project a title.");
  if (title.length > LIMITS.title) return fail(`Keep the title under ${LIMITS.title} characters.`);
  if (!description) return fail("Add a short description of what you built.");
  if (description.length > LIMITS.description) return fail(`Keep the description under ${LIMITS.description} characters.`);
  if (lookingFor.length > LIMITS.lookingFor) return fail(`Keep "Looking for" under ${LIMITS.lookingFor} characters.`);
  if (!isProjectType(input.type)) return fail("Choose a project type.");
  if (!isProjectStatus(input.status)) return fail("Choose a project status.");
  if (input.industry && !isIndustry(input.industry)) return fail("Choose an industry from the list.");

  const tags = [...new Set(input.tags)];
  if (!tags.length) return fail("Pick at least one tag so companies can find your project.");
  if (tags.length > LIMITS.tags) return fail(`Pick up to ${LIMITS.tags} tags.`);
  if (!tags.every(isCuratedTag)) return fail("One of the tags isn't in the list.");

  const { bundle, video, cover, poster } = input.files;
  const files: ValidNewProject["files"] = {};
  let githubRepo: string | null = null;

  if (input.type === "web_app") {
    if (input.webAppSource === "github") {
      githubRepo = parseGitHubRepo(input.githubUrl);
      if (!githubRepo) return fail("Enter a public GitHub repo URL, like https://github.com/you/your-app.");
    } else {
      if (!bundle) return fail("Upload a ZIP of your web app.");
      if (!/\.zip$/i.test(bundle.name)) return fail("The web app must be a .zip file.");
      if (bundle.size > LIMITS.bundleBytes) return fail(`The ZIP must be under ${MAX_MB(LIMITS.bundleBytes)}.`);
      files.bundle = bundle;
    }
  } else {
    if (!video) return fail("Upload an MP4 video.");
    if (video.type !== "video/mp4" && !/\.mp4$/i.test(video.name)) return fail("The video must be an MP4.");
    if (video.size > LIMITS.videoBytes) return fail(`The video must be under ${MAX_MB(LIMITS.videoBytes)}.`);
    files.video = video;
    if (poster && isImage(poster)) files.poster = poster;
  }

  if (cover) {
    if (!isImage(cover)) return fail("The cover must be a PNG, JPEG, or WebP image.");
    if (cover.size > LIMITS.imageBytes) return fail(`The cover image must be under ${MAX_MB(LIMITS.imageBytes)}.`);
    files.cover = cover;
  }

  return {
    ok: true,
    project: {
      title,
      description,
      type: input.type,
      status: input.status,
      industry: input.industry ? (input.industry as Industry) : null,
      tags,
      lookingFor: lookingFor || null,
      githubRepo,
      files,
    },
  };
}

function isImage(f: FileInfo): boolean {
  return (IMAGE_TYPES as readonly string[]).includes(f.type) && f.size <= LIMITS.imageBytes;
}
