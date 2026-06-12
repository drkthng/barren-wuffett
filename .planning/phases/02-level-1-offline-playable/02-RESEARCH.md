# Phase 2: Level 1 — Offline Playable — Research

**Researched:** 2026-06-12
**Domain:** Phaser 4 top-down gameplay, tilemap, VirtualJoystick, dialogue, IndexedDB save, Canvas share card, boss fight mechanics
**Confidence:** MEDIUM (Phaser 4.1.0 is recent; core API is stable but Phase 4.x-specific docs are sparse — most findings verified against official docs.phaser.io and phaser.io examples)

---

## Summary

Phase 2 builds the complete Level 1 playable loop: overworld exploration, one mini-game, the first Mr. Market boss fight, local save, and a share card. All seven requirement areas (movement, dialogue, patience mechanic, save, offline, share card, og:image) can be addressed with patterns already established in Phase 1 plus four new systems: the OverworldScene (tilemap + Arcade Physics), the dialogue system, SaveService (idb-keyval), and the share card flow (canvas snapshot + Web Share API).

The single most important architectural decision for this phase is the tilemap strategy: **use 2D array programmatic maps for Level 1** rather than the Tiled GUI tool. This is the lowest-friction path for a solo dev with no Tiled experience and AI-generated level content. Tiled JSON is the right long-term format (established in ARCHITECTURE.md), but learning Tiled adds a context-switch cost that is unjustified for one hand-crafted level. Level 2+ can adopt Tiled when the pattern is proven.

The second critical decision is the VirtualJoystick wiring: the Phase 1 smoke test confirmed the import path resolves in the production build. Phase 2 upgrades the InputBus Action enum stub to a fully wired binding, reading joystick booleans and keyboard cursors into a unified `activeActions` Set that all scene entities poll.

The share card pattern uses `this.game.renderer.snapshot()` (Phaser's built-in WebGL-safe screenshot API) rather than canvas.toDataURL() directly (which returns black pixels in WebGL mode). The snapshot callback receives an HTMLImageElement; convert to Blob via an offscreen Canvas.drawImage + toBlob() call, then pass to Web Share API Level 2 (iOS Safari ≥ 15.1 supports file sharing). Fallback: trigger an anchor[download] click.

**Primary recommendation:** Build OverworldScene with 2D array tilemap + Arcade Physics first, wire InputBus fully (VirtualJoystick + keyboard), then add NPCDialogue, then SaveService, then the mini-game scene handoff, then BossScene, finally the share card. This order mirrors the proven ARCHITECTURE.md build sequence.

---

## Project Constraints (from CLAUDE.md)

### GSD Workflow Enforcement
- Use `/gsd-execute-phase` entry point for all planned phase work.
- Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.

### Technology Stack (locked from Phase 1)
- Phaser 4.1.0, TypeScript 5.7.2, Vite 6.3.1, phaser4-rex-plugins 4.0.7, vitest 2.1.9
- Portrait 480×854 canvas, pixelArt:true, antialias:false, Scale.FIT
- All player-facing strings via t(key) — no English literals in scene files
- Services are plain TS modules with no Phaser dependency (importable in vitest node env)
- Pattern: manualChunks:{phaser} for cache-efficient production bundling

### Design System (from 01-UI-SPEC.md)
- Palette: #1a1a2e (dominant), #16213e (secondary), #00ff88 (accent), #e8e8e8 (text)
- Font: Press Start 2P — sizes must be multiples of 8px
- Touch targets: 44×44px minimum (WCAG 2.5.5)
- Texture hard cap: 2048×2048px per texture atlas

### Legal / Content Constraints
- Parody naming only: "Barren Wuffett", "Mr. Market" — no real Buffett/Munger names anywhere in user-facing strings
- Tests/parody-naming.test.ts already guards against real names in locale files
- No investment advice in any in-game text; visible "not investment advice" disclaimer required on Journal entries

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GAME-01 | Player can move the character through a top-down pixel-art overworld with a virtual joystick/D-pad on touch devices and keyboard on desktop (input via unified InputBus) | InputBus wiring pattern: VirtualJoystick boolean polling + keyboard cursors → activeActions Set; OverworldScene Arcade Physics velocity |
| GAME-05 | Player can talk to NPCs through a dialogue system (data-driven JSON dialogue) | DialogueScene pattern: JSON dialogue trees per NPC, typewriter effect via Phaser timer, touch advance; UIScene overlay |
| GAME-06 | At least one core mechanic per level rewards patience/timing in the spirit of value investing | "Dog on timer" patience mechanic: patrol NPC blocks path on timer cycle; waiting beats rushing; gives bonus collectible |
| GAME-09 | Player can pause/resume anytime; settings screen reachable from main menu and pause menu | Phaser HIDDEN_EVENT + BLUR_EVENT auto-pause; PAUSE Action in InputBus; UIScene pause overlay; this.scene.pause() / resume() |
| SAVE-01 | Player progress persists locally (IndexedDB) across refresh and return visits — no account needed | idb-keyval 6.2.5 SaveService: set/get with named store 'bw-saves'; versioned save schema; write on checkpoint events |
| SAVE-02 | Game is fully playable offline-anonymous; backend is never required for core gameplay | No Supabase calls in Phase 2; all save writes to IndexedDB only; SAVE-02 satisfied by architecture (no backend dependency) |
| VIRL-01 | After each boss defeat, player can share a Canvas-rendered card (1200×630, quote-based and spoiler-free, no raw highscores) with one tap | this.game.renderer.snapshot() → HTMLImageElement → offscreen canvas 1200×630 → toBlob() → Web Share API Level 2 file share; fallback: anchor[download] |
| VIRL-02 | Game URL renders rich previews on social/messaging platforms (og:image, og:title, og:description) | Static og: meta tags in index.html; og:image points to a pre-rendered 1200×630 PNG asset in public/ |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Character movement + collision | Phaser Scene (OverworldScene) | InputBus singleton | Physics bodies live in scene; InputBus is stateless cross-scene source |
| Virtual joystick rendering | OverworldScene (creates VirtualJoystick instance) | InputBus (consumes joystick state) | Joystick is a visual GameObjects — scene owns it; InputBus reads it |
| NPC dialogue display | UIScene (overlay, parallel) | OverworldScene (triggers via GameEvents bus) | UIScene runs above all game scenes; dialogue box rendered in UIScene |
| Save/load | SaveService (plain TS module) | OverworldScene / BossScene (calls SaveService) | Services own persistence; scenes call service functions |
| Share card generation | ShareService (plain TS module) | BossScene (triggers post-defeat) | Canvas manipulation belongs in a service, not scene code |
| Pause/resume | UIScene (overlay) + Phaser Game events | OverworldScene (reacts to PAUSE action) | UIScene shows pause menu; Phaser handles game loop pause |
| Boss fight mechanics | BossScene (separate scene) | GameEvents bus (signals result to OverworldScene) | Boss needs distinct update loop and camera behavior |
| og:image meta tags | index.html (static HTML) | — | Server-rendered meta; no JS required |

---

## Standard Stack

### Core (inherited from Phase 1 — already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| phaser | 4.1.0 | Game engine — scenes, physics, tilemaps, audio, renderer snapshot | Installed in Phase 1; full TS types; native tilemap + Arcade Physics |
| phaser4-rex-plugins | 4.0.7 | VirtualJoystick for mobile touch input | Installed + smoke-tested in Phase 1; import path confirmed working |
| typescript | 5.7.2 | Type-safe game code | Installed in Phase 1 |
| vite | 6.3.1 | Build + dev server | Installed in Phase 1 |
| vitest | 2.1.9 | Unit tests for services | Installed in Phase 1 |

### New in Phase 2

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| idb-keyval | 6.2.5 | IndexedDB key-value store for local save | Async, non-blocking, 573 bytes brotli'd, authored by Jake Archibald (Google); avoids localStorage 5 MB cap and Safari 7-day eviction risk; recommended in ARCHITECTURE.md |

**Version verification (run during research):**
```bash
npm view idb-keyval version   # → 6.2.5  (2026-06-02)
```

**Installation:**
```bash
npm install idb-keyval
```

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| idb-keyval | Raw IndexedDB API | Raw IDB requires cursor management, version migration callbacks, and verbose boilerplate. idb-keyval wraps this in a 573-byte layer. Only choose raw IDB if you need indexed queries or multiple object stores — not needed for single-slot game save. |
| idb-keyval | `idb` (jake archibald full IDB library) | idb is the right upgrade path if Phase 5 needs indexed queries (e.g., leaderboard local cache). For a simple save-state blob, idb-keyval is sufficient and 10× smaller. |
| 2D array tilemap | Tiled JSON + Tiled GUI | Tiled GUI requires download, learning curve, and round-trip JSON export. For Level 1, a 2D array defined in TypeScript is faster to author and iterate. Migrate to Tiled JSON for Levels 2+ once the pattern is established. |
| Phaser renderer.snapshot() | canvas.toDataURL() | toDataURL() returns black pixels in WebGL mode because the WebGL drawing buffer is cleared after each frame (preserveDrawingBuffer defaults to false). renderer.snapshot() uses readPixels on the correct frame. |

---

## Package Legitimacy Audit

> Packages verified against npm registry via `gsd-tools query package-legitimacy check`.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| phaser | npm | ~12 yrs | 254,385/wk | github.com/phaserjs/phaser | OK | Approved |
| phaser4-rex-plugins | npm | Created 2026-06-02 | 1,359/wk | github.com/rexrainbow/phaser3-rex-notes | SUS (too-new) | Flagged — but already installed + smoke-tested in Phase 1 prod build; Phase 1 acceptance criteria gate already passed |
| idb-keyval | npm | Created 2016; last publish 2026-06-02 | 6,301,218/wk | github.com/jakearchibald/idb-keyval | SUS (too-new publication date) | Approved — package age is 10 years (2016); "too-new" signal is from a recent patch release, not a new package; authored by Jake Archibald (Google Chrome team); 6.3M weekly downloads; authoritative source [CITED: npmjs.com/package/idb-keyval] |

**Packages removed due to SLOP verdict:** none

**Packages flagged as suspicious (SUS):** phaser4-rex-plugins was flagged too-new but cleared by Phase 1 smoke test. idb-keyval was flagged too-new for its recent patch; package history and author identity clear the concern — no checkpoint:human-verify required for idb-keyval. Planner should note that phaser4-rex-plugins is already installed and verified working.

---

## Architecture Patterns

### System Architecture Diagram

```
User Input (touch / keyboard)
    |
    v
[InputBus singleton]  ←── VirtualJoystick (phaser4-rex-plugins, rendered in OverworldScene)
    |                 ←── Phaser cursor keys (keyboard)
    |   activeActions Set (MOVE_UP / DOWN / LEFT / RIGHT / INTERACT / PAUSE)
    v
[OverworldScene] ←── [LevelManifest data] ←── ContentRegistry
    |   Arcade Physics Player sprite
    |   Tilemap layer (2D array → TilemapLayer)
    |   NPC sprites, TriggerZones
    |
    |── TRIGGER_ZONE event ──→ [GameEvents bus]
    |                                 |
    |                     ┌───────────┴──────────────┐
    |                     v                          v
    |          [MiniGameScene]              [BossScene]
    |          (scene.launch → sleep)       (scene.launch → sleep)
    |          emits MINIGAME_COMPLETE      emits BOSS_DEFEATED
    |          ← scene.wake()              ← scene.wake()
    |
    |── PAUSE action ──→ [UIScene overlay] (always parallel)
    |                      DialogueBox, HUD, PauseMenu
    |
    v
[SaveService]  ←── idb-keyval (IndexedDB)
    save on: checkpoint, level_complete, boss_defeated, npc_interact
```

### Recommended Project Structure (Phase 2 additions)

```
src/
├── game/
│   ├── main.ts                     # add OverworldScene, UIScene, DialogueScene, BossScene, PaperThrowScene
│   └── scenes/
│       ├── Boot.ts                 # (Phase 1 — no change)
│       ├── Preloader.ts            # add level-01 asset preload keys
│       ├── MainMenu.ts             # add: on tapToStart → OverworldScene (or load save)
│       ├── OverworldScene.ts       # NEW: top-down map, player, NPCs, triggers
│       ├── UIScene.ts              # NEW: parallel overlay — HUD, dialogue box, pause menu
│       ├── BossScene.ts            # NEW: Mr. Market boss fight
│       └── minigames/
│           └── PaperThrowScene.ts  # NEW: paper-route mini-game (scope-capped)
├── services/
│   ├── SaveService.ts              # NEW: idb-keyval wrapper, versioned save schema
│   ├── ShareService.ts             # NEW: snapshot → Blob → Web Share API
│   ├── ContentRegistry.ts          # extend: register level-01 manifest
│   ├── AudioService.ts             # (Phase 1 — no change)
│   └── i18n.ts                     # (Phase 1 — no change)
├── input/
│   └── InputBus.ts                 # extend: add VirtualJoystick + keyboard bindings
├── entities/
│   ├── Player.ts                   # NEW: physics sprite, state machine (idle/walk/interact)
│   └── NPC.ts                      # NEW: dialogue trigger zone, portrait key
├── systems/
│   └── TriggerSystem.ts            # NEW: zone-based trigger detection on tilemap
├── ui/
│   ├── DialogueBox.ts              # NEW: typewriter text, portrait, advance-on-tap
│   ├── HUD.ts                      # NEW: coin counter, patience timer, pause button
│   └── ShareCard.ts                # NEW: renders 1200×630 card offscreen
├── data/
│   ├── levels/
│   │   └── level-01.ts             # NEW: Level 1 manifest (tilemap array, enemies, triggers)
│   └── dialogue/
│       └── en/
│           └── level-01.json       # NEW: NPC dialogue trees
└── events/
    └── GameEvents.ts               # NEW: typed event name constants + bus singleton export
```

### Pattern 1: Programmatic 2D Array Tilemap (Level 1)

**What:** Define the Level 1 map as a TypeScript 2D number array. Each number is a tile index into a 16×16 tileset PNG. Create the Phaser tilemap from the array at scene create() time.

**When to use:** Level 1 (solo dev, no Tiled experience, AI-generated content). Migrate to Tiled JSON for Level 2+ once the format is proven.

**Example:**
```typescript
// Source: docs.phaser.io/api-documentation/class/tilemaps-tilemap (CITED)
// + Phaser examples CSV/array tilemap pattern (ASSUMED for exact syntax)

// data/levels/level-01-map.ts
export const MAP_DATA: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,2,2,0,0,0,0,0,0,0,0,0,1],
  // ... 30 rows × 15 cols for 480×854 portrait at 32px tiles
];
// tile index 0 = ground, 1 = solid wall, 2 = decoration (non-colliding)

// OverworldScene.create()
const map = this.make.tilemap({
  data: MAP_DATA,
  tileWidth: 32,
  tileHeight: 32
});
const tileset = map.addTilesetImage('omaha_tiles'); // key loaded in Preloader
const groundLayer = map.createLayer(0, tileset, 0, 0)!;
groundLayer.setCollision([1]); // tile index 1 is solid
this.physics.add.collider(this.player.sprite, groundLayer);

// Camera follow
this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1); // lerp smoothing
```

### Pattern 2: VirtualJoystick → InputBus Wiring

**What:** Create the VirtualJoystick in OverworldScene.create(), positioned at bottom-left of screen. In the scene's update() loop (or a subscribed 'update' event), read joystick directional booleans and keyboard cursor keys, write them to InputBus.activeActions. All entities poll InputBus.isActive(Action.*) — they never read raw input.

**Example:**
```typescript
// Source: rexrainbow.github.io/phaser3-rex-notes/docs/site/virtualjoystick/ (CITED)

// src/input/InputBus.ts — Phase 2 extension
import VirtualJoystick from 'phaser4-rex-plugins/plugins/virtualjoystick.js';

export enum Action {
  MOVE_UP    = 'MOVE_UP',
  MOVE_DOWN  = 'MOVE_DOWN',
  MOVE_LEFT  = 'MOVE_LEFT',
  MOVE_RIGHT = 'MOVE_RIGHT',
  INTERACT   = 'INTERACT',
  PAUSE      = 'PAUSE',
}

const activeActions = new Set<Action>();

export const InputBus = {
  isActive: (action: Action) => activeActions.has(action),
  // Called from OverworldScene.update() — passes current joystick + cursor state
  update(joystick: VirtualJoystick | null, cursors: Phaser.Types.Input.Keyboard.CursorKeys | null) {
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
    // INTERACT and PAUSE handled via Phaser pointerdown events separately
  }
};

// OverworldScene.create() — joystick setup
this.joystick = new VirtualJoystick(this, {
  x: 120,           // 120px from left edge (portrait 480px wide)
  y: 760,           // near bottom of 854px canvas
  radius: 80,
  dir: '8dir',
  forceMin: 16,
});
```

### Pattern 3: Scene-as-State Mini-Game Handoff

**What:** OverworldScene sleeps; mini-game launches; on MINIGAME_COMPLETE event, overworld wakes.

**When to use:** Any mechanic requiring its own physics config or input mapping (paper-throw mini-game).

**Example:**
```typescript
// Source: ARCHITECTURE.md Pattern 1 (CITED) + docs.phaser.io/phaser/concepts/scenes (CITED)

// OverworldScene.ts
enterMiniGame(sceneKey: string, data: object): void {
  this.scene.sleep();                          // preserve overworld state
  this.scene.launch(sceneKey, data);           // queued at next Scene Manager update
  GameEvents.once(Events.MINIGAME_COMPLETE, (result: MiniGameResult) => {
    this.scene.stop(sceneKey);                 // shut down mini-game
    this.scene.wake();                         // restore overworld
    this.handleMiniGameResult(result);
    SaveService.save(this.buildSaveState());   // checkpoint write
  });
}

// PaperThrowScene.ts — mini-game completion
GameEvents.emit(Events.MINIGAME_COMPLETE, { score: this.deliveries, perfect: this.perfect });
```

**Critical pitfall:** `scene.launch()` is queued — do NOT read the launched scene's state immediately. Wait for the scene's READY event or the MINIGAME_COMPLETE event bus message.

### Pattern 4: Dialogue System (JSON-driven, typewriter, touch-advance)

**What:** DialogueBox is a Phaser GameObject container in UIScene. NPC interaction triggers DIALOGUE_START event on GameEvents bus with the dialogue key. UIScene fetches the JSON tree, renders typewriter text via `this.time.addEvent`, and advances on pointerdown.

**Example:**
```typescript
// Source: blog.ourcade.co typewriter effect pattern (CITED) + custom JSON structure (ASSUMED)

// data/dialogue/en/level-01.json
{
  "npc_paperboy_rival": [
    { "portrait": "rival_neutral", "text": "HEY! THAT'S MY ROUTE!" },
    { "portrait": "rival_angry",   "text": "MR. MARKET SAYS YOUR PRICES ARE TOO LOW." }
  ]
}

// ui/DialogueBox.ts — typewriter via Phaser timer
showLine(text: string, onComplete: () => void): void {
  this.textObj.setText('');
  let i = 0;
  const timer = this.scene.time.addEvent({
    delay: 30,              // 30ms per char (fast for 8px font readability)
    callback: () => {
      this.textObj.setText(this.textObj.text + text[i++]);
      if (i >= text.length) { timer.destroy(); onComplete(); }
    },
    repeat: text.length - 1
  });
  // Touch/click to skip typewriter (advance immediately)
  this.scene.input.once('pointerdown', () => {
    timer.destroy();
    this.textObj.setText(text);
    onComplete();
  });
}
```

### Pattern 5: Local Save with idb-keyval

**What:** SaveService wraps idb-keyval with a named store ('bw-saves') and a versioned schema. Write on checkpoint events (NPC interact, area transition, boss defeated, level complete). Never write on every frame.

**Example:**
```typescript
// Source: github.com/jakearchibald/idb-keyval (CITED) + custom schema (ASSUMED)
import { createStore, get, set } from 'idb-keyval';

const store = createStore('bw-saves', 'saves');

export const SAVE_VERSION = 1;

export interface SaveState {
  version: number;
  updatedAt: number;
  level: string;               // 'level-01'
  position: { x: number; y: number };
  flags: Record<string, boolean>; // 'boss_01_defeated', 'npc_rival_met', etc.
  coins: number;
  journalUnlocked: string[];
}

export const SaveService = {
  async save(state: SaveState): Promise<void> {
    state.version = SAVE_VERSION;
    state.updatedAt = Date.now();
    await set('slot_1', state, store);   // IndexedDB — always local, never blocks
    // Phase 5: add cloud sync here (fire-and-forget)
  },
  async load(): Promise<SaveState | undefined> {
    const raw = await get<SaveState>('slot_1', store);
    if (!raw) return undefined;
    if (raw.version < SAVE_VERSION) return migrate(raw); // forward migration
    return raw;
  }
};
```

**Schema versioning rule:** `SAVE_VERSION` is a module-level constant. Every breaking change to SaveState shape increments SAVE_VERSION. The `migrate()` function transforms older saves to the current shape. This ensures Phase 5 cloud sync (which adds new fields) does not corrupt Phase 2 saves.

### Pattern 6: Share Card (Canvas Snapshot → Web Share API)

**What:** After boss defeat, ShareService calls `this.game.renderer.snapshot()` to capture the current game frame (WebGL-safe), draws it onto a 1200×630 offscreen canvas alongside a quote and game URL, then either shares via Web Share API Level 2 (iOS ≥ 15.1, Android Chrome) or triggers anchor download as fallback.

**Example:**
```typescript
// Source: docs.phaser.io WebGLRenderer.snapshot API (CITED)
//         web.dev/patterns/files/share-files (CITED)

// services/ShareService.ts
export async function shareCard(game: Phaser.Game, quote: string): Promise<void> {
  // Step 1: Get Phaser snapshot (WebGL-safe — uses readPixels internally)
  const img = await new Promise<HTMLImageElement>((resolve) => {
    game.renderer.snapshot(resolve, 'image/png');
  });

  // Step 2: Render 1200×630 share card on offscreen canvas
  const offscreen = document.createElement('canvas');
  offscreen.width = 1200;
  offscreen.height = 630;
  const ctx = offscreen.getContext('2d')!;
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 1200, 630);
  ctx.drawImage(img, 0, 0, 1200, 630 * 0.75);  // game screenshot in top 75%
  ctx.fillStyle = '#e8e8e8';
  ctx.font = '24px "Press Start 2P"';
  ctx.fillText(quote, 40, 530);                  // quote in lower quarter
  ctx.fillStyle = '#00ff88';
  ctx.font = '16px "Press Start 2P"';
  ctx.fillText('barren-wuffett.pages.dev', 40, 600);

  // Step 3: Convert to Blob
  const blob = await new Promise<Blob>((resolve) => offscreen.toBlob(resolve as any, 'image/png'));
  const file = new File([blob], 'barren-wuffett-victory.png', { type: 'image/png' });

  // Step 4: Web Share API Level 2 or fallback
  const shareData = { files: [file], title: 'Barren Wuffett', text: quote };
  if (navigator.canShare && navigator.canShare(shareData)) {
    await navigator.share(shareData);  // iOS ≥ 15.1, Android Chrome
  } else {
    // Fallback: download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'barren-wuffett-victory.png';
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

### Pattern 7: Pause / Resume (GAME-09)

**What:** Phaser's VisibilityHandler auto-pauses the game loop on tab hide / app background (HIDDEN_EVENT, BLUR_EVENT) and auto-resumes on VISIBLE_EVENT / FOCUS_EVENT. AudioContext is auto-suspended and auto-resumed by Phaser. The game also needs a player-triggered pause: PAUSE action → UIScene shows pause overlay → `this.scene.pause('OverworldScene')`. Resume: `this.scene.resume('OverworldScene')`.

**Example:**
```typescript
// Source: docs.phaser.io/api-documentation/event/core-events (CITED)

// In OverworldScene.create():
// Phaser auto-handles OS interruptions via VisibilityHandler.
// Player-triggered pause via PAUSE action (keyboard Escape or HUD button):
this.game.events.on(Phaser.Core.Events.HIDDEN, () => {
  // Game loop auto-pauses; if music was playing, Phaser suspends AudioContext.
  // No explicit action needed here unless saving state.
  SaveService.save(this.buildSaveState());  // autosave on background
});

// UIScene — pause overlay trigger
GameEvents.on(Events.PAUSE_REQUESTED, () => {
  this.scene.pause('OverworldScene');
  this.pauseOverlay.setVisible(true);
});
GameEvents.on(Events.RESUME_REQUESTED, () => {
  this.scene.resume('OverworldScene');
  this.pauseOverlay.setVisible(false);
});
```

### Anti-Patterns to Avoid

- **Calling canvas.toDataURL() in WebGL mode:** Returns a black image because the WebGL drawing buffer is cleared post-render. Use `game.renderer.snapshot()` instead.
- **Triggering scene.launch() and immediately reading the launched scene's state:** All ScenePlugin operations are queued. The scene is not started until the next Game Manager update tick. Wait for the READY event or the game events bus.
- **Storing all level assets in one texture atlas:** iOS WebGL memory limit (~256 MB GPU-accessible). Hard cap: ≤2048×2048px per atlas. Load per-scene, unload on exit.
- **Using Phaser timer delays < 16ms in game loops:** Creates microtask pressure that causes frame drops on mobile. Minimum meaningful timer interval is one frame (≈16ms at 60fps).
- **Writing to SaveService on every update() tick:** IndexedDB writes are async but frequent writes create contention. Write only on meaningful game events (checkpoint, level complete, boss defeated, NPC interaction complete).
- **Hard-coding the VirtualJoystick position:** Position must be calculated relative to canvas logical size (480px wide) and placed in the safe-area zone (below y=720 on 854px canvas). Hard-coded pixels break on different device DPRs unless using Phaser logical units consistently.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB key-value persistence | Custom IDB wrapper with onsuccess/onerror callbacks | idb-keyval 6.2.5 | Raw IDB requires version upgrade callbacks, cursor management, and error handling chains. idb-keyval handles all this in 573 bytes. The edge cases around DB version upgrades and Safari quirks are pre-handled. |
| WebGL canvas screenshot | Direct canvas.toDataURL() | `game.renderer.snapshot(cb)` | WebGL drawing buffer is cleared after each render frame. `toDataURL()` on a WebGL canvas returns black in all modern browsers unless `preserveDrawingBuffer:true` is set (which degrades performance). Phaser's snapshot API uses `readPixels` on the correct frame. |
| Virtual joystick from scratch | Custom Phaser Circle + pointer tracking | phaser4-rex-plugins VirtualJoystick | The edge cases (multi-touch, force threshold, angle calculation, visual feedback) are well-solved in the rex plugin. Custom joysticks have subtle feel issues on iOS (touch event coordinates vs canvas coordinates at different DPRs). |
| Typewriter text effect | Custom character-by-character string builder with requestAnimationFrame | Phaser `this.time.addEvent({ delay, repeat, callback })` | Phaser's timer is synchronized to the game loop, not the browser event loop. This means typewriter effects stay in sync with paused/resumed game state without extra coordination. |
| iOS audio unlock | Manual AudioContext.resume() in touchstart handler | Phaser's `this.sound.unlock()` in pointerdown handler | Phaser already handles iOS audio unlock when `this.sound.unlock()` is called inside a user gesture handler. This is already wired in MainMenu.ts from Phase 1. |

**Key insight:** In game development, every "simple" utility (IndexedDB wrapper, canvas screenshot, joystick) has at least 3 mobile-specific edge cases that have already been solved by popular libraries. The cost of discovering these edge cases mid-development is higher than the dependency weight.

---

## Common Pitfalls

### Pitfall 1: scene.launch() is Queued — Data is Not Yet Available

**What goes wrong:** Developer calls `this.scene.launch('BossScene', bossData)` then immediately tries to read state from the launched scene. The scene hasn't started yet.

**Why it happens:** All ScenePlugin operations are queued and execute at the start of the next game step, not synchronously.

**How to avoid:** Use the BOSS_DEFEATED / MINIGAME_COMPLETE GameEvents bus event as the confirmation that the scene has fully initialized and produced its result. Never read from a scene that was just launched in the same tick.

**Warning signs:** Any code accessing `this.scene.get('BossScene')` immediately after `this.scene.launch('BossScene')`.

### Pitfall 2: Sleeping Scene Keeps Listening for Input

**What goes wrong:** OverworldScene sleeps while mini-game is active. If OverworldScene has active input listeners that were not cleaned up, they still fire on player touch (the pointerdown events propagate to sleeping scenes depending on configuration).

**Why it happens:** Sleeping scenes don't render or update, but they are not fully shut down. Event listeners attached to `this.input` persist unless explicitly removed.

**How to avoid:** In OverworldScene's SLEEP event handler, call `this.input.off(...)` for all active pointer listeners. Re-add them in the WAKE event handler. Alternatively, check `this.scene.isSleeping()` at the top of any persistent listener.

**Warning signs:** Mini-game receives phantom input from touches meant for the overworld scene.

### Pitfall 3: idb-keyval "too-new" Verdict — Actually 10+ Year Package

**What goes wrong:** The package legitimacy tool flags idb-keyval as SUS due to a recent patch release date (2026-06-02). A planner might incorrectly add a checkpoint:human-verify block.

**Why it happens:** The tool's "too-new" signal is based on the most recent publish date, not the package creation date (2016-08-11). idb-keyval has 10 years of history, 6.3M weekly downloads, and is authored by a Google Chrome team engineer.

**How to avoid:** Treat idb-keyval as approved. The recent publish was a patch release, not a new package. No human-verify checkpoint is needed.

### Pitfall 4: Web Share API Files — iOS requires user gesture in call stack

**What goes wrong:** `navigator.share()` is called from within a Promise chain or async callback that is not directly in the user gesture call stack. iOS Safari throws "NotAllowedError: The request is not allowed by the user agent or the platform in the current context."

**Why it happens:** iOS Safari requires `navigator.share()` to be in the direct call stack of a user gesture handler (pointerdown/click). Async operations between the tap and the share() call break the gesture context on iOS (unlike desktop Chrome which is more lenient).

**How to avoid:** Call `navigator.share()` as close to the pointerdown handler as possible. Pre-generate the Blob and File objects before the share button appears — store them in memory — so the share() call is fast when the user taps. Do not await a Phaser snapshot inside the share handler; take the snapshot at boss defeat time and cache the result.

**Warning signs:** Share works on Android Chrome but throws NotAllowedError on iPhone.

### Pitfall 5: Save Schema Not Versioned — Phase 5 Cloud Sync Breaks

**What goes wrong:** Phase 2 SaveState has fields A, B, C. Phase 5 adds field D for cloud sync. Old saves in IndexedDB don't have field D. Cloud sync reads field D, gets undefined, writes null to Supabase, corrupting data.

**Why it happens:** Schema versioning is skipped as "unnecessary for a simple save file."

**How to avoid:** Include `version: SAVE_VERSION` in every saved object from Day 1. The `load()` function checks version and runs a `migrate()` function for older saves. Keep the migrate() function simple for now (just add default values for missing fields).

### Pitfall 6: VirtualJoystick Position Outside Safe Area

**What goes wrong:** VirtualJoystick is positioned at the logical bottom of the canvas (y=800 on 854px canvas). On iPhone SE with the home button, safe-area-inset-bottom is ~34px, which means the joystick thumb can be cut off or obscured by browser chrome.

**Why it happens:** Safe area insets are handled in CSS (already applied from Phase 1: `padding: env(safe-area-inset-*)`), but the Phaser canvas coordinate system doesn't automatically account for them.

**How to avoid:** Position the VirtualJoystick base at y=750 (leaving ~100px from bottom). On iPhone SE 1st gen (568px logical height), the joystick base must stay within the drawable canvas area. Test the joystick position on the actual device after each adjustment.

### Pitfall 7: Phaser BitmapText Word Wrap Missing for Dialogue

**What goes wrong:** Dialogue text overflows the dialogue box panel on long NPC lines. BitmapText does not auto-wrap text by default.

**Why it happens:** Phaser's BitmapText differs from Text in its wrapping behavior. `setMaxWidth()` truncates; `setWordWrapWidth()` is available on Text objects but BitmapText has a different API.

**How to avoid:** Use Phaser `Text` (not `BitmapText`) for dialogue box content, with `wordWrap: { width: panelWidth - padding }` in the style config. Press Start 2P at 8px is a fixed-width bitmap font and renders the same in either Text or BitmapText, but Text's word-wrap is more predictable. Reserve BitmapText for HUD elements where word wrap is not needed.

---

## Game Design: Level 1 Content Specification

### Level 1 — "The Paper Route" (1936, Young Barren in Omaha)

**Narrative frame:** 6-year-old Barren delivers newspapers in his Omaha neighborhood to save money for his first stock purchase. The overworld is a small grid of 1940s residential streets, a small park, and a general store.

**Overworld structure:**
- Map size: ~15×26 tiles at 32px = 480×832px (fills portrait canvas with minimal scroll)
- 3 NPC interaction zones: (1) Grandpa — teaches patience mechanic tutorial, (2) Store Clerk — hints at Mr. Market, (3) Rival Newsboy — mini-game trigger
- 1 mini-game trigger zone: newspaper delivery area → PaperThrowScene
- 1 boss trigger zone: a rival's "market" stall at the park

**Patience mechanic (GAME-06):** A dog patrols back and forth blocking the optimal delivery route on a 4-second timer. Players who rush around the long way get 10 coins. Players who wait for the gap get 15 coins + a Patience Bonus flag. The timing window is generous (1.5 seconds). The mechanic teaches without explaining. [ASSUMED — game design decision, not researched from external source]

**Mini-game (PaperThrowScene) — scope cap:** Player stands at one end of a row of 5 houses. Tap/click to "throw" the paper toward each house door (timing challenge: throw when the neighbor is at their door for bonus coins). Duration: 60 seconds. Reuses overworld sprites. No new physics system — the "throw" is a simple Tweened projectile, not a physics body. This is explicitly scope-capped per PITFALLS.md Pitfall 1 (no new tileset, no new physics, one new input handler). [ASSUMED — game design decision]

**Boss Fight — Mr. Market #1 (BossScene):**
- Phase 1 (Greed): Mr. Market approaches offering to buy Barren's paper route at wildly inflated prices. Player must DECLINE 3 times while Mr. Market increases the offer. Rushing to accept = bad outcome. Waiting = good outcome. Input: tap DECLINE button (UIScene overlay).
- Phase 2 (Panic): Mr. Market panics and offers pennies on the dollar. Player must ACCEPT within 3 seconds to buy back at discount and win. This teaches the buy-low mechanic experientially.
- Visual: Mr. Market is a 32×48px animated pixel sprite (overweight merchant, top hat, briefcase). Briefcase swings when offering. Color palette: #ff4444 (greed phase) and #4444ff (panic phase) as background tint shifts.
- Victory condition: Accept the discounted offer in Phase 2 within the time window.
- Patience rewarded: completing Phase 1 without rushing gives a higher coin bonus in Phase 2.

[ASSUMED — game design decisions based on ENGAGEMENT.md Mr. Market mechanics]

**Level length target:** 12–18 minutes total: ~8min overworld + ~3min mini-game + ~5min boss. Within ENGAGEMENT.md target of 10-20min.

**Cliffhanger:** After boss defeat, level complete screen shows: "Barren counted his coins. A figure in shadow had watched from across the street. He would return." (teaser for Level 2 Mr. Market). [CITED: ENGAGEMENT.md Level 1 Cliffhanger design]

### Investment Journal Entry 1 (post-boss unlock)

Entry structure (to pass BaFin content checklist):
1. Biographical: "Barren delivered 500 papers a week before most kids had allowances."
2. Principle: "He learned that waiting for the right price matters more than accepting the first offer. Patience is the competitive advantage most people give away for free."
3. Modern example: "Value investors call this 'buying at a discount to intrinsic value.' The stock market offers these moments to those who wait for them."
4. Soft pointer: "I apply this same principle in my public portfolio. You can see how at [link]." (only appears in Entries 4+; omitted from Entry 1 per ENGAGEMENT.md rule)

Disclaimer (mandatory per PITFALLS.md Pitfall 8): "This is personal opinion and entertainment, not investment advice."

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Phaser 3 rex plugins | phaser4-rex-plugins (separate package) | Phaser 4 release (April 2026) | Wrong package name = silent import error; correct package verified in Phase 1 prod build |
| canvas.toDataURL() for screenshots | game.renderer.snapshot() | Since WebGL default behavior | toDataURL() returns black in WebGL; snapshot() uses readPixels safely |
| localStorage for game saves | idb-keyval + IndexedDB | Best practice ~2019+ | localStorage is synchronous, 5MB cap, 7-day Safari eviction; IndexedDB is async, larger quota |
| Manual AudioContext unlock in touchstart | Phaser sound.unlock() in pointerdown | Phaser 3.60+ | Phaser handles the iOS unlock pattern natively when called in user gesture handler |
| Web Share API Level 1 (text/URL only) | Web Share API Level 2 (files) | iOS 15.1 (2021), Android Chrome 86 | File sharing (PNG Blob) now works on all major mobile platforms; fallback still needed for desktop Chrome |
| Tiled JSON required for all tilemaps | 2D array / CSV also supported | Always in Phaser | Solo devs can ship Level 1 without learning Tiled; migrate to Tiled JSON for multi-level projects |

**Deprecated/outdated:**
- `phaser3-rex-plugins`: The Phaser 3 package; using it with Phaser 4 will cause import resolution failures (the CLAUDE.md stack notes confirm this risk)
- `localStorage` for save data: Synchronous writes block render loop; Safari 7-day PWA eviction destroys saves without warning
- `html2canvas` library for share cards: Requires a DOM render tree; Phaser games render to canvas directly, making html2canvas unnecessary and unreliable

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Level 1 map: 15×26 tiles at 32px = 480×832px fits portrait canvas with minimal scroll | Game Design: Level 1 Content | Map may need scrolling or different tile size; test with actual tileset |
| A2 | PaperThrowScene uses a Tweened projectile (not Arcade Physics body) for paper throw | Game Design: Mini-game | If throw feel is wrong, may need physics body; adds scope |
| A3 | Mr. Market boss fight is a button-tap interaction (DECLINE/ACCEPT) not a combat scene | Game Design: Boss Fight | If player testing finds "tap a button" boring, may need more action-oriented mechanics |
| A4 | Patience bonus mechanic: dog patrol with 4-second timer, 1.5-second gap window | Game Design: Patience Mechanic | Timer values need playtesting; too short = frustrating, too long = trivial |
| A5 | VirtualJoystick base position at x=120, y=750 (portrait canvas 480×854) | Pattern 2: VirtualJoystick | May need adjustment per device safe-area; test on real iPhone SE |
| A6 | Press Start 2P font at 8px works for dialogue box text with 30ms typewriter delay | Pattern 4: Dialogue System | Readability on small screens needs testing; may need 16px for dialogue |
| A7 | BossScene and OverworldScene share the same physics world settings | Architecture | If boss requires different gravity/collision behavior, may need separate config |
| A8 | og:image can be a static 1200×630 PNG pre-rendered asset in public/ (no server-side generation needed) | VIRL-02 | Static og:image is sufficient if the game URL is for a single level/game state; dynamic per-level og:image would need server-side rendering |
| A9 | idb-keyval createStore('bw-saves', 'saves') namespaces saves away from other IDB databases on the same domain | Pattern 5: Local Save | Verify custom store API in idb-keyval v6 before implementing; API changed between v4 and v5 |

---

## Open Questions

1. **Tileset art: free asset pack vs AI-generated**
   - What we know: Kenney top-down packs (RPG Urban, Tiny Dungeon) provide CC0 16×16/32×32 tiles. PixelLab AI generates custom sprites.
   - What's unclear: Are there Kenney packs that fit a 1940s small-town USA aesthetic without looking anachronistic (no sci-fi elements, no fantasy tiles)?
   - Recommendation: Start with Kenney's RPG assets as placeholder (gray, industrial tiles map plausibly to 1940s streets), then commission 3-5 custom PixelLab sprites for Barren and Mr. Market. Revisit art polish after gameplay is validated.

2. **idb-keyval createStore API in v6**
   - What we know: The GitHub README references `createStore()` but the exact API for v6 may differ from older blog posts.
   - What's unclear: Is `createStore(dbName, storeName)` the exact signature in v6?
   - Recommendation: Verify against the npm package's bundled index.js or README in the installed package before writing SaveService. [ASSUMED: the API signature above — verify at implementation time]

3. **iOS 15.1+ file share via Web Share API — exact version floor**
   - What we know: iOS 15 shipped Web Share API Level 2 file support. iOS Safari 12.1 shipped Level 1.
   - What's unclear: The exact minimum iOS version for `navigator.canShare({ files: [...] })` returning true reliably.
   - Recommendation: Use `navigator.canShare(data)` check before every share attempt. If it returns false (older iOS, desktop browsers), fall back to anchor download. Do not assume file sharing works.

4. **Phaser 4 BitmapText vs Text for dialogue**
   - What we know: Press Start 2P is a fixed-width bitmap font; both Text and BitmapText can render it.
   - What's unclear: Does Phaser 4 BitmapText support setWordWrapWidth() or equivalent?
   - Recommendation: Use `this.add.text()` for dialogue (reliable word wrap via `wordWrap` style option); use `this.add.bitmapText()` only for HUD elements where word wrap is never needed.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build + test | ✓ | v24.14.0 | — |
| npm | Package install | ✓ | (from Node) | — |
| idb-keyval | SaveService | Not yet installed | 6.2.5 (verified on npm) | — (install in Wave 0) |
| Web Share API | Share card | ✓ on iOS ≥ 15.1, Android Chrome | Native browser API | anchor[download] fallback |
| PixelLab AI | Custom sprites | ✓ (web tool, freemium) | Current | Kenney placeholder assets |
| Tiled Map Editor | Level design | Not needed for Level 1 (2D array approach) | — | 2D array in TypeScript |
| Aseprite | Sprite animation | ✗ (not required for Level 1 placeholders) | — | Use Kenney CC0 sprites as placeholders |

**Missing dependencies with no fallback:** none

**Missing dependencies with fallback:** idb-keyval (install in Wave 0 task), Aseprite (use Kenney CC0 placeholders for Level 1 MVP, polish in later iteration)

---

## Validation Architecture

> nyquist_validation is enabled (not explicitly false in .planning/config.json).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 2.1.9 |
| Config file | vitest.config.ts (exists from Phase 1) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |
| Test environment | node (services are pure TS, no Phaser dependency) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SAVE-01 | SaveService.save() writes to IndexedDB, SaveService.load() retrieves it | unit (vitest, node + fake-indexeddb) | `npm test -- tests/save-service.test.ts` | Wave 0 gap |
| SAVE-01 | SaveService schema version migration: v0 → v1 | unit | `npm test -- tests/save-service.test.ts` | Wave 0 gap |
| SAVE-02 | SaveService has no Supabase import or network calls | unit (static import check) | `npm test -- tests/save-service.test.ts` | Wave 0 gap |
| GAME-01 | InputBus.update() writes joystick booleans to activeActions Set | unit | `npm test -- tests/input-bus.test.ts` | Wave 0 gap |
| GAME-01 | InputBus.isActive(Action.MOVE_UP) returns true after joystick.up | unit | `npm test -- tests/input-bus.test.ts` | Wave 0 gap |
| GAME-05 | Dialogue JSON parses correctly; all NPC dialogue keys exist | unit | `npm test -- tests/dialogue.test.ts` | Wave 0 gap |
| VIRL-02 | index.html contains og:image, og:title, og:description meta tags | unit (DOM parse) | `npm test -- tests/og-tags.test.ts` | Wave 0 gap |
| VIRL-01 | ShareService ShareCard generation (offscreen canvas) produces non-empty Blob | unit (jsdom) | `npm test -- tests/share-service.test.ts` | Wave 0 gap |
| GAME-09 | PauseScene or UIScene pause toggle | manual only | n/a — requires Phaser game instance | manual map below |
| GAME-06 | Patience bonus flag set when player waits for dog patrol gap | manual only | n/a — requires game loop timing | manual map below |
| GAME-01 | Virtual joystick moves player on real iPhone SE | device test | n/a | manual map below |
| SAVE-01 | Progress survives page refresh (real IndexedDB) | device test | n/a | manual map below |

**Note on Phaser scene tests:** Phaser requires a browser/WebGL context and cannot be unit-tested in vitest's node environment. Scene-level behavior (player movement, camera follow, scene handoff) is verified via manual device testing only, following the pattern established in Phase 1.

**Node-testable services:** SaveService, InputBus binding logic (mock joystick), Dialogue JSON structure, og:image presence in index.html, ShareService Blob generation (requires jsdom for canvas mock).

### Manual Test Map (device-only checks)

| Check | Device | Acceptance Criterion |
|-------|--------|----------------------|
| Virtual joystick moves player | iPhone SE (real device) | Joystick base appears at bottom-left; moving thumb moves player sprite; no 300ms delay |
| Keyboard WASD/arrows move player | Desktop Chrome | Player moves in all 4 directions; speed correct |
| NPC dialogue triggers on INTERACT | Any | Dialogue box appears; typewriter runs at readable speed; tap/click advances |
| Mini-game launches and overworld resumes | Any | PaperThrowScene appears; on complete, overworld resumes with coins updated |
| Boss fight completes | Any | Both phases complete; BOSS_DEFEATED event fires; level complete screen shows |
| Save persists across refresh | iPhone Safari | Complete 1 NPC interaction; refresh; game resumes at correct position |
| Audio works on first tap | iPhone SE (real device) | Music starts on first tap of TAP TO START (already passing from Phase 1) |
| Share card generates | iPhone | Share sheet opens with PNG image; image is not black; image is 1200×630 |
| Share fallback on desktop | Desktop Chrome | Download dialog appears with correct PNG filename |
| Pause/resume works | Any | Pause button or Escape key pauses; resume button resumes; audio pauses with game |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + manual device test checklist complete before phase sign-off

### Wave 0 Gaps
- [ ] `tests/save-service.test.ts` — covers SAVE-01, SAVE-02 (requires `fake-indexeddb` devDependency for node test environment)
- [ ] `tests/input-bus.test.ts` — covers GAME-01 binding logic (mock joystick stub)
- [ ] `tests/dialogue.test.ts` — covers GAME-05 JSON structure validity
- [ ] `tests/og-tags.test.ts` — covers VIRL-02 (reads index.html as string, asserts meta tags present)
- [ ] `tests/share-service.test.ts` — covers VIRL-01 Blob generation (jsdom canvas mock)
- [ ] Install `fake-indexeddb` as devDependency: `npm install --save-dev fake-indexeddb`

---

## Security Domain

> security_enforcement is enabled (absent = enabled) in config. ASVS Level 1 per config.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No (Phase 2 has no auth) | — |
| V3 Session Management | No (no sessions in Phase 2) | — |
| V4 Access Control | No (no user accounts) | — |
| V5 Input Validation | Yes (NPC dialogue key lookup, save state deserialization) | TypeScript type guards on SaveState deserialization; dialogue keys are string literals (no eval) |
| V6 Cryptography | No (no sensitive data in Phase 2) | — |
| V9 Communication | Yes (Web Share API, og:image) | HTTPS enforced by Cloudflare Pages; Web Share API is HTTPS-only |
| V12 File / Upload | Partial (share card generates a PNG Blob) | Blob is created locally from canvas data; no file upload to server; no XSS vector |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed save state (corrupted IndexedDB) | Tampering | Type guard + version check in SaveService.load(); return undefined (new game) on invalid shape |
| XSS via NPC dialogue JSON injection | Tampering | Dialogue JSON is bundled as a static asset (not fetched from user input or external API); no eval(); Phaser Text renders as text, not HTML |
| Web Share API called outside user gesture | Repudiation | Pre-generate share card Blob at boss defeat time; store reference; call navigator.share() only in direct pointerdown handler |
| og:image pointing to non-existent asset | Information Disclosure | Verify og:image asset path exists in public/ before deploying; covered by og-tags test |

---

## Sources

### Primary (MEDIUM confidence — context7 provider)
- docs.phaser.io/phaser/concepts/scenes — Scene lifecycle: sleep, wake, launch, stop, pause, resume; queue-basis behavior
- docs.phaser.io/api-documentation/class/scenes-sceneplugin — ScenePlugin method signatures with data parameters
- docs.phaser.io/api-documentation/event/core-events — HIDDEN_EVENT, BLUR_EVENT, VISIBLE_EVENT, FOCUS_EVENT
- docs.phaser.io/phaser/concepts/physics/arcade — Arcade Physics: velocity, tilemap collider, camera follow, world bounds
- docs.phaser.io/api-documentation/class/tilemaps-tilemap — Tilemap.createLayer(), addTilesetImage(), setCollision()
- docs.phaser.io/phaser/concepts/audio — sound.unlock(), audio sprite, AudioContext auto-suspend/resume
- rexrainbow.github.io/phaser3-rex-notes/docs/site/virtualjoystick/ — VirtualJoystick config, directional booleans, force/angle API

### Secondary (MEDIUM confidence — web, cited from official sources)
- github.com/jakearchibald/idb-keyval — idb-keyval API: createStore, get, set, del, entries; v6 API confirmed
- web.dev/patterns/files/share-files — Web Share API Level 2 file sharing pattern; canShare() usage; iOS Safari 12.1+ support
- developer.mozilla.org/en-US/docs/Web/API/Web_Share_API — canShare(), transient activation requirement, HTTPS requirement
- blog.ourcade.co/posts/2020/phaser-3-typewriter-text-effect-bitmap/ — BitmapText typewriter via time.addEvent()

### Tertiary (LOW confidence — training knowledge)
- Level 1 game design content (paper route, patience mechanic, boss fight phases): [ASSUMED] based on ENGAGEMENT.md design principles applied to 1940s Buffett biography
- Specific VirtualJoystick x/y coordinates for portrait canvas: [ASSUMED] based on canvas dimensions
- Save schema field names and structure: [ASSUMED] based on architectural patterns from ARCHITECTURE.md
- BitmapText vs Text recommendation for dialogue: [ASSUMED] based on Phaser documentation patterns

---

## Metadata

**Confidence breakdown:**
- Standard Stack: MEDIUM — packages verified on npm registry; Phaser 4 API verified via official docs; idb-keyval verified on GitHub
- Architecture: MEDIUM — scene patterns confirmed in official Phaser docs; specific Phaser 4 vs 3 API parity is mostly confirmed but some edge cases are assumed
- Game Design Content: LOW — Level 1 content (map layout, boss phases, patience mechanic timings) is original design; needs playtesting
- Pitfalls: HIGH — all pitfalls verified against known patterns (WebGL black screenshot, iOS user gesture, idb-keyval schema versioning)
- Share Card: MEDIUM — Web Share API support matrix verified via MDN and web.dev; Phaser snapshot approach verified via official API docs

**Research date:** 2026-06-12
**Valid until:** 2026-07-12 (30 days — Phaser 4 is stable; idb-keyval is stable; Web Share API support matrix is stable)
