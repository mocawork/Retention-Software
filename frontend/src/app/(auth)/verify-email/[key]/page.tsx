import type { Metadata } from "next";

import { ConfirmEmail } from "./confirm-email";

export const metadata: Metadata = { title: "Confirm your email" };

export default async function ConfirmEmailPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return <ConfirmEmail rawKey={key} />;
}
