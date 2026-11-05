import type { Metadata } from "next";

import { firstParam, type SearchParams } from "@/lib/search-params";

import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <SignupForm next={firstParam(params.next)} email={firstParam(params.email)} />;
}
