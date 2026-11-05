import { Clock } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";

/** Honest placeholder for nav items that arrive in a later milestone (R-12). */
export function ComingSoon({
  brandId,
  title,
  description,
}: {
  brandId: string;
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-6">
      <PageHeader title={title} />
      <EmptyState
        icon={Clock}
        title="Coming in a later milestone"
        description={
          <>
            <p>{description}</p>
            <p className="mt-2">
              It needs your store data first. Connecting your store is the next step on your
              setup checklist.
            </p>
          </>
        }
        action={
          <Button asChild variant="outline">
            <Link href={routes.brandHome(brandId)}>See the setup checklist</Link>
          </Button>
        }
      />
    </div>
  );
}
