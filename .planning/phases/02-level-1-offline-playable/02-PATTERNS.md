# Phase 2: Level 1 — Offline Playable - Pattern Map

**Mapped:** 2026-06-12
**Files analyzed:** 20 new/modified files
**Analogs found:** 17 / 20

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/game/scenes/OverworldScene.ts` | scene | event-driven | `src/game/scenes/MainMenu.ts` | role-match |
| `src/game/scenes/UIScene.ts` | scene (overlay) | event-driven | `src/game/scenes/Settings.ts` | role-match |
| `src/game/scenes/BossScene.ts` | scene | event-driven | `src/game/scenes/MainMenu.ts` | role-match |
| `src/game/scenes/minigames/PaperThrowScene.ts` | scene | event-driven | `src/game/scenes/MainMenu.ts` | role-match |
| `src/game/scenes/Preloader.ts` | scene (modify) | request-response | `src/game/scenes/Preloader.ts` | exact |
| `src/game/scenes/MainMenu.ts` | scene (modify) | request-response | `src/game/scenes/MainMenu.ts` | exact |
| `src/game/main.ts` | config (modify) | — | `src/game/main.ts` | exact |
| `src/services/SaveService.ts` | service | CRUD | `src/services/AudioService.ts` | role-match |
| `src/services/ShareService.ts` | service | file-I/O | `src/services/AudioService.ts` | partial |
| `src/services/ContentRegistry.ts` | service (modify) | CRUD | `src/services/ContentRegistry.ts` | exact |
| `src/input/InputBus.ts` | utility (modify) | event-driven | `src/input/InputBus.ts` | exact |
| `src/entities/Player.ts` | entity | event-driven | `src/game/scenes/MainMenu.ts` | partial |
| `src/entities/NPC.ts` | entity | event-driven | `src/game/scenes/MainMenu.ts` | partial |
| `src/systems/TriggerSystem.ts` | utility | event-driven | none | no analog |
| `src/ui/DialogueBox.ts` | ui component | event-driven | `src/game/scenes/Settings.ts` | partial |
| `src/ui/HUD.ts` | ui component | event-driven | `src/game/scenes/Settings.ts` | partial |
| `src/ui/ShareCard.ts` | ui component | file-I/O | none | no analog |
| `src/events/GameEvents.ts` | utility | pub-sub | none | no analog |
| `src/data/levels/level-01.ts` | data | — | `src/services/ContentRegistry.ts` | partial |
| `src/data/dialogue/en/level-01.json` | data | — | `public/locales/en/common.json` | partial |
| `public/locales/en/common.json` | data (modify) | — | `public/locales/en/common.json` | exact |
| `tests/save-service.test.ts` | test | — | `tests/audio-persistence.test.ts` | exact |
| `tests/input-bus.test.ts` | test | — | `tests/audio-persistence.test.ts` | role-match |
| `tests/dialogue.test.ts` | test | — | `tests/content-registry.test.ts` | role-match |
| `tests/og-tags.test.ts` | test | — | `tests/i18n.test.ts` | role-match |
| `tests/share-service.test.ts` | test | — | `tests/audio-persistence.test.ts` | role-match |

---

## Pattern Assignments

### `src/game/scenes/OverworldScene.ts` (scene, event-driven)

**Analog:** `src/game/scenes/MainMenu.ts`

**Imports pattern** (MainMenu.ts lines 1-2):
```typescript
import { Scene } from 'phaser';
import { t } from '../../services/i18n';
// Phase 2 additions:
import { Action } from '../../input/InputBus';
import { GameEvents, Events } from '../../events/GameEvents';
import { SaveService } from '../../services/SaveService';
```

**Scene class structure** (MainMenu.ts lines 4-9):
```typescript
export class OverworldScene extends Scene {
    // Declare private fields for Phaser objects before constructor
    private joystick: unknown | null = null;   // VirtualJoystick from rex plugins
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
    private player!: Player;

    constructor() {
        super('OverworldScene');   // string key matches main.ts scene array
    }

    create(): void { ... }
    update(): void { ... }
    shutdown(): void { ... }   // mirror MainMenu.shutdown() for timer cleanup
}
```

**Timer / blink pattern** (MainMenu.ts lines 40-46) — reuse for dog patrol and interaction prompt blink:
```typescript
this.blinkTimer = this.time.addEvent({
    delay: 500,
    loop: true,
    callback: () => {
        tapText.setVisible(!tapText.visible);
    }
});
```

**shutdown() cleanup** (MainMenu.ts lines 111-116):
```typescript
shutdown(): void {
    if (this.blinkTimer) {
        this.blinkTimer.remove();
        this.blinkTimer = null;
    }
}
```

**Interactive hit-area extension to WCAG 44px** (MainMenu.ts lines 57-65):
```typescript
impressumText.setInteractive(
    new Phaser.Geom.Rectangle(
        -Math.max(impressumText.width, 80) / 2,
        -22,
        Math.max(impressumText.width, 80),
        44
    ),
    Phaser.Geom.Rectangle.Contains
);
```

**pointerdown handler** (MainMenu.ts lines 105-108):
```typescript
tapText.once('pointerdown', () => {
    this.sound.unlock();
    this.scene.start('Settings');
});
```

---

### `src/game/scenes/UIScene.ts` (scene overlay, event-driven)

**Analog:** `src/game/scenes/Settings.ts`

**Imports pattern** (Settings.ts lines 1-3):
```typescript
import { Scene } from 'phaser';
import { t } from '../../services/i18n';
import { AudioService } from '../../services/AudioService';
// Phase 2 additions:
import { GameEvents, Events } from '../../events/GameEvents';
```

**Container pattern for composite UI elements** (Settings.ts lines 127-159):
```typescript
// Container combines block + label at (x, y)
const container = this.add.container(x, y, [block, label]);
container.setSize(44, 44);
container.setInteractive({ useHandCursor: true });
container.on('pointerdown', () => {
    enabled = !enabled;
    block.setFillStyle(enabled ? 0x00ff88 : 0x16213e);
    label.setText(enabled ? ` ${t('audio.on')}` : ` ${t('audio.off')}`);
    label.setColor(enabled ? '#00ff88' : '#e8e8e8');
    onChange(enabled);
});
```

**Text style object — reuse this exact shape for all text in UIScene**:
```typescript
{
    fontSize: '8px',      // body — use '16px' for heading, '24px' for display
    color: '#e8e8e8',
    fontFamily: '"Press Start 2P", monospace',
}
// With word wrap (dialogue text):
{
    fontSize: '8px',
    color: '#e8e8e8',
    fontFamily: '"Press Start 2P", monospace',
    wordWrap: { width: 388, useAdvancedWrap: true },
}
```

**Rectangle panel fill + stroke** (Preloader.ts line 30):
```typescript
this.add.rectangle(cx, 420, 302, 14, 0x16213e).setStrokeStyle(2, 0xe8e8e8);
```

---

### `src/game/scenes/BossScene.ts` (scene, event-driven)

**Analog:** `src/game/scenes/MainMenu.ts`

Follows the same scene class skeleton as OverworldScene above. Key differences:
- Constructor key: `super('BossScene')`
- No tilemap; no physics collider
- Background tint Rectangle rendered at depth 0

**Phase tint rectangle** (from UI-SPEC + Preloader.ts fill pattern):
```typescript
// In BossScene.create()
const tintRect = this.add.rectangle(0, 0, 480, 854, 0xff4444)
    .setOrigin(0, 0)
    .setAlpha(0)
    .setDepth(0);
// Tween to alpha 0.15 on phase start:
this.tweens.add({ targets: tintRect, alpha: 0.15, duration: 500 });
```

**Event emission on scene complete** (mirrors scene.start() in MainMenu.ts line 107):
```typescript
// BossScene — emit defeat event instead of transitioning directly
GameEvents.emit(Events.BOSS_DEFEATED, { patienceBonus: this.patienceCount });
```

---

### `src/game/scenes/minigames/PaperThrowScene.ts` (scene, event-driven)

**Analog:** `src/game/scenes/MainMenu.ts`

Constructor key: `super('PaperThrowScene')`. Follows same skeleton. Timer-based countdown uses the blink-timer pattern from MainMenu.ts lines 40-46.

**Mini-game completion** (mirrors BossScene emit pattern):
```typescript
GameEvents.emit(Events.MINIGAME_COMPLETE, { score: this.deliveries, perfect: this.perfect });
```

---

### `src/game/scenes/Preloader.ts` (scene, modify)

**Analog:** `src/game/scenes/Preloader.ts` (exact — extend the preload() method)

**Existing load.image pattern** (Preloader.ts line 63):
```typescript
this.load.image('logo', 'assets/images/logo.png');
```

**Phase 2 additions follow the same pattern:**
```typescript
// After existing this.load.image('logo', ...) call:
this.load.image('player',          'assets/images/player.png');
this.load.image('npc_grandpa',     'assets/images/npc_grandpa.png');
this.load.image('npc_store_clerk', 'assets/images/npc_store_clerk.png');
this.load.image('npc_rival',       'assets/images/npc_rival.png');
this.load.image('boss_mr_market',  'assets/images/boss_mr_market.png');
this.load.image('dog',             'assets/images/dog.png');
this.load.image('coin',            'assets/images/coin.png');
this.load.image('ui_save',         'assets/images/ui_save.png');
this.load.image('ui_pause',        'assets/images/ui_pause.png');
this.load.image('barren_victory',  'assets/images/barren_victory.png');
this.load.image('bw_monogram',     'assets/images/bw_monogram.png');
this.load.spritesheet('omaha_tiles', 'assets/tilesets/omaha_tiles.png', {
    frameWidth: 16, frameHeight: 16
});
```

---

### `src/game/main.ts` (config, modify)

**Analog:** `src/game/main.ts` (exact)

**Existing scene array** (main.ts line 23):
```typescript
scene: [Boot, Preloader, MainMenu, Settings],
```

**Phase 2 — add all new scenes in correct boot order:**
```typescript
import { OverworldScene }   from './scenes/OverworldScene';
import { UIScene }          from './scenes/UIScene';
import { BossScene }        from './scenes/BossScene';
import { PaperThrowScene }  from './scenes/minigames/PaperThrowScene';

// In config:
scene: [Boot, Preloader, MainMenu, Settings, OverworldScene, UIScene, BossScene, PaperThrowScene],
```

UIScene must be listed after OverworldScene so it renders on top (Phaser renders scenes in array order, later = higher).

---

### `src/services/SaveService.ts` (service, CRUD)

**Analog:** `src/services/AudioService.ts`

**Module structure — plain TS, no Phaser dependency** (AudioService.ts lines 1-35):
```typescript
// Top of file: constants before export object
const KEYS = {
    music: 'bw_music_on',
    sfx:   'bw_sfx_on',
} as const;

// Helper functions (not exported)
function safeGet(key: string): string | null {
    try { return localStorage.getItem(key); }
    catch { return null; }
}
function safeSet(key: string, value: string): void {
    try { localStorage.setItem(key, value); }
    catch { /* ignore */ }
}

// Named export object (not a class)
export const AudioService = {
    getMusicEnabled: (): boolean => safeGet(KEYS.music) !== 'false',
    setMusicEnabled: (on: boolean): void => { safeSet(KEYS.music, String(on)); },
};
```

**SaveService adapts this pattern** — replace safeGet/safeSet with idb-keyval async calls; replace the export object with async methods:
```typescript
import { createStore, get, set } from 'idb-keyval';

const store = createStore('bw-saves', 'saves');   // named store (not default)
export const SAVE_VERSION = 1;

export interface SaveState {
    version: number;
    updatedAt: number;
    level: string;
    position: { x: number; y: number };
    flags: Record<string, boolean>;
    coins: number;
    journalUnlocked: string[];
}

export const SaveService = {
    async save(state: SaveState): Promise<void> { ... },
    async load(): Promise<SaveState | undefined> { ... },
};
```

**Error handling** — mirror AudioService's silent-ignore pattern but for async:
```typescript
async save(state: SaveState): Promise<void> {
    try {
        state.version = SAVE_VERSION;
        state.updatedAt = Date.now();
        await set('slot_1', state, store);
    } catch {
        // IndexedDB unavailable (private browsing, quota exceeded) — ignore
    }
},
```

---

### `src/services/ShareService.ts` (service, file-I/O)

**Analog:** `src/services/AudioService.ts` (structure only — plain TS module, named export object)

Module structure mirrors AudioService — no class, named export, no Phaser import at module level. The `shareCard` function accepts `game: Phaser.Game` as a parameter (dependency injection, not an import) so the module stays vitest-importable in node environment.

```typescript
// Named export function (not export object, because this is a single-operation service)
export async function shareCard(game: Phaser.Game, quote: string): Promise<void> {
    // see RESEARCH.md Pattern 6 for full implementation
}
```

---

### `src/services/ContentRegistry.ts` (service, modify)

**Analog:** `src/services/ContentRegistry.ts` (exact)

**Existing registry push pattern** (ContentRegistry.ts lines 19-24):
```typescript
const registry: LevelManifest[] = []; // populated in Phase 2+

export const ContentRegistry = {
    getLevel: (id: string): LevelManifest | undefined => registry.find(l => l.id === id),
    getAllLevels: (): LevelManifest[] => registry,
};
```

**Phase 2 extension — add register() method and push level-01:**
```typescript
// Add to ContentRegistry object:
register: (manifest: LevelManifest): void => { registry.push(manifest); },

// In src/data/levels/level-01.ts — call at module load time:
import { ContentRegistry } from '../../services/ContentRegistry';
ContentRegistry.register(LEVEL_01_MANIFEST);
```

---

### `src/input/InputBus.ts` (utility, modify)

**Analog:** `src/input/InputBus.ts` (exact — extend existing file)

**Existing Action enum** (InputBus.ts lines 8-15):
```typescript
export enum Action {
    MOVE_UP    = 'MOVE_UP',
    MOVE_DOWN  = 'MOVE_DOWN',
    MOVE_LEFT  = 'MOVE_LEFT',
    MOVE_RIGHT = 'MOVE_RIGHT',
    INTERACT   = 'INTERACT',
    PAUSE      = 'PAUSE',
}
```

**Phase 2 additions — add activeActions Set and InputBus export object below the enum:**
```typescript
const activeActions = new Set<Action>();

export const InputBus = {
    isActive: (action: Action): boolean => activeActions.has(action),
    update(
        joystick: { up: boolean; down: boolean; left: boolean; right: boolean } | null,
        cursors: Phaser.Types.Input.Keyboard.CursorKeys | null
    ): void {
        activeActions.clear();
        if (joystick) {
            if (joystick.up)    activeActions.add(Action.MOVE_UP);
            if (joystick.down)  activeActions.add(Action.MOVE_DOWN);
            if (joystick.left)  activeActions.add(Action.MOVE_LEFT);
            if (joystick.right) activeActions.add(Action.MOVE_RIGHT);
        }
        if (cursors) {
            if (cursors.up.isDown)    activeActions.add(Action.MOVE_UP);
            if (cursors.down.isDown)  activeActions.add(Action.MOVE_DOWN);
            if (cursors.left.isDown)  activeActions.add(Action.MOVE_LEFT);
            if (cursors.right.isDown) activeActions.add(Action.MOVE_RIGHT);
        }
    },
    setAction: (action: Action, active: boolean): void => {
        if (active) activeActions.add(action);
        else activeActions.delete(action);
    },
};
```

---

### `src/entities/Player.ts` and `src/entities/NPC.ts` (entities, event-driven)

**Analog:** `src/game/scenes/MainMenu.ts` (partial — class structure only)

Entities are plain TypeScript classes (not Phaser Scenes). They accept the scene as a constructor parameter.

```typescript
import { Scene } from 'phaser';
import { InputBus, Action } from '../input/InputBus';

export class Player {
    readonly sprite: Phaser.Physics.Arcade.Sprite;

    constructor(scene: Scene, x: number, y: number) {
        this.sprite = scene.physics.add.sprite(x, y, 'player');
    }

    update(): void {
        const vx = InputBus.isActive(Action.MOVE_LEFT)  ? -80
                 : InputBus.isActive(Action.MOVE_RIGHT) ?  80 : 0;
        const vy = InputBus.isActive(Action.MOVE_UP)    ? -80
                 : InputBus.isActive(Action.MOVE_DOWN)  ?  80 : 0;
        this.sprite.setVelocity(vx, vy);
    }
}
```

---

### `src/ui/DialogueBox.ts` (ui component, event-driven)

**Analog:** `src/game/scenes/Settings.ts` (Container pattern)

**Container + setInteractive pattern** (Settings.ts lines 127-159):
```typescript
const container = this.add.container(x, y, [block, label]);
container.setSize(44, 44);
container.setInteractive({ useHandCursor: true });
container.on('pointerdown', () => { ... });
```

**Typewriter via Phaser timer** (from RESEARCH.md Pattern 4 — no codebase analog exists; this is the definitive reference):
```typescript
showLine(text: string, onComplete: () => void): void {
    this.textObj.setText('');
    let i = 0;
    const timer = this.scene.time.addEvent({
        delay: 30,
        callback: () => {
            this.textObj.setText(this.textObj.text + text[i++]);
            if (i >= text.length) { timer.destroy(); onComplete(); }
        },
        repeat: text.length - 1
    });
    this.scene.input.once('pointerdown', () => {
        timer.destroy();
        this.textObj.setText(text);
        onComplete();
    });
}
```

**Text style for dialogue** (same shape as Settings.ts, add wordWrap):
```typescript
this.scene.add.text(76, 734, '', {
    fontSize: '8px',
    color: '#e8e8e8',
    fontFamily: '"Press Start 2P", monospace',
    wordWrap: { width: 388, useAdvancedWrap: true },
});
```

---

### `src/ui/HUD.ts` (ui component, event-driven)

**Analog:** `src/game/scenes/Settings.ts`

HUD is a class that takes a UIScene reference and creates Phaser GameObjects in that scene. Follows the same Container pattern used in Settings.ts for grouping related UI elements.

**Scale-up tween for coin increment** (no existing analog — use Phaser tween API):
```typescript
this.scene.tweens.add({
    targets: this.coinText,
    scaleX: 1.2, scaleY: 1.2,
    duration: 75,
    yoyo: true,    // returns to scale 1.0
});
```

---

### `src/events/GameEvents.ts` (utility, pub-sub)

**Analog:** none in codebase. Use Phaser EventEmitter pattern.

```typescript
import Phaser from 'phaser';

export const Events = {
    DIALOGUE_START:      'DIALOGUE_START',
    DIALOGUE_COMPLETE:   'DIALOGUE_COMPLETE',
    PAUSE_REQUESTED:     'PAUSE_REQUESTED',
    RESUME_REQUESTED:    'RESUME_REQUESTED',
    MINIGAME_COMPLETE:   'MINIGAME_COMPLETE',
    BOSS_DEFEATED:       'BOSS_DEFEATED',
    PATIENCE_BONUS:      'PATIENCE_BONUS',
} as const;

export const GameEvents = new Phaser.Events.EventEmitter();
```

This is a plain module-level singleton. Plain TS, no Phaser Scene subclass. Importable in tests (mock Phaser.Events.EventEmitter if needed, or use the real one — it has no DOM dependency).

---

### `src/data/levels/level-01.ts` (data, —)

**Analog:** `src/services/ContentRegistry.ts` (typed interface pattern)

```typescript
import type { LevelManifest } from '../../services/ContentRegistry';
import { ContentRegistry }   from '../../services/ContentRegistry';

export const MAP_DATA: number[][] = [
    [1,1,1,1, ...],
    // ... 26 rows × 15 cols
];

const LEVEL_01_MANIFEST: LevelManifest = {
    id: 'level-01',
    titleKey: 'level.01.title',
    tilemapKey: 'level01_map',
    bgmKey: 'bgm_overworld',
    enemies: [],
    triggers: [
        { zone: 'minigame_trigger', action: 'launch', target: 'PaperThrowScene' },
        { zone: 'boss_trigger',     action: 'launch', target: 'BossScene' },
    ],
    journalUnlock: 'journal_01_patience',
};

ContentRegistry.register(LEVEL_01_MANIFEST);
```

---

### `src/data/dialogue/en/level-01.json` (data, —)

**Analog:** `public/locales/en/common.json` (flat JSON, all-caps values)

All keys use snake_case. All string values are UPPER CASE (matches game's visual style). No English literals in scene code — all strings come from here or common.json.

```json
{
  "npc_grandpa": [
    { "portrait": "npc_grandpa", "text": "PATIENCE, BARREN. THE RIGHT PRICE ALWAYS COMES TO THOSE WHO WAIT." }
  ],
  "npc_store_clerk": [
    { "portrait": "npc_store_clerk", "text": "THAT MR. MARKET FELLOW KEEPS CHANGING HIS PRICES. CAN'T TRUST HIM." }
  ],
  "npc_rival": [
    { "portrait": "npc_rival", "text": "HEY! THAT'S MY ROUTE!" },
    { "portrait": "npc_rival", "text": "MR. MARKET SAYS YOUR PRICES ARE TOO LOW." }
  ],
  "boss_greed_01": [{ "portrait": "boss_mr_market", "text": "I'LL BUY YOUR ROUTE FOR 50 COINS!" }],
  "boss_greed_02": [{ "portrait": "boss_mr_market", "text": "75 COINS. FINAL OFFER. SURELY YOU'LL TAKE IT!" }],
  "boss_greed_03": [{ "portrait": "boss_mr_market", "text": "100 COINS! YOU'RE MAKING A MISTAKE!" }],
  "boss_panic_01": [{ "portrait": "boss_mr_market", "text": "NOBODY WANTS PAPERS! I'LL SELL YOU BACK FOR 20 COINS!" }],
  "boss_01_wisdom_quote": "THE STOCK MARKET IS A DEVICE FOR TRANSFERRING MONEY FROM THE IMPATIENT TO THE PATIENT."
}
```

---

### `public/locales/en/common.json` (data, modify)

**Analog:** `public/locales/en/common.json` (exact — append keys)

**Existing key format** (common.json lines 1-16): flat object, all-caps string values, dot-separated keys.

Add all Phase 2 i18n keys from UI-SPEC.md Copywriting Contract section, following exact same format:

```json
{
  "hud.coins":          "COINS: {n}",
  "hud.talkPrompt":     "TALK",
  "hud.patienceBonus":  "+{n} PATIENCE BONUS",
  "pause.title":        "PAUSED",
  "pause.resume":       "RESUME",
  "pause.settings":     "SETTINGS",
  "pause.quitToMenu":   "QUIT TO MENU",
  "pause.confirmQuit":  "CONFIRM QUIT?",
  "pause.confirmYes":   "YES",
  "pause.confirmNo":    "NO",
  "dialogue.advance":   "▼",
  "boss.mrMarket.name": "MR. MARKET",
  "boss.phase.greed":   "GREED PHASE",
  "boss.phase.panic":   "PANIC PHASE",
  "boss.patienceMeter": "PATIENCE:",
  "boss.decline":       "DECLINE",
  "boss.accept":        "BUY LOW!",
  "boss.timer":         "{n}s",
  "boss.hint.decline":  "DECLINING BUILDS PATIENCE!",
  "boss.patienceFull":  "PATIENCE MAXED!",
  "boss.tooSlow":       "TOO SLOW! THE MARKET RECOVERED!",
  "boss.winFlash":      "BUY LOW!",
  "minigame.score":                  "DELIVERIES: {n}/5",
  "minigame.timer":                  "{n}s",
  "minigame.paperThrow.title":       "PAPER ROUTE!",
  "minigame.paperThrow.instructions":"TAP WHEN THE NEIGHBOR IS AT THEIR DOOR!",
  "minigame.ready":                  "STARTING IN {n}...",
  "minigame.throwNow":               "TAP!",
  "minigame.perfect":                "PERFECT!",
  "minigame.timesUp":                "TIME'S UP!",
  "levelComplete.heading":           "LEVEL COMPLETE",
  "levelComplete.wisdomLabel":       "BARREN'S WISDOM:",
  "levelComplete.attribution":       "— BARREN WUFFETT",
  "levelComplete.share":             "SHARE WISDOM",
  "levelComplete.shareSuccess":      "SHARED!",
  "levelComplete.shareFallback":     "SAVED!",
  "levelComplete.continue":          "CONTINUE",
  "levelComplete.cliffhanger":       "BARREN COUNTED HIS COINS. A FIGURE IN SHADOW HAD WATCHED FROM ACROSS THE STREET. HE WOULD RETURN.",
  "npc.grandpa.name":                "GRANDPA",
  "npc.storeClerk.name":             "STORE CLERK",
  "npc.rival.name":                  "RIVAL NEWSBOY",
  "save.error":                      "SAVE FAILED — PROGRESS NOT STORED"
}
```

Note: `{n}` is a placeholder — the scene must do string replacement (e.g. `t('hud.coins').replace('{n}', String(this.coins))`) since `t()` currently returns the raw string.

---

## Test Pattern Assignments

### `tests/save-service.test.ts` (test, unit)

**Analog:** `tests/audio-persistence.test.ts` (exact — closest match)

**Test file header pattern** (audio-persistence.test.ts lines 1-18):
```typescript
/**
 * Wave 0: [Description of what is tested]
 * Tests [Service] — automated proxy for [acceptance criterion].
 * vitest environment: node — [what doesn't exist in Node].
 * We set up a [mock] before each test group.
 * vi.resetModules() is called in every beforeEach to flush the module
 * registry so each test gets a fresh import.
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
```

**vi.resetModules() + dynamic import pattern** (audio-persistence.test.ts lines 46-55):
```typescript
describe('SaveService — default state', () => {
    beforeEach(() => {
        vi.resetModules();
        installFakeIndexedDB();   // install fake-indexeddb mock into globalThis
    });
    afterEach(() => vi.resetModules());

    it('load() returns undefined when no save exists', async () => {
        const { SaveService } = await import('../src/services/SaveService.js');
        expect(await SaveService.load()).toBeUndefined();
    });
});
```

**Key differences from AudioService test:**
- Uses `fake-indexeddb` npm devDependency instead of a hand-rolled localStorage mock
- All `SaveService` calls are `async` — use `await` in every assertion
- Import path: `'../src/services/SaveService.js'`

---

### `tests/input-bus.test.ts` (test, unit)

**Analog:** `tests/audio-persistence.test.ts` (role-match)

**Mock joystick stub pattern:**
```typescript
beforeEach(() => {
    vi.resetModules();
});
afterEach(() => vi.resetModules());

it('InputBus.isActive(MOVE_UP) returns true after joystick.up = true', async () => {
    const { InputBus, Action } = await import('../src/input/InputBus.js');
    const joystickStub = { up: true, down: false, left: false, right: false };
    InputBus.update(joystickStub, null);
    expect(InputBus.isActive(Action.MOVE_UP)).toBe(true);
    expect(InputBus.isActive(Action.MOVE_DOWN)).toBe(false);
});
```

No real VirtualJoystick needed — InputBus.update() accepts a plain object with boolean properties.

---

### `tests/dialogue.test.ts` (test, unit)

**Analog:** `tests/content-registry.test.ts` (role-match — JSON structure validation)

**JSON import + structure check pattern** (content-registry.test.ts lines 8-38):
```typescript
import { describe, it, expect } from 'vitest';

describe('Level-01 dialogue JSON structure (GAME-05)', () => {
    it('loads level-01 dialogue without error', async () => {
        const mod = await import('../src/data/dialogue/en/level-01.json',
            { assert: { type: 'json' } });
        expect(mod.default).toBeDefined();
    });

    it('contains required NPC keys', async () => {
        const mod = await import('../src/data/dialogue/en/level-01.json',
            { assert: { type: 'json' } });
        const dialogue = mod.default as Record<string, unknown>;
        expect(dialogue).toHaveProperty('npc_grandpa');
        expect(dialogue).toHaveProperty('npc_rival');
        expect(dialogue).toHaveProperty('npc_store_clerk');
        expect(dialogue).toHaveProperty('boss_greed_01');
        expect(dialogue).toHaveProperty('boss_01_wisdom_quote');
    });
});
```

---

### `tests/og-tags.test.ts` (test, unit)

**Analog:** `tests/i18n.test.ts` (dynamic import pattern — reads a static file)

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('og:meta tags (VIRL-02)', () => {
    it('index.html contains og:image meta tag', () => {
        const html = readFileSync(resolve(__dirname, '../index.html'), 'utf-8');
        expect(html).toContain('og:image');
    });
    it('index.html contains og:title meta tag', () => {
        const html = readFileSync(resolve(__dirname, '../index.html'), 'utf-8');
        expect(html).toContain('og:title');
    });
    it('index.html contains og:description meta tag', () => {
        const html = readFileSync(resolve(__dirname, '../index.html'), 'utf-8');
        expect(html).toContain('og:description');
    });
});
```

---

### `tests/share-service.test.ts` (test, unit)

**Analog:** `tests/audio-persistence.test.ts` (vi.resetModules + mock install pattern)

Requires jsdom environment for Canvas mock. Test verifies Blob is non-empty; does not test actual share/download (browser APIs).

```typescript
/**
 * vitest environment: jsdom — required for HTMLCanvasElement mock.
 * Add @vitest-environment jsdom comment at top of file, or configure
 * in vitest.config.ts per-file environment override.
 */
// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ShareService — Blob generation (VIRL-01)', () => {
    beforeEach(() => vi.resetModules());
    afterEach(() => vi.resetModules());

    it('shareCard() produces a non-empty Blob when canvas mock is available', async () => {
        // Mock game.renderer.snapshot to immediately call back with a blank image
        const mockGame = {
            renderer: {
                snapshot: (cb: (img: HTMLImageElement) => void) => {
                    const img = new Image();
                    cb(img);
                }
            }
        } as unknown as Phaser.Game;

        const { shareCard } = await import('../src/services/ShareService.js');
        // shareCard calls navigator.share — mock it to prevent NotAllowedError
        Object.defineProperty(navigator, 'canShare', { value: () => false, configurable: true });
        // anchor click mock
        const clickSpy = vi.fn();
        vi.spyOn(document, 'createElement').mockImplementation((tag) => {
            if (tag === 'a') return { click: clickSpy, href: '', download: '' } as unknown as HTMLAnchorElement;
            return document.createElement(tag);
        });
        await expect(shareCard(mockGame, 'TEST QUOTE')).resolves.not.toThrow();
    });
});
```

---

## Shared Patterns

### t() text style object
**Source:** `src/game/scenes/MainMenu.ts` lines 19-23, `src/game/scenes/Settings.ts` lines 26-30
**Apply to:** All scene files, all UI component files
```typescript
// Body (8px) — most text
{ fontSize: '8px',  color: '#e8e8e8', fontFamily: '"Press Start 2P", monospace' }
// Heading (16px) — buttons, labels
{ fontSize: '16px', color: '#e8e8e8', fontFamily: '"Press Start 2P", monospace' }
// Display (24px) — titles
{ fontSize: '24px', color: '#e8e8e8', fontFamily: '"Press Start 2P", monospace' }
// Accent variant — swap color: '#00ff88' for primary CTA text
```

### WCAG 44px interactive hit area extension
**Source:** `src/game/scenes/MainMenu.ts` lines 57-65
**Apply to:** All interactive text objects and buttons in all scene/UI files
```typescript
obj.setInteractive(
    new Phaser.Geom.Rectangle(
        -Math.max(obj.width, 80) / 2,
        -22,
        Math.max(obj.width, 80),
        44
    ),
    Phaser.Geom.Rectangle.Contains
);
```

### pointerdown event with on() vs once()
**Source:** `src/game/scenes/MainMenu.ts` lines 85-108
**Apply to:** All interactive GameObjects
- Use `.once('pointerdown', ...)` for one-shot actions (scene transitions, dialogue advance)
- Use `.on('pointerdown', ...)` for repeatable toggle actions (Settings.ts containers)

### shutdown() timer cleanup
**Source:** `src/game/scenes/MainMenu.ts` lines 111-116
**Apply to:** OverworldScene, UIScene, BossScene, PaperThrowScene — any scene with `this.time.addEvent` timers
```typescript
shutdown(): void {
    if (this.blinkTimer) {
        this.blinkTimer.remove();
        this.blinkTimer = null;
    }
    // Also: this.input.off(...) for any persistent pointerdown listeners
}
```

### safeGet / safeSet error-silent pattern
**Source:** `src/services/AudioService.ts` lines 20-28
**Apply to:** SaveService (adapt to async try/catch for IndexedDB)
```typescript
function safeGet(key: string): string | null {
    try { return localStorage.getItem(key); }
    catch { return null; }
}
function safeSet(key: string, value: string): void {
    try { localStorage.setItem(key, value); }
    catch { /* ignore */ }
}
```

### vi.resetModules() + dynamic import test pattern
**Source:** `tests/audio-persistence.test.ts` lines 44-55
**Apply to:** All five new test files
```typescript
beforeEach(() => {
    vi.resetModules();
    installMock();   // install storage/IDB/canvas mock
});
afterEach(() => vi.resetModules());

it('description', async () => {
    const { ServiceName } = await import('../src/services/ServiceName.js');
    // assert
});
```

### Scene registration in main.ts
**Source:** `src/game/main.ts` lines 1-26
**Apply to:** Every new Scene class
```typescript
// 1. Import at top of main.ts
import { NewScene } from './scenes/NewScene';
// 2. Add to scene array in config (order determines render depth — later = on top)
scene: [...existingScenes, NewScene],
```

### No English literals in scene/UI files
**Source:** All Phase 1 scene files — every visible string uses `t('key')`
**Apply to:** All Phase 2 scene and UI files
```typescript
// CORRECT:
this.add.text(cx, y, t('pause.title'), styleObj);
// WRONG — never do this:
this.add.text(cx, y, 'PAUSED', styleObj);
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/systems/TriggerSystem.ts` | utility | event-driven | No zone-based trigger detection exists in Phase 1. Use RESEARCH.md Pattern 3 (scene handoff) and Phaser `this.physics.add.overlap()` for implementation reference. |
| `src/ui/ShareCard.ts` | ui component | file-I/O | No Canvas 2D API rendering or Web Share API usage exists in Phase 1. Use RESEARCH.md Pattern 6 as the sole reference. |
| `src/events/GameEvents.ts` | utility | pub-sub | No event bus exists in Phase 1. Use `new Phaser.Events.EventEmitter()` singleton pattern described in Pattern Assignments above. |

---

## Metadata

**Analog search scope:** `src/game/scenes/`, `src/services/`, `src/input/`, `tests/`, `public/locales/en/`
**Files scanned:** 12
**Pattern extraction date:** 2026-06-12
