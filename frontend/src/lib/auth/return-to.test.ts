import { describe, expect, it } from "vitest";

import { consumeReturnTo, safeNextPath, saveReturnTo, withNext } from "./return-to";

describe("safe redirects after log-in", () => {
  it("accepts in-app paths only", () => {
    expect(safeNextPath("/invitations/abc")).toBe("/invitations/abc");
    expect(safeNextPath("https://evil.example")).toBeNull();
    expect(safeNextPath("//evil.example")).toBeNull();
    expect(safeNextPath("/\\evil.example")).toBeNull();
    expect(safeNextPath(null)).toBeNull();
  });

  it("builds links that keep the destination", () => {
    expect(withNext("/login", "/brd_1/home")).toBe("/login?next=%2Fbrd_1%2Fhome");
    expect(withNext("/login", "https://evil.example")).toBe("/login");
  });

  it("remembers a destination once", () => {
    saveReturnTo("/invitations/abc");
    expect(consumeReturnTo()).toBe("/invitations/abc");
    expect(consumeReturnTo()).toBeNull();
  });
});
