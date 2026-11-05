"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/mini";

import { AuthCard } from "@/components/auth/auth-card";
import { PasswordInput } from "@/components/auth/password-input";
import { useRedirectIfAuthenticated } from "@/components/auth/use-redirect-if-authenticated";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { errorMessage, isApiError } from "@/lib/api/errors";
import { signup } from "@/lib/auth/allauth";
import { saveReturnTo, safeNextPath, withNext } from "@/lib/auth/return-to";
import { routes } from "@/lib/routes";
import { emailSchema, newPasswordSchema, PASSWORD_MIN_LENGTH } from "@/lib/validation";

const schema = z.object({ email: emailSchema, password: newPasswordSchema });

export function SignupForm({ next, email }: { next: string | null; email: string | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const safeNext = safeNextPath(next);
  const [leaving, setLeaving] = useState(false);
  useRedirectIfAuthenticated(safeNext, leaving);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { email: email ?? "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: z.output<typeof schema>) {
    setFormError(null);
    try {
      const state = await signup(values.email, values.password);
      // The email link may open in another tab: remember where they were heading.
      if (safeNext) saveReturnTo(safeNext);
      setLeaving(true);
      queryClient.clear();
      if (state.status === "authenticated") {
        router.replace(safeNext ?? routes.root);
      } else if (state.pendingFlow === "verify_email") {
        router.push(`${routes.verifyEmail}?email=${encodeURIComponent(values.email)}`);
      } else {
        router.push(withNext(routes.login, safeNext));
      }
    } catch (error) {
      if (isApiError(error)) {
        const emailError = error.field("email");
        const passwordError = error.field("password");
        if (emailError) form.setError("email", { message: emailError });
        if (passwordError) form.setError("password", { message: passwordError });
        if (!emailError && !passwordError) setFormError(error.message);
      } else {
        setFormError(errorMessage(error));
      }
    }
  }

  return (
    <AuthCard
      title="Create your RetentionOS account"
      description="Start with your email. You'll set up your brand next."
      footer={
        <>
          Already have an account?{" "}
          <Link
            className="font-medium text-primary underline"
            href={withNext(routes.login, safeNext)}
          >
            Log in
          </Link>
        </>
      }
    >
      <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FormError message={formError} />
        <Field id="email" label="Work email" error={errors.email?.message}>
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
        <Field
          id="password"
          label="Password"
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
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "Creating your account…" : "Create account"}
        </Button>
      </form>
    </AuthCard>
  );
}
