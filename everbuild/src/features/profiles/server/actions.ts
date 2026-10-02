"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/features/auth/server/viewer";
import { db } from "@/lib/supabase/admin";
import { isAvailability } from "../lib/constants";
import { locationLabel, validateLocation } from "../lib/locations";
import type { ProfileFormState } from "../lib/types";
import { MEDIA_BUCKET, storagePaths } from "@/features/media/lib/config";

const MAX = {
  displayName: 100,
  city: 100,
  region: 100,
  country: 100,
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
    city: field(formData, "city"),
    region: field(formData, "region"),
    country: field(formData, "country"),
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
    ["City", values.city, MAX.city],
    ["State or region", values.region, MAX.region],
    ["Country", values.country, MAX.country],
    ["Bio", values.bio, MAX.bio],
    ["Education", values.education, MAX.education],
    ["Website", values.website, MAX.website],
    ["LinkedIn URL", values.linkedin, MAX.link],
    ["GitHub URL", values.github, MAX.link],
    ["Other link", values.otherLink, MAX.link],
  ];
  const tooLong = lengths.find(([, value, limit]) => value.length > limit);
  if (tooLong) return { error: `${tooLong[0]} is too long.`, fields };
  const locationError = validateLocation(values.city, values.region, values.country);
  if (locationError) return { error: locationError, fields };
  if (!validUrl(values.website) || !validUrl(values.linkedin) || !validUrl(values.github) || !validUrl(values.otherLink)) {
    return { error: "Use complete http:// or https:// URLs for your website and social links.", fields };
  }
  const existingLocation = field(formData, "existingLocation");
  const clearLocation = formData.get("clearLocation") === "on";
  const preserveLegacyLocation = !values.city && !values.region && !values.country && Boolean(existingLocation) && !clearLocation;

  const avatar = formData.get("avatar");
  const removeAvatar = formData.get("removeAvatar") === "on";
  const avatarFile = avatar instanceof File && avatar.size > 0 ? avatar : null;
  if (avatarFile && (!avatarFile.type.startsWith("image/") || !["image/jpeg", "image/png", "image/webp"].includes(avatarFile.type))) {
    return { error: "Upload a JPG, PNG, or WebP image.", fields };
  }
  if (avatarFile && avatarFile.size > 1_000_000) {
    return { error: "Profile images must be 1 MB or smaller. Use a smaller or compressed image.", fields };
  }

  const interests = listField(formData, "interests");
  const industryTags = listField(formData, "industryTags");
  if (interests.some((tag) => tag.length > MAX.tag) || industryTags.some((tag) => tag.length > MAX.tag)) {
    return { error: "Each interest or industry tag must be 50 characters or fewer.", fields };
  }

  const { data: currentUser } = await db().from("users").select("avatar_path").eq("id", viewer.id).maybeSingle();
  const nextAvatarPath = avatarFile ? storagePaths.avatar(viewer.id) : removeAvatar ? null : undefined;
  if (avatarFile) {
    const { error: uploadError } = await db().storage.from(MEDIA_BUCKET).upload(nextAvatarPath!, avatarFile, {
      cacheControl: "31536000",
      contentType: avatarFile.type,
      upsert: true,
    });
    if (uploadError) return { error: "Couldn't upload your profile image. Try again.", fields };
  }

  const common = await db()
    .from("users")
    .update({
      display_name: values.displayName,
      ...(nextAvatarPath !== undefined ? { avatar_path: nextAvatarPath } : {}),
      ...(preserveLegacyLocation
        ? {}
        : {
            location_city: values.city || null,
            location_region: values.region || null,
            location_country: values.country || null,
            general_location: locationLabel(values.city, values.region, values.country, null),
          }),
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

  if (removeAvatar && !avatarFile && currentUser?.avatar_path?.startsWith(`avatars/${viewer.id}/`)) {
    await db().storage.from(MEDIA_BUCKET).remove([currentUser.avatar_path]);
  }

  revalidatePath(`/users/${viewer.id}`);
  revalidatePath(`/companies/${viewer.id}`);
  revalidatePath("/dashboard");
  return { notice: "Profile saved." };
}
