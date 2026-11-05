"use client";

import { Mail } from "lucide-react";

import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { useInvitations, useRevokeInvitation } from "@/lib/queries";
import { roleLabel } from "@/lib/roles";

/** Pending invitations with "Revoke" (Owner/Admin only; the API hides them from others). */
export function PendingInvitations({ brandId, timeZone }: { brandId: string; timeZone: string }) {
  const invitations = useInvitations(brandId, true);
  const revoke = useRevokeInvitation(brandId);

  if (invitations.isPending) {
    return (
      <div className="grid gap-3" aria-busy="true">
        <p className="sr-only" role="status">
          Loading invitations…
        </p>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }
  if (invitations.isError) {
    return (
      <ErrorState
        title="We couldn't load pending invitations"
        error={invitations.error}
        onRetry={() => void invitations.refetch()}
      />
    );
  }
  if (invitations.data.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-text-muted">
        <Mail aria-hidden="true" className="size-4" />
        No pending invitations. People you invite appear here until they accept.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-border/30">
      {invitations.data.map((invitation) => (
        <li key={invitation.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
          <div className="grid min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{invitation.email}</p>
            <p className="text-xs text-text-muted">
              {roleLabel(invitation.role)} · Expires {formatDate(invitation.expires_at, timeZone)}
            </p>
          </div>
          <ConfirmActionDialog
            trigger={
              <Button variant="outline" size="sm" aria-label={`Revoke invitation for ${invitation.email}`}>
                Revoke
              </Button>
            }
            title={`Revoke the invitation for ${invitation.email}?`}
            description="The link in their email will stop working. You can send a new invitation at any time."
            confirmLabel="Revoke invitation"
            destructive
            onConfirm={() => revoke.mutateAsync(invitation.id)}
          />
        </li>
      ))}
    </ul>
  );
}
