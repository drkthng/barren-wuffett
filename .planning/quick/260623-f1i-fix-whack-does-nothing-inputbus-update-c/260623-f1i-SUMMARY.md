---
phase: quick-260623-f1i
plan: "01"
subsystem: input
tags: [bug-fix, regression-test, inputbus, whack, L1E-01]
dependency_graph:
  requires: []
  provides: [WHACK pulse preserved across InputBus.update()]
  affects: [src/input/InputBus.ts, tests/input-bus.test.ts, OverworldScene WHACK poll]
tech_stack:
  added: []
  patterns: [pulse-action vs continuous-action distinction in InputBus]
key_files:
  modified:
    - src/input/InputBus.ts
    - tests/input-bus.test.ts
decisions:
  - MOVEMENT_ACTIONS constant chosen over a separate pulseActions allow-list so the fix is minimal and the intent is explicit at the clear-loop call site
metrics:
  duration: ~5 min
  completed: "2026-06-23"
status: complete
requirements: [L1E-01]
---

# Quick Task 260623-f1i: Fix WHACK Does Nothing — InputBus.update() Summary

**One-liner:** Replace `activeActions.clear()` with a movement-only loop delete so WHACK/pulse actions set by event handlers survive to the OverworldScene poll.

## Root Cause

`InputBus.update()` opened with `activeActions.clear()`, wiping any action added by event
handlers earlier in the same frame. The WHACK pulse (set by the J-key handler or touch
newspaper-button handler via `setAction(WHACK, true)`) was deleted before
`OverworldScene.update()`'s WHACK poll could read it. Movement worked only because
`update()` rebuilds movement after the clear — a tell-tale signature of the bug. The defect
has existed since WHACK was added (commit 809269f); it was never caught because the on-device
SC-1 human-check was not run in a browser until now.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Make InputBus.update() preserve pulse actions (fix WHACK) | 36c7e9f | src/input/InputBus.ts |
| 2 | Extend input-bus.test.ts with WHACK-survives-update regression | 38ad588 | tests/input-bus.test.ts |

## Changes

### Task 1 — src/input/InputBus.ts

Added `MOVEMENT_ACTIONS` constant (readonly array of the 4 movement Action members) at
module level, directly below the `activeActions` Set. Replaced `activeActions.clear()` at
the top of `update()` with a `for…of` loop that calls `activeActions.delete(mv)` for each
member of `MOVEMENT_ACTIONS`. Added prose comment explaining the pulse-vs-continuous
distinction. Joystick and cursors re-add blocks are unchanged. `isActive` and `setAction`
are unchanged. The module remains pure TS with no Phaser runtime import.

### Task 2 — tests/input-bus.test.ts

Appended a new describe block:
`'InputBus — WHACK pulse survives update() (regression guard, L1E-01)'`

Four new it() cases (beforeEach/afterEach both call `vi.resetModules()` for isolation):

1. **GUARD:** `setAction(WHACK,true)` → `update(all-false, null)` → `isActive(WHACK)` true.
   This is the assertion that immediately fails if `activeActions.clear()` returns.
2. WHACK pulse survives an `update()` that also processes cursor-left movement — proves
   `update()` still does its movement job while preserving the pulse.
3. `update(up:true)` then `update(up:false)` → `isActive(MOVE_UP)` false — proves the fix
   does not over-preserve and movement clearing still works.
4. Consume path: `setAction(WHACK,true)` → `update(all-false)` → `setAction(WHACK,false)`
   → `isActive(WHACK)` false — proves the OverworldScene poll's consume step still works.

No existing describe block was modified or removed. No new test file was created.

## Verification Gate Output

### npm run check (tsc --noEmit)
```
> barren-wuffett@0.1.0 check
> tsc --noEmit
(exit 0 — zero errors)
```

### npm run build (vite prod)
```
> barren-wuffett@0.1.0 build
> vite build --config vite/config.prod.mjs
✓ 51 modules transformed.
✓ built in 16.45s
PWA v1.3.0  precache 9 entries (1421.13 KiB)
```
(Only pre-existing chunk-size warning for phaser bundle — not introduced by this change.)

### npm test (vitest run)
```
Test Files  17 passed (17)
      Tests 142 passed (142)
   Duration 13.58s
```
All 16 input-bus tests green (12 pre-existing + 4 new regression cases).
Full suite 142/142.

## Deviations from Plan

None — plan executed exactly as written.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes.

## Manual Verification Path (not automated)

`npm run dev -- --host`, press J on desktop → player performs the whack effect.
On a touch device the newspaper button triggers the same path (touch-gating intentional per plan notes — button only created when `device.input.touch` is true).

## Self-Check

- [x] `src/input/InputBus.ts` modified — `MOVEMENT_ACTIONS` constant present, `activeActions.clear()` replaced
- [x] `tests/input-bus.test.ts` extended — 4 new cases in new describe block
- [x] Commit 36c7e9f exists (Task 1)
- [x] Commit 38ad588 exists (Task 2)
- [x] All verification gates passed (tsc, vite build, vitest 142/142)

## Self-Check: PASSED
