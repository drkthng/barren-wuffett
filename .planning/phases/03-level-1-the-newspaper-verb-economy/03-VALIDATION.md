---
phase: 3
slug: level-1-the-newspaper-verb-economy
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-15
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `03-RESEARCH.md` → Validation Architecture. Task IDs are filled in by the planner; the test seams and Wave 0 files below are fixed.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.0.0 (environment: `node`) |
| **Config file** | `vitest.config.ts` (exists) |
| **Quick run command** | `npm test` (`vitest run`) |
| **Full suite command** | `npm test` |
| **Type check** | `npm run check` (`tsc --noEmit`) |
| **Estimated runtime** | ~5 seconds (node env, no DOM) |

---

## Sampling Rate

- **After every task commit:** Run `npm test` (full suite is fast)
- **After every plan wave:** `npm test` + manual dev-server smoke of that wave's behavior
- **Before `/gsd-verify-work`:** Full suite green + end-to-end smoke — "whack a bush → coin → HUD increments → save → refresh → coins preserved → buy upgrade → gate opens"
- **Max feedback latency:** ~5 seconds

---

## Deterministic Test Seams (pure TS — no Phaser import)

These are the Nyquist-critical, unit-testable functions. They MUST be importable in the vitest `node` environment without any Phaser Scene context:

1. **`PrizePack.rollPrizePack(state, rng)`** — inject `rng: () => number`; tests slot advancement (0→1→…→7→0), exact coin per slot, and the drop-chance threshold (rng 0.54 → drops; 0.56 → no drop).
2. **`PrizePack.firstWhackOrRoll(flags, state, rng)`** — the D-06 first-whack guarantee as a pure seam: returns `{coins:1,item:null}` (no slot advance) when `first_whack_done` is absent, else delegates to `rollPrizePack` (coalescing a no-drop to a concrete zero result).
3. **`WhackOffsets.whackHitboxOffset(facing)`** — the D-02 directional-hitbox seam: returns the in-front offset for each facing (down +Y, up -Y, left -X, right +X) at `WHACK_REACH` (24), unknown facing → `down`. Pure lookup, no Phaser.
4. **`applyPurchase(coins, flags, itemId, price)` → `{newCoins, newFlags}`** — shop economy math, no Phaser.
5. **`computeHospitalFee(coins, flags)`** — returns 0 if `flags['upgrade_helmet']`, else `min(5, coins)` (floored at 0).
6. **`applyKnockbackAngle(playerX, playerY, fromX, fromY)`** — `Math.atan2` angle computation in isolation.

---

## Per-Requirement Verification Map

| Req | Behavior | Test Type | Command / Proof | Test File |
|-----|----------|-----------|-----------------|-----------|
| L1E-01 | `Action.WHACK` registered; `setAction(WHACK,true)` → `isActive(WHACK)` | unit | `npm test` | extend `tests/input-bus.test.ts` |
| L1E-01 | Hitbox offset correct for all 4 facings (down +Y, up -Y, left -X, right +X) via `whackHitboxOffset` / `WHACK_OFFSETS` | unit | `npm test` | `tests/whack.test.ts` ⬅ Wave 0 (seam: `src/systems/WhackOffsets.ts`) |
| L1E-01 | `newspaper_swing` overlay does not mutate `player_sheet` anims | static | read `Preloader.ts` — no new player_sheet anims | manual |
| L1E-02 | `rollPrizePack` advances slot deterministically; coin sums match slot table | unit | `npm test` | `tests/prize-pack.test.ts` ⬅ Wave 0 |
| L1E-02 | First-whack override: `firstWhackOrRoll` returns a coin when `first_whack_done` absent, regardless of rng, without advancing the slot | unit | `npm test` | `tests/prize-pack.test.ts` ⬅ Wave 0 |
| L1E-02 | `COINS_CHANGED` emitted whenever `OverworldScene.coins` changes; value matches | unit | `npm test` | `tests/coins-hud.test.ts` ⬅ Wave 0 |
| L1E-02 | Streak resets to 0 on dog bite | integration | dev-server smoke | manual |
| L1E-03 | Dog bite does NOT fire while `player.isInvincible` | unit | `npm test` | `tests/dog-hazard.test.ts` ⬅ Wave 0 |
| L1E-03 | Hospital fee floored at 0 (never negative) | unit | `npm test` | `tests/dog-hazard.test.ts` ⬅ Wave 0 |
| L1E-03 | Hospital fee is 0 when `upgrade_helmet` set | unit | `npm test` | `tests/dog-hazard.test.ts` ⬅ Wave 0 |
| L1E-03 | Hospital splash dismiss → `HOSPITAL_DISMISS` → respawn at (96,96) | integration | dev-server smoke (dog bite → splash → dismiss → respawn) | manual |
| L1E-04 | `SHOP_PURCHASE` rejected when `coins < price` | unit | `npm test` | `tests/shop-economy.test.ts` ⬅ Wave 0 |
| L1E-04 | Permanent upgrade flags persist through `save()`/`load()`; snack does NOT persist as owned | unit | `npm test` | extend `tests/save-service.test.ts` |
| L1E-04 | Gate barrier removed when `upgrade_traversal` set | integration | dev-server smoke (buy Bus Pass → gate opens) | manual |
| INFR-04 | Bush/prize-pack/shop content lives in level data, not a scene file | static | grep economy data not in `*Scene.ts` | automated grep |
| INFR-05 | All new player-facing strings via `t()` — no hardcoded UI literals | static | `grep -rn '"HOSPITAL"\|"SHOP"\|"OWNED"' src/` returns none | automated grep |
| SAVE-02 | No new `fetch`/supabase in SaveService | static | existing `tests/save-service.test.ts` SAVE-02 section | existing |

---

## Wave 0 Requirements (write before implementing)

- [ ] `tests/prize-pack.test.ts` — L1E-02: deterministic slots, `firstWhackOrRoll` first-whack guarantee, drop-chance threshold
- [ ] `tests/whack.test.ts` — L1E-01: 4-facing hitbox offset (`whackHitboxOffset` / `WHACK_OFFSETS` / `WHACK_REACH`) against the pure `src/systems/WhackOffsets.ts` seam
- [ ] `tests/dog-hazard.test.ts` — L1E-03: i-frame gate, coin floor, helmet waiver, knockback angle
- [ ] `tests/shop-economy.test.ts` — L1E-04: purchase validation, flag persistence, snack no-persist
- [ ] `tests/coins-hud.test.ts` — L1E-02: `COINS_CHANGED` emitted, value matches `this.coins`
- [ ] Extend `tests/input-bus.test.ts` (WHACK action) and `tests/save-service.test.ts` (upgrade flags)

*The pure-TS seams (PrizePack incl. firstWhackOrRoll, WhackOffsets, economy math, hospital fee, knockback) must be designed importable without Phaser, consistent with the existing `node`-env vitest pattern.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Whack feel (animation, particle, SFX timing) | L1E-01 | Subjective game-feel | Dev server: whack a bush, confirm swing + puff + ding read crisply on touch + keyboard |
| Snowball juice (counter grows, +N float) | L1E-02 | Visual | Whack several bushes, watch the coin counter tween + float |
| Hospital gag + recovery | L1E-03 | Visual/flow | Walk into dog → knockback → "WAKE UP IN HOSPITAL" → dismiss → respawn at (96,96), fee deducted, streak reset; never a death screen |
| Traversal gate opens | L1E-04 | Spatial | Buy Bus Pass → previously-blocked area becomes reachable → reward present |
| Full loop on a phone, offline | SC-5 | Device/offline | Throttle to 4G/offline, complete explore→earn→spend on a touch device |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (5 new test files + 2 extensions)
- [ ] No watch-mode flags (`vitest run`, not `vitest`)
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
