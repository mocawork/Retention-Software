import type { Metadata } from "next";

import { InvitationView } from "./invitation-view";

export const metadata: Metadata = { title: "Invitation" };

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InvitationView rawToken={token} />;
}
