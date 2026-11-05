# Founder–Customer Game: running log

Played by the founder (as "Vanam Herbals", a fictional Shopify hair-care brand, with a detour as a saree shop) with Claude as backend developer. Tracks what each step settled and what is still open. At the end of the game, decided items go into `changelogs.md` and open items into `technical.md` §21.

Companion files: `docs/play-map.md` (Retention Play Map v2: 55 plays, how each is calculated, sources, gaps G1–G19).

## Decided during the game
> **Update 5 Nov 2026:** G-D1…G-D7 are now recorded in `changelogs.md` as **D-031…D-037** (G-D1 = D-031 … G-D7 = D-037) and applied to `project.md`, `design.md` and `technical.md`. U-4 is handled for now by building 2-step login with a setting (D-039). The game resumes at Page 3 "Money".

| # | Decision | Step |
|---|---|---|
| G-D1 | Shopify-install sign-ups and website sign-ups share **one account pool** (same users, brands and logins), whichever door a founder enters by. | 1 |
| G-D2 | The import screen shows a **time estimate** and **live progress** with storytelling lines tied to the backend stage *and* the brand's own data (e.g. "Found 10,350 customers who came back more than once"). Rule: every line describes something actually being computed at that moment, with real numbers. No fake theatre. | 2 |
| G-D3 | A small line under the "Start brand questionnaire" button: *"This brand questionnaire helps us understand your brand better."* | 3 |
| G-D4 | The **questionnaire never waits for the data**. Answers are saved as starting assumptions; when the import finishes, the engine blends them with the data and tells the founder if they disagree. If the import is still running when the questionnaire ends, **Connect WhatsApp** comes before the data report. Import order: products, then customers, then orders. | 4 |
| G-D5 | Questions the data can answer are **pre-filled when the data has arrived**; otherwise they offer **"Fill this from my data"** (Moca default used until the data arrives). | 5 |
| G-D6 | **Two-tier "your answer vs your data" notices.** ✅ within 15% "Your data agrees". 🟡 15–50% off "Slight adjustment" (blend used, founder told). 🔴 more than 1.5× or less than 0.67× "Big difference": switched to the data value automatically, with **"Revert to my answer"** in Parameter Studio and an impact preview. The automatic switch happens only when the data is at least Medium confidence (≥ 50 reorders). Percentages are Claude's defaults; the founder can tune them. | 5 |
| G-D7 | A daily **Briefing page** (feed) + optional daily digest to the founder: 🔴 Alerts, 🟡 Adjustments, 📈 Results (caused vs attributed), 💰 Savings, 💡 Suggestions. Home = "What should I do today?"; Briefing = "What happened and what changed". | 5 |

## Undecided / to do
| # | Item | Owner | When |
|---|---|---|---|
| U-1 | **Landing page:** a conversion-focused website page for founders who come directly (Door B). | Founders | Before launch |
| U-2 | **Free trial:** length, card required or not, trial limits, what counts as trial success. | Founders | After the app is built |
| U-3 | **Billing explanation owed:** Shopify Billing vs Razorpay vs Stripe, and whether Shopify brands can pay outside Shopify (O-12). | Claude explains → Founders decide | Later (founder asked) |
| U-4 | **2-step login security:** force at sign-up (safer, more friction) or within 7 days, before export/launch (smoother; Claude's suggestion). | Founders | Before M0 login build |
| U-5 | **Import-time calculation owed:** how long a store of a given size takes to import, and why. | Claude explains | Later (founder asked) |
| U-6 | **Questionnaire rule:** every question must change something the engine does. Cut or move questions that change nothing (e.g. "Who buys from you?", "Key competitors"). | Founders confirm | Before questionnaire build (M1) |
| U-7 | **Question modules by store type:** one core questionnaire + an add-on page per store type (Consumables, Fashion & ethnic wear, Durables & home, Jewellery & gifting, Food & perishables, Kids/baby & pets). Each question maps to an engine setting. | Founders approve + content | Before M1 |
| U-8 | **Festival and occasion calendar:** Moca-maintained list of festivals, wedding seasons and regional occasions with dates per year and regions. | Founders/ops | Before M3 |
| U-9 | **Category profiles:** Claude recommends skipping a hand-built library: founder's answer as starting assumption, a cautious generic spread, borrowing from the brand's similar products, and automatic cross-brand profiles once 5+ brands share a category (needs O-14). Simulation: brand data alone is reliable from ~100 reorders per category (tight rhythm, e.g. oil) to ~300 (wide rhythm, e.g. perfume). | Founders decide | Before M3 |
| U-10 | **Honest "savings":** always measured against the brand's own usual discount (new question Q3.2), never inflated. | Founders confirm | Before M6/M7 |
| U-11 | **Which "New idea" plays enter V1:** 17 plays in the Play Map aren't in the PRD yet (e.g. how-to-use after delivery, pack-size upgrade, sunset rule, bad-experience recovery, COD→prepaid nudge, sale-event targeting, gateway-product insight). | Founders | Before M4 planning |
| U-12 | **Cross-sell upgrades:** (a) label each A→B pattern as complement, switch or upgrade; (b) time cross-sell at the **measured** A→B gap, not a fixed 21 days. | Founders approve | Before M3 |
| U-13 | **Close the 19 gaps from Play Map v2 (G1–G19):** decide for each whether it's fixed in V1, later, or never. Highlights: WhatsApp consent source (G1), delivery/RTO truth from logistics (G2), Shopify "cost per item" for margins (G3), sale prices counted as discounts (G4), keep prediction history (G5), follow-up sequences (G6), Product Studio (G7), content library (G8), brand calendar (G9), reply reading with Jev or keywords only (G13), extra Shopify permissions read_inventory / write_orders (G16), category-aware replenishment wording, e.g. "keep going to see results" for skincare (G17, new), 'similar item' recommendations for one-off designs like sarees (G18, new), gift/occasion rebuys misread as 'running out' (G19, new). | Founders | Before M1 (G1–G4, G16), before M4 (others) |

## What-ifs to discuss (Claude's list)
Each line: the question → what the current plan does → 🔴 if something is still open.

| # | What if… | Current plan | Open? |
|---|---|---|---|
| W-1 | …the history import fails halfway? | Each object type imports separately and resumes where it stopped; retries with back-off; banner "Still importing; numbers may change"; insights marked provisional. | |
| W-2 | …the founder closes the browser during import? | The import runs on our servers; we alert the founder when it finishes. | |
| W-3 | …the merchant uninstalls tomorrow? | Access key deleted instantly, syncing stops; 48 h later Shopify sends `shop/redact` and we erase the store's data (D-027). Login remains; brand shows "disconnected". | 🔴 Warn before erase ("Reinstall within 48 h to keep your data")? |
| W-4 | …Shopify denies "read all orders"? | Only the last 60 days are visible, too short for rhythms. Clear warning + offer CSV upload of the Shopify order export. | |
| W-5 | …Shopify hasn't approved access to customer names/phones yet? | Fields arrive empty, so no WhatsApp sends. Only before App Store approval; the review requires it anyway. | |
| W-6 | …a staff member (not the founder) installs the app? | Whoever installs becomes Owner. | 🔴 Need "invite the real owner / transfer ownership". |
| W-7 | …the same founder runs two brands? | One login, two brand spaces, brand switcher. Data never mixes. | |
| W-8 | …the founder's email already has an account? | Log in first, then attach the store (prevents account takeover). | |
| W-9 | …an order webhook arrives before its customer is imported? | Placeholder customer from the order's customer ID, filled in later. Nothing lost. | |
| W-10 | …Shopify rate-limits or has an outage during import? | Automatic slow-down and retry; progress screen says "Shopify is busy, resuming shortly". | |
| W-11 | …the store is huge (1M customers / 3M orders)? | Hours, not minutes; partial insights marked provisional; estimate reflects size (U-5). | |
| W-12 | …the founder skips the questionnaire? | Starting assumptions from Shopify categories + Moca defaults, then the brand's data. Small brands see more Low-confidence labels. | |
| W-13 | …a questionnaire answer is way off from the data? | Data wins once there's enough of it; yellow/red notices (G-D6); founder can override in Parameter Studio. | |
| W-14 | …the store sells in multiple currencies or internationally? | V1 analyses in the store's main currency. | 🔴 International orders: include, exclude or separate? |
| W-15 | …the store's timezone isn't IST? | Always use the store's own timezone for day/hour logic. | |
| W-16 | …a brand sells very different types (sarees *and* skincare)? | Each product group gets its module (max 2–3, under ~5 min). The engine learns rhythm per category. | |
| W-17 | …we detect the store type wrongly? | Page 1 shows editable chips; changing one swaps the module questions. | |
| W-18 | …the founder finishes the questionnaire after the import is done? | Same result; the blend and any notices appear immediately. | |
| W-19 | …a founder ticks a festival their data doesn't support? | "We didn't see an Onam effect in your orders yet; we'll keep watching." | 🔴 Suggest at Low confidence, or not at all? (Claude leans: not at all, with explanation.) |
| W-20 | …the founder reverts a 🔴 change and the data keeps disagreeing? | The founder's value stays; re-notify at most once every 30 days, showing how both values performed. | |
| W-21 | …the Briefing gets noisy? | Grouped and ranked; ~5 headline items per day, rest under "More"; alerts never hidden. | 🔴 Exact daily limit |
| W-22 | …a niche category isn't covered (e.g. "kids' ayurvedic hair oil")? | Falls back to the closest parent category; the brand's own data takes over. | |
