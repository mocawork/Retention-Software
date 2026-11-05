"use client";

import { AlertTriangle, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

/** design.md §3.3: error in plain words + retry. Never blames the user. */
export function ErrorState({
  title = "We couldn't load this",
  error,
  onRetry,
  className,
}: {
  title?: string;
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-3 rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm sm:flex-row sm:items-center",
        className,
      )}
    >
      <AlertTriangle aria-hidden="true" className="size-5 shrink-0 text-danger" />
      <div className="grid flex-1 gap-0.5">
        <p className="font-medium">{title}</p>
        <p className="text-text-muted">{errorMessage(error)}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw aria-hidden="true" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
