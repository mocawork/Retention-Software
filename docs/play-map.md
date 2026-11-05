# Retention Play Map (v2: with calculation recipes)

> **What this is:** Every play RetentionOS can run for a brand, grouped by goal, with **how it is calculated** and **where every input comes from** (exact Shopify field, questionnaire question, engine step, WhatsApp signal, or our own records). It ends with the **gaps**: missing sources, questions and calculations.
> **Status:** Draft for founder review (27 Oct 2026). Plays tagged *New idea* and every gap need a founder decision before they enter V1. Questionnaire pages 3–5 haven't been played through in the game yet, so their question numbers are provisional.

## Source types

| Tag | Meaning |
|---|---|
| **Shopify** | Read from the merchant's Shopify store through our app |
| **Questionnaire** | An answer the founder gives during onboarding (editable later) |
| **Engine** | Calculated by RetentionOS from the data above |
| **WhatsApp** | Signals Meta sends us about our messages: delivered, read, replies, opt-outs, failures |
| **RetentionOS** | Our own records: campaigns, holdouts, consent captures, brand settings, Moca calendars |
| **Missing** | No source today: see the gaps list |

## Data levels

| Level | Name | Meaning |
|---|---|---|
| 1 | Little data | Day one. Even a small or new brand (under ~500 buying customers or under 6 months of history). Uses rules, the questionnaire and basic counts. |
| 2 | Decent data | Roughly 500+ buying customers, 6+ months, about 100+ reorders in the main category. |
| 3 | Rich data | Roughly 5,000+ customers and 12+ months, and/or a history of campaigns with holdouts. |

## Building blocks (shared inputs)

### B1 · Purchase history
Every play that looks at what people bought. Turned into clean 'purchase occasions' by engine step E-01 (drops test, cancelled and fully refunded orders; handles COD and RTO; merges split orders).

- **Shopify:** Orders › createdAt, processedAt, cancelledAt, test
- **Shopify:** Orders › customer (id), email, phone
- **Shopify:** Orders › displayFinancialStatus, displayFulfillmentStatus
- **Shopify:** Orders › paymentGatewayNames (COD detection)
- **Shopify:** Orders › totalPriceSet, totalDiscountsSet, totalRefundedSet
- **Shopify:** Orders › lineItems (product, variant, quantity, unit price, discount allocations)
- **Shopify:** Orders › refunds (refund line items) and returns
- **Shopify:** Orders › fulfillments (status, deliveredAt) and tags (RTO rules)
- **Shopify:** Shop › ianaTimezone, currencyCode

### B2 · Contact details
Who we can reach and how to address them.

- **Shopify:** Customers › defaultPhoneNumber (fallback: order phone, shipping-address phone)
- **Shopify:** Customers › firstName
- **Engine:** Phone cleaned to +91 format and validated (phonenumbers library)

### B3 · Allowed to message?
Checked when the campaign is built and again right before each send.

- **RetentionOS:** WhatsApp consent records (our opt-in capture; CSV consent column)
- **Shopify:** Customers › SMS marketing consent (only if the brand's privacy policy covers WhatsApp, per O-04)
- **WhatsApp:** Opt-outs (STOP replies, Meta marketing opt-out)
- **RetentionOS:** Messages already sent (frequency caps, cool-downs)
- **Questionnaire:** Q5.1 message caps · Q5.2 quiet hours

### B4 · Product card
What a message shows about a product.

- **Shopify:** Products › title, featured image, onlineStoreUrl, status
- **Shopify:** Variants › title, price

### B5 · Rhythm
How often people rebuy, per brand, category, product and customer (engine E-07 to E-10, E-17).

- **Engine:** Reorder curves from B1 (Kaplan–Meier, survival analysis)
- **Questionnaire:** Q2.C2 days one unit lasts / Q2.F1 how often they buy again (starting assumption)
- **Questionnaire:** Q2.C1 used up and rebought? (until data decides)
- **Shopify:** Variants › title / selectedOptions (pack size, e.g. 200 ml)

### B6 · Offer limits
What the offer engine is allowed to give.

- **Questionnaire:** Q3.1 gross margin (or Shopify cost per item, see gap G3)
- **Questionnaire:** Q3.3 maximum discount · Q3.6 never-discount products · Q3.7 preferred offer types
- **Questionnaire:** Q1.2 price position (sets the default ladder)
- **Engine:** AOV and discount history from B1

## Questionnaire reference

| ID | Page | Question | New? |
|---|---|---|---|
| Q1.1 | Your brand | What do you sell? (categories, pre-ticked from Shopify) |  |
| Q1.2 | Your brand | Where does your pricing sit? (mass / mid / premium / luxury) |  |
| Q1.3 | Your brand | Where are most of your customers? (+ 'message this state in its language' toggle) |  |
| Q2.C1 | Products · consumables | Do customers use it up and buy again? |  |
| Q2.C2 | Products · consumables | How many days does one unit usually last? |  |
| Q2.F1 | Products · fashion | How often does a happy customer buy again? |  |
| Q2.F2 | Products · fashion | Which occasions drive your sales? |  |
| Q2.F3 | Products · fashion | How often do you launch new collections? |  |
| Q2.F4 | Products · fashion | What do customers often buy along with it? |  |
| Q2.D1 | Products · durables | How often do customers replace or upgrade? |  |
| Q3.1 | Money | Gross margin range |  |
| Q3.2 | Money | What discount do you usually give today? | **New (gap G12)** |
| Q3.3 | Money | Maximum discount you're willing to give |  |
| Q3.4 | Money | Free-shipping threshold |  |
| Q3.5 | Money | Do you offer COD? |  |
| Q3.6 | Money | Products that must never be discounted |  |
| Q3.7 | Money | Preferred offers and perks (free shipping, flat ₹, %, gift, early access) |  |
| Q3.8 | Money | How do you define a VIP? (default: top 5% by spend) |  |
| Q3.9 | Money | Do you offer subscriptions? Which app? | **New (gap G12)** |
| Q3.10 | Money | Do you run a loyalty or referral programme? Which app? | **New (gap G12)** |
| Q3.11 | Money | Typical delivery time (days) | **New (gap G12)** |
| Q4.1 | Communication | Message tone |  |
| Q4.2 | Communication | Default message language |  |
| Q4.3 | Communication | Emoji preference |  |
| Q4.4 | Communication | Sign-off name |  |
| Q5.1 | Guardrails | Maximum marketing messages per customer per week / month |  |
| Q5.2 | Guardrails | Quiet hours |  |
| Q5.3 | Guardrails | Which campaigns need owner approval |  |

## Plays by goal

### Win the second purchase
Turn first-time buyers into repeat customers. The biggest lever for most D2C brands.

#### P01 · Second-purchase nudge  
*Level 1 (Little data) · works earlier on assumptions, sharpens with data · V1 · Engine: E-07 · E-21 · DEC-01*

- **Who:** One-time buyers inside the brand's usual first-to-second-order window
- **What:** Reminder or their most likely next product. No discount by default
- **When:** Start of the window
- **How it's calculated:**
  1. Build purchase occasions from orders (B1).
  2. Measure the first→second order gap with the first-repeat reorder curve, blended with the founder's rhythm answer (E-07, E-08).
  3. Select customers with exactly one purchase whose days since it fall between the 25th and 80th percentile of that gap.
  4. Pick their most likely next product (E-21) and check they can be messaged (B3).
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history
  - Building block: B2 Contact details
  - Building block: B3 Allowed to message?
  - Building block: B4 Product card
  - Questionnaire: Q2.C2 / Q2.F1 rhythm answer (starting assumption)
  - Engine: E-21 next-best product
- **Gaps:** G17, G18

#### P02 · "How to use" after delivery  
*Level 1 (Little data) · New idea · Engine: E-01 delivery date · templates*

- **Who:** Every new buyer, 2–5 days after delivery
- **What:** Usage tips and what results to expect for the product they bought
- **When:** Days after delivery
- **How it's calculated:**
  1. Find the delivery date: fulfilment 'delivered' date; otherwise order date + typical delivery time.
  2. Select first-time buyers 2–5 days after delivery.
  3. Fill the template with the product's how-to-use content.
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history (fulfillments › deliveredAt)
  - Building block: B2 Contact details
  - Building block: B3 Allowed to message?
  - Questionnaire: Q3.11 typical delivery time (new question)
  - Missing: How-to-use content per product or category
- **Gaps:** G2, G8, G12

#### P03 · Gateway product insight  
*Level 2 (Decent data) · New idea · Engine: E-05 cohorts by first product*

- **Who:** Founder-facing
- **What:** "Customers whose first order is Bhringraj Oil come back 2× more often", so push it in ads and starter kits
- **When:** Weekly in Briefing
- **How it's calculated:**
  1. Group customers by the products in their first order.
  2. For each group, measure the share who reorder within 90/180 days (only customers old enough to judge).
  3. Keep products whose lift is statistically real; show acquisition channel alongside, because the channel can explain part of the effect.
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history
  - Shopify: Orders › customerJourneySummary (first visit UTM / referrer), optional

### Bring them back when they're due
Replenishment: reach people just before they run out.

#### P04 · Replenishment reminder  
*Level 1 (Little data) · works earlier on assumptions, sharpens with data · V1 · Engine: E-07…E-10 · E-17 · DEC-01*

- **Who:** Buyers of a used-up product entering their personal or product reorder window
- **What:** Reorder reminder with product image. No discount
- **When:** 2 days before the window opens
- **How it's calculated:**
  1. Classify each product as used-up or long-lasting from its own repeat rate (E-09); the founder's answer decides until 200+ buyers.
  2. Learn the reorder window per product family and per customer, stretched for bigger packs (E-07 to E-10, E-17).
  3. Due date = window start − 2 days, counted from delivery. Skip anyone who has bought it since.
  4. Fill the product name and image; check eligibility (B3).
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history
  - Building block: B5 Rhythm
  - Building block: B2 Contact details
  - Building block: B3 Allowed to message?
  - Building block: B4 Product card
  - Questionnaire: Q2.C1 used up? · Q2.C2 days per unit
- **Gaps:** G2, G7, G17, G19

#### P05 · Missed-reorder follow-up  
*Level 2 (Decent data) · New idea · Engine: DEC-01 sequence step · E-19*

- **Who:** Reminded customers who didn't buy and are now past their 'late' point
- **What:** A second, gentler nudge. Smallest incentive only if they depend on discounts
- **When:** Late point
- **How it's calculated:**
  1. Find customers who received a replenishment or at-risk message and haven't bought since.
  2. Fire when they pass their 'late' threshold (E-10).
  3. Offer nothing, or the smallest rung if their discount dependency is High (E-19, DEC-04).
- **Needs (and where it comes from):**
  - RetentionOS: Campaign recipients and send dates
  - Building block: B1 Purchase history
  - Building block: B5 Rhythm
  - Building block: B6 Offer limits
- **Gaps:** G6

#### P06 · Pack-size upgrade  
*Level 2 (Decent data) · New idea · Engine: E-03 pack sizes · E-06*

- **Who:** Customers who keep buying the small pack (3+ times)
- **What:** Suggest the bigger pack or combo: saves them money, raises order value
- **When:** Next due date
- **How it's calculated:**
  1. Rank each family's variants by size (parsed pack size) and price per unit (price ÷ size).
  2. Select customers with 3+ purchases of a smaller size.
  3. Check a bigger size exists (and is in stock, if available) and compute the saving per unit to show in the message.
- **Needs (and where it comes from):**
  - Shopify: Variants › title / selectedOptions (size), price
  - Shopify: Variants › inventoryQuantity (optional)
  - Building block: B1 Purchase history
  - Building block: B4 Product card
- **Gaps:** G7, G16

#### P07 · Variety switch  
*Level 2 (Decent data) · New idea · Engine: E-20 pattern type 'switch'*

- **Who:** Customers late on product A, where data shows A-buyers often move on to B
- **What:** Suggest B instead of reminding them about A
- **When:** When late on A
- **How it's calculated:**
  1. Find A→B patterns (E-20).
  2. Measure how many B-buyers keep buying A afterwards. If few do, label the pattern a 'switch'.
  3. Target customers who are late on A with B instead of an A reminder.
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history
  - Building block: B5 Rhythm
- **Gaps:** G15

#### P08 · Back-in-stock alert  
*Level 2 (Decent data) · Later (V1.x) · Engine: inventory data · E-17*

- **Who:** Customers due for a product that was out of stock
- **What:** "It's back" message
- **When:** When stock returns
- **How it's calculated:**
  1. Watch stock levels; detect a product going from 0 back to available.
  2. Audience = customers whose reorder window passed during the stock-out (E-17), plus people who viewed it then (pixel), if linked.
  3. Send the 'it's back' template.
- **Needs (and where it comes from):**
  - Shopify: Inventory levels + inventory_levels/update webhook (needs read_inventory)
  - Building block: B5 Rhythm
  - Shopify: Pixel events (optional)
  - Missing: 'Notify me' sign-ups held by other apps
- **Gaps:** G10, G16

#### P09 · Subscription suggestion  
*Level 2 (Decent data) · Later (V2) · Engine: E-17 confidence · subscription app*

- **Who:** Very regular re-buyers (High-confidence rhythm)
- **What:** Subscribe & save (only if the brand runs subscriptions)
- **When:** After 3+ on-time reorders
- **How it's calculated:**
  1. Select customers with High-confidence personal rhythm and 3+ on-time reorders.
  2. Only if the brand offers subscriptions; exclude current subscribers.
- **Needs (and where it comes from):**
  - Building block: B5 Rhythm
  - Questionnaire: Q3.9 do you offer subscriptions? (new question)
  - Missing: Subscriber list from the subscription app
- **Gaps:** G10, G12

### Grow the basket
Cross-sell and upsell what customers are likely to want next.

#### P10 · Cross-sell: bought A, likely B  
*Level 2 (Decent data) · V1 · Engine: E-20 · E-21 · DEC-06*

- **Who:** Recent buyers of A, where data proves A-buyers go on to buy B
- **What:** Introduce B, timed at the measured A→B gap
- **When:** Typical A→B gap from data
- **How it's calculated:**
  1. For every product pair, count customers who bought A and later B (only customers with enough follow-up time).
  2. Keep pairs with 30+ customers, lift ≥ 1.5× and a significance test that controls false discoveries across all pairs.
  3. Per customer, rank candidate B products (E-21); time the message at the measured A→B gap.
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history
  - Building block: B4 Product card
  - Shopify: Products › category, productType, collections (to roll up small products)
  - Questionnaire: Q2.F4 bought-along answer (pairs to test first)
- **Gaps:** G15, G18

#### P11 · Second-category expansion  
*Level 2 (Decent data) · V1 · Engine: E-20 category level*

- **Who:** Customers who only ever buy one category
- **What:** Introduce the category that multi-category (more loyal) customers usually add
- **When:** After 2nd order in first category
- **How it's calculated:**
  1. Map every product to a category.
  2. Check that multi-category customers really retain better than single-category ones.
  3. For single-category customers, recommend the category with the strongest category-level pattern.
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history
  - Shopify: Products › category (standard taxonomy), productType, collections
  - Questionnaire: Q1.1 what do you sell (category confirmation)

#### P12 · Upgrade path  
*Level 2 (Decent data) · New idea · Engine: E-20 pattern type 'upgrade'*

- **Who:** Customers on the first step of a path data shows people climb (trial → full size, regular → premium)
- **What:** Offer the next step
- **When:** At the typical step timing
- **How it's calculated:**
  1. Order products into steps: pack size, price per unit, product line.
  2. Find customers who climb from step k to k+1, and the typical timing.
  3. Target customers sitting on step k past that timing.
- **Needs (and where it comes from):**
  - Shopify: Variants › size, price
  - Shopify: Products › tags, productType (product line hints)
  - Building block: B1 Purchase history
  - Missing: Explicit 'premium line' marker
- **Gaps:** G7, G15

#### P13 · Bundle suggestions  
*Level 2 (Decent data) · Later (V1.x) · Engine: E-20 co-purchase*

- **Who:** Founder-facing, then customers once the bundle exists
- **What:** "X and Y are bought together 38% of the time; create a bundle"
- **When:** Weekly in Briefing
- **How it's calculated:**
  1. Count products bought in the same order; compute support and lift.
  2. Suggest bundles for strong pairs; once the bundle exists, promote it to buyers of either item.
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history (line items)
  - Missing: Components of existing bundle products
- **Gaps:** G7

#### P14 · Free-shipping nudge  
*Level 1 (Little data) · Later (V2) · Engine: live cart data*

- **Who:** Customers with something in their cart just below the free-shipping threshold
- **What:** "Add ₹120 more for free shipping"
- **When:** Live, while shopping
- **How it's calculated:**
  1. Read live cart value from storefront events.
  2. If cart value is within ~20% below the threshold, message them (needs a known, consenting customer).
- **Needs (and where it comes from):**
  - Shopify: Pixel events: cart value (teammate's pixel)
  - Questionnaire: Q3.4 free-shipping threshold
  - Building block: B3 Allowed to message?
- **Gaps:** G15

### Save the slipping
Notice customers going quiet, and win back the ones worth winning.

#### P15 · At-risk save  
*Level 1 (Little data) · works earlier on assumptions, sharpens with data · V1 · Engine: E-10 · E-12 · E-13*

- **Who:** Customers late against their own rhythm
- **What:** Gentle check-in. No discount by default
- **When:** Past the 'late' point
- **How it's calculated:**
  1. Health = At-risk when days since last purchase pass their personal 'late' point (E-10, E-12).
  2. Churn risk from the shape of the reorder curve (E-13).
  3. Offer nothing by default; smallest rung only if discount dependency is High (E-19).
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history
  - Building block: B5 Rhythm
  - Building block: B6 Offer limits
  - Building block: B3 Allowed to message?

#### P16 · High-value win-back  
*Level 2 (Decent data) · V1 · Engine: E-15 · E-18 · DEC-04*

- **Who:** Dormant customers who are High value or VIP
- **What:** Win-back with the smallest incentive that the maths says pays for itself
- **When:** Next allowed day
- **How it's calculated:**
  1. Value tier from spend percentile or the brand's VIP rule (E-18).
  2. Predicted 12-month value (E-15); probability still active (E-14, modified BG/NBD).
  3. Expected extra profit per offer = chance they buy × (order value × margin − discount) − chance they'd buy anyway × order value × margin; pick the best offer within limits (DEC-04).
  4. Create a unique Shopify discount code per customer.
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history
  - Building block: B5 Rhythm
  - Building block: B6 Offer limits
  - Questionnaire: Q3.8 VIP definition
  - Shopify: Discount API (write_discounts) for unique codes
  - Shopify: InventoryItem › unitCost (cost per item), if filled
- **Gaps:** G3

#### P17 · Dormant reactivation  
*Level 2 (Decent data) · V1 · Engine: E-14 · DEC-01*

- **Who:** Dormant mid/low-value customers with some life left
- **What:** Cheap reactivation, at most once in 60 days
- **When:** Next allowed day
- **How it's calculated:**
  1. Health = Dormant; value tier Mid/Low; probability still active ≥ 0.2 (E-14).
  2. Raise priority for customers who still read or click our messages.
  3. Limit to once per 60 days.
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history
  - Building block: B5 Rhythm
  - WhatsApp: Read status per message
  - RetentionOS: Link clicks from our tracked links
- **Gaps:** G11

#### P18 · "Can't lose" alert  
*Level 2 (Decent data) · New idea · Engine: E-17 · Briefing*

- **Who:** Very regular top customers whose rhythm suddenly broke
- **What:** Alert the founder for a personal call or message
- **When:** As soon as it breaks
- **How it's calculated:**
  1. Select VIPs with a High-confidence personal rhythm (4+ consistent gaps).
  2. Fire when they pass their personal 'late' point.
  3. Post to the Briefing with their history; the founder decides on personal outreach.
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history
  - Building block: B5 Rhythm
  - Questionnaire: Q3.8 VIP definition

#### P19 · Bad-experience recovery  
*Level 1 (Little data) · New idea · Engine: E-01 refunds/RTO · DEC-02*

- **Who:** Customers with a refund, return, RTO or failed delivery
- **What:** Pause promotions; send a care / resolution message instead
- **When:** After the event
- **How it's calculated:**
  1. Detect bad events: refund, return, RTO, failed delivery.
  2. Pause marketing to that customer for N days (DEC-02).
  3. Optionally send a care message.
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history (refunds, returns, fulfillments, tags)
  - RetentionOS: Brand's RTO tag rules (confirmed at onboarding)
  - Missing: Reviews and support tickets
  - Missing: Complaints written in WhatsApp replies
- **Gaps:** G2, G10, G13

#### P20 · Sunset rule  
*Level 1 (Little data) · New idea · Engine: E-12 · engagement · DEC-02*

- **Who:** Long-churned customers who never read or click
- **What:** Stop messaging them: protects WhatsApp quality and saves cost
- **When:** Automatic
- **How it's calculated:**
  1. Health = Churned (E-12).
  2. No read, click, reply or purchase after the last N messages.
  3. Suppress from marketing; re-allow if they buy or message us.
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history
  - Building block: B5 Rhythm
  - WhatsApp: Read statuses and replies
  - RetentionOS: Link clicks
- **Gaps:** G11

### Reward the best
Treat high-value customers with perks, not discounts.

#### P21 · VIP early access  
*Level 1 (Little data) · V1 · Engine: E-18 · DEC-01*

- **Who:** Top customers by value
- **What:** Early access, perks, thank-you. Not discounts
- **When:** Launches and monthly
- **How it's calculated:**
  1. VIP = top 5% by net spend, or the brand's rule (E-18).
  2. Triggered by a launch (new product published) or monthly.
  3. Perk from the brand's preferred offers.
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history
  - Questionnaire: Q3.8 VIP definition · Q3.7 perks
  - Shopify: Products › createdAt, publishedAt
  - Missing: Planned launch dates · perk descriptions
- **Gaps:** G8, G9

#### P22 · Rising stars  
*Level 3 (Rich data) · Later (V1.x) · Engine: E-15 trend*

- **Who:** Customers whose predicted value is climbing fast
- **What:** Nurture toward VIP (early access, personal note)
- **When:** When detected
- **How it's calculated:**
  1. Compare each customer's predicted 12-month value now vs 30 and 60 days ago.
  2. Select the fastest risers who aren't VIP yet.
- **Needs (and where it comes from):**
  - Engine: E-15 predicted value
  - Missing: History of past predictions
- **Gaps:** G5

#### P23 · Milestones  
*Level 1 (Little data) · New idea · Engine: E-06 counts/dates*

- **Who:** 5th order, 1-year 'customer-versary'
- **What:** Thank-you and a loyalty perk
- **When:** On the milestone
- **How it's calculated:**
  1. Count purchases; detect the 5th.
  2. Detect the anniversary of the first purchase.
  3. Attach the brand's perk.
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history
  - Questionnaire: Q3.7 perks
  - Missing: Perk descriptions
- **Gaps:** G8

#### P24 · Birthday  
*Level 1 (Little data) · Later (V1.x) · Engine: custom attributes*

- **Who:** Only if the brand's data has birthdays
- **What:** Birthday wish + perk
- **When:** Birthday
- **How it's calculated:**
  1. Match today's date with the customer's birthday.
- **Needs (and where it comes from):**
  - Missing: Birthday: no standard Shopify field (CSV column, app metafields, or our own capture)
- **Gaps:** G10

#### P25 · Referral ask  
*Level 2 (Decent data) · Later (V2) · Engine: referral tracking*

- **Who:** Happy repeat buyers and VIPs
- **What:** Share-with-a-friend link with a unique code
- **When:** After a good repeat order
- **How it's calculated:**
  1. 'Happy' = 2+ purchases, no refund or RTO, recent.
  2. Generate a unique referral code per customer (Shopify Discount API).
  3. Credit new customers' first orders that use the code.
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history
  - Shopify: Discount API
  - Questionnaire: Q3.10 loyalty/referral programme (new question)
  - Missing: Reward rules and who pays the reward
- **Gaps:** G10, G12

#### P26 · Launch to the right people  
*Level 1 (Little data) · works earlier on assumptions, sharpens with data · V1 · Engine: E-18 · E-20 audiences*

- **Who:** Buyers of related products + VIPs
- **What:** New product or collection, first to those most likely to want it
- **When:** Launch day (VIPs first)
- **How it's calculated:**
  1. Detect a new product (created/published).
  2. Audience = VIPs + buyers of the same category or products with strong affinity (E-20), ranked.
  3. VIPs get it first.
- **Needs (and where it comes from):**
  - Shopify: Products › createdAt, publishedAt, category, productType, collections
  - Building block: B1 Purchase history
  - Engine: E-18 tiers · E-20 affinity
  - Missing: Launch details and planned launch dates
- **Gaps:** G8, G9, G18

### Pick the right moment
Day and hour that fit each customer and the brand's calendar.

#### P27 · Personal best hour  
*Level 1 (Little data) · works earlier on assumptions, sharpens with data · V1 · Engine: E-23*

- **Who:** Every customer
- **What:** Send at their usual order time, later their usual reading time
- **When:** Their hour, within quiet hours
- **How it's calculated:**
  1. Bucket each customer's order times into 2-hour slots (store timezone), smoothed toward the brand's pattern.
  2. After 3+ reads, read times count double.
  3. Clamp to quiet hours.
- **Needs (and where it comes from):**
  - Shopify: Orders › createdAt · Shop › ianaTimezone
  - WhatsApp: Read timestamps
  - Questionnaire: Q5.2 quiet hours
- **Gaps:** G11

#### P28 · Payday window  
*Level 3 (Rich data) · V1 · Engine: E-22*

- **Who:** Brands whose data shows month-start buying
- **What:** Time due customers to the start of the month
- **When:** 1st–7th
- **How it's calculated:**
  1. Day-of-month distribution of purchases (store timezone).
  2. Pattern must pass a chi-square test (p < 0.01) with lift ≥ 1.2, on 1,000+ purchases over 6+ months, in both halves of the data.
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history

#### P29 · Festival campaigns  
*Level 1 (Little data) · works earlier on assumptions, sharpens with data · V1 · Engine: E-22 · founder ticks (Low conf.)*

- **Who:** Brands whose sales rise around festivals
- **What:** Festival message 10 days ahead
- **When:** Before the festival
- **How it's calculated:**
  1. For each festival in the calendar: orders in the 10 days before vs normal days (Poisson test).
  2. With under a year of data, use the founder's ticked occasions at Low confidence.
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history
  - RetentionOS: Moca festival calendar (U-8)
  - Questionnaire: Q2.F2 occasions · Q1.3 geography
- **Gaps:** G19

#### P30 · Regional festivals  
*Level 3 (Rich data) · V1 · Engine: E-22 regional*

- **Who:** Customers in the festival's region (Onam → Kerala)
- **What:** Regionally relevant festival message
- **When:** Before the festival
- **How it's calculated:**
  1. Same test as festivals, using only customers whose shipping state matches the festival's region.
- **Needs (and where it comes from):**
  - Shopify: Orders › shippingAddress.province · Customers › defaultAddress.province
  - RetentionOS: Festival calendar with regions

#### P31 · Seasonal products  
*Level 3 (Rich data) · Later (V2) · Engine: monthly seasonality*

- **Who:** Products the data shows sell in one season
- **What:** Bring them back before their season
- **When:** Season start
- **How it's calculated:**
  1. Per product, monthly sales against the brand's overall trend.
  2. Needs 2+ full years to separate a season from growth.
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history
- **Gaps:** G15

#### P32 · Sale-event targeting  
*Level 2 (Decent data) · New idea · Engine: E-19 · audiences*

- **Who:** Deal-seekers and lapsed customers in, full-price buyers out
- **What:** Invite the right people to a sale; keep full-price buyers away from it
- **When:** Before a sale
- **How it's calculated:**
  1. Discount dependency per customer (E-19), counting codes, automatic discounts and sale prices.
  2. Invite High-dependency and lapsed customers; exclude full-price buyers.
  3. Needs the sale date.
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history
  - Shopify: Variants › compareAtPrice (sale prices)
  - Missing: Planned sale dates
- **Gaps:** G4, G9

### Protect the margin
Give discounts only where they actually change behaviour.

#### P33 · No discount for full-price buyers  
*Level 2 (Decent data) · V1 · Engine: E-19 · DEC-04*

- **Who:** Customers who buy without codes (3+ orders)
- **What:** Remind, never discount
- **When:** Always
- **How it's calculated:**
  1. Discounted share of each customer's purchases: codes, automatic discounts, and items bought below compare-at price.
  2. Full-price buyer = 3+ purchases and under 20% discounted.
- **Needs (and where it comes from):**
  - Shopify: Orders › discountCodes, discountApplications
  - Shopify: Line items › discountAllocations, original vs discounted unit price
  - Shopify: Variants › compareAtPrice
- **Gaps:** G4

#### P34 · Smallest-incentive ladder  
*Level 1 (Little data) · V1 · Engine: DEC-04 rules*

- **Who:** Anyone who needs an incentive
- **What:** Free shipping → flat ₹ → 10%, within the brand's limits
- **When:** Per campaign
- **How it's calculated:**
  1. Ladder: free shipping (only if AOV is below the threshold) → flat ₹ ≈ 5% of AOV → 10% → 15%.
  2. Cap at the maximum discount; remove never-discount products; respect the margin floor.
- **Needs (and where it comes from):**
  - Building block: B6 Offer limits
  - Questionnaire: Q3.4 free-shipping threshold
  - Building block: B1 Purchase history (AOV)
- **Gaps:** G3

#### P35 · Learned best offer  
*Level 3 (Rich data) · V1 · Engine: MEA-03/04 · DEC-04*

- **Who:** Segments with experiment history
- **What:** The offer proven to earn the most extra profit
- **When:** Per campaign
- **How it's calculated:**
  1. From past holdouts and A/B tests, estimate each offer's conversion per customer group (Beta posteriors).
  2. Pick the offer with the highest expected extra profit if it's ≥ 80% likely to be best; otherwise suggest a test.
- **Needs (and where it comes from):**
  - RetentionOS: Campaign, variant and holdout history
  - Building block: B1 Purchase history (conversions)
  - Building block: B6 Offer limits
- **Gaps:** G3

#### P36 · Wean-off ladder  
*Level 2 (Decent data) · New idea · Engine: E-19 · DEC-04*

- **Who:** Customers acquired with discount codes
- **What:** A smaller incentive each order until they buy at full price
- **When:** Each order
- **How it's calculated:**
  1. Find customers whose first order used a discount.
  2. Each later offer is one rung below the last one they used, down to none.
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history (discount data)
  - RetentionOS: Offers we sent each customer
- **Gaps:** G4

#### P37 · Discount-dependency alert  
*Level 2 (Decent data) · New idea · Engine: E-19 trend*

- **Who:** Founder-facing
- **What:** "34% of repeat revenue now needs a code (was 21%)"
- **When:** Weekly in Briefing
- **How it's calculated:**
  1. Monthly share of repeat revenue that used any discount (codes, automatic, sale prices).
  2. Alert when it rises by more than a set number of points.
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history
  - Shopify: Variants › compareAtPrice
- **Gaps:** G4

### India realities
COD, RTO, language, carts: the Indian D2C specifics.

#### P38 · COD → prepaid nudge  
*Level 1 (Little data) · New idea · Engine: DEC-04 offer type*

- **Who:** Repeat COD customers
- **What:** "Pay online, get free shipping" inside reorder messages
- **When:** With reorder messages
- **How it's calculated:**
  1. COD share per customer from payment gateway names.
  2. Customers with COD share ≥ 50% get a prepaid perk line in their reorder message.
- **Needs (and where it comes from):**
  - Shopify: Orders › paymentGatewayNames
  - Questionnaire: Q3.5 COD offered
  - Missing: A way to restrict the perk to prepaid orders
- **Gaps:** G14

#### P39 · COD order confirmation  
*Level 1 (Little data) · Needs decision (O-07) · Engine: real-time trigger · utility template*

- **Who:** Every new COD order
- **What:** Utility message: confirm before dispatch (fewer RTOs)
- **When:** Minutes after order
- **How it's calculated:**
  1. On orders/create, if COD, send a utility template with Confirm / Cancel buttons.
  2. Write the answer back to Shopify (tag or cancel the order).
- **Needs (and where it comes from):**
  - Shopify: orders/create webhook · paymentGatewayNames
  - Building block: B2 Contact details
  - Shopify: Order tag/cancel (needs write_orders)
  - WhatsApp: Button replies
- **Gaps:** G15, G16

#### P40 · RTO-risk exclusion  
*Level 1 (Little data) · V1 · Engine: DEC-02 rule 9*

- **Who:** Customers with 2+ RTOs
- **What:** Keep them out of COD-driving offers
- **When:** Always
- **How it's calculated:**
  1. Count RTO-flagged COD orders per customer.
  2. 2+ → excluded from COD-driving offers (brand toggle).
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history (fulfillments, cancellations, tags)
  - RetentionOS: Brand's RTO tag rules
- **Gaps:** G2

#### P41 · Abandoned-cart recovery  
*Level 1 (Little data) · Needs decision (O-07) · Engine: checkouts data (already collected)*

- **Who:** Shoppers who left a checkout
- **What:** Reminder (and maybe an incentive)
- **When:** 30 min – 24 h later
- **How it's calculated:**
  1. Poll abandoned checkouts every 15 minutes (teammate's app).
  2. If there's a phone number and consent and the checkout is still unfinished after 30 minutes, send a reminder.
  3. Optional second step after 24 hours.
- **Needs (and where it comes from):**
  - Shopify: Abandoned checkouts (phone, items, recovery URL)
  - Shopify: Checkout SMS marketing consent
  - Building block: B3 Allowed to message?
- **Gaps:** G6, G15

#### P42 · Browse abandonment  
*Level 1 (Little data) · Later (V2) · Engine: pixel events*

- **Who:** Viewed a product, didn't buy
- **What:** "Still thinking about…" message
- **When:** Same/next day
- **How it's calculated:**
  1. Product-view events linked to a known customer (visitor identity).
  2. No purchase within 24 hours → message.
- **Needs (and where it comes from):**
  - Shopify: Pixel events + visitor identity (teammate's app)
  - Building block: B3 Allowed to message?
- **Gaps:** G15

#### P43 · Right language  
*Level 1 (Little data) · V1 · Engine: E-24*

- **Who:** Every customer
- **What:** Tamil / Hindi / English template per customer
- **When:** Always
- **How it's calculated:**
  1. Explicit preference first (opt-in choice, script of their replies).
  2. Then the brand's state → language rule, then the default language.
  3. Must match an approved template language.
- **Needs (and where it comes from):**
  - RetentionOS: Language chosen at opt-in (new)
  - WhatsApp: Script of their replies (Tamil/Devanagari characters)
  - Shopify: Customers › locale (weak signal) · shipping province
  - Questionnaire: Q1.3 state toggle · Q4.2 default language
- **Gaps:** G12, G13

### Founder insights
Answers that change the founder's decisions, without sending anything.

#### P44 · Retention health and cohorts  
*Level 1 (Little data) · V1 · Engine: E-04 · E-05*

- **Who:** Founder-facing
- **What:** Repeat rate, retention by month joined, returning-revenue share
- **When:** Always on
- **How it's calculated:**
  1. Metric catalogue (E-04) and monthly cohorts (E-05) from purchase occasions.
- **Needs (and where it comes from):**
  - Building block: B1 Purchase history

#### P45 · Revenue at risk  
*Level 2 (Decent data) · V1 · Engine: E-15 · E-12*

- **Who:** Founder-facing
- **What:** ₹ value of high-value customers going quiet
- **When:** Always on
- **How it's calculated:**
  1. Sum of predicted 12-month value (E-15) for High/VIP customers whose health is At-risk or Dormant (E-12).
- **Needs (and where it comes from):**
  - Engine: E-12 health · E-15 value · E-18 tiers

#### P46 · Acquisition quality  
*Level 2 (Decent data) · New idea · Engine: UTM data · cohorts*

- **Who:** Founder-facing
- **What:** Which ad channel or campaign brings customers who come back
- **When:** Monthly
- **How it's calculated:**
  1. Group first orders by channel (UTM source/medium, referrer, sales channel).
  2. Compare repeat rate and 12-month value per channel.
- **Needs (and where it comes from):**
  - Shopify: Orders › customerJourneySummary (UTM, referrer), sourceName
  - Building block: B1 Purchase history
  - Missing: Ad spend per channel (for cost per repeat customer)
- **Gaps:** G10

#### P47 · Product health  
*Level 2 (Decent data) · New idea · Engine: E-04 · E-09*

- **Who:** Founder-facing
- **What:** Products with high returns or unusually low repeat (quality or fit problem?)
- **When:** Monthly
- **How it's calculated:**
  1. Per product: refund/return rate and same-product repeat rate vs its category average.
  2. Flag outliers.
- **Needs (and where it comes from):**
  - Shopify: Refunds › refundLineItems · Orders › returns
  - Building block: B1 Purchase history
  - Missing: Return reasons, reviews
- **Gaps:** G10

#### P48 · Repeat revenue forecast  
*Level 3 (Rich data) · Later (V1.x) · Engine: E-14/E-16 · E-15*

- **Who:** Founder-facing
- **What:** Expected repeat revenue in the next 30 days
- **When:** Weekly
- **How it's calculated:**
  1. Sum over customers: expected purchases in 30 days (E-14/E-16) × expected order value (E-15).
  2. Doesn't yet account for seasonality or planned campaigns.
- **Needs (and where it comes from):**
  - Engine: E-14 / E-16 expected purchases · E-15 order value
  - Missing: History of predictions (to check accuracy)
- **Gaps:** G5, G15

#### P49 · Reachability report  
*Level 1 (Little data) · New idea · Engine: consent records · phone checks*

- **Who:** Founder-facing
- **What:** % of customers you can legally message on WhatsApp, and how to grow it
- **When:** At onboarding, then weekly
- **How it's calculated:**
  1. Share with a valid Indian mobile number.
  2. Share with consent, by source.
  3. Estimated share on WhatsApp (learned from send failures).
- **Needs (and where it comes from):**
  - Building block: B2 Contact details
  - Building block: B3 Allowed to message?
  - Shopify: Customers › SMS marketing consent
  - WhatsApp: Send failures (number not on WhatsApp)
- **Gaps:** G1, G11

#### P50 · Campaign results  
*Level 1 (Little data) · works earlier on assumptions, sharpens with data · V1 · Engine: MEA-01 · MEA-02*

- **Who:** Founder-facing
- **What:** Attributed revenue always; caused revenue once enough holdout data
- **When:** After each campaign
- **How it's calculated:**
  1. Attributed: orders within 7 days of a delivered message, by code match > link click > delivery (MEA-01).
  2. Caused: treated vs holdout, pooled per type over 90 days (MEA-02).
  3. Savings vs the brand's usual discount; cost = delivered marketing messages × Meta rate.
- **Needs (and where it comes from):**
  - WhatsApp: Delivered / read / failed statuses
  - RetentionOS: Tracked links, unique codes, holdout groups
  - Building block: B1 Purchase history (codes used, order times)
  - Questionnaire: Q3.2 usual discount (new question)
  - RetentionOS: Meta rate card (config)
- **Gaps:** G12

### Get smarter over time
Measure what was really caused, and learn from it.

#### P51 · Caused revenue (holdouts)  
*Level 2 (Decent data) · works earlier on assumptions, sharpens with data · V1 · Engine: MEA-02 · DEC-08*

- **Who:** Every automated campaign
- **What:** Hold back a few customers to measure what the message really caused
- **When:** Pooled per 90 days
- **How it's calculated:**
  1. Random holdout by hash per campaign.
  2. Compare conversion and revenue per person, treated vs held out, pooled per opportunity type over 90 days.
- **Needs (and where it comes from):**
  - RetentionOS: Holdout assignments
  - Building block: B1 Purchase history

#### P52 · A/B tests  
*Level 2 (Decent data) · V1 · Engine: MEA-03*

- **Who:** Campaigns with enough recipients
- **What:** Test two offers or templates; keep the winner
- **When:** Per campaign
- **How it's calculated:**
  1. Random variant assignment; Beta-Binomial per variant; winner when ≥ 95% likely best with 300+ per variant.
- **Needs (and where it comes from):**
  - RetentionOS: Variant assignments
  - Building block: B1 Purchase history

#### P53 · Send-time learning  
*Level 2 (Decent data) · V1 · Engine: E-23 · MEA-04*

- **Who:** Customers who read messages
- **What:** Move each customer's send hour to when they actually read
- **When:** Ongoing
- **How it's calculated:**
  1. Read-time histogram per customer, weighted double vs order times (E-23).
- **Needs (and where it comes from):**
  - WhatsApp: Read timestamps
- **Gaps:** G11

#### P54 · Persuadables targeting  
*Level 3 (Rich data) · Later (V1.x) · Engine: uplift model on holdout data*

- **Who:** Brands with experiment history
- **What:** Message the people a message actually changes, not those who'd buy anyway
- **When:** Ongoing
- **How it's calculated:**
  1. Train an uplift model on many randomised treated-vs-holdout campaigns.
  2. Score each customer's expected change in behaviour from a message.
- **Needs (and where it comes from):**
  - RetentionOS: Randomised campaign history
  - Engine: Customer features (E-06)
- **Gaps:** G15

#### P55 · Cross-brand learning  
*Level 1 (Little data) · Later (V1.x) · Engine: needs legal terms O-14*

- **Who:** New brands in a category
- **What:** Start from what similar brands' data taught us
- **When:** From day one
- **How it's calculated:**
  1. Combine anonymised category results from 5+ brands into category starting values; refresh quarterly.
- **Needs (and where it comes from):**
  - Engine: Category results from all brands
  - RetentionOS: Legal terms allowing it (O-14)
- **Gaps:** G15

## Gaps: what's missing or unspecified

| ID | Gap | Problem | Proposed fix | Kind | Plays affected |
|---|---|---|---|---|---|
| G1 | **WhatsApp consent has no Shopify source** | Shopify stores email and SMS consent, not WhatsApp consent. Every messaging play depends on knowing who agreed. | Our own opt-in capture (link/QR, thank-you page block, WooCommerce checkbox) + a legal decision on whether Shopify SMS consent counts (O-04). Show consent coverage at onboarding. | Decision + new capture | All messaging plays |
| G2 | **Delivery dates and RTO aren't reliable in Shopify** | Indian logistics apps (Shiprocket, Delhivery…) often don't push 'delivered' back to Shopify, and RTO shows up as inconsistent tags or cancellations. | Onboarding step: 'we think these orders are RTO, confirm'. Brand tag rules. Fallback to order date + typical delivery time (Q3.11). Later: logistics integrations. | New question + later integration | P02, P04, P19, P40 |
| G3 | **Margin is only a rough range** | A questionnaire margin range is too coarse for per-product offer maths. | Use Shopify's 'Cost per item' (InventoryItem › unitCost) per variant when the brand has filled it (needs read_inventory scope). Fall back to Q3.1. | New Shopify field | P16, P34, P35, P50 |
| G4 | **Discount detection misses sale prices** | A customer who buys at a reduced sale price (compareAtPrice > price) or via an automatic discount isn't a 'full-price buyer', but our spec only counts discount codes. | Count codes, automatic discounts and compare-at sale prices in engine E-19. | Calculation fix | P32, P33, P36, P37 |
| G5 | **We don't keep prediction history** | Predictions are overwritten nightly, so we can't see whose value is rising, or check old predictions against what happened. | Store weekly snapshots of key predictions per customer. | Calculation / storage fix | P22, P48 |
| G6 | **No multi-step sequences** | Campaigns are single sends. 'Remind, then follow up if no purchase' isn't specified. | Add sequence steps to the campaign engine (step 2 fires only if no purchase since step 1). | New engine feature | P05, P02, P41 |
| G7 | **Product structure is incomplete** | Pack sizes aren't always in variant names, there's no 'premium line' marker, and bundle orders hide their components. | A Product Studio screen where the brand fixes families, sizes, product lines and bundle contents. Parsing does most of it automatically. | New input screen | P04, P06, P12, P13 |
| G8 | **No content library** | Some plays need brand content we don't have: how-to-use tips, perk descriptions, launch details. | A small content library per product/category, used as template variables or links. | New input screen | P02, P21, P23, P26 |
| G9 | **No brand calendar** | We can detect past sales but don't know planned sales, launches or blackout dates. | A Calendar inside RetentionOS: sales, launches, no-send days. | New input screen | P21, P26, P32 |
| G10 | **Outside tools aren't connected** | Reviews, support tickets, ad spend, subscription apps, loyalty/referral apps, marketplaces and waitlist apps all hold useful signals. | Later integrations, prioritised by which plays they unlock. V1 works without them. | Later integrations | P08, P09, P19, P24, P25, P46, P47 |
| G11 | **WhatsApp engagement has blind spots** | We can't check whether a number is on WhatsApp before sending, and customers can switch read receipts off. | Combine reads, clicks, replies and purchases for 'engagement'. Learn 'not on WhatsApp' from send failures. | Calculation fix | P17, P20, P27, P49, P53 |
| G12 | **Questionnaire is missing a few questions** | Some plays need answers we don't ask yet. | Add Q3.2 usual discount, Q3.9 subscriptions, Q3.10 loyalty/referral, Q3.11 delivery time; ask language at opt-in. | New questions | P02, P04, P09, P25, P43, P50 |
| G13 | **We can't read replies** | Spotting complaints or intent in customers' WhatsApp replies needs text classification. CLAUDE.md rule R-2 currently forbids AI there. | Founder decision: allow Jev (choices only, no text generation) for reply classification, or keep V1 to keywords. | Decision | P19, P43 |
| G14 | **Prepaid-only perks can't be enforced** | A normal Shopify discount code can't be limited to prepaid orders. | A Shopify Function / checkout rule, or partner with a COD-fee app. Until then the perk is a message-only nudge. | New Shopify build | P38 |
| G15 | **Some calculations aren't specified yet** | Pattern types and measured A→B timing (U-12), seasonality, uplift (persuadables), cross-brand pooling and real-time triggers have no written spec. | Write these specs before their milestone. | Spec work | P07, P10, P12, P14, P31, P39, P41, P42, P48, P54, P55 |
| G16 | **Shopify permissions not yet requested** | read_inventory (stock, cost per item) and write_orders (tag/cancel a COD order after confirmation) aren't in the app's scope list. | Add them to the Shopify app scopes and the protected-data justification, only if their plays enter V1. | Scope change | P06, P08, P39 |
| G19 | **Gift and occasion rebuys look like 'running out'** | Engine E-09 treats any rebuy of the same product as consumption. If 5–15% of saree buyers rebuy the same design (e.g. as gifts), the product becomes 'mixed' and those customers get replenishment reminders for a saree. | (1) The founder's 'lasts long' answer holds unless the data shows ≥15% rebuy; (2) require regular intervals before treating rebuys as running out; (3) detect gift orders (shipping name/phone differs from the buyer, gift notes, festival timing) and keep them out of rhythm maths; (4) turn detected gifters into a festival-gifting audience. | Calculation fix | P04, P29 |
| G17 | **Replenishment wording isn't category-aware** | Templates are chosen by objective × tone × language, not by product type. A skincare reminder needs "keep going to see results" framing; coffee needs "running low?". Today both get the same generic replenishment template. | Add a category dimension to the replenishment templates (results-based vs runs-out products), picked from the product's category. Copy must avoid unprovable claims (cosmetic/health) under Meta's and advertising rules. | Template content | P04, P01 |
| G18 | **No 'similar item' recommendations for one-off designs** | For sarees, jewellery and other catalogues where each design sells a few times, product-level patterns never reach the 30-customer minimum, so next-best product falls back to category bestsellers. Recommending "another silk saree in your price range" needs attribute similarity (fabric, price band, style tags), which isn't specified. | Specify attribute-based similarity (category + price band + tags/metafields) as a fallback in E-21. | Spec work | P01, P10, P26 |

## Totals
- 55 plays · Level 1: 24 · Level 2: 24 · Level 3: 7
- By status: Later (V1.x): 7 · Later (V2): 5 · Needs decision (O-07): 2 · New idea: 17 · V1: 24
- Plays with at least one gap: 45 · Gaps: 19
