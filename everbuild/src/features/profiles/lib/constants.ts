export const AVAILABILITY = {
  open_to_work: "Open to work",
  open_to_freelance: "Open to freelance",
  open_to_collaboration: "Open to collaboration",
  not_currently_available: "Not currently available",
} as const;

export type Availability = keyof typeof AVAILABILITY;

export function isAvailability(v: string): v is Availability {
  return v in AVAILABILITY;
}
