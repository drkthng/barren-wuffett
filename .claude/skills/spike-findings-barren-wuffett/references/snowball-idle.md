# Barren's Snowball: the compounding idle life (second release)

Barren's life from age 6 to 90 in about 5 minutes. The player taps to hustle, buys businesses that pay every year, and reinvests. Mr. Market interrupts with a seeded schedule of offers, and old Barren narrates his own life in a speech bubble. Patience wins, and nothing tells the player so.

## Requirements

From idea `replayable-barren-pivot`:

- Fun first; growing the X following counts as a win.
- Credit, not funnel: "made by @Wolfhartvest" on title + end, the handle in the share text, website only in About.
- No email, no backend, no eToro / wikifolio / portfolio links in the game. Barren never endorses anything.
- The iconic OLD Barren (he is the narrator here) + Charlie + Mr. Market. Parody names only.
- Mobile portrait first, static hosting (€0).
- One hub site. **The idle game is the second release.** The adventure stays.

## How to Build It

### Stack: DOM + vanilla JS, not Phaser

The screen is mostly numbers and text with native buttons and scroll, which is the standard for incrementals (Cookie Clicker, Universal Paperclips). This deliberately departs from the Phaser convention. Pixel art enters as `<img src=dataURL(sprite, 4)>` with `image-rendering: pixelated`.

Layout: a **sticky header** holds the narrator bubble (Barren's face + text), AGE, NET WORTH, cash, income/yr, a life bar, a snowball sized by log net worth, and a log-scale net-worth line on a `<canvas>` ($1 / $1M / $1T gridlines). Below it is a scrolling list of business cards. A **fixed bottom dock** holds the hustle button, padded by `env(safe-area-inset-bottom)`. Its verb grows up with Barren: SELL GUM → DELIVER PAPERS → PLOW A FIELD → SHOVEL COAL → READ REPORTS.

### The pure economy (`econ.js`, also run by Node)

```js
export const YEAR_SECONDS = 3.5;           // 84 years ≈ 4.9 min
export const START_AGE = 6, END_AGE = 90, EARNINGS_MULTIPLE = 8;
export const milestoneMult = (n) => (n >= 25 ? 3 : n >= 10 ? 2 : 1);
export const floatMult = (s) => 1 + 0.6 * (1 - Math.pow(1 - 0.04, s.owned.insure));   // diminishing, caps at +60 %
export const unitIncome  = (s, b) => b.income * milestoneMult(s.owned[b.id]) * floatMult(s);
export const price       = (s, b) => Math.ceil(b.cost * Math.pow(b.growth, s.owned[b.id]) * (onSale(s) ? 0.6 : 1));
export const netWorth    = (s) => s.cash + Σ owned × unitIncome × 8;
export const tapValue    = (s) => Math.max(1, 1 + 0.004 * incomePerYear(s));            // taps matter early, fade later
// a tier is visible once you own the previous one, or have EARNED 40 % of its cost
```

Ten businesses, all with `growth: 1.13` per unit owned:

| Business | Cost | Income/yr | Joke |
|---|---|---|---|
| Gum Stand | 4 | 3.2 | A nickel profit a pack. |
| Cherry Fizz 6-Packs | 30 | 20 | Buy six for a quarter, sell for a nickel each. |
| Paper Route | 220 | 120 | 500 papers before school. |
| Pinball Machines | 1,600 | 780 | Every barbershop needs one. |
| Farmland | 12,000 | 5,200 | Dirt is a durable asset. |
| Insurance Co. (float) | 95,000 | 34,000 | FLOAT: boosts ALL income (up to +60 %). |
| Candy Company | 800,000 | 260,000 | Raise prices every Christmas. |
| Railroad | 7M | 1.9M | Nobody builds a second one. |
| Power Company | 60M | 13M | People pay the light bill first. |
| Pear Phones | 500M | 90M | Late to tech. Right on time. |

Ranks by net worth at 90: ≥$100B RICHER THAN MR. MARKET · ≥$10B THE ORACLE OF OHAMA · ≥$100M CAPITAL ALLOCATOR · ≥$1M LOCAL TYCOON · else PAPER ROUTE PRO. Milestones at $1,000 / $1M / $1B / $100B each trigger a narrator line.

### The seeded "Daily Life" (same offers for everyone)

```js
const rnd = mulberry32(hashStr(`barren-life:${dateStr}`));
const slots = [16, 26, 36, 46, 56, 66, 78].map(a => +(a + rnd() * 3).toFixed(1));
const rest = ['crash', 'crash', 'bubble', 'bubble', 'tip', 'textile'];   // shuffled; a bubble never comes first
const types = ['crash', ...rest];                                       // every life OPENS with a crash
```

| Offer | Who | Choice | Effect |
|---|---|---|---|
| Crash sale | Mr. Market (panic) | GO SHOPPING | everything **40 % off for 3 years**, which rewards saved cash |
| Euphoric buyout | Mr. Market (greed) | SELL ONE (+5× value) / HOLD FOREVER | a real decision that depends on years left |
| Hot tip | Crypto Bro | APE IN (25 % of cash) / NO THANKS | 75 % rug pull, 25 % triples |
| "Bargain" mill | Mr. Market | BUY (15 % of cash) / PASS | drags income by 4 % for **20 years** ("a cheap bad business is still a bad business") |

**The clock pauses while an offer is open.** Each offer is a modal with the offerer's portrait at 4×.

### Loop

Use a fixed 0.1 s step: `acc += dt * SPEED; while (acc >= 0.1 && !paused) { tick(s, 0.1 / YEAR_SECONDS); … }`. Fire the next offer when `age >= event.age`, and finish at 90. Throttle the render to 10 Hz except right after a tap or buy. After age 20, a narrator nudge fires when cash exceeds 6× yearly income and nothing was bought for 10+ years: *"money should work when the price is right."*

### End and share

End screen: rank, net worth, *"Every dollar you had at age 10 became $X"*, the first million/billion ages, and the offer decisions. Share text:

```
Barren's Snowball ⛄ · Daily Life #6
Gum stand → $79.7B by age 90 · THE ORACLE OF OHAMA
💵 $1M at 28 · 🏦 $1B at 55
bought 3 of 3 crashes · refused 3 buyouts · no Fizzcoin
made by @Wolfhartvest
```

## What to Avoid

- **Balancing against a greedy spend-everything optimiser alone.** It never saves for the next tier, so a "lazy" bot that shops every 5 s beat it by orders of magnitude ($7.4T vs $266B). Calibrate against a **saver** policy (every 2 s, buy the most expensive affordable), because every human saves by accident.
- **Linear insurance float** (+4 % each). Mass-buying insurers gave ×6.6 income. Use diminishing returns that cap at +60 %.
- **Purely random offers.** One seeded life rolled 6 crashes + 2 buyouts and **no tip or mill** (the funniest content). Deal the same set of offers every day and seed only the order.
- **Counting sale purchases** ("197 crash buys"). It means nothing to a reader. Count crashes bought into ("3 of 3").
- **Re-running `finish()`.** After 90, anything that un-paused the clock re-ran it. A finished life must never tick again (`if (!paused && s && !result)`).
- Long crash banners overflow a 412 px phone, so keep banner copy short.
- **A latent bug to fix when porting:** `openEvent` falls through to the textile-mill branch when a `bubble` (buyout) offer fires before the player owns any business (`ev.type === 'bubble' && best` is false). Normal play never hits it, because a buyout never comes before age 36. Give the buyout its own "nothing to buy out" path instead.

## Constraints

- Sim results (pass 3, calibrated to humans): spend-everything-instantly → $45M LOCAL TYCOON · casual → $129B · saver → $80B ORACLE. Autopilot browser lives: $79.7-83.2B, ORACLE, first million at 28-30. A new tier unlocks every ~15-30 s; $1M at ≈ age 30, $1B at ≈ 52-58.
- The money formatter switches to K only from $10,000 (`$9,999` stays exact) so early numbers stay legible.
- **Open feel questions:** is 5 min the right life (idle fans may want longer + a prestige "pass the snowball on"); is the business list too long by age 70; does the narrator carry enough humour?

## Origin

Synthesized from spike: 003b.
Source files available in: `sources/003b-snowball-idle/` (`econ.js`, `idle.js`, `icons.js`, `index.html`, `_sim.mjs`, `_verify.cjs`).
