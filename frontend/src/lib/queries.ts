"use client";

/**
 * Server state (TanStack Query, design.md §6). Every call goes through the generated
 * clients; the UI only displays what the API returns.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { call } from "@/lib/api/errors";
import { pendingApi } from "@/lib/api/pending-contract";
import type { components } from "@/lib/api/schema";
import { getSession } from "@/lib/auth/allauth";
import type { Role } from "@/lib/roles";

export type Brand = components["schemas"]["Brand"];
export type Me = components["schemas"]["Me"];
export type Membership = components["schemas"]["Membership"];
export type Invitation = components["schemas"]["Invitation"];
export type OnboardingStep = components["schemas"]["OnboardingStep"];

export const queryKeys = {
  session: ["auth", "session"] as const,
  me: ["me"] as const,
  securityEvents: ["me", "security-events"] as const,
  brands: ["brands"] as const,
  onboarding: (brandId: string) => ["brands", brandId, "onboarding"] as const,
  members: (brandId: string) => ["brands", brandId, "members"] as const,
  invitations: (brandId: string) => ["brands", brandId, "invitations"] as const,
  invitationPreview: (token: string) => ["invitation-preview", token] as const,
  totp: ["auth", "totp"] as const,
  recoveryCodes: ["auth", "recovery-codes"] as const,
};

export function useSession() {
  return useQuery({ queryKey: queryKeys.session, queryFn: getSession });
}

export function useMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => call(api.GET("/api/v1/me/")),
    enabled,
  });
}

export function useBrands(enabled = true) {
  return useQuery({
    queryKey: queryKeys.brands,
    queryFn: () => call(api.GET("/api/v1/brands/")),
    enabled,
  });
}

export function useOnboarding(brandId: string) {
  return useQuery({
    queryKey: queryKeys.onboarding(brandId),
    queryFn: () =>
      call(
        api.GET("/api/v1/brands/{brand_id}/onboarding/", {
          params: { path: { brand_id: brandId } },
        }),
      ),
  });
}

export function useMembers(brandId: string) {
  return useQuery({
    queryKey: queryKeys.members(brandId),
    queryFn: () =>
      call(
        api.GET("/api/v1/brands/{brand_id}/members/", { params: { path: { brand_id: brandId } } }),
      ),
  });
}

/** Pending invitations. Only Owners and Admins may read them (the API returns 403 otherwise). */
export function useInvitations(brandId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.invitations(brandId),
    queryFn: () =>
      call(
        api.GET("/api/v1/brands/{brand_id}/invitations/", {
          params: { path: { brand_id: brandId } },
        }),
      ),
    enabled,
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; timezone: string }) =>
      call(api.POST("/api/v1/brands/", { body })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.brands }),
  });
}

export function useInvite(brandId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; role: Role }) =>
      call(
        api.POST("/api/v1/brands/{brand_id}/invitations/", {
          params: { path: { brand_id: brandId } },
          body,
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.invitations(brandId) }),
  });
}

export function useChangeRole(brandId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: Role }) =>
      call(
        api.PATCH("/api/v1/brands/{brand_id}/members/{member_id}/", {
          params: { path: { brand_id: brandId, member_id: memberId } },
          body: { role },
        }),
      ),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.members(brandId) }),
        // My own role may have changed (e.g. an Owner who made themselves Admin).
        queryClient.invalidateQueries({ queryKey: queryKeys.brands }),
      ]),
  });
}

export function useRemoveMember(brandId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      call(
        api.DELETE("/api/v1/brands/{brand_id}/members/{member_id}/", {
          params: { path: { brand_id: brandId, member_id: memberId } },
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.members(brandId) }),
  });
}

/** TODO(M0): uses the pending contract until revoke is in backend/openapi.json. */
export function useRevokeInvitation(brandId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) =>
      call(
        pendingApi.DELETE("/api/v1/brands/{brand_id}/invitations/{invitation_id}/", {
          params: { path: { brand_id: brandId, invitation_id: invitationId } },
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.invitations(brandId) }),
  });
}

/** TODO(M0): uses the pending contract until the preview is in backend/openapi.json. */
export function useInvitationPreview(token: string) {
  return useQuery({
    queryKey: queryKeys.invitationPreview(token),
    queryFn: () =>
      call(pendingApi.GET("/api/v1/invitations/{token}/", { params: { path: { token } } })),
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) =>
      call(api.POST("/api/v1/invitations/accept/", { body: { token } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.brands }),
  });
}

/** TODO(M0): uses the pending contract until security events are in backend/openapi.json. */
export function useSecurityEvents() {
  return useQuery({
    queryKey: queryKeys.securityEvents,
    queryFn: () => call(pendingApi.GET("/api/v1/me/security-events/")),
  });
}
