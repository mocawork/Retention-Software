/**
 * Role labels and what the UI offers each role. The backend is the authority on every
 * permission (it re-checks each request); this only decides which controls to show.
 * Mirrors backend/apps/brands: writes need Admin or above; only an Owner can create,
 * change or remove an Owner.
 */
import type { components } from "@/lib/api/schema";

export type Role = components["schemas"]["RoleEnum"];

export const ROLES: readonly Role[] = ["owner", "admin", "marketer", "viewer"];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  marketer: "Marketer",
  viewer: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: "Full control, including managing other Owners.",
  admin: "Manages the team and brand settings.",
  marketer: "Works on audiences and campaigns.",
  viewer: "Can see everything but can't change anything.",
};

const RANK: Record<Role, number> = { viewer: 1, marketer: 2, admin: 3, owner: 4 };

export function isRole(value: string | null | undefined): value is Role {
  return value === "owner" || value === "admin" || value === "marketer" || value === "viewer";
}

export function roleLabel(value: string | null | undefined): string {
  return isRole(value) ? ROLE_LABELS[value] : "Member";
}

/** Owners and Admins manage the team; Marketers and Viewers see it read-only. */
export function canManageTeam(role: Role | null | undefined): boolean {
  return !!role && RANK[role] >= RANK.admin;
}

/** Roles this person may give to someone else. */
export function assignableRoles(myRole: Role | null | undefined): Role[] {
  if (myRole === "owner") return [...ROLES];
  if (myRole === "admin") return ["admin", "marketer", "viewer"];
  return [];
}

/** Whether this person may change or remove a member who has `memberRole`. */
export function canEditMember(myRole: Role | null | undefined, memberRole: Role): boolean {
  if (!canManageTeam(myRole)) return false;
  return memberRole !== "owner" || myRole === "owner";
}
