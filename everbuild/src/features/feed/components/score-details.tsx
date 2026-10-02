import { RANKING_WEIGHTS } from "../lib/config";
import type { ScoreBreakdown } from "../lib/types";

const ROWS: { key: keyof typeof RANKING_WEIGHTS; label: string }[] = [
  { key: "relevance", label: "Relevance" },
  { key: "impact", label: "Impact" },
  { key: "freshness", label: "Freshness" },
  { key: "exploration", label: "Exploration" },
];

/** Shows how a card's recommended score was built: each component × its weight. */
export function ScoreDetails({ score, rank }: { score: ScoreBreakdown; rank: number }) {
  return (
    <div className="border-t border-line bg-surface-2/60 px-4 py-3 text-xs">
      <div className="mb-2 flex items-center justify-between font-medium">
        <span>#{rank} · score</span>
        <span className="font-mono tabular-nums">{score.total.toFixed(3)}</span>
      </div>
      <dl className="space-y-1.5">
        {ROWS.map(({ key, label }) => {
          const contribution = score[key] * RANKING_WEIGHTS[key];
          return (
            <div key={key} className="grid grid-cols-[5.5rem_1fr_3.25rem] items-center gap-2">
              <dt className="text-muted">
                {label} <span className="text-muted/70">×{RANKING_WEIGHTS[key]}</span>
              </dt>
              <dd className="h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
                <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(score[key] * 100)}%` }} />
              </dd>
              <dd className="text-right font-mono tabular-nums text-muted" title={`raw ${score[key].toFixed(3)}`}>
                +{contribution.toFixed(3)}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
