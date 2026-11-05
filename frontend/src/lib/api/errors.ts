/**
 * One error type for the whole app, built from either backend error shape:
 * - RetentionOS API (technical.md §14): `{ code, message, details }`, `message` in plain English.
 * - allauth headless: `{ status, errors: [{ code, message, param? }] }`.
 */

export type FieldErrors = Record<string, string[]>;

export const MESSAGES = {
  network: "We couldn't reach RetentionOS. Check your internet connection and try again.",
  server: "Something went wrong on our side. Please try again in a moment.",
  forbidden: "Your role doesn't allow this action.",
  notFound: "We couldn't find what you were looking for.",
  rateLimited: "Too many attempts. Please wait a few minutes and try again.",
  invalid: "Some fields need attention.",
} as const;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: FieldErrors;

  constructor(init: { status: number; code: string; message: string; fieldErrors?: FieldErrors }) {
    super(init.message);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.fieldErrors = init.fieldErrors ?? {};
  }

  /** First message for a field, e.g. `error.field("email")`. */
  field(name: string): string | undefined {
    return this.fieldErrors[name]?.[0];
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toMessages(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(toMessages);
  if (isRecord(value)) return Object.values(value).flatMap(toMessages);
  return [];
}

function fallbackMessage(status: number): string {
  if (status === 0) return MESSAGES.network;
  if (status === 403) return MESSAGES.forbidden;
  if (status === 404) return MESSAGES.notFound;
  if (status === 429) return MESSAGES.rateLimited;
  if (status >= 500) return MESSAGES.server;
  return MESSAGES.invalid;
}

/** Field keys whose messages belong to the whole form rather than one input. */
const FORM_LEVEL_KEYS = new Set(["non_field_errors", "__all__", "detail"]);

export function toApiError(status: number, body: unknown): ApiError {
  if (status === 429) {
    return new ApiError({ status, code: "rate_limited", message: MESSAGES.rateLimited });
  }
  if (status >= 500 || !isRecord(body)) {
    return new ApiError({ status, code: "error", message: fallbackMessage(status) });
  }

  // allauth headless: { status, errors: [{ code, message, param }] }
  if (Array.isArray(body.errors)) {
    const fieldErrors: FieldErrors = {};
    const formMessages: string[] = [];
    let code = "invalid";
    for (const item of body.errors) {
      if (!isRecord(item)) continue;
      const message = typeof item.message === "string" ? item.message : "";
      if (typeof item.code === "string" && code === "invalid") code = item.code;
      if (typeof item.param === "string" && item.param) {
        (fieldErrors[item.param] ??= []).push(message);
      } else if (message) {
        formMessages.push(message);
      }
    }
    const firstField = Object.values(fieldErrors)[0]?.[0];
    return new ApiError({
      status,
      code,
      message: formMessages[0] ?? firstField ?? fallbackMessage(status),
      fieldErrors,
    });
  }

  // RetentionOS API: { code, message, details }
  const code = typeof body.code === "string" ? body.code : "error";
  const message = typeof body.message === "string" ? body.message : fallbackMessage(status);
  const fieldErrors: FieldErrors = {};
  let formMessage: string | undefined;
  if (isRecord(body.details)) {
    for (const [key, value] of Object.entries(body.details)) {
      const messages = toMessages(value);
      if (messages.length === 0) continue;
      if (FORM_LEVEL_KEYS.has(key)) formMessage ??= messages[0];
      else fieldErrors[key] = messages;
    }
  }
  return new ApiError({ status, code, message: formMessage ?? message, fieldErrors });
}

export function networkError(): ApiError {
  return new ApiError({ status: 0, code: "network_error", message: MESSAGES.network });
}

type Result<T> = { data?: T; error?: unknown; response: Response };

/**
 * Awaits an openapi-fetch call and returns its data, or throws an `ApiError` with
 * plain-English text. Use it inside TanStack Query `queryFn` / `mutationFn`.
 */
export async function call<T>(request: Promise<Result<T>>): Promise<T> {
  let result: Result<T>;
  try {
    result = await request;
  } catch {
    throw networkError();
  }
  if (result.response.ok) return result.data as T;
  throw toApiError(result.response.status, result.error);
}

export function isApiError(error: unknown, code?: string): error is ApiError {
  return error instanceof ApiError && (code === undefined || error.code === code);
}

/** Plain-English text for any thrown value. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return MESSAGES.server;
}
