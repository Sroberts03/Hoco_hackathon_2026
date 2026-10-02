import type { Participant } from "../lib/types";

export function ParticipantName({ person }: { person: Participant }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-medium text-ink">{person.name}</span>
      {person.role === "company" && person.isVerifiedCompany ? (
        <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent">Verified</span>
      ) : null}
    </span>
  );
}
