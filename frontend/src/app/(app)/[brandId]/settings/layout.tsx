import type { ReactNode } from "react";

import { PageHeader } from "@/components/page-header";

import { SettingsTabs } from "./settings-tabs";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  return (
    <div className="grid gap-6">
      <PageHeader title="Settings" />
      <SettingsTabs brandId={brandId} />
      {children}
    </div>
  );
}
