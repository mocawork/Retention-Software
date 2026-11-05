import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // design.md §6: no `any` in feature code.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
    },
  },
  {
    // design.md §6 / CLAUDE.md R-9: API calls only through the generated client.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/api/**"],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: "Call the API through the generated client in src/lib/api." },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
    // Generated from the backend contracts by `pnpm generate:api`.
    "src/lib/api/schema.ts",
    "src/lib/api/auth-schema.ts",
  ]),
]);
