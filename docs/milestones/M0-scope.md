# M0 scope — Foundations + sign-up onboarding

> **What this file is:** Exactly what to build in M0, and where to stop. Decided 5 Nov 2026 (D-038).
> **Rule (CLAUDE.md R-12):** Build only what's in "Build now". Anything in "Waits on gaps" needs founder approval first. If a task needs a decision the docs don't settle, stop and ask in the pull request.

## In plain words
M0 builds the empty house: the code repository, automatic checks, the backend and website skeletons, sign-up and log-in, creating a brand, inviting teammates, and the first screens a founder sees. It stops right before connecting a store, because those steps depend on decisions we haven't made yet.

## Build now

### DEV (repo, CI, local setup)
- [ ] Monorepo layout per `technical.md` §4.1; root docs in place; `.claude/skills/` folder
- [ ] Docker Compose: Postgres 17, Redis 7, Django API, Celery worker, Celery beat; `make` / scripts for setup, test, lint, run, migrate, generate API client (fill `CLAUDE.md` → Commands)
- [ ] CI (GitHub Actions) on every PR: ruff, mypy, pytest with a Postgres + Redis service, frontend lint + type-check + Vitest, **OpenAPI drift check**, **gitleaks**
- [ ] Dependabot (pip/uv, npm/pnpm, GitHub Actions, Docker), weekly, grouped
- [ ] pre-commit (ruff, prettier/eslint, gitleaks, end-of-file, large-file check)
- [ ] CODEOWNERS (founders), PR template (plain-English summary, risks, how to verify, changelog entry), issue templates
- [ ] README (what it is, how to run locally)

### BE (Django)
- [ ] Project skeleton: settings base/local/test (staging/prod files stubbed), Celery app, structlog, Sentry hook (DSN optional)
- [ ] `core`: `TenantModel`, `TenantManager`, public IDs (UUIDv7/prefixed), money and time helpers, brand-scoped permission class
- [ ] `accounts`: django-allauth headless: sign up, log in, log out, verify email, reset password, **TOTP 2-step login + recovery codes**; enforcement timing is a **setting** (`MFA_ENFORCEMENT = "signup" | "within_7_days" | "off"`, D-039, U-4 open); Google login wired but **off** by setting; login rate limits
- [ ] `brands`: Brand (name, timezone default Asia/Kolkata, currency INR, platform = none yet, status), create brand
- [ ] Memberships and roles: **Owner, Admin, Marketer, Viewer**; invitations by email (accept, expire, revoke); one login can belong to several brands (W-7)
- [ ] `audit`: append-only audit log (logins, role changes, invitations, brand changes)
- [ ] Email: console backend locally; SES settings stubbed
- [ ] **Tenant-isolation test suite** covering every endpoint (R-3)
- [ ] drf-spectacular OpenAPI schema; committed `openapi.json`
- [ ] **Synthetic data generator v1** (`backend/tests/synthetic/`): brands with customers, orders, lines, products; configurable size, categories (consumable / durable / mixed), rhythms, discounts, COD share. Writes canonical-model-shaped fixtures (tables arrive in M1; for now JSON/CSV output + unit tests)
- [ ] **PyMC-Marketing spike**: does it install in our Docker image, how long does an MBG/NBD + Gamma-Gamma fit take on 10k / 100k synthetic customers? Write findings to `docs/spikes/pymc-marketing.md`. Fallback plan if not: SciPy implementation (`technical.md` §2.2)

### FE (Next.js)
- [ ] Next.js 16 + React 19 + TypeScript strict + Tailwind 4 + shadcn/ui + lucide; pnpm
- [ ] Generated API client (`openapi-typescript` + `openapi-fetch`) in `src/lib/api/`
- [ ] Auth pages: sign up, log in, verify email, forgot/reset password, 2-step setup and challenge
- [ ] Create brand; app layout (sidebar + mobile tab bar per `design.md` §2) with **brand switcher**
- [ ] Setup checklist on Home: ✅ Account · ✅ Brand · ⏳ **Connect store (coming next)** · Questionnaire · Connect WhatsApp (shown, disabled)
- [ ] Team page: invite, roles, revoke
- [ ] Placeholder design tokens (no visual identity yet, D-016); empty/loading/error states per `design.md`
- [ ] Vitest + one Playwright E2E: sign up → verify → create brand → see checklist

## Waits on gaps (do NOT build in M0)
| Item | Waiting on |
|---|---|
| Shopify connect, import, webhooks; WooCommerce; CSV import | O-15, G1–G4, G16, O-16, O-17 |
| Live import screen, data-quality report | M1 (after the above) |
| Brand questionnaire | U-6, U-7, G12 |
| Metrics, intelligence, opportunities, Briefing content | M2–M4, F-1…F-11 |
| WhatsApp connection, templates, sending | O-04, O-05, O-13, G1 |
| Campaigns, offers, measurement | M6–M7 |
| Billing, plans, free trial | O-02, O-12, U-2, U-3 |
| Staging/production deployment | O-01 (hosting and budget) |
| Landing site / marketing website | U-1 |
| Encryption of customer PII fields (D-026) | Arrives with the customer tables in M1 (helpers may be stubbed in `core`) |

## Version pins to verify at setup
Python 3.12 · Django 5.2 LTS · DRF 3.18 · Celery 5.6 · PostgreSQL 17 · Redis 7 · Node 22 LTS · Next.js 16 · React 19 · Tailwind 4. Agents confirm the latest patch of each from official sources and record exact versions in the lock files.

## Done when
All boxes ticked; CI green on `main`; a founder can run it locally from the README, sign up, set up 2-step login, create a brand, invite a teammate and see the setup checklist; `changelogs.md` updated; PRs merged in order DEV → BE → FE.
