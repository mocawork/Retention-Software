"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Brand } from "@/lib/queries";
import { roleLabel } from "@/lib/roles";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

/** Top-left brand switcher (design.md §2): my brands with my role in each, plus "Create brand". */
export function BrandSwitcher({
  current,
  brands,
  className,
}: {
  current: Brand;
  brands: readonly Brand[];
  className?: string;
}) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-border/15",
          className,
        )}
        aria-label={`Current brand: ${current.name}. Switch brand`}
      >
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground"
        >
          {current.name.trim().charAt(0).toUpperCase() || "B"}
        </span>
        <span className="grid min-w-0 flex-1">
          <span className="truncate text-sm font-semibold">{current.name}</span>
          <span className="truncate text-xs text-text-muted">{roleLabel(current.my_role)}</span>
        </span>
        <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-text-muted" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Your brands</DropdownMenuLabel>
        {brands.map((brand) => {
          const isCurrent = brand.id === current.id;
          return (
            <DropdownMenuItem
              key={brand.id}
              onSelect={() => {
                if (!isCurrent) router.push(routes.brandHome(brand.id));
              }}
              aria-current={isCurrent ? "true" : undefined}
            >
              <span className="grid min-w-0 flex-1">
                <span className="truncate font-medium">{brand.name}</span>
                <span className="text-xs text-text-muted">{roleLabel(brand.my_role)}</span>
              </span>
              {isCurrent ? <Check aria-label="Current brand" className="text-primary" /> : null}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push(routes.newBrand)}>
          <Plus aria-hidden="true" />
          Create brand
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
