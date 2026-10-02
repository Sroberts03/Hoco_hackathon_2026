"use client";

import Form from "next/form";
import Link from "next/link";
import { useRef, useState } from "react";
import { AVAILABILITY } from "@/features/profiles/lib/constants";
import { PROJECT_STATUSES, PROJECT_TYPES } from "@/features/projects/lib/constants";
import { INDUSTRIES } from "@/features/projects/lib/industries";
import { TAG_CATEGORIES, TAG_TAXONOMY } from "@/features/projects/lib/taxonomy";
import { inputClass } from "@/components/ui";
import { FRESHNESS_RANGES, type SortMode } from "../lib/config";
import type { FeedFilters } from "../lib/types";

type Props = {
  filters: FeedFilters;
  sort: SortMode;
  locations: string[];
  activeCount: number;
  /** Set when the viewer has saved defaults, so submitting never falls back to them. */
  hasSavedDefaults: boolean;
};

/**
 * GET form over the feed's query params. Changes apply immediately (client
 * navigation via next/form); without JS the Apply button submits.
 */
export function FilterPanel({ filters, sort, locations, activeCount, hasSavedDefaults }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const submit = () => formRef.current?.requestSubmit();

  return (
    <div>
      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        aria-expanded={mobileOpen}
        aria-controls="feed-filters"
        className="flex h-10 w-full items-center justify-between rounded-md border border-line bg-surface px-3 text-sm font-medium lg:hidden"
      >
        <span>Filters{activeCount ? ` (${activeCount})` : ""}</span>
        <span aria-hidden className="text-muted">
          {mobileOpen ? "−" : "+"}
        </span>
      </button>

      <Form
        ref={formRef}
        id="feed-filters"
        action="/discover"
        scroll={false}
        onChange={(e) => {
          // Text search applies on Enter / blur, not on every keystroke.
          if ((e.target as HTMLElement).getAttribute("name") !== "q") submit();
        }}
        className={`${mobileOpen ? "mt-4 block" : "hidden"} space-y-6 lg:block`}
      >
        {sort !== "recommended" ? <input type="hidden" name="sort" value={sort} /> : null}
        {hasSavedDefaults ? <input type="hidden" name="defaults" value="off" /> : null}

        <div>
          <label htmlFor="feed-q" className="mb-1.5 block text-sm font-medium">
            Search
          </label>
          <input
            id="feed-q"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Title, description, tag"
            onBlur={(e) => e.currentTarget.value !== filters.q && submit()}
            className={`${inputClass} h-10 text-sm`}
          />
        </div>

        <CheckboxGroup legend="Project type" name="type" options={PROJECT_TYPES} selected={filters.types} />
        <CheckboxGroup legend="Status" name="status" options={PROJECT_STATUSES} selected={filters.statuses} />

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Industry</legend>
          <div className="rounded-md border border-line bg-surface">
            <ChipDetails summary="All industries" name="industry" options={INDUSTRIES} selected={filters.industries} />
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Skills and topics</legend>
          <div className="divide-y divide-line rounded-md border border-line bg-surface">
            {TAG_CATEGORIES.map((category) => (
              <ChipDetails
                key={category}
                summary={category}
                name="tag"
                options={Object.fromEntries(TAG_TAXONOMY[category].map((t) => [t, t]))}
                selected={filters.tags}
              />
            ))}
          </div>
        </fieldset>

        <CheckboxGroup legend="Creator availability" name="availability" options={AVAILABILITY} selected={filters.availability} />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <div>
            <label htmlFor="feed-location" className="mb-1.5 block text-sm font-medium">
              Location
            </label>
            <select id="feed-location" name="location" defaultValue={filters.location} className={`${inputClass} h-10 text-sm`}>
              <option value="">Anywhere</option>
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="feed-fresh" className="mb-1.5 block text-sm font-medium">
              Published
            </label>
            <select id="feed-fresh" name="fresh" defaultValue={filters.freshness ?? ""} className={`${inputClass} h-10 text-sm`}>
              <option value="">Any time</option>
              {Object.entries(FRESHNESS_RANGES).map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <noscript>
            <button type="submit" className="text-sm font-medium text-accent">
              Apply filters
            </button>
          </noscript>
          {activeCount ? (
            <Link href={hasSavedDefaults ? "/discover?defaults=off" : "/discover"} className="text-sm text-muted hover:text-ink">
              Clear all filters
            </Link>
          ) : null}
        </div>
      </Form>
    </div>
  );
}

function CheckboxGroup<T extends string>({
  legend,
  name,
  options,
  selected,
}: {
  legend: string;
  name: string;
  options: Record<T, string>;
  selected: T[];
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className="space-y-1.5">
        {(Object.entries(options) as [T, string][]).map(([value, label]) => (
          <label key={value} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
            <input
              type="checkbox"
              name={name}
              value={value}
              defaultChecked={selected.includes(value)}
              className="h-4 w-4 rounded border-line accent-[var(--accent)]"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Collapsible group of toggle chips; opens automatically when something inside is selected. */
function ChipDetails<T extends string>({
  summary,
  name,
  options,
  selected,
}: {
  summary: string;
  name: string;
  options: Record<T, string>;
  selected: T[];
}) {
  const entries = Object.entries(options) as [T, string][];
  const selectedHere = entries.filter(([v]) => selected.includes(v)).length;

  return (
    <details open={selectedHere > 0} className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm [&::-webkit-details-marker]:hidden">
        <span>{summary}</span>
        <span className="flex items-center gap-2 text-xs text-muted">
          {selectedHere ? (
            <span className="rounded-full bg-accent-soft px-1.5 py-0.5 font-medium text-accent">{selectedHere}</span>
          ) : null}
          <span aria-hidden className="transition-transform group-open:rotate-90">
            ›
          </span>
        </span>
      </summary>
      <div className="flex flex-wrap gap-1.5 px-3 pb-3">
        {entries.map(([value, label]) => (
          <label key={value} className="cursor-pointer">
            <input type="checkbox" name={name} value={value} defaultChecked={selected.includes(value)} className="peer sr-only" />
            <span className="inline-block rounded-full border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:border-ink/30 peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
              {label}
            </span>
          </label>
        ))}
      </div>
    </details>
  );
}
