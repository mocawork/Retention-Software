"use client";

import { Info } from "lucide-react";

import { useCurrentMe } from "@/components/auth/auth-gate";
import { ErrorState } from "@/components/error-state";
import { useCurrentBrand } from "@/components/shell/brand-shell";
import { InviteForm } from "@/components/team/invite-form";
import { MembersList } from "@/components/team/members-list";
import { PendingInvitations } from "@/components/team/pending-invitations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_TIMEZONE } from "@/lib/format";
import { useInvite, useMembers } from "@/lib/queries";
import { canManageTeam, isRole } from "@/lib/roles";

export function TeamView() {
  const brand = useCurrentBrand();
  const me = useCurrentMe();
  const myRole = isRole(brand.my_role) ? brand.my_role : null;
  const manage = canManageTeam(myRole);
  const timeZone = brand.timezone ?? DEFAULT_TIMEZONE;
  const members = useMembers(brand.id);
  const invite = useInvite(brand.id);

  return (
    <div className="grid gap-6">
      {manage ? null : (
        <Alert variant="info">
          <Info aria-hidden="true" />
          <AlertDescription className="text-text">
            You can see who&apos;s on the team. Only Owners and Admins can invite people or change
            roles.
          </AlertDescription>
        </Alert>
      )}

      {manage && myRole ? (
        <Card>
          <CardHeader>
            <CardTitle>Invite a teammate</CardTitle>
            <CardDescription>
              They&apos;ll get an email with a link to join {brand.name}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteForm myRole={myRole} onInvite={(values) => invite.mutateAsync(values)} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Team members</CardTitle>
          <CardDescription>Everyone who can use {brand.name}, and their role.</CardDescription>
        </CardHeader>
        <CardContent>
          {members.isPending ? (
            <div className="grid gap-3" aria-busy="true">
              <p className="sr-only" role="status">
                Loading team members…
              </p>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : members.isError ? (
            <ErrorState
              title="We couldn't load your team"
              error={members.error}
              onRetry={() => void members.refetch()}
            />
          ) : (
            <MembersList
              brandId={brand.id}
              brandName={brand.name}
              timeZone={timeZone}
              members={members.data}
              myRole={myRole}
              myEmail={me.email}
            />
          )}
        </CardContent>
      </Card>

      {manage ? (
        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
            <CardDescription>Invitations that haven&apos;t been accepted yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <PendingInvitations brandId={brand.id} timeZone={timeZone} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
