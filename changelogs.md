# changelogs.md — RetentionOS by Moca

> **What this file is:** The permanent record of every key decision and change made by the founders or by Claude/agents: what changed, why, and what it affects.
> **Rules:**
> - **Append-only.** Never edit or delete past entries; correct them with a new entry that references the old one.
> - Newest entries go **at the top** of each section.
> - Every merged PR adds an entry under "Change log".
> - Every decision that changes `project.md`, `technical.md` or `design.md` gets a **D-number**.
> - Status values: **Decided** (founder-approved) · **Proposed** (awaiting founder sign-off) · **Superseded** (replaced by a later entry).

---

## Entry template

```
### D-XXX · <short title>
- Date: YYYY-MM-DD · Author: <Founder name | Claude (session/agent)> · Status: Decided | Proposed | Superseded
- Decision / change: <what>
- Why: <reason>
- Impact: <files, modules, users affected; anything removed or added>
- Replaces / relates to: <D-numbers, sections>
```

---

## Decision log

### D-039 · 2-step login built now; when it becomes mandatory is a setting
- Date: 2026-11-05 · Author: Claude · Status: Proposed
- Decision: M0 builds TOTP 2-step login for all users. Whether it is mandatory at sign-up or within 7 days (before export/launch) is a configuration setting, because U-4 is still open.
- Why: The founders' later decision then needs no code change.
- Impact: `accounts` app; `docs/milestones/M0-scope.md`.

### D-038 · M0 = foundations + sign-up onboarding; stop before the open gaps
- Date: 2026-11-05 · Author: Founder · Status: Decided
- Decision: Development starts now with M0: repo, CI, local Docker setup, Django/Next.js skeletons, tenancy, accounts (sign up, log in, verify email, reset password, 2-step login), brands, roles, invitations, audit log, OpenAPI pipeline, app shell with setup checklist, synthetic test data, PyMC-Marketing spike. Everything that depends on open gaps waits: store connections and import, questionnaire, intelligence, WhatsApp, billing, deployment, landing site.
- Impact: `docs/milestones/M0-scope.md`; `technical.md` §20.1; `CLAUDE.md` R-12.

### D-037 · Daily Briefing page (G-D7)
- Date: 2026-10-23 · Author: Founder · Status: Decided
- Decision: A daily feed + optional digest: Alerts, Adjustments, Results (caused vs attributed), Savings (vs the brand's usual discount), Suggestions. Home = what to do today; Briefing = what happened and what changed.
- Impact: `project.md` §3.13; `design.md` §2, §4.8; `technical.md` §4.2 (`notifications`).

### D-036 · Two-tier "your answer vs your data" notices (G-D6)
- Date: 2026-10-23 · Author: Founder (approach) + Claude (thresholds) · Status: Decided (approach) / Proposed (thresholds)
- Decision: Within 15% → "Your data agrees"; 15–50% off → yellow "Slight adjustment" (blend used, founder told); more than 1.5× or less than 0.67× → red "Big difference": switched to the data value automatically, with "Revert to my answer" in Parameter Studio. The automatic switch only happens when the data is at least Medium confidence (≥ 50 reorders).
- Impact: Replaces the single ½×–2× conflict flag in PRD E-08. `project.md` §3.2, §3.6.

### D-035 · Pre-fill from data, or "Fill this from my data" (G-D5)
- Date: 2026-10-23 · Author: Founder · Status: Decided
- Decision: Questions the data can answer are pre-filled when the data has arrived; otherwise they offer "Fill this from my data" (Moca's default is used until the data arrives).
- Impact: `project.md` §3.2.

### D-034 · The questionnaire never waits for the data (G-D4)
- Date: 2026-10-22 · Author: Founder · Status: Decided
- Decision: Answers are saved as starting assumptions and reconciled with the data after import. If the import is still running when the questionnaire ends, Connect WhatsApp comes before the data-quality report. Import order: products, customers, orders.
- Impact: `project.md` §3.1; `technical.md` §6.1.

### D-033 · Helper line under the questionnaire button (G-D3)
- Date: 2026-10-22 · Author: Founder · Status: Decided
- Decision: A small line under "Start brand questionnaire": "This brand questionnaire helps us understand your brand better."
- Impact: `design.md` §4.6.

### D-032 · Truthful live import progress (G-D2)
- Date: 2026-10-22 · Author: Founder · Status: Decided
- Decision: The import screen shows a time estimate and live progress lines tied to the backend stage and the brand's own data. Every line must describe something actually being computed at that moment, with real numbers.
- Impact: `project.md` §3.1; `design.md` §4.6.

### D-031 · One shared account pool for both sign-up doors (G-D1)
- Date: 2026-10-22 · Author: Founder · Status: Decided
- Decision: Founders who install from the Shopify App Store and founders who sign up on our website land in the same account system (same users, brands, logins). An existing email must log in before a store is attached (prevents account takeover).
- Impact: `accounts`, `integrations_shopify`; `project.md` §3.1.

### D-030 · GitHub organization on the Free plan to start
- Date: 2026-11-05 · Author: Founder · Status: Decided
- Decision: Code lives in a company GitHub organization, private repo `retentionos`, Free plan for now. Upgrade to Team before the first outside developer joins or before production, then turn on branch rules for `main` (pull request + passing checks required, no force pushes).
- Why: Company ownership from day one; the upgrade later is a settings change only.
- Impact: Until the upgrade, "no direct pushes to main" is followed by habit and by `CLAUDE.md` R-11.

### D-029 · Optional program holdout
- Date: 2026-09-26 · Author: Claude · Status: Proposed
- Decision: A brand can hold out a persistent 5% of customers from each automated opportunity type for rolling 90-day periods (off by default).
- Why: Gives trustworthy "caused revenue" numbers even when single campaigns are too small to measure.
- Impact: PRD DEC-08, MEA-02.

### D-028 · Pooled incrementality per opportunity type
- Date: 2026-09-26 · Author: Claude · Status: Proposed
- Decision: Holdouts are applied to every automated campaign with at least 100 recipients. The headline "caused revenue" is pooled per opportunity type over rolling 90 days; single-campaign results are shown with honest ranges.
- Why: Measuring a +20% lift in one campaign with a 10% holdout needs roughly 22,000–79,000 recipients (computed), which most Indian D2C campaigns don't reach.
- Impact: Replaces "skip holdout below 1,000 recipients" in `technical.md` §11. PRD MEA-02.

### D-027 · Erase Shopify store data on `shop/redact`
- Date: 2026-09-26 · Author: Claude (from teammate's app review) · Status: Proposed
- Decision: On uninstall, delete access tokens immediately and erase all store data when Shopify's `shop/redact` arrives (48 h later).
- Why: Required by Shopify's rules. Replaces the Master Plan's proposed 30-day retention (O-10) for Shopify stores.
- Impact: `technical.md` §6.1, O-10.

### D-026 · Field-level encryption with blind indexes, platform-wide
- Date: 2026-09-26 · Author: Claude (adopting teammate's design) · Status: Proposed
- Decision: Names, emails, phones and address lines are encrypted per field (AES-256-GCM with key rotation). Keyed fingerprints (blind indexes) of **normalised** values enable matching without decryption.
- Why: Stronger protection than disk encryption alone; meets Shopify Level 2 comfortably.
- Impact: All connectors, identity resolution (phones must be E.164-normalised before hashing).

### D-025 · Intelligence model catalogue and defaults
- Date: 2026-09-26 · Author: Claude · Status: Proposed
- Decision: The models, parameters and defaults in `docs/data-and-intelligence-prd.md` Part B (E-01…E-24, DEC-01…08, MEA-01…06, X-01…03, registry §B9) are the build spec.
- Impact: M1–M7 intelligence work.

### D-024 · Canonical data model and connector interface
- Date: 2026-09-26 · Author: Claude · Status: Proposed
- Decision: All sources map into one canonical model at ingestion; connectors share one interface (connect, backfill, live updates, reconcile, write_discount, privacy_delete).
- Why: Adding WooCommerce (and later platforms) needs no change to the intelligence engine.
- Impact: PRD §A1, §A5.

### D-023 · WooCommerce is the next connector
- Date: 2026-09-26 · Author: Founder · Status: Decided
- Decision: After Shopify and CSV, WooCommerce comes "very soon": REST API + webhooks + hourly reconciliation; optional WordPress plugin later. Timing is open (O-17, proposed milestone M1b).
- Impact: Changes `project.md` §2.3 (WooCommerce no longer out of scope). PRD §A4.

### D-022 · Jev used for CSV column matching
- Date: 2026-09-26 · Author: Founder (use Jev) + Claude (hybrid design) · Status: Decided (Jev for CSV mapping) / Proposed (design)
- Decision: The CSV importer suggests column and status-value matches using known formats + rules, then Jev (one call per file). A human always confirms. Only headers and masked value profiles are sent to Jev, never raw personal data. Fallback to rules-only if Jev is unavailable. Enabled in production only if it beats rules-only on the evaluation set, and after Jev's data terms are confirmed (O-16).
- Impact: Updates D-008 (Jev stays out of the decision engine but is now used for CSV mapping) and `CLAUDE.md` R-2. PRD §A3.

### D-021 · The LLM never receives customer personal data
- Date: 2026-09-25 · Author: Claude · Status: Proposed
- Decision: Explanations are generated from a "facts" JSON of computed values only. Names, phones, emails and addresses are never sent to the LLM provider; the UI inserts names locally.
- Why: Privacy (DPDP, Shopify Level 2), lower risk with a third-party hosted model.
- Impact: `explanations` app; `technical.md` §12.

### D-020 · Consumable vs durable handled generically from data
- Date: 2026-09-25 · Author: Claude · Status: Proposed
- Decision: Each product/category is classified as consumable, durable or mixed from its same-product repeat rate (questionnaire as a prior). Durables never get replenishment; they get cross-sell, upgrade, gifting and festival opportunities.
- Why: The engine must work for every category (herbal *and* cookware *and* watches) without pilot-specific code (see D-010).
- Impact: `technical.md` §7.2 Step 5, §9.

### D-019 · Use the founders' existing GitHub, Vercel and Supabase accounts
- Date: 2026-09-25 · Author: Founder (accounts exist) + Claude (proposed usage) · Status: Proposed
- Decision: GitHub for the repo and CI; Vercel Pro for the frontend (Mumbai functions); Supabase Pro (Mumbai) as managed PostgreSQL only (no Supabase Auth or Data API); backend compute on AWS Mumbai.
- Why: Accounts are already in place; keeps the database and backend in the same AWS region; low starting cost.
- Impact: `technical.md` §3 (awaits O-01 budget sign-off).

### D-018 · Build workflow: planner → builders → reviewer → founder sign-off
- Date: 2026-09-25 · Author: Claude · Status: Proposed
- Decision: No single long chat and no free-form tmux agent swarm. Per milestone, a fresh planner session writes a plan the founders approve; 2–3 builder sessions work in parallel on separate branches; a fresh reviewer session checks PRs; founders merge using plain-English PR summaries. Coordination happens via repo documents and the OpenAPI contract.
- Why: Context limits, quality, and supervision by non-technical founders.
- Impact: `technical.md` §20.2; `CLAUDE.md`.

### D-017 · Budget: start small, but code built for 1,000 brands
- Date: 2026-09-25 · Author: Founder · Status: Decided
- Decision: No cloud credits; infrastructure is self-funded and starts small, scaling with growth. Backend code and data design must handle 1,000 brands' processing (duplicates, missing values, normalisation) from day one.
- Impact: `technical.md` §3 (Stage 1/Stage 2), §6, §15.

### D-016 · No design reference or visual identity yet
- Date: 2026-09-25 · Author: Founder · Status: Decided
- Decision: Brand and visual design are defined later. `design.md` contains binding UX rules plus suggestions; tokens are placeholders.
- Impact: `design.md`.

### D-015 · Product UI in English for V1
- Date: 2026-09-25 · Author: Claude · Status: Proposed
- Decision: The app interface and `?` explanations are English in V1. WhatsApp messages support English, Hindi and Tamil (D-007).
- Why: Founders and marketers of Indian D2C brands typically work in English; localising the UI can follow in a later release.
- Impact: `project.md` §3.14.

### D-014 · Raw Shopify payloads archived in S3, not in the database
- Date: 2026-09-25 · Author: Claude · Status: Proposed
- Decision: Raw JSON is stored compressed in S3 with an index/hash table in Postgres; normalised tables hold queryable data.
- Why: At 150M+ orders, raw JSON in Postgres would take several hundred GB of expensive database storage.
- Impact: `technical.md` §5.1, §5.3, §15.

### D-013 · Partition event tables from day one; commerce tables later if needed
- Date: 2026-09-25 · Author: Claude · Status: Proposed
- Decision: `message_event` and `webhook_inbox` are monthly-partitioned with retention; customers/orders/lines are unpartitioned with brand-leading indexes, revisited at ~100M orders.
- Impact: `technical.md` §5.3.

### D-012 · Four core documents (+ CLAUDE.md) live at the repo root
- Date: 2026-09-25 · Author: Founder (four files) + Claude (CLAUDE.md added) · Status: Decided (four files) / Proposed (CLAUDE.md)
- Decision: `changelogs.md` (decisions and changes), `project.md` (vision, PRD, founder summary), `technical.md` (architecture and technical decisions), `design.md` (frontend rules). Claude proposes adding `CLAUDE.md`, the file Claude Code reads automatically, which points agents to the four documents and holds the working rules.
- Impact: Repository layout (`technical.md` §4.1).

### D-011 · Lifecycle shown as Stage + Health
- Date: 2026-09-25 · Author: Claude · Status: Proposed
- Decision: The summary's nine lifecycle states are kept but split into **Stage** (Prospect, First-time, New, Repeat, Loyal, VIP) and **Health** (Active, At-risk, Dormant, Churned), displayed together (e.g. "VIP · At-risk").
- Why: A VIP customer can also be at risk; one single label would hide one of those facts.
- Impact: Diverges from summary §20 presentation. `technical.md` §7.4, `project.md` §3.4.

### D-010 · No pilot-specific logic, ever
- Date: 2026-09-25 · Author: Founder · Status: Decided
- Decision: No change may make the product suit the pilot brands (herbal, cookware, utensils, etc.) at the expense of others. Any change inspired by a pilot must be generic (data-driven or configurable) and must be flagged to the founders before it is made.
- Why: RetentionOS is a full-scale SaaS for the masses, not a custom project.
- Impact: `CLAUDE.md` rule R-1; all modules.

### D-009 · Core technology stack
- Date: 2026-09-25 · Author: Founder (Django + Next.js, maintained libraries) + Claude (specific versions and components) · Status: Decided (Django/Next.js) / Proposed (details)
- Decision: Django 5.2 LTS + DRF 3.18 (Python 3.12); Next.js 16 + React 19 + TypeScript; PostgreSQL; Celery 5.6 + Redis; the remaining libraries as listed in `technical.md` §2. All versions pinned via lock files and verified for compatibility at setup.
- Why: Stability (LTS), active maintenance, mutual compatibility.
- Impact: `technical.md` §2.

### D-008 · Jev is not used in the decision engine
- Date: 2026-09-25 · Author: Claude (recommendation) · Status: Proposed
- Decision: Recency windows and all other parameters are derived algorithmically (Kaplan–Meier intervals + hierarchical blending with questionnaire priors). Jev is excluded from the decision path; an optional, off-by-default "product classifier slot" may later test Jev or another model for product categorisation only (O-06).
- Why: The problem is numeric/date-based, needs explainability, and Jev (early-access API) is reported to struggle with numbers and dates.
- Impact: `technical.md` §7.1–7.2.

### D-007 · WhatsApp template languages: English, Tamil, Hindi
- Date: 2026-09-25 · Author: Founder · Status: Decided
- Impact: Template library (O-13), language selection (`technical.md` §7.2, engine step E-24), preview fonts (`design.md`).

### D-006 · Moca becomes an official Meta Tech Provider
- Date: 2026-09-25 · Author: Founder · Status: Decided
- Decision: Brands connect their own WhatsApp Business Accounts via Embedded Signup and pay Meta directly (₹0 RetentionOS markup). Moca maintains a library of Meta-approved marketing templates.
- Impact: `technical.md` §10; founder action list §22.

### D-005 · LLM runs on a hosted service
- Date: 2026-09-25 · Author: Founder · Status: Decided
- Decision: No self-hosted GPU. Provider to be selected by evaluation (O-03) behind a swappable adapter.

### D-004 · LLM used only for "?" explanations; no AI-written copy, no chatbot
- Date: 2026-09-25 · Author: Founder · Status: Decided
- Decision: The only LLM feature is a small **?** icon on computed values that returns a 2–3 sentence "why". It is not a chatbot.
- **Changes vs founder summary:** Removes "AI Campaign Creator" copy generation (summary §34, §35 step 4, §36 "creates copy", §11 step 5), natural-language querying, campaign variations, insight summaries and brand-behaviour summaries (summary §46 LLM list and "don't make the AI the algorithm" section). **Campaign messages now come from Moca's Meta-approved template library** (plus brand-submitted templates), filled with per-customer variables.
- Impact: `project.md` §2.3, §3.9, §3.12; `technical.md` §10, §12.

### D-003 · Distribution via Shopify App Store and direct sales; standalone web app
- Date: 2026-09-25 · Author: Founder · Status: Decided
- Decision: Listed Shopify public app **and** direct sales. The product runs as its own website (not embedded inside the Shopify admin).
- Impact: Billing (Shopify Billing mandatory for App Store installs; Razorpay for direct, pending O-12), auth, onboarding flows.

### D-002 · Scale target: 1,000 brands using the product in real time
- Date: 2026-09-25 · Author: Founder (1,000 brands) + Claude (size assumptions) · Status: Decided (target) / Proposed (assumptions: largest brand ≈ 1M customers / 3M orders)
- Impact: `technical.md` §15, `project.md` §3.14.

### D-001 · Build V1 end to end
- Date: 2026-09-25 · Author: Founder · Status: Decided
- Decision: Scope = summary MVP (§50) + V1 (§51), minus removals logged here. V2 (§52) is out of scope. Built internally in milestones M0–M9.
- Impact: `project.md` Part 2; `technical.md` §20.

---

## Change log

### 2026-11-05 · Document pack refreshed for development start
- Author: Claude
- All planning documents brought up to date with the founder–customer game and the day-one setup: D-030…D-039 added; `project.md` v1.2, `technical.md` v1.2, `design.md` v1.1, `CLAUDE.md` (R-11, R-12, new reading rows), PRD v1.1 header and E-08 notice rule; new `docs/milestones/M0-scope.md`.
- Note: `technical.md` §7–§22, `docs/data-and-intelligence-prd.md` and `docs/risk-review.md` were rebuilt from the planning conversation after the working copies were lost (container reset, 27 Oct). Content and decision IDs are unchanged in intent; wording may differ from the September versions. Corrected section pointers in D-007, D-032, D-033 and D-037.

### 2026-10-29 · Retention Play Map v2 and founder–customer game log added
- Author: Claude (with founders)
- Added `docs/play-map.md` (55 plays with calculation recipes, input sources and gaps G1–G19) and `docs/founder-customer-game-log.md` (G-D1…G-D7, U-1…U-13, what-ifs W-1…W-22). No code exists yet.

### 2026-09-26 · Risk & technical validation review added
- Author: Claude (critique requested by founders)
- Added `docs/risk-review.md`: verdict, signal-weighting and conflict-resolution design, component feasibility, risk register (A–G), own-spec flaws F-1…F-11, vision gaps, pre-coding recommendations. **No decisions changed**; all recommendations await founder approval.

### 2026-09-26 · Data & Intelligence PRD added
- Author: Claude (with founders)
- Added `docs/data-and-intelligence-prd.md`: Shopify data list and integration options, review of the teammate's Shopify app, CSV importer with Jev-assisted mapping, WooCommerce connector, canonical data model, and the full intelligence engine spec. Updated `CLAUDE.md` (read table, R-2), `technical.md` (§6/§7 pointers, uninstall rule, holdout rule, M1b, O-15…O-18) and `project.md` (WooCommerce and CSV scope).

### 2026-09-25 · Planning documents created
- Author: Claude (planning session with founders)
- Created `project.md`, `technical.md`, `design.md`, `changelogs.md` and `CLAUDE.md` from the founder summary and the founder Q&A (13 questions). No code exists yet.
