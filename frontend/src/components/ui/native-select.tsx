import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** A styled native <select>: accessible and comfortable on phones (shadcn "native-select"). */
export function NativeSelect({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className={cn("relative w-full", className)}>
      <select
        data-slot="native-select"
        className="h-10 w-full appearance-none rounded-md border border-border bg-surface py-0 pr-9 pl-3 text-base text-text shadow-sm disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-danger sm:text-sm"
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-muted"
      />
    </div>
  );
}
