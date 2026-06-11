# Phase 1: Foundation & Legal Shell — Research

**Researched:** 2026-06-11
**Domain:** Vite 6 + Phaser 4 + TypeScript scaffold, Cloudflare Pages deploy, i18n skeleton, iOS audio/touch, portrait viewport, legal pages (Impressum/Datenschutz)
**Confidence:** HIGH (scaffold, deploy, audio, viewport) / MEDIUM (phaser4-rex-plugins Phaser 4 support; i18next v26 API)

---

## Summary

Phase 1 delivers the thinnest safe end-to-end slice: a deployable Cloudflare Pages project that a visitor can open in a browser, see a Phaser 4 loading/menu screen, and navigate to legal pages — all before any real name, logo, or public URL is shared without an Impressum. The scaffold must establish the constraints that are near-impossible to retrofit: pixel-art config (`antialias: false`, `pixelArt: true`), portrait scale mode, iOS touch-input event wiring, iOS audio unlock pattern, and an i18n-ready string map. Legal pages (Impressum via link to www.compoundingknowledge.com + game-specific Datenschutz) must exist as static HTML routes before the domain goes live.

The official Phaser 4 Vite TypeScript template (`github.com/phaserjs/template-vite-ts`) is the authoritative scaffold starting point. It ships with Vite 6.3.1, TypeScript 5.7.2, and Phaser 4.0.0 (upgradeable to 4.1.0), with a split dev/prod Vite config that puts Phaser in its own chunk for caching. The Cloudflare Pages deploy is trivial: connect GitHub repo, set build command `npm run build`, output directory `dist`. No Wrangler CLI required for static hosting.

The primary open question verified during this research: `phaser4-rex-plugins` **does exist on npm** (v4.0.7, published 2025-10-13, last updated 2026-06-02, source repo github.com/rexrainbow/phaser3-rex-notes). The direct class import path works: `import VirtualJoystick from 'phaser4-rex-plugins/plugins/virtualjoystick.js'`. However, Phase 1 does not need VirtualJoystick — that belongs in Phase 2 with the first playable scene. Phase 1 only scaffolds the InputBus interface.

**Primary recommendation:** Start from the official `phaserjs/template-vite-ts` template, add portrait ScaleConfig and pixel-art flags to the Phaser Game config, wire the viewport meta tag with `user-scalable=no`, add a thin `i18n.ts` JSON-lookup service, add static `/impressum` and `/datenschutz` HTML pages in `public/`, then deploy to Cloudflare Pages via Git integration.

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LEGL-01 | Impressum + privacy policy pages live and linked (footer + settings) before any public URL shared | Impressum via link to compoundingknowledge.com (with Geltungssatz); game-specific Datenschutz as static HTML in `public/datenschutz.html`; both reachable within two clicks — confirmed viable |
| LEGL-02 | All persons/companies use parody names only — no real names, photos, likenesses, logos | Enforced at authoring time; parody-naming convention document to be created in Phase 1 as pre-commit guard |
| INFR-01 | Game deployed on Cloudflare Pages (free tier) and playable via public URL | Cloudflare Pages Git integration: build command `npm run build`, output `dist` — confirmed working |
| INFR-04 | Levels defined as data manifests (ContentRegistry) — adding a level means adding data files, not engine code | ContentRegistry interface + `LevelManifest` type established in Phase 1 scaffold even if no levels yet loaded |
| INFR-05 | All player-facing text in i18n-ready structure (English content, German addable without code changes) | Thin `i18n.ts` JSON-key lookup (`t(key)` function); locale JSON files in `public/locales/en/`; i18next v26 or lightweight custom — both viable |
| GAME-07 | Music/SFX have separate persistent toggles; audio unlocks correctly on iOS after first user gesture | Phaser 4 Sound Manager handles iOS auto-unlock via `this.sound.unlock()` after first tap; toggle state persisted via `localStorage` (simple key-value, not game save); AudioService stub in Phase 1 |
| GAME-08 | Branded loading progress bar; fast on 4G; textures ≤2048px | BootScene + PreloadScene with progress event; Phaser chunk split in Vite prod config; 2048px hard cap enforced via doc convention and asset pipeline note |
| GAME-10 | Portrait mode on phones — no pinch-zoom breakage | `Phaser.Scale.FIT` + `autoCenter: CENTER_BOTH`; viewport meta `user-scalable=no`; `touch-action: none` on canvas; `env(safe-area-inset-*)` for notch handling |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Game rendering / scenes | Browser (Phaser 4 WebGL) | — | Phaser owns the canvas, render loop, and scene lifecycle entirely client-side |
| Asset loading | Browser (Phaser loader) | CDN (Cloudflare Pages static) | Assets served from `public/assets/` via Cloudflare's edge; Phaser fetches at preload time |
| Legal pages (Impressum, Datenschutz) | Browser (static HTML) | CDN (Cloudflare Pages) | Static HTML files in `public/`; served as plain HTML routes, not inside the Phaser canvas |
| i18n text lookup | Browser (service module) | — | A pure JS module (`i18n.ts`) with locale JSON; no server involvement |
| Audio toggle persistence | Browser (localStorage) | — | Simple flag — does not require IndexedDB; localStorage is adequate for a two-key boolean |
| Portrait/viewport enforcement | Browser (HTML meta + CSS + Phaser ScaleManager) | — | `<meta name="viewport">` + `touch-action: none` on canvas + Phaser Scale config |
| Deploy / hosting | CDN (Cloudflare Pages) | — | Static bundle pushed via Git; no server-side rendering needed |
| ContentRegistry (data manifests) | Browser (TypeScript module) | — | Pure in-memory data; loaded at boot, no network call for content metadata |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `phaser` | 4.1.0 | Game engine: rendering, scenes, input, audio, tilemaps | Official greenfield baseline (April 2026); 254k weekly downloads; ships TS types; no `@types/phaser` needed [VERIFIED: npm registry] |
| `typescript` | 5.7.2 (template) / 6.0.3 (latest) | Type-safe game code; catches AI-generated errors at compile time | Phaser 4 ships full TS types; zero config overhead with Vite [VERIFIED: npm registry] |
| `vite` | 8.0.16 (latest) | Dev server, HMR, production bundler | Official Phaser 4 template uses Vite 6; current latest is 8.x — use version matching template for stability [VERIFIED: npm registry] |
| `vite-plugin-pwa` | 1.3.0 (latest) | Service worker shell, web app manifest | Used for PWA manifest stub in Phase 1; Workbox caching deferred to Phase 4 [VERIFIED: npm registry] |

> **Note on Vite version:** The official Phaser template pins Vite 6.3.1. Vite 8.x is the current release. For this scaffold, start with the template's pinned version and upgrade after validating the build — major Vite bumps occasionally break plugin compatibility.

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `i18next` | 26.3.1 | Key-based text lookup, locale switching | Use if German localization is likely within 6 months; otherwise use lightweight JSON map below [VERIFIED: npm registry] |
| *(lightweight alt)* | n/a | Thin `t(key)` wrapper over a JSON import | Use instead of i18next for Phase 1 — zero dependency, refactored to i18next later if needed [ASSUMED] |
| `phaser4-rex-plugins` | 4.0.7 | Virtual joystick (Phase 2); other mobile utilities | **Confirmed on npm** (published 2025-10-13, last updated 2026-06-02, source: github.com/rexrainbow/phaser3-rex-notes). Install in Phase 1 to confirm import works; use in Phase 2 [VERIFIED: npm registry, WARNING: seam flags "too-new" due to recent version — see Package Legitimacy Audit] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `i18next` | Lightweight custom `t(key)` JSON map | Custom is zero-dep and easier to understand; i18next adds pluralization, namespaces, lazy loading. For Phase 1 English-only content, custom wins; migrate to i18next if German ships |
| `phaser4-rex-plugins` (npm) | CDN `rexvirtualjoystickplugin.min.js` | CDN avoids npm install uncertainty but adds network dependency; npm import is cleaner for TypeScript |
| Cloudflare Pages Git deploy | Wrangler CLI deploy | Git deploy is simpler (no CLI auth tokens to manage); Wrangler needed only for Workers, not pure static Pages |

**Installation (Phase 1 only):**
```bash
# Start from official template (do not use npm create vite — use the Phaser template directly)
git clone https://github.com/phaserjs/template-vite-ts barren-wuffett
cd barren-wuffett
npm install

# Upgrade phaser to 4.1.0
npm install phaser@4.1.0

# Install phaser4-rex-plugins (confirm import works before Phase 2 depends on it)
npm install phaser4-rex-plugins

# PWA manifest support
npm install -D vite-plugin-pwa

# i18n (lightweight approach for Phase 1 — no i18next package needed yet)
# Locale files are plain JSON in public/locales/en/common.json
```

---

## Package Legitimacy Audit

| Package | Registry | Age | Downloads/wk | Source Repo | Verdict | Disposition |
|---------|----------|-----|-------------|-------------|---------|-------------|
| `phaser` | npm | ~12 yrs (engine); v4 since Apr 2026 | 254,385 | github.com/phaserjs/phaser | OK | Approved |
| `vite` | npm | ~5 yrs | 129,170,441 | github.com/vitejs/vite | SUS (too-new flag) | Approved — false positive; 129M downloads/week, official repo confirmed |
| `vite-plugin-pwa` | npm | ~4 yrs | 3,244,189 | github.com/vite-pwa/vite-plugin-pwa | OK | Approved |
| `phaser4-rex-plugins` | npm | Published Oct 2025 (8 months) | 1,359 | github.com/rexrainbow/phaser3-rex-notes | SUS (too-new) | Approved with note — well-known rex plugin author; low downloads reflect Phaser 4 newness not package risk. Verify import path before Phase 2 depends on it. |
| `i18next` | npm | ~13 yrs | 18,008,314 | github.com/i18next/i18next | SUS (too-new) | Approved — false positive; 13 yr old package, 18M downloads/wk |
| `typescript` | npm | ~12 yrs | (bundled via Vite) | github.com/microsoft/TypeScript | OK | Approved |

**Packages removed due to SLOP verdict:** none

**Packages flagged as suspicious (SUS) — context:** All three `SUS` verdicts are false positives from the "too-new" signal applied to a recently-released major version of a long-established package (vite, i18next) or a legitimate port of a well-known plugin (phaser4-rex-plugins). Source repos confirmed on GitHub for all three. No `checkpoint:human-verify` required for vite or i18next. For `phaser4-rex-plugins`, the planner should add a smoke-test task verifying the import path resolves correctly before Phase 2 depends on it.

---

## Architecture Patterns

### System Architecture Diagram

```
Browser
  │
  ├─ index.html  ──►  /impressum link  ──►  public/impressum.html (→ compoundingknowledge.com)
  │                   /datenschutz link ──►  public/datenschutz.html (game-specific privacy policy)
  │
  └─ Phaser 4 Game Instance
       │
       ├─ BootScene          ← initializes services, reads localStorage for audio prefs
       │      │
       │      └─ PreloadScene  ← loads minimal assets (logo, loading bar sprites)
       │             │
       │             └─ MainMenuScene  ← first interactive scene; "Tap to Start" = iOS audio unlock gate
       │                    │
       │                    └─ [Phase 2+ scenes: OverworldScene, UIScene, etc.]
       │
       ├─ Services Layer (plain TS modules, no Phaser dependency)
       │    ├─ i18n.ts           ── t(key) → string from locale JSON
       │    ├─ AudioService.ts   ── toggle state (localStorage); unlock wrapper around Phaser sound
       │    └─ ContentRegistry.ts── LevelManifest[] type; empty array in Phase 1
       │
       └─ Input (stub only in Phase 1)
            └─ InputBus.ts       ── Action enum defined; bindings wired in Phase 2
```

### Recommended Project Structure
```
barren-wuffett/
├── public/
│   ├── assets/
│   │   ├── images/          # placeholder logo PNG for loading screen
│   │   └── fonts/           # bitmap font (optional, defer to Phase 2)
│   ├── locales/
│   │   └── en/
│   │       └── common.json  # all Phase 1 UI strings (menu, loading, legal links)
│   ├── impressum.html       # legal page — links to compoundingknowledge.com; in-game style
│   ├── datenschutz.html     # game-specific privacy policy (Supabase, Brevo, Cloudflare named)
│   ├── manifest.webmanifest # PWA manifest (minimal: name, icons stub, display standalone)
│   └── favicon.png
├── src/
│   ├── main.ts              # DOM ready → StartGame('game-container')
│   ├── game/
│   │   ├── main.ts          # Phaser GameConfig with Scale, pixelArt, audio; exports StartGame()
│   │   └── scenes/
│   │       ├── Boot.ts      # init services; read audio prefs from localStorage
│   │       ├── Preloader.ts # load logo + placeholder assets; show progress bar
│   │       └── MainMenu.ts  # "Tap to Start"; legal footer links; audio toggle button
│   ├── services/
│   │   ├── i18n.ts          # t(key): loads public/locales/en/common.json; falls back to key
│   │   ├── AudioService.ts  # getAudioEnabled(), setAudioEnabled(), getMusicEnabled(), etc.
│   │   └── ContentRegistry.ts # LevelManifest interface; empty registry for Phase 1
│   └── input/
│       └── InputBus.ts      # Action enum (MOVE_UP, MOVE_DOWN, INTERACT, PAUSE); stub only
├── vite/
│   ├── config.dev.mjs       # from Phaser template: base './', port 8080
│   └── config.prod.mjs      # from Phaser template: terser, phaser chunk split
├── index.html               # viewport meta with user-scalable=no; game-container div
├── tsconfig.json
└── package.json
```

### Pattern 1: Phaser 4 Game Config (Portrait + Pixel Art)

**What:** Game config established at `src/game/main.ts` with pixel-art flags and portrait ScaleManager settings. Must be set before first render — cannot be toggled at runtime.

**When to use:** Phase 1 scaffold — these are foundation constraints that cannot be added later.

```typescript
// Source: github.com/phaserjs/template-vite-ts (official template) + phaser.io docs
import { AUTO, Game, Scale } from 'phaser';
import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { MainMenu } from './scenes/MainMenu';

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 480,
    height: 854,           // 9:16 portrait aspect ratio
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    pixelArt: true,        // disables anti-aliasing on textures
    antialias: false,      // belt-and-suspenders
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
        min: { width: 320, height: 568 },
        max: { width: 480, height: 1024 },
    },
    audio: {
        disableWebAudio: false,  // keep Web Audio on — required for iOS unlock
    },
    scene: [Boot, Preloader, MainMenu],
};

export const StartGame = (parent: string) => new Game({ ...config, parent });
```

### Pattern 2: iOS Audio Unlock via "Tap to Start" Gate

**What:** Phaser 4's Sound Manager includes built-in iOS audio unlock via `this.sound.unlock()`. The unlock must be triggered inside a direct user gesture handler. The "Tap to Start" splash screen is the correct gate.

**When to use:** Always — required on iOS Safari. Works transparently on Android/desktop.

```typescript
// Source: docs.phaser.io/phaser/concepts/audio (Phaser 4 docs — [CITED])
// In MainMenuScene.ts
create() {
    const tapText = this.add.text(240, 427, t('menu.tapToStart'), { ... });

    // Single pointer-down anywhere unlocks audio on iOS
    this.input.once('pointerdown', () => {
        this.sound.unlock();          // built-in Phaser 4 iOS unlock
        this.scene.start('Game');
    });
}
```

**Audio toggle persistence:**
```typescript
// AudioService.ts — localStorage only (not IndexedDB; 2-key boolean is fine for this)
const KEYS = { music: 'bw_music_on', sfx: 'bw_sfx_on' };

export const AudioService = {
    getMusicEnabled: () => localStorage.getItem(KEYS.music) !== 'false',
    setMusicEnabled: (on: boolean) => { localStorage.setItem(KEYS.music, String(on)); },
    getSfxEnabled:   () => localStorage.getItem(KEYS.sfx)   !== 'false',
    setSfxEnabled:   (on: boolean) => { localStorage.setItem(KEYS.sfx,   String(on)); },
};
```

### Pattern 3: Viewport Meta + Touch-Action (Portrait, No Pinch-Zoom)

**What:** Two layers of zoom prevention — HTML meta tag and CSS `touch-action: none` on the game canvas. Both are required; the meta tag alone is insufficient on some mobile browsers.

**When to use:** Phase 1 index.html — these are platform constraints, not features.

```html
<!-- index.html — Source: PITFALLS.md + MDN [CITED] -->
<meta name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

```css
/* public/style.css */
#game-container canvas {
    touch-action: none;            /* prevents 300ms click delay + pinch-zoom */
    image-rendering: pixelated;   /* preserves pixel-art crispness on high-DPI screens */
}

/* iOS notch / Dynamic Island safe area */
body {
    padding: env(safe-area-inset-top) env(safe-area-inset-right)
             env(safe-area-inset-bottom) env(safe-area-inset-left);
}
```

### Pattern 4: Lightweight i18n (Phase 1 Approach)

**What:** A thin `t(key)` function that reads from a JSON locale file. No external package in Phase 1. If German ships, migrate to i18next — the calling code (`t('menu.tapToStart')`) does not change.

**When to use:** Every UI string in Phase 1 scenes. Never embed literal strings in scene code.

```typescript
// src/services/i18n.ts — [ASSUMED] lightweight custom approach
import en from '../../public/locales/en/common.json';

type LocaleData = typeof en;
type LocaleKey = keyof LocaleData;

let locale: LocaleData = en;

export function t(key: LocaleKey): string {
    return locale[key] ?? key;  // fall back to key if translation missing
}

export function setLocale(data: LocaleData): void {
    locale = data;
}
```

```json
// public/locales/en/common.json
{
  "menu.tapToStart": "Tap to Start",
  "menu.impressum": "Impressum",
  "menu.datenschutz": "Privacy Policy",
  "loading.progress": "Loading...",
  "audio.music": "Music",
  "audio.sfx": "Sound Effects"
}
```

### Pattern 5: ContentRegistry Stub (Phase 1)

**What:** The interface and registry are established in Phase 1 so Phase 2 scenes can import a typed manifest without architectural changes.

```typescript
// src/services/ContentRegistry.ts — [ASSUMED] (pattern from ARCHITECTURE.md)
export interface LevelManifest {
    id: string;
    titleKey: string;
    tilemapKey: string;
    bgmKey: string;
    enemies: Array<{ type: string; spawnTile: { x: number; y: number } }>;
    triggers: Array<{ zone: string; action: string; target: string; data?: object }>;
    journalUnlock: string;
}

const registry: LevelManifest[] = [];  // populated in Phase 2+

export const ContentRegistry = {
    getLevel: (id: string) => registry.find(l => l.id === id),
    getAllLevels: () => registry,
};
```

### Pattern 6: Vite Config (Official Template Pattern)

**What:** The official Phaser template splits Phaser into its own Rollup chunk for HTTP caching, and uses terser with two compress passes for the smallest production bundle.

```javascript
// vite/config.prod.mjs — Source: github.com/phaserjs/template-vite-ts [VERIFIED: official]
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    base: './',
    build: {
        rollupOptions: {
            output: {
                manualChunks: { phaser: ['phaser'] }  // Phaser in own chunk for cache
            }
        },
        minify: 'terser',
        terserOptions: { compress: { passes: 2 }, mangle: true, format: { comments: false } }
    },
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'Barren Wuffett',
                short_name: 'BarrenW',
                display: 'standalone',
                background_color: '#1a1a2e',
                theme_color: '#1a1a2e',
                icons: [
                    { src: '/favicon.png', sizes: '192x192', type: 'image/png' },
                ],
            },
            // workbox globPatterns deferred to Phase 4 — Phase 1 uses manifest stub only
        })
    ]
});
```

### Pattern 7: Static Legal Pages (Impressum + Datenschutz)

**What:** Two static HTML files in `public/`. Reachable within two clicks from any game screen (main menu footer + settings). Impressum links to compoundingknowledge.com; Datenschutz is game-specific.

**Legal requirement:** Per §5 DDG (formerly TMG), the Impressum must be "leicht erkennbar, unmittelbar erreichbar und ständig verfügbar" — a clearly labeled link to an external Impressum is permitted IF the target Impressum explicitly covers the game's domain (Geltungssatz).

**Action required (manual, cannot be automated):** The operator must add a sentence to compoundingknowledge.com/impressum reading: *"Dieses Impressum gilt auch für [game domain]."* Without this sentence, the link-only approach is legally vulnerable.

```html
<!-- public/impressum.html — minimal structure -->
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Impressum — Barren Wuffett</title>
</head>
<body>
    <h1>Impressum</h1>
    <p>
        Das Impressum für dieses Angebot befindet sich auf
        <a href="https://www.compoundingknowledge.com/impressum" target="_blank" rel="noopener">
            www.compoundingknowledge.com/impressum
        </a>.
    </p>
    <p>
        <strong>Hinweis:</strong> Bitte stellen Sie sicher, dass auf der verlinkten Seite
        ein Geltungssatz für diese Domain enthalten ist.
    </p>
    <p><a href="/">← Zurück zum Spiel</a></p>
</body>
</html>
```

**Datenschutz (Privacy Policy)** must be a separate, game-specific page that names:
- Cloudflare Pages (static hosting; no personal data collected by hosting layer)
- IndexedDB (Phase 2+: local game save; stays on device)
- Supabase (Phase 3+: cloud save, email; not yet live in Phase 1)
- Brevo (Phase 3+: email marketing; not yet live in Phase 1)
- No cookie consent banner needed if truly cookieless analytics (Phase 3)

**Phase 1 Datenschutz approach:** Write the full policy now (including "Supabase and Brevo will be used in future updates for optional cloud save"), but only Phase 1-relevant data is active. This avoids updating the policy page in Phase 3.

### Pattern 8: Loading Progress Bar (GAME-08)

**What:** Phaser's built-in loader events provide `progress` (0–1), `fileprogress`, and `complete`. The PreloadScene shows a branded bar before the main menu appears.

```typescript
// src/game/scenes/Preloader.ts — [ASSUMED] pattern (Phaser loader events are standard)
preload() {
    const { width, height } = this.scale;
    const bar  = this.add.rectangle(width / 2, height / 2 + 50, 300, 12, 0x00ff88);
    const border = this.add.rectangle(width / 2, height / 2 + 50, 302, 14).setStrokeStyle(2, 0xffffff);
    this.add.text(width / 2, height / 2, 'BARREN WUFFETT', { ... }).setOrigin(0.5);

    this.load.on('progress', (v: number) => { bar.width = 300 * v; });

    // Load Phase 1 assets (logo, placeholder menu background)
    this.load.image('logo', 'assets/images/logo.png');
}

create() {
    this.scene.start('MainMenu');
}
```

### Anti-Patterns to Avoid

- **Hardcoding strings in scenes:** `this.add.text(0, 0, 'Press Start')` — never. Use `t('menu.tapToStart')`. German localization later requires zero changes.
- **`localStorage` for game save data:** localStorage is sync, 5–10 MB cap, Safari clears after 7 days. Only `AudioService` uses localStorage (2 keys, booleans). All save data in Phase 2+ uses IndexedDB.
- **`antialias: true` (default):** Phaser defaults to `true`. Pixel art will be blurry on any display. Must be set explicitly to `false` at startup — cannot be changed after the WebGL context is created.
- **Pinch-zoom on canvas:** Missing `user-scalable=no` in the meta tag breaks portrait layout on every mobile browser. Add to `index.html` in Phase 1.
- **Click events on gameplay elements:** Use `pointerdown`/`pointerup` Phaser events or `touchstart`/`touchend` DOM events. The 300ms click delay affects any `addEventListener('click', ...)` on the canvas.
- **Impressum inside the Phaser canvas only:** The Impressum link must be in the HTML DOM (footer or link in the page), not rendered by Phaser. Search engines and legal crawlers do not execute Phaser — the HTML page must contain the link.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| iOS audio context unlock | Custom `AudioContext.resume()` logic | `this.sound.unlock()` (Phaser 4 built-in) | Phaser 4 handles the Safari `AudioContext.state === 'suspended'` check and gesture detection |
| Portrait fit scaling | Manual `window.innerWidth/Height` canvas resize | `Phaser.Scale.FIT` + `Scale.CENTER_BOTH` | Phaser ScaleManager handles device pixel ratio, resize events, and notch insets |
| PWA service worker | Manual Workbox config | `vite-plugin-pwa` | Workbox precaching strategy for game assets is non-trivial; `vite-plugin-pwa` wraps it correctly |
| i18n key lookup (Phase 1) | Scattered string constants | `t(key)` function over JSON | Even a 5-line wrapper enforces the calling convention; retrofitting is zero-refactor |
| Phaser chunk splitting | Manual Rollup config | Official template `manualChunks: { phaser: ['phaser'] }` | Phaser is 345 KB minified; splitting it into a separate chunk improves cache hit rate on repeat visits |

**Key insight:** Phaser 4 abstracts the hardest mobile browser problems (iOS audio, scale management, touch pointer normalization). Replicate none of these — use the engine.

---

## Common Pitfalls

### Pitfall 1: `antialias` Default Destroys Pixel-Art Look
**What goes wrong:** Phaser defaults to `antialias: true`. Every sprite looks blurry on any display — the pixel-art aesthetic is gone before the first screenshot.
**Why it happens:** It's a config omission, not a code change.
**How to avoid:** Set `pixelArt: true, antialias: false` in the GameConfig AND `image-rendering: pixelated` in CSS on the canvas. Both are needed.
**Warning signs:** Sprite edges look soft/blurry in the browser at 1:1 zoom.

### Pitfall 2: Missing `user-scalable=no` Causes Pinch-Zoom Layout Break
**What goes wrong:** Players pinch-zoom accidentally during touch input. The game canvas gets visually offset from the pointer event coordinates (they use page coordinates, not scaled canvas coordinates). Touch input appears to miss targets by large margins.
**Why it happens:** Default viewport meta does not disable zoom.
**How to avoid:** `content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"`. Also set `touch-action: none` on the canvas via CSS.
**Warning signs:** First tap on a real iPhone misses the button by 30+ pixels after any incidental zoom.

### Pitfall 3: Impressum Link Inside Phaser Only — Invisible to Legal Crawlers
**What goes wrong:** The Impressum is linked from a Phaser scene (a canvas element). Automated legal-compliance crawlers (and Abmahnanwälte tools) cannot see JavaScript-rendered content — they scan the HTML source. The Impressum is legally unreachable.
**Why it happens:** Developers build the in-game settings screen first and assume that's sufficient.
**How to avoid:** The Impressum and Datenschutz links must appear in the HTML DOM, either in the page footer below the game container, or as separate HTML pages at `/impressum` and `/datenschutz`. The in-game link (from settings menu) is a convenience, not a replacement.
**Warning signs:** `curl https://game-domain.com | grep -i impressum` returns nothing.

### Pitfall 4: `phaser4-rex-plugins` Import Path Not Validated Before Phase 2 Depends on It
**What goes wrong:** Phase 2 adds InputBus + VirtualJoystick. The rex plugin import `import VirtualJoystick from 'phaser4-rex-plugins/plugins/virtualjoystick.js'` fails at build time because the package structure differs from expectations, blocking all Phase 2 work.
**Why it happens:** Package installed but not smoke-tested in Phase 1.
**How to avoid:** In Phase 1, add a single throwaway test: `import VirtualJoystick from 'phaser4-rex-plugins/plugins/virtualjoystick.js'` in a scene file, run `npm run build`, confirm no import error, then remove the import. This costs 2 minutes and prevents Phase 2 day-one block.
**Warning signs:** Phase 1 closes without a confirmed build that includes the rex import.

### Pitfall 5: Geltungssatz Missing on compoundingknowledge.com
**What goes wrong:** The Impressum link in the game points to compoundingknowledge.com/impressum, but that page does not explicitly mention the game domain. Under §5 DDG, a linked Impressum must cover the linking site. An Abmahnung can be issued even if the linked page is a valid Impressum for a different domain.
**Why it happens:** The operator assumes linking is sufficient without the explicit coverage statement.
**How to avoid:** Before the game domain goes public, add the Geltungssatz to compoundingknowledge.com/impressum. This is a manual step that cannot be automated — document it as a pre-launch checklist item.
**Warning signs:** compoundingknowledge.com/impressum does not mention the game domain anywhere.

### Pitfall 6: Audio Toggle State Lost Between Sessions
**What goes wrong:** Player turns off music. They return the next day; music is playing again because the toggle state was not persisted.
**Why it happens:** AudioService reads toggle state from a Phaser scene variable, not from storage.
**How to avoid:** AudioService reads/writes `localStorage` on every toggle change. BootScene reads localStorage on init and configures the Phaser Sound Manager before the first scene plays audio.
**Warning signs:** GAME-07 acceptance test fails: "audio toggle state persists across sessions."

---

## Code Examples

### Official Phaser 4 Template Structure (Verified)
```typescript
// Source: github.com/phaserjs/template-vite-ts [VERIFIED: official GitHub repo]
// src/main.ts — entry point
import StartGame from './game/main';
document.addEventListener('DOMContentLoaded', () => {
    StartGame('game-container');
});

// src/game/main.ts — Phaser GameConfig with scene list
import { AUTO, Game } from 'phaser';
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1024, height: 768,
    parent: 'game-container',
    scene: [Boot, Preloader, MainMenu, ...],
};
export const StartGame = (parent: string) => new Game({ ...config, parent });
```

### Cloudflare Pages Deploy Settings
```
# Source: developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/ [CITED]
Build command:      npm run build
Build output dir:   dist
Root directory:     (leave blank — repo root)
Node version:       20 or 22 (set via CF dashboard Environment Variables: NODE_VERSION=20)
```

### Scale Config for Portrait
```typescript
// Source: docs.phaser.io/phaser/concepts/scale-manager [CITED]
scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 320, height: 568 },   // iPhone SE 1st gen (smallest target)
    max: { width: 480, height: 1024 },
},
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Phaser 3 for greenfield | Phaser 4 (4.1.0) | April 2026 | Phaser 4 is new baseline; API ~compatible; use for greenfield |
| webpack for game bundling | Vite 6 (or 8) | 2022–2024 | Vite is 10–20x faster HMR; webpack unjustified in 2026 |
| `vite-plugin-pwa` 0.x | `vite-plugin-pwa` 1.x | May 2026 | Breaking changes in v1; check migration guide if template pins 0.x |
| i18next 23.x | i18next 26.x | 2025–2026 | Major version bumps; core `t()` API unchanged; namespaces and init config are stable |
| Manual iOS AudioContext unlock | `this.sound.unlock()` (Phaser built-in) | Phaser 3.60+ → Phaser 4 | Built-in unlock handles the gesture detection pattern |
| `localStorage` for game saves | IndexedDB via `idb-keyval` | Industry practice | localStorage is sync, 5–10 MB cap, Safari-evictable. Not used for game save (only audio prefs). |

**Deprecated/outdated:**
- `phaser3-rex-plugins` (npm): Phaser 3 only. Wrong package for Phaser 4 — will cause import errors. Use `phaser4-rex-plugins` instead.
- TMG (Telemediengesetz): Replaced by DDG (Digitale-Dienste-Gesetz) in May 2024. Requirements for Impressum are materially the same under §5 DDG; same two-click accessibility rule applies.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Lightweight custom `t(key)` JSON map is migration-compatible with i18next (same calling convention) | Standard Stack; Pattern 4 | Low — calling code changes minimally; locale JSON files may need restructuring |
| A2 | `this.sound.unlock()` in Phaser 4 handles iOS Safari correctly with no additional workaround | Pattern 2 (iOS Audio Unlock) | Medium — if Phaser 4's built-in fails on a specific iOS version, manual `AudioContext.resume()` fallback needed; test on real device in Phase 1 |
| A3 | Phaser 4 `pixelArt: true` config correctly disables anti-aliasing on all target platforms (iOS Safari, Chrome Android) | Pattern 1 (Game Config) | Low — well-established Phaser config; `image-rendering: pixelated` in CSS provides belt-and-suspenders |
| A4 | A link to compoundingknowledge.com/impressum with Geltungssatz satisfies §5 DDG for the game domain | Pattern 7 (Legal Pages) | HIGH — if a court disagrees, game needs its own full Impressum with operator address; this is a legal opinion question, not a research question |
| A5 | `phaser4-rex-plugins` v4.0.7 VirtualJoystick import path `phaser4-rex-plugins/plugins/virtualjoystick.js` resolves correctly in a Vite 6 build | Package Legitimacy Audit; Pitfall 4 | Medium — must be smoke-tested in Phase 1 |
| A6 | Cloudflare Pages serves `public/impressum.html` at the URL `/impressum` without redirect config | Pattern 7 (Legal Pages); Cloudflare deploy | Low — Cloudflare Pages serves all files in the output `dist/` directory directly; `public/` files are copied to `dist/` by Vite |

**If this table is empty:** Not empty — claims A4 and A5 require verification actions in Phase 1.

---

## Open Questions

1. **Phaser 4 vs Phaser 4.1.0 on npm**
   - What we know: `npm view phaser version` returns `4.1.0`; template pins `phaser@4.0.0`
   - What's unclear: Any breaking changes between 4.0.0 and 4.1.0?
   - Recommendation: Install `phaser@4.1.0` (latest) — the template is a starting point, not a version pin. Check Phaser changelog if build fails.

2. **`vite-plugin-pwa` v1.x vs 0.x**
   - What we know: npm latest is `1.3.0`; project research references `0.21.x`
   - What's unclear: Breaking API changes in v1 that affect the minimal manifest config used in Phase 1
   - Recommendation: Install `vite-plugin-pwa@latest` (1.3.0) and check the migration guide; Phase 1 usage is minimal (manifest stub only) and unlikely to be affected.

3. **Phaser 4 built-in iOS audio unlock — confirmed behavior**
   - What we know: Phaser docs say `this.sound.unlock()` is available and auto-triggered on first gesture
   - What's unclear: Whether auto-unlock works without an explicit "Tap to Start" gate or requires a specific gesture type
   - Recommendation: Always use an explicit "Tap to Start" splash screen as the iOS audio gate. Do not rely on auto-unlock for the first audio play — test on a real iPhone SE before Phase 1 sign-off.

4. **Geltungssatz — operator action required**
   - What we know: compoundingknowledge.com/impressum must explicitly cover the game domain
   - What's unclear: Whether that sentence is already present or needs to be added
   - Recommendation: Planner must include a `checkpoint:human-action` task requiring the operator to add the Geltungssatz to compoundingknowledge.com before the game domain goes live. This blocks LEGL-01 acceptance.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite build, npm | ✓ | v24.14.0 | — |
| npm | Package management | ✓ | 11.9.0 | — |
| Git | Cloudflare Pages Git integration | ✓ (git repo initialized) | — | — |
| Cloudflare Pages account | INFR-01 deploy | Unknown (user action) | — | None — required for INFR-01 |
| GitHub account + repo | Cloudflare Pages Git integration | Likely ✓ (GITHUB-REPO.md exists in project) | — | Direct Wrangler CLI deploy as fallback |
| Real iOS device (iPhone) | GAME-07 acceptance (audio unlock) | Unknown | — | None — simulator does not reproduce iOS audio restrictions |

**Missing dependencies with no fallback:**
- Cloudflare Pages account: user must create/confirm before Phase 1 deploy task
- Real iOS device: required for audio unlock acceptance test; simulator is insufficient

**Missing dependencies with fallback:**
- GitHub repo: GITHUB-REPO.md suggests it exists; Wrangler CLI deploy is fallback if Git integration fails

---

## Validation Architecture

### Test Framework

Phase 1 is predominantly scaffolding and configuration. No automated test framework is required in Phase 1 — the acceptance criteria are verified manually or via build output inspection.

| Property | Value |
|----------|-------|
| Framework | None for Phase 1 (no logic to unit-test) |
| Quick run command | `npm run build` (TypeScript compile check) |
| Full suite command | Manual checklist (see below) |

### Phase 1 Acceptance Checklist (Manual)
| Req ID | Behavior | Verification Method |
|--------|----------|---------------------|
| INFR-01 | Game loads at Cloudflare Pages URL | Open deployed URL in Chrome; confirm Phaser canvas appears |
| LEGL-01 | Impressum reachable within 2 taps | From main menu, tap Impressum link; confirm `/impressum` HTML loads; confirm link to compoundingknowledge.com works |
| LEGL-01 | Datenschutz reachable within 2 taps | From main menu, tap Privacy Policy link; confirm `/datenschutz` HTML loads |
| LEGL-02 | No real names in any visible UI | Full-text search of all locale JSON and HTML files for "Warren", "Buffett", "Munger", "Berkshire" |
| GAME-07 | Audio toggle state persists across sessions | Toggle music off, close tab, reopen — music still off |
| GAME-08 | Loading progress bar visible | Open game on throttled connection (DevTools 4G); progress bar appears |
| GAME-10 | Portrait mode — no zoom breakage | Open on real phone; attempt to pinch — viewport should not zoom |
| GAME-10 | Portrait mode — layout correct | Rotate phone to landscape; confirm graceful handling (letter-box or prompt) |
| INFR-04 | ContentRegistry interface exists | TypeScript build passes with `LevelManifest` type and `ContentRegistry` module |
| INFR-05 | All strings via t() | Grep scene files for hardcoded English strings — none found outside locale JSON |

### Wave 0 Gaps
- No test files needed — Phase 1 is scaffold + static content. TypeScript compiler (`tsc --noEmit`) serves as the primary correctness check.
- Add `"check": "tsc --noEmit"` to `package.json` scripts for CI use.

---

## Security Domain

Security enforcement is enabled (`security_enforcement: true`, ASVS Level 1).

### Applicable ASVS Categories for Phase 1

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Phase 1 has no auth — Supabase deferred to Phase 3 |
| V3 Session Management | No | No sessions in Phase 1 |
| V4 Access Control | No | Static site; no user-specific routes |
| V5 Input Validation | Minimal | No user input in Phase 1 except audio toggle (boolean in localStorage — safe) |
| V6 Cryptography | No | No secrets in Phase 1 |
| V9 Communications | Yes (basic) | Cloudflare Pages serves HTTPS automatically; no HTTP fallback needed |
| V14 Configuration | Yes | No secrets in the Vite build output; no `.env` with sensitive keys in Phase 1 |

### Known Threat Patterns for This Phase's Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Sensitive keys in Vite build output | Information Disclosure | No backend keys in Phase 1; Supabase `anon` key (public-safe) deferred to Phase 3 |
| XSS via hardcoded HTML in legal pages | Tampering | Legal pages are static HTML with no dynamic content; no user input rendered |
| Clickjacking on game canvas | Spoofing | Add `X-Frame-Options: DENY` in Cloudflare Pages `_headers` file |
| Missing HTTPS | Information Disclosure | Cloudflare Pages enforces HTTPS on all custom domains automatically |

**Recommended `public/_headers` file for Phase 1:**
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

---

## Sources

### Primary (HIGH confidence)
- [phaserjs/template-vite-ts](https://github.com/phaserjs/template-vite-ts) — official Phaser 4 Vite TypeScript template; verified `package.json`, `vite/config.dev.mjs`, `vite/config.prod.mjs`, `src/main.ts`, `src/game/main.ts`, `index.html` [VERIFIED: official GitHub repo]
- [Cloudflare Pages Vite deploy guide](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/) — build command `npm run build`, output `dist` [CITED: developers.cloudflare.com]
- [Phaser 4 Scale Manager docs](https://docs.phaser.io/phaser/concepts/scale-manager) — `Scale.FIT`, `CENTER_BOTH`, min/max config [CITED: docs.phaser.io]
- [Phaser 4 Audio docs](https://docs.phaser.io/phaser/concepts/audio) — `this.sound.unlock()` built-in iOS unlock [CITED: docs.phaser.io]
- [phaser4-rex-plugins npm](https://www.npmjs.com/package/phaser4-rex-plugins) — v4.0.7, published Oct 2025, source github.com/rexrainbow/phaser3-rex-notes [VERIFIED: npm registry + official repo]
- [rexrainbow VirtualJoystick docs](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/virtualjoystick/) — direct class import path confirmed [CITED: rexrainbow.github.io]
- [i18next getting started](https://www.i18next.com/overview/getting-started) — minimal TypeScript init config [CITED: i18next.com]
- npm `phaser@4.1.0`, `vite@8.0.16`, `vite-plugin-pwa@1.3.0`, `i18next@26.3.1` — versions confirmed via `npm view` [VERIFIED: npm registry]

### Secondary (MEDIUM confidence)
- .planning/research/STACK.md — project-level stack research (Phaser 4, Vite, Cloudflare Pages, Brevo) — synthesized from official docs 2026-06-11
- .planning/research/ARCHITECTURE.md — scene structure, service patterns, build order
- .planning/research/PITFALLS.md — iOS audio lockout, texture caps, Impressum requirements, touch input delay
- .planning/todos/pending/2026-06-11-impressum-verweis-compoundingknowledge.md — Geltungssatz requirement for linked Impressum approach

### Tertiary (LOW confidence)
- A2 (Phaser 4 iOS audio unlock confirmed behavior): assumed based on Phaser docs description — requires real-device test to confirm
- A4 (Geltungssatz legal sufficiency): based on widely-cited German legal commentary, not qualified legal counsel

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified on npm; official template confirmed on GitHub
- Architecture: HIGH — follows official Phaser template structure + project ARCHITECTURE.md
- Legal pages: MEDIUM — Geltungssatz approach is legally defensible but not counsel-verified (see A4)
- iOS audio/touch: MEDIUM — Phaser docs confirm `sound.unlock()` exists; requires real-device confirmation
- Pitfalls: HIGH — sourced from project PITFALLS.md which drew from official/community sources

**Research date:** 2026-06-11
**Valid until:** 2026-09-01 (90 days — Phaser 4 is recent; check for 4.2.x before scaffold if more than 30 days pass)
