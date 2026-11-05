import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { vi } from "vitest";

export function renderWithQuery(ui: ReactElement, options?: RenderOptions) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, ...render(ui, { wrapper, ...options }) };
}

type Route = { method?: string; path: string; status?: number; body?: unknown };

/** Replaces global fetch with canned JSON answers, matched by method + path. */
export function mockFetch(routes: Route[]) {
  const fetchMock = vi.fn(async (request: Request) => {
    const url = new URL(request.url);
    const route = routes.find(
      (r) => r.path === url.pathname && (r.method ?? "GET") === request.method,
    );
    if (!route) return new Response(JSON.stringify({ detail: "no mock" }), { status: 599 });
    return new Response(route.body === undefined ? null : JSON.stringify(route.body), {
      status: route.status ?? 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
