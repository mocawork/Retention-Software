# Data & Intelligence PRD — RetentionOS by Moca

> **What this file is:** The build spec for (A) every data source and how it becomes one clean model, and (B) every statistic and algorithm the engine runs: purpose, inputs, method, outputs, defaults and minimum data. Model IDs (E-, DEC-, MEA-, X-) are referenced from `technical.md`, `docs/play-map.md` and `docs/risk-review.md`.
> **Who reads it:** Agents building ingestion (Part A) or intelligence (Part B). Founders read the "In plain words" boxes.
> **Status:** v1.1 · 5 Nov 2026 · Proposed as the build spec (D-024, D-025). Where this file and `technical.md` differ, this file wins for data and model details.

> **Pending amendments (not yet applied; each needs founder approval before the milestone that uses it):**
> - **F-1…F-11** spec fixes from `docs/risk-review.md` (e.g. F-1: use the *modified* BG/NBD in E-14).
> - **U-9** category profiles: skip a hand-built library; founder answer → cautious generic spread → borrow from the brand's similar products → cross-brand profiles once 5+ brands share a category (needs O-14).
> - **U-12** cross-sell: label each A→B pattern as complement / switch / upgrade; time cross-sell at the measured A→B gap (E-20, DEC-06).
> - **G17** category-aware replenishment wording · **G18** similar-item recommendations for one-off designs (E-21) · **G19** gift/occasion rebuys misread as "running out" (E-09).
> - Applied in v1.1: E-08's single "conflict flag" replaced by the two-tier notices of D-036; worked examples corrected (§B10).

---

# Part A — Data

> **In plain words:** Whatever a brand uses (Shopify, a CSV export, WooCommerce), we turn its data into the same clean shape: customers, orders, order lines, products. The engine only ever reads that clean shape, so adding a new platform never changes the maths.

## A1. Canonical data model (D-024)
All sources map into: **Customer**, **CustomerIdentifier**, **Order**, **OrderLine**, **Refund**, **Product**, **Variant**, **Category**, **Fulfillment** (status, shipped_at, delivered_at), **ConsentRecord**, **DiscountApplication** (code / automatic / manual / sale-price). Field definitions: `technical.md` §5.2. Every record keeps `source` (shopify / csv / woocommerce) and `external_id`. Money in paise, time in UTC.

## A2. Shopify
### A2.1 Access and scopes
`read_customers`, `read_orders`, `read_all_orders` (approval), `read_products`, `write_discounts`, billing; **Protected customer data Level 2**. Optional only if their plays enter V1 (G16): `read_inventory` (stock, cost per item: G3), `write_orders` (tag/cancel COD after confirmation).

### A2.2 What we read (GraphQL Admin API)
| Object | Fields we use | Used for |
|---|---|---|
| Shop | ianaTimezone, currencyCode, name, plan | Brand settings |
| Customers | id, firstName, lastName, defaultEmailAddress, defaultPhoneNumber, addresses (city, province, zip), createdAt, updatedAt, numberOfOrders, amountSpent, tags, emailMarketingConsent, smsMarketingConsent | Identity, contact, consent (O-04) |
| Orders | id, name, createdAt, processedAt, cancelledAt, cancelReason, test, customer, email, phone, displayFinancialStatus, displayFulfillmentStatus, paymentGatewayNames, totalPriceSet, subtotalPriceSet, totalDiscountsSet, totalShippingPriceSet, totalTaxSet, totalRefundedSet, discountCodes, discountApplications, sourceName, landingSite, referringSite, customerJourneySummary (UTM), tags, shippingAddress (city, province, zip, phone) | Purchase occasions (E-01), attribution, COD/RTO |
| Order line items | product, variant, sku, quantity, originalUnitPriceSet, discountedUnitPriceSet, discountAllocations | Product rhythm, affinity, discounts |
| Refunds | createdAt, refundLineItems (quantity, subtotal), totalRefundedSet | Net value, bad-experience signals |
| Fulfillments | status, createdAt, deliveredAt, trackingInfo (company) | Delivery date (G2) |
| Returns | status, returnLineItems | RTO / returns |
| Products | id, title, productType, vendor, tags, status, featuredImage, onlineStoreUrl, collections, createdAt | Product card, categories |
| Variants | id, title, selectedOptions, sku, price, compareAtPrice, inventoryItem.unitCost (G3) | Pack size (E-03), sale-price discounts (G4) |
| Collections | id, title, products | Category mapping, pre-fill Q1.1 |
| Checkouts (abandoned) | collected but unused until O-07 | — |

### A2.3 Backfill
Bulk operations in order **collections/products → customers → orders** (D-034); JSONL → S3 → stream parse → raw index → normalise. Progress per object type in `sync_job` drives the live import screen (D-032).

### A2.4 Live updates
Webhooks listed in `technical.md` §6.1; HMAC verify, dedupe, inbox, ack < 1 s.

### A2.5 Reconciliation
Nightly (6-hourly for large brands) `updated_at` sweep.

### A2.6 Compliance webhooks and uninstall
`customers/data_request`, `customers/redact`, `shop/redact`; erase on `shop/redact` (D-027).

### A2.7 India specifics
COD detection from `paymentGatewayNames` ("Cash on Delivery (COD)", gateway apps); RTO from cancellations after fulfilment, returns, and brand tag rules (G2). Delivered date often missing → fallback: fulfilment date + typical delivery time (Q3.11).

### A2.8 The teammate's Shopify app (O-15)
The teammate built a Node.js Shopify app (see `reference/Retention-OS-Shopify-App-Guide.pdf`) with OAuth, webhooks, field encryption and blind indexes. Options: **(a)** keep it as a thin "Shopify edge" service that hands normalised data to Django; **(b)** port its logic into `integrations_shopify`. Claude leans (b) for one codebase and one tenancy model, reusing its encryption design (D-026). Decide before M1.

## A3. CSV import (Jev-assisted mapping, D-022)
1. **Upload** (pre-signed S3, up to ~2 GB): customers, orders, order lines, products; or one flat "orders export".
2. **Detect format:** known exports (Shopify order export, WooCommerce export, common Indian OMS formats) are matched by header signature → mapping pre-filled.
3. **Suggest mapping:** rules (header synonyms, value patterns: phone-like, date-like, money-like) → for unresolved columns, **one Jev call per file** with headers + **masked value profiles** (e.g. "10-digit numbers starting 6–9", "dates dd/mm/yyyy") — never raw personal data. Status values ("RTO", "Delivered", "Cancelled by customer") are also mapped to canonical statuses.
4. **Human confirms** every mapping (required). Saved as a reusable mapping template per brand.
5. **Validate:** row-level errors downloadable; minimum fields: order id, order date, customer phone or email, order amount.
6. **Normalise** through the same pipeline as Shopify (source = `csv`).
- Jev is enabled in production only if it beats rules-only on our evaluation set of real-world CSV headers, and after Jev's data terms are confirmed (O-16). Fallback to rules-only on any Jev error.

## A4. WooCommerce (D-023, O-17, proposed M1b)
- Connect with REST API keys (read) generated by the merchant, or a small WordPress plugin later.
- Backfill: paginated REST (`/orders`, `/customers`, `/products`) with modified-after cursors; webhooks for `order.created/updated/deleted`, `customer.*`, `product.*`; **hourly reconciliation** (WooCommerce webhooks are less reliable).
- COD from `payment_method = cod`; statuses mapped (processing, completed, cancelled, refunded, failed, custom RTO statuses via mapping).
- Consent: WooCommerce checkout checkbox for WhatsApp opt-in (part of G1).
- Erase-on-disconnect rule open (O-10).

## A5. Connector interface (D-024)
Every connector implements: `connect()`, `backfill(since)`, `handle_event(payload)`, `reconcile(since)`, `write_discount(spec)`, `privacy_delete(scope)`, `health()`. The ingestion pipeline and engine never import a connector directly.

## A6. Data quality
Report items: `technical.md` §6.6. Shown at onboarding (after Connect WhatsApp if the import is still running, D-034) and in Settings.

---

# Part B — Intelligence

> **In plain words:** Each engine step below is one small, testable calculation. Each has an ID so everyone (founders, agents, the play map) can point at it. Each says what it needs, what it produces, and what happens when there isn't enough data.

**Format of each spec:** Purpose · Inputs · Method · Outputs · Defaults / minimum data · Confidence.

## B1. Foundations

### E-01 · Purchase occasions
- **Purpose:** One clean list of "real purchases" every model reads.
- **Inputs:** Orders, lines, refunds, fulfilments, COD/RTO rules.
- **Method:** Apply `counts_as_purchase` (`technical.md` §6.4); merge split orders by the same customer within 30 minutes; derive delivered date (fulfilment deliveredAt → fallback fulfilment date + Q3.11); flag refund/RTO events for DEC-02.
- **Outputs:** `purchase_occasion` (customer, date, net value, lines, discounted?, delivered_at).

### E-02 · Customer facts
Counts, first/last dates, days since last, net spend, AOV, interval list and stats (mean, median, CV), categories bought, COD share, RTO count. Written to `customer_features`.

### E-03 · Product facts
Parse pack size from variant title/options (ml, g, kg, pcs, "pack of N"); group product families; price band per category (tertiles). Founder fixes in Product Studio later (G7).

### E-04 · Metric catalogue
Repeat rate, second-purchase rate, time to second purchase, returning-revenue share, AOV, purchase frequency, active customers (90/180 days), revenue at risk. One definition each, in `analytics/metrics.py`.

### E-05 · Cohorts
Monthly acquisition cohorts × months since first order: retention %, revenue per customer; also cohorts by first product (gateway products).

### E-06 · RFM
Recency, frequency, monetary scored 1–5 by brand-relative quantiles; milestones (nth order, first-order anniversary).

## B2. Rhythm

### E-07 · Reorder curves (Kaplan–Meier)
- **Purpose:** How long until people buy again, per brand, category and product.
- **Inputs:** Intervals between consecutive purchase occasions (same category / same product), plus **censored** intervals (time since last purchase for people who haven't rebought).
- **Method:** Kaplan–Meier survival estimate; quantiles p25/p50/p75/p80/p95 of time-to-reorder among those who reorder; separate curve for **first repeat** (second purchase) because it behaves differently.
- **Outputs:** Curve + quantiles per level, with sample size (number of observed reorders).
- **Minimum data:** 30 observed reorders for a category curve, 10 for product; below that, use the level above.

### E-08 · Blending answers with data (priors and shrinkage)
- **Purpose:** Start from the founder's answer; move to the data as it grows.
- **Inputs:** Questionnaire answers (Q2.C2 days one unit lasts, Q2.F1 how often they buy again, Q2.D1 replacement cycle), E-07 quantiles, sample size n.
- **Method:** In **log-space**: `log(q_blend) = w·log(q_data) + (1−w)·log(q_prior)`, `w = n / (n + k)` with k = 30 brand, 20 category, 10 product, 2 customer. Hierarchy: customer ← product ← category ← brand ← questionnaire ← Moca default.
- **Notices (D-036, replaces the old single "conflict flag"):** ratio r = q_data / q_prior. ✅ |r − 1| ≤ 15% "Your data agrees". 🟡 15–50% "Slight adjustment": blend used, founder told. 🔴 r > 1.5 or r < 0.67 "Big difference": switch to the data value automatically **only if confidence ≥ Medium (≥ 50 reorders)**; Parameter Studio offers "Revert to my answer" with an impact preview. If reverted and the data keeps disagreeing, re-notify at most every 30 days, showing how both values performed (W-20). Thresholds are registry defaults (§B9).
- **Pre-fill (D-035):** where the data can answer, the questionnaire field is pre-filled after import; otherwise "Fill this from my data".

### E-09 · Consumption class
- **Purpose:** Is this product used up and rebought?
- **Method:** Same-product repeat rate among buyers with ≥ (p75 of category interval) of follow-up time: **≥ 15% consumable**, **< 5% durable**, between = **mixed**. The founder's answer (Q2.C1) decides until ~200 buyers of that product.
- **Known gap G19:** gift/occasion rebuys can push a durable product into "mixed". Pending fix (founder decision).

### E-10 · Personal reorder window and threshold ladder
- **Method:** Customer's own intervals blended with their product/category curve (E-08, k = 2). Anchored on **delivered date** for consumables (fallback order date). Ladder from the blended distribution: **p25 window opens · p50 due · p75 late · p80 at risk · p95 lapsed**.
- **Outputs:** Dates for each rung; reason codes ("bought 200 ml oil; people like them rebuy around day 32").

### E-17 · Per-customer rhythm
For customers with ≥ 3 intervals, their own median and spread (CV); shrunk toward the product curve (k = 2). High CV → wider window, lower confidence.

## B3. Lifecycle, risk and value

### E-11 · Lifecycle stage
New (1 purchase, inside first-repeat window) · Developing (2) · Established (3+) · Lapsed (past p95) · Reactivated. (D-011: shown as Stage + Health.)

### E-12 · Health
On track (before p50) · Due (p50–p75) · At risk (past p75/p80) · Lapsed (past p95).

### E-13 · Churn risk
Probability of no reorder given time since last purchase, from the survival curve (hazard past the due date). Banded Low / Medium / High.

### E-14 · Probability active and expected purchases (BG/NBD family)
Fit per brand on (frequency, recency, T). **Use the modified BG/NBD (MBG/NBD)** (F-1) so one-time buyers can also be judged inactive. PyMC-Marketing (spike in M0) or our SciPy fallback. Outputs: p_alive, expected purchases in 30/90 days. Minimum: ~500 customers with repeat history; else Low confidence and E-13 only.

### E-15 · Value (Gamma-Gamma)
Expected order value from repeat customers' AOV; 12-month value = E-14 expected purchases × E-15 value (× margin when known). Assumes value and frequency are independent (checked; flagged if correlation > 0.3).

### E-16 · Challenger model (LightGBM)
Predict purchases in the next 90 days from `customer_features`; time-based backtest; replaces E-14 outputs only if it wins on the brand's backtest by a set margin (MEA-05).

### E-18 · Value tiers
VIP = brand rule (Q3.8, default top 5% by 12-month spend); then High / Mid / Low by spend percentile; "rising stars" from value growth (needs G5 snapshots).

### E-19 · Discount sensitivity
Share of a customer's purchases that were discounted, average depth, and **full-price buyer** flag. Counts **codes, automatic discounts and compare-at sale prices** (gap G4 fix proposed). Dependency band Low / Medium / High. Brand-level "discount dependency" trend for P37.

## B4. Products and timing

### E-20 · Affinity (A → B)
Pairs where buying A is followed by B within a window: support, confidence, lift; **Benjamini–Hochberg** control of false discoveries (q = 0.10); minimum 30 customers with A and B. Records the typical A→B gap. Pending (U-12): label each pattern complement / switch / upgrade.

### E-21 · Next best product
Ranked by: affinity from what they bought → their category rhythm (replenish) → category bestsellers in their price band. Excludes items just bought (unless consumable and due). Pending (G18): attribute similarity for one-off designs.

### E-22 · Temporal patterns
Day-of-month effect (payday, 1st–7th), weekday effect, festival lift vs the Moca festival calendar (U-8), per region where data allows. Festival effects need ≥ 2 occurrences to be "seen"; otherwise "we'll keep watching" (W-19).

### E-23 · Send time
Start: customer's typical order hour (≥ 3 orders) → brand's peak order hour. Learn: read-time distribution from WhatsApp read events (MEA-04). Always inside quiet hours (Q5.2).

### E-24 · Language
Customer's choice at opt-in > founder's state→language rule (Q1.3) > brand default (Q4.2). English, Hindi, Tamil (D-007).

---

## B5. Decisioning

### DEC-01 · Opportunity eligibility
Per opportunity type, a rule on predictions + consent + caps. Examples: **Second purchase** (1 purchase, inside first-repeat window p25–p50) · **Replenishment** (consumable, 2 days before window opens → due) · **Cross-sell** (A bought, B not, at measured A→B gap) · **At-risk save** (past "late") · **Win-back** (lapsed, high value) · **VIP** · **Festival**.

### DEC-02 · Suppression and pauses
Opted out · invalid / not-on-WhatsApp number · recent refund, return, RTO or failed delivery (pause N days, default 14) · frequency caps (Q5.1) · quiet hours (Q5.2) · cool-down per opportunity type. Re-checked immediately before every send.

### DEC-03 · Conflict resolution (one owner per question)
- **When** is owned by rhythm (E-10); **what** by next-best product (E-21); **offer** by DEC-04; **whether** by eligibility + caps.
- **One marketing message per customer per day**; when several opportunities qualify, keep the highest expected incremental value; ties → the one not sent most recently.
- Full signal-conflict table: `docs/risk-review.md` §2.

### DEC-04 · Offer selection (expected incremental profit, EIP)
`EIP(o) = P(buy | o) · (margin − cost(o)) − P(buy | none) · margin`
- P(buy | none) from E-13/E-14; uplift per offer rung from MEA-03 history (pooled across brands only with O-14), else conservative priors by discount band (E-19).
- Ladder: none → free shipping → smallest flat/percent → … ≤ max discount (Q3.3). Never-discount products (Q3.6) excluded. Full-price buyers get no discount by default.
- Picks the highest EIP; "no offer" wins ties.

### DEC-05 · Scheduling
Next allowed slot in the customer's best hour (E-23), in brand timezone, outside quiet hours, respecting caps.

### DEC-06 · Cross-sell timing
At the measured typical A→B gap from E-20 (U-12), not a fixed delay.

### DEC-07 · Ranking on Home
Score = expected incremental revenue × confidence weight; deduped; dismissed items stay hidden for 14 days.

### DEC-08 · Holdouts
Random holdout (default 10%) on every automated campaign with ≥ 100 recipients (D-028); optional persistent 5% program holdout per opportunity type over rolling 90 days (D-029, O-18).

## B6. Measurement

### MEA-01 · Attribution
Orders within 7 days of a delivered message: code match > link click > delivery. "Attributed revenue".

### MEA-02 · Incrementality (caused revenue)
Treated vs holdout conversion and revenue per recipient, **pooled per opportunity type over rolling 90 days**; difference with a 90% interval. Single-campaign numbers shown as ranges. Sample-size note: a +20% lift with a 10% holdout needs ~22k–79k recipients in one campaign, hence pooling.

### MEA-03 · A/B tests
Two variants; pre-set minimum sample; sequential test (no peeking); winner stored for DEC-04 uplift history.

### MEA-04 · Engagement and send-time learning
Read, click, reply, purchase signals per customer; updates E-23; "engagement" combines signals because read receipts can be off (G11).

### MEA-05 · Model monitoring and backtests
Monthly backtest per brand (hide 90 days, predict, compare); calibration of p_alive; drift alerts; challenger promotion rule.

### MEA-06 · Data-quality monitoring
Daily: webhook lag, reconciliation diffs, share of orders with phone, consent coverage, RTO-suspected share; alerts in Briefing.

## B7. Cross-cutting

### X-01 · Explanation facts
Each prediction/opportunity exposes a facts JSON (numbers, labels, reason codes, confidence; no PII) used by `?` explanations (`technical.md` §12).

### X-02 · Confidence labels
High / Medium / Low from sample size and spread: e.g. rhythm High ≥ 100 reorders and CV < 0.6; Medium ≥ 50 (or ≥ 30 with low CV); else Low.

### X-03 · Parameter Studio and versioning
Every parameter in §B9 has a default, an allowed range, a source (default / questionnaire / data / founder override) and a version. Overrides are audited.

## B8. Run schedule
Nightly per brand (staggered): E-01 → E-06 → E-03 → E-07…E-10/E-17 → E-11…E-19 → E-20…E-24 → DEC-01…DEC-07 → Briefing. Incremental on new orders: E-01, E-02, E-10, E-12 for that customer.

## B9. Parameter registry (defaults)

| Parameter | Default | Range | Used by |
|---|---|---|---|
| Shrinkage k (brand / category / product / customer) | 30 / 20 / 10 / 2 | 1–100 | E-08 |
| Notice tiers (agree / adjust / big) | ≤15% / 15–50% / >1.5× or <0.67× | founder-tunable | E-08 |
| Auto-switch minimum | ≥ 50 reorders (Medium) | 30–200 | E-08 |
| Consumable / durable repeat thresholds | ≥ 15% / < 5% | 5–30% | E-09 |
| Founder answer holds until | 200 buyers | 50–500 | E-09 |
| Threshold ladder | p25 / p50 / p75 / p80 / p95 | — | E-10 |
| Split-order merge window | 30 min | 0–24 h | E-01 |
| COD pending age | 15 days | 7–30 | E-01 |
| Shared-identifier guard | 20 customers | 5–100 | identity |
| Affinity minimum pair / FDR q | 30 / 0.10 | — | E-20 |
| VIP rule | top 5% by spend | Q3.8 | E-18 |
| Pause after refund/RTO | 14 days | 0–60 | DEC-02 |
| Messages per customer per day | 1 | 1 | DEC-03 |
| Holdout % / minimum recipients | 10% / 100 | 5–20% | DEC-08 |
| Program holdout | off (5% when on) | — | DEC-08 |
| Attribution window | 7 days | 1–14 | MEA-01 |
| Pooling window | 90 days | 30–180 | MEA-02 |
| Briefing headline items | ~5 per day | open (W-21) | Briefing |

## B10. Worked examples (corrected in v1.1)

**Asha · replenishment (consumable hair oil, 200 ml).** Asha's oil was delivered 33 days ago. The brand's 200 ml oil curve (blended with the founder's "lasts about 45 days" answer, data-led at 180 reorders) gives: window opens day 31, due day 36, late day 44. **Day 33: her window opened on day 31, so she is due now** → Replenishment opportunity. Next-best product: the same oil (no affinity pattern beats it). Offer: none (she bought full price twice; EIP of "no offer" is highest). Timing: her best hour is 20:00; quiet hours 21:30–09:00 → **next allowed slot: today 20:00 IST**. Language: Tamil (her opt-in choice).

**Rahul · cross-sell (shampoo after oil).** Rahul's oil was delivered 21 days ago. Pattern oil → shampoo: lift 2.4, 340 customers, typical gap **21 days after delivery** (measured, DEC-06). **Due 21 days after delivery → today.** Not due for oil yet (window opens day 31), so cross-sell wins for today (one message per day). Offer: smallest rung (free shipping) because his discount dependency is Medium and EIP is positive.
