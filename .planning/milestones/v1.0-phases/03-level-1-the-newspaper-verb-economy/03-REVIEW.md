---
phase: 03-level-1-the-newspaper-verb-economy
reviewed: 2026-06-15T00:00:00Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - src/data/levels/level-01-economy.ts
  - src/entities/BushEntity.ts
  - src/entities/Player.ts
  - src/events/GameEvents.ts
  - src/game/scenes/OverworldScene.ts
  - src/game/scenes/Preloader.ts
  - src/game/scenes/UIScene.ts
  - src/input/InputBus.ts
  - src/services/AudioService.ts
  - src/systems/Economy.ts
  - src/systems/PrizePack.ts
  - src/systems/WhackOffsets.ts
  - src/systems/WhackSystem.ts
  - src/ui/HUD.ts
  - src/ui/HospitalOverlay.ts
  - src/ui/ShopOverlay.ts
  - src/data/dialogue/en/level-01.json
  - public/locales/en/common.json
  - tests/coins-hud.test.ts
  - tests/dog-hazard.test.ts
  - tests/input-bus.test.ts
  - tests/prize-pack.test.ts
  - tests/save-service.test.ts
  - tests/shop-economy.test.ts
  - tests/whack.test.ts
findings:
  critical: 3
  warning: 8
  info: 6
  total: 17
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-06-15
**Depth:** standard
**Files Reviewed:** 23
**Status:** issues_found

## Summary

Phase 3 wires the newspaper-whack verb, deterministic prize-pack economy, the dog/hospital loop, and the shop with a traversal gate. The pure modules (PrizePack, Economy, WhackOffsets) are clean — no Phaser imports, correct math, well-tested. The CR-03 listener-cleanup pattern is followed consistently in both scenes' `shutdown()`.

However, the review surfaced three BLOCKER-level defects. The most serious is an `async init()` save-load race that can silently discard the player's saved progress — the exact CR-01 race the code's own comments claim to have fixed has been *reintroduced* by making `init()` async. A second BLOCKER reverses the hospital-fee floor so a broke player pays a fee they don't have at the UI layer (off-by-condition), and a third leaves the patience-bonus reward entirely unreachable (dead public method). Eight warnings cover transient-state loss on reload, snack coins being burned for no effect, a hitbox-size race in WhackSystem, and i18n/save-shape gaps.

## Critical Issues

### CR-01: `async init()` reintroduces the save-load race it claims to fix

**File:** `src/game/scenes/OverworldScene.ts:164-177`
**Issue:** `init()` is declared `async` and returns a `Promise`. Phaser's scene lifecycle does **not** await `init()` — it calls `init()`, then `preload()`, then `create()` synchronously in the same step. The comment on line 159-163 asserts "init() runs synchronously … so create() can remain synchronous," but `await SaveService.load()` makes the assignment to `this._savedState` happen on a later microtask. When `create()` runs at line 168-177, `this._savedState` is still `undefined` for the IndexedDB-backed load (which always resolves asynchronously). Result: a returning player's coins, flags (including purchased upgrades), position, and journal unlocks are silently dropped and the game starts fresh at (96,96). This is data loss on every load where IDB doesn't resolve before `create()` — i.e. effectively always.

The previous design presumably loaded in `create()` with an explicit await or gated `update()`; converting `init()` to async did not actually serialize the load against `create()`.

**Fix:** Gate `create()`/`update()` on the load completing, e.g. load in `create()` and guard `update()` until ready, or block rendering until the promise resolves:
```ts
private _ready = false;

create(): void {
    void SaveService.load().then((saved) => {
        this.applySavedState(saved);   // assign coins/flags/position/journal
        this.buildWorld();             // tilemap, player, NPCs, bushes, gate...
        this._ready = true;
    });
}

update(): void {
    if (!this._ready) return;
    // ...existing guards...
}
```
Or, if keeping the field, do not read it in `create()` — read it in the first `update()` tick after confirming the promise resolved. The key invariant: no world state may be built from `_savedState` before the load promise settles.

### CR-02: Hospital fee floor inverted at the UI — broke player shown a fee deduction they can't pay

**File:** `src/ui/HospitalOverlay.ts:96-101` (in concert with `src/game/scenes/OverworldScene.ts:790-791`)
**Issue:** The fee logic branches on `fee === 0` to show the "BROKE!" copy. But `computeHospitalFee` returns `Math.max(0, Math.min(5, coins))` — so a player with **1–4 coins** gets a *positive* fee equal to their entire balance (e.g. 3 coins → fee 3), which falls into the `else` branch and displays "HOSPITAL FEE: -3 COINS". That is technically the amount deducted, but the overlay's documented contract (lines 88-90) is "fee ≥ 5 → -5", "fee 0 (broke) → -0 (BROKE!)". The 1–4 coin case is unhandled by the spec and shows a misleading "-3 COINS" with no indication the player has been zeroed out. More importantly: `completeHospital` (OverworldScene:791) computes `Math.max(0, this.coins - fee)` — but `fee` was computed from the **same** `this.coins` reading taken in `onDogBite` (line 776) *before* knockback. Between `onDogBite` and `completeHospital` (~960ms of i-frames) the player cannot earn coins (update() is not gated, but the player is knocked back and invincible; bushes can still be whacked during the alpha-flash window because `update()` still runs and `player.whack()` is only blocked by `_invincible`). If the player's coin count *changes* between fee-capture and fee-apply, the deduction is stale.

**Fix:** Recompute (or re-clamp) the fee against the live balance at deduction time, and add an explicit branch for the partial-balance case:
```ts
// OverworldScene.completeHospital
const liveFee = Math.min(fee, this.coins);
this.coins = this.coins - liveFee;
```
And in HospitalOverlay.show, branch on `fee > 0 && fee < 5` vs `fee === 0` so the broke/partial copy is correct.

### CR-03: Patience-bonus reward is unreachable dead code — GAME-06 mechanic does not pay out

**File:** `src/game/scenes/OverworldScene.ts:757-763` (`awardPatienceBonus`), `:724-750` (`setupDogPatrol`)
**Issue:** `awardPatienceBonus()` is `public` and documented as "Called by OverworldScene.update() when player enters the gap corridor," but it is **never called** anywhere in the codebase (grep confirms only the definition and its own internal references exist). `dogGapActive` is set/cleared by the patrol timer but read only inside this orphaned method. The patience-bonus mechanic — a core GAME-06 reward and the thematic payoff of the dog hazard ("the right price comes to those who wait") — therefore never fires. `PATIENCE_BONUS_COINS` (line 48) and the `PATIENCE_BONUS` event flash in HUD are wired but dead. This is a missing-behavior defect: the feature is silently absent.

**Fix:** Call the reward from `update()` with a real corridor/overlap check, or remove the dead method + `dogGapActive` + `PATIENCE_BONUS_COINS` if the mechanic is intentionally deferred (and document the deferral). Example wiring:
```ts
// in update(), after the dog-bite block
if (this.dogGapActive && this.player.sprite.y > 440 && this.player.sprite.x > DOG_MAX_X - 32) {
    this.awardPatienceBonus();
}
```

## Warnings

### WR-01: `bushStreak` lost on reload mid-streak — but coins it would have paid are not

**File:** `src/game/scenes/OverworldScene.ts:97,654,684-703`
**Issue:** `bushStreak` is intentionally transient (not in `buildSaveState`, per D-07). That is fine on its own, but autosave fires *inside* the streak loop on every coin award (line 674). If the player reaches streak 7, the game autosaves, then the tab is hidden / reloaded before the 8th whack, the streak resets to 0 on reload while the player believes they were one whack from the bonus. Combined with `reset()` regrowing all bushes on re-entry (BushEntity.reset, though note: bushes are never actually `reset()` — see WR-02), the streak economy is inconsistent across sessions. Acceptable if intended, but the asymmetry (coins persist, streak doesn't) is a latent player-trust issue worth a deliberate decision.
**Fix:** Either persist `bushStreak` in the save state, or document explicitly that streak intentionally resets on reload and confirm playtest accepts it.

### WR-02: Bushes never regrow — `BushEntity.reset()` is never invoked

**File:** `src/entities/BushEntity.ts:51-55`, `src/game/scenes/OverworldScene.ts:237-241`
**Issue:** `BushEntity.reset()` exists to regrow bushes on level re-entry (D-03 soft-farm), but nothing in OverworldScene ever calls it. Bushes are created fresh in `create()`; on save/reload the scene is rebuilt so they appear regrown by accident, but on any in-session re-entry path (e.g. returning from mini-game via `scene.wake()` — which does NOT re-run `create()`), cleared bushes stay cleared and `_cleared` is never reset. The D-03 "soft farm" loop is therefore non-functional within a session.
**Fix:** Call `bush.reset()` for each entity when the overworld wakes from a mini-game/boss handoff, or in the `MINIGAME_COMPLETE`/`BOSS_DEFEATED` wake callbacks if regrow-on-return is intended.

### WR-03: WhackSystem size-reset timer can shrink an in-progress enlarged hitbox

**File:** `src/systems/WhackSystem.ts:68-72`
**Issue:** `activate()` schedules a `delayedCall(150, …)` that unconditionally calls `this._hitbox.setSize(32, 24)` (base size). If a second `activate()` fires within 150ms of the first (the Player cooldown is 350ms, so a single player can't — but the hitbox is shared and the enlarged path sets 48×32), the **earlier** timer will reset the size to base 32×24 while a later enlarged swing is mid-window, mis-sizing the active hitbox. There is no timer cancellation or generation guard. Even single-player, the trailing reset from swing N can land during swing N+1's setup if frame timing drifts.
**Fix:** Store the timer handle and `.remove()` any pending reset at the top of `activate()`, or tag each activation with a generation counter and ignore stale resets:
```ts
private _resetTimer?: Phaser.Time.TimerEvent;
// in activate():
this._resetTimer?.remove();
this._resetTimer = this._hitbox.scene.time.delayedCall(150, () => { body.enable = false; this._hitbox.setSize(32, 24); });
```

### WR-04: Snack purchase burns coins for zero effect

**File:** `src/game/scenes/OverworldScene.ts:111-125`, `src/systems/Economy.ts:47-60`
**Issue:** Buying the `snack` item passes `applyPurchase`, deducts 5 coins, plays the chime, and saves — but the snack has no effect (the code comments elsewhere say "snack effect deferred"). A player can spend coins on a consumable that does literally nothing, with no feedback that it was a no-op. This is a real money-sink bug, not just a stub: there is no health/energy system for the snack to restore, yet it is purchasable and the description promises "RESTORES ENERGY."
**Fix:** Either remove `snack` from the shop until its effect exists, disable its BUY button, or implement the energy restore. At minimum, do not deduct coins for an item with no implemented effect.

### WR-05: `helmetOwned` / fee snapshot can desync from live flags during i-frame window

**File:** `src/game/scenes/OverworldScene.ts:770-799`
**Issue:** `onDogBite` captures `fee` at bite time (line 776) and `completeHospital` later reads `this.flags['upgrade_helmet']` again at line 796 for the `helmetOwned` payload. The fee was computed with the helmet check baked in, but the splash's `helmetOwned` is re-read ~960ms later. If a purchase could occur during the i-frame window it would desync; more practically, the two reads of helmet state are not guaranteed consistent. Low likelihood given update() still runs, but the double-read is fragile.
**Fix:** Capture `helmetOwned` once alongside `fee` in `onDogBite` and pass both through to `completeHospital`.

### WR-06: `onShopOpen` re-emit after purchase relies on UIScene re-entry guard with no OverworldScene-side guard

**File:** `src/game/scenes/OverworldScene.ts:120-123`
**Issue:** After a purchase, OverworldScene re-emits `SHOP_OPEN`. This is only safe because UIScene's `onShopOpen` checks `this.uiState === 'SHOP'` and takes the refresh-only path. If the shop were closed (e.g. a race where SHOP_CLOSE was processed first) the re-emit would re-open and re-pause the overworld with a stale panel. The OverworldScene `shopOpen` guard is not checked before re-emitting.
**Fix:** Guard the re-emit with `if (this.shopOpen)` before emitting `SHOP_OPEN` from the purchase handler.

### WR-07: `enterBoss` re-emits `BOSS_DEFEATED` — double-emit risks double-handling

**File:** `src/game/scenes/OverworldScene.ts:497-518`
**Issue:** Inside the `GameEvents.once(BOSS_DEFEATED, …)` handler, the scene re-emits `BOSS_DEFEATED` (line 517) so UIScene picks it up after wake. UIScene listens with `GameEvents.on` (persistent), and OverworldScene used `.once` (self-removing). The re-emit therefore reaches UIScene once — but any *other* persistent listener (or a future second OverworldScene instance during a restart race) would also receive the synthetic event, and the payload (`result`) is forwarded unvalidated. Re-emitting the same event name you are handling is an anti-pattern that invites recursive/duplicate handling if listener topology changes.
**Fix:** Use a distinct event (e.g. `LEVEL_COMPLETE`) for the UIScene hand-off instead of re-emitting `BOSS_DEFEATED`.

### WR-08: SaveState integrity — `migrate()` does not coerce field *types*, only fills missing keys

**File:** `src/services/SaveService.ts:35-45,58-74`
**Issue:** `load()` correctly fills missing fields with defaults (CR-07), but `migrate()` uses `?? default` which only catches `null`/`undefined`. A corrupted save where `coins` is a string `"abc"`, `flags` is an array, or `position` is `{x: "NaN"}` passes straight through (the value is not nullish). Downstream `this.coins += earned` would then produce string concatenation, and `position.x` could be `NaN`, breaking camera follow and save round-trips. The threat-model comment ("never trusts raw shape") is only partially honored — presence is validated, types are not.
**Fix:** Type-check each field in `migrate()`:
```ts
coins: typeof raw.coins === 'number' && Number.isFinite(raw.coins) ? raw.coins : 0,
flags: (raw.flags && typeof raw.flags === 'object' && !Array.isArray(raw.flags)) ? raw.flags : {},
position: (raw.position && typeof raw.position.x === 'number' && typeof raw.position.y === 'number') ? raw.position : { x: 96, y: 96 },
```

## Info

### IN-01: Hardcoded canvas dimensions (480×854 / 480×832) scattered across UI

**File:** `src/game/scenes/UIScene.ts:248,350,353`, `src/ui/HospitalOverlay.ts:27`, `src/ui/ShopOverlay.ts:50`, `src/game/scenes/OverworldScene.ts:205`
**Issue:** Magic numbers `480`, `854`, `832`, `427`, `240` for canvas geometry are duplicated in many files. UIScene uses `854` for backdrops while OverworldScene computes world height as `832` (52×16); the mismatch (854 vs 832) is intentional UI-vs-world but undocumented and fragile. WR-06 in UIScene already notes that hardcoded `240` breaks under Scale.FIT — the same risk applies to every other hardcoded center.
**Fix:** Centralize canvas dimensions in a constants module and reference `this.scale.width/height` at runtime where pointer math is involved.

### IN-02: Unused i18n key `hud.coins` (split into `hud.coinsLabel` + value)

**File:** `public/locales/en/common.json:16`, `src/ui/HUD.ts:34-43`
**Issue:** HUD now renders coins as a split label (`hud.coinsLabel`) + separate value text. The original `hud.coins` ("COINS: {n}") key is now dead. Harmless but should be removed to avoid confusion about which is authoritative.
**Fix:** Delete the `hud.coins` key or document it as reserved.

### IN-03: HUD stores `_streakLabel` via `as unknown as` cast instead of a typed field

**File:** `src/ui/HUD.ts:53,130`
**Issue:** `(this as unknown as { _streakLabel: … })._streakLabel = streakLabel` is a type-laundering hack to attach a field the class doesn't declare. It works but defeats type safety and is easy to typo (the key string appears twice).
**Fix:** Declare `private streakLabel!: Phaser.GameObjects.Text;` as a normal field and assign directly.

### IN-04: ShopOverlay `try/catch` around `this.scene.add.image` is ineffective

**File:** `src/ui/ShopOverlay.ts:127-137`
**Issue:** The `try { add.image(item.iconKey) } catch { add.image('__DEFAULT') }` assumes `add.image` throws on a missing texture — Phaser does **not** throw; it logs a warning and renders a green `__MISSING` placeholder. The catch branch is therefore dead code; the fallback never runs.
**Fix:** Check `this.scene.textures.exists(item.iconKey)` before adding, and pick the fallback key based on that boolean rather than relying on a throw.

### IN-05: `firstWhackOrRoll` snack-on-first-whack edge not covered; `slotIndex` semantics asymmetric

**File:** `src/systems/PrizePack.ts:72-82`, `src/game/scenes/OverworldScene.ts:656-681`
**Issue:** The first-whack guarantee returns `{coins:1}` without advancing the slot. The very next whack reads slot 0 again (the same `{coins:1}`), so slot 0's payout is effectively delivered twice across the first two whacks. This is likely intentional (tutorial generosity) but undocumented and untested — there is no test asserting the *sequence* across the first→second whack boundary. Worth a regression test pinning the intended behavior.
**Fix:** Add a test covering two consecutive `firstWhackOrRoll` calls (first with empty flags, second with `first_whack_done`) and document the slot-0-twice outcome.

### IN-06: Commented-out / aspirational comments reference unimplemented slices as if wired

**File:** `src/game/scenes/OverworldScene.ts:639,688-693,831`
**Issue:** Several comments ("filled in Task 2b; stub here so 2a compiles", "content wired when Journal UI is built in Phase 5", journal keys pushed with no consumer) describe future work inline. The `journal_streak_milestone` / `journal_traversal_reward` keys are pushed to `journalUnlocked` and persisted, but no UI consumes them yet — harmless, but the journal array will accumulate keys that nothing reads, and a future Journal UI must tolerate pre-existing keys from this phase.
**Fix:** None required now; flag for the Phase 5 Journal implementer that these keys already ship in saves.

---

_Reviewed: 2026-06-15_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
