import { redirect } from "next/navigation";

import { routes } from "@/lib/routes";

export default async function SettingsIndexPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  redirect(routes.team(brandId));
}
