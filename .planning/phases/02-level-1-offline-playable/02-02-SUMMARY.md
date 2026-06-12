---
phase: "02"
plan: "02"
subsystem: gameplay-core
tags: [boss-fight, mini-game, trigger-system, scene-handoff, GAME-06, patience-mechanic, i18n]
dependency_graph:
  requires: [02-01]
  provides: [TriggerSystem, PaperThrowScene-full, BossScene-full, OverworldScene-handoffs]
  affects: [02-03]
tech_stack:
  added: []
  patterns: [TriggerSystem-zone-overlap, Scene-as-state-handoff-Pattern3, GameEvents.once-result-delivery, shutdown-input-cleanup-Pitfall2]
key_files:
  created:
    - src/systems/TriggerSystem.ts
  modified:
    - src/game/scenes/minigames/PaperThrowScene.ts
    - src/game/scenes/BossScene.ts
    - src/game/scenes/OverworldScene.ts
decisions:
  - "TriggerSystem uses pure rectangle Contains check (no new physics world) — minimal surface for zone detection"
  - "PaperThrowScene and BossScene own all displayed-only GameObjects via displayObjects[] to satisfy TS noUnusedLocals"
  - "BossScene re-emits BOSS_DEFEATED after OverworldScene wakes so UIScene state machine picks it up cleanly"
  - "TriggerSystem.release() allows mini-game replay after returning; boss zone not released (one-fight design)"
  - "enterBoss() saves before sleeping as a pre-boss-entry checkpoint (separate from post-boss save)"
metrics:
  duration: "~25 minutes"
  completed: "2026-06-12"
  tasks: 3
  files_created: 1
  files_modified: 3
  tests_added: 0
  tests_total: 45
---

# Phase 02 Plan 02: TriggerSystem + PaperThrowScene + BossScene Summary

**One-liner:** Zone-based TriggerSystem drives clean overworld→mini-game→overworld and overworld→boss→overworld handoffs via RESEARCH Pattern 3; PaperThrowScene delivers a 60s/5-house timing mini-game emitting MINIGAME_COMPLETE; BossScene delivers the Mr. Market two-phase patience fight (greed DECLINE → panic BUY LOW!) emitting BOSS_DEFEATED with patienceBonus — the GAME-06 climax, with no permanent fail state.

---

## What Was Built

### Task 1 — TriggerSystem + PaperThrowScene + OverworldScene mini-game handoff

**TriggerSystem** (`src/systems/TriggerSystem.ts`):
- Pure TypeScript utility (no Phaser Scene subclass) owned by OverworldScene
- Maps `LEVEL_01_MANIFEST.triggers` zone names to Level 1 world-space rectangles:
  - `minigame_trigger`: x=288, y=256, 128×128px
  - `boss_trigger`: x=192, y=672, 128×96px
- `checkZones(playerX, playerY)`: Returns first un-consumed TriggerHit or null
- `consume(zone)`: Marks zone as active during handoff (prevents double-launch)
- `release(zone)`: Frees zone on overworld wake (allows mini-game replay)

**PaperThrowScene** (full implementation replacing stub):
- Instructions panel (full-screen #1a1a2e): PAPER ROUTE! title + instructions + 3→2→1 countdown via `time.addEvent`
- Gameplay phase: 5 house targets, 60s timer (color swaps to #ff4444 at ≤15s), score HUD DELIVERIES: {n}/5
- Neighbor appearance cycle: random house, TAP! prompt at 2Hz blink, 2s window
- Paper Tween projectile on delivery (Assumption A2 honored — no physics body)
- PERFECT! float-up flash on tight timing (≤600ms after neighbor appears)
- TIME'S UP! flash on timer expiry; emits `GameEvents.emit(Events.MINIGAME_COMPLETE, { score, perfect })`
- `shutdown()`: removes all 5 timer types + `this.input.off()` (Pitfall 2)
- All strings via `t()` — zero hardcoded English literals

**OverworldScene extended** (mini-game path):
- `TriggerSystem` instantiated in `create()`
- `update()`: calls `triggerSystem.checkZones(player.x, player.y)`; on hit dispatches to `enterMiniGame()` or `enterBoss()`
- `enterMiniGame()`: `scene.sleep()` → `scene.launch(sceneKey)` → `GameEvents.once(MINIGAME_COMPLETE, ...)` → `scene.stop(sceneKey)` → `scene.wake()`; applies coins (2/delivery + 3/perfect); releases zone; saves
- `inHandoff` guard prevents double-trigger during queued launch

### Task 2 — BossScene + OverworldScene boss handoff

**BossScene** (full implementation replacing stub):
- Phase tint Rectangle: `0xff4444` greed / `0x4444ff` panic, depth 0, alpha 0→0.15 tween (500ms)
- Mr. Market sprite (boss_mr_market, 64×96px), name label `t('boss.mrMarket.name')`, phase label with scale-up tween on swap
- 5-tick state bar (filled red for greed ticks); 3-segment patience meter (fills #00ff88 per DECLINE)
- Speech bubble (16213e rect + offer text) pulls from `level-01.json` keys: boss_greed_01/02/03, boss_panic_01 (dynamic import in async create())
- First-encounter hint `t('boss.hint.decline')` auto-dismisses after 3s or first DECLINE press
- **Greed phase**: DECLINE button (240×56, stroke #00ff88); each press: deplete tick, fill patience segment, advance offer; 3rd DECLINE → PATIENCE MAXED! flash → Panic
- **Panic phase**: 3s countdown timer (#ff4444) + BUY LOW! button (stroke #4444ff); hit in time → BUY LOW! win flash (#00ff88, 24px) → `GameEvents.emit(Events.BOSS_DEFEATED, { patienceBonus })`
- **Miss outcome**: #ff4444 screen flash 200ms → TOO SLOW! label 2s → Greed phase reset (no permanent fail — GAME-06 anti-energy-system)
- `patienceBonus = declinesCount` (0–3; completing all 3 without rushing = max bonus)
- `shutdown()`: removes panicTimer, hintTimer; calls `input.off()` and `removeAllListeners()` on buttons

**OverworldScene extended** (boss path):
- `enterBoss()`: saves pre-boss checkpoint → `scene.sleep()` → `scene.launch('BossScene')` → `GameEvents.once(BOSS_DEFEATED, ...)` → `scene.stop()` → `scene.wake()`; sets `boss_01_defeated` flag; applies `patienceBonus` coins; saves post-boss checkpoint; re-emits BOSS_DEFEATED so UIScene state machine picks it up

### Task 3 — Device verification (auto-approved in --auto chain)

See "Auto-approved — outstanding human UAT" section below.

---

## Automated Proxy Results (Task 3)

All automatable checks ran and passed:

| Check | Result |
|-------|--------|
| `npm run check` (TypeScript) | PASS — 0 errors |
| `npm run build` (production bundle) | PASS — dist/ created; TriggerSystem + PaperThrowScene + BossScene all resolve |
| `npx vitest run --reporter=dot` (all tests) | PASS — 45/45 green (no regressions) |
| `grep -c 'Events.MINIGAME_COMPLETE' src/game/scenes/minigames/PaperThrowScene.ts` | 1 |
| `grep -cE 'scene.sleep\|scene.launch\|scene.wake' src/game/scenes/OverworldScene.ts` | 7 |
| `grep -c 'Events.MINIGAME_COMPLETE' src/game/scenes/OverworldScene.ts` | 1 |
| `grep -c TriggerSystem src/game/scenes/OverworldScene.ts` | 7 |
| No hardcoded English literals in PaperThrowScene | PASS — no matches |
| `grep -c 'Events.BOSS_DEFEATED' src/game/scenes/BossScene.ts` | 1 |
| `grep -c patienceBonus src/game/scenes/BossScene.ts` | 3 |
| `grep -cE '0xff4444\|0x4444ff' src/game/scenes/BossScene.ts` | 11 |
| `grep -cE 'boss_greed\|boss_panic' src/game/scenes/BossScene.ts` | 3 |
| No hardcoded English literals in BossScene | PASS — no matches |
| `grep -c 'Events.BOSS_DEFEATED' src/game/scenes/OverworldScene.ts` | 3 |
| `grep -c 'SaveService.save' src/game/scenes/OverworldScene.ts` | 7 (mini-game + boss + existing saves) |

---

## Auto-approved — outstanding human UAT

Task 3 is a `checkpoint:human-verify` gate requiring a real browser/WebGL context. Running in `--auto` chain, this is auto-approved. The following UAT items are **outstanding and must be manually verified before Phase 2 sign-off**:

| # | Device | Behavior | Acceptance Criterion |
|---|--------|----------|----------------------|
| UAT-M1 | Desktop Chrome | Walk into minigame_trigger zone | PaperThrowScene launches; overworld sleeps; instructions show with 3→2→1 countdown |
| UAT-M2 | Desktop Chrome | Mini-game delivery timing | Neighbor appears at door; TAP! prompt blinks at 2Hz; tap in window = delivery scored; PERFECT! flash on tight timing |
| UAT-M3 | Desktop Chrome | Mini-game completion | 5 deliveries OR 60s timer expiry → overworld resumes with coins updated; no phantom taps bleed into sleeping overworld |
| UAT-M4 | Desktop Chrome | Timer urgency color | Timer text turns #ff4444 at ≤15s |
| UAT-B1 | Desktop Chrome | Walk into boss_trigger zone | BossScene launches; Mr. Market appears; GREED PHASE label visible with red tint |
| UAT-B2 | Desktop Chrome | Greed phase — patience path | Tap DECLINE 3×; each depletes a tick + fills patience segment; PATIENCE MAXED! flash after 3rd |
| UAT-B3 | Desktop Chrome | Panic phase — win path | Blue tint + PANIC PHASE; 3s countdown; tap BUY LOW! in time → BUY LOW! flash → level reacts |
| UAT-B4 | Desktop Chrome | Panic phase — miss path | Let 3s expire → TOO SLOW! THE MARKET RECOVERED! → Greed phase resets; retry immediately (no energy cost) |
| UAT-B5 | Desktop Chrome | Patience rewarded | Completing all 3 DECLINE declines before Panic gives higher patienceBonus coins than accepting in Greed phase (there is no ACCEPT in Greed — you must decline to progress) |
| UAT-B6 | Any | Boss-defeat flag persists | After beating boss, refresh → boss_01_defeated flag in IndexedDB (confirmed via DevTools Application > IndexedDB) |
| UAT-B7 | iPhone (real device) | Mobile mini-game tap | Virtual joystick navigates to zone; pointerdown registers correctly for delivery scoring |

**How to verify:** Run `npm run dev`, open the printed URL on the respective device.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused `cy` variable from PaperThrowScene.create()**
- **Found during:** Task 1 — `npm run check` reported `'cy' is declared but its value is never read`
- **Issue:** `const cy = this.scale.height / 2` was declared but house layout was calculated from explicit pixel values, not cy.
- **Fix:** Removed the unused variable.
- **Files modified:** src/game/scenes/minigames/PaperThrowScene.ts
- **Commit:** b2e5ff1 (inline fix before task commit)

**2. [Rule 1 - Bug] Refactored display-only BossScene fields to avoid TS6133**
- **Found during:** Task 2 — `npm run check` reported bossSprite, nameText, and bubbleRect declared but never read
- **Issue:** These Phaser GameObjects are purely visual (set once in create(), never updated programmatically) so TypeScript's noUnusedLocals flagged them.
- **Fix:** Replaced the three private fields with a `displayObjects: Phaser.GameObjects.GameObject[]` array. Objects are pushed at create-time and array is retained for lifecycle (Phaser's scene shutdown handles destroy).
- **Files modified:** src/game/scenes/BossScene.ts
- **Commit:** 12c7ce7 (inline fix before task commit)

### Design Choices (not deviations — intentional)

**enterBoss() re-emits BOSS_DEFEATED:** After `scene.stop('BossScene')` and `scene.wake()`, the OverworldScene handler re-emits `Events.BOSS_DEFEATED`. This is necessary because UIScene is a parallel scene that missed the first emit while BossScene was running — the re-emit delivers it cleanly to UIScene's listener. This is a consequence of the parallel-scene architecture established in 02-01.

**TriggerSystem hard-codes Level 1 zone rectangles:** Per plan's "no new physics world" constraint (Assumption A2), zones are expressed as world-space rectangles matching the Level 1 tile layout. Level 2+ will read zones from the Tiled JSON tilemap (an architectural seam left for Phase 3/4).

---

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| UIScene.showLevelComplete() renders only a heading | src/game/scenes/UIScene.ts | Full level complete screen (quote typewriter, share button, cliffhanger) wired in Plan 02-03 |
| All Phase 2 assets remain 1×1 placeholder PNGs | public/assets/ | Art polish deferred per RESEARCH Open Question 1; game functions with placeholder textures |

No stubs prevent the plan's core goal: TriggerSystem drives full handoffs; both scenes are completable end-to-end; MINIGAME_COMPLETE and BOSS_DEFEATED emit correctly; overworld wakes and saves.

---

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced beyond the plan's `<threat_model>`. All plan threats addressed:

| Threat | Mitigation Status |
|--------|------------------|
| T-02-05 Tampering (scene.launch result read) | MITIGATED — Results consumed only via GameEvents.once(MINIGAME_COMPLETE/BOSS_DEFEATED); no synchronous cross-scene state read (Pitfall 1) |
| T-02-06 DoS (phantom input on sleeping overworld) | MITIGATED — PaperThrowScene.shutdown() and BossScene.shutdown() call input.off(); OverworldScene.inHandoff guard prevents update() input processing during handoff |
| T-02-07 Tampering (boss offer text injection) | ACCEPTED — offer text from static bundled JSON (level-01.json); rendered as Phaser Text not HTML; no eval; same posture as T-02-02 |
| T-02-SC Tampering (npm installs) | ACCEPTED — No new packages installed in this plan |

No unplanned threat surface found.

---

## Self-Check: PASSED

Files confirmed present:
- src/systems/TriggerSystem.ts — FOUND
- src/game/scenes/minigames/PaperThrowScene.ts (full implementation) — FOUND
- src/game/scenes/BossScene.ts (full implementation) — FOUND
- src/game/scenes/OverworldScene.ts (extended with TriggerSystem + handoffs) — FOUND

Commits confirmed:
- b2e5ff1 feat(02-02): TriggerSystem + PaperThrowScene + OverworldScene mini-game handoff
- 12c7ce7 feat(02-02): BossScene Mr. Market two-phase fight + OverworldScene enterBoss handoff
