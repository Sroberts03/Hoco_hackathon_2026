export const MEDIA_BUCKET = "everbuild-media";

/** Signed URLs for videos/images live this long; the /media route mints a fresh one per request. */
export const SIGNED_URL_TTL_SECONDS = 60 * 60;

export const MIME_BY_EXTENSION: Record<string, string> = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  txt: "text/plain; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  ico: "image/x-icon",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  mp4: "video/mp4",
  wasm: "application/wasm",
};

export function mimeForPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[ext] ?? "application/octet-stream";
}

/** Same-origin URL for a stored video/image (redirects to a short-lived signed URL). */
export function mediaUrl(mediaId: string): string {
  return `/media/${mediaId}`;
}

/** Entry point of a hosted web app, loaded inside a sandboxed iframe. */
export function hostedAppUrl(projectId: string): string {
  return `/hosted/${projectId}/index.html`;
}

/** Storage layout: projects/<projectId>/app/... for web apps, projects/<projectId>/<file> otherwise. */
export const storagePaths = {
  appDir: (projectId: string) => `projects/${projectId}/app`,
  file: (projectId: string, name: string) => `projects/${projectId}/${name}`,
  avatar: (userId: string) => `avatars/${userId}/profile.jpg`,
};
