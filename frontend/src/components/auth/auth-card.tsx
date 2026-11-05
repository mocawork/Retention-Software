import type { ReactNode } from "react";

/** The frame every sign-up / log-in screen uses. */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-border/40 bg-surface p-6 shadow-sm sm:p-8">
        <div className="mb-6 grid gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description ? <div className="text-sm text-text-muted">{description}</div> : null}
        </div>
        {children}
      </div>
      {footer ? <div className="text-center text-sm text-text-muted">{footer}</div> : null}
    </div>
  );
}
