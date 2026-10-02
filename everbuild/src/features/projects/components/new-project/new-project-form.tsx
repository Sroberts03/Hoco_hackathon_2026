"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert, Field, buttonClass, inputClass } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { PROJECT_STATUSES, PROJECT_TYPES, type ProjectType } from "../../lib/constants";
import { INDUSTRIES } from "../../lib/industries";
import { LIMITS, validateNewProject, type FileInfo, type NewProjectInput, type UploadSlot } from "../../lib/new-project";
import type { PublicationAllowance } from "../../lib/types";
import { completeProject, createProject, discardNewProject } from "../../server/actions";
import { capturePoster, uploadFile } from "./upload";
import { TagPicker } from "./tag-picker";

type Phase = { kind: "idle" } | { kind: "working"; label: string } | { kind: "saved"; projectId: string; notice: string };

const textareaClass = `${inputClass} h-auto py-2.5`;

export function NewProjectForm({
  allowance,
  onBusyChange,
  onCancel,
}: {
  allowance: PublicationAllowance;
  onBusyChange: (busy: boolean) => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [type, setType] = useState<ProjectType>("web_app");
  const [source, setSource] = useState<"upload" | "github">("upload");
  const [tags, setTags] = useState<string[]>([]);
  const [poster, setPoster] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const busy = phase.kind === "working";
  const canPublish = allowance.remaining > 0;

  const setWorking = (label: string | null) => {
    setPhase(label ? { kind: "working", label } : { kind: "idle" });
    onBusyChange(label !== null);
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const publish = submitter?.value === "publish" && canPublish;
    const fd = new FormData(e.currentTarget);

    const files: Partial<Record<UploadSlot, File>> = {};
    const pick = (slot: UploadSlot, name: string) => {
      const f = fd.get(name);
      if (f instanceof File && f.size > 0) files[slot] = f;
    };
    if (type === "web_app" && source === "upload") pick("bundle", "bundle");
    if (type === "video") {
      pick("video", "video");
      if (poster) files.poster = poster;
    }
    pick("cover", "cover");

    const input: NewProjectInput = {
      title: String(fd.get("title") ?? ""),
      description: String(fd.get("description") ?? ""),
      type,
      status: String(fd.get("status") ?? ""),
      industry: String(fd.get("industry") ?? ""),
      tags,
      lookingFor: String(fd.get("lookingFor") ?? ""),
      webAppSource: source,
      githubUrl: String(fd.get("githubUrl") ?? ""),
      files: Object.fromEntries(Object.entries(files).map(([slot, f]) => [slot, info(slot as UploadSlot, f)])),
    };

    const checked = validateNewProject(input);
    if (!checked.ok) return setError(checked.error);
    setError(null);

    try {
      setWorking("Creating your project…");
      const created = await createProject(input);
      if (!created.ok) {
        setWorking(null);
        return setError(created.error);
      }

      for (const [i, { slot, url }] of created.uploads.entries()) {
        const file = files[slot]!;
        const step = created.uploads.length > 1 ? ` (${i + 1} of ${created.uploads.length})` : "";
        try {
          await uploadFile(url, file, contentType(slot, file), (pct) => setWorking(`Uploading ${file.name}${step}… ${pct}%`));
        } catch {
          await discardNewProject(created.projectId);
          setWorking(null);
          return setError(`Uploading ${file.name} failed. Check your connection and try again.`);
        }
      }

      setWorking(type === "web_app" && source === "upload" ? "Unpacking your web app…" : "Finishing up…");
      const done = await completeProject(created.projectId, input, publish);
      if (!done.ok) {
        setWorking(null);
        return setError(done.error);
      }

      onBusyChange(false);
      if (done.notice) return setPhase({ kind: "saved", projectId: done.projectId, notice: done.notice });
      router.push(`/projects/${done.projectId}`);
    } catch {
      setWorking(null);
      setError("Something went wrong. Please try again.");
    }
  }

  if (phase.kind === "saved") {
    return (
      <div className="space-y-4 px-6 py-6">
        <Alert tone="notice">{phase.notice}</Alert>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={buttonClass("secondary")}>
            Close
          </button>
          <Link href={`/projects/${phase.projectId}`} className={buttonClass("primary")}>
            View draft
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6 px-6 py-6">
      <fieldset disabled={busy} className="space-y-6">
        <Field label="Title" htmlFor="np-title">
          <input id="np-title" name="title" required maxLength={LIMITS.title} className={inputClass} placeholder="What did you build?" />
        </Field>

        <Field label="Description" htmlFor="np-description" hint="What it does, how you built it, and what you'd want a company to notice.">
          <textarea id="np-description" name="description" required rows={4} maxLength={LIMITS.description} className={textareaClass} />
        </Field>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Project type</legend>
          <Segmented
            name="type"
            value={type}
            onChange={(v) => setType(v as ProjectType)}
            options={Object.entries(PROJECT_TYPES).map(([value, label]) => ({ value, label }))}
          />
        </fieldset>

        {type === "web_app" ? (
          <div className="space-y-3 rounded-lg border border-line bg-surface-2/50 p-4">
            <Segmented
              name="webAppSource"
              value={source}
              onChange={(v) => setSource(v as "upload" | "github")}
              options={[
                { value: "upload", label: "Upload a ZIP" },
                { value: "github", label: "Run from GitHub" },
              ]}
            />
            {source === "upload" ? (
              <Field label="Web app ZIP" htmlFor="np-bundle" hint={`Static HTML, CSS, and JavaScript with an index.html. Up to ${LIMITS.bundleFiles} files, ${mb(LIMITS.bundleBytes)}. Runs in a sandbox on Everbuild.`}>
                <input id="np-bundle" name="bundle" type="file" accept=".zip,application/zip" className={fileClass} />
              </Field>
            ) : (
              <Field label="GitHub repo URL" htmlFor="np-github" hint="A public JavaScript/Node repo. It installs and runs in the viewer's browser with StackBlitz.">
                <input id="np-github" name="githubUrl" type="url" inputMode="url" className={inputClass} placeholder="https://github.com/you/your-app" />
              </Field>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-line bg-surface-2/50 p-4">
            <Field label="Video (MP4)" htmlFor="np-video" hint={`Up to ${mb(LIMITS.videoBytes)}. We grab a frame for the cover automatically.`}>
              <input
                id="np-video"
                name="video"
                type="file"
                accept="video/mp4,.mp4"
                className={fileClass}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  setPoster(f ? await capturePoster(f) : null);
                }}
              />
            </Field>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status" htmlFor="np-status">
            <select id="np-status" name="status" defaultValue="in_progress" className={inputClass}>
              {Object.entries(PROJECT_STATUSES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Industry (optional)" htmlFor="np-industry">
            <select id="np-industry" name="industry" defaultValue="" className={inputClass}>
              <option value="">None</option>
              {Object.entries(INDUSTRIES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <TagPicker selected={tags} onChange={setTags} max={LIMITS.tags} />

        <Field label="Cover image (optional)" htmlFor="np-cover" hint="PNG, JPEG, or WebP up to 5 MB. Shown on your card in the feed.">
          <input id="np-cover" name="cover" type="file" accept="image/png,image/jpeg,image/webp" className={fileClass} />
        </Field>

        <Field label="Looking for (optional)" htmlFor="np-looking" hint="Collaborators, feedback, a job… anything you'd like help with.">
          <input id="np-looking" name="lookingFor" maxLength={LIMITS.lookingFor} className={inputClass} />
        </Field>
      </fieldset>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted" aria-live="polite">
          {busy ? (
            <span className="text-ink">{phase.label}</span>
          ) : canPublish ? (
            <>
              <span className="font-medium text-ink">{allowance.remaining}</span> of {allowance.max} publications left in this six-month window.
            </>
          ) : (
            <>You&apos;ve used all {allowance.max} publications for now{allowance.nextSlotAt ? `; the next opens ${formatDate(allowance.nextSlotAt)}` : ""}. You can still save a draft.</>
          )}
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="submit" name="intent" value="draft" disabled={busy} className={buttonClass("secondary")}>
            Save draft
          </button>
          <button type="submit" name="intent" value="publish" disabled={busy || !canPublish} className={buttonClass("primary")}>
            {busy ? "Working…" : "Publish"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Segmented({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-md border border-line bg-surface p-0.5">
      {options.map((o) => (
        <label key={o.value} className="cursor-pointer">
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="peer sr-only" />
          <span className="block rounded px-3 py-1.5 text-sm text-muted transition-colors peer-checked:bg-accent peer-checked:text-accent-ink peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
            {o.label}
          </span>
        </label>
      ))}
    </div>
  );
}

const fileClass =
  "block w-full text-sm text-muted file:mr-3 file:rounded-md file:border file:border-line file:bg-surface file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-surface-2";

const mb = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;

/** Video type is pinned so the server-side MP4 check doesn't depend on the OS's guess. */
function contentType(slot: UploadSlot, f: File): string {
  if (slot === "bundle") return "application/zip";
  if (slot === "video") return "video/mp4";
  return f.type;
}

function info(slot: UploadSlot, f: File): FileInfo {
  return { name: f.name, size: f.size, type: contentType(slot, f) };
}
