"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { useCurrentMe } from "@/components/auth/auth-gate";
import { TwoStepSetup } from "@/components/security/two-step-setup";
import { SimpleShell } from "@/components/shell/simple-shell";
import { queryKeys } from "@/lib/queries";
import { routes } from "@/lib/routes";

/** Shown once the 2-step login deadline has passed (D-039): nothing else is reachable. */
export function ForcedMfaSetup() {
  const me = useCurrentMe();
  const router = useRouter();
  const queryClient = useQueryClient();

  async function done() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.me });
    await queryClient.invalidateQueries({ queryKey: queryKeys.brands });
    router.replace(routes.root);
  }

  return (
    <SimpleShell me={me}>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            Set up 2-step login to continue
          </h1>
          <p className="text-sm text-text-muted">
            {me.mfa.enabled
              ? "2-step login is on for your account."
              : "Your account needs 2-step login before you can keep using RetentionOS. It protects your brand's customer data even if your password leaks. It takes about 2 minutes."}
          </p>
        </div>
        <div className="rounded-lg border border-border/40 bg-surface p-6 shadow-sm">
          <TwoStepSetup onDone={done} />
        </div>
      </div>
    </SimpleShell>
  );
}
