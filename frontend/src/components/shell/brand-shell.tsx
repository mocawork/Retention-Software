"use client";

import { Store } from "lucide-react";
import Link from "next/link";
import { createContext, useContext, useEffect, type ReactNode } from "react";

import { useCurrentMe } from "@/components/auth/auth-gate";
import { EmptyState } from "@/components/empty-state";
import { FullPageError } from "@/components/full-page-status";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { rememberBrand } from "@/lib/last-brand";
import { useBrands, type Brand } from "@/lib/queries";
import { routes } from "@/lib/routes";

import { AppShell } from "./app-shell";
import { SimpleShell } from "./simple-shell";

const BrandContext = createContext<Brand | null>(null);

/** The brand in the URL. Only usable inside <BrandShell>. */
export function useCurrentBrand(): Brand {
  const brand = useContext(BrandContext);
  if (!brand) throw new Error("useCurrentBrand() must be used inside <BrandShell>");
  return brand;
}

function ShellSkeleton() {
  return (
    <div className="min-h-dvh bg-bg" aria-busy="true">
      <p className="sr-only" role="status">
        Loading your brand…
      </p>
      <div className="fixed inset-y-0 left-0 hidden w-64 border-r border-border/40 bg-surface p-3 lg:block">
        <Skeleton className="h-11 w-full" />
        <div className="mt-6 grid gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
      <div className="h-14 border-b border-border/40 bg-surface lg:hidden" />
      <div className="mx-auto grid max-w-7xl gap-4 px-4 pt-6 sm:px-6 lg:pl-72">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-4 h-64 w-full" />
      </div>
    </div>
  );
}

export function BrandShell({ brandId, children }: { brandId: string; children: ReactNode }) {
  const me = useCurrentMe();
  const brands = useBrands();
  const brand = brands.data?.find((b) => b.id === brandId);

  useEffect(() => {
    if (brand) rememberBrand(brand.id);
  }, [brand]);

  if (brands.isPending) return <ShellSkeleton />;
  if (brands.isError) {
    return <FullPageError error={brands.error} onRetry={() => void brands.refetch()} />;
  }
  if (!brand) {
    return (
      <SimpleShell me={me}>
        <EmptyState
          icon={Store}
          title="We couldn't find this brand"
          description="It may have been removed, or your access may have changed. Pick one of your brands instead."
          action={
            <Button asChild>
              <Link href={routes.root}>Go to my brands</Link>
            </Button>
          }
        />
      </SimpleShell>
    );
  }

  return (
    <BrandContext.Provider value={brand}>
      <AppShell brand={brand} brands={brands.data} me={me}>
        {children}
      </AppShell>
    </BrandContext.Provider>
  );
}
