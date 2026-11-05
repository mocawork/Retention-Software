import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** design.md §3.3: an empty state says what's missing and what to do next. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed border-border/50 bg-surface px-6 py-10 text-center",
        className,
      )}
    >
      {Icon ? (
        <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon aria-hidden="true" className="size-5" />
        </span>
      ) : null}
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="max-w-md text-sm text-text-muted">{description}</div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
