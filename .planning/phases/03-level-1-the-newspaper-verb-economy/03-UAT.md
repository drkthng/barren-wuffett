---
status: testing
phase: 03-level-1-the-newspaper-verb-economy
source: [03-VERIFICATION.md]
started: 2026-06-15T21:05:00Z
updated: 2026-06-15T21:05:00Z
---

## Current Test

number: 1
name: SC-1 — Newspaper verb feel on touch + keyboard
expected: |
  Press the newspaper button (touch) / J / Space: newspaper swing animation plays, bush bursts with leaves + whack/ding SFX. Reads crisply on a phone in portrait.
awaiting: user response

## Tests

### 1. SC-1 — Newspaper verb feel on touch + keyboard
expected: Press newspaper button (touch) / J / Space — swing animation plays, bush bursts with leaves + whack/ding SFX, crisp on a phone in portrait.
result: [pending]

### 2. SC-2 — First bush always drops a coin on a fresh save
expected: Clear IndexedDB, start the game, whack the first bush — gold coin counter increments with a +1 float. Subsequent bushes follow the deterministic 8-slot sequence (no long droughts).
result: [pending]

### 3. SC-2 — 8-bush streak fills HUD pips and pays out bonus
expected: Whack 8 bushes without a dog hit — the 8 streak pips fill progressively; on the 8th a STREAK BONUS toast appears and 8 coins are added (or a Journal page at a milestone bush).
result: [pending]

### 4. SC-3 — Dog contact: knockback + HOSPITAL splash + non-lethal respawn
expected: Walk into the dog — player knocked back ~48px, flashes (i-frames ~960ms), "WAKE UP IN HOSPITAL" splash scales in (cozy; no skull/red flash), tap or wait ~1.5s to dismiss, respawn at (96,96) with a small fee deducted and streak reset. Never a death screen.
result: [pending]

### 5. SC-3 — Patience-gap reward still fires (GAME-06 preserved)
expected: Let the dog reach the far end (gap opens), slip through the east corridor — a 5-coin PATIENCE BONUS fires exactly once (not repeatedly).
result: [pending]

### 6. SC-4 — Store Clerk opens shop; purchases deduct coins and are felt
expected: Talk to the Store Clerk → shop opens with 4 rows (Sunday Edition, Bike Helmet, Bus Pass, Snack). Buying Sunday Edition enlarges the whack on the next swing. Buying Bike Helmet makes the next hospital visit show "HELMET BLOCKED THE FEE!". Owned items show OWNED; unaffordable items show a red price and reject with "NOT ENOUGH COINS". ESC / CLOSE returns to game.
result: [pending]

### 7. SC-5 — Traversal gate opens; reward area reachable; full loop offline
expected: Buy Bus Pass → gate barrier disappears and sign hides → walk east (past x=340, y<200) → 15-coin stash + Journal page awarded once. Then go offline (DevTools Network→Offline) and refresh — coins, upgrades (newspaper/helmet/traversal), and gate-open state all persist.
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps
