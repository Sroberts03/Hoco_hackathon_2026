/**
 * GitHub-backed web apps. A repo is stored in canonical form, without the
 * github.com/ prefix: "owner/repo" or "owner/repo/tree/<ref>/<path>".
 * StackBlitz boots it in the viewer's browser (WebContainers), so only
 * JavaScript/Node projects run; everything else gets a link to the source.
 */

const OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO = /^[A-Za-z0-9._-]{1,100}$/;
const TREE_SEGMENT = /^[A-Za-z0-9._-]+$/;

/**
 * Accepts "https://github.com/owner/repo", "github.com/owner/repo.git",
 * "owner/repo", or a /tree/<ref>/<path> URL. Returns the canonical form, or
 * null if it isn't a GitHub repo.
 */
export function parseGitHubRepo(input: string): string | null {
  let s = input.trim().replace(/[?#].*$/, "").replace(/\/+$/, "");
  s = s.replace(/^(?:https?:\/\/)?(?:www\.)?github\.com\//i, "");

  const [owner, rawRepo, kind, ...rest] = s.split("/");
  const repo = rawRepo?.replace(/\.git$/, "");
  if (!owner || !repo || !OWNER.test(owner) || !REPO.test(repo) || repo === "." || repo === "..") return null;
  if (kind === undefined) return `${owner}/${repo}`;
  if (kind !== "tree" || rest.length === 0 || !rest.every((seg) => TREE_SEGMENT.test(seg) && seg !== "..")) return null;
  return `${owner}/${repo}/tree/${rest.join("/")}`;
}

export function gitHubUrl(repo: string): string {
  return `https://github.com/${repo}`;
}

/** Embed that installs and runs the repo's dev script, showing only the preview. */
export function stackBlitzEmbedUrl(repo: string): string {
  const params = new URLSearchParams({
    embed: "1",
    view: "preview",
    hideExplorer: "1",
    hideNavigation: "1",
    terminalHeight: "0",
  });
  return `https://stackblitz.com/github/${repo}?${params}`;
}

/** Full StackBlitz editor, for "open in new tab". */
export function stackBlitzEditorUrl(repo: string): string {
  return `https://stackblitz.com/github/${repo}`;
}
