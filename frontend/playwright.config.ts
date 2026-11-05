import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests (technical.md §19). They need the Django API running with
 * EMAIL_BACKEND=filebased and EMAIL_FILE_PATH=$E2E_EMAIL_DIR (verification emails are read
 * from there), MFA_ENFORCEMENT=off and FRONTEND_URL=$E2E_BASE_URL.
 *
 *   E2E_BASE_URL       where the Next.js app runs (default http://localhost:3100)
 *   E2E_EMAIL_DIR      Django's EMAIL_FILE_PATH
 *   E2E_START_SERVER=1 also start `next start` on port 3100 (build first, with BACKEND_URL)
 *   PLAYWRIGHT_CHROMIUM_EXECUTABLE  use a pre-installed Chromium
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_START_SERVER
    ? {
        command: "pnpm start --port 3100",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
});
