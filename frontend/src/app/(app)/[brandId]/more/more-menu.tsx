import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { MOBILE_TAB_KEYS, NAV_ITEMS } from "@/components/shell/nav";
import { routes } from "@/lib/routes";

/** The phone "More" tab: every section that isn't in the bottom tab bar. */
export function MoreMenu({ brandId }: { brandId: string }) {
  const tabKeys: readonly string[] = MOBILE_TAB_KEYS;
  const items = NAV_ITEMS.filter((item) => !tabKeys.includes(item.key));
  return (
    <div className="grid gap-6">
      <PageHeader title="More" />
      <nav aria-label="More sections">
        <ul className="divide-y divide-border/30 overflow-hidden rounded-lg border border-border/40 bg-surface">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={routes.brandSection(brandId, item.key)}
                className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium hover:bg-bg"
              >
                <item.icon aria-hidden="true" className="size-5 text-text-muted" />
                <span className="flex-1">{item.label}</span>
                <ChevronRight aria-hidden="true" className="size-4 text-text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
