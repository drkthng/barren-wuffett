---
status: superseded
phase: 03-level-1-the-newspaper-verb-economy
source: [03-VERIFICATION.md]
started: 2026-06-15T21:05:00Z
updated: 2026-08-04T00:00:00Z
superseded_by: .planning/research/level-1-feel-audit.md → Phase 3.1
---

## Current Test

(none — UAT superseded 2026-08-04 by the feel audit; user played the build and was unimpressed. An automated Playwright playthrough + code audit substantiated the failures below. Phase 3.1 repairs them; re-run human UAT after 3.1.)

## Tests

### 1. SC-1 — Newspaper verb feel on touch + keyboard
expected: Press newspaper button (touch) / J / Space — swing animation plays, bush bursts with leaves + whack/ding SFX, crisp on a phone in portrait.
result: FAIL (audit 2026-08-04) — bushes render as 1×1 green pixels (`bush.png` is a single pixel; `BushEntity` sets no display size); the swing "animation" is a flat mustard rectangle (all 3 frames identical); all SFX files are 44-byte stubs that fail decode — the verb is invisible and silent. Touch whack button is a 1×1 stretched smear; no whack button exists on desktop.

### 2. SC-2 — First bush always drops a coin on a fresh save
expected: Clear IndexedDB, start the game, whack the first bush — gold coin counter increments with a +1 float. Subsequent bushes follow the deterministic 8-slot sequence (no long droughts).
result: ISSUE (audit) — logic verified in unit tests, but one whack fires the overlap callback ~5× (award runs before the bush body disables; hitbox live 150ms) so a single whack rolls the pack ~5 times — sequence and tuning are experienced ~5× accelerated. Also no bushes sit near the spawn, so the guaranteed first-whack coin is not discoverable where the player starts.

### 3. SC-2 — 8-bush streak fills HUD pips and pays out bonus
expected: Whack 8 bushes without a dog hit — the 8 streak pips fill progressively; on the 8th a STREAK BONUS toast appears and 8 coins are added (or a Journal page at a milestone bush).
result: ISSUE (audit) — multi-award bug advances streak ~5 pips per whack; bonus can fire after ~2 bushes. Milestone bush_14 is embedded inside a house's collision tiles and can never be whacked (8 of 14 bushes sit in collidable deco).

### 4. SC-3 — Dog contact: knockback + HOSPITAL splash + non-lethal respawn
expected: Walk into the dog — knockback, i-frames, "WAKE UP IN HOSPITAL" splash, respawn at (96,96) with small fee, streak reset. Never a death screen.
result: PARTIAL PASS (audit) — mechanics fire as designed; but bite SFX is silent, respawn is an instant cross-map teleport with no fade, and the dog's patrol tween drifts out of sync with its "gap window" timer.

### 5. SC-3 — Patience-gap reward still fires (GAME-06 preserved)
expected: Let the dog reach the far end (gap opens), slip through the east corridor — a 5-coin PATIENCE BONUS fires exactly once.
result: NOT RETESTED (audit) — one-shot guard verified in code (`patience_used` flag); experiential pass deferred to post-3.1 UAT.

### 6. SC-4 — Store Clerk opens shop; purchases deduct coins and are felt
expected: Shop opens with 4 rows; Sunday Edition enlarges the whack; Helmet waives the fee; OWNED/affordability states work.
result: ISSUE (audit) — shop UI works, but the 20-coin newspaper upgrade is mostly a no-op (the GameObject is resized, its StaticBody never is — only +8px reach applies), and shop rows have 1×1-pixel item icons. Purchase SFX silent.

### 7. SC-5 — Traversal gate opens; reward area reachable; full loop offline
expected: Buy Bus Pass → gate disappears → east reward area; offline refresh persists everything.
result: ISSUE (audit) — the gate barrier (x 248–392) does not span the open grass rows (x 320–480): the "locked" area is walkable around the barrier without buying anything. Persistence logic itself is sound (unit-tested).

## Summary

total: 7
passed: 0
issues: 5
pending: 0
skipped: 2 (deferred to post-3.1 re-run)
blocked: 0

## Gaps

- Camera: the entire world renders on one static screen (world 480×832 ≈ canvas 480×854) — not covered by any SC but the single biggest reason the game doesn't feel like the intended Zelda-light adventure. → FEEL-01 (Phase 3.1)
- Both set-piece triggers are invisible walk-over rectangles that hijack the player mid-stroll. → FEEL-06 (Phase 3.1)
- Full findings: `.planning/research/level-1-feel-audit.md`
