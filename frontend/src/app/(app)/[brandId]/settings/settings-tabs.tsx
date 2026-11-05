"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function SettingsTabs({ brandId }: { brandId: string }) {
  const pathname = usePathname();
  const tabs = [
    { href: routes.team(brandId), label: "Team" },
    { href: routes.security(brandId), label: "Security" },
  ];
  return (
    <nav aria-label="Settings sections" className="border-b border-border/40">
      <ul className="-mb-px flex gap-6">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center border-b-2 border-transparent text-sm font-medium text-text-muted hover:text-text",
                  active && "border-primary text-primary hover:text-primary",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
