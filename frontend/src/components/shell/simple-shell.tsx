"use client";

import type { ReactNode } from "react";

import type { Me } from "@/lib/queries";

import { SkipLink } from "./app-shell";
import { UserMenu } from "./user-menu";

/** A minimal frame for pages outside a brand (create brand, forced 2-step setup). */
export function SimpleShell({ me, children }: { me: Me; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg">
      <SkipLink />
      <header className="flex h-14 items-center justify-between border-b border-border/40 bg-surface px-4 sm:px-6">
        <p className="text-base font-semibold tracking-tight">RetentionOS</p>
        <UserMenu email={me.email} name={me.full_name || undefined} compact />
      </header>
      <main id="main" className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>
    </div>
  );
}
