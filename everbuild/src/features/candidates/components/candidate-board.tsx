"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { CANDIDATE_STAGES, type Candidate, type CandidateStage } from "../lib/types";
import { moveCandidate } from "../server/actions";

const stages = Object.entries(CANDIDATE_STAGES) as [CandidateStage, string][];

export function CandidateBoard({ candidates }: { candidates: Candidate[] }) {
  const [optimistic, moveOptimistic] = useOptimistic(candidates, (current, move: { id: string; stage: CandidateStage }) =>
    current.map((candidate) => candidate.id === move.id ? { ...candidate, stage: move.stage } : candidate));
  const [pending, startTransition] = useTransition();
  const [dragged, setDragged] = useState<string | null>(null);
  const [over, setOver] = useState<CandidateStage | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function move(id: string, stage: CandidateStage) {
    const candidate = optimistic.find((item) => item.id === id);
    if (pending || !candidate || candidate.stage === stage) return;
    startTransition(async () => {
      setError(null);
      setNotice(null);
      moveOptimistic({ id, stage });
      try {
        const result = await moveCandidate(id, stage);
        if (result.error) setError(result.error);
        else setNotice(`${candidate.name} moved to ${CANDIDATE_STAGES[stage]}.`);
      } catch {
        setError("Couldn't move this candidate. Try again.");
      }
    });
  }

  return (
    <section className="mt-8" aria-labelledby="candidate-board-heading" aria-busy={pending}>
      <h2 id="candidate-board-heading" className="font-medium">Candidate board ({candidates.length})</h2>
      <p className="mt-1 text-sm text-muted">Save a project to add its creator. Drag profiles between stages, or use their stage menu.</p>
      <p className="mt-1 text-xs text-muted">Candidates stay on your board when you unsave their projects.</p>
      <p role="status" className="mt-2 text-sm text-muted">{pending ? "Saving stage…" : notice}</p>
      {error ? <p role="alert" className="mt-2 text-sm text-danger">{error}</p> : null}
      <div className="mt-4 flex gap-4 overflow-x-auto pb-4" aria-label="Candidate stages">
        {stages.map(([stage, label]) => {
          const members = optimistic.filter((candidate) => candidate.stage === stage);
          return (
            <section key={stage} aria-label={label}
              className={`min-h-64 w-64 shrink-0 rounded-xl border p-3 ${over === stage ? "border-accent bg-accent-soft" : "border-line bg-surface-2"}`}
              onDragOver={(event) => { if (dragged && !pending) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setOver(stage); } }}
              onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(null); }}
              onDrop={(event) => { event.preventDefault(); if (dragged) move(dragged, stage); setDragged(null); setOver(null); }}>
              <h3 className="flex items-center justify-between gap-2 text-sm font-semibold">{label}<span className="rounded bg-surface px-2 py-0.5 text-xs text-muted">{members.length}</span></h3>
              <div className="mt-3 space-y-3">
                {members.map((candidate) => (
                  <article key={candidate.id} draggable={!pending}
                    onDragStart={(event) => { event.dataTransfer.setData("text/plain", candidate.id); event.dataTransfer.effectAllowed = "move"; setDragged(candidate.id); }}
                    onDragEnd={() => { setDragged(null); setOver(null); }}
                    className={`rounded-lg border border-line bg-surface p-3 shadow-sm ${pending ? "opacity-70" : "cursor-grab active:cursor-grabbing"}`}>
                    <Link draggable={false} href={`/users/${candidate.id}`} className="font-medium text-ink hover:underline">{candidate.name}</Link>
                    {candidate.location ? <p className="mt-1 text-xs text-muted">{candidate.location}</p> : null}
                    {candidate.bio ? <p className="mt-2 line-clamp-2 text-xs text-muted">{candidate.bio}</p> : null}
                    <label className="mt-3 block text-xs text-muted">Stage
                      <select value={candidate.stage} disabled={pending} onChange={(event) => move(candidate.id, event.target.value as CandidateStage)}
                        className="mt-1 w-full rounded border border-line bg-surface p-2 text-xs text-ink">
                        {stages.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
                      </select>
                    </label>
                  </article>
                ))}
                {!members.length ? <p className="rounded-lg border border-dashed border-line p-4 text-xs text-muted">{candidates.length ? "Drop a profile here" : "No candidates yet"}</p> : null}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
