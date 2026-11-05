"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/mini";

import { AuthCard } from "@/components/auth/auth-card";
import { PasswordInput } from "@/components/auth/password-input";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage, isApiError } from "@/lib/api/errors";
import { checkPasswordResetKey, decodeKey, resetPassword } from "@/lib/auth/allauth";
import { routes } from "@/lib/routes";
import { newPasswordSchema, PASSWORD_MIN_LENGTH } from "@/lib/validation";

const schema = z.object({ password: newPasswordSchema, confirm: z.string() }).check(
  z.refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    error: "The two passwords don't match.",
  }),
);

export function ResetPasswordForm({ rawKey }: { rawKey: string }) {
  const key = decodeKey(rawKey);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const check = useQuery({
    queryKey: ["auth", "password-reset", key],
    queryFn: () => checkPasswordResetKey(key).then(() => true),
    retry: false,
    refetchOnWindowFocus: false,
    // Once the password is changed the key is used up: never ask about it again.
    enabled: !done,
  });
  const form = useForm({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { password: "", confirm: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: z.output<typeof schema>) {
    setFormError(null);
    try {
      const state = await resetPassword(key, values.password);
      setDone(true);
      if (state.status === "authenticated") {
        queryClient.clear();
        router.replace(routes.root);
      } else if (state.pendingFlow === "mfa_authenticate") {
        router.replace(routes.mfaChallenge);
      }
    } catch (error) {
      if (isApiError(error, "invalid_link")) {
        setFormError(error.message);
        return;
      }
      const passwordError = isApiError(error) ? error.field("password") : undefined;
      if (passwordError) form.setError("password", { message: passwordError });
      else setFormError(errorMessage(error));
    }
  }

  if (done) {
    return (
      <AuthCard
        title="Your password is changed"
        description="Log in with your new password to carry on."
      >
        <Button asChild className="w-full">
          <Link href={routes.login}>Log in</Link>
        </Button>
      </AuthCard>
    );
  }

  if (check.isPending) {
    return (
      <AuthCard title="Choose a new password">
        <p className="sr-only" role="status">
          Checking your link…
        </p>
        <div className="grid gap-3" aria-hidden="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </AuthCard>
    );
  }

  if (check.isError) {
    return (
      <AuthCard title="This link doesn't work any more" description={errorMessage(check.error)}>
        <Button asChild className="w-full">
          <Link href={routes.forgotPassword}>Send me a new link</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password">
      <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FormError message={formError} />
        <Field
          id="password"
          label="New password"
          description={`At least ${PASSWORD_MIN_LENGTH} characters. Avoid common passwords.`}
          error={errors.password?.message}
        >
          {(control) => (
            <PasswordInput
              {...control}
              autoComplete="new-password"
              {...form.register("password")}
            />
          )}
        </Field>
        <Field id="confirm" label="Type it again" error={errors.confirm?.message}>
          {(control) => (
            <PasswordInput {...control} autoComplete="new-password" {...form.register("confirm")} />
          )}
        </Field>
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </AuthCard>
  );
}
