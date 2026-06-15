---
phase: 03-level-1-the-newspaper-verb-economy
plan: "02"
subsystem: verb-economy-spine
tags: [phaser4, whack-verb, prize-pack, coins, hud, i18n, audio, entities, systems]
dependency_graph:
  requires:
    - src/systems/PrizePack.ts (firstWhackOrRoll, PrizePackState, DropResult — Plan 01 seam)
    - src/systems/WhackOffsets.ts (whackHitboxOffset — Plan 01 seam)
    - src/input/InputBus.ts Action.WHACK (Plan 01 seam)
  provides:
    - src/events/GameEvents.ts (COINS_CHANGED, BUSH_WHACKED + 5 future Phase-3 events)
    - src/entities/BushEntity.ts (BushEntity — whackable bush entity)
    - src/systems/WhackSystem.ts (WhackSystem — directional hitbox lifecycle)
    - src/data/levels/level-01-economy.ts (ECONOMY_DATA, BushDef, ShopItem, EconomyData)
    - src/services/AudioService.ts playSfx() helper
    - src/entities/Player.ts whack(), applyKnockback(), isInvincible, facing getter
    - src/ui/HUD.ts flashCoinPickup(), updateStreak(), split coinLabel/coinValue
    - COINS_CHANGED event wired end-to-end (OverworldScene → UIScene → HUD)
  affects:
    - All downstream Phase-3 plans (Slice 2 dog hazard, Slice 3 shop) that import WhackSystem, BushEntity, ECONOMY_DATA, COINS_CHANGED
tech_stack:
  added: []
  patterns:
    - Plain-TS entity class holds Phaser sprite (BushEntity → Player analog)
    - Static-body hitbox Rectangle for melee overlap (WhackSystem → TriggerSystem analog)
    - ECONOMY_DATA content seam (level-01-economy.ts → level-01.ts manifest analog)
    - AudioService.playSfx(scene, key) stateless singleton pattern
    - firstWhackOrRoll D-06 seam consumed as-is (no reimplementation)
    - UIScene COINS_CHANGED → HUD.setCoins + flashCoinPickup delta pattern
    - CR-03 listener cleanup: every .on() has matching .off() in shutdown()
key_files:
  created:
    - src/events/GameEvents.ts (COINS_CHANGED, BUSH_WHACKED, PLAYER_HOSPITALIZED, SHOP_OPEN, SHOP_PURCHASE, SHOP_CLOSE, STREAK_BONUS appended)
    - src/entities/BushEntity.ts
    - src/systems/WhackSystem.ts
    - src/data/levels/level-01-economy.ts
    - public/assets/images/ui_newspaper_button.png (placeholder)
    - public/assets/images/newspaper_swing.png (placeholder 96x32)
    - public/assets/images/bush.png (placeholder)
    - public/assets/images/leaf_particle.png (placeholder)
    - public/assets/images/item_newspaper_upgrade.png (placeholder)
    - public/assets/images/item_helmet.png (placeholder)
    - public/assets/images/item_bus_pass.png (placeholder)
    - public/assets/images/item_snack.png (placeholder)
    - public/assets/audio/sfx_whack.ogg (placeholder)
    - public/assets/audio/sfx_coin_ding.ogg (placeholder)
    - public/assets/audio/sfx_dog_bite.ogg (placeholder)
    - public/assets/audio/sfx_purchase.ogg (placeholder)
    - public/assets/audio/sfx_hospital.ogg (placeholder)
    - public/assets/audio/sfx_streak_bonus.ogg (placeholder)
  modified:
    - src/events/GameEvents.ts (Phase-3 constants appended)
    - src/entities/Player.ts (whack(), applyKnockback(), isInvincible, facing getter, _invincible/_whackCooldown/_scene fields)
    - src/game/scenes/OverworldScene.ts (BushEntity group, WhackSystem, gate barrier, touch button, J key, WHACK poll, activateWhack, onBushHit, awardWhackDrop)
    - src/game/scenes/Preloader.ts (Phase-3 asset loads + newspaper_swing_anim)
    - src/services/AudioService.ts (playSfx helper added)
    - src/ui/HUD.ts (split coinLabel/coinValue, flashCoinPickup, updateStreak, streak pips)
    - src/game/scenes/UIScene.ts (COINS_CHANGED + BUSH_WHACKED handlers, UIState extended)
    - public/locales/en/common.json (hud.coinsLabel, hud.streak, hud.streakBonus, hud.streakBonusCoins, hud.streakBonusJournal, hud.whackHint)
decisions:
  - "AudioService.playSfx(scene, key) takes the scene as first arg so AudioService stays a stateless singleton — no singleton Phaser ref (constraint: Phaser sound manager is scene-owned)"
  - "Player.whack() signature takes no facing arg — facing is read from the getter by OverworldScene.activateWhack(); keeps Player.update() movement logic unchanged"
  - "BushEntity.onWhacked() defers body disable by 80ms via tween (white flash) so the visual flash is visible before the bush disappears — caller invokes in delayedCall callback"
  - "Leaf particle burst uses try/catch around Phaser 4 particles API with fallback to alpha-tween leaf sprites (RESEARCH Open Question 1 — Phaser 4 particle signature may differ)"
  - "Preloader loaderror flag suppresses scene advance; placeholder OGG files are minimal 44-byte OggS headers — Phaser audio decode logs a console warning but does not throw a game-blocking error"
  - "awardWhackDrop stub in Task 2a (void firstWhackOrRoll + void prizePackState) avoids noUnusedLocals TS errors; replaced in Task 2b with real implementation"
metrics:
  duration: "11 minutes"
  completed_date: "2026-06-15T19:45:37Z"
  tasks_completed: 3
  files_created: 22
  files_modified: 8
---

# Phase 03 Plan 02: Verb + Economy Spine Summary

**One-liner:** Whack-a-bush verb (directional hitbox, J/Space/touch), ALttP prize-pack coin drops via firstWhackOrRoll seam, and COINS_CHANGED wired end-to-end to close the D-08 HUD gap — with +N float, streak pips, and IndexedDB persistence.

## What Was Built

Slice 1 (Plan 02) of Phase 3: the thinnest end-to-end "whack a bush → coin drops → HUD updates → persists" loop. After this plan the verb + economy core is playable.

### Task 1: GameEvents constants, BushEntity, WhackSystem, ECONOMY_DATA

**`src/events/GameEvents.ts`** — Phase-3 event constants appended to the single frozen `Events` object (D-19): `COINS_CHANGED`, `BUSH_WHACKED`, `PLAYER_HOSPITALIZED`, `SHOP_OPEN`, `SHOP_PURCHASE`, `SHOP_CLOSE`, `STREAK_BONUS`. The `as const` + `EventNames` type required no change.

**`src/entities/BushEntity.ts`** — Plain-TS class holding an Arcade Sprite. `setData('bushId', id)` in constructor for overlap callback lookup (Pitfall 8 from RESEARCH). `onWhacked()` hides and disables the body without destroying the sprite (preserves reset() path). `reset()` regrows the bush on level re-entry (D-03 soft farm).

**`src/systems/WhackSystem.ts`** — Directional hitbox lifecycle. Imports `whackHitboxOffset` from the Plan-01 pure seam; does NOT re-inline the offset table. Creates an invisible static-body Rectangle (32×24). `activate(x, y, facing, enlarged)`: positions via seam offset, enables body for 150ms then disables. `enlarged` param accepted as no-op (reserved for Slice 3 upgrade_newspaper effect).

**`src/data/levels/level-01-economy.ts`** — `ECONOMY_DATA` content seam: 14 `BushDef` entries (12 regular + 2 special milestone bushes) placed on DECO_DATA -1 cells in two clusters (start area near grandpa, east open area); 4 shop items (Sunday Edition/upgrade_newspaper, Bike Helmet/upgrade_helmet, Bus Pass/upgrade_traversal, Snack); east-path gate barrier at (320,112,144×32); verbatim D-05 prize-pack slots. No economy data in any *Scene.ts file (INFR-04).

### Task 2a: WHACK verb mechanics

**`src/services/AudioService.ts`** — Added `playSfx(scene, key)`: stateless SFX helper gated on `getSfxEnabled()` (T-03-05 threat mitigation). No direct `scene.sound.play()` at call sites.

**`src/game/scenes/Preloader.ts`** — Phase-3 asset loads: `ui_newspaper_button` (48px), `newspaper_swing` spritesheet (96×32, frameWidth:32, 3 frames), `bush`, `leaf_particle`, 4 shop item icons, 6 SFX OGG files. `newspaper_swing_anim` registered (18fps, 3 frames, hideOnComplete:true). Does NOT add new player_sheet frames (D-04 — overlay sprite separate from walk sheet).

**`src/entities/Player.ts`** — Added `_facing` (renamed from `facing`), `_whackCooldown`, `_invincible`, `_scene` fields. Exposed `get facing()`, `get isInvincible()`. Added `whack()` cooldown gate (350ms, returns boolean so caller knows whether to activate hitbox). Added `applyKnockback()` (tween + 6× alpha flash ~960ms i-frames, Slice 2 will call this). Movement `update()` logic unchanged (±80px/s).

**`src/game/scenes/OverworldScene.ts`** — Extended:
- Imports: `Action`, `AudioService`, `BushEntity`, `WhackSystem`, `ECONOMY_DATA`, `firstWhackOrRoll`, `PrizePackState`
- New fields: `whackSystem`, `whackableGroup`, `bushEntities` Map, `prizePackState`, `bushStreak`, `shopOpen`, `hospitalShowing`, `gateBarrier`
- create(): BushEntity group + WhackSystem + overlap registration; traversal gate barrier (disabled if `upgrade_traversal` flag); touch whack button (64×64 zone, #00ff88 border, UISpec §1); J key always-whack; Space/Enter → context-sensitive (NPC → talk, else WHACK)
- update() guard extended: `|| this.shopOpen || this.hospitalShowing`
- WHACK poll: `InputBus.isActive(WHACK) → consume → player.whack() → activateWhack()`
- `activateWhack()`: WhackSystem.activate() + swing overlay sprite with facing offsets + AudioService.playSfx('whack')
- `onBushHit()`: white flash (80ms), particle burst (try/catch with tween fallback), `awardWhackDrop()`
- `awardWhackDrop()` stub (replaced in Task 2b)

### Task 2b: Coins + COINS_CHANGED + HUD

**OverworldScene.awardWhackDrop()** — Full implementation: `firstWhackOrRoll(flags, prizePackState)`, set `first_whack_done` after call (D-06), on coin drop: `this.coins += drop.coins`, `playSfx('coin_ding')`, `bushStreak += 1`, emit `BUSH_WHACKED{streak}` + `COINS_CHANGED(this.coins)`, autosave. Snack drop increments streak + emits BUSH_WHACKED only (snack effect Slice 3).

**`src/ui/HUD.ts`** — Split coin counter: `coinLabel` ("COINS:") in `#e8e8e8` + `coinValue` (number) in `#f5c842`. `setCoins(n)` updates value text + repositions to follow label width + scale tween. Added `flashCoinPickup(amount)`: "+N" float in `#f5c842`, 700ms float-up tween (pattern: flashPatienceBonus). Added `updateStreak(n)`: 8 rectangle pips (12×8px, gap 4px) at y=40; filled=`#00ff88`, empty=`#16213e`; hidden when n=0.

**`src/game/scenes/UIScene.ts`** — Extended UIState: `'SHOP' | 'HOSPITAL'` added. Added class-field handlers: `onCoinsChanged(n)` → `hud.setCoins(n)` + `flashCoinPickup(delta)`; `onBushWhacked(data)` → `hud.updateStreak(data.streak)`. Both registered in `create()` and removed in `shutdown()` (CR-03 — no zombie listeners on restart).

**`public/locales/en/common.json`** — Added: `hud.coinsLabel`, `hud.streak`, `hud.streakBonus`, `hud.streakBonusCoins`, `hud.streakBonusJournal`, `hud.whackHint`. All in ALL-CAPS per Copywriting Contract (D-18/INFR-05).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript import path for level-01-economy.ts**
- **Found during:** Task 1 — npm run check
- **Issue:** `../systems/PrizePack` resolved to wrong relative path from `src/data/levels/`; needed `../../systems/PrizePack`
- **Fix:** Corrected relative path to `../../systems/PrizePack` (no .js extension needed with `moduleResolution: "bundler"`)
- **Files modified:** `src/data/levels/level-01-economy.ts`

**2. [Rule 1 - Bug] setTintFill() not a Phaser 4 method**
- **Found during:** Task 2a — npm run check
- **Issue:** `Phaser.Physics.Arcade.Sprite.setTintFill(0xffffff)` reported `Expected 0 arguments` — method signature differs in Phaser 4
- **Fix:** Replaced with `setTint(0xffffff)` which achieves the same white flash effect

**3. [Rule 2 - Missing] noUnusedLocals for Task 2a stub**
- **Found during:** Task 2a — npm run check
- **Issue:** `firstWhackOrRoll`, `prizePackState`, `bushStreak` declared for Task 2b but unused in Task 2a stub
- **Fix:** Added `void firstWhackOrRoll; void this.prizePackState; void this.bushStreak` in the stub body; replaced entirely by real implementation in Task 2b

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| Placeholder PNG images (1×1 or 96×32 solid color) | `public/assets/images/*.png` (8 files) | n/a | Art pass will replace with real pixel-art assets; functional placeholders prevent Phaser loaderror |
| Placeholder OGG audio (44-byte minimal headers) | `public/assets/audio/sfx_*.ogg` (6 files) | n/a | Art pass will replace; Phaser logs decode warning but does not block game loop |
| `BushEntity.reset()` not called on re-entry | `src/entities/BushEntity.ts` | 52 | Slice 2 will call reset() on OverworldScene level re-entry |
| `Player.applyKnockback()` not called | `src/entities/Player.ts` | 70 | Slice 2 dog hazard will call this on dog bite |
| `awardWhackDrop` snack effect deferred | `src/game/scenes/OverworldScene.ts` | 580 | Slice 3 shop will implement snack consumable effect |
| `WhackSystem.activate enlarged` param no-op | `src/systems/WhackSystem.ts` | 46 | Slice 3 upgrade_newspaper will activate the enlarged hitbox |

All stubs are intentional; none block the plan's goal (whack → coin → HUD → persist loop is complete and functional).

## Threat Surface Scan

No new network endpoints, auth paths, fetch calls, or Supabase interactions. This plan is client-side Phaser only. All threat mitigations applied:
- T-03-03: SaveService.migrate fills missing flags via `?? {}` — `first_whack_done` read via truthiness (no throw on absent key)
- T-03-04: Player.whack() cooldown (350ms) + hitbox 150ms active window gates whack spam; InputBus.setAction(WHACK,false) consumes each pulse
- T-03-05: All SFX routed through AudioService.playSfx() gated on getSfxEnabled()
- T-03-SC: Zero new npm packages installed

## Self-Check: PASSED

### Files exist:
- `src/events/GameEvents.ts` — FOUND (COINS_CHANGED confirmed)
- `src/entities/BushEntity.ts` — FOUND
- `src/systems/WhackSystem.ts` — FOUND
- `src/data/levels/level-01-economy.ts` — FOUND (ECONOMY_DATA with bushes)
- `src/services/AudioService.ts` — FOUND (playSfx added)
- `src/entities/Player.ts` — FOUND (whack() + facing getter)
- `src/ui/HUD.ts` — FOUND (flashCoinPickup + updateStreak)
- `src/game/scenes/UIScene.ts` — FOUND (onCoinsChanged + onBushWhacked)
- `public/locales/en/common.json` — FOUND (hud.streak etc.)

### Commits exist:
- `3636e05` feat(03-02): GameEvents phase-3 constants, BushEntity, WhackSystem, level-01-economy data — FOUND
- `809269f` feat(03-02): WHACK verb — Player.whack(), WhackSystem hitbox/overlap, bush clear feedback — FOUND
- `b802d02` feat(03-02): coins authoritative + COINS_CHANGED end-to-end + HUD gold coin + +N float + streak pips — FOUND

### Static checks:
- `npm test` (121/121 passing) — GREEN
- `npm run check` (tsc --noEmit) — CLEAN
- INFR-04 (no economy literals in *Scene.ts) — CONFIRMED (only ECONOMY_DATA references)
- INFR-05 (no hardcoded player strings in TS) — CONFIRMED (all via t())
- WhackSystem imports whackHitboxOffset from WhackOffsets (no re-inlined table) — CONFIRMED
