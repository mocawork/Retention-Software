/**
 * The only way the app talks to the backend (design.md §6, CLAUDE.md R-9).
 *
 * - `api`     → RetentionOS API (`/api/v1/...`), types generated from backend/openapi.json.
 * - `authApi` → django-allauth headless (`/_allauth/browser/v1/...`), types generated
 *               from backend/allauth-openapi.json.
 *
 * Both are same-origin: Next.js forwards `/api/*` and `/_allauth/*` to Django
 * (next.config.ts), so Django's session cookie and `csrftoken` cookie stay first-party.
 * Unsafe methods carry the `X-CSRFToken` header Django expects.
 */
import createClient, { type Middleware } from "openapi-fetch";

import type { paths as AuthPaths } from "./auth-schema";
import type { paths } from "./schema";

export const CSRF_COOKIE = "csrftoken";
export const CSRF_HEADER = "X-CSRFToken";
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  for (const pair of document.cookie.split(";")) {
    const [key, ...rest] = pair.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/** Adds Django's CSRF header to unsafe requests. Read fresh each time: login rotates it. */
export const csrfMiddleware: Middleware = {
  onRequest({ request }) {
    if (UNSAFE_METHODS.has(request.method.toUpperCase())) {
      const token = readCookie(CSRF_COOKIE);
      if (token) request.headers.set(CSRF_HEADER, token);
    }
    return request;
  },
};

// Same origin in the browser. The server-side fallback is never used for real calls:
// every API call runs in the browser, where the session cookie lives.
const baseUrl = typeof window === "undefined" ? "http://localhost" : window.location.origin;

const clientOptions = {
  baseUrl,
  credentials: "include" as const,
  // Look `fetch` up at call time (so tests can replace it) instead of capturing it once.
  fetch: (request: Request) => globalThis.fetch(request),
};

/** A typed client for a set of generated `paths` (same origin, cookies, CSRF). */
export function createTypedClient<Paths extends object>() {
  const client = createClient<Paths>(clientOptions);
  client.use(csrfMiddleware);
  return client;
}

export const api = createTypedClient<paths>();
export const authApi = createTypedClient<AuthPaths>();

/** allauth's `{client}` path segment: we are a browser client (session cookie). */
export const BROWSER = { client: "browser" } as const;
