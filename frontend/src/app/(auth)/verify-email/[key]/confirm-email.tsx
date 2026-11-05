"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/api/errors";
import { decodeKey, getEmailVerification, verifyEmail } from "@/lib/auth/allauth";
import { consumeReturnTo } from "@/lib/auth/return-to";
import { routes } from "@/lib/routes";

/**
 * Opened from the link in the confirmation email. Confirming needs a click (not an
 * automatic request), so email scanners that open links can't confirm on someone's behalf.
 */
export function ConfirmEmail({ rawKey }: { rawKey: string }) {
  const key = decodeKey(rawKey);
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirm = useMutation({
    mutationFn: () => verifyEmail(key),
    onSuccess: (state) => {
      if (state.status === "authenticated") {
        queryClient.clear();
        router.replace(consumeReturnTo() ?? routes.root);
      }
    },
  });

  const info = useQuery({
    queryKey: ["auth", "email-verification", key],
    queryFn: () => getEmailVerification(key),
    retry: false,
    refetchOnWindowFocus: false,
    // Once confirmed, the key is used up: never ask about it again.
    enabled: confirm.isIdle || confirm.isError,
  });

  if (confirm.data?.status === "authenticated") {
    return (
      <AuthCard title="Your email is confirmed" description="Taking you to RetentionOS…">
        <p className="sr-only" role="status">
          Email confirmed. Opening RetentionOS…
        </p>
      </AuthCard>
    );
  }

  if (confirm.data?.status === "unauthenticated") {
    return (
      <AuthCard title="Your email is confirmed" description="Log in to carry on setting up.">
        <Button asChild className="w-full">
          <Link href={routes.login}>Log in</Link>
        </Button>
      </AuthCard>
    );
  }

  if (info.isPending) {
    return (
      <AuthCard title="Confirm your email">
        <p className="sr-only" role="status">
          Checking your link…
        </p>
        <div className="grid gap-3" aria-hidden="true">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      </AuthCard>
    );
  }

  if (info.isError) {
    return (
      <AuthCard title="This link doesn't work any more" description={errorMessage(info.error)}>
        <div className="grid gap-3 text-sm">
          <p>
            Log in with your email and password. If your email still needs confirming, we&apos;ll
            send you a fresh link.
          </p>
          <Button asChild>
            <Link href={routes.login}>Log in</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Confirm your email"
      description={
        <>
          Confirm that <strong className="break-all text-text">{info.data.email}</strong> is your
          email address.
        </>
      }
    >
      <div className="grid gap-4">
        {confirm.isError ? <FormError message={errorMessage(confirm.error)} /> : null}
        <Button
          onClick={() => confirm.mutate()}
          disabled={confirm.isPending || confirm.isSuccess}
          aria-busy={confirm.isPending}
        >
          {confirm.isPending || confirm.isSuccess ? "Confirming…" : "Confirm my email"}
        </Button>
      </div>
    </AuthCard>
  );
}
