"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { FullPageError, FullPageLoading } from "@/components/full-page-status";
import { lastBrandId } from "@/lib/last-brand";
import { useBrands } from "@/lib/queries";
import { routes } from "@/lib/routes";

export function BrandRedirect() {
  const router = useRouter();
  const brands = useBrands();

  useEffect(() => {
    if (!brands.data) return;
    if (brands.data.length === 0) {
      router.replace(routes.newBrand);
      return;
    }
    const remembered = lastBrandId();
    const target = brands.data.find((b) => b.id === remembered) ?? brands.data[0];
    if (target) router.replace(routes.brandHome(target.id));
  }, [brands.data, router]);

  if (brands.isError) {
    return <FullPageError error={brands.error} onRetry={() => void brands.refetch()} />;
  }
  return <FullPageLoading />;
}
