import type { Metadata } from "next";

import { firstParam, type SearchParams } from "@/lib/search-params";

import { CheckInbox } from "./check-inbox";

export const metadata: Metadata = { title: "Check your inbox" };

export default async function VerifyEmailPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <CheckInbox email={firstParam(params.email)} />;
}
