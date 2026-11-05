"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthCard } from "@/components/auth/auth-card";
import { PasswordInput } from "@/components/auth/password-input";
import { useRedirectIfAuthenticated } from "@/components/auth/use-redirect-if-authenticated";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { errorMessage, isApiError } from "@/lib/api/errors";
import { login } from "@/lib/auth/allauth";
import { consumeReturnTo, safeNextPath, withNext } from "@/lib/auth/return-to";
import { routes } from "@/lib/routes";
import { emailSchema } from "@/lib/validation";

const schema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Enter your password." }),
});

export function LoginForm({ next }: { next: string | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const safeNext = safeNextPath(next);
  useRedirectIfAuthenticated(safeNext);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: z.output<typeof schema>) {
    setFormError(null);
    try {
      const state = await login(values.email, values.password);
      queryClient.clear();
      if (state.status === "authenticated") {
        router.replace(safeNext ?? consumeReturnTo() ?? routes.root);
      } else if (state.pendingFlow === "mfa_authenticate") {
        router.push(withNext(routes.mfaChallenge, safeNext));
      } else if (state.pendingFlow === "verify_email") {
        // allauth has just sent a fresh confirmation link.
        router.push(`${routes.verifyEmail}?email=${encodeURIComponent(values.email)}`);
      } else {
        setFormError("We couldn't log you in. Please try again.");
      }
    } catch (error) {
      // Never say which part was wrong (protects accounts from guessing).
      setFormError(isApiError(error) ? error.message : errorMessage(error));
    }
  }

  return (
    <AuthCard
      title="Log in to RetentionOS"
      footer={
        <>
          New to RetentionOS?{" "}
          <Link
            className="font-medium text-primary underline"
            href={withNext(routes.signup, safeNext)}
          >
            Create an account
          </Link>
        </>
      }
    >
      <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FormError message={formError} />
        <Field id="email" label="Email" error={errors.email?.message}>
          {(control) => (
            <Input
              {...control}
              type="email"
              autoComplete="email"
              inputMode="email"
              {...form.register("email")}
            />
          )}
        </Field>
        <Field id="password" label="Password" error={errors.password?.message}>
          {(control) => (
            <PasswordInput
              {...control}
              autoComplete="current-password"
              {...form.register("password")}
            />
          )}
        </Field>
        <div className="-mt-2 text-right text-sm">
          <Link className="font-medium text-primary underline" href={routes.forgotPassword}>
            Forgot your password?
          </Link>
        </div>
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </AuthCard>
  );
}
