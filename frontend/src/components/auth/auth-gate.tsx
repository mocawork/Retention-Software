"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, type ReactNode } from "react";

import { FullPageError, FullPageLoading } from "@/components/full-page-status";
import type { FlowId } from "@/lib/auth/allauth";
import { withNext } from "@/lib/auth/return-to";
import { useMe, useSession, type Me } from "@/lib/queries";
import { routes } from "@/lib/routes";

const MeContext = createContext<Me | null>(null);

/** The logged-in user. Only usable inside <AuthGate>. */
export function useCurrentMe(): Me {
  const me = useContext(MeContext);
  if (!me) throw new Error("useCurrentMe() must be used inside <AuthGate>");
  return me;
}

/** Where to send someone who isn't fully logged in. */
export function pathForPendingFlow(flow: FlowId | null, currentPath: string): string {
  if (flow === "mfa_authenticate") return withNext(routes.mfaChallenge, currentPath);
  if (flow === "verify_email") return routes.verifyEmail;
  return withNext(routes.login, currentPath === routes.root ? null : currentPath);
}

/**
 * Protects every app page: checks the allauth session, then GET /api/v1/me/.
 * Once the 2-step login deadline has passed (`mfa.blocked`, D-039) the only page
 * allowed is the forced setup screen.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  const authenticated = session.data?.status === "authenticated";
  const me = useMe(authenticated);
  const blocked = me.data?.mfa.blocked === true && pathname !== routes.mfaSetup;

  useEffect(() => {
    if (session.data?.status === "unauthenticated") {
      router.replace(pathForPendingFlow(session.data.pendingFlow, pathname));
    }
  }, [session.data, pathname, router]);

  useEffect(() => {
    if (blocked) router.replace(routes.mfaSetup);
  }, [blocked, router]);

  if (session.isError) {
    return <FullPageError error={session.error} onRetry={() => void session.refetch()} />;
  }
  if (me.isError) {
    return <FullPageError error={me.error} onRetry={() => void me.refetch()} />;
  }
  if (!authenticated || !me.data || blocked) return <FullPageLoading />;

  return <MeContext.Provider value={me.data}>{children}</MeContext.Provider>;
}
