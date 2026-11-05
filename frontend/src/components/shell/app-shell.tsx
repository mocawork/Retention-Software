"use client";

import { Ellipsis } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import type { Brand, Me } from "@/lib/queries";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { BrandSwitcher } from "./brand-switcher";
import { MfaBanner } from "./mfa-banner";
import { activeSection, MOBILE_TAB_KEYS, NAV_ITEMS } from "./nav";
import { UserMenu } from "./user-menu";

export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only z-50 rounded-md bg-surface px-3 py-2 text-sm font-medium shadow-md focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
    >
      Skip to content
    </a>
  );
}

/**
 * The signed-in frame (design.md §2): sidebar on desktop; top bar + bottom tab bar on
 * phones. The brand switcher sits top-left in both.
 */
export function AppShell({
  brand,
  brands,
  me,
  children,
}: {
  brand: Brand;
  brands: readonly Brand[];
  me: Me;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const section = activeSection(pathname, brand.id);
  const securityHref = routes.security(brand.id);
  const tabKeys: readonly string[] = MOBILE_TAB_KEYS;
  const tabs = NAV_ITEMS.filter((item) => tabKeys.includes(item.key));
  const moreActive = section !== null && !tabKeys.includes(section);

  return (
    <div className="min-h-dvh bg-bg">
      <SkipLink />

      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border/40 bg-surface lg:flex">
        <div className="border-b border-border/30 p-3">
          <BrandSwitcher current={brand} brands={brands} />
        </div>
        <nav aria-label="Main" className="flex-1 overflow-y-auto p-3">
          <ul className="grid gap-0.5">
            {NAV_ITEMS.map((item) => {
              const active = section === item.key;
              return (
                <li key={item.key}>
                  <Link
                    href={routes.brandSection(brand.id, item.key)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-text-muted hover:bg-border/15 hover:text-text",
                      active && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
                    )}
                  >
                    <item.icon aria-hidden="true" className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-border/30 p-3">
          <UserMenu email={me.email} name={me.full_name || undefined} securityHref={securityHref} />
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/40 bg-surface px-2 lg:hidden">
        <BrandSwitcher current={brand} brands={brands} className="flex-1" />
        <UserMenu email={me.email} name={me.full_name || undefined} securityHref={securityHref} compact />
      </header>

      <div className="lg:pl-64">
        {pathname === securityHref ? null : (
          <MfaBanner mfa={me.mfa} timeZone={brand.timezone ?? "Asia/Kolkata"} setupHref={securityHref} />
        )}
        <main id="main" className="mx-auto w-full max-w-7xl px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pb-12">
          {children}
        </main>
      </div>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/40 bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {tabs.map((item) => {
            const active = section === item.key;
            return (
              <li key={item.key}>
                <MobileTab
                  href={routes.brandSection(brand.id, item.key)}
                  label={item.label}
                  active={active}
                  icon={<item.icon aria-hidden="true" className="size-5" />}
                />
              </li>
            );
          })}
          <li>
            <MobileTab
              href={routes.brandSection(brand.id, "more")}
              label="More"
              active={moreActive}
              icon={<Ellipsis aria-hidden="true" className="size-5" />}
            />
          </li>
        </ul>
      </nav>
    </div>
  );
}

function MobileTab({
  href,
  label,
  active,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium text-text-muted",
        active && "text-primary",
      )}
    >
      {icon}
      <span className="max-w-full truncate px-1">{label}</span>
    </Link>
  );
}
