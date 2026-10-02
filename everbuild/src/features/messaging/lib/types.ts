export type Participant = {
  id: string;
  name: string;
  role: "creator" | "company";
  isVerifiedCompany: boolean;
  /** Profile photo, or null to show initials. */
  avatarUrl: string | null;
};

export type ThreadSummary = {
  id: string;
  other: Participant;
  project: { id: string; title: string } | null;
  lastMessage: { body: string; fromMe: boolean; createdAt: string } | null;
  updatedAt: string;
};

export type ThreadMessage = {
  id: string;
  body: string | null; // null when deleted
  createdAt: string;
  fromMe: boolean;
};

export type ThreadDetail = {
  id: string;
  other: Participant;
  project: { id: string; title: string } | null;
  messages: ThreadMessage[];
  /** Either side has blocked the other; replying is disabled. */
  blocked: boolean;
};

export type MessageFormState = { error?: string; ok?: number };

/** Creators and companies have separate public profile pages. */
export function profileHref(p: Participant): string {
  return p.role === "company" ? `/companies/${p.id}` : `/users/${p.id}`;
}
