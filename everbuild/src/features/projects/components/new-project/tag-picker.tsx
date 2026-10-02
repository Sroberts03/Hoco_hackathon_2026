"use client";

import { TAG_CATEGORIES, TAG_TAXONOMY } from "../../lib/taxonomy";

/** Curated tags grouped by category, as toggle chips. Caps the selection at `max`. */
export function TagPicker({ selected, onChange, max }: { selected: string[]; onChange: (tags: string[]) => void; max: number }) {
  const full = selected.length >= max;
  const toggle = (tag: string) => onChange(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag]);

  return (
    <fieldset className="space-y-2">
      <legend className="flex w-full items-baseline justify-between text-sm font-medium">
        Tags
        <span className="text-xs font-normal text-muted">
          {selected.length}/{max} selected
        </span>
      </legend>

      {selected.length ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggle(t)}
              className="rounded-full bg-accent px-2.5 py-1 text-xs text-accent-ink hover:bg-accent-hover"
              aria-label={`Remove ${t}`}
            >
              {t} ✕
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted">Pick the languages, tools, and domains that best describe your project.</p>
      )}

      <div className="divide-y divide-line rounded-lg border border-line">
        {TAG_CATEGORIES.map((category) => {
          const here = TAG_TAXONOMY[category].filter((t) => selected.includes(t)).length;
          return (
            <details key={category} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm [&::-webkit-details-marker]:hidden">
                <span>{category}</span>
                <span className="flex items-center gap-2 text-xs text-muted">
                  {here ? <span className="rounded-full bg-accent-soft px-1.5 py-0.5 font-medium text-accent">{here}</span> : null}
                  <span aria-hidden className="transition-transform group-open:rotate-90">
                    ›
                  </span>
                </span>
              </summary>
              <div className="flex flex-wrap gap-1.5 px-3 pb-3">
                {TAG_TAXONOMY[category].map((tag) => {
                  const on = selected.includes(tag);
                  return (
                    <label key={tag} className={on || !full ? "cursor-pointer" : "cursor-not-allowed opacity-50"}>
                      <input type="checkbox" checked={on} disabled={!on && full} onChange={() => toggle(tag)} className="peer sr-only" />
                      <span className="inline-block rounded-full border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:border-ink/30 peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
                        {tag}
                      </span>
                    </label>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
    </fieldset>
  );
}
