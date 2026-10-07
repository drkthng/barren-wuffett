---
spike: 003b
idea: replayable-barren-pivot
name: snowball-idle
type: comparison
validates: "Given a phone, when you reinvest from a gum stand toward an empire while Mr. Market makes irrational offers, then the first 3 minutes feel rewarding, compounding is felt, and a finished life gives a shareable result"
verdict: VALIDATED
related: [002, 003a, 003c]
tags: [idle, incremental, dom, compounding, daily-seed, share, narration, mobile]
---

# Spike 003b: Barren's Snowball (compounding idle game)

## What This Validates

**Given** a phone in portrait,
**when** the player lives Barren's life from age 6 to 90 in ~5 minutes — tap to hustle, buy businesses that pay every year, reinvest — while Mr. Market interrupts with offers,
**then** (a) the first minutes feel rewarding (a new business every 15–30 s), (b) compounding is *felt* (net worth line on a log chart, milestones, "every dollar at 10 became $X"), (c) patience is the winning strategy without being told, and (d) a finished life produces a share line with the creator's handle.

(a) needs the user's thumb; (b)–(d) are verified below.

## Research

| Approach | Tool | Pros | Cons | Status |
|---|---|---|---|---|
| **DOM/CSS + vanilla JS** | — | crisp text, native buttons/scroll; the standard for incrementals (Cookie Clicker, Universal Paperclips) | less "game juice" than a canvas | **CHOSEN** — deviation from the Phaser convention, justified: this format is text/number-heavy |
| Phaser canvas | — | consistent with 003a | text-heavy UI is painful in canvas | rejected |
| **Pure economy module + Node life simulator** (`econ.js` + `_sim.mjs`) | — | balance by numbers before a human plays | — | **CHOSEN** |

Genre patterns used (no libraries): per-unit price growth (1.13×), milestone multipliers (×2 at 10 owned, ×3 at 25), taps that matter early and fade, net worth = cash + businesses at 8× earnings, insurance "float" as a global multiplier.

**Design:** old Barren narrates his own life in a speech bubble (honours the "iconic old Barren" requirement in a format that spans a lifetime). Ten businesses from Gum Stand → Pear Phones, each with a one-line joke. Mr. Market's offers follow a seeded "Daily Life" (same for everyone per date): 3 **crash sales** (everything 40% off for 3 years — rewards saved cash), 2 **euphoric buyouts** (sell one business for 5× its value, or HOLD FOREVER — a real decision that depends on years left), 1 **crypto-bro tip** (Fizzcoin: 75% rug pull), 1 **"bargain" textile mill** (a cheap bad business that drags income for 20 years). The clock pauses while an offer is open. Ends at 90: "CHAIRMAN EMERITUS".

## How to Run

```bash
npx vite .planning/spikes --port 5180 --strictPort --host
# phone: http://<PC-LAN-IP>:5180/003b-snowball-idle/
node .planning/spikes/003b-snowball-idle/_sim.mjs       # balance: whole lives under 4 policies
node .planning/spikes/003b-snowball-idle/_verify.cjs    # determinism + autopilot life + screenshots
```

Test hooks: `?date=`, `?speed=6`, `?bot=saver`.

## What to Expect

Title → "START AT AGE 6". A sticky header: Barren's bubble, AGE, NET WORTH, cash, income/yr, a life bar, a snowball + a log-scale net-worth line. Business cards with pixel icons, owned count, income each, next milestone, BUY price (strikethrough + red banner during a crash sale), a "???" teaser for the next locked tier. A big green hustle button whose verb grows up with you (SELL GUM → PLOW A FIELD → SHOVEL COAL → READ REPORTS). Offer modals with the offering character's portrait. End: rank (PAPER ROUTE PRO → LOCAL TYCOON → CAPITAL ALLOCATOR → THE ORACLE OF OHAMA → RICHER THAN MR. MARKET), "every dollar you had at age 10 became $X", SHARE / LIVE AGAIN.

## Observability

- `window.__IDLE__` — seeded `life` (events + fingerprint), live `state`, `result`, `LOG`, `shareText()`, `start()`, `debugEvent(type)`.
- Forensic `LOG`: `life-start`, `buy` (id, price, owned, age), `milestone`, `event` (type, choice, age), `share`, `end` — **export log** on the end screen.

## Investigation Trail

1. **Sim pass 1:** a greedy player reached only **$1.1M at 90** (5 of 10 tiers; first million at 82) — far too slow.
2. **Sim pass 2** (higher yields, 1.12 growth, ×8-at-50 milestones): greedy $256B, but a **"lazy" player who only shops every 5 s beat the optimiser** ($7.4T vs $266B).
3. Suspected linear insurance **float** (+4% each → mass-buy insurers = ×6.6 income). Capped with diminishing returns → lazy *still* won ($1.8T vs $3.8B). **Real cause:** the myopic optimiser spends every cent on cheap low-tier units and never saves for the next tier; anyone who checks the shop every few seconds saves by accident (that's every human).
4. **Sim pass 3** (calibrated to humans; added a "saver" policy: every 2 s buy the most expensive affordable): spend-everything-instantly → **$45M LOCAL TYCOON**; casual → $129B; saver → **$80B ORACLE**. Emergent lesson: patience — saving for the wonderful business — beats buying everything cheap. A new tier every ~15–30 s; $1M ≈ age 30, $1B ≈ age 52–58.
5. **Browser pass:** one date's seeded life rolled 6 crashes + 2 buyouts and **no crypto tip or textile mill** (the funniest content) → every life now gets the full cast (3 crashes, 2 buyouts, tip, mill) in seeded order, always opening with a crash. "197 crash buys" was a meaningless share stat → "bought 3 of 3 crashes". Crash banner overflowed → shortened.
6. **Edge case found by the harness:** after age 90, anything that un-paused the clock re-ran `finish()` (unreachable in normal play) → a finished life now never ticks again.

## Results

**VALIDATED — phone checkpoint passed (2026-10-06, Android Chrome).** The user played all four directions and loves every one. Plan: ONE Barren Wuffett mini-game hub site, with releases staggered as A → B → C and the adventure (D) kept.

**Role: the second release** in the hub, once polished.

Verified: seeded daily life deterministic (PASS ×2); autopilot life completes ($79.7–83.2B, ORACLE, first million at 28–30); patience-vs-spending emerges from the economy; no console errors; readable on a 412-px phone.

Sample share text (autopilot, Daily Life #6):

```
Barren's Snowball ⛄ · Daily Life #6
Gum stand → $79.7B by age 90 · THE ORACLE OF OHAMA
💵 $1M at 28 · 🏦 $1B at 55
bought 3 of 3 crashes · refused 3 buyouts · no Fizzcoin
made by @yourhandle
```

(Captured before the real handle existed. `HANDLE` is now `@Wolfhartvest`.)

Open questions: is 5 minutes the right life length (idle fans may want longer + prestige "pass the snowball on"); is the business list too long by age 70; does the narrator carry enough humour.

Evidence: `_shot_1_title.png`, `_shot_2_early.png`, `_shot_3_event_tip.png`, `_shot_3_event_bubble.png`, `_shot_4_mid.png`, `_shot_5_late.png`, `_shot_6_end.png`.
