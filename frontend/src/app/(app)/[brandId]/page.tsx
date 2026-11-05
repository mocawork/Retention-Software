import { redirect } from "next/navigation";

import { routes } from "@/lib/routes";

export default async function BrandIndexPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  redirect(routes.brandHome(brandId));
}
