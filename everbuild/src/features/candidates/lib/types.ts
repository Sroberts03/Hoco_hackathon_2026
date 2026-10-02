export const CANDIDATE_STAGES = {
  potential_candidate: "Potential candidate",
  messaged: "Messaged",
  scheduling_interview: "Scheduling an Interview",
  interview_scheduled: "Interview Scheduled",
  hired: "Hired",
  uninterested: "Uninterested",
} as const;

export type CandidateStage = keyof typeof CANDIDATE_STAGES;

export function isCandidateStage(value: string): value is CandidateStage {
  return Object.hasOwn(CANDIDATE_STAGES, value);
}

export type Candidate = {
  id: string;
  name: string;
  location: string | null;
  bio: string | null;
  stage: CandidateStage;
};
