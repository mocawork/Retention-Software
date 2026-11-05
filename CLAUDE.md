# CLAUDE.md — RetentionOS by Moca (read this first, every session)

RetentionOS is an India-first retention operating system for D2C brands. It tells a brand **what message to send, to whom, at what time and date**, and sends it on WhatsApp. It is a **full-scale SaaS for 1,000+ brands**, not a custom project.

## Read before working
| You are working on… | Read |
|---|---|
| Anything | This file + `changelogs.md` (Decision log, latest entries) |
| **The current milestone (M0)** | `docs/milestones/M0-scope.md` (what to build, and the stop line) |
| Product behaviour / a feature | `project.md` (Parts 1–3; Appendix A is background only) |
| Backend, data, infra | `technical.md`, the relevant sections only (see its numbered headings) |
| Data ingestion (Shopify, CSV, WooCommerce) | `docs/data-and-intelligence-prd.md` Part A + `technical.md` §6 |
| Intelligence / statistics / decisioning | `docs/data-and-intelligence-prd.md` Part B (model specs by ID, e.g. E-07, DEC-04) + `technical.md` §7–§9 |
| What a play does and where its data comes from | `docs/play-map.md` (55 plays, recipes, gaps G1–G19) |
| Decisions and open items from the founder–customer game | `docs/founder-customer-game-log.md` (G-D1…G-D7, U-1…U-13, what-ifs) |
| Frontend | `design.md` (binding rules §1–§7) + `technical.md` §13 |
| A milestone | `docs/milestones/Mx-plan.md` (once it exists) |
| Planning any milestone | `docs/risk-review.md` (risks, spec fixes F-1…F-11, signal-conflict rules) |

## The founders
Both founders are **non-technical** (strong product and AI-tools experience). Therefore:
- **Before any non-trivial change, use plan mode**: explain in plain English *what* you will do, *why*, *the technical consequences and risks*, and alternatives. **Wait for founder approval** before writing code. Do not touch code until the plan is clear and approved.
- Every PR includes a **plain-English summary**: what changed, why, risks, how to verify.

## Rules (non-negotiable)
- **R-1 No pilot-specific logic.** Never hard-code behaviour for a particular brand or category (herbal, cookware, etc.). Behaviour must be learned from data or be configurable. If a change is inspired by a pilot, flag it to the founders first (D-010).
- **R-2 Algorithms decide; AI only explains or suggests.** The LLM is used **only** by the `explanations` app for `?` popovers (no PII, numeric validator). Jev is used **only** to suggest CSV/status column matches that a human confirms, with PII masked (D-022). Do not add LLM, Jev or "AI" calls anywhere else (D-004, D-008).
- **R-3 Tenancy.** Every tenant model inherits `TenantModel`; every query is brand-scoped; every endpoint is covered by the tenant-isolation tests.
- **R-4 Decisions.** Do not change anything marked ✅ Decided in `technical.md`/`changelogs.md` without founder approval + a new D-entry.
- **R-5 Dependencies.** No new library without stating its maintenance status, reason and compatibility, and getting approval. Versions are pinned via `uv.lock` / `pnpm-lock.yaml`.
- **R-6 Correctness.** Money in integer paise; timestamps in UTC; brand timezone for day/hour logic; use the single `counts_as_purchase` definition; never invent missing values.
- **R-7 Messaging safety.** Consent, suppression and frequency caps are re-checked **immediately before every send**. Nothing is sent without a human launch (V1).
- **R-8 Environments.** Never use production data or credentials in development. MCP database access is staging/dev and read-only.
- **R-9 Frontend** follows `design.md`, uses only the generated API client, and never computes business metrics.
- **R-10 Done means:** tests pass, OpenAPI updated + client regenerated, docs updated if behaviour changed, **`changelogs.md` entry added**, and a plain-English PR summary written.
- **R-11 Git workflow.** Every change goes on its own branch and through a pull request into `main`; **never push to `main` directly**, never force-push. Squash-merge only. The GitHub Free plan can't enforce this yet, so you must (D-030). Commit and push after each finished task. Never commit secrets: use `.env.example`.
- **R-12 Stop line.** Build only what the current milestone scope lists. Anything marked "waiting on gaps" in `docs/milestones/M0-scope.md` (Shopify/WooCommerce/CSV, questionnaire, intelligence, WhatsApp, billing, deployment, landing site) needs founder approval first. If a task needs a decision the docs don't settle, stop and ask in the pull request.

## Repository map
`backend/` (Django: `config/`, `apps/`, `tests/`) · `frontend/` (Next.js: `src/app`, `src/components`, `src/lib/api` = generated) · `infra/` · `docs/` (`data-and-intelligence-prd.md`, `risk-review.md`, `play-map.md`, `founder-customer-game-log.md`, `milestones/`) · `.claude/skills/` (project skills).

## Commands
_To be filled in during M0 (setup, test, lint, run, migrate, generate API client)._
