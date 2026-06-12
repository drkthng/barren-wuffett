---
phase: 02-level-1-offline-playable
reviewed: 2026-06-12T00:00:00Z
depth: standard
files_reviewed: 25
files_reviewed_list:
  - index.html
  - public/locales/en/common.json
  - src/data/dialogue/en/level-01.json
  - src/data/levels/level-01.ts
  - src/entities/NPC.ts
  - src/entities/Player.ts
  - src/events/GameEvents.ts
  - src/game/main.ts
  - src/game/scenes/BossScene.ts
  - src/game/scenes/MainMenu.ts
  - src/game/scenes/OverworldScene.ts
  - src/game/scenes/Preloader.ts
  - src/game/scenes/UIScene.ts
  - src/game/scenes/minigames/PaperThrowScene.ts
  - src/input/InputBus.ts
  - src/services/ContentRegistry.ts
  - src/services/SaveService.ts
  - src/services/ShareService.ts
  - src/systems/TriggerSystem.ts
  - src/ui/DialogueBox.ts
  - src/ui/HUD.ts
  - src/ui/ShareCard.ts
  - tests/dialogue.test.ts
  - tests/input-bus.test.ts
  - tests/og-tags.test.ts
  - tests/save-service.test.ts
  - tests/share-service.test.ts
findings:
  critical: 8
  warning: 7
  info: 4
  total: 19
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-06-12T00:00:00Z
**Depth:** standard
**Files Reviewed:** 25
**Status:** issues_found

## Summary

Phase 2 covers overworld tilemap, NPC dialogue, pause, IndexedDB save, paper-throw mini-game, two-phase boss fight, and share card. The architecture is coherent and the key pitfalls (iOS gesture stack for share, WebGL snapshot anti-pattern, phantom-input from sleeping scenes) are explicitly tracked in comments. However, eight blockers were found:

- Two `async create()` lifecycle bugs allow Phaser's `update()` to run before scene construction completes, causing null-dereference crashes.
- A Phaser `repeat:` off-by-one causes `PaperThrowScene` to call `beginGame()` twice and `BossScene` to fire one extra panic countdown tick.
- `GameEvents.off(eventName)` called without `fn`/`context` arguments strips ALL global listeners for those events, not just the calling scene's — a global listener-removal anti-pattern that silently breaks event routing after any scene shutdown.
- `UIScene.showLevelComplete()` never stops UIScene itself before returning to MainMenu, leaving the scene (and all its event listeners) alive as a zombie overlay.
- `SaveService.load()` passes malformed saves with `version >= 1` but missing required fields directly to the caller, causing potential crashes on first load after a corrupted write.
- `OverworldScene.buildSaveState()` hardcodes `journalUnlocked: []`, permanently discarding any journal state on every save.
- The tileset spritesheet is loaded at 16×16 frame dimensions while the tilemap expects 32×32 tiles, producing incorrect tile rendering.

---

## Critical Issues

### CR-01: `async create()` in OverworldScene — Phaser calls `update()` before construction completes

**File:** `src/game/scenes/OverworldScene.ts:88`

**Issue:** `create()` is declared `async` and immediately `await`s `SaveService.load()`. Phaser does not await the returned Promise; it calls `update()` on the next frame tick. If `update()` fires before the `await` resolves, `this.player` is `undefined` (the `!` assertion has not been fulfilled), causing a TypeError crash at `this.player.update()` (line 200) and `this.player.sprite` (line 205, 219, 229). The joystick dynamic import at line 148 introduces a second async gap with the same race.

**Fix:** Remove `async` from `create()`. Load save state synchronously via a cached value, or block the scene's progress through Phaser's event queue using a pre-load/init phase:

```typescript
// In init() (called synchronously before create):
async init(): Promise<void> {
    this._savedState = await SaveService.load();
}

// create() remains synchronous, reads this._savedState
create(): void {
    const saved = this._savedState;
    // ...
}
```

Alternatively, load the save in the Preloader scene and pass it as scene `data`.

---

### CR-02: `async create()` in BossScene — dialogue data race

**File:** `src/game/scenes/BossScene.ts:78`

**Issue:** `BossScene.create()` is also `async`. It `await`s a dynamic `import()` for dialogue JSON, then schedules `beginGreedPhase()` via `this.time.delayedCall(1000, ...)`. Phaser fires `update()` on the next frame — before the import resolves — and the 1-second `delayedCall` begins counting. If the module import takes longer than the delayedCall fires (unlikely for a bundled asset but non-zero risk in slow environments), `this.dialogueData` is already `{}` and `beginGreedPhase()` runs without offer text, showing raw keys ("boss_greed_01") instead of localised lines.

More critically, `create()` being `async` means any code after the first `await` runs in a microtask, outside Phaser's lifecycle. Objects added to the scene after the microtask boundary (lines 90–213) may not be correctly registered in Phaser's display list in all configurations.

**Fix:** Pre-bundle and statically import the dialogue JSON (it is already bundled in UIScene.ts):

```typescript
import dialogueData from '../../data/dialogue/en/level-01.json';

// In create() (now synchronous):
create(): void {
    this.dialogueData = dialogueData as Record<string, unknown>;
    // ...
}
```

---

### CR-03: `GameEvents.off(eventName)` removes ALL global listeners — event-bus teardown anti-pattern

**File:** `src/game/scenes/OverworldScene.ts:413`, `src/game/scenes/UIScene.ts:379-384`

**Issue:** Phaser's `EventEmitter.off(event)` called with only the event name and no `fn` or `context` removes every listener registered for that event on the emitter — across all scenes. `OverworldScene.shutdown()` calls `GameEvents.off(Events.DIALOGUE_COMPLETE)`, which also removes UIScene's `onDialogueComplete` listener. UIScene's `shutdown()` calls `GameEvents.off` for six events, including BOSS_DEFEATED and PAUSE_REQUESTED — removing any listeners other objects may have added. If UIScene restarts (e.g., after return from Settings), it re-registers, but mid-flow teardown silently breaks the event chain.

**Fix:** Always pass `fn` and `context` to `.off()` to remove only this instance's listener:

```typescript
// OverworldScene.shutdown():
GameEvents.off(Events.DIALOGUE_COMPLETE, this.onDialogueComplete, this);
this.game.events.off(Phaser.Core.Events.HIDDEN, this._hiddenHandler, this);

// UIScene.shutdown():
GameEvents.off(Events.DIALOGUE_START,    this.onDialogueStart,    this);
GameEvents.off(Events.DIALOGUE_COMPLETE, this.onDialogueComplete, this);
GameEvents.off(Events.PAUSE_REQUESTED,   this.onPauseRequested,   this);
GameEvents.off(Events.RESUME_REQUESTED,  this.onResumeRequested,  this);
GameEvents.off(Events.BOSS_DEFEATED,     this.onBossDefeated,     this);
// For the lambda PATIENCE_BONUS listener, store the handler in a class field first
```

Note: `onDialogueStart` in UIScene is already an arrow class field, so `this` is stable. The `PATIENCE_BONUS` listener (UIScene line 68) is an inline lambda — store it as a class field before calling `.on()` so it can be passed to `.off()`.

---

### CR-04: `UIScene.showLevelComplete()` — UIScene is never stopped; remains as zombie overlay on MainMenu

**File:** `src/game/scenes/UIScene.ts:324-335`

**Issue:** `continueBtn`'s `pointerdown` handler stops OverworldScene/BossScene/PaperThrowScene and calls `this.scene.start('MainMenu')`. UIScene itself is never stopped. Since UIScene was launched as a parallel scene above OverworldScene (via `this.scene.launch('UIScene')`), it remains active after MainMenu starts. UIScene's six `GameEvents.on` subscriptions, its DialogueBox pointer listener, and its HUD container remain alive. If the player then starts a new game, a second UIScene is launched, resulting in duplicate listeners and double-advancing dialogue.

**Fix:** Stop UIScene explicitly before starting MainMenu:

```typescript
continueBtn.on('pointerdown', () => {
    continueBtn.setAlpha(0.7);
    this.time.delayedCall(100, () => {
        ['OverworldScene', 'BossScene', 'PaperThrowScene'].forEach(key => {
            if (this.scene.get(key)?.scene.isActive() || this.scene.get(key)?.scene.isPaused()) {
                this.scene.stop(key);
            }
        });
        this.scene.stop('UIScene'); // ← stop self
        this.scene.start('MainMenu');
    });
});
```

---

### CR-05: `PaperThrowScene` — Phaser `repeat: N` fires `N+1` times; `beginGame()` called twice

**File:** `src/game/scenes/minigames/PaperThrowScene.ts:143-156`

**Issue:** Phaser's `time.addEvent({ repeat: N })` fires the callback `N + 1` times (once on first trigger plus N repeats). `startCountdown()` uses `repeat: COUNTDOWN_START` (= 3), so the callback fires 4 times. `remaining` decrements: 3→2 (shows "2"), 3→1 (shows "1"), 3→0 (calls `beginGame()`), 3→-1 (calls `beginGame()` again because `-1 <= 0`). The second `beginGame()` call creates a second `gameTimer` and calls `scheduleNextNeighbor()` a second time, causing two simultaneous neighbor cycles and a doubled game-clock tick.

**Fix:** Use `repeat: COUNTDOWN_START - 1` so the timer fires exactly 3 times, or use a different strategy:

```typescript
this.countdownTimer = this.time.addEvent({
    delay: 1000,
    repeat: COUNTDOWN_START - 1,  // fires COUNTDOWN_START times total
    callback: () => {
        remaining -= 1;
        if (remaining > 0) {
            this.countdownText.setText(t('minigame.ready').replace('{n}', String(remaining)));
        } else {
            this.countdownTimer = null;
            this.beginGame();
        }
    },
});
```

Additionally, add a guard in `beginGame()`:

```typescript
private beginGame(): void {
    if (this.phase !== 'instructions') return;
    // ...
}
```

---

### CR-06: `BossScene` panic timer — `repeat: PANIC_DURATION_S` fires one extra tick; `handlePanicExpiry` invoked with `panicCountdown = -1`

**File:** `src/game/scenes/BossScene.ts:331-341`

**Issue:** Same Phaser `repeat: N` semantics as CR-05. `repeat: PANIC_DURATION_S` (= 3) fires 4 times. The countdown runs: 3→2, 2→1, 1→0 (expiry called, timer removed), 0→-1. The timer is removed inside `handlePanicExpiry()` at the 3rd callback — but since `repeat` means 3 additional fires after the first, the 4th callback may still execute depending on Phaser's event ordering within the same clock tick. The `if (this.phase !== 'panic') return` guard in `handlePanicExpiry` may prevent a double-expiry if the first call transitions phase, but `handlePanicExpiry()` does NOT change `this.phase` — it calls `beginGreedPhase()` which sets `this.phase = 'greed'`. If the 4th callback fires after `beginGreedPhase()` has already reset state, the re-call of `handlePanicExpiry` is blocked by the phase guard. The real risk is the timer text briefly displaying negative seconds (`Math.max(0, ...)` masks it visually, but the logic is fragile).

**Fix:**

```typescript
this.panicTimer = this.time.addEvent({
    delay: 1000,
    repeat: PANIC_DURATION_S - 1,  // fires PANIC_DURATION_S times total
    callback: () => { /* ... */ },
});
```

---

### CR-07: `SaveService.load()` — malformed save with `version >= SAVE_VERSION` but missing fields is returned raw

**File:** `src/services/SaveService.ts:58-66`

**Issue:** `load()` only calls `migrate()` when `raw.version < SAVE_VERSION`. If a save was written with `version === 1` but is structurally incomplete (e.g., corrupted write, missing `position` or `flags` fields), the raw object is returned directly. `OverworldScene` accesses `saved.coins`, `saved.flags`, `saved?.position?.x` — if `flags` is `undefined`, the spread `{ ...this.flags }` in `buildSaveState()` will throw at line 388 when saving next.

**Fix:** Always run validation (not just migration) on load, regardless of version:

```typescript
async load(): Promise<SaveState | undefined> {
    try {
        const raw = await get<unknown>('slot_1', store);
        if (!raw || typeof raw !== 'object') return undefined;
        const partial = raw as Partial<SaveState>;
        // Always migrate to ensure all required fields are present
        if (typeof partial.version !== 'number' || partial.version < SAVE_VERSION) {
            return migrate(partial);
        }
        return migrate(partial); // validate shape even for current version
    } catch {
        return undefined;
    }
},
```

---

### CR-08: `OverworldScene.buildSaveState()` — `journalUnlocked` is always `[]`, erasing journal progress

**File:** `src/game/scenes/OverworldScene.ts:389`

**Issue:** `buildSaveState()` returns `journalUnlocked: []` unconditionally. The `LevelManifest` defines `journalUnlock: 'journal_01_patience'`, which presumably should be added to the unlocked list when the boss is defeated. Every call to `SaveService.save(this.buildSaveState())` — including the boss-defeat autosave — overwrites any previously unlocked journals with an empty array.

**Fix:** Track journal unlocks in an `OverworldScene` instance field and include it in the save state:

```typescript
private journalUnlocked: string[] = [];

// In enterBoss() BOSS_DEFEATED handler:
if (!this.journalUnlocked.includes(LEVEL_01_MANIFEST.journalUnlock)) {
    this.journalUnlocked.push(LEVEL_01_MANIFEST.journalUnlock);
}

// In buildSaveState():
journalUnlocked: [...this.journalUnlocked],
```

---

## Warnings

### WR-01: Tileset `frameWidth/Height` (16px) does not match tilemap `tileWidth/Height` (32px)

**File:** `src/game/scenes/Preloader.ts:76-78`, `src/game/scenes/OverworldScene.ts:100-103`

**Issue:** Preloader loads `omaha_tiles` as a spritesheet with `frameWidth: 16, frameHeight: 16`. OverworldScene creates the tilemap with `tileWidth: 32, tileHeight: 32`. Phaser's `createLayer()` uses the tileset frame size (16px) for tile frame lookup; the tilemap data uses 32px grid spacing. The result is tiles drawn at 16px frames into 32px grid cells — the map appears to use wrong tiles or looks scaled incorrectly. The camera bounds calculation `MAP_DATA[0].length * 32` is also inconsistent with actual frame rendering.

**Fix:** Align the frame dimensions. If the actual tile art is 32×32, load accordingly:

```typescript
this.load.spritesheet('omaha_tiles', 'assets/tilesets/omaha_tiles.png', {
    frameWidth: 32, frameHeight: 32,
});
```

If tile art is 16×16, adjust the tilemap `tileWidth/tileHeight` to 16 and update all pixel-coordinate calculations.

---

### WR-02: `GameEvents.on(DIALOGUE_START, asyncHandler)` — unhandled async rejection

**File:** `src/game/scenes/UIScene.ts:63`, `src/game/scenes/UIScene.ts:75`

**Issue:** `onDialogueStart` is an `async` arrow function registered via `GameEvents.on(Events.DIALOGUE_START, this.onDialogueStart, this)`. Phaser's EventEmitter calls the listener synchronously and discards the returned Promise. If `loadDialogue()` throws (e.g., JSON parse error, module not found), the rejection is unhandled. No error reaches the player or any fallback path.

**Fix:** Wrap in a try/catch and emit a safe fallback:

```typescript
private onDialogueStart = async (data: { npcId: string; dialogueKey: string }): Promise<void> => {
    try {
        this.setState('DIALOGUE');
        const allDialogue = await loadDialogue();
        const lines = allDialogue[data.dialogueKey];
        if (Array.isArray(lines)) {
            this.dialogueBox.show(data.npcId, lines as DialogueLine[]);
        } else {
            // Key not found — close immediately so game is not stuck
            GameEvents.emit(Events.DIALOGUE_COMPLETE, { npcId: data.npcId });
        }
    } catch {
        this.setState('HUD');
    }
};
```

---

### WR-03: `UIScene` import assertion `assert: { type: 'json' }` — non-standard syntax, not supported by all bundlers

**File:** `src/game/scenes/UIScene.ts:34-36`

**Issue:** `UIScene.ts` uses the Import Assertions syntax (`assert: { type: 'json' }`). This is Stage 3 at best and is not supported by all bundlers (Vite treats it as a hint only; Webpack and esbuild may warn or fail). The same file imports elsewhere without the assertion. `BossScene.ts` imports the same JSON without the assertion. The inconsistency could silently produce different module instances in some bundlers.

**Fix:** Use a consistent import pattern. Since the project uses Vite (inferred from the `type="module"` in index.html), the assertion is harmless but noisy. Remove it for consistency:

```typescript
const mod = await import('../../data/dialogue/en/level-01.json') as {
    default: Record<string, DialogueLine[] | string>
};
```

---

### WR-04: `shareCard()` fallback path breaks iOS gesture requirement when Blob cache is cold

**File:** `src/services/ShareService.ts:86-94`

**Issue:** The iOS Web Share API requires `navigator.share()` to be called in the synchronous user-gesture call stack (no `await` between the tap event and the `share()` call). `shareCard()` has two code paths: (a) cached Blob → calls `navigator.share()` immediately (correct), (b) no cached Blob → `await takeSnapshot()` then `await canvasToBlob()` then `navigator.share()` (breaks iOS). The cache can be cold if `prepareShareCard()` failed silently (the `void prepareShareCard(...)` call in BossScene discards errors), or if the share button is tapped before the async cache fill completes.

The fire-and-forget comment at BossScene line 378 ("the 1s delayedCall gives enough time") is a timing assumption, not a guarantee.

**Fix:** In the fallback path, skip `navigator.share()` entirely and go straight to the download anchor (which does not require a gesture context), or surface a visual indicator when the cache is not ready:

```typescript
export async function shareCard(game: PhaserGame, quote: string): Promise<void> {
    let blob = (_cachedBlob !== null && _cachedQuote === quote) ? _cachedBlob : null;
    if (!blob) {
        // Cache miss — only download fallback is safe (no async before share on iOS)
        blob = await (async () => {
            const img    = await takeSnapshot(game);
            const canvas = renderShareCard(img, quote, null);
            return canvasToBlob(canvas);
        })();
        if (!blob) return;
        // Fall through directly to download — do NOT attempt navigator.share
        const url = URL.createObjectURL(blob);
        const a   = Object.assign(document.createElement('a'), {
            href: url, download: 'barren-wuffett-victory.png',
        });
        a.click();
        URL.revokeObjectURL(url);
        return;
    }
    // Cached path: safe to call navigator.share synchronously
    // ...
}
```

---

### WR-05: `OverworldScene` HIDDEN event handler registered without a stored reference — cannot be removed precisely

**File:** `src/game/scenes/OverworldScene.ts:180`, `src/game/scenes/OverworldScene.ts:414`

**Issue:** `this.game.events.on(Phaser.Core.Events.HIDDEN, () => { void SaveService.save(...) })` registers an inline lambda. `shutdown()` calls `this.game.events.off(Phaser.Core.Events.HIDDEN)` — without fn/context, this removes ALL HIDDEN listeners on the game's event bus, including any from other scenes or plugins. Additionally, because the lambda is not stored, passing it to `.off()` for precise removal is impossible.

**Fix:** Store the handler as a class field:

```typescript
private _onHidden = (): void => { void SaveService.save(this.buildSaveState()); };

// In create():
this.game.events.on(Phaser.Core.Events.HIDDEN, this._onHidden, this);

// In shutdown():
this.game.events.off(Phaser.Core.Events.HIDDEN, this._onHidden, this);
```

---

### WR-06: Pause-confirm YES/NO hit zone uses raw pointer X — broken at non-default scale

**File:** `src/game/scenes/UIScene.ts:191-199`

**Issue:** The confirm "YES/NO" split uses `pointer.x < 240` (canvas center) to decide YES vs NO. `pointer.x` in Phaser is the raw DOM/canvas pixel coordinate, which does not account for `Scale.FIT` letterboxing. When the game is scaled down on a small phone (e.g., 320-wide), the canvas center in DOM pixels may not be 240. The player may consistently tap YES thinking they're tapping NO, or vice versa.

**Fix:** Use `this.cameras.main.getWorldPoint(pointer.x, pointer.y)` or compare against the canvas width at runtime:

```typescript
const canvasCenterX = this.scale.width / 2;
if (pointer.x < canvasCenterX) {
    // YES
}
```

---

### WR-07: `DialogueBox` registered `pointerdown` listener on scene input — not removed if scene is stopped mid-dialogue

**File:** `src/ui/DialogueBox.ts:120`, `src/ui/DialogueBox.ts:192`

**Issue:** `DialogueBox.show()` calls `this.scene.input.on('pointerdown', this.handlePointerDown, this)`. `close()` removes it. But if UIScene is stopped (e.g., by the quit-to-menu path while dialogue is open), `destroy()` is called from `UIScene.shutdown()`. `destroy()` does remove the listener. However, if the scene's `InputPlugin` is destroyed before `DialogueBox.destroy()` is called, `this.scene.input.off(...)` will reference a destroyed plugin. Phaser's shutdown order is: `shutdown()` called → scene systems destroyed → so the `shutdown()` call chain is safe only if `DialogueBox.destroy()` is invoked within `UIScene.shutdown()` before the input plugin is torn down. The current code calls it last (line 385 of UIScene), which should be safe, but the ordering is fragile.

**Fix:** Add a `isDestroyed` guard in `DialogueBox.destroy()` and move its call earlier in `UIScene.shutdown()`:

```typescript
destroy(): void {
    this.stopTimers();
    if (this.scene.input) {
        this.scene.input.off('pointerdown', this.handlePointerDown, this);
    }
}
```

---

## Info

### IN-01: `ContentRegistry.register()` called at module load time — duplicate entries on HMR reload

**File:** `src/data/levels/level-01.ts:62`

**Issue:** `ContentRegistry.register(LEVEL_01_MANIFEST)` runs at module evaluation time. The `registry` array is a module-level singleton. During Vite HMR (hot module reload in development), the module can re-evaluate and push a second identical entry. `ContentRegistry.getLevel()` uses `find()` which returns the first match, so functional impact is low, but it produces stale duplicates and could cause confusion in debugging.

**Fix:** Guard against duplicate registration:

```typescript
register: (manifest: LevelManifest): void => {
    if (!registry.find(l => l.id === manifest.id)) {
        registry.push(manifest);
    }
},
```

---

### IN-02: `SaveService.save()` mutates the caller's object

**File:** `src/services/SaveService.ts:50-51`

**Issue:** `save(state)` sets `state.version` and `state.updatedAt` on the passed object. Since `buildSaveState()` always creates a fresh object this is benign today, but it is a latent bug for any future caller that passes a retained reference and does not expect mutation.

**Fix:** Mutate a shallow copy:

```typescript
async save(state: SaveState): Promise<void> {
    try {
        const toWrite: SaveState = { ...state, version: SAVE_VERSION, updatedAt: Date.now() };
        await set('slot_1', toWrite, store);
    } catch { /* silent */ }
},
```

---

### IN-03: `PaperThrowScene` — every neighbor appearance always picks from all 5 houses, ignoring already-delivered houses

**File:** `src/game/scenes/minigames/PaperThrowScene.ts:198-211`

**Issue:** `scheduleNextNeighbor()` populates `availableHouses` with all indices 0–4 every call, regardless of which houses have already received a delivery. The comment says "prefer houses not already delivered to" but no tracking actually occurs. This means some houses may appear multiple times while others never appear, and `TOTAL_HOUSES` deliveries may never be reachable within the time limit.

**Fix:** Track delivered houses and exclude them from future selections, or use a shuffle of all houses.

---

### IN-04: `share-service.test.ts` file-share test does not actually verify `navigator.share` is called

**File:** `tests/share-service.test.ts:95-137`

**Issue:** The "file-share path" test patches `navigator.canShare` to return `true` and patches `navigator.share` with a spy, but then comments "Since jsdom's canvas.toBlob() never fires, we verify the CODE PATH is correct by checking the source rather than behavior." The test then calls `shareCard()` and asserts only `resolves.not.toThrow()` — `shareSpy` is never asserted (no `expect(shareSpy).toHaveBeenCalled()`). The spy is set up but never verified, providing no coverage of the file-share branch. The comment acknowledges the limitation but the test is misleadingly described as testing the "file-share path."

**Fix:** Either rename the test to reflect it is a smoke test only, or inject a pre-cached Blob via `prepareShareCard` with a mocked `toBlob` to force the share path and assert `shareSpy.toHaveBeenCalled()`.

---

_Reviewed: 2026-06-12T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
