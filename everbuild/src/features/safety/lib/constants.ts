export const REPORT_REASONS = {
  spam: "Spam or misleading",
  plagiarism: "Not their work / plagiarism",
  inappropriate: "Inappropriate content",
  harassment: "Harassment",
  other: "Something else",
} as const;

export type ReportReason = keyof typeof REPORT_REASONS;
export type ReportTarget = "project" | "comment" | "message" | "thread" | "user";

export const REPORT_TARGETS: ReportTarget[] = ["project", "comment", "message", "thread", "user"];
export const MAX_REPORT_DETAILS = 1000;
