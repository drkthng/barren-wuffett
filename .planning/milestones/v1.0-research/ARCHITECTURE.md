# Architecture Research

**Domain:** Mobile-first HTML5/PWA top-down adventure game with heterogeneous mini-game mechanics, offline-first save, and optional BaaS backend
**Researched:** 2026-06-11
**Confidence:** HIGH (core patterns are Phaser 3 standard; BaaS integration patterns are well-documented; offline-first strategy is widely validated)

## Standard Architecture

### System Overview

```
┌───────────────────────────────────────────────────────────────┐
│                     Browser / PWA Shell                        │
│   Service Worker (offline cache) · Web App Manifest            │
├───────────────────────────────────────────────────────────────┤
│                     Phaser 3 Game Instance                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│  │  Scene    │  │  Asset    │  │  Audio    │  │  Input    │  │
│  │  Manager  │  │  Loader   │  │  Manager  │  │  Manager  │  │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  │
│        │              │              │              │          │
│  ┌─────┴──────────────┴──────────────┴──────────────┴──────┐  │
│  │               Global Event Bus (singleton)               │  │
│  └─────┬──────────────────────────────────────────────┬─────┘  │
│        │                                              │         │
│  ┌─────┴─────────────────────┐  ┌────────────────────┴──────┐  │
│  │     Scene Stack           │  │   UI Overlay Scene        │  │
│  │  (active game/mini-game)  │  │   (HUD, dialogue, menus)  │  │
│  └───────────────────────────┘  └───────────────────────────┘  │
├───────────────────────────────────────────────────────────────┤
│                     Game Services Layer                        │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│  │   Save    │  │  Content  │  │   i18n    │  │  Journal  │  │
│  │  Service  │  │  Registry │  │  Service  │  │  Service  │  │
│  └─────┬─────┘  └───────────┘  └───────────┘  └───────────┘  │
│        │                                                       │
│  ┌─────┴──────────────────────────────────────────────────┐   │
│  │              Local Store (IndexedDB via idb-keyval)     │   │
│  └─────┬──────────────────────────────────────────────────┘   │
│        │ (async, on user opt-in)                               │
├────────┴──────────────────────────────────────────────────────┤
│                     Backend (Supabase free tier)               │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐                  │
│  │   Auth    │  │  cloud_   │  │  leader-  │                  │
│  │ (anon →   │  │  saves    │  │  board    │                  │
│  │  email)   │  │  table    │  │  table    │                  │
│  └───────────┘  └───────────┘  └───────────┘                  │
└───────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Scene Manager | Lifecycle: start, pause, sleep, stop scenes; manage rendering order | Phaser 3 built-in (`this.scene.*`) |
| Global Event Bus | Decoupled cross-scene messaging without coupling scene classes | Singleton `Phaser.Events.EventEmitter` instance exported as module |
| Input Manager | Unified pointer/touch/keyboard abstraction; virtual joystick on mobile | Phaser pointer API + `phaser3-rex-notes` virtual joystick plugin |
| Asset Loader | Per-scene preload queues; shared global cache; lazy-load per level | Phaser built-in loader; assets in `public/assets/` served by Vite |
| Audio Manager | BGM/SFX; mobile autoplay unlock; mute state; cross-scene persistence | Phaser Sound Manager (wraps Web Audio + HTML5 Audio fallback) |
| Save Service | Local-first CRUD on save slots; async cloud push on opt-in | `idb-keyval` for IndexedDB; Supabase JS client for cloud |
| Content Registry | Central manifest of all levels, mini-games, characters, journal entries | Plain JSON/TypeScript data files; loaded at boot, never at runtime |
| i18n Service | Key-based text lookup; current locale; easy language swap | `i18next` (< 10 KB, zero deps); JSON namespace files per locale |
| Journal Service | Track unlocked entries; serialize/deserialize to save state | Pure functions over save-state slice; entries defined in content data |
| UI Overlay Scene | Always-on HUD (hearts, coins, pause); dialogue boxes; menus | Separate Phaser scene running in parallel above game scenes |

## Recommended Project Structure

```
barren-wuffett/
├── public/
│   ├── assets/
│   │   ├── sprites/          # sprite sheets, character atlases
│   │   ├── tilemaps/         # Tiled JSON export + tileset PNGs
│   │   ├── audio/            # BGM (ogg+mp3), SFX (ogg+mp3)
│   │   └── fonts/            # bitmap fonts for retro look
│   ├── manifest.webmanifest  # PWA manifest
│   └── sw.js                 # service worker (Workbox generated)
├── src/
│   ├── main.ts               # Phaser Game config + boot
│   ├── scenes/
│   │   ├── BootScene.ts      # minimal scene: load manifest, init services
│   │   ├── PreloadScene.ts   # global assets (UI sheet, common SFX)
│   │   ├── MainMenuScene.ts
│   │   ├── OverworldScene.ts # top-down adventure core
│   │   ├── UIScene.ts        # persistent HUD overlay (parallel)
│   │   ├── DialogueScene.ts  # modal dialogue overlay
│   │   ├── minigames/
│   │   │   ├── PlatformerScene.ts   # Mario-style segment
│   │   │   ├── PointClickScene.ts   # point & click segment
│   │   │   └── ResourceScene.ts     # Kingdom-style resource mini
│   │   ├── BossScene.ts      # boss fight (uses overworld + extra logic)
│   │   └── JournalScene.ts   # collectible viewer (overlay)
│   ├── services/
│   │   ├── SaveService.ts    # local IndexedDB + cloud sync
│   │   ├── ContentRegistry.ts # load + validate content manifests
│   │   ├── i18n.ts           # i18next wrapper + locale types
│   │   ├── AudioService.ts   # wraps Phaser sound, handles unlock
│   │   └── SupabaseClient.ts # single Supabase client instance
│   ├── input/
│   │   ├── InputBus.ts       # unified action enum (MOVE_LEFT, INTERACT…)
│   │   ├── KeyboardBinding.ts
│   │   └── TouchBinding.ts   # virtual joystick + tap zones
│   ├── data/
│   │   ├── levels/
│   │   │   ├── level-01.ts   # level manifest: tilemap, enemies, triggers
│   │   │   └── level-02.ts
│   │   ├── dialogue/
│   │   │   └── en/           # JSON dialogue trees per character
│   │   ├── journal/
│   │   │   └── entries.ts    # journal entry definitions + unlock conditions
│   │   └── characters.ts     # NPC/enemy stats, sprite keys
│   ├── entities/
│   │   ├── Player.ts         # player game object + state machine
│   │   ├── NPC.ts
│   │   └── Enemy.ts
│   ├── systems/
│   │   ├── CollisionSystem.ts
│   │   ├── TriggerSystem.ts  # zone-based event triggers in tilemaps
│   │   └── CameraSystem.ts
│   ├── ui/
│   │   ├── DialogueBox.ts
│   │   ├── HUD.ts
│   │   └── JournalCard.ts
│   └── events/
│       └── GameEvents.ts     # typed event name constants + event bus export
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### Structure Rationale

- **`src/scenes/minigames/`:** Each mini-game is an isolated Phaser scene. The overworld pauses/sleeps when a mini-game launches; it resumes when the mini-game emits `MINIGAME_COMPLETE`. This creates zero coupling between mechanics.
- **`src/services/`:** All backend and persistence concerns live outside scenes. Scenes call service functions; services never reference scene objects. This keeps scenes testable and swappable.
- **`src/data/`:** Content-as-data. Level packs, characters, journal entries are TypeScript data objects (or JSON). Adding a new level = adding a file and registering it in `ContentRegistry`. No engine code changes.
- **`src/input/InputBus.ts`:** Scenes request actions (`isActive(Action.MOVE_LEFT)`) not raw keys. This is the single switch point to support touch, keyboard, or gamepad identically.
- **`public/assets/`:** All assets in `public/` are served as static files by Vite (no bundling overhead, direct URL). Phaser's loader fetches them at scene preload time.

## Architectural Patterns

### Pattern 1: Scene-as-State (Heterogeneous Mini-Games)

**What:** Each distinct mechanic (top-down, platformer, point-and-click, boss) is its own Phaser scene. The overworld `sleep()`s the current scene and `launch()`es the mini-game scene, passing parameters via `scene.start(key, data)`. When the mini-game emits `MINIGAME_COMPLETE` on the event bus, the overworld `wake()`s and the mini-game stops.

**When to use:** Whenever a mechanic needs its own physics config, camera behavior, or input mapping that would conflict with the parent scene.

**Trade-offs:** Slight startup latency per mini-game scene (mitigated by pre-creating scenes in config); each scene has its own asset scope so shared assets must be in global cache.

**Example:**
```typescript
// OverworldScene.ts — entering a mini-game zone
enterMiniGame(key: string, data: object) {
  this.scene.sleep();                   // preserve overworld state
  this.scene.launch(key, data);         // start mini-game scene
  GameEvents.once(Events.MINIGAME_COMPLETE, (result) => {
    this.scene.stop(key);
    this.scene.wake();
    this.handleMiniGameResult(result);
  });
}
```

### Pattern 2: Content-as-Data (Level Manifests)

**What:** Every level is described by a TypeScript data object (not a class). The object declares the tilemap key, enemy spawn list, trigger zones, mini-game references, dialogue tree keys, and journal unlock conditions. The engine reads manifests; it never hard-codes level logic.

**When to use:** Always — this is the foundation for selling future level packs without engine changes.

**Trade-offs:** Requires discipline to keep logic out of manifests; complex behaviours may need a small scripting hook (a `onEnter` callback reference).

**Example:**
```typescript
// data/levels/level-01.ts
export const level01: LevelManifest = {
  id: "level-01",
  titleKey: "level.paperRoute.title",
  tilemapKey: "tilemap_level01",
  bgmKey: "bgm_paperroute",
  enemies: [{ type: "newsboy_rival", spawnTile: { x: 10, y: 5 } }],
  triggers: [
    { zone: "zone_minigame_01", action: "launch_scene", target: "PlatformerScene" },
    { zone: "zone_boss", action: "launch_scene", target: "BossScene", data: { bossId: "mr_market_01" } },
  ],
  journalUnlock: "entry_paper_route",
};
```

### Pattern 3: Local-First Save with Lazy Cloud Sync

**What:** All game state writes go to IndexedDB immediately and synchronously from the player's perspective. Cloud sync is a fire-and-forget async operation attempted after every save, only if the player has linked an email (Supabase anonymous → email upgrade). Failures are silent; next successful sync wins.

**When to use:** This is the only correct architecture for an offline-first game with optional backend. Never make cloud sync blocking.

**Trade-offs:** Conflict resolution is simplistic (newest timestamp wins, or prompt user on load). No real-time multi-device sync. Sufficient for a single-player game.

**Example:**
```typescript
// services/SaveService.ts
async save(slot: SaveSlot): Promise<void> {
  slot.version = SAVE_VERSION;
  slot.updatedAt = Date.now();
  await set(`save_${slot.id}`, slot);         // IndexedDB — always first
  if (supabase.auth.getUser()?.email) {
    syncToCloud(slot).catch(() => {});         // fire-and-forget
  }
}
```

### Pattern 4: Unified Input Bus (Touch + Keyboard)

**What:** An `InputBus` singleton maps raw inputs to named `Action` values. Scenes and entities read `InputBus.isActive(Action.MOVE_LEFT)` only. The `TouchBinding` module positions a virtual joystick on mobile; `KeyboardBinding` maps arrow/WASD. Both write to the same `activeActions` set.

**When to use:** From day one. Retrofitting unified input onto a keyboard-only game is painful.

**Trade-offs:** Slight indirection; worth it entirely. Joystick has analog data (angle, force) that the bus exposes as extended properties for the platformer scene.

## Data Flow

### Scene Launch Flow (Mini-Game)

```
Player enters trigger zone (TriggerSystem)
    ↓
TriggerSystem emits Events.TRIGGER_ZONE on GameEvents bus
    ↓
OverworldScene handler receives event
    ↓
OverworldScene.sleep() → scene.launch("PlatformerScene", manifest.triggerData)
    ↓
PlatformerScene.init(data) → PlatformerScene.preload() → PlatformerScene.create()
    ↓
[Player completes or fails mini-game]
    ↓
PlatformerScene emits Events.MINIGAME_COMPLETE on GameEvents bus
    ↓
OverworldScene.wake() → scene.stop("PlatformerScene")
    ↓
SaveService.save(currentState)
```

### Save / Cloud Sync Flow

```
Game event (level complete, journal unlock, checkpoint)
    ↓
Scene calls SaveService.save(stateSlice)
    ↓
SaveService → idb-keyval.set() [IndexedDB, async, non-blocking]
    ↓
SaveService checks: is user authenticated with email?
    ├─ NO  → done (fully offline, game continues)
    └─ YES → Supabase.upsert(cloud_saves, { user_id, data, updated_at })
                  ↓ success: silent
                  ↓ failure: queued for next attempt (simple retry flag in localStorage)
```

### Input Flow

```
User physical input (touch / keyboard / gamepad)
    ↓
Phaser Input Manager (pointer events / cursors)
    ↓
TouchBinding / KeyboardBinding writes to InputBus.activeActions Set
    ↓
Entity update() reads InputBus.isActive(Action.*)
    ↓
Entity state machine applies movement / interaction
```

### i18n Text Flow

```
Content data references string key  (e.g. "ui.hearts.label")
    ↓
UI component calls i18n.t("ui.hearts.label")
    ↓
i18next looks up current locale namespace (en/common.json)
    ↓
Returns translated string; falls back to key if missing
```

### Email Capture / Account Upgrade Flow

```
Player reaches cloud-save prompt (checkpoint or leaderboard submit)
    ↓
UIScene shows email capture modal
    ↓
Player enters email
    ↓
Supabase.auth.updateUser({ email }) → sends verification email (double opt-in)
    ↓
Player verifies → anonymous session upgraded to permanent email user
    ↓
SaveService.syncToCloud() runs immediately with full save state
    ↓
GDPR consent recorded in save state (timestamp + scope)
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–1k users | Supabase free tier is sufficient (500 MB DB, 50k MAU). No changes needed. |
| 1k–50k users | Monitor Supabase MAU; anonymous sessions that never convert inflate count. Add anonymous session TTL cleanup cron (Supabase Edge Function). Consider Cloudflare R2 for asset hosting if bandwidth spikes. |
| 50k+ users | Evaluate Supabase Pro ($25/mo). Add Redis-backed leaderboard cache (Upstash free tier first). CDN-front all static assets. Potentially migrate to self-hosted Supabase to control costs. |

### Scaling Priorities

1. **First bottleneck: Supabase MAU quota.** Every anonymous sign-in counts. Delay `signInAnonymously()` until the player actively requests cloud save — not at game boot. This alone extends free-tier runway 10x.
2. **Second bottleneck: asset bandwidth.** 16-bit sprites are small, but audio adds up. Use Cloudflare Pages for hosting (unlimited bandwidth on free tier). Use Vite asset fingerprinting for aggressive cache headers.

## Anti-Patterns

### Anti-Pattern 1: Monolithic Scene

**What people do:** Put all game logic — overworld, mini-games, UI, dialogue — inside one giant Phaser scene.

**Why it's wrong:** Mini-games need conflicting physics configs (arcade vs. matter). UI updates during transitions become race conditions. The scene update loop becomes unmanageable. Adding a new mini-game requires editing shared state everywhere.

**Do this instead:** One scene per mechanic. Use `scene.sleep()` / `scene.wake()` to preserve state across transitions. Run UI as a permanently-layered parallel scene.

### Anti-Pattern 2: Cloud Save at Boot

**What people do:** Call `supabase.auth.signInAnonymously()` on game start so every player is "tracked."

**Why it's wrong:** Every session — including bots, previews, and people who close the tab in 5 seconds — counts as a Supabase MAU. At 50k MAU you are paying. Also triggers privacy/GDPR questions before the player has any reason to trust the game.

**Do this instead:** Play is fully anonymous and local until the player explicitly requests cloud save or leaderboard submission. Only then create/link a Supabase identity.

### Anti-Pattern 3: Hard-Coded Level Logic in Scenes

**What people do:** Write `if (levelId === 'level-01') { spawnEnemyAt(10, 5); }` directly in scene code.

**Why it's wrong:** Adding level packs means modifying engine code, risking regressions, and making the codebase unreadable.

**Do this instead:** Level manifests in `src/data/levels/`. The overworld scene reads manifests and dispatches to generic systems. New level = new data file only.

### Anti-Pattern 4: `localStorage` for Save Data

**What people do:** Use `localStorage.setItem('save', JSON.stringify(bigObject))`.

**Why it's wrong:** `localStorage` is synchronous; large writes block the render loop causing frame drops. It has a 5–10 MB limit. Safari clears it after 7 days of inactivity. Structured save state quickly exceeds the limit once journal entries and level flags accumulate.

**Do this instead:** `idb-keyval` (1.1 KB) wrapping IndexedDB. Async, no blocking, far larger quota, same simple key-value API.

### Anti-Pattern 5: Embedding i18n Strings in Scene Code

**What people do:** Write `this.add.text(0, 0, 'Press START to begin')` directly in TypeScript.

**Why it's wrong:** German localization becomes a global search-and-replace. String context is lost. Pluralization rules differ per language.

**Do this instead:** Every visible string is a key (`'menu.pressStart'`). All text passes through `i18n.t()`. JSON locale files live in `public/locales/en/` and `public/locales/de/`. Adding German = adding one folder of JSON files.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase Auth | `supabase.auth.signInAnonymously()` on opt-in; `updateUser({ email })` for upgrade | Single client instance in `SupabaseClient.ts`; never import Supabase directly in scenes |
| Supabase DB | `supabase.from('cloud_saves').upsert(...)` in SaveService; `from('leaderboard').insert(...)` | Row-level security: users can only read/write their own rows |
| Cloudflare Pages | Static hosting; Vite build output deployed to Pages | Free tier has unlimited bandwidth; set aggressive cache headers on `public/assets/` |
| Service Worker | Workbox `generateSW` in Vite build; pre-caches shell + critical assets | Game must be fully playable offline after first load |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Scene ↔ Scene | `GameEvents` bus (events only; no direct scene references) | Prevents tight coupling; scenes can be added/removed without touching others |
| Scene → Service | Direct function call (services are plain modules) | Services have no Phaser dependency; unit-testable |
| Service → Supabase | `SupabaseClient.ts` singleton | All backend calls in one place; easy to mock or swap |
| Content Data → Scene | `ContentRegistry.getLevel(id)` returns typed manifest | Scenes never import level data directly; registry validates at boot |
| InputBus → Entity | `InputBus.isActive(Action)` polled in entity `update()` | No callbacks; polling is simpler and avoids event listener leaks |

## Suggested Build Order

Build in this sequence to unblock each subsequent phase:

1. **Vite + Phaser 3 + TypeScript scaffold** — project skeleton, PWA manifest, service worker shell
2. **Boot / Preload / MainMenu scenes** — proves scene lifecycle, establishes asset pipeline
3. **InputBus** — touch + keyboard abstraction before any game entity
4. **OverworldScene (walking + tilemap)** — core loop, camera, collision; no enemies yet
5. **ContentRegistry + first level manifest** — data-driven level loading proven early
6. **i18n Service** — wire up from the start; costs nothing and prevents technical debt
7. **UIScene (HUD) + DialogueBox** — parallel scene pattern established; dialogue system
8. **Entity system (Player, NPC, Enemy)** — game objects with state machines
9. **TriggerSystem** — zone-based event triggers; prerequisite for mini-game handoff
10. **First mini-game scene** — proves Scene-as-State pattern; validates mini-game handoff
11. **SaveService (local only, IndexedDB)** — offline save before any backend work
12. **Journal Service + JournalScene** — collectible system on top of save state
13. **BossScene** — boss fight mechanics; uses trigger system already built
14. **Supabase integration** — auth, cloud save, leaderboard; added after core game works
15. **Email capture flow** — UI + GDPR consent on top of Supabase auth
16. **PWA hardening** — Workbox caching strategy, offline smoke test, install prompt

## Sources

- [Phaser 3 Scene Concepts — Official Docs](https://docs.phaser.io/phaser/concepts/scenes)
- [Phaser 3 GitHub — Vite + TypeScript Template](https://github.com/phaserjs/template-vite-ts)
- [Phaser Scene Manager (Rex Notes)](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scenemanager/)
- [Ourcade — Communicating Between Scenes in Phaser 3](https://blog.ourcade.co/posts/2020/phaser3-how-to-communicate-between-scenes/)
- [Supabase Anonymous Sign-Ins — Official Docs](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Game Save Best Practices for Web Games — Bugnet](https://bugnet.io/blog/game-save-best-practices-web)
- [Offline-First Frontend Apps in 2025 — LogRocket](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)
- [Phaser PWA Tutorial — GameDev Academy](https://gamedevacademy.org/phaser-progressive-web-apps-tutorial/)
- [Virtual Joystick for Phaser — Rex Notes](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/virtualjoystick/)
- [Phaser Merged Input Plugin (keyboard + gamepad)](https://github.com/GaryStanton/phaser3-merged-input)
- [Howler.js — JavaScript Audio Library](https://howlerjs.com/)
- [Audio for Web Games — MDN](https://developer.mozilla.org/en-US/docs/Games/Techniques/Audio_for_Web_Games)
- [HTML5 Game Localization with i18next — Nicastro.in](https://nicastro.in/html5-game-dev-tutorials/excaliburjs-tutorials/game-localization-i18next-library-excaliburjs)
- [Supabase Free Tier Limits 2026](https://aiagencyplus.com/supabase-free-tier-limits/)

---
*Architecture research for: Barren Wuffett — HTML5/PWA mobile-first adventure game*
*Researched: 2026-06-11*
