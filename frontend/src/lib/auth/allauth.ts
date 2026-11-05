/**
 * django-allauth headless flows (browser client, session cookie). Every function goes
 * through the generated `authApi` client and turns allauth's status codes into results:
 *
 * - 200      → authenticated
 * - 401      → not authenticated; `data.flows` says what is pending
 *              (`verify_email`, `mfa_authenticate`) or that a re-login is needed
 * - 410      → session gone (treated as logged out)
 * - 4xx/5xx  → thrown as `ApiError` with allauth's plain-English message
 */
import type { components } from "@/lib/api/auth-schema";
import { authApi, BROWSER } from "@/lib/api/client";
import { ApiError, networkError, toApiError } from "@/lib/api/errors";

type Schemas = components["schemas"];
export type AuthUser = Schemas["User"];
export type Flow = Schemas["Flow"];
export type FlowId = Flow["id"];

export type AuthState =
  | { status: "authenticated"; user: AuthUser }
  | { status: "unauthenticated"; pendingFlow: FlowId | null };

type RawResult = { data?: unknown; error?: unknown; response: Response };

async function send(request: Promise<RawResult>): Promise<{ status: number; body: unknown }> {
  let result: RawResult;
  try {
    result = await request;
  } catch {
    throw networkError();
  }
  return { status: result.response.status, body: result.data ?? result.error };
}

function readUser(body: unknown): AuthUser {
  const user = (body as { data?: { user?: AuthUser } } | undefined)?.data?.user;
  return user ?? { display: "", has_usable_password: true };
}

function readFlows(body: unknown): Flow[] {
  const flows = (body as { data?: { flows?: Flow[] } } | undefined)?.data?.flows;
  return Array.isArray(flows) ? flows : [];
}

function toAuthState({ status, body }: { status: number; body: unknown }): AuthState {
  if (status === 200) return { status: "authenticated", user: readUser(body) };
  if (status === 401 || status === 410) {
    const pending = readFlows(body).find((flow) => flow.is_pending);
    return { status: "unauthenticated", pendingFlow: pending?.id ?? null };
  }
  throw toApiError(status, body);
}

const path = { params: { path: BROWSER } };

export async function getSession(): Promise<AuthState> {
  return toAuthState(await send(authApi.GET("/_allauth/{client}/v1/auth/session", path)));
}

/** 409 = someone is already logged in on this browser: report the current session. */
async function orCurrentSession(result: { status: number; body: unknown }): Promise<AuthState> {
  if (result.status === 409) return getSession();
  return toAuthState(result);
}

export async function signup(email: string, password: string): Promise<AuthState> {
  return orCurrentSession(
    await send(
      authApi.POST("/_allauth/{client}/v1/auth/signup", { ...path, body: { email, password } }),
    ),
  );
}

export async function login(email: string, password: string): Promise<AuthState> {
  return orCurrentSession(
    await send(
      authApi.POST("/_allauth/{client}/v1/auth/login", { ...path, body: { email, password } }),
    ),
  );
}

export async function logout(): Promise<void> {
  const result = await send(authApi.DELETE("/_allauth/{client}/v1/auth/session", path));
  // allauth answers a successful logout with 401 ("you are now unauthenticated").
  if (result.status !== 401 && result.status !== 200 && result.status !== 410) {
    throw toApiError(result.status, result.body);
  }
}

/** The 2-step login challenge: a code from the authenticator app or a recovery code. */
export async function authenticateMfa(code: string): Promise<AuthState> {
  const result = await send(
    authApi.POST("/_allauth/{client}/v1/auth/2fa/authenticate", { ...path, body: { code } }),
  );
  if (result.status === 409) {
    throw new ApiError({
      status: 409,
      code: "no_pending_login",
      message: "Your log-in timed out. Please log in again.",
    });
  }
  return toAuthState(result);
}

// --- Email verification -------------------------------------------------------------

/** Keys arrive URL-encoded in the link (":" → "%3A"); allauth needs the raw key. */
export function decodeKey(key: string): string {
  try {
    return decodeURIComponent(key);
  } catch {
    return key;
  }
}

const INVALID_LINK = "This link has expired or has already been used.";

function invalidLink(status: number, body: unknown): ApiError {
  const error = toApiError(status, body);
  return status === 400 || status === 404 || status === 409
    ? new ApiError({ status, code: "invalid_link", message: INVALID_LINK })
    : error;
}

export async function getEmailVerification(key: string): Promise<{ email: string }> {
  const result = await send(
    authApi.GET("/_allauth/{client}/v1/auth/email/verify", {
      params: { path: BROWSER, header: { "X-Email-Verification-Key": key } },
    }),
  );
  if (result.status !== 200) throw invalidLink(result.status, result.body);
  const email = (result.body as { data?: { email?: string } }).data?.email ?? "";
  return { email };
}

/** Confirms the email. Logged in afterwards when sign-up happened in this browser. */
export async function verifyEmail(key: string): Promise<AuthState> {
  const result = await send(
    authApi.POST("/_allauth/{client}/v1/auth/email/verify", { ...path, body: { key } }),
  );
  if (result.status === 400 || result.status === 409) {
    throw invalidLink(result.status, result.body);
  }
  return toAuthState(result);
}

export type ResendOutcome = "sent" | "no_pending_signup";

export async function resendVerificationEmail(): Promise<ResendOutcome> {
  const result = await send(authApi.POST("/_allauth/{client}/v1/auth/email/verify/resend", path));
  if (result.status === 200) return "sent";
  if (result.status === 409) return "no_pending_signup";
  throw toApiError(result.status, result.body);
}

// --- Password reset -----------------------------------------------------------------

/** Always "succeeds" so nobody can learn which emails have accounts. */
export async function requestPasswordReset(email: string): Promise<void> {
  const result = await send(
    authApi.POST("/_allauth/{client}/v1/auth/password/request", { ...path, body: { email } }),
  );
  if (result.status !== 200 && result.status !== 401) {
    throw toApiError(result.status, result.body);
  }
}

export async function checkPasswordResetKey(key: string): Promise<void> {
  const result = await send(
    authApi.GET("/_allauth/{client}/v1/auth/password/reset", {
      params: { path: BROWSER, header: { "X-Password-Reset-Key": key } },
    }),
  );
  if (result.status !== 200) throw invalidLink(result.status, result.body);
}

export async function resetPassword(key: string, password: string): Promise<AuthState> {
  const result = await send(
    authApi.POST("/_allauth/{client}/v1/auth/password/reset", {
      ...path,
      body: { key, password },
    }),
  );
  if (result.status === 400) {
    const error = toApiError(result.status, result.body);
    if (error.fieldErrors.key) throw invalidLink(result.status, result.body);
    throw error;
  }
  if (result.status === 409) throw invalidLink(result.status, result.body);
  return toAuthState(result);
}

// --- 2-step login (TOTP) and recovery codes -----------------------------------------

/** Thrown when allauth wants the password again before a sensitive change (401). */
export const REAUTH_REQUIRED = "reauthentication_required";

function reauthRequired(): ApiError {
  return new ApiError({
    status: 401,
    code: REAUTH_REQUIRED,
    message: "For your security, please enter your password again.",
  });
}

export type TotpStatus =
  { status: "active" } | { status: "not_set_up"; secret: string; totpUrl: string };

/**
 * Careful: each call while 2-step login is off makes allauth issue a NEW secret, so call
 * it once per setup attempt (never on window focus or in a refetch loop).
 */
export async function getTotp(): Promise<TotpStatus> {
  const result = await send(authApi.GET("/_allauth/{client}/v1/account/authenticators/totp", path));
  if (result.status === 200) return { status: "active" };
  if (result.status === 404) {
    const meta = (result.body as { meta?: { secret?: string; totp_url?: string } }).meta ?? {};
    return { status: "not_set_up", secret: meta.secret ?? "", totpUrl: meta.totp_url ?? "" };
  }
  if (result.status === 401) throw reauthRequired();
  throw toApiError(result.status, result.body);
}

export async function activateTotp(code: string): Promise<void> {
  const result = await send(
    authApi.POST("/_allauth/{client}/v1/account/authenticators/totp", { ...path, body: { code } }),
  );
  if (result.status === 200) return;
  if (result.status === 401) throw reauthRequired();
  throw toApiError(result.status, result.body);
}

/** Confirms the password so a sensitive change can go ahead. */
export async function reauthenticate(password: string): Promise<void> {
  const result = await send(
    authApi.POST("/_allauth/{client}/v1/auth/reauthenticate", { ...path, body: { password } }),
  );
  if (result.status !== 200) throw toApiError(result.status, result.body);
}

export interface RecoveryCodes {
  totalCount: number;
  unusedCount: number;
  /** Only present when allauth lets the user see them (right after creating them). */
  codes: string[] | null;
}

function readRecoveryCodes(body: unknown): RecoveryCodes {
  const data =
    (
      body as {
        data?: { total_code_count?: number; unused_code_count?: number; unused_codes?: string[] };
      }
    ).data ?? {};
  return {
    totalCount: data.total_code_count ?? 0,
    unusedCount: data.unused_code_count ?? 0,
    codes: Array.isArray(data.unused_codes) ? data.unused_codes : null,
  };
}

/** `null` = no recovery codes exist yet. */
export async function getRecoveryCodes(): Promise<RecoveryCodes | null> {
  const result = await send(
    authApi.GET("/_allauth/{client}/v1/account/authenticators/recovery-codes", path),
  );
  if (result.status === 200) return readRecoveryCodes(result.body);
  if (result.status === 404) return null;
  if (result.status === 401) throw reauthRequired();
  throw toApiError(result.status, result.body);
}

/** Makes a fresh set; the old codes stop working. */
export async function regenerateRecoveryCodes(): Promise<RecoveryCodes> {
  const result = await send(
    authApi.POST("/_allauth/{client}/v1/account/authenticators/recovery-codes", path),
  );
  if (result.status === 200) return readRecoveryCodes(result.body);
  if (result.status === 401) throw reauthRequired();
  throw toApiError(result.status, result.body);
}
