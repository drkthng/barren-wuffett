# Architecture Research

**Domain:** Multi-page Vite/Phaser/TS static game bundle — integrating a mini-game hub + 3 new formats around an existing single-page Phaser adventure
**Researched:** 2026-10-07
**Confidence:** HIGH (grounded in direct inspection of the current repo, vite configs, services, and the spike-findings skill). The 3 generic Vite-MPA/PWA-scope/Cloudflare-routing web lookups used to cross-check the plan are LOW-confidence individually (unauthenticated web search synthesis) but agree with each other and with the already-working `base: './'` convention in this repo, so the overall recommendation is high-confidence even though a couple of supporting citations are weak.

## What the Current Build Actually Does (verified by reading the code)

- **One HTML entry.** `index.html` → `<script type="module" src="/src/main.ts">` → `src/main.ts` calls `StartGame('game-container')` from `src/game/main.ts`, which builds one `Phaser.Game` with all adventure scenes (`Boot, Preloader, MainMenu, Settings, OverworldScene, UIScene, BossScene, PaperThrowScene`). There is no router, no second page.
- **`base: './'`** in both `vite/config.dev.mjs` and `vite/config.prod.mjs` — Vite emits **relative** asset URLs per HTML file. This is the one existing decision that makes a multi-directory static deploy (several `index.html`s at different depths) work for free; nothing here needs to change for the hub.
- **`manualChunks: { phaser: ['phaser'] }`** in `config.prod.mjs` — Phaser is already isolated into its own chunk. Only HTML entries whose module graph imports `'phaser'` get a `<script>` tag for that chunk. Confirmed by grep: only `src/game/**`, `src/entities/**`, `src/ui/{HUD,ShopOverlay,HospitalOverlay,DialogueBox}.ts`, and `src/systems/WhackSystem.ts` import `'phaser'` at runtime; `src/systems/{Economy,MoodPendulum,RouteScoring,PrizePack,WhackOffsets,SwingTracker}.ts` are plain pure TS with **no** Phaser import — this pure/impure split is the existing convention the three new formats should extend, not invent.
- **`vite-plugin-pwa`** is configured with `manifest: false` (uses the static `public/manifest.webmanifest` as the single source of truth) and **no `workbox.globPatterns` yet** — the Phase‑1 comment says "deferred to Phase 4" but `git log` on `vite/config.prod.mjs` shows it was never revisited. One service worker, one scope, registered at the site root. `manifest.webmanifest` has `start_url: "./"`, `scope` implied root, `display: "standalone"`.
- **CSP** (`public/_headers`, pattern `/*` = applies to every path on the deploy): `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'`. This blocks CDN Phaser, Google Fonts, and any third-party `connect-src` (matters for Cloudflare Web Analytics, below).
- **`SaveService`** (`src/services/SaveService.ts`) is adventure-specific: `idb-keyval` `createStore('bw-saves', 'saves')`, single key `'slot_1'`, versioned (`SAVE_VERSION = 2`) shape with `level/position/flags/coins/journalUnlocked/bestScores`. IndexedDB is **origin-scoped, not path-scoped** — moving the HTML file that loads this code from `/` to `/adventure/` does not touch this database at all; no migration is needed.
- **`ShareService`** (`src/services/ShareService.ts`) is also adventure-specific and tightly coupled to it: it takes a `game.renderer.snapshot()` of the live Phaser canvas, renders a 1200×630 card via `src/ui/ShareCard.ts`, and shares a `File` via `navigator.share({files, text})`, with a hardcoded filename and a synchronous-gesture cache (`prepareShareCard` before the tap, `shareCard` with no `await` before `navigator.share` on the cached path). This is **not** the shared `share()` the three new formats need — the spike's `format-shell.md` pattern shares **text + url only**, no image Blob, because the per-page OG tags (see below) do the card-rendering job instead of an attached image.
- **`i18n.ts`** is a 2-dependency-free module: `import en from '../../public/locales/en/common.json'`, exposes `t(key)`. No Phaser, no DOM. Safe to import from every page unchanged.
- **Tests**: `vitest.config.ts` runs `tests/**/*.test.ts` in a Node environment; the existing suite (`og-tags.test.ts`, `save-service.test.ts`, `mood-pendulum.test.ts`, etc.) reads `index.html` and pure modules directly with `readFileSync`/imports — no DOM/browser runner. The spikes' Playwright `_verify.cjs` scripts are a **separate, additional** layer (412×915 mobile viewport, `window.__X__` probes) that this repo does not yet have; they are a sibling practice to `vitest`, not a replacement.
- **Branch stack** (confirmed via `git merge-base --is-ancestor`): `main` is at Phase 1 only. `gsd/phase-02 → 02.1 → 03 → 03.1 → 04` is one straight line. `gsd/fix-menu-taps` (2 commits, `ab9cbe1` + `5fe9533`) branches off the tip of `phase-04`. `spike/pivot-formats` (current branch; docs-only commits `a49e5bf…05950db`: spike wrap-ups, the `spike-findings-barren-wuffett` skill, the v2.0 `PROJECT.md`/milestone-archive changes) **also** branches off the tip of `phase-04`, as a sibling of `fix-menu-taps` — `fix-menu-taps` is confirmed **not** an ancestor of `spike/pivot-formats`, so its 2 commits must be brought in separately.

## Recommended Project Structure

```
index.html                       # MODIFIED → becomes the HUB entry (was the adventure's entry)
arcade/index.html                 # NEW — Mr. Market arcade (Phaser), release 1
snowball/index.html               # NEW — Snowball idle (DOM only), release 2
ceo/index.html                    # NEW — Barren, CEO swipe (DOM only), release 3
adventure/index.html              # NEW (moved) — exact former root index.html, unchanged <body>/<script> content

src/
├── main.ts                       # UNCHANGED — now loaded by adventure/index.html instead of /index.html
├── game/                         # UNCHANGED — adventure Phaser scenes, untouched
├── entities/ ui/ systems/ data/  # UNCHANGED — adventure-only code
├── services/
│   ├── AudioService.ts           # UNCHANGED (adventure)
│   ├── SaveService.ts            # UNCHANGED (adventure save, origin-scoped, unaffected by the path move)
│   ├── ShareService.ts           # UNCHANGED (adventure's image-card share stays as-is)
│   ├── ContentRegistry.ts        # UNCHANGED (adventure level manifests)
│   └── i18n.ts                   # UNCHANGED — reused as-is by hub + all 3 new formats
├── shared/                       # NEW — the hub plumbing from format-shell.md, imported by hub + arcade + snowball + ceo (never by adventure, never pulls in Phaser)
│   ├── config.ts                 # HANDLE, SITE_URL, BASE_URL, per-page GAME_URLS, EPOCH
│   ├── dailySeed.ts              # hashStr (FNV-1a), mulberry32, DATE/DAILY_NO, schedule fingerprint helper
│   ├── shareFlow.ts              # share(text, url) — native share → clipboard+X-intent fallback (text-only, no Blob)
│   ├── overlays.ts               # Title/End/About DOM overlay helpers, `.handle` fill-in, About copy constant
│   ├── testHooks.ts              # window.__X__ probe + forensic LOG helper shape, shared across formats
│   ├── progressStore.ts          # NEW device-only store: daily checklist + streak + per-format bests (see Data Flow)
│   ├── releaseConfig.ts          # NEW — one flag per format; gates hub tile lock state AND which entries a given deploy builds
│   └── cast.ts                   # ported from sources/002-old-barren-cast/cast.js — pure, code-drawn sprites (Px grid → dataURL), no binary asset
├── hub/                          # NEW
│   ├── main.ts                   # hub bootstrap — vanilla TS + DOM, no Phaser import
│   ├── tiles.ts                  # tile model: {id, title, blurb, status: 'live'|'locked', href?} driven by releaseConfig.ts
│   └── checklist.ts              # daily checklist + streak UI, reads/writes shared/progressStore.ts
├── arcade/                       # NEW — release 1
│   ├── main.ts                   # own `new Phaser.Game()` instance, separate from the adventure's
│   ├── scenes/MarketScene.ts     # Phaser scene (drag-to-catch), ported from game.js
│   └── market.ts                 # pure buildMarket() — ported from items.js/game.js, NO Phaser import, unit-testable
├── snowball/                     # NEW — release 2
│   ├── main.ts                   # DOM bootstrap, no Phaser import
│   └── econ.ts                   # pure economy model, ported from econ.js
└── ceo/                          # NEW — release 3
    ├── main.ts                   # DOM bootstrap, no Phaser import
    └── cards.ts                  # pure deck/meter model, ported from cards.js

public/
├── og/                           # NEW — one 1200×630 card per page, replacing the single broken og-image.png
│   ├── hub.png  arcade.png  snowball.png  ceo.png  adventure.png
├── fonts/
│   ├── press-start-2p-latin.woff2   # existing
│   └── pixelify-sans-latin.woff2    # NEW — self-hosted; spikes used Google Fonts CDN, which the CSP blocks
├── locales/en/common.json       # MODIFIED — add hub./arcade./idle./ceo. keys (adventure's keys untouched)
├── _headers                      # MODIFIED — add Cloudflare Web Analytics beacon origin to script-src/connect-src
├── manifest.webmanifest          # MODIFIED — icons/name may stay; start_url/scope stay "/" (the hub is now the install target)
└── datenschutz.html              # MODIFIED — drop Supabase/Brevo mentions, describe cookieless analytics instead

tests/                            # EXISTING vitest suite stays; add one file per new pure module (market/econ/cards, dailySeed, progressStore) following the existing Economy/MoodPendulum pattern
scripts/ or .planning/spikes-ports/ # NEW — per-format Node `_sim.mjs` balance simulators + Playwright `_verify.cjs` phone checks, ported 1:1 from the spike sources
```

### Structure Rationale

- **`src/shared/` is the load-bearing new boundary.** Every module in it must stay Phaser-free so that `hub/`, `snowball/`, `ceo/` never pull the Phaser chunk in. `arcade/` is the one new format allowed to import Phaser, in its own `Game()` instance, independent of the adventure's.
- **No shared Phaser `Game` instance across pages.** Each of `adventure/` and `arcade/` boots its own `new Phaser.Game({...})` inside its own entry — they are different HTML documents (different `<script type="module">` boundaries), so there is no shared-instance question to solve; this is a benefit of the MPA approach, not a cost.
- **`releaseConfig.ts` is a single flat constant, not a service.** €0 static hosting rules out a remote feature-flag fetch; one file, one boolean per format, edited and redeployed per release.
- **Adventure's existing services (`SaveService`, `ShareService`, `AudioService`, `ContentRegistry`) are not touched or generalized.** They stay adventure-only. The new `shared/progressStore.ts` and `shared/shareFlow.ts` are deliberately separate, lighter modules for the new formats rather than generalizations of the old ones — generalizing `ShareService`'s image-Blob flow would be over-engineering, since none of the spiked formats need an attached image (the per-page OG tag does that job).

## Architectural Patterns

### Pattern 1: Vite multi-page build, one entry per route, shared code auto-split

**What:** `build.rollupOptions.input` maps a name to each HTML file; Rollup builds one bundle graph per entry and automatically factors shared imports (e.g. `src/shared/*`, `src/services/i18n.ts`) into common chunks, while per-entry-only imports (Phaser, a format's own scene/model) stay out of entries that never reference them.
**When to use:** Exactly this project's shape — several independent small apps sharing a few plumbing modules on one static origin.
**Trade-offs:** No client-side router, no shared in-memory app state across pages (acceptable here — the hub and each game are separate full page loads, and cross-page "state" only needs to be the on-device store, not live JS state).

```js
// vite/config.prod.mjs — additive to the existing config
import { resolve } from 'node:path';
export default defineConfig({
  base: './',                      // unchanged — already correct for nested entries
  build: {
    rollupOptions: {
      input: {
        hub:       resolve(__dirname, '../index.html'),
        adventure: resolve(__dirname, '../adventure/index.html'),
        arcade:    resolve(__dirname, '../arcade/index.html'),   // added when Release 1 is built
        // snowball / ceo entries added in their own release steps — see Build Order
      },
      output: { manualChunks: { phaser: ['phaser'] } },          // unchanged
    },
  },
});
```

### Pattern 2: Per-page static OG/X meta — no server, no templating

**What:** Each HTML entry is a real, separate static file, so each one simply carries its **own** `<meta property="og:*">`/`<meta name="twitter:*">` block with an **absolute** URL (X will not render a relative `og:image`, which is the root cause of the currently-broken card). `shared/config.ts` exports one absolute URL per page (`GAME_URLS.arcade = 'https://barren-wuffett.pages.dev/arcade/'`), and `shared/shareFlow.ts`'s `share(text, url)` passes that page's own URL as the share target. When X (or any crawler) fetches that URL, it renders using that page's own `<head>`, not the hub's — no attached image, no server logic, pure static hosting.
**When to use:** Any static multi-page site that wants per-route social cards.
**Trade-offs:** One more HTML file to keep the `<head>` boilerplate (viewport, CSP-compatible font preload, manifest link if applicable) duplicated across 5 files — acceptable at this scale; extract a tiny `scripts/` templater later only if it becomes painful.

```html
<!-- arcade/index.html <head>, pattern repeated per page with its own url/title/description/image -->
<meta property="og:url"   content="https://barren-wuffett.pages.dev/arcade/" />
<meta property="og:title" content="Barren vs. Mr. Market — Barren Wuffett" />
<meta property="og:image" content="https://barren-wuffett.pages.dev/og/arcade.png" />
<meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" />
```

### Pattern 3: Device-only progress store shared across pages via a second IndexedDB store

**What:** `shared/progressStore.ts` opens its own `idb-keyval` store (e.g. `createStore('bw-hub', 'progress')`) — deliberately separate from `SaveService`'s `'bw-saves'/'saves'` — holding `{ version, checklist: Record<dateISO, string[]>, streak: {count, lastDate}, bests: Record<formatId, number> }`. Because IndexedDB is scoped to the **origin**, not the path, every page (`/`, `/arcade/`, `/snowball/`, `/ceo/`) that imports this module opens the *same* database. Each format calls `recordDailyPlay(formatId, date, resultSummary)` once its daily run ends; the hub calls `readProgress()` on its own load to render the checklist/streak and each tile's "best" badge. There is no live cross-tab sync (not needed — the user finishes a game, taps back to the hub, the hub does a fresh page load and reads fresh state).
**When to use:** Any "Wordle-style" daily-return mechanic across multiple static pages with zero backend.
**Trade-offs:** Not live if two tabs are open simultaneously; irrelevant for a mobile-first single-tab flow. Follow `SaveService`'s exact robustness pattern — wrap every call in try/catch (private-mode-safe), carry a `version` field, run a `migrate()` on read, never trust the raw shape.

```ts
// src/shared/progressStore.ts — mirrors SaveService.ts conventions, new store name
import { createStore, get, set } from 'idb-keyval';
const store = createStore('bw-hub', 'progress');
export interface HubProgress { version: number; checklist: Record<string, string[]>;
  streak: { count: number; lastDate: string }; bests: Record<string, number>; }
export async function recordDailyPlay(formatId: string, date: string, best?: number) { /* try/catch, migrate, write */ }
export async function readProgress(): Promise<HubProgress> { /* try/catch, migrate, default shape */ }
```

**Adventure's own "best" data is not duplicated into this store.** If the hub tile for the adventure wants a "continue" vs "start" badge, it imports the existing `SaveService.load()` directly (already pure, already testable) — one more reuse of existing code rather than a new sync path.

## Data Flow

### Hub ↔ games (device-only progress)

```
[Game page loads] → shared/dailySeed.ts resolves DATE/DAILY_NO
      ↓
[Player finishes the daily run] → shared/progressStore.recordDailyPlay(formatId, DATE, result)
      ↓ (IndexedDB 'bw-hub' store, origin-scoped — no network)
[Player taps back to hub, hub/index.html loads fresh]
      ↓
[hub/main.ts] → shared/progressStore.readProgress() → hub/checklist.ts renders today's checklist + streak + per-tile best badge
```

### Share → OG card (per page, static, no attachment)

```
[Player taps SHARE] → shared/shareFlow.share(text, GAME_URLS.<page>)   // text built synchronously, no await before navigator.share
      ↓
navigator.share({text, url}) on touch   OR   clipboard + x.com/intent/tweet fallback on desktop
      ↓
X/any crawler fetches GAME_URLS.<page> → reads THAT page's own <head> og:* tags → renders that page's own public/og/<page>.png
```

### Release gating (build-time, not runtime)

```
releaseConfig.ts { arcade: true, snowball: false, ceo: false }
      ↓                                   ↓
hub/tiles.ts: locked tile, no <a href>    vite/config.*.mjs rollupOptions.input: entry omitted entirely
```

Both sides of a given format change together in the same commit — a locked tile must never link to a route that doesn't exist in that deploy's build, and a built route must never be reachable from the hub before its flag flips.

## Anti-Patterns

### Anti-Pattern 1: One `navigateFallback` for the whole PWA (SPA pattern applied to an MPA)

**What people do:** Copy the typical `vite-plugin-pwa` SPA recipe — `workbox.navigateFallback: '/index.html'` — so any offline navigation falls back to one page.
**Why it's wrong:** This project is a multi-page app; a visitor offline-navigating to `/arcade/` would get silently redirected to the hub instead of the arcade page, which looks like a bug.
**Do this instead:** Either omit `navigateFallback` and rely on Workbox precaching each HTML entry by its own URL (so offline navigation to any precached route serves itself), or scope `navigateFallback`/`navigateFallbackDenylist` per route if true offline-first is required later. At minimum, finally set `workbox.globPatterns` (currently unset since Phase 1) to include every new page's JS/CSS/HTML/PNG/woff2 — this was already overdue before the hub existed.

### Anti-Pattern 2: Generalizing `ShareService`'s image-Blob flow for the new formats

**What people do:** See one `ShareService` already exists and try to extend it to cover arcade/snowball/ceo's share buttons too.
**Why it's wrong:** `ShareService` is built around a Phaser canvas snapshot (`game.renderer.snapshot`) specific to the adventure's single victory screen; snowball/ceo have no Phaser canvas at all, and the spike-proven pattern for all three new formats is text+url only (the OG tag does the card job, not an attached file). Forcing a snapshot-based flow onto DOM-only pages adds a dependency and a failure mode (snapshot requires a live `Phaser.Game`) that doesn't exist for them.
**Do this instead:** `shared/shareFlow.ts` as its own small module (`share(text, url)`), independent of `ShareService.ts`. Leave the adventure's `ShareService` untouched.

### Anti-Pattern 3: Reusing the adventure's `createStore('bw-saves', 'saves')` for hub progress

**What people do:** Since `SaveService` already proves the IndexedDB pattern works, bolt the daily checklist/streak onto the same store/key to "save a file."
**Why it's wrong:** Couples an unrelated, frequently-changing daily/streak shape to the adventure's versioned level-save schema; a future `SAVE_VERSION` bump or `migrate()` change for the adventure now risks corrupting hub progress and vice versa.
**Do this instead:** A second, separate `idb-keyval` store (`'bw-hub'/'progress'`) — cheap (IndexedDB supports multiple stores per origin trivially) and keeps the two concerns independently versioned.

## Integration Points (from the actual code)

| Integration point | Current state | What changes | Risk |
|---|---|---|---|
| `index.html` → `src/main.ts` | Root entry boots the adventure's Phaser game directly | Root entry becomes the **hub**; the exact former `index.html` content moves verbatim to `adventure/index.html` (same `<script src="/src/main.ts">`, same `#game-container`) | Low — confirmed IndexedDB/localStorage are origin-scoped, not path-scoped, so the adventure's save survives the move untouched |
| `vite/config.{dev,prod}.mjs` `rollupOptions` | Single implicit entry (`index.html`), `manualChunks: {phaser:['phaser']}` | Add explicit `input: {hub, adventure, arcade, …}` map; keep `manualChunks` as-is | Low — matches `base: './'` already in place |
| `vite-plugin-pwa` | `manifest:false`, no `globPatterns`, one scope at `/` | Keep **one** PWA registration at root scope (hub becomes the install target); finally set `workbox.globPatterns` to cover all new pages' assets; avoid a blanket `navigateFallback` (see Anti-Pattern 1) | Medium — the one existing installed-PWA icon (if any real users have it) will now open to the hub instead of the adventure; acceptable since the live site is still the 2026-06-11 Phase-1 build per project context, and the hub is the intended new front door |
| `public/_headers` CSP | `script-src 'self'; font-src 'self'; connect-src 'self'` — blocks CDN Phaser, Google Fonts, any analytics beacon | Add npm Phaser import (already a dependency, just stop using the CDN `<script>` the spikes used) + self-hosted Pixelify Sans in `public/fonts/`; add Cloudflare Web Analytics' script + beacon origins to `script-src`/`connect-src` when wiring analytics | Low-Medium — must verify Cloudflare Web Analytics' exact script/beacon hostnames before editing the CSP; a syntax mistake in `_headers` breaks the whole site, not just one page |
| `src/services/i18n.ts` | Already dependency-free, imports `public/locales/en/common.json` directly | Reused as-is by hub + all 3 new formats; extend `common.json` with new keys, no new infra | None |
| `src/services/SaveService.ts` / `ShareService.ts` / `ContentRegistry.ts` / `AudioService.ts` | Adventure-only, Phaser-coupled or save-coupled | **Untouched.** New `shared/progressStore.ts` and `shared/shareFlow.ts` are separate, lighter modules — not extensions of these | None |
| `public/manifest.webmanifest` | `start_url: "./"`, icons for the adventure | `start_url`/`scope` stay root (now resolves to the hub); icons can stay or get a hub-flavored refresh — not required for function | Low |
| `public/datenschutz.html` | Describes Supabase/Brevo (being dropped this milestone) | Rewrite to describe cookieless Cloudflare Web Analytics and the device-only progress store (no cookies, no account, no email) | Low — text-only change, but legally load-bearing (GDPR/UWG per `PROJECT.md` constraints) |
| Branch stack (`main`, `phase-02…04`, `gsd/fix-menu-taps`, `spike/pivot-formats`) | `main` only has Phase 1; everything above is unmerged, confirmed via `git merge-base` | Fast-forward `main` through the linear `phase-02→04` chain, then bring in `fix-menu-taps`' 2 commits (confirmed **not** already in `spike/pivot-formats`), then merge `spike/pivot-formats`' docs-only commits | Low merge-conflict risk (fix-menu-taps touches `src/game/scenes`; the spike-formats commits are `.planning/`+`.claude/skills/` docs only — disjoint paths) but **the adventure has never had its Phase 3.1/4 phone UAT per `PROJECT.md`** — do that check once, right after consolidating, before building anything new on top |

## New vs Modified (explicit)

**New files/dirs:** `arcade/`, `snowball/`, `ceo/`, `adventure/` (as a directory — content moved, not newly written), `src/shared/*`, `src/hub/*`, `src/arcade/*`, `src/snowball/*`, `src/ceo/*`, `public/og/*`, `public/fonts/pixelify-sans-latin.woff2`, per-format pure-model unit tests, per-format Node `_sim.mjs` + Playwright `_verify.cjs` phone checks (ported from the spike sources).

**Modified files:** `index.html` (becomes the hub's markup, replacing the adventure's), `vite/config.dev.mjs` + `vite/config.prod.mjs` (multi-entry `input`, `workbox.globPatterns`), `public/_headers` (CSP additions for analytics), `public/locales/en/common.json` (new keys appended), `public/manifest.webmanifest` (verify `start_url`/`scope` still correct for the new root), `public/datenschutz.html` (analytics + progress-store language, Supabase/Brevo removed).

**Explicitly untouched:** `src/game/**`, `src/entities/**`, `src/data/**`, `src/systems/**`, `src/ui/**`, `src/services/{SaveService,ShareService,AudioService,ContentRegistry}.ts`, the entire existing `tests/` suite (only additive new test files, no edits to existing ones expected).

## PWA Scope Decision

**One PWA, one scope, at the site root — the hub, not any individual game, is the installable/offline unit.** Rationale: `vite-plugin-pwa` registers one service worker per plugin invocation/scope; running it multiple times for independently-installable per-game scopes (confirmed as a supported but more complex pattern) buys nothing here, since none of the requirements ask for a game to be installed *without* the hub, and the €0/no-backend/static-only constraint rewards the simplest working setup. Consequence: the install prompt, the home-screen icon, and offline precaching all point at `/`; `/arcade/`, `/snowball/`, `/ceo/`, `/adventure/` are ordinary pages *within* that one PWA's precache scope, reachable offline once visited/precached, but not separately "installable."

## Build Order

Respects: shared shell before formats; arcade releasable without snowball/ceo existing; branch consolidation first; adventure regression check before any new code lands on top.

1. **Consolidate `main`.** Fast-forward through the linear `phase-02 → 02.1 → 03 → 03.1 → 04` chain. Bring in `gsd/fix-menu-taps`' 2 commits (not already present on `spike/pivot-formats`). Merge `spike/pivot-formats`' docs-only commits. Run the adventure's overdue phone/UAT check **once**, now, before anything else — this is the "adventure regression risk" gate, done while the adventure is still a single-page app and easiest to verify in isolation.
2. **Shared shell, no new gameplay.** Move the adventure's `index.html` to `adventure/index.html` unchanged; put the hub's markup at the new root `index.html`. Build `src/shared/*` (config, dailySeed, shareFlow, overlays, testHooks, progressStore, releaseConfig, cast — each with a unit test, pure/DOM, zero Phaser imports). Build `src/hub/*` and wire the adventure tile. Flip the multi-entry Vite config (`hub`, `adventure` only, so far). Fix both pages' OG tags (absolute URLs, real images) — the long-known broken-card defect. Wire Cloudflare Web Analytics + CSP + the rewritten privacy page. **Deploy this hub+adventure-only build first**, as a checkpoint that validates the MPA/PWA/CSP plumbing on the real host before any new gameplay code is layered on.
3. **Release 1 — arcade.** Port `market.ts` (pure) + its Node sim, `MarketScene.ts` (Phaser) + `arcade/main.ts` (its own `Game()` instance), self-host Pixelify Sans, swap CDN Phaser for the npm import, build `arcade/index.html` with its own OG card. Headless phone check, then a real-phone feel pass. Flip `releaseConfig.arcade = true`, add the `arcade` entry to `rollupOptions.input`, deploy, X post. **This step touches nothing in `snowball/` or `ceo/`, which don't need to exist yet** — the only shared dependency is step 2's shell, already done.
4. **Release 2 — snowball (idle).** Same shape as step 3: port `econ.ts` + DOM UI + sim, phone check, flip flag, add entry, deploy, post. Can start as soon as step 2 is done, independent of step 3's gameplay code (only blocked on the shared shell, not on the arcade).
5. **Release 3 — ceo (swipe).** Same shape: port `cards.ts` + DOM UI + sim, phone check, flip flag, add entry, deploy, post.

## Sources

- Direct repo inspection: `index.html`, `src/main.ts`, `src/game/main.ts`, `vite/config.{dev,prod}.mjs`, `public/_headers`, `public/manifest.webmanifest`, `src/services/{SaveService,ShareService,i18n,ContentRegistry}.ts`, `tests/og-tags.test.ts`, `vitest.config.ts`, `git log`/`git merge-base` on the branch stack. (HIGH — primary source, read directly)
- `.claude/skills/spike-findings-barren-wuffett/SKILL.md` + `references/format-shell.md` + `sources/hub-index.html` + `sources/003{a,b,c}-*/index.html` + `sources/003a-mr-market-arcade/_verify.cjs`. (HIGH — curated project skill, already-validated spike findings)
- `.planning/PROJECT.md` (v2.0 milestone scope, constraints, decisions, branch-stack context). (HIGH — primary project source)
- [Vite "Building for Production" / multi-page guidance](https://v3.vitejs.dev/guide/build) and community write-ups on `rollupOptions.input` for MPAs. (LOW — web search synthesis, cross-checked against this repo's already-working `base: './'` + `manualChunks` setup, so treated as confirmed rather than speculative)
- [vite-pwa/vite-plugin-pwa discussion #704, "Vite Multi-page App"](https://github.com/vite-pwa/vite-plugin-pwa/discussions/704) and issue #764 on service-worker scope. (LOW — web search synthesis; used only to confirm that one-registration-one-scope is the simple/default path and multi-scope is an opt-in alternative)
- [Cloudflare Pages redirects/config docs](https://developers.cloudflare.com/pages/configuration/redirects/) and community threads on folder/index.html routing. (LOW — web search synthesis; confirms `folder/index.html` → `/folder/` works with no `_redirects`, consistent with this project's existing `public/impressum.html`/`datenschutz.html` static routing)

---
*Architecture research for: barren-wuffett v2.0 "The Barren Wuffett Hub" — hub/multi-format integration*
*Researched: 2026-10-07*
