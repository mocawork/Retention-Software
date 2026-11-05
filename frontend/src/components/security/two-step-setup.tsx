"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck, Copy, ExternalLink, Smartphone } from "lucide-react";
import { useState, type FormEvent } from "react";

import { ErrorState } from "@/components/error-state";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage, isApiError } from "@/lib/api/errors";
import {
  activateTotp,
  getRecoveryCodes,
  getTotp,
  REAUTH_REQUIRED,
  type RecoveryCodes,
} from "@/lib/auth/allauth";
import { queryKeys } from "@/lib/queries";

import { ReauthForm } from "./reauth-form";
import { RecoveryCodeList } from "./recovery-codes";

type Step = "scan" | "reauth" | "codes";

/** "JBSWY3DPEHPK3PXP" → "JBSW Y3DP EHPK 3PXP" (easier to type into an app). */
export function groupSecret(secret: string): string {
  return secret.replace(/\s+/g, "").replace(/(.{4})(?=.)/g, "$1 ");
}

/**
 * Turns on TOTP 2-step login (allauth headless): show the secret, confirm a code,
 * then show the recovery codes allauth creates. A QR code needs a library that isn't
 * approved yet (R-5), so for now we offer the setup key and an "open in app" link.
 */
export function TwoStepSetup({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("scan");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [codes, setCodes] = useState<RecoveryCodes | null>(null);
  const [copied, setCopied] = useState(false);

  // Each GET makes allauth issue a new secret, so fetch it exactly once.
  const totp = useQuery({
    queryKey: queryKeys.totp,
    queryFn: getTotp,
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  async function finishActivation() {
    await activateTotp(code.replace(/\s+/g, ""));
    await queryClient.invalidateQueries({ queryKey: queryKeys.me });
    try {
      setCodes(await getRecoveryCodes());
    } catch {
      setCodes(null);
    }
    setStep("codes");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setCodeError(null);
    setFormError(null);
    if (!/^\d{6}$/.test(code.replace(/\s+/g, ""))) {
      setCodeError("Enter the 6-digit code your authenticator app shows.");
      return;
    }
    setSubmitting(true);
    try {
      await finishActivation();
    } catch (error) {
      handleActivationError(error);
    } finally {
      setSubmitting(false);
    }
  }

  function handleActivationError(error: unknown) {
    if (isApiError(error, REAUTH_REQUIRED)) {
      setStep("reauth");
    } else if (isApiError(error) && error.status === 400) {
      setStep("scan");
      setCodeError("That code didn't work. Codes change every 30 seconds: try the newest one.");
    } else {
      setStep("scan");
      setFormError(errorMessage(error));
    }
  }

  if (step === "codes") {
    return (
      <div className="grid gap-5">
        <p className="flex items-center gap-2 font-medium text-success">
          <CircleCheck aria-hidden="true" className="size-5" />
          2-step login is on.
        </p>
        {codes?.codes?.length ? (
          <>
            <div className="grid gap-1 text-sm">
              <p className="font-medium">Save your recovery codes</p>
              <p className="text-text-muted">
                If you lose your phone, each of these codes lets you log in once. Keep them
                somewhere safe, like a password manager. You won&apos;t see them again here.
              </p>
            </div>
            <RecoveryCodeList codes={codes.codes} />
          </>
        ) : (
          <p className="text-sm text-text-muted">
            You can see and renew your recovery codes in Settings → Security.
          </p>
        )}
        <div>
          <Button onClick={onDone}>
            {codes?.codes?.length ? "I've saved my codes" : "Continue"}
          </Button>
        </div>
      </div>
    );
  }

  if (step === "reauth") {
    return (
      <ReauthForm
        onCancel={() => setStep("scan")}
        onSuccess={async () => {
          try {
            await finishActivation();
          } catch (error) {
            handleActivationError(error);
          }
        }}
      />
    );
  }

  if (totp.isPending) {
    return (
      <div className="grid gap-3" aria-busy="true">
        <p className="sr-only" role="status">
          Preparing your setup key…
        </p>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-40" />
      </div>
    );
  }

  if (totp.isError) {
    return (
      <ErrorState
        title="We couldn't start the setup"
        error={totp.error}
        onRetry={() => void totp.refetch()}
      />
    );
  }

  if (totp.data.status === "active") {
    return (
      <div className="grid gap-4">
        <p className="flex items-center gap-2 font-medium text-success">
          <CircleCheck aria-hidden="true" className="size-5" />
          2-step login is already on.
        </p>
        <div>
          <Button onClick={onDone}>Continue</Button>
        </div>
      </div>
    );
  }

  const { secret, totpUrl } = totp.data;

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <form className="grid gap-6" onSubmit={submit} noValidate>
      <ol className="grid gap-5 text-sm">
        <li className="grid gap-1">
          <p className="font-medium">1. Get an authenticator app</p>
          <p className="text-text-muted">
            Any app works, for example Google Authenticator, Microsoft Authenticator or 1Password.
          </p>
        </li>
        <li className="grid gap-3">
          <p className="font-medium">2. Add RetentionOS to the app</p>
          <p className="text-text-muted">
            On your phone, tap the button below. On a computer, choose &quot;Enter a setup
            key&quot; in the app and type this key:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded-md border border-border/40 bg-bg px-3 py-2 font-mono text-base tracking-wider break-all">
              {groupSecret(secret)}
            </code>
            <Button type="button" variant="outline" size="sm" onClick={copySecret}>
              <Copy aria-hidden="true" />
              {copied ? "Copied" : "Copy key"}
            </Button>
          </div>
          {totpUrl ? (
            <div>
              <Button asChild variant="outline" size="sm">
                <a href={totpUrl}>
                  <Smartphone aria-hidden="true" />
                  Open in authenticator app
                  <ExternalLink aria-hidden="true" />
                </a>
              </Button>
            </div>
          ) : null}
        </li>
        <li className="grid gap-3">
          <p className="font-medium">3. Enter the 6-digit code the app shows</p>
          <FormError message={formError} />
          <Field id="totp-code" label="6-digit code" error={codeError ?? undefined}>
            {(control) => (
              <Input
                {...control}
                name="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="max-w-48 font-mono tracking-widest"
              />
            )}
          </Field>
        </li>
      </ol>
      <p className="sr-only" aria-live="polite">
        {copied ? "Setup key copied." : ""}
      </p>
      <div>
        <Button type="submit" disabled={submitting} aria-busy={submitting}>
          {submitting ? "Checking…" : "Turn on 2-step login"}
        </Button>
      </div>
    </form>
  );
}
