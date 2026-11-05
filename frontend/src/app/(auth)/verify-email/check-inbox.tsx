"use client";

import { useMutation } from "@tanstack/react-query";
import { MailCheck } from "lucide-react";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api/errors";
import { resendVerificationEmail } from "@/lib/auth/allauth";
import { routes } from "@/lib/routes";

export function CheckInbox({ email }: { email: string | null }) {
  const resend = useMutation({ mutationFn: resendVerificationEmail });

  return (
    <AuthCard
      title="Check your inbox"
      footer={
        <>
          Wrong email address?{" "}
          <Link className="font-medium text-primary underline" href={routes.signup}>
            Sign up again
          </Link>
        </>
      }
    >
      <div className="grid gap-5 text-sm">
        <div className="flex gap-3">
          <MailCheck aria-hidden="true" className="size-5 shrink-0 text-primary" />
          <p>
            We&apos;ve sent a confirmation link to{" "}
            {email ? <strong className="break-all">{email}</strong> : "your email address"}.
            Click it to finish creating your account.
          </p>
        </div>
        <p className="text-text-muted">
          Can&apos;t find it? It can take a minute to arrive. Check your spam folder too.
        </p>
        <div aria-live="polite" className="grid gap-3">
          {resend.data === "sent" ? (
            <p className="font-medium text-success">Sent again. Check your inbox.</p>
          ) : null}
          {resend.data === "no_pending_signup" ? (
            <p>
              We can&apos;t resend it from this page any more.{" "}
              <Link className="font-medium text-primary underline" href={routes.login}>
                Log in
              </Link>{" "}
              with your email and password and we&apos;ll send a fresh link.
            </p>
          ) : null}
          {resend.isError ? <FormError message={errorMessage(resend.error)} /> : null}
        </div>
        <Button
          variant="outline"
          onClick={() => resend.mutate()}
          disabled={resend.isPending}
          aria-busy={resend.isPending}
        >
          {resend.isPending ? "Sending…" : "Send the email again"}
        </Button>
      </div>
    </AuthCard>
  );
}
