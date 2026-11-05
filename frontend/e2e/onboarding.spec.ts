import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

/**
 * M0 "done when": sign up → verify email → create brand → see the setup checklist.
 * Reads the verification email from Django's file-based email backend (E2E_EMAIL_DIR).
 */
const emailDir = process.env.E2E_EMAIL_DIR;

async function findVerificationLink(recipient: string, timeoutMs = 15_000): Promise<string> {
  if (!emailDir) throw new Error("Set E2E_EMAIL_DIR to Django's EMAIL_FILE_PATH");
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const files = await readdir(emailDir).catch(() => [] as string[]);
    const withTimes = await Promise.all(
      files.map(async (name) => {
        const full = path.join(emailDir, name);
        return { full, mtime: (await stat(full)).mtimeMs };
      }),
    );
    withTimes.sort((a, b) => b.mtime - a.mtime); // newest first
    for (const { full } of withTimes) {
      // Undo quoted-printable soft line breaks and "=3D" in case the backend used them.
      const text = (await readFile(full, "utf8")).replace(/=\r?\n/g, "").replace(/=3D/g, "=");
      if (!text.includes(recipient)) continue;
      const match = text.match(/https?:\/\/\S+\/verify-email\/[^\s"<>]+/);
      if (match) return match[0];
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No verification email for ${recipient} in ${emailDir}`);
}

test("a founder signs up, confirms their email, creates a brand and sees the checklist", async ({
  page,
}) => {
  const email = `founder+${Date.now()}@example.com`;
  const brandName = `E2E Brand ${Date.now().toString(36)}`;

  await page.goto("/signup");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Plum-Tiger-Harbour-42");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/verify-email\?email=/);
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();

  const link = await findVerificationLink(email);
  await page.goto(link);
  await expect(page.getByRole("heading", { name: "Confirm your email" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm my email" }).click();

  // Confirming in the same browser logs the founder in; with no brand yet, "/" → create brand.
  await expect(page).toHaveURL(/\/brands\/new$/);
  await expect(page.getByRole("heading", { name: "Create your brand" })).toBeVisible();
  await expect(page.getByText("India (IST)")).toBeVisible();
  await page.getByLabel("Brand name").fill(brandName);
  await page.getByRole("button", { name: "Create brand" }).click();

  await expect(page).toHaveURL(/\/[a-z]+_[0-9a-z]+\/home$/);
  await expect(
    page.getByRole("heading", { name: /^Good (morning|afternoon|evening)/ }),
  ).toBeVisible();
  const checklist = page.getByRole("list", { name: "Setup steps" });
  await expect(checklist).toBeVisible();
  await expect(checklist.getByRole("listitem")).toHaveCount(7);

  const account = checklist.getByRole("listitem").filter({ hasText: "Create your account" });
  await expect(account.getByText("Done")).toBeVisible();
  const brand = checklist.getByRole("listitem").filter({ hasText: "Create your brand" });
  await expect(brand.getByText("Done")).toBeVisible();
  const store = checklist.getByRole("listitem").filter({ hasText: "Connect your store" });
  await expect(store.getByText("Coming next")).toBeVisible();
  await expect(store.getByRole("button", { name: "Connect store" })).toBeDisabled();
  const whatsapp = checklist.getByRole("listitem").filter({ hasText: "Connect WhatsApp" });
  await expect(whatsapp.getByText("Locked")).toBeVisible();

  // The brand switcher shows the new brand and the founder's role.
  await expect(
    page.getByRole("button", { name: `Current brand: ${brandName}. Switch brand` }).first(),
  ).toBeVisible();
});
