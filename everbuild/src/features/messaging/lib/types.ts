export type Participant = {
  id: string;
  name: string;
  role: "creator" | "company";
  isVerifiedCompany: boolean;
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
