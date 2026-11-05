/**
 * Where to send someone after they log in or sign up (e.g. back to an invitation).
 * Only same-site paths are accepted, so a crafted link can't redirect people elsewhere.
 */

const STORAGE_KEY = "ros.returnTo";
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour: long enough to find the verification email.

/** Returns the path if it is a safe in-app path ("/x"), otherwise null. */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  if (/[\u0000-\u001f]/.test(raw)) return null;
  return raw;
}

/**
 * Remembers a destination across the email-verification round trip. The link in the
 * email may open in a new tab, so this uses localStorage (per browser), not the URL.
 */
export function saveReturnTo(path: string): void {
  const safe = safeNextPath(path);
  if (!safe) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ path: safe, at: Date.now() }));
  } catch {
    // Storage blocked (private mode): the user simply lands on Home instead.
  }
}

export function consumeReturnTo(): string | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    window.localStorage.removeItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { path?: string; at?: number };
    if (typeof parsed.at !== "number" || Date.now() - parsed.at > MAX_AGE_MS) return null;
    return safeNextPath(parsed.path);
  } catch {
    return null;
  }
}

/** Builds "/login?next=…" style links that keep the destination. */
export function withNext(path: string, next: string | null | undefined): string {
  const safe = safeNextPath(next);
  return safe ? `${path}?next=${encodeURIComponent(safe)}` : path;
}
