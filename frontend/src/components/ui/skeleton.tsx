import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Loading placeholder (design.md §1: skeletons, not spinners). Hidden from screen readers. */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-border/20", className)}
      {...props}
    />
  );
}
