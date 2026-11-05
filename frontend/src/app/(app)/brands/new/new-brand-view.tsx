"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { useCurrentMe } from "@/components/auth/auth-gate";
import { FormError } from "@/components/form-error";
import { SimpleShell } from "@/components/shell/simple-shell";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { errorMessage, isApiError } from "@/lib/api/errors";
import { DEFAULT_TIMEZONE, formatTimezoneName } from "@/lib/format";
import { useBrands, useCreateBrand } from "@/lib/queries";
import { routes } from "@/lib/routes";
import { brandNameSchema } from "@/lib/validation";

const schema = z.object({ name: brandNameSchema, timezone: z.string().min(1) });

function timezoneOptions(): string[] {
  let zones: string[] = [];
  try {
    zones = Intl.supportedValuesOf("timeZone");
  } catch {
    zones = [];
  }
  // Some browsers list India as the old name "Asia/Calcutta"; we always store Asia/Kolkata.
  const set = new Set(zones.filter((z) => z !== "Asia/Calcutta"));
  set.add(DEFAULT_TIMEZONE);
  return [...set].sort();
}

export function NewBrandView() {
  const me = useCurrentMe();
  const router = useRouter();
  const brands = useBrands();
  const createBrand = useCreateBrand();
  const [customise, setCustomise] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const zones = useMemo(() => timezoneOptions(), []);
  const form = useForm({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { name: "", timezone: DEFAULT_TIMEZONE },
  });
  const { errors, isSubmitting } = form.formState;
  const timezone = useWatch({ control: form.control, name: "timezone" });
  const hasBrands = (brands.data?.length ?? 0) > 0;

  async function onSubmit(values: z.output<typeof schema>) {
    setFormError(null);
    try {
      const brand = await createBrand.mutateAsync(values);
      router.replace(routes.brandHome(brand.id));
    } catch (error) {
      if (isApiError(error) && (error.field("name") || error.field("timezone"))) {
        const nameError = error.field("name");
        const tzError = error.field("timezone");
        if (nameError) form.setError("name", { message: nameError });
        if (tzError) {
          setCustomise(true);
          form.setError("timezone", { message: tzError });
        }
      } else {
        setFormError(errorMessage(error));
      }
    }
  }

  return (
    <SimpleShell me={me}>
      <div className="grid gap-6">
        <div className="grid gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Create your brand</h1>
          <p className="text-sm text-text-muted">
            This is the business RetentionOS will learn from. You&apos;ll connect your store
            after this.
          </p>
        </div>
        <form
          className="grid gap-5 rounded-lg border border-border/40 bg-surface p-6 shadow-sm"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          <FormError message={formError} />
          <Field
            id="name"
            label="Brand name"
            description="The name your customers know you by."
            error={errors.name?.message}
          >
            {(control) => (
              <Input {...control} autoComplete="organization" {...form.register("name")} />
            )}
          </Field>

          {customise ? (
            <Field
              id="timezone"
              label="Time zone"
              description="Used for daily reports and message timing."
              error={errors.timezone?.message}
            >
              {(control) => (
                <NativeSelect {...control} {...form.register("timezone")}>
                  {zones.map((zone) => (
                    <option key={zone} value={zone}>
                      {formatTimezoneName(zone)}
                    </option>
                  ))}
                </NativeSelect>
              )}
            </Field>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-bg px-3 py-2 text-sm">
              <p>
                <span className="text-text-muted">Time zone:</span>{" "}
                {timezone === DEFAULT_TIMEZONE ? "India (IST)" : formatTimezoneName(timezone)}
                <span className="text-text-muted"> · Currency: Indian rupee (₹)</span>
              </p>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0"
                onClick={() => setCustomise(true)}
              >
                Change time zone
              </Button>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {hasBrands ? (
              <Button asChild variant="outline">
                <Link href={routes.root}>Cancel</Link>
              </Button>
            ) : null}
            <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting ? "Creating your brand…" : "Create brand"}
            </Button>
          </div>
        </form>
      </div>
    </SimpleShell>
  );
}
