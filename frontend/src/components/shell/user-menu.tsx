"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/auth/allauth";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function UserMenu({
  email,
  name,
  securityHref,
  compact = false,
}: {
  email: string;
  name?: string;
  securityHref?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const signOut = useMutation({
    mutationFn: logout,
    onSettled: () => {
      // Forget everything about this user, even if the network call failed.
      queryClient.clear();
      router.replace(routes.login);
    },
  });
  const initial = (name?.trim() || email).charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className={cn(
          "flex min-w-0 items-center gap-2 rounded-md hover:bg-border/15",
          compact ? "p-1" : "w-full px-2 py-1.5 text-left",
        )}
      >
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border/50 bg-bg text-sm font-medium"
        >
          {initial}
        </span>
        {compact ? null : (
          <span className="grid min-w-0 flex-1">
            {name ? <span className="truncate text-sm font-medium">{name}</span> : null}
            <span className="truncate text-xs text-text-muted">{email}</span>
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {securityHref ? (
          <DropdownMenuItem onSelect={() => router.push(securityHref)}>
            <ShieldCheck aria-hidden="true" />
            Security and 2-step login
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onSelect={() => signOut.mutate()} disabled={signOut.isPending}>
          <LogOut aria-hidden="true" />
          {signOut.isPending ? "Logging out…" : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
