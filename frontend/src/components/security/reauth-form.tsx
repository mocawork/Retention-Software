"use client";

import { useState, type FormEvent } from "react";

import { PasswordInput } from "@/components/auth/password-input";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { errorMessage, isApiError } from "@/lib/api/errors";
import { reauthenticate } from "@/lib/auth/allauth";

/** allauth asks for the password again before sensitive changes (after ~5 minutes). */
export function ReauthForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void | Promise<void>;
  onCancel?: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await reauthenticate(password);
      await onSuccess();
    } catch (err) {
      setError(
        isApiError(err) && err.status === 400
          ? "That password isn't right. Try again."
          : errorMessage(err),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submit} noValidate>
      <p className="text-sm">For your security, please enter your password again.</p>
      <FormError message={error} />
      <Field id="reauth-password" label="Password">
        {(control) => (
          <PasswordInput
            {...control}
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}
      </Field>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? "Checking…" : "Confirm password"}
        </Button>
      </div>
    </form>
  );
}
