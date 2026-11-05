"use client";

import { useQueryClient } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { FormError } from "@/components/form-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/api/errors";
import type { InvitationPreview } from "@/lib/api/pending-contract";
import { decodeKey, logout } from "@/lib/auth/allauth";
import { withNext } from "@/lib/auth/return-to";
import { formatDate } from "@/lib/format";
import { useAcceptInvitation, useInvitationPreview, useMe, useSession } from "@/lib/queries";
import { isRole, ROLE_DESCRIPTIONS, roleLabel } from "@/lib/roles";
import { routes } from "@/lib/routes";

const CLOSED_MESSAGES: Record<Exclude<InvitationPreview["status"], "pending">, string> = {
  accepted: "This invitation has already been accepted.",
  revoked: "This invitation was cancelled by the brand.",
  expired: "This invitation has expired.",
};

export function InvitationView({ rawToken }: { rawToken: string }) {
  const token = decodeKey(rawToken);
  const router = useRouter();
  const queryClient = useQueryClient();
  const here = routes.invitation(token);
  const preview = useInvitationPreview(token);
  const session = useSession();
  const authenticated = session.data?.status === "authenticated";
  const me = useMe(authenticated);
  const accept = useAcceptInvitation();

  if (preview.isPending || session.isPending || (authenticated && me.isPending)) {
    return (
      <AuthCard title="Your invitation">
        <p className="sr-only" role="status">
          Loading your invitation…
        </p>
        <div className="grid gap-3" aria-hidden="true">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-2 h-10 w-full" />
        </div>
      </AuthCard>
    );
  }

  const invite = preview.data;
  if (invite && invite.status !== "pending") {
    return (
      <AuthCard
        title={`Join ${invite.brand_name}`}
        description={`${CLOSED_MESSAGES[invite.status]} Ask ${invite.invited_by_name} to send you a new one if you still need access.`}
      >
        <Button asChild variant="outline" className="w-full">
          <Link href={routes.root}>Go to RetentionOS</Link>
        </Button>
      </AuthCard>
    );
  }

  const myEmail = me.data?.email?.toLowerCase();
  const wrongAccount = !!invite && !!myEmail && invite.email.toLowerCase() !== myEmail;

  async function switchAccount() {
    await logout().catch(() => undefined);
    queryClient.clear();
    router.push(withNext(routes.login, here));
  }

  return (
    <AuthCard
      title={invite ? `Join ${invite.brand_name} on RetentionOS` : "Join a brand on RetentionOS"}
      description={
        invite ? (
          <>
            {invite.invited_by_name} invited <strong className="break-all">{invite.email}</strong>{" "}
            to join as <strong>{roleLabel(invite.role)}</strong>.
            {isRole(invite.role) ? ` ${ROLE_DESCRIPTIONS[invite.role]}` : null}
          </>
        ) : null
      }
    >
      <div className="grid gap-4">
        {preview.isError ? (
          <Alert variant="warning">
            <TriangleAlert aria-hidden="true" />
            <AlertDescription className="text-text">
              We couldn&apos;t load the details of this invitation. You can still try to accept
              it.
            </AlertDescription>
          </Alert>
        ) : null}
        {invite ? (
          <p className="text-sm text-text-muted">
            The invitation expires on {formatDate(invite.expires_at)}.
          </p>
        ) : null}

        {authenticated ? (
          wrongAccount ? (
            <>
              <Alert variant="warning">
                <TriangleAlert aria-hidden="true" />
                <AlertDescription className="text-text">
                  You&apos;re logged in as <strong className="break-all">{me.data?.email}</strong>,
                  but this invitation was sent to{" "}
                  <strong className="break-all">{invite?.email}</strong>. Log in with that address
                  to accept it.
                </AlertDescription>
              </Alert>
              <Button onClick={switchAccount}>Log out and switch account</Button>
            </>
          ) : (
            <>
              {accept.isError ? <FormError message={errorMessage(accept.error)} /> : null}
              <Button
                onClick={() =>
                  accept.mutate(token, {
                    onSuccess: (brand) => router.replace(routes.brandHome(brand.id)),
                  })
                }
                disabled={accept.isPending || accept.isSuccess}
                aria-busy={accept.isPending}
              >
                {accept.isPending || accept.isSuccess
                  ? "Joining…"
                  : invite
                    ? `Accept and join ${invite.brand_name}`
                    : "Accept invitation"}
              </Button>
            </>
          )
        ) : (
          <>
            <Button asChild>
              <Link href={withNext(routes.login, here)}>Log in to accept</Link>
            </Button>
            <Button asChild variant="outline">
              <Link
                href={`${withNext(routes.signup, here)}${
                  invite ? `&email=${encodeURIComponent(invite.email)}` : ""
                }`}
              >
                Create an account
              </Link>
            </Button>
          </>
        )}
      </div>
    </AuthCard>
  );
}
