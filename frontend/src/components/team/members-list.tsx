"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { errorMessage } from "@/lib/api/errors";
import { formatDate } from "@/lib/format";
import { useChangeRole, useRemoveMember, type Membership } from "@/lib/queries";
import { assignableRoles, canEditMember, ROLE_LABELS, roleLabel, type Role } from "@/lib/roles";

export function MembersList({
  brandId,
  brandName,
  timeZone,
  members,
  myRole,
  myEmail,
}: {
  brandId: string;
  brandName: string;
  timeZone: string;
  members: readonly Membership[];
  myRole: Role | null;
  myEmail: string;
}) {
  return (
    <ul className="divide-y divide-border/30">
      {members.map((member) => (
        <MemberRow
          key={member.id}
          brandId={brandId}
          brandName={brandName}
          timeZone={timeZone}
          member={member}
          myRole={myRole}
          isMe={member.email.toLowerCase() === myEmail.toLowerCase()}
        />
      ))}
    </ul>
  );
}

function MemberRow({
  brandId,
  brandName,
  timeZone,
  member,
  myRole,
  isMe,
}: {
  brandId: string;
  brandName: string;
  timeZone: string;
  member: Membership;
  myRole: Role | null;
  isMe: boolean;
}) {
  const changeRole = useChangeRole(brandId);
  const removeMember = useRemoveMember(brandId);
  const [rowError, setRowError] = useState<string | null>(null);
  const displayName = member.full_name?.trim() || member.email;
  // Nobody changes or removes themselves here, so an Owner can't lock themselves out.
  const editable = !isMe && canEditMember(myRole, member.role);
  const roleOptions = assignableRoles(myRole);

  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/50 bg-bg text-sm font-medium"
        >
          {displayName.charAt(0).toUpperCase()}
        </span>
        <div className="grid min-w-0">
          <p className="flex items-center gap-2 truncate text-sm font-medium">
            <span className="truncate">{displayName}</span>
            {isMe ? <Badge variant="neutral">You</Badge> : null}
          </p>
          <p className="truncate text-xs text-text-muted">
            {member.full_name ? `${member.email} · ` : ""}Joined{" "}
            {formatDate(member.created_at, timeZone)}
          </p>
          {rowError ? (
            <p role="alert" className="mt-1 text-xs font-medium text-danger">
              {rowError}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:justify-end">
        {editable ? (
          <>
            <NativeSelect
              aria-label={`Role for ${displayName}`}
              className="w-36"
              value={member.role}
              disabled={changeRole.isPending}
              onChange={(event) => {
                setRowError(null);
                changeRole.mutate(
                  { memberId: member.id, role: event.target.value as Role },
                  { onError: (error) => setRowError(errorMessage(error)) },
                );
              }}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </NativeSelect>
            <ConfirmActionDialog
              trigger={
                <Button variant="ghost" size="icon" aria-label={`Remove ${displayName}`}>
                  <Trash2 aria-hidden="true" />
                </Button>
              }
              title={`Remove ${displayName} from ${brandName}?`}
              description={`${displayName} will lose access to ${brandName} straight away. You can invite them again later.`}
              confirmLabel={`Remove ${displayName}`}
              destructive
              onConfirm={() => removeMember.mutateAsync(member.id)}
            />
          </>
        ) : (
          <span className="text-sm text-text-muted">{roleLabel(member.role)}</span>
        )}
      </div>
    </li>
  );
}
