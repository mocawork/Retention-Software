"use client";

import { useState } from "react";

import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { errorMessage, isApiError } from "@/lib/api/errors";
import {
  getRecoveryCodes,
  REAUTH_REQUIRED,
  regenerateRecoveryCodes,
  type RecoveryCodes,
} from "@/lib/auth/allauth";
import { formatCount } from "@/lib/format";

import { ReauthForm } from "./reauth-form";
import { RecoveryCodeList } from "./recovery-codes";

type Action = "view" | "regenerate";

/** View or renew recovery codes. allauth may ask for the password first. */
export function RecoveryCodesSection() {
  const [result, setResult] = useState<RecoveryCodes | null | undefined>(undefined);
  const [reauthFor, setReauthFor] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(action: Action) {
    setError(null);
    setLoading(true);
    try {
      setResult(action === "view" ? await getRecoveryCodes() : await regenerateRecoveryCodes());
      setReauthFor(null);
    } catch (err) {
      if (isApiError(err, REAUTH_REQUIRED)) setReauthFor(action);
      else setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (reauthFor) {
    return <ReauthForm onCancel={() => setReauthFor(null)} onSuccess={() => run(reauthFor)} />;
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-1 text-sm">
        <p className="font-medium">Recovery codes</p>
        <p className="text-text-muted">
          If you lose your phone, each recovery code lets you log in once.
        </p>
      </div>
      <FormError message={error} />
      {result === null ? (
        <p className="text-sm">You don&apos;t have recovery codes yet. Make a set now.</p>
      ) : null}
      {result && result.codes?.length ? <RecoveryCodeList codes={result.codes} /> : null}
      {result && !result.codes?.length ? (
        <p className="text-sm">
          You have {formatCount(result.unusedCount)} of {formatCount(result.totalCount)} codes left.
          For your security they&apos;re only shown once. If you&apos;ve lost them, make new ones.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {result === undefined ? (
          <Button
            variant="outline"
            onClick={() => run("view")}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Loading…" : "Show my recovery codes"}
          </Button>
        ) : null}
        <ConfirmActionDialog
          trigger={<Button variant="outline">Make new recovery codes</Button>}
          title="Make new recovery codes?"
          description="Your current recovery codes will stop working straight away. Save the new ones somewhere safe."
          confirmLabel="Make new codes"
          onConfirm={() => run("regenerate")}
        />
      </div>
    </div>
  );
}
