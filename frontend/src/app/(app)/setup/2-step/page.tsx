import type { Metadata } from "next";

import { ForcedMfaSetup } from "./forced-mfa-setup";

export const metadata: Metadata = { title: "Set up 2-step login" };

export default function ForcedMfaSetupPage() {
  return <ForcedMfaSetup />;
}
