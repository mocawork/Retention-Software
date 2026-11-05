// Generates the typed API clients' types from the backend contracts (technical.md §13).
// Run with `pnpm generate:api`. CI regenerates and fails if the committed files differ
// ("OpenAPI drift check"), so never edit the generated files by hand.
import { writeFile } from "node:fs/promises";
import openapiTS, { astToString } from "openapi-typescript";

const targets = [
  {
    source: "backend/openapi.json",
    input: new URL("../../backend/openapi.json", import.meta.url),
    output: new URL("../src/lib/api/schema.ts", import.meta.url),
  },
  {
    source: "backend/allauth-openapi.json",
    input: new URL("../../backend/allauth-openapi.json", import.meta.url),
    output: new URL("../src/lib/api/auth-schema.ts", import.meta.url),
  },
];

for (const target of targets) {
  const ast = await openapiTS(target.input);
  const header = [
    "/**",
    " * GENERATED — DO NOT EDIT.",
    ` * Source: ${target.source} (openapi-typescript).`,
    " * Regenerate with `pnpm generate:api`; CI fails if this file is out of date.",
    " */",
    "",
    "",
  ].join("\n");
  await writeFile(target.output, header + astToString(ast));
  console.log(`Generated ${target.output.pathname.split("/frontend/")[1]} from ${target.source}`);
}
