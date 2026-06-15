---
phase: 03-level-1-the-newspaper-verb-economy
fix_scope: critical_warning
findings_in_scope: 11
fixed: 4
skipped: 7
iteration: 1
status: partial
generated: 2026-06-15
---

# Phase 3 — Code Review Fix Report

> The gsd-code-fixer applied the three BLOCKER fixes (plus WR-05) in an isolated worktree and committed them, then hit a transient API socket error before reaching the remaining warnings or writing this report. The orchestrator fast-forward-merged the completed fix commits (validated: `tsc` clean, 121/121 tests green) and authored this report. The 7 remaining warnings were not reached and can be addressed with a follow-up `/gsd-code-review 03 --fix`.

## Fixed (4)

| ID | Severity | Fix | Commit |
|----|----------|-----|--------|
| **CR-01** | BLOCKER | `async init()` save-load race — Phaser does not await `init()`, so `create()` could read `_savedState` while undefined and revert returning players to a fresh game. Fixed by serializing world-build against the resolved load: `create()` kicks off `SaveService.load()`, builds the world only in the resolved callback, sets `_ready=true`, and `update()` short-circuits `if (!this._ready) return` until then. Preserves the existing version-check/migrate path. | `8b9b8b3` |
| **CR-02** | BLOCKER | Hospital fee floor/copy inverted for the 1–4 coin case + fee captured ~960ms before apply. Fixed by snapshotting `fee` and `helmetOwned` together at bite time and threading both through `completeHospital(fee, helmetOwned)`; partial-broke copy branch corrected. `computeHospitalFee` unit tests stay green (never negative; 0 with helmet). | `5d3c6a1` |
| **CR-03** | BLOCKER | `awardPatienceBonus()` was unreachable dead code — the GAME-06 patience-gap reward (decision D-09) never paid out. Wired into `update()`'s dog-gap path, guarded by `dogGapActive && !flags['patience_used']` (one-shot, can't drain into a coin geyser). | `2dd09a6` |
| **WR-05** | WARNING | `helmetOwned`/fee snapshot could desync from live flags during the i-frame window. Captured once at bite time alongside the fee (same fix as CR-02). | `5d3c6a1` |

## Remaining — not reached (7 warnings)

The fixer crashed before addressing these. None block the phase goal; recommend a follow-up `/gsd-code-review 03 --fix`.

| ID | Severity | Summary |
|----|----------|---------|
| WR-01 | WARNING | `bushStreak` lost on reload mid-streak while the coins it would have paid are not — streak is transient by design (D-07); confirm acceptable or persist. |
| WR-02 | WARNING | Bushes never regrow — `BushEntity.reset()` is never invoked, so the D-03 soft-farm-on-re-entry is non-functional. |
| WR-03 | WARNING | WhackSystem size-reset timer can shrink an in-progress enlarged hitbox (Sunday Edition) mid-swing. |
| WR-04 | WARNING | Snack purchase burns coins for zero effect (no energy/health system exists yet) — give it an effect or mark explicitly cosmetic. |
| WR-06 | WARNING | `onShopOpen` post-purchase re-emit relies solely on the UIScene re-entry guard with no OverworldScene-side guard. |
| WR-07 | WARNING | `enterBoss` re-emits the same `BOSS_DEFEATED` it is handling — double-handling risk (pre-existing Phase 2). |
| WR-08 | WARNING | `SaveService.migrate()` fills missing keys but does not coerce field *types* (a string `coins` would pass through). |

## Out of scope (6 info)

INFO-severity findings are not in the `critical_warning` fix scope. See `03-REVIEW.md` for details.

## Validation after merge

- `npm run check` (tsc --noEmit): clean
- `npm test` (vitest): 121/121 passing
