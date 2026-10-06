---
spike: 003c
idea: replayable-barren-pivot
name: swipe-satire
type: comparison
validates: "Given a phone, when you swipe yes/no through career cards as Barren, then the jokes land, a run lasts 2-4 min, the meters create real dilemmas, and endings feel collectible and shareable"
verdict: PENDING
related: [002, 003a, 003b]
tags: [swipe, reigns-like, dom, satire, writing, endings, share, mobile]
---

# Spike 003c: Barren, CEO (Reigns-style swipe satire)

## What This Validates

**Given** a phone in portrait,
**when** the player runs Ohama Holdings as Barren from age 30 to 96 by swiping left/right on whoever is asking (Charlie, Mr. Market in three moods, the crypto bro, the banker, the reporter),
**then** (a) the jokes carry it, (b) a run lasts ~2–4 minutes, (c) four meters — cash, shareholders, patience, Cherry Fizz — create real dilemmas (both 0 and 100 end you), and (d) nine collectible endings give a reason to replay and something to share.

(a) needs a human; (b)–(d) are verified below.

## Research

| Approach | Tool | Pros | Cons | Status |
|---|---|---|---|---|
| **Pointer Events + CSS transforms** | DOM | native 60 fps drag, tiny, keyboard + buttons for accessibility | hand-rolled | **CHOSEN** |
| Gesture libraries | Hammer.js / interact.js | polish | weight, nothing needed | rejected |
| Phaser | canvas | consistent with 003a | overkill for one card + text | rejected |
| **Deck as data + Node balance simulator** (`cards.js` + `_sim.mjs`) | — | tune run length and ending spread before playing | — | **CHOSEN** |

Reigns conventions kept: meters start at 50; every choice moves some of them; *both* extremes kill; while dragging, dots show **which** meters a choice touches (big dot = big swing) but never the direction.

**Design:** 33 cards (30 regular + 3 follow-ups: Fizzcoin "buy the dip?", the banker's MARGIN CALL, the textile mill losing money "twenty years in a row"). Each card = 2 years. Aging pressure: every card, patience +1 and Cherry Fizz −2. Nine endings: BROKE, CASH MOUNTAIN ("your cash pile got its own zip code"), OUSTED, THE CULT, DAY TRADER, TOO PATIENT ("the bat fell asleep"), BURNOUT, SUGAR RUSH, and CHAIRMAN EMERITUS at 96. Endings collect across careers (localStorage, best-effort). First career of the day uses the same deck order for everyone.

## How to Run

```bash
npx vite .planning/spikes --port 5180 --strictPort --host
# phone: http://<PC-LAN-IP>:5180/003c-swipe-satire/
node .planning/spikes/003c-swipe-satire/_sim.mjs       # 2,000 careers × 4 policies
node .planning/spikes/003c-swipe-satire/_verify.cjs    # drag reveal + careers + screenshots
```

## What to Expect

Title "BARREN, CEO" → TAKE THE JOB. Four pixel meters that fill like liquid; the asker's name and question; a big coloured card with their portrait. Drag it: it tilts, the choice label appears on the card, dots appear under affected meters; release past ~90 px to commit (or tap the labelled buttons / arrow keys). The age counter ticks two years per card. An ending shows Barren's reaction, a one-line punchline, years survived, and the 3×3 endings grid with "???" for undiscovered ones.

## Observability

- `window.__SWIPE__` — live `run` (meters, age, queue), current `card`, `result`, `LOG`, `decide(side)`, `start()`.
- Forensic `LOG`: `career-start`, every `choice` (card, side, age, meters after), `end`, `share` — **export log** on the end screen.

## Investigation Trail

1. **Sim pass 1:** random swipers lasted 15 cards but went **BROKE 66%** of the time (most "yes" options spent cash); a thoughtful player (keep every meter near 50) reached 96 **96%** of the time — **solved, no replay value**.
2. **Fix:** aging pressure each card, swings ×1.3, three new cards where "yes" *earns* cash (a TV deal, selling the brick company at a crazy price, raising candy prices again).
3. **Sim pass 2:** random 9.7 cards, thoughtful 24.8 cards / Emeritus 30%, but **TOO PATIENT 58%** for thoughtful players (patience drift +2 was too strong).
4. **Browser pass:** a thoughtful career *reached 96* but its last swipe maxed patience → shown "TOO PATIENT" — losing on the finish line. Now reaching 96 always wins. Patience drift +2 → +1.
5. **Sim pass 3:** random **10.5 cards (~age 51)**, six different endings (BROKE 47% — say yes to every pitch and you go broke); thoughtful **27.7 cards, Emeritus 48%**; one-note always-left / always-right die by 45. Rare endings (SUGAR RUSH, DAY TRADER) need deliberate play — collector bait.
6. **Meter readability:** the cash bill and shareholder heads only used the middle of their 16-px icons, so 29% cash looked empty → redrawn as a money bag and taller busts that fill the icon.

## Results

**PENDING — technically validated; humour/feel decided at the phone checkpoint.**

Verified: drag reveal (hint dots appear exactly under the touched meters) and swipe commit (PASS); careers end in varied, sensible endings; Chairman Emeritus reachable (~half of thoughtful runs); endings persist across careers; no console errors; readable on a 412-px phone.

Sample share text (thoughtful career, Daily Deck #6):

```
Barren, CEO 🗂️ · Daily Deck #6
Made it to 96 — CHAIRMAN EMERITUS 🏆
Ending: CHAIRMAN EMERITUS · 1/9 endings found
made by @yourhandle
```

Open questions: is it funny to people who don't follow finance; are 33 cards enough before repeats feel stale (Reigns ships hundreds — this format is a writing treadmill, which suits a creator who writes); does the share line need a hook beyond the ending name.

Evidence: `_shot_1_title.png`, `_shot_2_card.png`, `_shot_3_drag_left.png`, `_shot_4_end.png`, `_shot_5_end_collection.png`.
