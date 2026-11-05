import { CircleCheck, CircleDot, Clock, Lock, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OnboardingStep } from "@/lib/queries";
import { cn } from "@/lib/utils";

type State = OnboardingStep["state"];

const STATE: Record<
  State,
  {
    label: string;
    icon: LucideIcon;
    iconClass: string;
    badge: "success" | "default" | "info" | "neutral";
  }
> = {
  done: { label: "Done", icon: CircleCheck, iconClass: "text-success", badge: "success" },
  current: { label: "Next step", icon: CircleDot, iconClass: "text-primary", badge: "default" },
  coming_next: { label: "Coming next", icon: Clock, iconClass: "text-info", badge: "info" },
  locked: { label: "Locked", icon: Lock, iconClass: "text-text-muted", badge: "neutral" },
};

/** Buttons for steps that will have an action. In M0 none of them can start yet. */
const STEP_ACTIONS: Record<string, { label: string; unavailable: string }> = {
  connect_store: {
    label: "Connect store",
    unavailable: "Connecting Shopify or uploading a CSV arrives in the next release.",
  },
};

/**
 * The Home setup checklist (M0 scope). Steps and their states come from
 * GET /api/v1/brands/{brand_id}/onboarding/; this component only displays them.
 * Each state has its own icon and text label, never colour alone (design.md §3.5).
 */
export function SetupChecklist({ steps }: { steps: readonly OnboardingStep[] }) {
  return (
    <ol className="grid gap-3" aria-label="Setup steps">
      {steps.map((step, index) => {
        const meta = STATE[step.state];
        const action = STEP_ACTIONS[step.key];
        const showAction = !!action && (step.state === "coming_next" || step.state === "current");
        const reasonId = `step-${step.key}-reason`;
        return (
          <li
            key={step.key}
            className={cn(
              "flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start",
              step.state === "coming_next" || step.state === "current"
                ? "border-primary/40 bg-surface"
                : "border-border/30 bg-surface",
              step.state === "locked" && "bg-bg",
            )}
          >
            <div className="flex flex-1 gap-3">
              <meta.icon
                aria-hidden="true"
                className={cn("mt-0.5 size-5 shrink-0", meta.iconClass)}
              />
              <div className="grid flex-1 gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className={cn(
                      "text-sm font-semibold",
                      step.state === "locked" && "text-text-muted",
                    )}
                  >
                    <span className="sr-only">Step {index + 1}:</span> {step.title}
                  </h3>
                  <Badge variant={meta.badge}>{meta.label}</Badge>
                </div>
                <p className="text-sm text-text-muted">{step.description}</p>
              </div>
            </div>
            {showAction ? (
              <div className="grid gap-1 sm:max-w-56 sm:justify-items-end sm:text-right">
                <Button disabled aria-describedby={reasonId} className="w-full sm:w-auto">
                  {action.label}
                </Button>
                <p id={reasonId} className="text-xs text-text-muted">
                  {action.unavailable}
                </p>
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
