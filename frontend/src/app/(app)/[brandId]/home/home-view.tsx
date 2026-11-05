"use client";

import { Lightbulb } from "lucide-react";

import { useCurrentMe } from "@/components/auth/auth-gate";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { SetupChecklist } from "@/components/home/setup-checklist";
import { useCurrentBrand } from "@/components/shell/brand-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_TIMEZONE, formatLongDate, partOfDay } from "@/lib/format";
import { useOnboarding } from "@/lib/queries";

/** Home in M0: greeting + the setup checklist (design.md §4.1 arrives with data, M2+). */
export function HomeView() {
  const brand = useCurrentBrand();
  const me = useCurrentMe();
  const onboarding = useOnboarding(brand.id);
  const timeZone = brand.timezone ?? DEFAULT_TIMEZONE;
  const now = new Date();
  const firstName = me.full_name?.trim().split(/\s+/)[0];
  const steps = onboarding.data?.steps ?? [];
  const doneCount = steps.filter((step) => step.state === "done").length;

  return (
    <div className="grid gap-8">
      <header className="grid gap-1">
        <p className="text-sm text-text-muted">
          {formatLongDate(now, timeZone)} · {brand.name}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Good {partOfDay(now, timeZone)}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-sm text-text-muted">
          Let&apos;s finish setting up {brand.name}. Here&apos;s what&apos;s done and what comes
          next.
        </p>
      </header>

      <section aria-labelledby="setup-heading">
        <Card>
          <CardHeader>
            <CardTitle id="setup-heading">Set up RetentionOS</CardTitle>
            <CardDescription>
              {onboarding.data
                ? `${doneCount} of ${steps.length} steps done`
                : "Your path to the first campaign."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {onboarding.isPending ? (
              <div className="grid gap-3" aria-busy="true">
                <p className="sr-only" role="status">
                  Loading your setup checklist…
                </p>
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : onboarding.isError ? (
              <ErrorState
                title="We couldn't load your setup checklist"
                error={onboarding.error}
                onRetry={() => void onboarding.refetch()}
              />
            ) : (
              <SetupChecklist steps={steps} />
            )}
          </CardContent>
        </Card>
      </section>

      <section aria-label="Opportunities">
        <EmptyState
          icon={Lightbulb}
          title="Your first opportunities will appear here"
          description="Once your store is connected and your orders are imported, Home shows who to message today, why, and when."
        />
      </section>
    </div>
  );
}
