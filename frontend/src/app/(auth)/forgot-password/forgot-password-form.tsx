"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthCard } from "@/components/auth/auth-card";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { errorMessage, isApiError } from "@/lib/api/errors";
import { requestPasswordReset } from "@/lib/auth/allauth";
import { routes } from "@/lib/routes";
import { emailSchema } from "@/lib/validation";

const schema = z.object({ email: emailSchema });

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { email: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: z.output<typeof schema>) {
    setFormError(null);
    try {
      await requestPasswordReset(values.email);
      setSentTo(values.email);
    } catch (error) {
      const emailError = isApiError(error) ? error.field("email") : undefined;
      if (emailError) form.setError("email", { message: emailError });
      else setFormError(errorMessage(error));
    }
  }

  const footer = (
    <>
      Remembered it?{" "}
      <Link className="font-medium text-primary underline" href={routes.login}>
        Log in
      </Link>
    </>
  );

  if (sentTo) {
    return (
      <AuthCard title="Check your inbox" footer={footer}>
        <div className="flex gap-3 text-sm" role="status">
          <MailCheck aria-hidden="true" className="size-5 shrink-0 text-primary" />
          <p>
            If there&apos;s an account for <strong className="break-all">{sentTo}</strong>,
            we&apos;ve sent it a link to choose a new password. It can take a minute to arrive.
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      description="Enter the email you use for RetentionOS. We'll send you a link to choose a new password."
      footer={footer}
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
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthCard>
  );
}
