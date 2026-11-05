import type { Metadata } from "next";

import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return <ResetPasswordForm rawKey={key} />;
}
