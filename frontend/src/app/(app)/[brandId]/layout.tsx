import type { ReactNode } from "react";

import { BrandShell } from "@/components/shell/brand-shell";

export default async function BrandLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  return <BrandShell brandId={brandId}>{children}</BrandShell>;
}
