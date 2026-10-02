// Copy for the landing page sections.

export type Point = { title: string; body: string };

export const CREATOR_POINTS: Point[] = [
  {
    title: "Publish the real thing",
    body: "Upload an MP4 or a packaged HTML/CSS/JavaScript app. It runs right on your project page in a sandbox, so you don't need an outside demo link.",
  },
  {
    title: "Credit everyone who built it",
    body: "Add collaborators and roles, mark what stage the project is at, and say what kind of help you're looking for.",
  },
  {
    title: "Get contacted directly",
    body: "Companies message you about a specific project. No application forms, no resume parsing.",
  },
];

export const COMPANY_POINTS: Point[] = [
  {
    title: "Browse without an account",
    body: "Filter by technology, capability, project type, status, and location. Sign in only when you want to save or reach out.",
  },
  {
    title: "Set your interests once",
    body: "Save default filters such as Data Visualization or Accessibility, and your feed opens with them applied.",
  },
  {
    title: "Judge the work, then reach out",
    body: "Run the app or watch the video, see who built it, then message a creator with the project attached.",
  },
];

export const PRINCIPLES = [
  {
    stat: "3",
    label: "projects per six months",
    body: "Each creator can first-publish at most three projects in any rolling six-month window. That keeps the feed focused on meaningful work instead of bulk output.",
  },
  {
    stat: "0",
    label: "external demo links required",
    body: "Videos and web apps are hosted on Everbuild and viewed in place. Uploaded apps run sandboxed, away from your account.",
  },
  {
    stat: "6",
    label: "months on the main feed",
    body: "Projects archive automatically after six months to keep discovery fresh. Archived work stays online, and owners can renew it anytime.",
  },
];
