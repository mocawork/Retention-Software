# project.md — RetentionOS by Moca

> **What this file is:** The product north star and the Product Requirements Document (PRD) for RetentionOS V1.
> **Who reads it:** Founders, teammates, and every Claude Code agent before building any feature.
> **Companion files:** `technical.md` (how we build it), `design.md` (how it must look and feel), `changelogs.md` (every decision and change, with reasons).
> **Rule:** If this file and the founder summary (Appendix A) disagree, this file wins. Every divergence is recorded in `changelogs.md`.

Document version: 1.2 · 5 Nov 2026 · Owner: Founders (Moca)
v1.1 (26 Sep 2026): WooCommerce next, Jev-assisted CSV mapping. v1.2 (5 Nov 2026): decisions from the founder–customer game (G-D1…G-D7, logged as D-031…D-037), play catalogue in `docs/play-map.md`.

---

## Part 1 — Vision

### 1.1 The north star

**RetentionOS tells an Indian D2C brand who to contact, why, with what message and offer, on which day and at what hour, and then sends it on WhatsApp in a few clicks. It measures what actually happened and uses that to get better.**

Every feature must serve one question:

> **What message, to whom, at what time and date?**

- **To whom** comes from the intelligence engine: audiences, lifecycle, churn risk, reorder windows, value.
- **What message** comes from the objective (replenish, win back, cross-sell…), the offer engine and the approved WhatsApp template library.
- **What time and date** comes from each customer's reorder window, the brand's timing patterns (payday, weekday, festival) and each customer's preferred hour.

### 1.2 The product loop

```
Data → Intelligence → Opportunity → Audience → Campaign → Execution → Measurement → Learning
```

### 1.3 What RetentionOS is and is not

| RetentionOS **is** | RetentionOS **is not** |
|---|---|
| An action-first retention operating system | "57 dashboards, figure it out" |
| A system that learns each brand's own rhythm from its own data | A tool with hard-coded, one-size-fits-all thresholds |
| Seamless for founders, fully customisable for marketers | A tool that only experts can operate |
| WhatsApp-native (sending is built in) | An analytics tool that exports CSVs to another tool |
| Statistics and algorithms that decide; AI that only explains | An LLM that "looks at customers and decides" |
| A full-scale SaaS for thousands of brands across categories | A custom project tuned to the first pilot brands |

### 1.4 Product principles (non-negotiable)

1. **Complex underneath, simple on top.** Founders see "1,284 customers are entering their reorder window. Launch?", not the maths.
2. **Automation by default, control when required.** Every automatic value (thresholds, audiences, offers, timing) can be viewed and overridden by a marketer.
3. **Algorithms decide what is happening. The LLM only explains why.** The LLM never picks audiences, numbers, offers or timing. It turns numbers we have already computed into two or three plain sentences when a user clicks a **?** icon.
4. **Every number has a reason and a confidence.** A prediction without a confidence level and a plain reason is not shown.
5. **Category-agnostic by design.** The engine learns behaviour from each brand's data. Consumables (herbal, beauty, food) and durables (cookware, utensils) are handled by the same logic. **No pilot-specific logic is ever hard-coded** (see `CLAUDE.md` rule R-1).
6. **India-first.** WhatsApp, ₹ and lakh/crore formatting, COD and RTO (return-to-origin) realities, Indian festivals, English, Hindi and Tamil.
7. **Measure outcomes, not activity.** Incremental revenue and profit beat opens and clicks.
8. **Privacy is architecture.** Consent, opt-out, tenant isolation and deletion are built in from day one.

### 1.5 Who we build for

- **Primary users:** Founders of Indian D2C brands and their small marketing teams, 1–5 people, with no data-science team.
- **Secondary users:** Performance and retention marketers and agencies who want control (advanced audience builder, overrides, A/B tests).
- **Initial platform:** Shopify stores, plus CSV import for others.
- **Scale target:** **1,000 brands** (1,000 store owners, each possibly with teammates) using the product at the same time, with the largest brands at about 1M customers and 3M orders.
- **Categories:** All D2C categories with repeat or cross-sell potential. Tiers from the summary guide go-to-market priority, **not** product logic. Pilot brands (herbal, cookware, utensils, etc.) are test beds; the product must work equally well for beauty, supplements, food, fashion, pet and home.

### 1.6 Differentiation and moat (condensed)

Predictive RFM, CLV and churn are **not** unique (Klaviyo and RetentionX already offer them). We win on:

1. **India-first:** WhatsApp as the execution layer, Indian languages, festivals, COD/RTO-aware analytics, ₹0 WhatsApp markup (brands pay Meta directly).
2. **Founder-first UX:** "What should I do today?" as the home screen.
3. **Action-first:** The Opportunity (not the dashboard) is the primary object.
4. **Adaptive parameters:** The engine works out each brand's recency windows, thresholds and timing automatically from its own data and questionnaire, shows why, and lets marketers override. Competitors make users type these numbers in by hand.
5. **Measured learning:** Built-in holdout groups and A/B tests measure *caused* revenue, not just *attributed* revenue. Over time this builds a proprietary dataset of what works for Indian consumers: behaviour, offer response, product sequences and timing.

### 1.7 North Star Metric

**Incremental Retention Revenue**: revenue caused by RetentionOS campaigns, measured against holdout groups, summed across brands per month.
Guardrail metrics: incremental gross profit (after offer cost and Meta cost), opt-out rate, Meta quality rating, prediction accuracy (backtested).

---

## Part 2 — Scope

### 2.1 Release definition

We build **V1 end to end** = everything in the summary's **MVP (section 50) plus V1 (section 51)**, minus items explicitly removed in `changelogs.md`. **V2 (section 52) is out of scope** for now.

Internally, V1 is built in milestones (see `technical.md` §20). Only the complete V1 is released to brands, though pilot brands may use staging builds.

### 2.2 In scope for V1

| Area | Included |
|---|---|
| Data | Shopify (public app), CSV import with Jev-assisted column matching, historical backfill, real-time webhooks, nightly reconciliation; **WooCommerce next** (milestone M1b, O-17) |
| Data quality | Deduplication, identity resolution, normalisation, missing-value handling, data-quality report |
| Analytics | Revenue, customers, AOV, frequency, purchase interval, retention and repeat rate, cohorts, historic LTV, product repeat rate |
| Intelligence | Adaptive parameter engine, RFM, lifecycle, churn risk / probability-alive, reorder window, predicted LTV, product affinity and next-best product, discount sensitivity, temporal patterns (payday, weekday, festival), send-time and language selection, confidence on everything |
| Customer 360 | Unified profile, historical and predicted journey visualisation |
| Segments | Automatic segments and an advanced manual audience builder |
| Opportunities | Replenishment, high-value winback, VIP, cross-sell, one-time → second purchase, payday window, festival window, dormant reactivation. The full catalogue of 55 possible plays, with how each is calculated and which are V1, is in `docs/play-map.md` |
| Campaigns | Opportunity → objective → offer → template → timing → preview (cost and potential) → launch; scheduling; per-customer send time; unique discount codes; tracked links |
| WhatsApp | Meta Tech Provider Embedded Signup, Moca template library (English, Hindi, Tamil) auto-submitted to each brand's WhatsApp account, sending, delivery status, replies/opt-outs, frequency caps, quality monitoring |
| Measurement | Campaign analytics, attribution, **holdout-based incremental revenue**, A/B testing, campaign learning loop, offer recommendations from experiment results |
| Explanations | **?** icons that return a 2–3 sentence LLM explanation of any computed number |
| Platform | Multi-brand accounts, roles, audit log, billing (Shopify Billing + Razorpay), plans and limits, notifications |

### 2.3 Explicitly out of scope for V1

- **Any LLM-written campaign copy, and any chatbot or natural-language querying.** Changed from the summary; see `changelogs.md` D-004.
- Email, SMS and other channels; commerce platforms other than Shopify and WooCommerce; product features built on website behavioural events (the Shopify pixel collects them; use decided in O-07); browse recovery.
- Autonomous (Level 4) sending. Every campaign needs a human to click Launch. Recurring campaigns need explicit approval of the rule.
- Advanced multi-touch attribution; contextual bandits; multi-channel orchestration.
- Abandoned-cart flows. This is an open decision (see `technical.md` §21, O-07), because they need real-time triggered sends, a different product surface.

### 2.4 Automation levels in V1

| Level | Name | V1? |
|---|---|---|
| 1 | Insight: "here is what is happening" | ✅ |
| 2 | Recommendation: "here is what we recommend" | ✅ |
| 3 | Execution: "here is the campaign, launch it" | ✅ (human clicks Launch) |
| 4 | Autonomous: continuous execution within rules | ❌ (V2+) |

---

## Part 3 — Product Requirements (PRD)

Each module lists **user stories** and **acceptance criteria** (AC). "Founder" means a non-expert user. "Marketer" means an expert user. Both have the same permissions unless roles restrict them.

### 3.1 Sign-up, onboarding and first value

**Goal:** A founder goes from zero to seeing their first real opportunities with as little effort as possible.

Flow: `Sign up → Connect store (Shopify or CSV) → Brand questionnaire (while data syncs) → Data-quality report → First insights and opportunities → Connect WhatsApp → First campaign`.

User stories
- As a founder, I can sign up with email + password or Google, create my brand, and invite teammates.
- As a founder, I can install RetentionOS from the Shopify App Store **or** start on our website and connect Shopify. Both paths end in the same account: **one shared account pool** (G-D1).
- As a founder without Shopify, I can upload CSV/Excel files (orders, customers, products, consent). RetentionOS **matches the columns for me** (known formats, rules, and Jev suggestions), and I only confirm or fix the uncertain ones on one preview screen.
- As a WooCommerce founder, I can connect my store by approving access in WordPress (after milestone M1b).
- As a founder, I answer a short brand questionnaire while my data syncs, so the wait feels useful.
- As a founder, I see a **time estimate** and **live progress** while my store imports, with lines that describe what is really being worked out from my own data ("Found 10,350 customers who came back more than once…"). Every line must describe something actually being computed at that moment, with real numbers (G-D2).
- As a founder, I see a **data-quality report** in plain English ("6% of orders have no phone number; 1,204 duplicate customers merged; 3.1% of COD orders were returned-to-origin and excluded from purchase behaviour").

AC
- Historical sync of a typical brand (≤100k orders) finishes and first insights appear **within 1 hour**. The largest supported brand (≈3M orders) finishes within 12 hours, with progress shown and partial insights marked "provisional".
- The questionnaire can be skipped. Every question has a sensible default and can be edited later in Brand settings.
- **The questionnaire never waits for the data** (G-D4). Answers are saved as starting assumptions and checked against the data when the import finishes. Import order: products, then customers, then orders, so "What do you sell?" can be pre-filled early. If the import is still running when the questionnaire ends, **Connect WhatsApp** comes next, before the data-quality report.
- Duplicate installs, reinstalls and uninstalls are handled cleanly (uninstall stops syncing and deletes the access key at once; the store's data is erased when Shopify's `shop/redact` arrives 48 hours later, D-027; see `technical.md` §6.1).

### 3.2 Brand questionnaire → Brand Knowledge Profile

**Purpose:** Gives the engine starting assumptions (priors) where data is thin, sets guardrails, and supplies template variables. The **data overrides the questionnaire** as evidence grows (see `technical.md` §7.2).

Sections (short; most answers are pick-lists):
- **Brand:** what you sell (category pick-list with multi-select), price position (mass / premium / luxury), customer type, geography focus.
- **Products:** hero products (picked from the synced catalogue), for each main category: "Is this used up and re-bought?" (consumable / durable / mixed), "How long does one unit typically last?" (ranges), known cross-sell pairs (optional).
- **Commercial:** gross margin range, acceptable and maximum discount, free-shipping threshold, COD offered?, products that must never be discounted.
- **Retention:** typical reorder period (optional; pre-filled with the detected value once data is in), VIP definition (default: top 5% by net revenue; editable), preferred offer types.
- **Communication:** default message language (English / Hindi / Tamil), tone (friendly / premium / playful, which picks template variants), emoji preference, brand sign-off name.
- **Guardrails:** maximum marketing messages per customer per week and month, quiet hours, approval requirement (e.g. any campaign above N recipients needs Owner approval).

AC
- Answers are stored as a **versioned** Brand Knowledge Profile. Every change is audit-logged.
- Anywhere a questionnaire value is used, the UI shows its source ("from your questionnaire", "learned from your data", "set manually by Priya").
- Questions the data can answer are **pre-filled when the data has arrived**; otherwise they offer **"Fill this from my data"**, and Moca's default is used until the data arrives (G-D5).
- When an answer disagrees with the data (G-D6): within 15% → ✅ "Your data agrees"; 15–50% off → 🟡 "Slight adjustment" (the blend is used and the founder is told); more than 1.5× or less than 0.67× → 🔴 "Big difference": the engine switches to the data value automatically and offers **"Revert to my answer"** in Parameter Studio, with an impact preview. The automatic switch happens only when the data is at least Medium confidence (≥ 50 reorders); otherwise the notice says "We're watching this".

**Pending founder decisions for the questionnaire (not yet decided; see `docs/founder-customer-game-log.md`):**
- U-6: every question must change something the engine does; questions that change nothing (e.g. "Who buys from you?", "Key competitors") are cut or moved to an optional box.
- U-7: one core questionnaire + an add-on page per store type (Consumables, Fashion & ethnic wear, Durables & home, Jewellery & gifting, Food & perishables, Kids/baby & pets).
- G12: new questions needed by some plays: usual discount today, subscriptions offered, loyalty/referral programme, typical delivery time; language preference at WhatsApp opt-in.

### 3.3 Home — "What should I do today?"

**The hero screen.** It is not an analytics dashboard.

Content, top to bottom:
1. **Today's summary:** "3 high-priority opportunities · ₹4.8L potential · 2,184 customers ready".
2. **Opportunity cards** (ranked): title, audience size, potential value, the reason in one line, recommended action / offer / timing, confidence, `[Review campaign]` and `[?]`.
3. **Retention health strip:** repeat rate, active customers, revenue at risk, each with trend and `?`.
4. **Upcoming:** opportunities expected in the next 7–14 days (e.g. "Payday window starts Monday; 3,400 customers").
5. **Campaigns in flight and recent results**, showing incremental revenue once measurable.

AC
- Loads in under 1.5 s at the 95th percentile. All numbers are precomputed; nothing heavy runs when the page opens.
- Every card is actionable in at most 2 clicks to a ready-to-review campaign.
- If data is insufficient, it shows an honest empty state ("We need about 60 more days of orders to predict reorder windows confidently; here is what we can already see…").

### 3.4 Customers and Customer 360

- A customer list (virtualised, searchable by name, phone or email, filterable by any audience-builder field).
- A **Customer 360** page with these sections:
  - **Historical:** orders, net revenue, AOV, first and last purchase, average interval.
  - **Behaviour:** preferred category, typical basket, discount dependency, preferred purchase day and hour.
  - **Predictions:** next purchase window with range and confidence, probability still active, churn risk, predicted 12-month value, next-best product.
  - **Marketing:** consent status and source, language, last campaign, last response, frequency-cap status.
  - **Lifecycle:** stage plus health (e.g. "Repeat · At-risk").
- **Journey visualisation:** a timeline of historical events (orders, campaigns received, clicks, refunds, RTO) and the **predicted** next steps (expected reorder window, recommended action), drawn distinctly.

AC
- Every predicted field shows a confidence (High / Medium / Low) and has a `?`.
- Merged identities are visible ("This profile merges 2 Shopify customer records with the same phone number") with an audit trail. A marketer can un-merge.

### 3.5 Intelligence (analytics) pages

Tabs: **Retention · Cohorts · Value (LTV) · Churn · Purchase behaviour · Products · Timing**.
- **Retention:** repeat purchase rate, retention curves, time to second order, new vs returning revenue.
- **Cohorts:** monthly acquisition cohorts × months since first order (customers, revenue, retention %).
- **Value:** historic LTV distribution, predicted 12-month value, value by acquisition month and category.
- **Churn:** customers by health state, revenue at risk, recovered customers.
- **Purchase behaviour:** purchase-interval distributions (brand, category, product), discount usage.
- **Products:** repeat rate per product, consumable vs durable classification, affinity pairs and sequences ("bought A then B within 60 days").
- **Timing:** day-of-month, weekday and hour patterns; payday and festival effects **only when statistically significant** (otherwise it says "no meaningful pattern found").

AC: Every chart has a one-line "what this means" caption, and every KPI has a `?`. Filters: date range, category, acquisition cohort.

### 3.6 Parameter Studio — "seamless for founders, customisable for marketers"

**This is how we crack the "recency number" problem.** The engine derives every threshold automatically. The Parameter Studio shows them and lets marketers override them.

For each parameter (e.g. *expected reorder interval*, *at-risk threshold*, *dormant threshold*, *VIP cut-off*, *RFM score bands*, *affinity minimum lift*) and each scope (brand → category → product), it shows:
- **Current value** (e.g. "Herbal hair oil: expected reorder 38 days; at-risk after 52 days").
- **Source:** learned from data / blended with questionnaire / category default / manual override.
- **Evidence:** "Based on 4,812 repeat purchases; confidence High", with a small distribution chart.
- **Override:** a marketer sets a value, with an optional expiry and reason. The system keeps showing what it *would* have used.
- **Impact preview before saving:** "This change moves 1,120 customers from Active to At-risk."

AC
- Founders never need to open this screen. Marketers can change anything here.
- Overrides are audit-logged and reversible.
- Questionnaire-vs-data notices (G-D6) link here; "Revert to my answer" creates an override, and the system keeps showing its own value beside it.

### 3.7 Segments and Audience Builder

- **Automatic segments** (always up to date): Replenishment-ready, High-value at-risk, High-LTV, One-time customers, Likely repeaters, Discount-sensitive, VIP, Dormant, Cross-sell opportunity, and RFM segments (Champions, Loyal, At Risk, Can't Lose, Hibernating, etc.).
- **Manual Audience Builder:** a visual AND/OR rule builder over fields grouped as Customer (location/state, first and last purchase), Behaviour (orders, AOV, interval, product, category), Value (LTV, revenue, predicted value), Retention (churn risk, reorder probability, lifecycle), Marketing (consent, language, campaign interaction, previous offer). "Age" appears only if the brand's data actually contains it.
- A live count ("1,482 customers") updates as rules change.
- Save, duplicate, compare two segments side by side, export (Owner/Admin only, audit-logged).

AC: The count preview returns in under 2 s at the 95th percentile for a 1M-customer brand. Saved segments re-evaluate at campaign send time.

### 3.8 Opportunity Engine

Every day, per brand, the engine scans all customers and produces **Opportunities**. Each answers:

| Question | Source |
|---|---|
| WHO | Audience (rule plus eligibility: consent, caps, suppression) |
| WHY | Reason codes ("entered expected reorder window: day 45 of typical 38–52") |
| WHAT | Objective and recommended template |
| OFFER | Offer engine within guardrails (often "no discount") |
| WHEN | Recommended date (window start, payday, festival) and per-customer hour |
| WHERE | WhatsApp (V1) |
| VALUE | Potential revenue with a confidence range; later, measured incremental revenue |

Opportunity types in V1: Replenishment, High-value winback, At-risk save, VIP appreciation/early access, Cross-sell (next-best product), One-time → second purchase, Dormant reactivation, Payday window (if detected), Festival window (if the brand historically responds).

AC
- Opportunities are deduplicated: a customer appears in at most one active recommended opportunity at a time (priority order configurable), so they are not double-messaged.
- Each opportunity can be dismissed ("not now" / "never for this type"). Dismissals feed ranking.
- The potential value is labelled "potential"; after campaigns run, "measured incremental" is shown separately.

### 3.9 Campaigns

Flow: **Who → Why → What (objective) → Offer → Message (template + language + preview) → When (date + per-customer time) → Review (cost, potential, holdout) → Launch**.

- **Offer step:** recommended offer (no discount / % / fixed ₹ / free shipping / bundle / product incentive / loyalty benefit / early access) with the reason, always within guardrails. Unique Shopify discount codes are generated when an offer is used.
- **Message step:** choose from **approved** templates for this objective in the brand's WhatsApp account, in English, Hindi or Tamil. Variables are filled per customer (name, product, offer, link). Preview on a phone mock-up. **No AI-written copy** (D-004).
- **When step:** "Send at each customer's best hour on <date>" (default) or a fixed time. Quiet hours are always respected.
- **Review step:** recipients after eligibility filtering (showing who was excluded and why), estimated Meta messaging cost (from Meta's current India rate card, stored in config), offer cost estimate, potential revenue range, **holdout group** size (default 10%), A/B variants (optional).
- **Launch:** confirmation showing cost. Campaigns above the approval threshold need Owner approval.
- **Recurring campaigns:** a marketer can save "run this opportunity type every week" as a rule. Each run still needs one-click approval in V1.

AC
- A campaign can never message a customer who has opted out, lacks consent, or would exceed a frequency cap. Enforced server-side at send time, not just at build time.
- Sending respects Meta's throughput, messaging-limit tier and per-user marketing limits. Delivery failures are categorised with plain-English reasons.
- Once launched, the campaign is locked for editing. It can be paused or cancelled; pausing stops unsent messages.

### 3.10 WhatsApp

- **Connect:** Meta Embedded Signup inside RetentionOS. The brand owns its WhatsApp Business Account and pays Meta directly with its own payment method (**₹0 RetentionOS markup**).
- **Template library:** Moca writes and maintains a library of templates per objective × tone × language (English, Hindi, Tamil). On connect, the library is submitted to the brand's WhatsApp account for Meta approval. Status is tracked (pending / approved / rejected / paused) and rejected ones are fixed and resubmitted by Moca.
- **Brand custom templates** (marketer): a brand can write its own template, submit it for Meta approval, and use it once approved.
- **Inbox (minimal):** replies are shown per campaign. Opt-out keywords (STOP, "unsubscribe", Hindi and Tamil equivalents) and Meta's marketing opt-out are auto-processed.
- **Health:** number quality rating, messaging tier and template status, with alerts when quality drops.

### 3.11 Measurement and learning

Per campaign: sent, delivered, read, failed (by reason), clicked, replied, opted out, orders, revenue, **attributed revenue**, offer cost, Meta cost, ROI, and, when a holdout exists, **incremental orders, revenue and profit with a confidence interval**.
- **Attribution (V1):** an order counts as attributed if the customer (a) used the campaign's discount code, or (b) clicked the campaign link, or (c) received the message, and ordered within the attribution window (default 7 days, configurable). Each rule is labelled separately.
- **Incrementality:** treatment vs holdout conversion. This is the number we celebrate.
- **A/B tests:** up to 3 variants (offer or template), with random assignment and a result stated with its confidence ("Variant B beats A with 94% probability").
- **Learning loop:** results update discount sensitivity, offer recommendations and opportunity ranking for that brand.

### 3.12 Explanations (the `?` icon)

- Present on every computed number, segment membership, prediction, opportunity and recommendation.
- Clicking opens a small popover with **2–3 plain-English sentences** and the key numbers behind them, e.g. *"Asha is marked High-value because she has spent ₹8,420 across 4 orders, which is more than 92% of your customers. She usually reorders every 54 days and it has been 63 days, so she is slightly late."*
- **Not a chatbot.** No free-text input.
- If the LLM output fails validation (any number or name that is not in the computed facts), a deterministic template sentence is shown instead. Users never see a hallucinated number.

### 3.13 Team, roles, billing, settings, notifications

- **Roles:** Owner, Admin, Marketer, Viewer (and later Agency). One user can belong to many brands (agencies), with a brand switcher.
- **Audit log:** who changed what and when (parameters, guardrails, campaigns, exports, merges).
- **Billing:** Shopify-installed brands pay via Shopify Billing. Direct-contract brands pay via Razorpay subscriptions (see `technical.md` §17). Plans limit active customer profiles and seats. Meta costs are billed by Meta, never by us.
- **Briefing page (G-D7):** a daily feed of what happened and what changed, plus an optional daily digest by email/WhatsApp to the founder. Five kinds of items: 🔴 Alerts (action needed, e.g. WhatsApp quality drop, template rejected, sync broken, billing issue), 🟡 Adjustments (values the engine changed, incl. G-D6 notices), 📈 Results (campaign outcomes once the attribution window closes, caused vs attributed), 💰 Savings (measured against the brand's own usual discount, never inflated), 💡 Suggestions (e.g. "8 pm sends got 1.4× more reads than 11 am"). Home stays "What should I do today?"; the Briefing is "What happened and what changed".
- **Notifications (email + in-app):** sync finished, new high-priority opportunity, campaign finished, quality-rating drop, template rejected, billing issues.

### 3.14 Non-functional requirements

| Requirement | Target |
|---|---|
| Scale | 1,000 brands concurrently; largest brand ≈1M customers / 3M orders; ≥50M customers and ≥150M orders platform-wide without redesign |
| Page speed | Dashboard and API reads p95 < 300 ms server time; Home < 1.5 s p95 end to end |
| Audience count | p95 < 2 s for a 1M-customer brand |
| Freshness | Webhook-driven order data visible within 5 minutes; predictions and opportunities recomputed at least daily per brand |
| Reliability | 99.5% monthly uptime target for V1; no lost webhooks (durable inbox + nightly reconciliation) |
| Correctness | Every metric has a written definition and an automated test on fixture data |
| Security | Tenant isolation tested on every endpoint; encryption at rest and in transit; Shopify Level-2 protected-data requirements met |
| Privacy | DPDP-aligned consent, purpose limitation, deletion workflows; full compliance before 13 May 2027 |
| Languages | UI in English (V1); WhatsApp templates in English, Hindi, Tamil |
| Devices | Fully responsive; Home, Opportunities, Campaign review/launch and Customer 360 must work well on a phone |
| Accessibility | WCAG 2.2 AA for core flows |

---

## Part 4 — Success metrics

| Layer | Metric |
|---|---|
| North star | Incremental retention revenue (holdout-measured) per brand per month |
| Brand value | Repeat purchase rate uplift; % of revenue from returning customers; campaign ROI |
| Activation | % of brands that launch a first campaign within 7 days of connecting |
| Engagement | Weekly active brands; opportunities actioned ÷ shown |
| Trust | % of predictions with High/Medium confidence; backtested reorder-window accuracy; `?` clicks followed by launch |
| Health | Opt-out rate < 2% per campaign; Meta quality rating stays Green; sync error rate |

---

## Part 5 — Glossary (plain English)

| Term | Meaning |
|---|---|
| **Recency / reorder window** | How many days after a purchase a customer usually buys again. Learned per brand, category, product and customer. |
| **RFM** | Scores for Recency (how recently), Frequency (how often), Monetary (how much). Used to group customers. |
| **LTV / CLV** | Customer lifetime value. *Historic* = what they have spent; *predicted* = what they are expected to spend in the next 12 months. |
| **Probability alive (P-alive)** | The statistical chance that a customer is still an active buyer rather than silently gone. |
| **Churn risk** | How likely the customer is to stop buying, judged against *their own* normal rhythm. |
| **Confidence** | How much evidence supports a number: High / Medium / Low. |
| **Prior** | The starting assumption (from questionnaire or category defaults) used before enough data exists. |
| **Holdout group** | A random slice of an audience that deliberately does *not* get the message, so we can measure what the message really caused. |
| **Incremental revenue** | Revenue from the messaged group minus what the holdout group suggests would have happened anyway. |
| **Attributed revenue** | Revenue from customers who interacted with a campaign. Easier to measure, but it overstates impact. |
| **Opportunity** | A recommended, ready-to-launch action: who, why, what, offer, when, value. |
| **Template** | A WhatsApp message format pre-approved by Meta, with blanks (variables) we fill per customer. |
| **Tech Provider** | Meta's programme that lets Moca onboard brands' own WhatsApp accounts; brands pay Meta directly. |
| **RTO** | Return-to-origin: a COD order that was never delivered/accepted. Not a real purchase. |
| **Tenant** | One brand's isolated data space inside RetentionOS. |

---

## Appendix A — Original founder summary (reference, unedited in substance)

> Kept for context. Where it conflicts with Parts 1–5 above, Parts 1–5 win. Divergences are logged in `changelogs.md` (notably D-004: no LLM-written copy or natural-language querying in V1; D-011: lifecycle shown as stage + health).



### A.1 Executive Summary

What is RetentionOS?

RetentionOS is an India-first retention operating system for D2C brands.

It connects to a brand's commerce data, learns how the brand and its customers behave, identifies retention opportunities, builds the appropriate audience and campaign, and allows the brand to execute that action with minimal effort.

The fundamental product loop is:

Data → Intelligence → Opportunity → Audience → Campaign → Execution → Measurement → Learning

The product is designed primarily for D2C founders and small marketing teams that have customer data but do not have a dedicated retention/data science/CRM team.

The core promise is:

RetentionOS tells a D2C brand who to target, why they should be targeted, what action to take, what to say, and lets them launch the campaign.

### A.2 The Problem

D2C brands increasingly accumulate large amounts of first-party customer data:

- customer information

- orders

- products

- purchase frequency

- discounts

- refunds

- acquisition source

- customer lifetime value

- website behaviour

- campaign responses

- WhatsApp engagement

The problem is not simply lack of data.

The problem is:

Most founders do not have a system that continuously converts this data into retention decisions.

A founder may know:

“We have 40,000 customers.”

But they may not know:

- Which customers are about to reorder?

- Which customers are becoming inactive?

- Which customers are worth saving?

- Which customers are likely to respond without a discount?

- Which customers need an incentive?

- What product should each customer see next?

- When should they be contacted?

- Which customers should receive WhatsApp versus another channel?

- Which campaign should be launched today?

- How much incremental revenue did the campaign actually create?

Existing marketing tools can provide powerful targeting and automation, but this often still requires the marketer to know what segment to build and what campaign to create.

RetentionOS aims to move one layer higher:

Instead of only giving the marketer tools, RetentionOS continuously identifies the actions the brand should consider taking.

### A.3 The RetentionOS Thesis

The thesis is:

The next generation of D2C retention software will not simply report what happened. It will understand what is likely to happen, identify what can be done about it, and make execution immediate.

Traditional analytics:

What happened?

Predictive analytics:

What is likely to happen?

RetentionOS:

What should we do about it?

And eventually:

Do it.

### A.4 The Product Principle

Complex underneath. Simple on top.

RetentionOS may use:

- statistical models

- machine learning

- customer segmentation

- cohort analysis

- propensity models

- survival/churn analysis

- recommendation systems

- rule engines

- LLMs

- natural-language interfaces

But the founder should not need to understand those systems.

The founder should see:

1,284 customers are entering their expected reorder window.

They historically reorder after 52–65 days.

342 high-value customers have exceeded that window.

Recommended action: replenishment campaign.

Recommended channel: WhatsApp.

Recommended offer: no discount.

\[Review Campaign\]

\[Launch\]

### A.5 Who We Are Building For

Initial ICP

RetentionOS initially focuses on:

Indian D2C brands

Primarily:

- Shopify brands

- digitally native brands

- owned-store businesses

- founder-led companies

- small marketing teams

- brands with meaningful customer/order history

- brands with repeat-purchase potential

The ideal customer should have enough customer volume for retention intelligence to produce meaningful economic value.

### A.6 Initial Category Focus

Priority categories:

Tier 1

- Beauty

- Skincare

- Personal care

Tier 2

- Health

- Wellness

- Supplements

Tier 3

- Food

- Beverage

- Consumables

Tier 4

- Fashion

- Lifestyle

Tier 5

- Specialty/home/pet categories where repeat or cross-sell behaviour exists

The first categories are attractive because customer behaviour can often be modeled around:

- replenishment

- product lifecycle

- product relationships

- repeat purchase

- customer value

- discount behaviour

### A.7 Market

There is no single authoritative figure for “Indian D2C market size” because different research firms use materially different definitions.

McKinsey currently estimates that the D2C channel accounts for approximately \$10–12B of Indian e-commerce sales, with the potential to reach approximately \$60B by 2030. McKinsey also reports that D2C adoption is accelerating nearly three times faster than marketplace e-commerce.

Other commercial market-research databases produce much larger D2C figures because they use broader definitions of D2C e-commerce.

Therefore:

RetentionOS will not use a giant D2C GMV figure as its SaaS TAM.

The company will calculate TAM using:

Qualifying merchants × realistic annual RetentionOS revenue per merchant

This produces a more defensible SaaS market calculation.

### A.8 Shopify Market

Third-party Shopify technology databases currently indicate roughly 120,000–130,000 Shopify stores in India, depending on methodology and definition of an active store.

This should be treated as a merchant-universe estimate, not an official Shopify-published India merchant count.

Not all Shopify stores are relevant to RetentionOS.

The actual funnel is:

Indian Shopify stores

↓

Commercial businesses

↓

D2C / consumer brands

↓

Brands with meaningful customer data

↓

Brands with repeat-purchase potential

↓

Brands large enough to pay for retention software

↓

RetentionOS ICP

A preliminary working estimate for the qualifying market should be treated as a hypothesis until validated using merchant databases, revenue proxies and direct market research.

### A.10 Why Retention?

Acquiring a customer is only one part of D2C economics.

A brand can increase revenue by:

1\. acquiring more customers

2\. increasing AOV

3\. increasing purchase frequency

4\. increasing retention

5\. reducing churn

6\. increasing customer lifetime value

RetentionOS focuses primarily on:

2 + 3 + 4 + 5 + 6

The economic argument is simple:

If a brand already paid to acquire a customer, extracting additional profitable purchases from that customer can be economically valuable.

RetentionOS therefore operates on the post-acquisition customer relationship.

### A.11 Competitive Reality

RetentionOS is entering an existing market.

Klaviyo

Klaviyo already provides predictive analytics including:

- historic CLV

- predicted CLV

- total CLV

- churn-risk prediction

- average time between orders

- predicted orders

- predictive segmentation

Klaviyo's predictive system requires sufficient data; its current documentation specifies requirements including at least 500 customers who have ordered, 180 days of order history, recent orders and some customers with three or more orders.

Therefore:

“We predict churn using AI” is NOT a defensible differentiator by itself.

### A.12 RetentionX

RetentionX already provides:

- Customer 360

- RFM

- LTV

- churn prediction

- product insights

- cross-selling

- cohort analysis

- custom segmentation

- segment comparison

- one-click activation

- ML-powered forecasts

Its current documentation also describes customer-level churn risk, expected LTV and personalized product recommendations.

Therefore:

“We are RetentionX but with AI”

is NOT enough.

### A.13 Our Differentiation

RetentionOS should differentiate around five areas.

1\. India-first

Build specifically around:

- Indian D2C economics

- WhatsApp-first customer communication

- Indian purchasing patterns

- regional language possibilities

- Indian festivals

- Indian consumer behaviour

- COD realities

- Indian SMB/founder workflows

- local pricing

2\. Founder-first UX

Existing systems can be powerful but often require marketing knowledge.

RetentionOS should make the default workflow:

Tell me what I should do.

Rather than:

“Here are 57 dashboards. Figure it out.”

3\. Action-first intelligence

The primary object is not the dashboard.

The primary object is:

Opportunity

Example:

1,842 customers are entering their expected reorder window.

Then:

Why?

Who?

What should we do?

Create campaign.

Launch.

4\. WhatsApp-native execution

WhatsApp is not a disconnected integration.

It is a core execution layer.

5\. Brand intelligence

RetentionOS learns:

- brand positioning

- product catalogue

- product relationships

- product lifecycle

- margins

- discount strategy

- customer profile

- communication style

- business goals

This contextual layer informs recommendations and campaign generation.

### A.14 Brand Onboarding

Onboarding should begin with:

Step 1 — Connect store

Shopify / CSV initially.

Step 2 — Brand questionnaire

RetentionOS asks:

Brand

- What do you sell?

- Who is your customer?

- What makes you different?

- What is your brand personality?

- What price position are you in?

Product

- Product categories

- Hero products

- Replenishment cycle

- Product lifecycle

- Cross-sell relationships

Commercial

- AOV

- margins

- acceptable discounts

- free shipping threshold

- COD

- promotional rules

Retention

- Typical reorder window

- VIP definition

- preferred retention offers

- products that should not be discounted

Communication

- Tone

- Language

- Brand vocabulary

- Emoji preference

- WhatsApp style

### A.15 Brand Knowledge Engine

The questionnaire creates a structured:

Brand Knowledge Profile

This becomes context for:

- recommendations

- campaign generation

- offer selection

- product recommendations

- AI assistant

- audience explanations

The objective is:

The system should understand the business, not merely the database.

### A.16 Data Layer

Initial data sources:

Shopify

- customers

- orders

- products

- order items

- discounts

- refunds

- timestamps

- customer contact information

CSV

For brands without direct integration during early onboarding.

Future:

- WooCommerce

- other commerce platforms

- advertising platforms

- email platforms

- WhatsApp

- website events

- customer support

- loyalty systems

### A.17 Customer Identity Resolution

The system must create one canonical customer identity.

Possible identifiers:

- email

- phone

- Shopify customer ID

- order information

- historical identifiers

Example:

Customer A:

Karthik S

Customer B:

Karthik

Both:

same phone/email

↓

RetentionOS:

ONE CUSTOMER

This becomes the foundation of Customer 360.

### A.18 Customer 360

Every customer gets a unified profile.

Example:

Customer

Customer \#48291

Historical

Orders: 4

Revenue: ₹8,420

AOV: ₹2,105

First purchase: Jan 2025

Last purchase: Jul 2026

Average purchase interval: 54 days

Behaviour

Preferred category: Haircare

Typical basket: Shampoo + Serum

Discount dependency: Low

Preferred purchase period: Month beginning

Predictions

Expected next purchase: 12 days

Churn risk: Elevated

Predicted future value: ₹X

Next-best product: Conditioner

Marketing

WhatsApp consent: Yes

Last campaign: 23 days ago

Last campaign response: Click

### A.19 RetentionOS Customer Journey

The product should visualize the customer journey:

Acquisition

↓

First purchase

↓

Second purchase

↓

Repeat

↓

Expected next purchase

↓

Retention opportunity

↓

Campaign

↓

Purchase

↓

Cross-sell

↓

VIP

↓

Potential churn

The system should make this understandable visually.

### A.20 Customer Lifecycle

Initial lifecycle states:

1\. Prospect

2\. First-time buyer

3\. New customer

4\. Repeat customer

5\. Loyal customer

6\. VIP

7\. At-risk

8\. Dormant

9\. Churned

These states should not be entirely hard-coded.

The thresholds should adapt to:

- category

- product

- customer history

- purchase frequency

- brand behaviour

### A.21 Core Analytics

RetentionOS should calculate:

Revenue

- gross revenue

- net revenue

- repeat revenue

- new customer revenue

- returning customer revenue

Customer

- total customers

- new customers

- repeat customers

- active customers

- inactive customers

Behaviour

- AOV

- purchase frequency

- purchase interval

- retention rate

- repeat purchase rate

- cohort retention

Value

- historic LTV

- predicted LTV

- customer contribution

- customer segment value

Product

- repeat product rate

- product affinity

- product-to-product relationships

- cross-sell opportunities

### A.22 RFM

RetentionOS will use RFM as a foundational segmentation methodology.

Recency

How recently did the customer purchase?

Frequency

How frequently do they purchase?

Monetary

How much value have they generated?

RFM should be one component of the intelligence engine, not the complete intelligence engine.

### A.23 Behavioural Engine

This is one of the core product areas.

The engine should identify patterns such as:

- purchase frequency

- reorder timing

- product sequence

- discount response

- AOV behaviour

- category preference

- campaign response

- inactivity

- purchase timing

- cross-sell relationships

### A.24 Churn Engine

Churn should be modeled relative to the customer's historical behaviour.

Example:

Customer normally purchases every:

45–55 days

Current days since purchase:

78

The system identifies:

Customer is significantly beyond their expected purchase interval.

This is more meaningful than simply saying:

“Customer hasn't purchased in 60 days.”

Possible model inputs:

- days since purchase

- purchase frequency

- historical intervals

- number of orders

- customer value

- product category

- discount dependence

- campaign engagement

- previous churn/recovery patterns

### A.25 Reorder Engine

For products with replenishment behaviour:

RetentionOS estimates:

Expected next purchase window

Example:

Historical:

Order 1 → Order 2 = 51 days

Order 2 → Order 3 = 56 days

Order 3 → Order 4 = 48 days

Estimated next purchase:

~52 days

Then:

Opportunity

Customer reaches day 45:

“Approaching reorder window.”

Customer reaches day 55:

“High-priority replenishment opportunity.”

### A.26 Payday / Temporal Behaviour

RetentionOS should not assume:

“Indian consumers buy after payday.”

Instead, it should discover temporal patterns from customer data.

Possible signals:

- beginning of month

- end of month

- weekends

- specific weekdays

- festival periods

- seasonal periods

- salary-cycle correlations

- category-specific purchase timing

The system can then identify:

“This brand's customers show a statistically meaningful purchase concentration around the first week of the month.”

This becomes a potential campaign timing signal.

### A.27 Discount Sensitivity

RetentionOS should identify whether customers require incentives.

Example:

Customer/segment history:

Without discount:

₹X conversion rate

10% discount:

₹Y conversion rate

20% discount:

₹Z conversion rate

If the incremental conversion from discount is small:

Recommend no discount.

If moderate incentive materially changes behaviour:

Recommend an appropriate offer.

The objective is:

Do not discount customers unnecessarily.

### A.28 Offer Engine

Possible offers:

- no discount

- percentage discount

- fixed discount

- free shipping

- bundle

- product incentive

- loyalty benefit

- early access

The recommendation should consider:

- customer value

- historical response

- margin

- product

- campaign objective

- previous discounts

- segment behaviour

### A.29 Product Affinity

RetentionOS should discover:

Customers who purchase A frequently purchase B.

Example:

Shampoo → Conditioner

Cleanser → Moisturizer

Protein → Supplements

This creates:

Next Best Product

Rather than simply:

“Recommend Product B.”

The system should eventually calculate:

“For this specific customer, Product B has the highest estimated purchase propensity.”

### A.30 Segment Engine

RetentionOS provides two modes.

Mode A — Automatic

The system creates segments automatically.

Examples:

- Replenishment ready

- High-value at risk

- High-LTV customers

- One-time customers

- Likely repeat purchasers

- Discount-sensitive

- VIP

- Dormant

- Cross-sell opportunity

Mode B — Manual

Advanced users can construct their own audiences.

Example:

Customers

AND:

Orders ≥ 2

AND:

LTV \> ₹3,000

AND:

Last purchase \> 45 days

AND:

Category = Haircare

AND:

Discount dependency \< 20%

AND:

WhatsApp consent = Yes

### A.31 Audience Builder

The audience builder should be powerful but visually simple.

Filters

Customer:

- age

- location

- first purchase

- last purchase

Behaviour:

- orders

- AOV

- purchase interval

- product

- category

Value:

- LTV

- revenue

- predicted value

Retention:

- churn risk

- reorder probability

- lifecycle

Marketing:

- WhatsApp consent

- campaign interaction

- previous offer

### A.32 The Opportunity Engine

This should become the centre of RetentionOS.

Every day the system scans customer data and generates:

Retention Opportunities

Example:

Opportunity 01

Replenishment

1,842 customers

Expected value:

₹X

Reason:

Customers are entering their normal reorder window.

Recommended channel: WhatsApp

Recommended offer: None

\[Create Campaign\]

Opportunity 02

High-value winback

342 customers

Reason:

High-value customers have exceeded expected purchase interval.

Recommended offer: ₹150

\[Create Campaign\]

Opportunity 03

Cross-sell

2,341 customers

Product A buyers with strong Product B affinity.

\[Create Campaign\]

### A.33 The Next Best Action

Every opportunity should eventually answer:

WHO?

Which customers?

WHY?

Why now?

WHAT?

What action?

WHEN?

When?

WHERE?

Which channel?

HOW?

What message/offer?

VALUE?

What is the commercial opportunity?

### A.34 AI Campaign Creator

The campaign generator should use:

Brand Knowledge

- 

Audience

- 

Customer behaviour

- 

Objective

- 

Offer

- 

Channel

to generate the campaign.

The AI should not blindly create generic copy.

It should know:

What the brand sounds like.

### A.35 Campaign Flow

Step 1

Select opportunity/audience.

Step 2

Define objective.

Examples:

- replenishment

- winback

- cross-sell

- upsell

- VIP

- launch

- abandoned cart

- reactivation

Step 3

Offer recommendation.

Step 4

AI creates campaign.

Step 5

Founder reviews.

Step 6

Preview.

Step 7

Launch.

### A.36 One-Click Retention

The ideal flow:

RetentionOS detects opportunity

↓

Creates audience

↓

Chooses recommended action

↓

Creates copy

↓

Selects approved template

↓

Founder reviews

↓

LAUNCH

The founder should be able to execute a sophisticated retention action in minutes.

### A.37 Control Mode

Automation cannot mean removing control.

Advanced users should be able to override:

- audience

- timing

- offer

- message

- product

- campaign frequency

- exclusions

- channel

- budget

- templates

Therefore:

Automation by default. Control when required.

### A.38 WhatsApp

WhatsApp is the initial primary execution channel.

The architecture should use the official WhatsApp Business Platform/Meta infrastructure rather than positioning RetentionOS as an alternative WhatsApp network.

RetentionOS provides:

- WhatsApp onboarding

- templates

- campaign creation

- audience selection

- scheduling

- sending

- delivery status

- campaign analytics

- opt-out handling

- campaign history

### A.39 WhatsApp Business Model

The company should distinguish:

Meta messaging cost

Paid according to Meta's applicable pricing.

RetentionOS software fee

Subscription.

RetentionOS message markup

Target:

₹0 platform markup

The positioning should therefore be:

You pay the underlying WhatsApp messaging cost. RetentionOS does not add a per-message markup.

We should NOT claim:

“Zero WhatsApp message cost.”

### A.40 Why WhatsApp Matters

For the target market, WhatsApp can become the execution layer connecting:

Customer intelligence

to

Customer action

Instead of:

Analytics → export CSV → upload to another platform → build campaign → send

RetentionOS aims for:

Insight → Audience → Campaign → WhatsApp → Measurement

### A.41 Campaign Analytics

Every campaign should return:

- sent

- delivered

- failed

- clicked

- replied

- purchased

- revenue

- attributed revenue

- offer cost

- messaging cost

- campaign cost

- ROI

- repeat purchase impact

Eventually:

Incremental revenue

We should distinguish:

Revenue attributed to campaign

from:

Revenue likely caused by campaign

This is important for serious analytics.

### A.42 Experimentation

RetentionOS should eventually support:

A/B testing

Example:

A:

No discount

B:

10% discount

Measure:

- conversion

- revenue

- profit

- repeat behaviour

This lets RetentionOS learn:

Which action works for which customer segment?

### A.43 Customer Journey Painting

A major visual feature.

Example:

Meta acquisition

↓

Website visit

↓

Product view

↓

Purchase \#1

↓

Product usage period

↓

Expected reorder

↓

WhatsApp

↓

Purchase \#2

↓

Cross-sell

↓

Purchase \#3

↓

VIP

↓

Risk

The system should show both:

Historical journey

and

Predicted journey

### A.44 Dashboard

HOME

Primary question:

What should I do today?

Sections:

- Retention health

- Opportunities

- Revenue at risk

- Upcoming opportunities

- Campaign performance

CUSTOMERS

Customer 360.

AUDIENCES

Automatic + custom segments.

INTELLIGENCE

- retention

- cohorts

- LTV

- churn

- purchase behaviour

- product relationships

OPPORTUNITIES

Recommended actions.

CAMPAIGNS

Create, launch and measure.

WHATSAPP

Messaging infrastructure.

ANALYTICS

Business performance.

BRAND

Brand knowledge/settings.

### A.45 Product Design Philosophy

RetentionOS should feel like a modern consumer application even though it is B2B.

Principles:

- minimal

- fast

- visual

- clear

- low cognitive load

- mobile-friendly

- founder-friendly

- no unnecessary enterprise complexity

The product should feel closer to:

“My business command centre.”

than:

“Enterprise marketing software.”

### A.46 Data Science Philosophy

Do not make everything an LLM.

Use the right technology for each problem.

Deterministic

- RFM

- customer aggregation

- revenue calculations

- cohort calculations

- consent

- eligibility

- campaign rules

Statistical / ML

- churn

- purchase probability

- expected next order

- predicted LTV

- product affinity

- offer response

- customer clustering

LLM

- campaign copy

- brand understanding

- explanations

- natural-language querying

- campaign variations

- insight summaries

The core principle:

Algorithms determine what is happening; AI helps interpret, communicate and execute it.

### A.47 Important Competitive Limitation

RetentionOS cannot claim that predictive retention intelligence is unique.

Klaviyo already documents predictive CLV, churn risk, expected time between orders and predictive segmentation.

RetentionX already provides similar customer intelligence and predictive capabilities.

Therefore our moat must come from:

India-specific data + workflow + UX + execution + accumulated behavioural intelligence.

### A.48 The RetentionOS Moat

Potential long-term moat:

1\. Behavioural data

More customers → more behavioural observations.

2\. Campaign outcome data

We learn:

Who received what → what happened.

3\. Offer-response data

We learn:

Which incentives work for which customers.

4\. Product relationships

We learn:

What customers buy after what.

5\. India-specific models

Models tuned to:

- categories

- Indian seasonality

- purchasing patterns

- WhatsApp

- local commerce behaviour

6\. Brand context

Each brand's system becomes increasingly knowledgeable about that business.

### A.49 What Is Not A Moat

These are not sufficient alone:

- ChatGPT integration

- AI copywriting

- dashboards

- RFM

- Shopify integration

- generic segmentation

- generic churn prediction

- WhatsApp API integration

Competitors can reproduce these.

### A.50 MVP

The MVP should NOT attempt to build the complete vision.

MVP = Retention Intelligence + Action

Data

- Shopify

- CSV

Analytics

- customer

- order

- product

- LTV

- AOV

- frequency

- recency

- cohorts

Intelligence

- RFM

- lifecycle

- basic churn risk

- reorder prediction

- product affinity

- discount sensitivity where data permits

Segments

- automatic

- custom

Opportunities

- replenishment

- winback

- VIP

- cross-sell

- one-time customer

Campaign

- AI campaign creator

- WhatsApp execution

Analytics

- campaign performance

### A.51 V1

Add:

- better predictive models

- customer 360

- campaign learning

- offer recommendations

- temporal patterns

- payday/seasonality detection

- advanced audience builder

- A/B testing

- journey visualization


### A.52 V2 (not to worry as of now)

Add:

- email

- more commerce platforms

- deeper website behavioural data

- advanced attribution

- autonomous campaign scheduling

- multi-channel orchestration

- advanced experimentation

- automated retention programs

### A.53 Long-Term Vision

RetentionOS eventually becomes:

THE CUSTOMER REVENUE OPERATING SYSTEM

It knows:

Who your customers are

↓

How they behave

↓

What they are likely to do next

↓

What they are worth

↓

What you should do

↓

What message they should receive

↓

When they should receive it

↓

What happened

↓

What should change next time

### A.61 The Hero Experience

The most important product screen is not the analytics dashboard.

It is:

WHAT SHOULD I DO TODAY?

Example:

₹4.8L RETENTION OPPORTUNITY

1,842 customers

These customers are entering their normal reorder window.

Recommended action

WhatsApp replenishment campaign

Discount

No discount

Expected reason

Historical customers in this segment commonly repurchase without incentives.

CREATE CAMPAIGN

Then:

₹2.1L AT-RISK CUSTOMER VALUE

342 high-value customers have exceeded expected purchase intervals.

CREATE WINBACK

This is the RetentionOS experience.

### A.62 The Automation Levels

RetentionOS should have three levels.

Level 1 — Insight

“Here is what is happening.”

Level 2 — Recommendation

“Here is what we recommend.”

Level 3 — Execution

“Here is the campaign. Launch it.”

Future:

Level 4 — Autonomous

“You approved this strategy. RetentionOS continuously executes within your rules.”

Autonomous execution should only be introduced after sufficient trust and controls exist.

### A.63 Human Control

Automation must remain controlled.

Brand owners should define:

- maximum discount

- campaign frequency

- excluded customers

- minimum margin

- preferred channels

- prohibited products

- approval requirements

- messaging rules

The system optimizes inside these boundaries.

### A.64 Security And Privacy

Because RetentionOS handles customer information:

Required foundations:

- authentication

- authorization

- encryption

- tenant isolation

- audit logs

- consent tracking

- opt-out handling

- data deletion workflows

- least-privilege access

- secure API credentials

Privacy should be part of architecture, not a later feature.

### A.65 Technical Architecture

Initial conceptual architecture:

Shopify

↓

Ingestion Layer

↓

Raw Data

↓

Normalized Commerce Data

↓

Customer Identity Layer

↓

Analytics Engine

↓

Behavioural Intelligence

↓

Opportunity Engine

↓

Audience Engine

↓

Campaign Engine

↓

WhatsApp

↓

Campaign Events

↓

Analytics / Learning

### A.66 Data Model

Core entities:

Brand

Customer

Order

Order Item

Product

Product Category

Customer Event

Segment

Customer Prediction

Opportunity

Campaign

Campaign Recipient

Campaign Event

Offer

Consent

Brand Knowledge

This creates the foundation for the entire system.

### A.67 The Central Data Relationship

The most important relationship is:

Customer

→ purchased

Product

→ at

Time

→ after

Previous Product

→ with

Discount

→ after receiving

Campaign

→ resulting in

Behaviour

This becomes the behavioural dataset.

### A.68 Measurement

Every RetentionOS feature must eventually connect to commercial outcomes.

Do not only measure:

Open rate

Click rate

Engagement

Measure:

- incremental purchases

- repeat revenue

- contribution margin

- retention

- customer value

- campaign profitability

The ultimate KPI is:

INCREMENTAL PROFITABLE CUSTOMER VALUE

### A.69 Product North Star

Potential North Star Metric:

Incremental Retention Revenue Generated

or:

Incremental Gross Profit Influenced by RetentionOS

This should eventually be more important than:

- number of campaigns

- messages sent

- dashboard visits

- AI generations

### A.74 The Founder Experience

The founder should be able to open RetentionOS and see:

TODAY

3 high-priority opportunities

₹X potential customer value

X customers ready to act

X campaigns recommended

Then:

Review → Launch → Measure

This should be the emotional experience of the product.

### A.82 Data Confidence

Every prediction should eventually have a confidence indicator.

Example:

Next Purchase Prediction

12–18 days

Confidence:

High

Reason:

Customer has 7 previous purchases with consistent intervals.

Versus:

Next Purchase Prediction

20–60 days

Confidence:

Low

Reason:

Customer has only one previous order.

This builds trust.

TODAY'S RETENTION OPPORTUNITIES

₹4.8L potential revenue identified

1,842 customers ready for replenishment

Reason:

68% of these customers historically reorder between day 48–67.

Recommended action

WhatsApp campaign

Offer: No discount
Message: Product replenishment reminder
Audience: 1,842 customers

Expected objective: Drive repeat purchase

\[Review Campaign\]

\[Launch\]

Then:

734 customers at elevated churn risk

Reason:

Purchase interval exceeded historical average by 31%.

Recommended:

Personalized win-back

Offer recommendation:

₹150 off

Because:

This segment historically responds better to moderate incentives than non-discount offers.

\[Review\]

\[Launch\]

THAT is RetentionOS.

Not another dashboard.

### A.6 Your “brand knowledge” idea is very important

I actually like this part a lot.

During onboarding, don't simply ask:

Connect Shopify.

Ask the founder questions.

Brand questionnaire

Brand

- What do you sell?

- Who buys from you?

- What makes your product different?

- Brand tone?

- Premium / mass / affordable?

- Geography?

- Key competitors?

Products

- Product categories

- Average product life

- Typical consumption period

- Replenishment cycle

- Hero products

- Cross-sell relationships

Business

- Gross margin

- Average order value

- acceptable discount

- maximum discount

- free shipping threshold

- COD availability

Retention

- What does a repeat customer look like?

- Typical reorder period

- VIP definition

- preferred offers

- products that shouldn't be discounted

Communication

- WhatsApp tone

- English / Tamil / Hinglish etc.

- Formal / casual

- emojis

- founder voice / brand voice

Then combine:

Brand knowledge + transaction data + customer behaviour

to create the intelligence layer.

### A.7 But don't make the AI itself the algorithm

This is important.

I wouldn't build:

“LLM looks at customers and decides everything.”

That's unreliable and expensive.

Instead:

Deterministic / statistical engine

calculates:

- RFM

- purchase intervals

- LTV

- AOV

- churn probability

- reorder probability

- product affinity

- discount sensitivity

- cohort behaviour

- customer lifecycle

- expected next purchase

- customer value

- campaign eligibility

Then:

AI layer

does:

- explain the insight

- generate campaign

- write copy

- personalize message

- summarize brand behaviour

- recommend strategy

- allow natural-language querying

So:

Algorithms decide WHAT is happening. AI helps decide/explain HOW to act.

That's much more defensible.

### A.8 Your behavioural engine could become your moat

This is where I'd invest heavily.

Instead of basic:

Customer = VIP

you want:

Customer behavioural profile

Customer \#48291

Lifecycle: Repeat → At Risk

Predicted next purchase: 17 days

Historical purchase interval: 54 days

Current days since purchase: 63

Churn risk: High

LTV: ₹8,420

Preferred category: Haircare

Discount sensitivity: Low

Offer response: historically purchased without discount

Preferred purchase day: Sunday

Purchase timing: predominantly 7–10 PM

Acquisition source: Meta

Typical basket: Shampoo + serum

Next-best product: Conditioner

Recommended action:

Replenishment reminder + conditioner cross-sell

That's Customer Intelligence, not simply analytics.


### A.9 "Payday behaviour" is an excellent Indian-specific signal

This is exactly the type of thing I'd explore.

For example:

The system discovers:

38% of customers purchase between the 1st–7th of the month.

Or:

Customers acquired through this segment disproportionately purchase around salary dates.

Then RetentionOS can say:

Upcoming opportunity: Payday window

and automatically build a campaign.

But don't hard-code:

Indians buy after payday.

Let the system discover the pattern from data.

That's important.

You could eventually model:

Temporal behavioural signals

- payday

- weekends

- month beginning/end

- festivals

- seasons

- school cycles

- regional holidays

- product replenishment

- weather

- campaign periods

This could become one of your interesting India-first advantages.

### A.10 Your segmentation should have TWO modes

This is critical.

Mode A — “Do it for me”

Founder sees:

RetentionOS Recommendations

“These 1,284 customers are ready for replenishment.”

\[Create Campaign\]

“Win back these customers”

892 high-value customers have exceeded their expected purchase interval.

\[Create Campaign\]

“Cross-sell opportunity”

Customers who purchased Product A have a significantly higher probability of purchasing Product B.

\[Create Campaign\]

Mode B — “Let me build it”

Advanced founder/marketer opens:

Audience Builder

Customer purchased:

\[Product Category\] \[Haircare\]

AND

Orders:

\[\>=\] 2

AND

Last purchase:

\[45\] days ago

AND

LTV:

\[\>\] ₹3,000

AND

Discount dependency:

\[\<\] 20%

AND

WhatsApp consent:

\[Yes\]

1,482 customers

Save Segment

Create Campaign

This gives you:

Simplicity for founders

AND

Power for marketers.

That's the correct combination.

### A.11 Your campaign builder should be the centre of the product

I'd make the flow:

Step 1

Who?

Audience.

Step 2

Why?

RetentionOS explains:

“These customers are entering their expected reorder window.”

Step 3

What?

Objective:

- Replenish

- Win back

- Cross-sell

- Upsell

- VIP

- Birthday

- Festival

- Abandoned cart

- Browse recovery

- Product launch

- Reactivation

Step 4

Offer?

RetentionOS recommends:

No offer

or

10% discount

or

₹200 voucher

or

Free shipping

based on historical behaviour/margins.

Step 5

Message

AI generates:

Brand-specific WhatsApp message.

Step 6

Preview

Founder sees:

Audience

1,284

Estimated Meta messaging cost

₹X

Offer cost

₹X

Potential revenue

₹X

Expected ROI

X

Step 7

LAUNCH

That is the experience you should obsess over.

### A.x Open items listed by the founder

Set of things that still requires work from my side. But I want you to go through these and tell me if there is anything that requires immediate action and finalisation from my side

\* Techninally any particular data set/algorithms or statistical models or ML models or deep learning model that we need inorder to make this. or not compulsory but might make this even better ( Need you opinion on this )

\* Set of skills to be installed to make claude code run even better

\* Making a branding and design system that has to be followed

\* Giving you not just UI refernces but also teaching UX

\* ⁠Have to decide regarding security audit

\* Have to discuss on how to proceed with the backend and frontend building. Same chat or separate chats or thru agents via tmux.( Need you opinion on this )

\* Other requirements like redis queue .( Need you opinion on this )

\* Pricing and payment integration

\* ⁠Finalising which database and cloud storage and any other applciations that we need to use
