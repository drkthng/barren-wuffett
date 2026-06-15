# Phase 3: Level 1 — The Newspaper Verb & Economy — Pattern Map

**Mapped:** 2026-06-15
**Files analyzed:** 19 new/modified files
**Analogs found:** 19 / 19

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/systems/PrizePack.ts` | system/utility (pure TS) | transform | `src/systems/TriggerSystem.ts` (pure-TS class, no Phaser) | role-match |
| `src/systems/WhackSystem.ts` | system (Phaser-aware) | event-driven | `src/systems/TriggerSystem.ts` + `OverworldScene` physics | role-match |
| `src/systems/Economy.ts` | utility (pure TS) | transform | `src/systems/TriggerSystem.ts` (pure-TS logic) | role-match |
| `src/entities/BushEntity.ts` | entity | event-driven | `src/entities/Player.ts` (plain-TS class owns Phaser sprite) | exact |
| `src/data/levels/level-01-economy.ts` | data manifest | CRUD | `src/data/levels/level-01.ts` + `ContentRegistry.register()` | exact |
| `src/input/InputBus.ts` | utility (extend) | request-response | itself — add `Action.WHACK` to existing `Action` enum | exact |
| `src/entities/Player.ts` | entity (extend) | event-driven | itself — add `whack()`, `applyKnockback()`, `isInvincible` | exact |
| `src/events/GameEvents.ts` | event bus (extend) | pub-sub | itself — add new constants to `Object.freeze({…})` | exact |
| `src/ui/HUD.ts` | UI component (extend) | event-driven | itself — add `flashCoinPickup()`, streak pips | exact |
| `src/ui/ShopOverlay.ts` | UI component (new) | request-response | `src/game/scenes/UIScene.ts` `buildPauseOverlay()` pattern | role-match |
| `src/ui/HospitalOverlay.ts` | UI component (new) | event-driven | `src/game/scenes/UIScene.ts` `buildPauseOverlay()` pattern | role-match |
| `src/game/scenes/UIScene.ts` | scene (extend) | event-driven | itself — add `SHOP`/`HOSPITAL` states, new handlers | exact |
| `src/game/scenes/OverworldScene.ts` | scene (extend) | CRUD + event-driven | itself — add dog bite, hitbox, shop/hospital dispatch | exact |
| `src/game/scenes/Preloader.ts` | scene (extend) | CRUD | itself — add `this.load.image/spritesheet` + `anims.create` | exact |
| `src/services/SaveService.ts` | service (no change needed) | CRUD | itself — `SaveState.flags` bag used as-is | exact |
| `src/data/dialogue/en/level-01.json` | data (extend) | CRUD | itself — add new dialogue keys | exact |
| `tests/prize-pack.test.ts` | test | transform | `tests/input-bus.test.ts` (vi.resetModules + dynamic import pattern) | exact |
| `tests/dog-hazard.test.ts` | test | event-driven | `tests/input-bus.test.ts` + `tests/save-service.test.ts` | exact |
| `tests/shop-economy.test.ts` | test | CRUD | `tests/save-service.test.ts` (flags persistence pattern) | exact |
| `tests/coins-hud.test.ts` | test | event-driven | `tests/input-bus.test.ts` (pure-TS module, no Phaser) | exact |

---

## Pattern Assignments

### `src/events/GameEvents.ts` — extend (event bus, pub-sub)

**Analog:** `src/events/GameEvents.ts` lines 12–24

**Rule:** All new events go into the SINGLE `Object.freeze({…})` block. Do NOT create a
second `const Events`. The `as const` preserves the string-literal union type.

**Core pattern** (lines 12–24 — copy this structure exactly, then add Phase 3 constants):
```typescript
export const Events = Object.freeze({
    // existing — do not touch:
    DIALOGUE_START:    'DIALOGUE_START',
    DIALOGUE_COMPLETE: 'DIALOGUE_COMPLETE',
    PAUSE_REQUESTED:   'PAUSE_REQUESTED',
    RESUME_REQUESTED:  'RESUME_REQUESTED',
    MINIGAME_COMPLETE: 'MINIGAME_COMPLETE',
    BOSS_DEFEATED:     'BOSS_DEFEATED',
    PATIENCE_BONUS:    'PATIENCE_BONUS',
    // Phase 3 additions — append here:
    COINS_CHANGED:        'COINS_CHANGED',
    BUSH_WHACKED:         'BUSH_WHACKED',
    PLAYER_HOSPITALIZED:  'PLAYER_HOSPITALIZED',
    SHOP_OPEN:            'SHOP_OPEN',
    SHOP_PURCHASE:        'SHOP_PURCHASE',
    SHOP_CLOSE:           'SHOP_CLOSE',
    STREAK_BONUS:         'STREAK_BONUS',
} as const);
```

**Key convention:** `export type EventNames = typeof Events[keyof typeof Events]` on line 22
does NOT need to change — the `as const` inference covers new keys automatically.

---

### `src/input/InputBus.ts` — extend (utility, request-response)

**Analog:** `src/input/InputBus.ts` lines 16–23

**Rule:** Add `WHACK` to the `Action` enum. It is a pulse action (setAction true then
immediately false or after cooldown), not a held action — `update()` loop does NOT need
to change. The whack button and `J` key fire `setAction(Action.WHACK, true/false)` from
their event handlers in OverworldScene. `Player.update()` reads it once per press and
resets it via `setAction(Action.WHACK, false)` after consuming it.

**Core pattern** (lines 16–23, extend the enum):
```typescript
export enum Action {
    MOVE_UP    = 'MOVE_UP',
    MOVE_DOWN  = 'MOVE_DOWN',
    MOVE_LEFT  = 'MOVE_LEFT',
    MOVE_RIGHT = 'MOVE_RIGHT',
    INTERACT   = 'INTERACT',
    PAUSE      = 'PAUSE',
    WHACK      = 'WHACK',   // Phase 3 — pulse action
}
```

**Key convention:** `setAction` / `isActive` are already correct for pulse actions.
No changes to `update()` are needed — joystick/cursors do not produce WHACK.

---

### `src/entities/Player.ts` — extend (entity, event-driven)

**Analog:** `src/entities/Player.ts` lines 1–49 (entire file)

**Existing pattern to preserve** (lines 24–48): The `update()` loop polls `InputBus`
with pure velocity math and updates `this.facing`. Movement must NOT change.

**New capabilities to add — follow these conventions:**

1. **New private fields** (after existing `facing` field, line 16):
```typescript
private _invincible = false;
private _whackCooldown = false;
// Phaser scene reference needed for tweens (already passed to constructor as Scene)
private readonly _scene: Phaser.Scene;
```
Store the scene in the constructor: `this._scene = scene;`

2. **`get isInvincible()` getter** (pure boolean read — OverworldScene guards dog bite with this):
```typescript
get isInvincible(): boolean { return this._invincible; }
```

3. **`whack(facing: string)` method** — called by OverworldScene when WHACK is polled
(after consuming the action via `InputBus.setAction(Action.WHACK, false)`):
```typescript
whack(facing: string): void {
    if (this._whackCooldown || this._invincible) return;
    this._whackCooldown = true;
    this._scene.time.delayedCall(350, () => { this._whackCooldown = false; });
    // Caller (OverworldScene) handles hitbox + animation — Player only gates cooldown
}
```

4. **`applyKnockback(fromX, fromY, onComplete)` method** (copy tween structure from
OverworldScene's existing `this.tweens.add` pattern, lines 400–406):
```typescript
applyKnockback(fromX: number, fromY: number, onComplete: () => void): void {
    this._invincible = true;
    // 1. disable physics moves so tween wins
    (this.sprite.body as Phaser.Physics.Arcade.Body).moves = false;
    this.sprite.setVelocity(0, 0);
    const DIST = 48;
    const angle = Math.atan2(this.sprite.y - fromY, this.sprite.x - fromX);
    this._scene.tweens.add({
        targets: this.sprite,
        x: this.sprite.x + Math.cos(angle) * DIST,
        y: this.sprite.y + Math.sin(angle) * DIST,
        duration: 180, ease: 'Power2',
        onComplete: () => {
            (this.sprite.body as Phaser.Physics.Arcade.Body).moves = true;
            // i-frame flash: alpha oscillation 6× 80ms yoyo = ~960ms
            this._scene.tweens.add({
                targets: this.sprite, alpha: 0, duration: 80,
                yoyo: true, repeat: 5,
                onComplete: () => {
                    this.sprite.setAlpha(1);
                    this._invincible = false;
                    onComplete();
                },
            });
        },
    });
}
```

**Key convention:** `this.sprite.body` exists in Phaser Arcade physics. Cast as
`Phaser.Physics.Arcade.Body` (dynamic, not static) for the `moves` flag. The `Player`
constructor already uses `scene.physics.add.sprite()` so the body is a dynamic body.

---

### `src/systems/PrizePack.ts` — new (pure TS, no Phaser, transform)

**Analog:** `src/systems/TriggerSystem.ts` lines 1–107 (pure-TS class, no Phaser import,
holds internal state, exported as a class instance per consumer)

**Imports pattern** — NO Phaser import (critical for vitest node environment):
```typescript
// No Phaser import — pure TypeScript only
// TriggerSystem.ts is the model: plain class, internal state, no Scene reference
```

**Core pattern** (model: TriggerSystem's class + internal state fields, lines 44–107):
```typescript
export interface PrizePackState {
    slotIndex: number;   // 0..7, advances each whack regardless of drop
}

export type DropResult = {
    coins: number;
    item: 'snack' | null;
};

// ALttP slots — D-05 locked design (start with these, tuned by playtest)
const PACK_SLOTS: DropResult[] = [
    { coins: 1, item: null },
    { coins: 0, item: null },   // nothing
    { coins: 1, item: null },
    { coins: 3, item: null },
    { coins: 1, item: null },
    { coins: 0, item: 'snack' },
    { coins: 1, item: null },
    { coins: 5, item: null },
];
const DROP_CHANCE = 0.55;

export function rollPrizePack(
    state: PrizePackState,
    rng: () => number = Math.random
): DropResult | null {
    const slot = PACK_SLOTS[state.slotIndex % 8];
    state.slotIndex = (state.slotIndex + 1) % 8;   // deterministic slot advance
    if (rng() > DROP_CHANCE) return null;           // 45% no drop
    return slot;
}
```

**Key convention:** State is a plain object (`PrizePackState`) owned and passed by
OverworldScene — never a module singleton. OverworldScene instantiates a new
`PrizePackState` in `create()` so re-entry resets the counter (per Pitfall 5 in RESEARCH).
The `rng` parameter is injectable for deterministic tests.

---

### `src/systems/Economy.ts` — new (pure TS, transform)

**Analog:** `src/systems/TriggerSystem.ts` (pure-TS module, no Phaser)

**Core pattern** — pure functions only, injectable for testing:
```typescript
// No Phaser import
export interface EconomyFlags extends Record<string, boolean> {}

/** Compute hospital fee: 0 if helmet owned, else min(5, coins) */
export function computeHospitalFee(coins: number, flags: EconomyFlags): number {
    if (flags['upgrade_helmet']) return 0;
    return Math.min(5, coins);
}

/** Apply a shop purchase; returns updated coins and flags */
export function applyPurchase(
    coins: number,
    flags: EconomyFlags,
    itemId: string,
    price: number
): { newCoins: number; newFlags: EconomyFlags } | null {
    if (coins < price) return null;
    if (itemId !== 'snack' && flags[itemId]) return null;  // already owned
    const newFlags = { ...flags };
    if (itemId !== 'snack') newFlags[itemId] = true;
    return { newCoins: coins - price, newFlags };
}
```

**Key convention:** No side effects, no Phaser, fully testable. OverworldScene calls these
and then emits COINS_CHANGED with the result.

---

### `src/entities/BushEntity.ts` — new (entity, event-driven)

**Analog:** `src/entities/Player.ts` lines 1–49 (plain-TS class owns a Phaser physics
sprite; constructor receives `scene`)

**Imports pattern** (model: Player.ts lines 10–11):
```typescript
import { Scene } from 'phaser';
// No InputBus — BushEntity is passive (receives calls, does not poll)
```

**Core pattern** (model: Player constructor/sprite pattern, lines 18–22):
```typescript
export class BushEntity {
    readonly sprite: Phaser.Physics.Arcade.Sprite;
    private _cleared = false;
    private readonly _id: string;
    readonly special: boolean;  // true = milestone bush (streak bonus / journal page)

    constructor(scene: Scene, x: number, y: number, id: string, special = false) {
        this.sprite = scene.physics.add.sprite(x, y, 'bush');
        this.sprite.setData('bushId', id);  // for overlap callback lookup
        this._id = id;
        this.special = special;
    }

    isCleared(): boolean { return this._cleared; }
    get id(): string { return this._id; }

    onWhacked(): void {
        if (this._cleared) return;
        this._cleared = true;
        // Caller (OverworldScene) handles particles and prize-pack; we just hide
        this.sprite.setVisible(false);
        (this.sprite.body as Phaser.Physics.Arcade.Body).enable = false;
    }

    /** Called on level re-entry — bushes regrow (D-03) */
    reset(): void {
        this._cleared = false;
        this.sprite.setVisible(true);
        (this.sprite.body as Phaser.Physics.Arcade.Body).enable = true;
    }
}
```

**Key convention:** `sprite.setData('bushId', id)` must be set in the constructor so the
physics overlap callback can call `sprite.getData('bushId')` to look up the entity.
`body.enable = false` disables the physics body without destroying the sprite (preserves
the session-cleared set pattern from RESEARCH anti-patterns).

---

### `src/data/levels/level-01-economy.ts` — new (data manifest, CRUD)

**Analog:** `src/data/levels/level-01.ts` lines 147–163 (manifest object + `ContentRegistry.register()`)
and `src/services/ContentRegistry.ts` lines 9–17 (`LevelManifest` type)

**Imports pattern** (model: level-01.ts lines 27–28):
```typescript
import type { LevelManifest } from '../../services/ContentRegistry';
// Note: level-01-economy.ts does NOT re-register the manifest (level-01.ts already did).
// Instead, export a plain typed object that OverworldScene imports directly.
```

**Core pattern** (model: level-01.ts lines 147–163, adapted for economy content):
```typescript
export interface ShopItem {
    itemId: string;           // e.g. 'upgrade_newspaper'
    nameKey: string;          // i18n key
    descKey: string;          // i18n key
    iconKey: string;          // Phaser texture key
    price: number;
    consumable: boolean;
}

export interface BushDef {
    id: string;
    x: number;          // world pixel X
    y: number;          // world pixel Y
    special: boolean;   // milestone bush (streak bonus / journal page)
}

export interface EconomyData {
    bushes: BushDef[];
    shopItems: ShopItem[];
    gateBarrier: { x: number; y: number; w: number; h: number };
    prizePackSlots: import('../../../src/systems/PrizePack').DropResult[];
}

export const ECONOMY_DATA: EconomyData = {
    bushes: [
        { id: 'bush_01', x: 160, y: 128, special: false },
        // … fill at plan/execute time using DECO gap rows 13–20 free cells
    ],
    shopItems: [
        { itemId: 'upgrade_newspaper', nameKey: 'shop.item.sunday_edition.name',
          descKey: 'shop.item.sunday_edition.desc', iconKey: 'item_newspaper_upgrade',
          price: 20, consumable: false },
        { itemId: 'upgrade_helmet',    nameKey: 'shop.item.bike_helmet.name',
          descKey: 'shop.item.bike_helmet.desc',    iconKey: 'item_helmet',
          price: 35, consumable: false },
        { itemId: 'upgrade_traversal', nameKey: 'shop.item.bus_pass.name',
          descKey: 'shop.item.bus_pass.desc',       iconKey: 'item_bus_pass',
          price: 60, consumable: false },
        { itemId: 'snack',             nameKey: 'shop.item.snack.name',
          descKey: 'shop.item.snack.desc',          iconKey: 'item_snack',
          price: 5,  consumable: true },
    ],
    // East path gate: cols 20–29 rows 7–8 → pixel x=320, y=112 (16px tiles)
    gateBarrier: { x: 320, y: 112, w: 144, h: 32 },
    prizePackSlots: [
        { coins: 1, item: null }, { coins: 0, item: null },
        { coins: 1, item: null }, { coins: 3, item: null },
        { coins: 1, item: null }, { coins: 0, item: 'snack' },
        { coins: 1, item: null }, { coins: 5, item: null },
    ],
};
```

**Key convention:** This file exports a plain typed data object, NOT a `LevelManifest`
(which is already registered by `level-01.ts`). OverworldScene imports `ECONOMY_DATA`
directly. LevelManifest may be minimally extended to add an `economyKey` field if needed
for multi-level support, but for Phase 3 a direct import is sufficient.

---

### `src/ui/HUD.ts` — extend (UI component, event-driven)

**Analog:** `src/ui/HUD.ts` lines 85–101 (`flashPatienceBonus` — copy structure verbatim
for `flashCoinPickup`)

**New method** — `flashCoinPickup(amount: number)` (model: `flashPatienceBonus`, lines 85–101):
```typescript
flashCoinPickup(amount: number): void {
    if (amount <= 0) return;
    const pickupText = this.scene.add.text(240, 200,
        `+${amount}`,
        { fontSize: '8px', color: '#f5c842',
          fontFamily: '"Press Start 2P", monospace' }
    ).setOrigin(0.5).setDepth(25);

    this.scene.tweens.add({
        targets: pickupText,
        y: 160, alpha: 0, duration: 700,
        onComplete: () => pickupText.destroy(),
    });
}
```

**Streak pips** — add 8 Phaser Rectangle pips as class fields in `constructor()`:
```typescript
// After existing coinText/saveIcon/pauseBtn setup:
private streakPips: Phaser.GameObjects.Rectangle[] = [];
private streakVisible = false;

// In constructor, after building the container:
for (let i = 0; i < 8; i++) {
    const pip = scene.add.rectangle(72 + i * 16, 40, 12, 8, 0x16213e).setDepth(20);
    this.streakPips.push(pip);
}
```

**`updateStreak(n: number)` method**:
```typescript
updateStreak(n: number): void {
    this.streakPips.forEach((pip, i) => {
        pip.setFillStyle(i < n ? 0x00ff88 : 0x16213e);
        pip.setVisible(n > 0);
    });
}
```

**Key convention:** Coin text color for the count value (`{n}` portion) changes from
`#e8e8e8` to `#f5c842` per UI-SPEC §3a. The `COINS:` label stays `#e8e8e8`. If
`coinText` is a single Phaser Text, split it into a `coinLabel` + `coinValue` text pair
so only `coinValue` uses `#f5c842`.

**Existing `setCoins` pattern** (lines 57–65): The scale tween on `this.coinText` stays
unchanged. `UIScene.onCoinsChanged` calls both `setCoins(n)` AND `flashCoinPickup(delta)`.

---

### `src/ui/ShopOverlay.ts` — new (UI component, request-response)

**Analog:** `src/game/scenes/UIScene.ts` `buildPauseOverlay()` lines 135–232

**Imports pattern** (model: UIScene.ts lines 17–23):
```typescript
import Phaser, { Scene } from 'phaser';
import { t } from '../services/i18n';
import { GameEvents, Events } from '../events/GameEvents';
import type { ShopItem } from '../data/levels/level-01-economy';
```

**Core panel pattern** (model: buildPauseOverlay lines 137–143 — backdrop + panel rect):
```typescript
export class ShopOverlay {
    private backdrop: Phaser.GameObjects.Rectangle;
    private panel: Phaser.GameObjects.Container;
    private itemRows: Phaser.GameObjects.Container[] = [];

    constructor(scene: Scene) {
        // Full-canvas backdrop (#000, alpha 0.6) — matches pause backdrop (line 137)
        this.backdrop = scene.add.rectangle(0, 0, 480, 854, 0x000000, 0.6)
            .setOrigin(0, 0).setDepth(30).setVisible(false);

        // Panel: 320×380 centered at (240, 427) — matches pause panel position (line 143)
        const panelRect = scene.add.rectangle(240, 427, 320, 380, 0x1a1a2e)
            .setStrokeStyle(2, 0xe8e8e8);
        // … build title, item rows, close button inside panel container
        this.panel = scene.add.container(0, 0, [panelRect, ...])
            .setDepth(31).setVisible(false);
    }

    show(coins: number, flags: Record<string, boolean>, items: ShopItem[]): void {
        // Re-render item rows with affordability state
        this.backdrop.setVisible(true);
        this.panel.setVisible(true);
    }

    hide(): void {
        this.backdrop.setVisible(false);
        this.panel.setVisible(false);
    }
}
```

**Button pattern** (model: UIScene.ts lines 155–162 — RESUME button):
```typescript
const buyBtn = scene.add.text(rightX, rowY, t('shop.buy'), {
    fontSize: '16px', color: '#00ff88',
    fontFamily: '"Press Start 2P", monospace',
}).setOrigin(0.5).setInteractive(
    new Phaser.Geom.Rectangle(-60, -22, 120, 44),
    Phaser.Geom.Rectangle.Contains
);
buyBtn.on('pointerdown', () => {
    buyBtn.setAlpha(0.7);
    scene.time.delayedCall(100, () => buyBtn.setAlpha(1));
    GameEvents.emit(Events.SHOP_PURCHASE, { itemId, price });
});
```

**Key convention:** `ShopOverlay` is a plain TypeScript class (not a Scene) owned by
UIScene — identical ownership pattern to `HUD` and `DialogueBox`. UIScene creates it in
`create()` and calls `show()`/`hide()` from `setState()`.

---

### `src/ui/HospitalOverlay.ts` — new (UI component, event-driven)

**Analog:** `src/game/scenes/UIScene.ts` pause overlay pattern (lines 135–232) but
simpler — auto-dismiss only, no buttons.

**Core pattern** (model: buildPauseOverlay backdrop/panel structure):
```typescript
export class HospitalOverlay {
    private backdrop: Phaser.GameObjects.Rectangle;
    private panel: Phaser.GameObjects.Container;

    constructor(scene: Scene) {
        this.backdrop = scene.add.rectangle(0, 0, 480, 854, 0x000000, 0.6)
            .setOrigin(0, 0).setDepth(30).setVisible(false);

        // Panel: 360×220 centered at (240, 427)
        const panelRect = scene.add.rectangle(240, 427, 360, 220, 0x1a1a2e)
            .setStrokeStyle(2, 0xe8e8e8);
        // heading (Display 24px), fee line (Body 8px), dismiss hint (Label 8px)
        // … texts
        this.panel = scene.add.container(0, 0, [panelRect, headingText, feeText, hintText])
            .setDepth(31).setVisible(false);
    }

    show(fee: number, helmetOwned: boolean): void {
        // Set fee line text and color based on helmetOwned / fee amount
        this.backdrop.setVisible(true);
        this.panel.setVisible(true);
        // Scale-in tween (UI-SPEC §5): 0.7 → 1.0 over 200ms, Back.Out
        // scene.tweens.add({ targets: this.panel, scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.Out' })
    }

    hide(): void {
        this.backdrop.setVisible(false);
        this.panel.setVisible(false);
    }
}
```

---

### `src/game/scenes/UIScene.ts` — extend (scene, event-driven)

**Analog:** itself — lines 25, 50–77, 402–420

**State type extension** (line 25):
```typescript
// Before:
type UIState = 'HUD' | 'DIALOGUE' | 'PAUSE' | 'LEVEL_COMPLETE';
// After:
type UIState = 'HUD' | 'DIALOGUE' | 'PAUSE' | 'LEVEL_COMPLETE' | 'SHOP' | 'HOSPITAL';
```

**New handler fields** (model: existing `onPatienceBonus` field at lines 51–53):
```typescript
// Add as class fields — stored refs required for shutdown() (CR-03 pattern)
private onCoinsChanged        = (n: number): void => { ... };
private onBushWhacked         = (data: { streak: number }): void => { ... };
private onStreakBonus         = (data: { coins: number; journal: boolean }): void => { ... };
private onShopOpen            = (data: { coins: number; flags: Record<string, boolean> }): void => { ... };
private onShopClose           = (): void => { ... };
private onPlayerHospitalized  = (data: { fee: number; helmetOwned: boolean }): void => { ... };
```

**create() additions** (model: lines 70–77 — append after existing `.on` calls):
```typescript
GameEvents.on(Events.COINS_CHANGED,       this.onCoinsChanged,       this);
GameEvents.on(Events.BUSH_WHACKED,        this.onBushWhacked,        this);
GameEvents.on(Events.STREAK_BONUS,        this.onStreakBonus,         this);
GameEvents.on(Events.SHOP_OPEN,           this.onShopOpen,           this);
GameEvents.on(Events.SHOP_CLOSE,          this.onShopClose,          this);
GameEvents.on(Events.PLAYER_HOSPITALIZED, this.onPlayerHospitalized,  this);
```

**setState() extension** (model: lines 402–407):
```typescript
private setState(state: UIState): void {
    this.uiState = state;
    this.hud.setVisible(state === 'HUD');
    this.pauseBackdrop.setVisible(state === 'PAUSE');
    this.pauseOverlay.setVisible(state === 'PAUSE');
    // Phase 3 additions:
    this.shopOverlay?.hide();
    this.hospitalOverlay?.hide();
    if (state === 'SHOP')     this.shopOverlay?.show(/* coins, flags, items */);
    if (state === 'HOSPITAL') this.hospitalOverlay?.show(/* fee, helmetOwned */);
}
```

**shutdown() additions** (model: lines 410–418 — CR-03 pattern, CRITICAL):
```typescript
// Add these to the existing shutdown() block:
GameEvents.off(Events.COINS_CHANGED,       this.onCoinsChanged,       this);
GameEvents.off(Events.BUSH_WHACKED,        this.onBushWhacked,        this);
GameEvents.off(Events.STREAK_BONUS,        this.onStreakBonus,         this);
GameEvents.off(Events.SHOP_OPEN,           this.onShopOpen,           this);
GameEvents.off(Events.SHOP_CLOSE,          this.onShopClose,          this);
GameEvents.off(Events.PLAYER_HOSPITALIZED, this.onPlayerHospitalized,  this);
```

**Key convention:** Every `GameEvents.on(X, handler, this)` in `create()` MUST have a
matching `GameEvents.off(X, handler, this)` in `shutdown()`. Missing one causes zombie
listeners on second game start (Pitfall 4 / CR-03). Handler stored as a class field is
mandatory — passing an anonymous function to `.on()` makes `.off()` impossible.

---

### `src/game/scenes/OverworldScene.ts` — extend (scene, CRUD + event-driven)

**Analog:** itself — key patterns from lines 48–86 (fields), 108–229 (create), 231–278
(update), 380–420 (dog patrol + awardPatienceBonus), 422–433 (buildSaveState), 449–end (shutdown)

**New class fields** (add after existing fields, model: lines 66–83):
```typescript
// Whack system
private whackableGroup!: Phaser.Physics.Arcade.Group;
private hitboxRect!: Phaser.GameObjects.Rectangle;
private bushEntities = new Map<string, BushEntity>();
private prizePackState: PrizePackState = { slotIndex: 0 };
private bushStreak = 0;

// Economy / shop
private shopOpen = false;
private hospitalShowing = false;

// Traversal gate
private gateBarrier: Phaser.GameObjects.Rectangle | null = null;

// New handler refs for shutdown() (CR-03)
private onShopPurchase = (data: { itemId: string; price: number }): void => { ... };
private onShopClose    = (): void => { ... };
```

**create() additions** — model the exact patterns used for dog/NPC:

1. **Whackable group + bushes** (model: NPC loop lines 152–173):
```typescript
this.whackableGroup = this.physics.add.group();
for (const bushDef of ECONOMY_DATA.bushes) {
    const bush = new BushEntity(this, bushDef.x, bushDef.y, bushDef.id, bushDef.special);
    this.whackableGroup.add(bush.sprite);
    this.bushEntities.set(bushDef.id, bush);
}
```

2. **Hitbox rectangle** (model: dMap createLayer static body pattern):
```typescript
this.hitboxRect = this.add.rectangle(0, 0, 32, 24, 0xff0000, 0).setActive(false);
this.physics.add.existing(this.hitboxRect, true); // true = static body
(this.hitboxRect.body as Phaser.Physics.Arcade.StaticBody).enable = false;
this.physics.add.overlap(this.hitboxRect, this.whackableGroup, this.onBushHit, undefined, this);
```

3. **Gate barrier** (model: dLayer collision pattern lines 133–141):
```typescript
this.gateBarrier = this.add.rectangle(
    ECONOMY_DATA.gateBarrier.x, ECONOMY_DATA.gateBarrier.y,
    ECONOMY_DATA.gateBarrier.w, ECONOMY_DATA.gateBarrier.h,
    0x000000, 0
);
this.physics.add.existing(this.gateBarrier, true);
this.physics.add.collider(this.player.sprite, this.gateBarrier);
if (this.flags['upgrade_traversal']) {
    (this.gateBarrier.body as Phaser.Physics.Arcade.StaticBody).enable = false;
}
```

4. **SHOP_PURCHASE / SHOP_CLOSE listeners** (model: line 225 `DIALOGUE_COMPLETE` listener):
```typescript
GameEvents.on(Events.SHOP_PURCHASE, this.onShopPurchase, this);
GameEvents.on(Events.SHOP_CLOSE,    this.onShopClose,    this);
```

**update() guard additions** (model: line 232):
```typescript
// Before:
if (this.inDialogue || this.inHandoff) return;
// After:
if (this.inDialogue || this.inHandoff || this.shopOpen || this.hospitalShowing) return;
```

**WHACK poll in update()** (after `this.player.update()`, model: NPC range loop lines 240–252):
```typescript
if (InputBus.isActive(Action.WHACK)) {
    InputBus.setAction(Action.WHACK, false);   // consume immediately
    this.activateWhackHitbox();
}
```

**Dog bite addition** (model: existing dog distance check style for boss zone, lines 255–263):
```typescript
// In update(), after existing NPC/trigger checks:
if (this.dogSprite) {
    const dx = this.player.sprite.x - this.dogSprite.x;
    const dy = this.player.sprite.y - this.dogSprite.y;
    if (Math.sqrt(dx * dx + dy * dy) < 24 && !this.player.isInvincible) {
        this.onDogBite();
    }
}
```

**buildSaveState** — no change needed. `flags` bag already captures upgrade keys. Model
is lines 422–433.

**shutdown() additions** (model: lines 449–end):
```typescript
GameEvents.off(Events.SHOP_PURCHASE, this.onShopPurchase, this);
GameEvents.off(Events.SHOP_CLOSE,    this.onShopClose,    this);
```

---

### `src/game/scenes/Preloader.ts` — extend (scene, CRUD)

**Analog:** itself — lines 62–86 (`this.load.image/spritesheet`) and lines 88–99 (`anims.create` loop)

**New image loads** (append after line 85, model: lines 62–86):
```typescript
// Phase 3: whack button + swing anim + bush + particles
this.load.image('ui_newspaper_button', 'assets/images/ui_newspaper_button.png');
this.load.spritesheet('newspaper_swing', 'assets/images/newspaper_swing.png',
    { frameWidth: 32, frameHeight: 32 });   // 3 frames, 96×32 sheet
this.load.image('bush',         'assets/images/bush.png');
this.load.image('leaf_particle', 'assets/images/leaf_particle.png');
// Shop icons
this.load.image('item_newspaper_upgrade', 'assets/images/item_newspaper_upgrade.png');
this.load.image('item_helmet',   'assets/images/item_helmet.png');
this.load.image('item_bus_pass', 'assets/images/item_bus_pass.png');
this.load.image('item_snack',    'assets/images/item_snack.png');
// SFX
this.load.audio('whack',          'assets/audio/sfx_whack.ogg');
this.load.audio('coin_ding',      'assets/audio/sfx_coin_ding.ogg');
this.load.audio('dog_bite',       'assets/audio/sfx_dog_bite.ogg');
this.load.audio('purchase_chime', 'assets/audio/sfx_purchase.ogg');
this.load.audio('hospital_sting', 'assets/audio/sfx_hospital.ogg');
this.load.audio('streak_bonus',   'assets/audio/sfx_streak_bonus.ogg');
```

**New anim registration** (in `create()`, append after player walk anim loop, lines 92–99):
```typescript
// Newspaper swing animation (3 frames, 18fps, no repeat, hideOnComplete)
this.anims.create({
    key: 'newspaper_swing_anim',
    frames: this.anims.generateFrameNumbers('newspaper_swing', { start: 0, end: 2 }),
    frameRate: 18,
    repeat: 0,
    hideOnComplete: true,
});
```

**Key convention:** `generateFrameNumbers` is already used for player walk anims (line 95) —
use the same pattern for `newspaper_swing`. The `frameWidth: 32` must match the PNG's
per-frame width. Never use "Collection of Images" tileset type (per CLAUDE.md).

---

### `src/services/SaveService.ts` — NO CHANGE NEEDED

**Analog:** itself — lines 28–32 (`SaveState.flags: Record<string, boolean>`)

**Pattern to know for Phase 3 wiring:**
```typescript
// From SaveState (line 29):
flags: Record<string, boolean>;
// Used in OverworldScene like:
this.flags['upgrade_helmet']    = true;   // on purchase
this.flags['first_whack_done']  = true;   // on first bush whack
this.flags['upgrade_traversal'] = true;   // on traversal purchase
// Read back in create():
if (this.flags['upgrade_traversal']) this.removeGate();
```

No schema migration, no `SAVE_VERSION` bump. The `migrate()` function (lines 35–45)
already handles missing keys via `?? {}` — new flag keys appear on first write.

---

### `src/data/dialogue/en/level-01.json` — extend (data, CRUD)

**Analog:** existing JSON shape — load it to see the exact structure before editing:
```json
// Existing pattern: array of { speaker, text } per NPC key
// New keys follow the same shape:
{
  "storeClerk.shopIntro": [
    { "speaker": "STORE CLERK", "text": "COME IN, COME IN!" },
    { "speaker": "STORE CLERK", "text": "WHAT CAN I DO FOR YOU?" }
  ]
}
```

All shop/hospital/HUD strings go into `public/locales/en/common.json` (flat key-value),
not into `level-01.json`. Only dialogue lines (speaker/text arrays) go into `level-01.json`.
See UI-SPEC §Copywriting Contract for the full key list.

---

## Test Pattern Assignments

### All 4 test files — `tests/prize-pack.test.ts`, `tests/dog-hazard.test.ts`, `tests/shop-economy.test.ts`, `tests/coins-hud.test.ts`

**Analog:** `tests/input-bus.test.ts` lines 1–117 (entire file — the canonical pattern for
pure-TS module tests in the node vitest environment)

**Mandatory test structure** (copy this boilerplate for each new test file):
```typescript
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ModuleName — scenario group', () => {
    beforeEach(() => { vi.resetModules(); });
    afterEach(()  => { vi.resetModules(); });

    it('describes the behavior in terms of output', async () => {
        // Dynamic import AFTER vi.resetModules() — fresh module state per test
        const { functionUnderTest } = await import('../src/systems/PrizePack.js');
        // ... assertion
    });
});
```

**Key conventions:**
1. `vi.resetModules()` in BOTH `beforeEach` and `afterEach` — prevents cross-test
   module-singleton state (e.g., PrizePackState, Economy logic). Model: lines 16–17.
2. `await import('../src/systems/ModuleName.js')` — use `.js` extension (Vite ESM).
   Model: line 21 `await import('../src/input/InputBus.js')`.
3. No Phaser import anywhere in test files — pure TS only.
4. `fake-indexeddb` pattern only needed for `shop-economy.test.ts` if testing
   SaveService persistence — copy from `tests/save-service.test.ts` lines 24–30.

**Test-specific patterns:**

`tests/prize-pack.test.ts` — inject deterministic `rng`:
```typescript
const state: PrizePackState = { slotIndex: 0 };
// Deterministic drop (rng always returns 0 — below DROP_CHANCE 0.55):
const result = rollPrizePack(state, () => 0);
expect(result).not.toBeNull();
expect(result?.coins).toBe(1);   // slot 0 = 1 coin
expect(state.slotIndex).toBe(1); // advanced
// No drop (rng returns 0.9 — above 0.55):
const noDrop = rollPrizePack(state, () => 0.9);
expect(noDrop).toBeNull();
expect(state.slotIndex).toBe(2); // still advances
```

`tests/dog-hazard.test.ts` — pure function from Economy.ts:
```typescript
const { computeHospitalFee } = await import('../src/systems/Economy.js');
expect(computeHospitalFee(10, {})).toBe(5);               // standard fee
expect(computeHospitalFee(3,  {})).toBe(3);               // floored to coins
expect(computeHospitalFee(10, { upgrade_helmet: true })).toBe(0);  // helmet waiver
expect(computeHospitalFee(0,  {})).toBe(0);               // broke
```

`tests/shop-economy.test.ts` — pure function from Economy.ts:
```typescript
const { applyPurchase } = await import('../src/systems/Economy.js');
expect(applyPurchase(10, {}, 'upgrade_newspaper', 20)).toBeNull(); // not enough
expect(applyPurchase(25, {}, 'upgrade_newspaper', 20)).toEqual({
    newCoins: 5, newFlags: { upgrade_newspaper: true }
});
expect(applyPurchase(25, { upgrade_newspaper: true }, 'upgrade_newspaper', 20))
    .toBeNull(); // already owned
expect(applyPurchase(10, {}, 'snack', 5)).toEqual({
    newCoins: 5, newFlags: {}  // snack: consumable, no flag set
});
```

`tests/coins-hud.test.ts` — test GameEvents emission shape:
```typescript
// No Phaser — test that COINS_CHANGED event carries the right payload
// by importing GameEvents (which uses Phaser.Events.EventEmitter — needs mock)
// Simpler: test the pure delta math that OverworldScene will use:
// this.coins += earned; GameEvents.emit(Events.COINS_CHANGED, this.coins)
// The test verifies that the constant exists and the emit pattern is correct
// by stubbing GameEvents with a plain EventEmitter from Node.
```

---

## Shared Patterns

### Phaser EventEmitter bus (`GameEvents.on/off/emit`)

**Source:** `src/events/GameEvents.ts` lines 24 + `src/game/scenes/UIScene.ts` lines 70–77

**Apply to:** UIScene (all 6 new handlers), OverworldScene (SHOP_PURCHASE, SHOP_CLOSE)

```typescript
// Register: GameEvents.on(Events.X, this.handlerField, this)
// Deregister: GameEvents.off(Events.X, this.handlerField, this)
// Emit: GameEvents.emit(Events.X, payload)
// Handler MUST be a class field (arrow fn) not an anonymous fn — required for .off()
```

### CR-03 Shutdown Listener Cleanup

**Source:** `src/game/scenes/UIScene.ts` lines 409–420 + `src/game/scenes/OverworldScene.ts` lines 449+

**Apply to:** UIScene (all new Phase 3 listeners), OverworldScene (new listeners)

Every `GameEvents.on(X, fn, this)` in `create()` → matching `GameEvents.off(X, fn, this)` in `shutdown()`.

### inHandoff / inDialogue / shopOpen / hospitalShowing guard

**Source:** `src/game/scenes/OverworldScene.ts` line 232

**Apply to:** OverworldScene.update() — extend the guard with `|| this.shopOpen || this.hospitalShowing`

### Phaser Tween + AudioService.playSfx pattern

**Source:** `src/game/scenes/OverworldScene.ts` lines 400–406 (dog tween), `src/services/AudioService.ts`

**Apply to:** All new tweens (knockback, swing, pickup float). All new SFX calls go through
`AudioService.playSfx(key)` — never call `this.sound.play()` directly.

### `t()` for all player-facing strings

**Source:** `src/services/i18n.ts` line 23 + usage in `src/ui/HUD.ts` line 109

**Apply to:** Every string shown to the player in ShopOverlay, HospitalOverlay, HUD streak
label, "+N" text, "WHACK HINT" prompt. Import `t` from `'../../services/i18n'` and
look up `src/data/dialogue/en/level-01.json` (dialogue) or
`public/locales/en/common.json` (HUD/shop/hospital strings).

---

## No Analog Found

All files have analogs in the codebase. No "no analog" entries.

---

## Metadata

**Analog search scope:** `src/` (all TS files), `tests/` (all test files)
**Files scanned:** 24 source files + 10 test files
**Pattern extraction date:** 2026-06-15
