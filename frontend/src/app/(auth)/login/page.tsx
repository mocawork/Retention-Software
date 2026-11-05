import type { Metadata } from "next";

import { firstParam, type SearchParams } from "@/lib/search-params";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <LoginForm next={firstParam(params.next)} />;
}
