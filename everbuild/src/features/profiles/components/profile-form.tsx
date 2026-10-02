"use client";

import { startTransition, useActionState, useState } from "react";
import { Alert, Field, buttonClass, inputClass } from "@/components/ui";
import { AVAILABILITY } from "../lib/constants";
import { COUNTRIES, cityOptions, US_STATES } from "../lib/locations";
import type { ProfileFormState, PublicProfile } from "../lib/types";
import { updateProfile } from "../server/actions";

const initial: ProfileFormState = {};

export function ProfileForm({ profile }: { profile: PublicProfile }) {
  const [state, action, pending] = useActionState(updateProfile, initial);
  const fields = state.fields;
  const value = (key: string, fallback: string) => fields?.[key] ?? fallback;
  const creator = profile.role === "creator";
  const links = new Map(profile.links.map((link) => [link.label, link.href]));
  const [country, setCountry] = useState(value("country", profile.country ?? ""));
  const [region, setRegion] = useState(value("region", profile.region ?? ""));
  const [city, setCity] = useState(value("city", profile.city ?? ""));
  const [compressing, setCompressing] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCompressing(true);
    const formData = new FormData(event.currentTarget);
    const file = formData.get("avatar");
    if (file instanceof File && file.size > 0) {
      formData.set("avatar", await compressAvatar(file), "profile.jpg");
    }
    setCompressing(false);
    startTransition(() => action(formData));
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-5 sm:p-6" aria-labelledby="edit-profile-heading">
      <h2 id="edit-profile-heading" className="text-lg font-semibold">
        Edit your profile
      </h2>
      <p className="mt-1 text-sm text-muted">Keep this focused on what you build and the kinds of opportunities you want.</p>
      <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
        {state.error ? <Alert tone="error">{state.error}</Alert> : null}
        {state.notice ? <Alert tone="notice">{state.notice}</Alert> : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={creator ? "Display name" : "Company name"} htmlFor="profile-display-name">
            <input
              id="profile-display-name"
              name="displayName"
              required
              maxLength={100}
              defaultValue={value("displayName", profile.displayName)}
              className={inputClass}
            />
          </Field>
          <Field label="Country" htmlFor="profile-country" hint="Only a general location is shown publicly.">
            <select id="profile-country" name="country" value={country} onChange={(event) => { setCountry(event.target.value); setRegion(""); setCity(""); }} className={inputClass}>
              <option value="">Choose a country</option>
              {Object.entries(COUNTRIES).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </Field>
        </div>
        <input type="hidden" name="existingLocation" value={profile.location ?? ""} />
        {profile.location ? <label className="-mt-3 flex items-center gap-2 text-xs text-muted"><input type="checkbox" name="clearLocation" /> Clear current location</label> : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="City" htmlFor="profile-city">
            <input
              id="profile-city"
              name="city"
              required={Boolean(country || region)}
              maxLength={100}
              value={city}
              onChange={(event) => setCity(event.target.value)}
              list="profile-city-options"
              className={inputClass}
              placeholder="Denver"
            />
            <datalist id="profile-city-options">
              {cityOptions(country, region).map((city) => <option key={city} value={city} />)}
            </datalist>
          </Field>
          <Field label={country === "US" ? "State" : "State or region"} htmlFor="profile-region">
            {country === "US" ? (
              <select id="profile-region" name="region" value={region} onChange={(event) => setRegion(event.target.value)} className={inputClass}>
                <option value="">Choose a state</option>
                {Object.entries(US_STATES).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              </select>
            ) : (
              <input id="profile-region" name="region" required={Boolean(country)} maxLength={100} value={region} onChange={(event) => setRegion(event.target.value)} className={inputClass} placeholder="Region or province" />
            )}
          </Field>
        </div>

        <Field label="Profile photo" htmlFor="profile-avatar" hint="JPG, PNG, or WebP. Photos are compressed and limited to 1 MB.">
          <input
            id="profile-avatar"
            type="file"
            name="avatar"
            accept="image/jpeg,image/png,image/webp"
            className={inputClass}
          />
          {profile.avatarUrl ? <label className="mt-2 flex items-center gap-2 text-xs text-muted"><input type="checkbox" name="removeAvatar" /> Remove current photo</label> : null}
        </Field>

        <Field label={creator ? "Short bio" : "Company description"} htmlFor="profile-bio">
          <textarea
            id="profile-bio"
            name="bio"
            rows={5}
            maxLength={1000}
            defaultValue={value("bio", profile.bio ?? "")}
            className="block w-full rounded-md border border-line bg-surface px-3 py-2.5 text-[15px] placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
            placeholder={creator ? "What do you build?" : "What does your company work on?"}
          />
        </Field>

        <Field label={creator ? "Interests" : "Company interests"} htmlFor="profile-interests" hint="Separate items with commas.">
          <input
            id="profile-interests"
            name="interests"
            maxLength={1000}
            defaultValue={value("interests", profile.interests.join(", "))}
            className={inputClass}
            placeholder="Accessibility, education, data visualization"
          />
        </Field>

        {creator ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Education" htmlFor="profile-education">
              <input
                id="profile-education"
                name="education"
                maxLength={200}
                defaultValue={value("education", profile.education ?? "")}
                className={inputClass}
                placeholder="School, program, or self-taught"
              />
            </Field>
            <Field label="Availability" htmlFor="profile-availability">
              <select
                id="profile-availability"
                name="availability"
                defaultValue={value("availability", profile.availability ?? "open_to_collaboration")}
                className={inputClass}
              >
                {Object.entries(AVAILABILITY).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        ) : (
          <Field label="Industry and domain tags" htmlFor="profile-industry-tags" hint="Separate items with commas.">
            <input
              id="profile-industry-tags"
              name="industryTags"
              maxLength={1000}
              defaultValue={value("industryTags", profile.industryTags.join(", "))}
              className={inputClass}
              placeholder="Education, civic technology, developer tools"
            />
          </Field>
        )}

        {!creator ? (
          <Field label="Website" htmlFor="profile-website">
            <input
              id="profile-website"
              name="website"
              type="url"
              maxLength={500}
              defaultValue={value("website", profile.website ?? "")}
              className={inputClass}
              placeholder="https://example.com"
            />
          </Field>
        ) : null}

        <div>
          <p className="text-sm font-medium text-ink">Social links</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            <input name="linkedin" type="url" maxLength={500} defaultValue={value("linkedin", links.get("LinkedIn") ?? "")} className={inputClass} placeholder="LinkedIn URL" aria-label="LinkedIn URL" />
            <input name="github" type="url" maxLength={500} defaultValue={value("github", links.get("GitHub") ?? "")} className={inputClass} placeholder="GitHub URL" aria-label="GitHub URL" />
            <input name="otherLink" type="url" maxLength={500} defaultValue={value("otherLink", links.get("Other") ?? "")} className={inputClass} placeholder="Other link" aria-label="Other link" />
          </div>
        </div>

        <button type="submit" disabled={pending || compressing} className={buttonClass("primary", "md")}>
          {compressing ? "Compressing…" : pending ? "Saving…" : "Save profile"}
        </button>
      </form>
    </section>
  );
}

async function compressAvatar(file: File): Promise<File> {
  if (typeof createImageBitmap !== "function") return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const maxDimension = 512;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.72));
  return blob ? new File([blob], "profile.jpg", { type: "image/jpeg" }) : file;
}
