"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { safeNextPath } from "@/lib/auth/return-to";
import { useSession } from "@/lib/queries";
import { routes } from "@/lib/routes";

/** Log-in and sign-up pages send people who are already logged in straight on. */
export function useRedirectIfAuthenticated(next?: string | null) {
  const router = useRouter();
  const session = useSession();
  const authenticated = session.data?.status === "authenticated";
  useEffect(() => {
    if (authenticated) router.replace(safeNextPath(next) ?? routes.root);
  }, [authenticated, next, router]);
  return { checking: session.isPending, authenticated };
}
