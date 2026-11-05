import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mockFetch, renderWithQuery } from "@/test/utils";

import { AuthGate } from "./auth-gate";

const nav = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn() },
  pathname: "/brd_1/home",
}));
vi.mock("next/navigation", () => ({
  useRouter: () => nav.router,
  usePathname: () => nav.pathname,
}));

const SESSION = "/_allauth/browser/v1/auth/session";
const ME = "/api/v1/me/";

const authenticated = {
  status: 200,
  data: { user: { display: "priya", email: "priya@sunrise.in", has_usable_password: true } },
  meta: { is_authenticated: true },
};

function me(mfa: {
  enabled: boolean;
  required: boolean;
  deadline: string | null;
  blocked: boolean;
}) {
  return { id: "usr_1", email: "priya@sunrise.in", full_name: "Priya", mfa };
}

describe("AuthGate", () => {
  beforeEach(() => {
    nav.router.replace.mockReset();
    nav.pathname = "/brd_1/home";
  });

  it("shows the app when logged in and 2-step login isn't blocking", async () => {
    mockFetch([
      { path: SESSION, body: authenticated },
      { path: ME, body: me({ enabled: true, required: true, deadline: null, blocked: false }) },
    ]);
    renderWithQuery(<AuthGate>App content</AuthGate>);
    expect(await screen.findByText("App content")).toBeInTheDocument();
    expect(nav.router.replace).not.toHaveBeenCalled();
  });

  it("forces the setup screen once the 2-step login deadline has passed", async () => {
    mockFetch([
      { path: SESSION, body: authenticated },
      {
        path: ME,
        body: me({
          enabled: false,
          required: true,
          deadline: "2026-11-01T00:00:00Z",
          blocked: true,
        }),
      },
    ]);
    renderWithQuery(<AuthGate>App content</AuthGate>);
    await waitFor(() => expect(nav.router.replace).toHaveBeenCalledWith("/setup/2-step"));
    expect(screen.queryByText("App content")).toBeNull();
  });

  it("lets a blocked user use the setup screen itself", async () => {
    nav.pathname = "/setup/2-step";
    mockFetch([
      { path: SESSION, body: authenticated },
      {
        path: ME,
        body: me({
          enabled: false,
          required: true,
          deadline: "2026-11-01T00:00:00Z",
          blocked: true,
        }),
      },
    ]);
    renderWithQuery(<AuthGate>Setup screen</AuthGate>);
    expect(await screen.findByText("Setup screen")).toBeInTheDocument();
    expect(nav.router.replace).not.toHaveBeenCalled();
  });

  it("sends a half-finished log-in to the 2-step challenge", async () => {
    mockFetch([
      {
        path: SESSION,
        status: 401,
        body: {
          status: 401,
          data: { flows: [{ id: "login" }, { id: "mfa_authenticate", is_pending: true }] },
          meta: { is_authenticated: false },
        },
      },
    ]);
    renderWithQuery(<AuthGate>App content</AuthGate>);
    await waitFor(() =>
      expect(nav.router.replace).toHaveBeenCalledWith("/login/2-step?next=%2Fbrd_1%2Fhome"),
    );
  });

  it("sends logged-out visitors to log in, keeping where they were going", async () => {
    nav.pathname = "/brd_1/settings/team";
    mockFetch([
      {
        path: SESSION,
        status: 401,
        body: {
          status: 401,
          data: { flows: [{ id: "login" }] },
          meta: { is_authenticated: false },
        },
      },
    ]);
    renderWithQuery(<AuthGate>App content</AuthGate>);
    await waitFor(() =>
      expect(nav.router.replace).toHaveBeenCalledWith("/login?next=%2Fbrd_1%2Fsettings%2Fteam"),
    );
  });
});
