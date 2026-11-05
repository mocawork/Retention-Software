import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";

import { InviteForm } from "./invite-form";

function roleOptions() {
  return Array.from(
    (screen.getByLabelText("Role") as HTMLSelectElement).options,
    (option) => option.textContent,
  );
}

describe("InviteForm", () => {
  it("lets an Owner give any role, but an Admin can't make Owners", () => {
    const { unmount } = render(<InviteForm myRole="owner" onInvite={vi.fn()} />);
    expect(roleOptions()).toEqual(["Owner", "Admin", "Marketer", "Viewer"]);
    unmount();
    render(<InviteForm myRole="admin" onInvite={vi.fn()} />);
    expect(roleOptions()).toEqual(["Admin", "Marketer", "Viewer"]);
  });

  it("defaults to the smallest access (Viewer) and explains the role", () => {
    render(<InviteForm myRole="owner" onInvite={vi.fn()} />);
    expect(screen.getByLabelText("Role")).toHaveValue("viewer");
    expect(screen.getByText(/can see everything but can't change anything/i)).toBeInTheDocument();
  });

  it("checks the email when the field loses focus", async () => {
    const user = userEvent.setup();
    const onInvite = vi.fn();
    render(<InviteForm myRole="admin" onInvite={onInvite} />);
    await user.type(screen.getByLabelText("Email address"), "priya@");
    await user.tab();
    expect(await screen.findByText(/Enter a valid email address/)).toBeInTheDocument();
    expect(screen.getByLabelText("Email address")).toHaveAttribute("aria-invalid", "true");
    await user.click(screen.getByRole("button", { name: "Send invitation" }));
    expect(onInvite).not.toHaveBeenCalled();
  });

  it("sends the invitation and confirms it", async () => {
    const user = userEvent.setup();
    const onInvite = vi.fn().mockResolvedValue({});
    render(<InviteForm myRole="owner" onInvite={onInvite} />);
    await user.type(screen.getByLabelText("Email address"), "  priya@sunrise.in ");
    await user.selectOptions(screen.getByLabelText("Role"), "marketer");
    await user.click(screen.getByRole("button", { name: "Send invitation" }));

    await waitFor(() =>
      expect(onInvite).toHaveBeenCalledWith({ email: "priya@sunrise.in", role: "marketer" }),
    );
    expect(await screen.findByText(/Invitation sent to priya@sunrise.in/)).toBeInTheDocument();
    expect(screen.getByLabelText("Email address")).toHaveValue("");
  });

  it("shows the server's reason next to the field", async () => {
    const user = userEvent.setup();
    const onInvite = vi.fn().mockRejectedValue(
      new ApiError({
        status: 400,
        code: "invalid",
        message: "Some fields need attention.",
        fieldErrors: { email: ["This person is already a member of this brand."] },
      }),
    );
    render(<InviteForm myRole="admin" onInvite={onInvite} />);
    await user.type(screen.getByLabelText("Email address"), "ravi@sunrise.in");
    await user.click(screen.getByRole("button", { name: "Send invitation" }));
    expect(
      await screen.findByText("This person is already a member of this brand."),
    ).toBeInTheDocument();
  });
});
