import type { Metadata } from "next";

import { firstParam, type SearchParams } from "@/lib/search-params";

import { MfaChallengeForm } from "./mfa-challenge-form";

export const metadata: Metadata = { title: "2-step login" };

export default async function MfaChallengePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <MfaChallengeForm next={firstParam(params.next)} />;
}
