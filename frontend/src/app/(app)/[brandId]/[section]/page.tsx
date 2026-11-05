import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ComingSoon } from "@/components/coming-soon";
import { COMING_LATER } from "@/components/shell/nav";

type Params = Promise<{ brandId: string; section: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { section } = await params;
  return { title: COMING_LATER[section]?.label ?? "Not found" };
}

/** Nav items whose features arrive in later milestones (M0 stop line, R-12). */
export default async function ComingLaterPage({ params }: { params: Params }) {
  const { brandId, section } = await params;
  const item = COMING_LATER[section];
  if (!item) notFound();
  return <ComingSoon brandId={brandId} title={item.label} description={item.description} />;
}
