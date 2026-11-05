"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { errorMessage, isApiError } from "@/lib/api/errors";
import { assignableRoles, ROLE_DESCRIPTIONS, ROLE_LABELS, type Role } from "@/lib/roles";
import { emailSchema } from "@/lib/validation";

const roleSchema = z.enum(["owner", "admin", "marketer", "viewer"]);
const schema = z.object({ email: emailSchema, role: roleSchema });

export type InviteValues = z.output<typeof schema>;

/**
 * Invite a teammate by email (Owner/Admin only). Only an Owner can invite another Owner.
 * Defaults to Viewer: the smallest access, which an Owner or Admin can raise later.
 */
export function InviteForm({
  myRole,
  onInvite,
}: {
  myRole: Role;
  onInvite: (values: InviteValues) => Promise<unknown>;
}) {
  const roles = assignableRoles(myRole);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(
      schema.refine((v) => roles.includes(v.role), {
        path: ["role"],
        error: "Pick a role you're allowed to give.",
      }),
    ),
    mode: "onBlur",
    defaultValues: { email: "", role: "viewer" as Role },
  });
  const { errors, isSubmitting } = form.formState;
  const role = useWatch({ control: form.control, name: "role" });

  async function onSubmit(values: InviteValues) {
    setFormError(null);
    setSentTo(null);
    try {
      await onInvite(values);
      setSentTo(values.email);
      form.reset({ email: "", role: values.role });
    } catch (error) {
      if (isApiError(error) && (error.field("email") || error.field("role"))) {
        const emailError = error.field("email");
        const roleError = error.field("role");
        if (emailError) form.setError("email", { message: emailError });
        if (roleError) form.setError("role", { message: roleError });
      } else {
        setFormError(errorMessage(error));
      }
    }
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FormError message={formError} />
      <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Field id="invite-email" label="Email address" error={errors.email?.message}>
          {(control) => (
            <Input
              {...control}
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder="name@yourbrand.com"
              {...form.register("email")}
            />
          )}
        </Field>
        <Field id="invite-role" label="Role" error={errors.role?.message}>
          {(control) => (
            <NativeSelect {...control} {...form.register("role")}>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>
      </div>
      <p className="text-sm text-text-muted">
        <span className="font-medium text-text">{ROLE_LABELS[role] ?? "Role"}:</span>{" "}
        {ROLE_DESCRIPTIONS[role]}
      </p>
      <div aria-live="polite">
        {sentTo ? (
          <p className="text-sm font-medium text-success">
            Invitation sent to {sentTo}. The link in the email works for 7 days.
          </p>
        ) : null}
      </div>
      <div>
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send invitation"}
        </Button>
      </div>
    </form>
  );
}
