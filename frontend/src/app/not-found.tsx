import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="grid max-w-md gap-4 text-center">
        <h1 className="text-2xl font-semibold">We couldn&apos;t find that page</h1>
        <p className="text-sm text-text-muted">
          The link may be old or mistyped. Head back to RetentionOS and carry on from there.
        </p>
        <div>
          <Button asChild>
            <Link href="/">Go to RetentionOS</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
