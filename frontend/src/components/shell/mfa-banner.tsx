"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { components } from "@/lib/api/schema";
import { formatDateTime } from "@/lib/format";

type MfaStatus = components["schemas"]["MfaStatus"];

/** What the 2-step login policy (D-039) means for this person right now. */
export function mfaNotice(mfa: MfaStatus): "blocked" | "reminder" | "none" {
  if (mfa.blocked) return "blocked";
  if (mfa.required && !mfa.enabled && mfa.deadline) return "reminder";
  return "none";
}

/** Reminder before the deadline. After it, the app routes to the setup screen instead. */
export function MfaBanner({
  mfa,
  timeZone,
  setupHref,
}: {
  mfa: MfaStatus;
  timeZone: string;
  setupHref: string;
}) {
  if (mfaNotice(mfa) !== "reminder" || !mfa.deadline) return null;
  return (
    <div
      role="region"
      aria-label="2-step login reminder"
      className="border-b border-warning/40 bg-warning/5"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 text-sm sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <ShieldAlert aria-hidden="true" className="size-5 shrink-0 text-warning" />
        <p className="flex-1">
          <strong>Set up 2-step login by {formatDateTime(mfa.deadline, timeZone)}.</strong> After
          that, you&apos;ll need it to keep using RetentionOS. It takes about 2 minutes.
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href={setupHref}>Set up now</Link>
        </Button>
      </div>
    </div>
  );
}
