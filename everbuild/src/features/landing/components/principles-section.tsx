import { PRINCIPLES } from "../lib/content";

export function PrinciplesSection() {
  return (
    <section id="principles" className="scroll-mt-20 border-y border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
          Built to keep discovery about meaningful work
        </h2>
        <p className="mt-3 max-w-2xl text-muted">
          The feed doesn&apos;t use an opaque recommendation model. Ranking combines relevance to your filters,
          demonstrated impact, freshness, and a rotating exploration slot, so newer projects still get seen.
        </p>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <div key={p.label} className="border-t border-line pt-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight text-accent">{p.stat}</span>
                <span className="text-sm font-medium text-ink">{p.label}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
