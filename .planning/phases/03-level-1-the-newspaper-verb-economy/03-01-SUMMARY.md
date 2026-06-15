---
phase: 03-level-1-the-newspaper-verb-economy
plan: "01"
subsystem: economy-seams
tags: [pure-ts, unit-tests, wave-0, prize-pack, economy, whack-offsets, input-bus]
dependency_graph:
  requires: []
  provides:
    - src/systems/PrizePack.ts (rollPrizePack, firstWhackOrRoll, PrizePackState, DropResult, PACK_SLOTS, DROP_CHANCE)
    - src/systems/Economy.ts (computeHospitalFee, applyPurchase, applyKnockbackAngle)
    - src/systems/WhackOffsets.ts (whackHitboxOffset, WHACK_OFFSETS, WHACK_REACH)
    - src/input/InputBus.ts Action.WHACK
  affects:
    - All downstream Phase 3 plans that import PrizePack, Economy, or WhackOffsets
tech_stack:
  added: []
  patterns:
    - Pure-TS seam modules (no Phaser import, vitest node-env importable) following TriggerSystem.ts model
    - Injectable rng parameter pattern for deterministic testing
    - vi.resetModules() + dynamic import with .js extension for pure-TS test isolation
key_files:
  created:
    - src/systems/PrizePack.ts
    - src/systems/Economy.ts
    - src/systems/WhackOffsets.ts
    - tests/prize-pack.test.ts
    - tests/whack.test.ts
    - tests/dog-hazard.test.ts
    - tests/shop-economy.test.ts
    - tests/coins-hud.test.ts
  modified:
    - src/input/InputBus.ts (Action.WHACK added)
    - tests/input-bus.test.ts (WHACK pulse block added)
    - tests/save-service.test.ts (Phase 3 upgrade flags block added)
decisions:
  - "PrizePack firstWhackOrRoll does NOT advance the slot on the first-whack override — the slot sequence starts fresh from slot 0 when the player's first whack is done (D-06)"
  - "Economy.applyPurchase returns a new flags object (immutable — no mutation of input) so OverworldScene can compare old vs new flags easily"
  - "coins-hud.test.ts tests pure arithmetic inline (no module import) because OverworldScene will compute this inline before emitting — avoids creating a module for two-line math"
metrics:
  duration: "4 minutes"
  completed_date: "2026-06-15T19:29:47Z"
  tasks_completed: 2
  files_created: 9
  files_modified: 3
---

# Phase 03 Plan 01: Wave 0 — Pure-TS Economy Seams + Tests Summary

**One-liner:** ALttP deterministic prize-pack, hospital/shop economy math, and directional-hitbox seams as pure TypeScript modules with 121-test green suite.

## What Was Built

Wave 0 of Phase 3: the three pure-TypeScript economy/verb seam modules and the seven test files (5 new + 2 extensions) that pin every Nyquist-critical behavior before any Phaser wiring exists.

### Modules Created

**`src/systems/PrizePack.ts`** — D-05/D-06:
- `rollPrizePack(state, rng)` — reads `PACK_SLOTS[slotIndex % 8]`, advances slot UNCONDITIONALLY (even on no-drop), returns `null` when `rng() > DROP_CHANCE` (0.55)
- `firstWhackOrRoll(flags, state, rng)` — D-06 first-whack guarantee: returns `{coins:1,item:null}` without advancing slot when `first_whack_done` absent; delegates to `rollPrizePack` (coalescing null to `{coins:0,item:null}`) when done
- `PACK_SLOTS` — verbatim ALttP 8-slot table: `[1,0,1,3,1,snack,1,5]` coins (sum=12)
- `DROP_CHANCE = 0.55`

**`src/systems/Economy.ts`** — D-10/D-11/D-12/D-13/D-15:
- `computeHospitalFee(coins, flags)` — 0 when `upgrade_helmet`; else `Math.max(0, Math.min(5, coins))`
- `applyPurchase(coins, flags, itemId, price)` — null on insufficient funds or already-owned; snack never sets a flag; returns new flags object (immutable)
- `applyKnockbackAngle(playerX, playerY, fromX, fromY)` — `Math.atan2(playerY - fromY, playerX - fromX)`

**`src/systems/WhackOffsets.ts`** — D-02:
- `WHACK_REACH = 24`
- `WHACK_OFFSETS` — `{down:{dx:0,dy:24}, up:{dx:0,dy:-24}, left:{dx:-24,dy:0}, right:{dx:24,dy:0}}`
- `whackHitboxOffset(facing)` — returns offset or falls back to `down`

**`src/input/InputBus.ts`** — D-01: `Action.WHACK = 'WHACK'` added (pulse action, `update()` unchanged)

### Tests Created/Extended

| File | Tests | Coverage |
|------|-------|----------|
| `tests/prize-pack.test.ts` | 10 | slot 0 result, 8-slot sweep, coin sum=12, no-drop advances slot, threshold (0.54/0.56), firstWhackOrRoll D-06 |
| `tests/whack.test.ts` | 7 | 4 facings (down/up/left/right), unknown→down fallback, WHACK_REACH=24, ±WHACK_REACH per entry |
| `tests/dog-hazard.test.ts` | 7 | fee cap/floor/broke/helmet, knockback angle left/right/up |
| `tests/shop-economy.test.ts` | 6 | insufficient, success+flag, already-owned, snack no-flag, snack re-buy, immutable newFlags |
| `tests/coins-hud.test.ts` | 7 | snowball accumulation, 8-slot sum=12, fee floor, delta math |
| `tests/input-bus.test.ts` | +2 | WHACK pulse setAction(true/false) |
| `tests/save-service.test.ts` | +2 | upgrade flags round-trip, snack key absent |

**Total suite: 121 tests, 15 files, all green. Runtime ~11s.**

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

### Files exist:

- `src/systems/PrizePack.ts` — FOUND
- `src/systems/Economy.ts` — FOUND
- `src/systems/WhackOffsets.ts` — FOUND
- `tests/prize-pack.test.ts` — FOUND
- `tests/whack.test.ts` — FOUND
- `tests/dog-hazard.test.ts` — FOUND
- `tests/shop-economy.test.ts` — FOUND
- `tests/coins-hud.test.ts` — FOUND

### Commits exist:

- `276f33d` feat(03-01): add PrizePack, Economy, WhackOffsets pure-TS seams + Action.WHACK — FOUND
- `08d9ec5` test(03-01): Wave 0 — 5 new test files + extend input-bus and save-service — FOUND

### Static checks:

- No `from 'phaser'` in PrizePack.ts, Economy.ts, WhackOffsets.ts — CONFIRMED
- `Action.WHACK` in InputBus.ts — CONFIRMED
- `npm run check` (tsc --noEmit) — CLEAN
- `npm test` (121/121) — GREEN

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. This plan is pure-TS modules and tests only — no browser, no DOM, no network, no IndexedDB schema change. Threat model fully matched: T-03-01 (flags treated via truthiness, never throws on missing keys), T-03-02 (slotIndex % 8 bounded, no unbounded loop).
