import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="px-4 py-6 sm:px-6">
        <p className="text-lg font-semibold tracking-tight">RetentionOS</p>
      </header>
      <main className="flex flex-1 justify-center px-4 pb-16 sm:items-center sm:pb-24">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
