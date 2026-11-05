# design.md — RetentionOS by Moca

> **What this file is:** The rules every frontend agent must follow, plus suggestions for the brand and design system the founders will define later.
> **Status:** The visual identity (logo, colours, typography, illustration) is **not defined yet** (founders' decision, D-016). Until it is, agents use neutral placeholder tokens (§7) and follow all rules in §1–§6, which are **binding now**.
> **Rule:** If a design question isn't answered here, pick the simpler option, note it in the PR summary, and ask the founders. Don't invent new patterns.

Document version: 1.1 · 5 Nov 2026 (adds the Briefing page, import progress screen and answer-vs-data notices from the founder–customer game)

---

## 1. How RetentionOS should feel

"**My business command centre**", not "enterprise marketing software". A modern consumer-grade app, even though it is B2B.

| Principle | What it means on screen |
|---|---|
| Action-first | Every main screen ends in a clear next action (Review campaign, Launch, Save audience). |
| Low cognitive load | One primary question per screen. At most one primary button per view. |
| Complex underneath, simple on top | Show the conclusion first ("1,284 customers are ready to reorder"), the evidence on demand (`?`, "See details"). |
| Automation by default, control when required | Defaults are pre-filled. Advanced controls live behind "Customise" / Parameter Studio, never in the founder's way. |
| Trust through transparency | Every number shows its **confidence** and has a **`?`** explanation. We never hide uncertainty. |
| Fast | Skeleton loaders instead of spinners; optimistic UI for safe actions; no screen waits on heavy computation. |
| Mobile-friendly | Founders check on phones. Home, Opportunities, Campaign review/launch and Customer 360 must work well at 360 px width. |
| India-first | ₹ with lakh/crore formatting, Indian dates, IST, WhatsApp-style previews, Hindi and Tamil scripts render correctly. |

## 2. Information architecture (navigation)

Primary navigation (from the founder summary):
**Home · Briefing · Opportunities · Customers · Audiences · Intelligence · Campaigns · WhatsApp · Analytics · Brand · Settings**

- **Home** = "What should I do today?" (the hero screen).
- **Briefing** = "What happened and what changed" (daily feed, D-037). An unread count shows on its nav item.
- **Intelligence** = customer understanding (retention, cohorts, LTV, churn, behaviour, products, timing).
- **Analytics** = business and campaign performance (incremental revenue, ROI, campaign history).
- **Brand** = Brand Knowledge Profile, guardrails, and Parameter Studio (for marketers).
- A brand switcher sits top-left (for users with several brands). Global search (customers by name/phone/email) sits top-centre.
- On mobile: a bottom tab bar with Home, Briefing, Opportunities, Campaigns, More.

> Suggestion (not a decision): consider merging Intelligence + Analytics into one "Insights" area with tabs if user testing shows confusion. This needs founder approval before any change.

## 3. Binding UX rules for agents

### 3.1 Numbers and data
1. **Every computed number has a `?` icon** that opens the explanation popover (`ExplainPopover`). No exceptions for KPIs, predictions, segment counts or recommendations.
2. **Every prediction shows a `ConfidenceBadge`** (High / Medium / Low). Low-confidence values are shown as a **range** with a muted caution style.
3. **Money:** `₹4,82,300` in tables; compact `₹4.8L` / `₹1.2Cr` in cards and tiles (`Intl.NumberFormat('en-IN')`). Never `$` or "K/M". Paise are never shown.
4. **Dates:** `12 Aug 2026`; relative ("3 days ago") only for recent activity with the exact date on hover. Times in the brand timezone (IST by default), 12-hour format with am/pm.
5. **Percentages:** one decimal at most; show the base ("18.2% of 12,400 customers").
6. **Source labels** wherever a value can come from different places: "Learned from your data", "From your questionnaire", "Set manually by Priya on 2 Sep".
7. **The frontend never calculates business metrics.** Display what the API returns. Formatting only (`lib/format.ts`).

### 3.2 Actions and safety
8. **Irreversible or costly actions** (Launch campaign, send test to many, delete, export, un-merge) need a confirmation step that shows **what will happen, to how many people and what it will cost** (e.g. "Send to 1,842 customers · est. Meta cost ₹1,450 · 10% holdout"). The confirm button repeats the action ("Launch to 1,842 customers"), never just "OK".
9. **Undo** for safe reversible actions (dismiss opportunity, archive audience) via a toast with Undo (8 s).
10. **Disabled buttons explain why** on hover/tap ("Connect WhatsApp to launch").
11. **Nothing is sent without an explicit human click** in V1.

### 3.3 States
12. Every data view has designed **loading** (skeleton), **empty** (what's missing + what to do next), **partial/provisional** ("Still importing: numbers may change") and **error** (plain words + retry) states.
13. Empty states teach: "We need about 60 more days of orders to predict reorder windows confidently. Here's what we can already see."

### 3.4 Language and copy
14. Write for a busy founder: short sentences, active voice, no jargon on founder-facing screens. Use glossary terms (`project.md` Part 5) and explain them with `?` when first shown.
15. Use "customers" (not "profiles/contacts/users"), "campaign" (not "broadcast/blast"), "opportunity" (not "insight/alert").
16. Recommendations use **why + what**: "342 high-value customers are 31% past their usual reorder time. Recommended: win-back with ₹150 off."
17. Never blame the user; errors say what happened and what to do.
18. UI copy is English in V1. **WhatsApp previews render English, Hindi (Devanagari) and Tamil scripts correctly**, using fonts with full script support.

### 3.5 Layout, components and interaction
19. Use **shadcn/ui components** and the shared feature components in §5. No one-off custom components without a reason in the PR.
20. Spacing on a 4 px base scale; content max-width ~1280 px; cards with consistent padding; generous whitespace over dense grids on founder screens. Dense tables are allowed on marketer screens (Audiences, Customers).
21. **Tables:** sticky header, server-side sorting/filtering/pagination, virtualised rows for large lists, column chooser on marketer tables, row click opens a detail view.
22. **Charts:** one message per chart with a one-line caption ("Most customers reorder between day 38 and 52"). Label axes with units. Never rely on colour alone. Consistent colours for the same series across screens. Lazy-load chart code.
23. **Forms:** inline validation on blur; defaults pre-filled; advanced fields collapsed under "Customise".
24. **Colour semantics** (placeholder until the brand palette exists): health states Active / At-risk / Dormant / Churned and confidence levels use consistent semantic tokens, always paired with a text label or icon.
25. **Accessibility:** WCAG 2.2 AA: contrast ≥ 4.5:1 for text, full keyboard navigation, visible focus, ARIA labels on icon buttons (including every `?`), respects reduced motion.
26. **Performance:** ≤ 200 KB JS per route (gzipped); LCP < 2.5 s on a mid-range Android over 4G for Home; no layout shift from late-loading data (reserve space).
27. **Motion:** subtle and functional (150–250 ms), never decorative loops.

## 4. Key screen blueprints (structure, not visuals)

### 4.1 Home — "What should I do today?"
1. Header: greeting + date + brand. The **Today summary** line: "3 high-priority opportunities · ₹4.8L potential · 2,184 customers ready".
2. **Opportunity cards** (ranked, max 3 expanded, "See all").
3. **Retention health strip:** 3–4 `MetricTile`s with trend + `?`.
4. **Upcoming** (next 7–14 days): compact list.
5. **Campaigns:** in flight (progress) and recent results (incremental revenue when measurable).

### 4.2 `OpportunityCard` anatomy
Type label (e.g. REPLENISHMENT) · headline value (₹ potential) + `?` · audience count · one-line reason · recommendation row (Action · Offer · Timing) · confidence badge · primary `[Review campaign]` · secondary `[Dismiss ▾]`.

### 4.3 Campaign flow
A stepper: **Who → Why → What → Offer → Message → When → Review**. Each step is pre-filled from the opportunity, so a founder can click Next through it. The **Review** step shows a `CostSummary` (recipients after exclusions with "why excluded", Meta cost estimate, offer cost, potential revenue range, holdout), a `PhonePreview` of the WhatsApp message with a real customer's variables, and the launch confirmation (rule 8).

### 4.4 Customer 360
Header (name, lifecycle **stage · health**, key value) → tabs or sections: Overview (historical + predictions with confidence and `?`) · Journey (`JourneyTimeline`, historical solid, predicted dashed/ghosted) · Orders · Messages · Consent. Merged-identity notice when applicable.

### 4.5 Parameter Studio card (`ParameterCard`)
Parameter name + scope → current value (large) → source label → evidence (n, confidence, mini distribution chart) → `[Override]` (value, reason, optional expiry) → **impact preview** before saving ("Moves 1,120 customers from Active to At-risk").

### 4.6 Import progress and the questionnaire start (D-032, D-033, D-034)
- Header: "Analysing <brand> · about N min left". The estimate updates as the import runs.
- Live lines, newest at the bottom, each with ✓ (done) or ⟳ (running): e.g. "✓ Read 61 products across 14 collections", "⟳ Reading 38,412 customers…", "✓ Found 10,350 customers who came back more than once". **Every line states something actually computed at that moment, with the brand's real numbers. Never decorative or invented text.**
- Primary action: **Start brand questionnaire · 4 min**, with the helper line underneath: *"This brand questionnaire helps us understand your brand better."* Secondary: "Skip for now — show me my data when ready".
- Setup checklist beside it: Store connected · Brand questionnaire · Review your data health · Connect WhatsApp · Launch your first campaign. If the import is still running when the questionnaire ends, "Connect WhatsApp" moves up next.
- Questions the data can answer show the pre-filled value when it exists, or an extra choice **"Fill this from my data"** (D-035).

### 4.7 Answer-vs-data notice (`DataNotice`, D-036)
- ✅ "Your data agrees" (quiet, inline) · 🟡 **Slight adjustment** (amber, explains the new value and why) · 🔴 **Big difference** (red, states both values, the evidence (e.g. "2,930 reorders, High confidence"), what would go wrong with the old value, and two buttons: **Keep <data value> (recommended)** and **Revert to my answer**, which opens Parameter Studio with an impact preview).
- Colour is never the only signal: each tier has its own icon and label text.
- Low-confidence data never shows the red tier; it shows "We're watching this" instead.

### 4.8 Briefing page (`BriefingItem`, D-037)
- A dated feed, newest first, grouped by day. Item types, each with a fixed icon and label: 🔴 ALERT (action needed) · 📈 RESULT · 💰 SAVED · 💡 IDEA · 🟡 ADJUST.
- Each item: one-line headline with the key number, one line of context, at most one primary action ("Review", "See details", "Yes / No").
- At most ~5 headline items per day; the rest under "More". Alerts are never hidden or collapsed.
- "Saved ₹" items always name what they're compared against ("vs your usual 10%").

## 5. Shared feature components (build once, reuse)
`MetricTile` · `ExplainPopover` (`?`) · `ConfidenceBadge` · `SourceLabel` · `ReasonList` · `OpportunityCard` · `AudienceRuleBuilder` · `AudienceCount` · `PhonePreview` (WhatsApp) · `CostSummary` · `JourneyTimeline` · `ParameterCard` · `HealthStatePill` · `StageLabel` · `DataQualityItem` · `EmptyState` · `ProvisionalBanner` · `ConfirmActionDialog` · `ImportProgress` · `DataNotice` · `BriefingItem`.

## 6. Frontend engineering rules
- TypeScript strict; no `any` in feature code.
- API calls only through the **generated client** (`src/lib/api`); never hand-written fetch types.
- Server state in TanStack Query; no global client state library unless approved.
- All formatting in `lib/format.ts`; all colours, spacing and radii from tokens (no hard-coded hex values in components).
- Every new screen: Playwright smoke test + component tests for logic.

## 7. Design tokens (placeholder until brand work)
Define as CSS variables consumed by Tailwind. Names are final; values are placeholders:
`--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-primary`, `--color-primary-foreground`, `--color-border`, `--color-success`, `--color-warning`, `--color-danger`, `--color-info`, `--color-health-active`, `--color-health-atrisk`, `--color-health-dormant`, `--color-health-churned`, `--color-confidence-high|medium|low`, `--radius-sm|md|lg`, `--space-*` (4 px scale), `--font-sans`, `--font-mono`, `--shadow-sm|md`.
Placeholder look: neutral greys, one calm primary colour, system font stack with Noto Sans Devanagari/Tamil fallbacks. When the brand is defined, only token **values** change.

---

## 8. Suggestions for the brand and design-system work (later)

**A. Define the brand before the visuals.** Three to five brand attributes (e.g. *calm, confident, clear, Indian, warm*), the voice (how RetentionOS talks to a founder), and what it must never feel like (e.g. *salesy, cluttered, corporate*).

**B. Typography.** Choose a highly legible UI typeface with tabular numbers, and pair it with **Noto Sans Devanagari** and **Noto Sans Tamil** (or equivalents) so template previews and future localisation look native.

**C. Colour.** One primary brand colour and a neutral scale. Semantic colours for health states and confidence tested for colour-blind safety and AA contrast. Consider dark mode as a later option (tokens make it cheap).

**D. References worth studying, and what to learn from each:**

| Product | Learn from it |
|---|---|
| Linear | Speed, keyboard-first flows, restraint |
| Stripe Dashboard | Explaining money and data clearly; great empty states and docs-in-product |
| Mercury | Calm, trustworthy financial UI for non-experts |
| Zerodha Kite / Console | Presenting numbers to Indian non-experts without clutter |
| Razorpay Dashboard | Indian merchant conventions and familiarity for your users |
| CRED | Polish and delight in an Indian consumer context (use sparingly in B2B) |
| Klaviyo / RetentionX | What your users already know, and where they get overwhelmed |

**E. Teaching UX, not just UI (suggested method).** When you share a reference, add three lines: *the user problem it solves*, *what exactly works* (layout, wording, interaction), and *what we should not copy*. Claude turns each into a rule in this file. Over time `design.md` becomes your UX playbook, not a mood board.

**F. Deliverables for the future design phase:** brand attributes and voice → tokens (colour, type, spacing, radius, shadow) → core component styling → Home, Opportunity card, Campaign review and Customer 360 high-fidelity mock-ups → usability test with 3–5 pilot founders → update this file.
