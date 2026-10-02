/** Routes that require a signed-in user. Checked optimistically in the proxy. */
export const PROTECTED_PREFIXES = ["/dashboard", "/settings", "/messages"];

export const DEFAULT_AFTER_AUTH = "/dashboard";

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Only allow same-site relative redirects (prevents open redirects via ?next=). */
export function safeNext(value: FormDataEntryValue | string | null | undefined, fallback = DEFAULT_AFTER_AUTH): string {
  const s = typeof value === "string" ? value : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : fallback;
}

export function loginUrl(next?: string): string {
  return next ? `/login?next=${encodeURIComponent(next)}` : "/login";
}
