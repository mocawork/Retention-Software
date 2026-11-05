"use client";

import { ShieldCheck, ShieldOff } from "lucide-react";
import { useState } from "react";

import { useCurrentMe } from "@/components/auth/auth-gate";
import { ErrorState } from "@/components/error-state";
import { RecoveryCodesSection } from "@/components/security/recovery-codes-section";
import { TwoStepSetup } from "@/components/security/two-step-setup";
import { useCurrentBrand } from "@/components/shell/brand-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_TIMEZONE, formatDateTime } from "@/lib/format";
import { useSecurityEvents } from "@/lib/queries";

/**
 * Labels for security event codes. TODO(M0): align with the backend's final action
 * names when GET /api/v1/me/security-events/ lands in backend/openapi.json.
 */
const EVENT_LABELS: Record<string, string> = {
  "auth.login": "Logged in",
  "auth.logout": "Logged out",
  "auth.login_failed": "Failed log-in attempt",
  "auth.password_changed": "Password changed",
  "auth.password_reset": "Password reset",
  "mfa.totp_activated": "2-step login turned on",
  "mfa.totp_deactivated": "2-step login turned off",
  "mfa.recovery_codes_generated": "New recovery codes made",
  "mfa.recovery_code_used": "Recovery code used to log in",
};

export function eventLabel(action: string): string {
  const known = EVENT_LABELS[action];
  if (known) return known;
  const words = action.replace(/[._]+/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "Account activity";
}

export function SecurityView() {
  const me = useCurrentMe();
  const brand = useCurrentBrand();
  const timeZone = brand.timezone ?? DEFAULT_TIMEZONE;
  const [settingUp, setSettingUp] = useState(false);
  const { enabled, required, deadline } = me.mfa;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>2-step login</CardTitle>
            {enabled ? (
              <Badge variant="success">
                <ShieldCheck aria-hidden="true" />
                On
              </Badge>
            ) : (
              <Badge variant={required ? "warning" : "neutral"}>
                <ShieldOff aria-hidden="true" />
                Off
              </Badge>
            )}
          </div>
          <CardDescription>
            {enabled
              ? "Each time you log in, you also enter a code from your authenticator app."
              : "Protect your account with a code from an app on your phone, as well as your password."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {!enabled && required && deadline ? (
            <p className="text-sm">
              Your account needs 2-step login. Set it up by{" "}
              <strong>{formatDateTime(deadline, timeZone)}</strong> to keep using RetentionOS.
            </p>
          ) : null}
          {enabled ? (
            <RecoveryCodesSection />
          ) : settingUp ? (
            <TwoStepSetup onDone={() => setSettingUp(false)} />
          ) : (
            <div>
              <Button onClick={() => setSettingUp(true)}>Set up 2-step login</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent security activity</CardTitle>
          <CardDescription>Log-ins and changes to your account security.</CardDescription>
        </CardHeader>
        <CardContent>
          <SecurityEvents timeZone={timeZone} />
        </CardContent>
      </Card>
    </div>
  );
}

/** TODO(M0): uses the pending contract (src/lib/api/pending-contract.ts). */
function SecurityEvents({ timeZone }: { timeZone: string }) {
  const events = useSecurityEvents();
  if (events.isPending) {
    return (
      <div className="grid gap-2" aria-busy="true">
        <p className="sr-only" role="status">
          Loading security activity…
        </p>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  if (events.isError) {
    return (
      <ErrorState
        title="We couldn't load your security activity"
        error={events.error}
        onRetry={() => void events.refetch()}
      />
    );
  }
  if (events.data.length === 0) {
    return <p className="text-sm text-text-muted">No security activity yet.</p>;
  }
  return (
    <ul className="divide-y divide-border/30">
      {events.data.map((event) => (
        <li key={event.id} className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between">
          <span className="text-sm font-medium">{eventLabel(event.action)}</span>
          <span className="text-xs text-text-muted sm:text-sm">
            {formatDateTime(event.created_at, timeZone)}
            {event.ip_address ? ` · ${event.ip_address}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
