import Link from "next/link";
import { buttonClass } from "@/components/ui";
import type { Point } from "../lib/content";

export function AudienceColumn({
  id,
  eyebrow,
  title,
  points,
  cta,
}: {
  id: string;
  eyebrow: string;
  title: string;
  points: Point[];
  cta?: { href: string; label: string };
}) {
  return (
    <div id={id} className="scroll-mt-20 py-8 lg:py-0">
      <p className="text-sm font-medium text-accent">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
      <ol className="mt-8 space-y-6">
        {points.map((p, i) => (
          <li key={p.title} className="flex gap-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line font-mono text-xs text-muted">
              {i + 1}
            </span>
            <div>
              <h3 className="font-medium text-ink">{p.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{p.body}</p>
            </div>
          </li>
        ))}
      </ol>
      {cta ? (
        <Link href={cta.href} className={buttonClass("secondary", "md", "mt-8")}>
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}
