"use client";

import { useActionState } from "react";
import { Alert, Field, buttonClass, inputClass } from "@/components/ui";
import { AVAILABILITY } from "../lib/constants";
import type { ProfileFormState, PublicProfile } from "../lib/types";
import { updateProfile } from "../server/actions";

const initial: ProfileFormState = {};

export function ProfileForm({ profile }: { profile: PublicProfile }) {
  const [state, action, pending] = useActionState(updateProfile, initial);
  const fields = state.fields;
  const value = (key: string, fallback: string) => fields?.[key] ?? fallback;
  const creator = profile.role === "creator";
  const links = new Map(profile.links.map((link) => [link.label, link.href]));

  return (
    <section className="rounded-xl border border-line bg-surface p-5 sm:p-6" aria-labelledby="edit-profile-heading">
      <h2 id="edit-profile-heading" className="text-lg font-semibold">
        Edit your profile
      </h2>
      <p className="mt-1 text-sm text-muted">Keep this focused on what you build and the kinds of opportunities you want.</p>
      <form action={action} className="mt-6 space-y-5" noValidate>
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
          <Field label="General location" htmlFor="profile-location" hint="City, region, or timezone — never an exact address.">
            <input
              id="profile-location"
              name="location"
              maxLength={120}
              defaultValue={value("location", profile.location ?? "")}
              className={inputClass}
              placeholder="Denver, CO"
            />
          </Field>
        </div>

        <Field label="Profile image URL" htmlFor="profile-avatar" hint="Optional direct image URL.">
          <input
            id="profile-avatar"
            name="avatarPath"
            type="url"
            maxLength={500}
            defaultValue={value("avatarPath", profile.avatarPath ?? "")}
            className={inputClass}
            placeholder="https://…"
          />
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

        <button type="submit" disabled={pending} className={buttonClass("primary", "md")}>
          {pending ? "Saving…" : "Save profile"}
        </button>
      </form>
    </section>
  );
}
