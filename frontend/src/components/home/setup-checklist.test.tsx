import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { OnboardingStep } from "@/lib/queries";

import { SetupChecklist } from "./setup-checklist";

// The M0 answer from GET /api/v1/brands/{brand_id}/onboarding/ (backend selectors.py).
const M0_STEPS: OnboardingStep[] = [
  { key: "account", title: "Create your account", state: "done", description: "Signed in." },
  { key: "brand", title: "Create your brand", state: "done", description: "Sunrise is set up." },
  {
    key: "connect_store",
    title: "Connect your store",
    state: "coming_next",
    description: "Connect Shopify or upload a CSV.",
  },
  { key: "questionnaire", title: "Tell us about your brand", state: "locked", description: "q" },
  { key: "whatsapp", title: "Connect WhatsApp", state: "locked", description: "w" },
];

function item(title: string) {
  const heading = screen.getByRole("heading", { name: new RegExp(title) });
  const li = heading.closest("li");
  if (!li) throw new Error(`no list item for ${title}`);
  return within(li);
}

describe("SetupChecklist", () => {
  it("shows every step in order with a text label for its state", () => {
    render(<SetupChecklist steps={M0_STEPS} />);
    const list = screen.getByRole("list", { name: "Setup steps" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(5);
    expect(item("Create your account").getByText("Done")).toBeInTheDocument();
    expect(item("Create your brand").getByText("Done")).toBeInTheDocument();
    expect(item("Connect your store").getByText("Coming next")).toBeInTheDocument();
    expect(item("Tell us about your brand").getByText("Locked")).toBeInTheDocument();
    expect(item("Connect WhatsApp").getByText("Locked")).toBeInTheDocument();
  });

  it("shows Connect store as disabled, and says why", () => {
    render(<SetupChecklist steps={M0_STEPS} />);
    const button = item("Connect your store").getByRole("button", { name: "Connect store" });
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleDescription(
      "Connecting Shopify or uploading a CSV arrives in the next release.",
    );
  });

  it("offers no action on done or locked steps", () => {
    render(<SetupChecklist steps={M0_STEPS} />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(item("Connect WhatsApp").queryByRole("button")).toBeNull();
  });

  it("numbers steps for screen readers", () => {
    render(<SetupChecklist steps={M0_STEPS} />);
    expect(screen.getByRole("heading", { name: "Step 3: Connect your store" })).toBeInTheDocument();
  });
});
