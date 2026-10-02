import type { Availability } from "./constants";
import type { Role } from "@/features/auth/lib/types";

export type ProfileLink = {
  label: string;
  href: string;
};

export type PublicProfile = {
  id: string;
  role: Role;
  displayName: string;
  avatarUrl: string | null;
  location: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  bio: string | null;
  interests: string[];
  education: string | null;
  availability: Availability | null;
  links: ProfileLink[];
  companyName: string | null;
  industryTags: string[];
  website: string | null;
  isVerified: boolean;
  projects: ProfileProject[];
};

export type ProfileProject = {
  id: string;
  title: string;
  description: string;
  type: "web_app" | "video";
  status: "idea" | "in_progress" | "complete" | "maintained" | "seeking_collaborators";
  coverUrl: string | null;
  views: number;
  comments: number;
  saves: number;
};

export type ProfileFormState = {
  error?: string;
  notice?: string;
  fields?: Record<string, string>;
};
