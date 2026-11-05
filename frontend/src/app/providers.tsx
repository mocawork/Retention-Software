"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { ApiError } from "@/lib/api/errors";
import { withNext } from "@/lib/auth/return-to";
import { routes } from "@/lib/routes";

/** Where an app-API error should send the user, if anywhere. */
export function redirectForError(error: unknown, pathname: string): string | null {
  if (!(error instanceof ApiError)) return null;
  // 403 {code: "mfa_setup_required"}: the 2-step login deadline has passed (D-039).
  if (error.code === "mfa_setup_required") {
    return pathname === routes.mfaSetup ? null : routes.mfaSetup;
  }
  // The session ended (expired, or logged out in another tab).
  if (error.code === "not_authenticated") return withNext(routes.login, pathname);
  return null;
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  // 4xx answers won't change by asking again; network and server errors might.
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

/**
 * Set by <Providers> once mounted. Query/mutation errors call it to redirect (the
 * QueryClient is created once, so it can't capture the router directly).
 */
let onApiError: ((error: unknown) => void) | null = null;

function handleApiError(error: unknown) {
  onApiError?.(error);
}

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    onApiError = (error) => {
      const target = redirectForError(error, pathname);
      if (target) router.replace(target);
    };
    return () => {
      onApiError = null;
    };
  }, [router, pathname]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: handleApiError }),
        mutationCache: new MutationCache({ onError: handleApiError }),
        defaultOptions: {
          queries: { staleTime: 30_000, retry: shouldRetry },
          mutations: { retry: false },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
