/**
 * TEMPORARY, HAND-WRITTEN contract for three endpoints the backend is still building
 * (not yet in backend/openapi.json):
 *
 *   DELETE /api/v1/brands/{brand_id}/invitations/{invitation_id}/   revoke an invitation
 *   GET    /api/v1/invitations/{token}/                             invitation preview
 *   GET    /api/v1/me/security-events/                              my security activity
 *
 * Written in the same shape openapi-typescript generates, so swapping is mechanical.
 * TODO(M0): once these are in backend/openapi.json, run `pnpm generate:api`, change the
 * imports of `pendingApi` / the types below to `api` and `components["schemas"][...]`
 * from ./client and ./schema, and delete this file.
 */
import { createTypedClient } from "./client";
import type { components } from "./schema";

type Role = components["schemas"]["RoleEnum"];

export type InvitationPreviewStatus = "pending" | "accepted" | "revoked" | "expired";

/** What someone sees when they open an invitation link (no login needed). */
export interface InvitationPreview {
  brand_name: string;
  role: Role;
  /** The address the invitation was sent to. */
  email: string;
  /** Inviter's full name, or their email if they have no name yet. */
  invited_by_name: string;
  status: InvitationPreviewStatus;
  /** ISO 8601 date-time. */
  expires_at: string;
}

/** One entry in "Recent security activity" (logins, 2-step login changes…). */
export interface SecurityEvent {
  id: string;
  /** Machine code, e.g. "auth.login", "auth.login_failed", "mfa.totp_activated". */
  action: string;
  ip_address: string | null;
  /** ISO 8601 date-time. */
  created_at: string;
}

type NoParams = { query?: never; header?: never; cookie?: never };
type JsonResponse<T> = {
  headers: { [name: string]: unknown };
  content: { "application/json": T };
};
type ErrorBody = { code: string; message: string; details: unknown };

export interface pendingPaths {
  "/api/v1/brands/{brand_id}/invitations/{invitation_id}/": {
    parameters: NoParams & { path?: never };
    get?: never;
    put?: never;
    post?: never;
    delete: {
      parameters: NoParams & { path: { brand_id: string; invitation_id: string } };
      requestBody?: never;
      responses: {
        /** @description No response body */
        204: { headers: { [name: string]: unknown }; content?: never };
        404: JsonResponse<ErrorBody>;
      };
    };
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/invitations/{token}/": {
    parameters: NoParams & { path?: never };
    get: {
      parameters: NoParams & { path: { token: string } };
      requestBody?: never;
      responses: {
        200: JsonResponse<InvitationPreview>;
        404: JsonResponse<ErrorBody>;
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/me/security-events/": {
    parameters: NoParams & { path?: never };
    get: {
      parameters: NoParams & { path?: never };
      requestBody?: never;
      responses: {
        200: JsonResponse<SecurityEvent[]>;
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}

/** TODO(M0): replace with `api` from ./client after regeneration. */
export const pendingApi = createTypedClient<pendingPaths>();
