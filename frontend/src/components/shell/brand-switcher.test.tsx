import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Brand } from "@/lib/queries";

import { BrandSwitcher } from "./brand-switcher";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

function brand(id: string, name: string, role: string): Brand {
  return {
    id,
    name,
    timezone: "Asia/Kolkata",
    currency: "INR",
    platform: "none",
    status: "onboarding",
    my_role: role,
    created_at: "2026-11-01T00:00:00Z",
  };
}

const sunrise = brand("brd_sun", "Sunrise Foods", "owner");
const kettle = brand("brd_ket", "Kettle & Co", "viewer");

describe("BrandSwitcher", () => {
  beforeEach(() => {
    router.push.mockReset();
  });

  it("shows the current brand and my role in it", () => {
    render(<BrandSwitcher current={sunrise} brands={[sunrise, kettle]} />);
    const trigger = screen.getByRole("button", { name: /Current brand: Sunrise Foods/ });
    expect(trigger).toHaveTextContent("Owner");
  });

  it("lists every brand with my role, and Create brand", async () => {
    const user = userEvent.setup();
    render(<BrandSwitcher current={sunrise} brands={[sunrise, kettle]} />);
    await user.click(screen.getByRole("button", { name: /Switch brand/ }));

    const items = await screen.findAllByRole("menuitem");
    expect(items.map((el) => el.textContent)).toEqual([
      "Sunrise FoodsOwner",
      "Kettle & CoViewer",
      "Create brand",
    ]);
    expect(screen.getByRole("menuitem", { name: /Sunrise Foods/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("switches to another brand's Home", async () => {
    const user = userEvent.setup();
    render(<BrandSwitcher current={sunrise} brands={[sunrise, kettle]} />);
    await user.click(screen.getByRole("button", { name: /Switch brand/ }));
    await user.click(await screen.findByRole("menuitem", { name: /Kettle & Co/ }));
    expect(router.push).toHaveBeenCalledWith("/brd_ket/home");
  });

  it("opens Create brand", async () => {
    const user = userEvent.setup();
    render(<BrandSwitcher current={sunrise} brands={[sunrise]} />);
    await user.click(screen.getByRole("button", { name: /Switch brand/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Create brand" }));
    expect(router.push).toHaveBeenCalledWith("/brands/new");
  });
});
