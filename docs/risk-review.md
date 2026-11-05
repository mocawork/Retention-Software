# Risk review and technical validation — RetentionOS by Moca

> **What this file is:** An honest critique of the plan, written 26 Sep 2026: whether each component is feasible, how conflicting signals are resolved, the main risks, the flaws in our own spec (F-1…F-11) and what to do before coding.
> **Status (5 Nov 2026):** No decisions changed by this file. **Fixes F-1…F-11 are still awaiting founder approval**; each must be approved (and applied to `docs/data-and-intelligence-prd.md`) before the milestone that uses it. Newer gaps from the play map (G1–G19) are in `docs/play-map.md`.

---

## 1. Verdict in plain words
The plan is buildable with a small team using Claude Code, on proven tools. The hard parts are not the maths; they are **(1) getting clean, complete data out of Indian D2C stores** (COD, RTO, missing delivery dates, WhatsApp consent), **(2) proving that messages caused revenue** when campaigns are small, and **(3) keeping 1,000 brands' data and sends isolated and fast**. The plan addresses each, with the fixes below.

## 2. How conflicting signals are resolved
Rule: **one owner per question**, so models don't fight.

| Question | Owner | Others may only… |
|---|---|---|
| *When* is a customer due? | Rhythm (E-07…E-10, E-17) | Shift within the window (E-22 payday/festival, E-23 hour) |
| *Is* the customer slipping? | Health + churn risk (E-12, E-13) | E-14 p_alive adds confidence, never overrides a recent purchase |
| *What* to suggest? | Next-best product (E-21) | Affinity (E-20) and consumption class (E-09) feed it |
| *Which offer*? | EIP (DEC-04) | Discount sensitivity (E-19) and caps limit it |
| *Whether* to send today? | Eligibility + suppression + caps (DEC-01, DEC-02) | — |
| Several opportunities on the same day | DEC-03: highest expected incremental value; one message per day; ties → least recently sent type | — |
| Founder answer vs data | E-08 shrinkage + D-036 notices | Founder override in Parameter Studio |

Weighting of signals is therefore **not** a single blended score; each signal answers its own question, and only DEC-03/DEC-07 compare opportunities, in one currency: expected incremental revenue.

## 3. Component feasibility
| Component | Feasible? | Note |
|---|---|---|
| Shopify bulk + webhooks + reconciliation | ✅ | Standard; `read_all_orders` and Level 2 approval take time: apply early |
| Normalisation, identity | ✅ | Deterministic; shared-identifier guard essential |
| Kaplan–Meier, shrinkage | ✅ | Small, fully testable |
| BG/NBD / Gamma-Gamma | ✅ with care | Use MBG/NBD (F-1); PyMC-Marketing spike in M0 |
| LightGBM challenger | ✅ | Only after backtests exist |
| Affinity with FDR | ✅ | Needs volume; small brands fall back to bestsellers |
| WhatsApp via Tech Provider | ✅, slow to start | Business verification lead time (O-05) |
| Incrementality | ⚠️ | Single campaigns too small; pooled per type (D-028) |
| Explanations via LLM | ✅ | Numeric validator + template fallback |
| 1,000 brands on one Postgres | ✅ | Brand-leading indexes, queues per role, measured triggers |

## 4. Risk register

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| A1 | Shopify approvals (read_all_orders, Level 2) delayed | Can't go live with real PII | Apply in M1; CSV fallback (W-4) |
| A2 | Delivery/RTO data missing (G2) | Wrong windows, messages to RTO customers | Fallback dates, RTO confirmation step, brand tag rules |
| A3 | WhatsApp consent unclear (G1, O-04) | Legal risk, low reach | Own opt-in capture; legal decision |
| B1 | Small brands lack data | Low confidence everywhere | Priors, Low labels, ranges, never auto-act on Low |
| B2 | Caused revenue unprovable per campaign | Founders doubt value | Pooled holdouts, honest ranges, savings vs usual discount (U-10) |
| C1 | Noisy neighbour (one big brand slows others) | Slow app | Per-brand concurrency caps, separate queues |
| C2 | Tenant data leak | Fatal | TenantModel, isolation suite on every endpoint, review |
| D1 | Meta quality rating drops | Sending blocked | Caps, quality monitor, auto-pause |
| E1 | Pilot-specific logic creeps in | Product fails for other brands | R-1 / D-010; founders flag pilot-inspired changes |
| E2 | AI creeps into decisions | Unexplainable outputs | R-2; reviewer checks |
| F1 | Dependency rot (archived libraries) | Security/maintenance | Version policy, Dependabot, no `lifetimes` |
| G1 | Non-technical founders can't review code | Bugs merge | Plain-English PR summaries, reviewer agent, CI gates |

## 5. Flaws in our own spec (F-1…F-11) — awaiting approval

| # | Flaw | Fix |
|---|---|---|
| F-1 | Plain BG/NBD assumes one-time buyers never churn | Use **modified BG/NBD (MBG/NBD)** in E-14 |
| F-2 | Averaging intervals ignores people who haven't rebought yet (biased short) | Kaplan–Meier with censoring (E-07), already adopted; make it mandatory in tests |
| F-3 | Blending answers and data on a linear scale lets one long answer dominate | Blend in **log-space** with k per level (E-08) |
| F-4 | Consumption class from tiny samples flips back and forth | Founder answer holds until ~200 buyers; hysteresis on class changes (E-09) |
| F-5 | Affinity on many pairs finds patterns by chance | **Benjamini–Hochberg** FDR + 30-customer minimum (E-20) |
| F-6 | "Skip holdout below 1,000 recipients" makes caused revenue unmeasurable | Holdout from 100 recipients, pooled per type over 90 days (D-028) |
| F-7 | Discount sensitivity confounded: we give discounts to people we think need them | Use pre-RetentionOS history + randomised offer tests (MEA-03) before trusting uplift |
| F-8 | Send hour from order hour ≠ reading hour | Start from order hour, learn from read events (E-23, MEA-04) |
| F-9 | Pending COD orders counted as purchases distort value and rhythm | Pending COD: in recency only, not value/frequency (E-01) |
| F-10 | Festival effects "detected" from one year of data | Require ≥ 2 occurrences; otherwise "we'll keep watching" (E-22) |
| F-11 | LLM explanation could state numbers not in the facts | Numeric validator + template fallback (X-01, `technical.md` §12) |

## 6. Vision gaps noted
- Abandoned-cart and browse flows are where many brands expect WhatsApp value (O-07).
- Cross-brand learning would help small brands most but needs legal terms (O-14).
- Reply reading (complaints, intent) is forbidden by R-2 today (G13).

## 7. Before coding (recommendations)
1. Apply for Shopify `read_all_orders` and Level 2 and start Meta business verification early.
2. Decide O-15 (Node edge vs port) before M1.
3. Approve F-1…F-11 (or amend) before M2/M3.
4. Build the synthetic data generator first (M0) so every model has known answers to test against.
5. Keep M0 inside its stop line (`docs/milestones/M0-scope.md`).
