"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { errorMessage, isApiError } from "@/lib/api/errors";
import { authenticateMfa } from "@/lib/auth/allauth";
import { consumeReturnTo, safeNextPath, withNext } from "@/lib/auth/return-to";
import { routes } from "@/lib/routes";

/** Step two of logging in: a code from the authenticator app, or a recovery code. */
export function MfaChallengeForm({ next }: { next: string | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const safeNext = safeNextPath(next);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [code, setCode] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldError(null);
    setFormError(null);
    const cleaned = code.replace(/\s+/g, "");
    if (!useRecoveryCode && !/^\d{6}$/.test(cleaned)) {
      setFieldError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    if (useRecoveryCode && cleaned.length === 0) {
      setFieldError("Enter one of your recovery codes.");
      return;
    }
    setSubmitting(true);
    try {
      const state = await authenticateMfa(cleaned);
      if (state.status === "authenticated") {
        queryClient.clear();
        router.replace(safeNext ?? consumeReturnTo() ?? routes.root);
        return;
      }
      setExpired(true);
      setFormError("Your log-in timed out. Please log in again.");
    } catch (error) {
      if (isApiError(error, "no_pending_login")) {
        setExpired(true);
        setFormError(error.message);
      } else if (isApiError(error) && error.status === 400) {
        setFieldError(
          useRecoveryCode
            ? "That recovery code didn't work. Check it, or try another one."
            : "That code didn't work. Codes change every 30 seconds: try the newest one.",
        );
      } else {
        setFormError(errorMessage(error));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Enter your 2-step login code"
      description={
        useRecoveryCode
          ? "Type one of the recovery codes you saved when you set up 2-step login. Each code works once."
          : "Open your authenticator app and type the 6-digit code it shows for RetentionOS."
      }
      footer={
        <Link className="font-medium text-primary underline" href={withNext(routes.login, safeNext)}>
          Back to log in
        </Link>
      }
    >
      <form className="grid gap-5" onSubmit={onSubmit} noValidate>
        <FormError message={formError} />
        {expired ? (
          <Button asChild variant="outline">
            <Link href={withNext(routes.login, safeNext)}>Log in again</Link>
          </Button>
        ) : null}
        <Field
          id="code"
          label={useRecoveryCode ? "Recovery code" : "6-digit code"}
          error={fieldError ?? undefined}
        >
          {(control) => (
            <Input
              {...control}
              name="code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoComplete="one-time-code"
              inputMode={useRecoveryCode ? "text" : "numeric"}
              autoCapitalize="none"
              spellCheck={false}
              className="font-mono tracking-widest"
            />
          )}
        </Field>
        <Button type="submit" disabled={submitting} aria-busy={submitting}>
          {submitting ? "Checking…" : "Log in"}
        </Button>
        <Button
          type="button"
          variant="link"
          className="h-auto justify-self-center p-0"
          onClick={() => {
            setUseRecoveryCode((v) => !v);
            setCode("");
            setFieldError(null);
          }}
        >
          {useRecoveryCode ? "Use my authenticator app instead" : "Use a recovery code instead"}
        </Button>
      </form>
    </AuthCard>
  );
}
