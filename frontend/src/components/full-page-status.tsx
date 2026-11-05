"use client";

import { ErrorState } from "@/components/error-state";
import { Skeleton } from "@/components/ui/skeleton";

/** Whole-screen loading placeholder while we check who is logged in. */
export function FullPageLoading({ label = "Loading RetentionOS…" }: { label?: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4" aria-busy="true">
      <p className="sr-only" role="status">
        {label}
      </p>
      <div className="grid w-full max-w-sm gap-3">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="mt-4 h-10 w-full" />
      </div>
    </div>
  );
}

export function FullPageError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <ErrorState
        className="w-full max-w-lg"
        title="We couldn't open RetentionOS"
        error={error}
        onRetry={onRetry}
      />
    </div>
  );
}
