import type { Metadata } from "next";

import { MoreMenu } from "./more-menu";

export const metadata: Metadata = { title: "More" };

export default async function MorePage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  return <MoreMenu brandId={brandId} />;
}
