"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/features/auth/server/viewer";
import { db } from "@/lib/supabase/admin";
import { isAvailability } from "../lib/constants";
import type { ProfileFormState } from "../lib/types";

const MAX = {
  displayName: 100,
  avatarPath: 500,
  location: 120,
  bio: 1000,
  education: 200,
  website: 500,
  link: 500,
  tag: 50,
};

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function listField(formData: FormData, name: string) {
  return [...new Set(field(formData, name).split(",").map((value) => value.trim()).filter(Boolean))];
}

function validUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function formFields(formData: FormData) {
  return {
    displayName: field(formData, "displayName"),
    avatarPath: field(formData, "avatarPath"),
    location: field(formData, "location"),
    bio: field(formData, "bio"),
    interests: field(formData, "interests"),
    education: field(formData, "education"),
    availability: field(formData, "availability"),
    website: field(formData, "website"),
    linkedin: field(formData, "linkedin"),
    github: field(formData, "github"),
    otherLink: field(formData, "otherLink"),
    industryTags: field(formData, "industryTags"),
  };
}

export async function updateProfile(_previous: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Log in to update your profile." };

  const values = formFields(formData);
  const fields = Object.fromEntries(Object.entries(values));
  if (values.displayName.length < 2) return { error: "Enter a name with at least two characters.", fields };
  if (!isAvailability(values.availability) && viewer.role === "creator") {
    return { error: "Choose a valid availability option.", fields };
  }

  const lengths: [string, string, number][] = [
    ["Name", values.displayName, MAX.displayName],
    ["Avatar URL", values.avatarPath, MAX.avatarPath],
    ["Location", values.location, MAX.location],
    ["Bio", values.bio, MAX.bio],
    ["Education", values.education, MAX.education],
    ["Website", values.website, MAX.website],
    ["LinkedIn URL", values.linkedin, MAX.link],
    ["GitHub URL", values.github, MAX.link],
    ["Other link", values.otherLink, MAX.link],
  ];
  const tooLong = lengths.find(([, value, limit]) => value.length > limit);
  if (tooLong) return { error: `${tooLong[0]} is too long.`, fields };
  if (!validUrl(values.avatarPath) || !validUrl(values.website) || !validUrl(values.linkedin) || !validUrl(values.github) || !validUrl(values.otherLink)) {
    return { error: "Use complete http:// or https:// URLs for links and your avatar.", fields };
  }

  const interests = listField(formData, "interests");
  const industryTags = listField(formData, "industryTags");
  if (interests.some((tag) => tag.length > MAX.tag) || industryTags.some((tag) => tag.length > MAX.tag)) {
    return { error: "Each interest or industry tag must be 50 characters or fewer.", fields };
  }

  const common = await db()
    .from("users")
    .update({
      display_name: values.displayName,
      avatar_path: values.avatarPath || null,
      general_location: values.location || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", viewer.id);
  if (common.error) return { error: "Couldn't update your profile. Try again.", fields };

  const links = Object.fromEntries(
    [
      ["LinkedIn", values.linkedin],
      ["GitHub", values.github],
      ["Other", values.otherLink],
    ].filter(([, value]) => value),
  );
  const profileUpdate =
    viewer.role === "creator"
      ? await db()
          .from("creator_profiles")
          .update({
            bio: values.bio || null,
            interests,
            education: values.education || null,
            availability: values.availability,
            links,
          })
          .eq("user_id", viewer.id)
      : await db()
          .from("company_profiles")
          .update({
            company_name: values.displayName,
            description: values.bio || null,
            industry_tags: industryTags,
            interests,
            website: values.website || null,
            links,
          })
          .eq("user_id", viewer.id);

  if (profileUpdate.error) return { error: "Couldn't update your profile details. Try again.", fields };

  revalidatePath(`/users/${viewer.id}`);
  revalidatePath(`/companies/${viewer.id}`);
  revalidatePath("/dashboard");
  return { notice: "Profile saved." };
}
