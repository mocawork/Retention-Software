import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/errors";

import { redirectForError } from "./providers";

const mfaError = new ApiError({ status: 403, code: "mfa_setup_required", message: "Set it up." });

describe("redirectForError", () => {
  it("sends blocked users to the 2-step setup screen", () => {
    expect(redirectForError(mfaError, "/brd_1/home")).toBe("/setup/2-step");
  });

  it("doesn't loop on the setup screen itself", () => {
    expect(redirectForError(mfaError, "/setup/2-step")).toBeNull();
  });

  it("sends logged-out users to log in and back", () => {
    const error = new ApiError({ status: 403, code: "not_authenticated", message: "Log in." });
    expect(redirectForError(error, "/brd_1/settings/team")).toBe(
      "/login?next=%2Fbrd_1%2Fsettings%2Fteam",
    );
  });

  it("ignores other errors", () => {
    const error = new ApiError({ status: 403, code: "permission_denied", message: "No." });
    expect(redirectForError(error, "/brd_1/home")).toBeNull();
    expect(redirectForError(new Error("boom"), "/brd_1/home")).toBeNull();
  });
});
