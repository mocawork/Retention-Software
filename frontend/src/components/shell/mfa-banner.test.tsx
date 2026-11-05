import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MfaBanner, mfaNotice } from "./mfa-banner";

const reminder = {
  enabled: false,
  required: true,
  deadline: "2026-11-12T09:30:00Z",
  blocked: false,
};

describe("MFA policy notices (D-039)", () => {
  it("knows when to block, remind, or stay quiet", () => {
    expect(mfaNotice({ ...reminder, blocked: true })).toBe("blocked");
    expect(mfaNotice(reminder)).toBe("reminder");
    expect(mfaNotice({ ...reminder, enabled: true })).toBe("none");
    expect(mfaNotice({ enabled: false, required: false, deadline: null, blocked: false })).toBe(
      "none",
    );
  });

  it("shows the deadline in plain English, in the brand's timezone", () => {
    render(
      <MfaBanner mfa={reminder} timeZone="Asia/Kolkata" setupHref="/brd_1/settings/security" />,
    );
    expect(screen.getByText("Set up 2-step login by 12 Nov 2026, 3:00 pm.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Set up now" })).toHaveAttribute(
      "href",
      "/brd_1/settings/security",
    );
  });

  it("is hidden once 2-step login is on", () => {
    const { container } = render(
      <MfaBanner mfa={{ ...reminder, enabled: true }} timeZone="Asia/Kolkata" setupHref="/x" />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
