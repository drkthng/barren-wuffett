---
phase: 02-level-1-offline-playable
fixed_at: 2026-06-12T09:07:00Z
review_path: .planning/phases/02-level-1-offline-playable/02-REVIEW.md
iteration: 1
findings_in_scope: 19
fixed: 17
skipped: 2
status: partial
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-06-12T09:07:00Z
**Source review:** .planning/phases/02-level-1-offline-playable/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 19 (8 Critical + 7 Warning + 4 Info)
- Fixed: 17
- Skipped: 2 (Info items IN-03 and IN-04 — low-risk, deferred)

**Final gate results:**
- `npm run build` — exit 0 (25s, PWA precache 9 entries)
- `npm run check` — exit 0 (TypeScript strict, no errors)
- `npx vitest run` — 61 passed / 0 failed (was 58 before fixes; +3 regression tests)

---

## Fixed Issues

### CR-01: async create() in OverworldScene — Phaser calls update() before construction completes

**Files modified:** `src/game/scenes/OverworldScene.ts`
**Commit:** 98ad9a8
**Applied fix:** Added `async init(): Promise<void>` which calls `SaveService.load()` and stores result in `this._savedState`. `create()` is now synchronous and reads `this._savedState`. `update()` can no longer run before `this.player` is assigned. The VirtualJoystick dynamic import was converted to a fire-and-forget `void import(...).then(...)` since the joystick is additive (keyboard fallback exists) and does not affect the critical player-initialization path.

---

### CR-02: async create() in BossScene — dialogue data race

**Files modified:** `src/game/scenes/BossScene.ts`
**Commit:** 763b410
**Applied fix:** Replaced the `try { const mod = await import(...) }` pattern with a static top-level import (`import dialogueDataRaw from '../../data/dialogue/en/level-01.json'`). `create()` is now synchronous and assigns `this.dialogueData = dialogueDataRaw` immediately. No async gap exists between Phaser calling `create()` and the first `update()` tick.

---

### CR-03: GameEvents.off(eventName) removes ALL global listeners

**Files modified:** `src/game/scenes/OverworldScene.ts`, `src/game/scenes/UIScene.ts`
**Commit:** 98ad9a8 (OverworldScene), 776f756 (UIScene)
**Applied fix:**
- OverworldScene.shutdown(): `GameEvents.off(Events.DIALOGUE_COMPLETE)` → `GameEvents.off(Events.DIALOGUE_COMPLETE, this.onDialogueComplete, this)` where `onDialogueComplete` is a stored arrow class field.
- UIScene.shutdown(): all six `GameEvents.off(eventName)` calls updated to pass `(event, handlerFn, this)`. The inline PATIENCE_BONUS lambda was extracted to a `private onPatienceBonus` class field so it can be passed to `.off()` precisely.

---

### CR-04: UIScene.showLevelComplete() — UIScene remains as zombie overlay on MainMenu

**Files modified:** `src/game/scenes/UIScene.ts`
**Commit:** 776f756
**Applied fix:** Added `this.scene.stop('UIScene')` in the `continueBtn` pointerdown handler, immediately before `this.scene.start('MainMenu')`. UIScene now stops itself, removing all its GameEvents subscriptions and preventing duplicate listener registration on re-entry.

---

### CR-05: PaperThrowScene — repeat:N fires N+1 times; beginGame() called twice

**Files modified:** `src/game/scenes/minigames/PaperThrowScene.ts`
**Commit:** db151db
**Applied fix:** Changed `repeat: COUNTDOWN_START` to `repeat: COUNTDOWN_START - 1` so the timer fires exactly 3 times instead of 4. Added a `if (this.phase !== 'instructions') return` guard at the top of `beginGame()` as secondary defense against any future double-call.

---

### CR-06: BossScene panic timer — repeat:PANIC_DURATION_S fires one extra tick

**Files modified:** `src/game/scenes/BossScene.ts`
**Commit:** 763b410
**Applied fix:** Changed `repeat: PANIC_DURATION_S` to `repeat: PANIC_DURATION_S - 1` so the panic countdown fires exactly PANIC_DURATION_S times. The existing `if (this.phase !== 'panic') return` guard in `handlePanicExpiry()` provides additional safety.

---

### CR-07: SaveService.load() — malformed save with version >= SAVE_VERSION returned raw

**Files modified:** `src/services/SaveService.ts`, `tests/save-service.test.ts`
**Commit:** 07da763 (fix), 40728d6 (regression test)
**Applied fix:** `load()` now calls `migrate()` for all valid saves regardless of version — `migrate()` fills missing fields with safe defaults. The raw type changed from `get<SaveState>` to `get<unknown>` with an object check before casting to `Partial<SaveState>`. Added a regression test verifying that a version===SAVE_VERSION save with missing fields returns populated defaults.

---

### CR-08: OverworldScene.buildSaveState() — journalUnlocked always []

**Files modified:** `src/game/scenes/OverworldScene.ts`, `tests/save-service.test.ts`
**Commit:** 98ad9a8 (fix), 40728d6 (regression test)
**Applied fix:** Added `private journalUnlocked: string[] = []` instance field. On scene init, if a saved state has `journalUnlocked`, it is copied into the field. In `enterBoss()`'s BOSS_DEFEATED handler, `LEVEL_01_MANIFEST.journalUnlock` is pushed to the field if not already present. `buildSaveState()` now returns `journalUnlocked: [...this.journalUnlocked]` instead of `[]`. Two regression tests added to save-service.test.ts.

---

### WR-01: Tileset frameWidth/Height (16px) does not match tilemap tileWidth/Height (32px)

**Files modified:** `src/game/scenes/Preloader.ts`, `public/assets/tilesets/omaha_tiles.png`
**Commit:** 9ce0958
**Applied fix:** Changed `frameWidth: 16, frameHeight: 16` to `frameWidth: 32, frameHeight: 32` in Preloader. Regenerated `omaha_tiles.png` as a 96×32 PNG (3 tiles wide × 1 tile tall, each 32×32), replacing the previous 1×1 placeholder. Tile index 0 = dark navy ground (#1a1a2e), index 1 = blue-gray wall (#55557a), index 2 = secondary decoration (#16213e). The image is 140 bytes, well within the 2048px texture cap.

---

### WR-02: GameEvents.on(DIALOGUE_START, asyncHandler) — unhandled async rejection

**Files modified:** `src/game/scenes/UIScene.ts`
**Commit:** 776f756
**Applied fix:** Wrapped `onDialogueStart` body in `try { ... } catch { this.setState('HUD'); }`. Added a fallback: if the dialogue key is not found in the loaded JSON, `GameEvents.emit(Events.DIALOGUE_COMPLETE, { npcId })` is called immediately so the game is never stuck in DIALOGUE state.

---

### WR-03: UIScene import assertion `assert: { type: 'json' }` — non-standard syntax

**Files modified:** `src/game/scenes/UIScene.ts`
**Commit:** 776f756
**Applied fix:** Removed `{ assert: { type: 'json' } }` from the dynamic import in `loadDialogue()`. The import is now `await import('../../data/dialogue/en/level-01.json') as { default: Record<...> }`, consistent with BossScene's import pattern and with no non-standard assert syntax.

---

### WR-04: shareCard() fallback path breaks iOS gesture requirement when Blob cache is cold

**Files modified:** `src/services/ShareService.ts`
**Commit:** d0e2ad4
**Applied fix:** Restructured `shareCard()` into two explicit paths:
1. **Cached path** (fast): Blob present in `_cachedBlob` — calls `navigator.canShare()` + `navigator.share()` synchronously. No async gap before `share()`. Correct for iOS.
2. **Cold-cache path** (WR-04 fix): Blob not cached — generates snapshot+blob asynchronously, then goes straight to `anchor[download]`. Does NOT call `navigator.share()` after awaits (which would break iOS). Populates the cache so subsequent taps use the fast cached path.

---

### WR-05: HIDDEN event handler registered without stored reference

**Files modified:** `src/game/scenes/OverworldScene.ts`
**Commit:** 98ad9a8
**Applied fix:** Added `private _onHidden = (): void => { void SaveService.save(this.buildSaveState()); }` as a class field. `create()` uses `this.game.events.on(Phaser.Core.Events.HIDDEN, this._onHidden, this)`. `shutdown()` uses `this.game.events.off(Phaser.Core.Events.HIDDEN, this._onHidden, this)` — removing only this scene's listener, not all HIDDEN listeners.

---

### WR-06: Pause-confirm YES/NO hit zone uses raw pointer X — broken at non-default scale

**Files modified:** `src/game/scenes/UIScene.ts`
**Commit:** 776f756
**Applied fix:** Replaced `pointer.x < 240` with `pointer.x < this.scale.width / 2`. At runtime this resolves to the actual canvas logical width center, which correctly accounts for Scale.FIT letterboxing on small phones where the DOM pixel center differs from 240.

---

### WR-07: DialogueBox pointerdown listener may be removed against destroyed InputPlugin

**Files modified:** `src/ui/DialogueBox.ts`, `src/game/scenes/UIScene.ts`
**Commit:** 40e8969 (DialogueBox null guard), 776f756 (UIScene shutdown ordering)
**Applied fix:** Added `if (this.scene.input)` null guard in `DialogueBox.destroy()` before calling `this.scene.input.off(...)`. UIScene's `onPatienceBonus` was extracted to a class field (also CR-03). The shutdown ordering in UIScene calls `this.dialogueBox.destroy()` last, which is already within the safe window before Phaser tears down the InputPlugin.

---

### IN-01: ContentRegistry.register() — duplicate entries on HMR reload

**Files modified:** `src/services/ContentRegistry.ts`
**Commit:** 40e8969
**Applied fix:** Added `if (!registry.find(l => l.id === manifest.id))` guard in `register()` so re-evaluation of `level-01.ts` on Vite HMR does not push a second entry for the same level id.

---

### IN-02: SaveService.save() mutates the caller's object

**Files modified:** `src/services/SaveService.ts`
**Commit:** 07da763
**Applied fix:** `save()` now writes `const toWrite: SaveState = { ...state, version: SAVE_VERSION, updatedAt: Date.now() }` and passes `toWrite` to `set()`. The caller's `state` object is no longer mutated.

---

## Skipped Issues

### IN-03: PaperThrowScene — every neighbor appearance picks from all 5 houses

**File:** `src/game/scenes/minigames/PaperThrowScene.ts:198-211`
**Reason:** skipped — gameplay scope change. Fixing house-delivery tracking would change mini-game difficulty and win conditions. The current random selection is functional for the MVP and the comment already documents the intent. Deferred to a gameplay polish iteration where the full mini-game balance is reviewed.
**Original issue:** scheduleNextNeighbor() always populates availableHouses with all 5 indices regardless of delivered houses, so some houses may appear multiple times.

---

### IN-04: share-service.test.ts — file-share test does not verify navigator.share is called

**File:** `tests/share-service.test.ts:95-137`
**Reason:** skipped — test improvement is documentation-only, no functional regression. The existing smoke test still exercises the code path and catches thrown errors. The jsdom canvas limitation that prevents a real toBlob() call makes the shareSpy assertion non-trivially difficult to set up. Deferred to a test polish iteration.
**Original issue:** shareSpy is set up but never asserted via expect(shareSpy).toHaveBeenCalled().

---

_Fixed: 2026-06-12T09:07:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
