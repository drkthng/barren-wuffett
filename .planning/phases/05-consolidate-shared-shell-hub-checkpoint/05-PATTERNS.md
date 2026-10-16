# Phase 5: Consolidate + Shared Shell + Hub Checkpoint - Pattern Map

**Mapped:** 2026-10-16
**Files analyzed:** 20 (new + modified)
**Analogs found:** 18 / 20

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/shared/config.ts` | config | CRUD (static constants) | `.claude/skills/spike-findings-barren-wuffett/references/format-shell.md` §1 (spike config block) | role-match (no existing TS analog; spike JS is the canonical source) |
| `src/shared/dailySeed.ts` | utility | transform | `format-shell.md` §2 (FNV-1a/mulberry32 block) | exact (ported verbatim, already proven) |
| `src/shared/shareFlow.ts` | service | event-driven | `src/services/ShareService.ts` (existing, untouched) + `format-shell.md` §3 | role-match |
| `src/shared/overlays.ts` | component | request-response (DOM) | `.claude/skills/sketch-findings-barren-wuffett/sources/001-hub-phone/index.html` (About overlay markup) | role-match |
| `src/shared/testHooks.ts` | utility | event-driven | `src/main.ts` (`window.__BW_GAME__` convention) + `format-shell.md` §5 | exact (naming convention) |
| `src/shared/progressStore.ts` | store | CRUD | `src/services/SaveService.ts` (full file) | exact |
| `src/shared/releaseConfig.ts` | config | CRUD (static) | `format-shell.md` §1 pattern (none in current src) | role-match |
| `src/shared/cast.ts` | utility | transform (pure draw) | `.claude/skills/spike-findings-barren-wuffett/sources/002-old-barren-cast/cast.js` + `.claude/skills/sketch-findings-barren-wuffett/sources/_lib/hubsprites.js` | exact (direct port) |
| `src/hub/main.ts` | provider/bootstrap | event-driven | `src/main.ts` (bootstrap pattern) | role-match |
| `src/hub/tiles.ts` | component | CRUD (render from config) | `.claude/skills/sketch-findings-barren-wuffett/sources/001-hub-phone/index.html` (card markup/JS) + `hub-layout-cards.md` | exact |
| `src/hub/checklist.ts` | component | CRUD | `.claude/skills/sketch-findings-barren-wuffett/sources/002-streak-snowball/index.html` + `streak-snowball.md` | exact |
| `index.html` (becomes hub entry) | route/config | request-response | `.claude/skills/sketch-findings-barren-wuffett/sources/001-hub-phone/index.html` (visual baseline) + current `index.html` (meta/head conventions) | exact |
| `adventure/index.html` (moved) | route/config | request-response | current root `index.html` (verbatim move) | exact |
| `vite/config.prod.mjs`, `vite/config.dev.mjs` | config | build | current `vite/config.prod.mjs` (same file, additive edit) | exact |
| `public/manifest.webmanifest` | config | static | current `public/manifest.webmanifest` (same file, additive edit) | exact |
| `public/_headers` | config | static | current `public/_headers` (same file, additive edit) | exact |
| `public/datenschutz.html` | route | request-response | current `public/datenschutz.html` (same file, rewritten) | exact |
| `src/game/scenes/MainMenu.ts` ("← HUB" + credit) | controller (Phaser scene) | event-driven | same file, existing Impressum/Privacy hit-area block (lines ~51-92) — **must be read post `gsd/fix-menu-taps` merge for the `paddedHitArea` helper** | exact |
| `src/game/scenes/Settings.ts` ("← HUB" + credit) | controller (Phaser scene) | event-driven | `MainMenu.ts`'s legal-link block (same pattern, different scene) | exact |
| `tests/og-tags.test.ts` | test | transform | current `tests/og-tags.test.ts` (rewritten for absolute per-page URLs) | exact |
| `scripts/*` headless phone check | test/utility | event-driven | `smoke.mjs` (Playwright + vite preview pattern) | exact |
| `public/og/hub.png`, `public/og/adventure.png` + `card.html` | utility (build-time render) | file-I/O | no existing analog — new Playwright-screenshot-from-static-HTML pipeline | **no analog** |

## Pattern Assignments

### `src/shared/progressStore.ts` (store, CRUD)

**Analog:** `src/services/SaveService.ts` (full file, 79 lines)

**Imports pattern** (line 17):
```ts
import { createStore, get, set } from 'idb-keyval';
```

**Core CRUD pattern — separate named store, versioned, migrate-on-read** (lines 19-24, 37-49):
```ts
const store = createStore('bw-saves', 'saves');   // → 'bw-hub', 'progress' for the new store
export const SAVE_VERSION = 2;

function migrate(raw: Partial<SaveState>): SaveState {
    return {
        version: SAVE_VERSION,
        updatedAt: raw.updatedAt ?? Date.now(),
        // ...defaults for every field, never trust raw shape
    };
}
```

**Error handling pattern — every call wrapped, degrade to undefined/no-op** (lines 51-78):
```ts
export const SaveService = {
    async save(state: SaveState): Promise<void> {
        try {
            const toWrite = { ...state, version: SAVE_VERSION, updatedAt: Date.now() };
            await set('slot_1', toWrite, store);
        } catch { /* IndexedDB unavailable (private browsing, quota exceeded) — ignore */ }
    },
    async load(): Promise<SaveState | undefined> {
        try {
            const raw = await get<unknown>('slot_1', store);
            if (!raw || typeof raw !== 'object') return undefined;
            return migrate(raw as Partial<SaveState>);   // always migrate, even at current version
        } catch { return undefined; }
    },
};
```

**Apply to `progressStore.ts`:** copy this exact shape with `createStore('bw-hub', 'progress')`, a `PROGRESS_VERSION`, and a `migrate()` that fills `{ streak, lastFinishedUTCDate, checklist: Record<gameId, boolean>, bests: Record<gameId, number>, installHintDismissed }`. This directly satisfies HUB-07 (storage-unavailable degrades to brand-new-player per `05-UI-SPEC.md`'s resolved error state) with zero new technique.

---

### `src/shared/dailySeed.ts` (utility, transform)

**Analog:** `.claude/skills/spike-findings-barren-wuffett/references/format-shell.md` §2 (already-proven spike code, no TS port exists yet)

**Core pattern — FNV-1a hash → mulberry32 PRNG → date/epoch math** (format-shell.md lines 34-50):
```js
export function hashStr(s) {                       // FNV-1a 32-bit
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
}
export function mulberry32(a) {
    return () => {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const params   = new URLSearchParams(location.search);
export const DATE     = params.get('date') || new Date().toISOString().slice(0, 10);
export const DAILY_NO = Math.floor((Date.parse(`${DATE}T00:00:00Z`) - EPOCH) / 86400000) + 1;
```

**Apply to `dailySeed.ts`:** port with TS types, add D-08's placeholder-`EPOCH` guard (render nothing / omit the counter for `DAILY_NO < 1`, per RESEARCH.md Open Question 1's recommendation — plan-time decision, not re-research). Keep the "build the whole schedule up front, consume by time, never draw per frame" rule from the same section.

---

### `src/shared/cast.ts` (utility, transform / pure draw)

**Analog:** `.claude/skills/spike-findings-barren-wuffett/sources/002-old-barren-cast/cast.js` (full source, the canonical port target per CONTEXT.md canonical_refs) + `.claude/skills/sketch-findings-barren-wuffett/sources/_lib/hubsprites.js` (snowball/padlock/check sprites, same vocabulary)

**Core pattern — `Px` grid builder class** (hubsprites.js lines 17-37, same shape in cast.js):
```js
class Px {
    constructor(w, h) { this.w = w; this.h = h; this.g = Array.from({ length: h }, () => Array(w).fill(null)); }
    set(x, y, c) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y][x] = c; return this; }
    rect(x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, c); return this; }
    ellipse(cx, cy, rx, ry, c, keep = () => true) { /* ... */ }
    outline(c = 'K') { /* 4-neighbour auto-outline, call LAST */ }
    rows() { return this.g.map(r => r.map(c => c ?? '.').join('')); }
}
const sprite = (p, pal = {}) => ({ w: p.w, h: p.h, rows: p.rows(), pal: { ...BASE, ...pal } });
```

**Rendering pattern** (pixel-cast.md lines 69-75):
```js
// Phaser: this.textures.addCanvas(key, renderCanvas(spr, 1)); this.add.image(x, y, 'marketGreed').setScale(5);
// DOM:    img.src = dataURL(SPRITES.barren, 4);   // CSS: image-rendering: pixelated
```

**Apply:** merge `cast.js`'s `SPRITES` (barren/charlie/marketGreed/etc.) with `hubsprites.js`'s `PAL`/`ball()` additions (snowball, padlock, check) into one `src/shared/cast.ts`, typed, same `renderCanvas`/`dataURL` exports. Never rebuild sprites per-frame (pixel-cast.md Constraints) — cache the canvas/dataURL once.

---

### `src/hub/tiles.ts` + `src/hub/checklist.ts` (component, CRUD)

**Analog:** `.claude/skills/sketch-findings-barren-wuffett/sources/001-hub-phone/index.html` and `002-streak-snowball/index.html` (phone-validated sketch markup/CSS/JS) + `hub-layout-cards.md` (CSS Patterns section)

**Core CSS pattern — accent-driven card, locked-state override** (hub-layout-cards.md lines 92-118):
```css
.card { display: flex; gap: 12px; align-items: center; background: var(--color-surface);
        border-radius: 20px; padding: 10px 12px 10px 10px; border: 2px solid transparent; }
.card.locked { background: transparent; border: 2px dashed var(--color-border); --accent: var(--color-locked); }
.card.locked .art img.portrait { filter: grayscale(1) brightness(.55); opacity: .7; }
.badge.done  { background: var(--accent); color: #15121c; font-weight: 600; }
.badge.new   { background: var(--color-primary); color: #15121c; font-family: var(--font-pixel); font-size: 9px; }
```

**Daily strip pattern** (hub-layout-cards.md lines 122-133):
```css
.strip { display: flex; align-items: center; gap: 12px; background: var(--color-surface);
         border-radius: 18px; padding: 10px 14px 10px 10px; min-height: 56px; margin-bottom: 12px; }
.strip.solo { padding-left: 14px; }   /* "Daily #N" only, no checklist/streak — D-09 */
.box.on { background: var(--accent); border-color: var(--accent); }
```

**Apply:** this is the literal visual baseline the user approved on-phone (D-01/D-05 and the sketch sign-off 2026-10-16) — grow it into real TS/DOM modules, not a re-design. Read the 6 "hub's real states" fixtures (`hub-layout-cards.md` table) as the test fixtures for `tiles.ts`. Route every copy string through `t(key)` (i18n.ts convention below).

---

### `index.html` → hub entry / `adventure/index.html` (route, request-response)

**Analog:** current `D:/AiProjects/barren-wuffett/index.html` (44 lines, read this session) for head/meta/PWA link conventions; `.claude/skills/sketch-findings-barren-wuffett/sources/001-hub-phone/index.html` for the hub body.

**Head conventions to carry into both new entries** (current `index.html` lines 1-33):
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
<meta name="theme-color" content="#1a1a2e" />          <!-- → cozy-dusk --color-bg #221a1d for hub -->
<link rel="manifest" href="manifest.webmanifest" />
<link rel="preload" href="/fonts/press-start-2p-latin.woff2" as="font" type="font/woff2" crossorigin />
<!-- + a matching preload for the new self-hosted pixelify-sans woff2 -->
```

**Known defect to fix, not copy** (current `index.html` lines 9-14, 18-22):
```html
<meta property="og:image" content="/og-image.png" />      <!-- RELATIVE — must become absolute per-page -->
```
Replace with `https://barren-wuffett.pages.dev/og/hub.png` (hub) and `.../og/adventure.png` (adventure), per D-16.

**Legal DOM links pattern — moves verbatim to `adventure/index.html` only** (current `index.html` lines 46-50):
```html
<div id="legal-dom-links" style="visibility:hidden;">
    <a href="/impressum">Impressum</a>
    <a href="/datenschutz">Privacy Policy</a>
</div>
```
Per RESEARCH.md State of the Art: the hub needs its **own, visible** footer (per UI-SPEC's "Impressum · Privacy" footer links), not a copy of this hidden-anchor pattern — that pattern was built for a page with no DOM footer to put links in.

---

### `src/game/scenes/MainMenu.ts` / `Settings.ts` ("← HUB" button + credit line)

**Analog:** same file, existing Impressum/Privacy legal-link block — **but this analog must be read fresh after `gsd/fix-menu-taps` lands**, since that branch replaces the inline-`Rectangle` hit areas below with a `paddedHitArea(text, w, h)` helper (confirmed via RESEARCH.md Pattern 4 / Pitfall 2).

**Current pattern (pre-fix, for reference only — do not build the new button against this)** (`MainMenu.ts` lines 51-92):
```ts
const impressumText = this.add.text(cx - 80, 800, t('legal.impressum'), { /* style */ });
impressumText.setInteractive(
    new Phaser.Geom.Rectangle(/* manually computed x,y,w,h */),
    Phaser.Geom.Rectangle.Contains
);
impressumText.on('pointerdown', () => { window.open('/impressum', '_self'); });
```

**Required sequencing (RESEARCH.md Pattern 4 / Pitfall 2):** land `gsd/fix-menu-taps` (`ab9cbe1` + `5fe9533`, worktree `../barren-wuffett-fix`) FIRST as its own commit — it introduces `paddedHitArea()` in both files. Then build the "← HUB" button using `paddedHitArea('← HUB', …)` and `window.open('/', '_self')`, and the credit line as a plain `this.add.text(...)` with no hit area, in a *second*, later commit. Verify the merged diff references `paddedHitArea` — its absence is the warning sign per Pitfall 2.

---

### `vite/config.prod.mjs` / `vite/config.dev.mjs` (config, build)

**Analog:** current `vite/config.prod.mjs` (same file, 37 lines, read this session)

**Current state — the exact gap this phase must close** (lines 25-34):
```js
plugins: [
    VitePWA({
        registerType: 'autoUpdate',
        manifest: false,
        // workbox globPatterns deferred to Phase 4 — Phase 1 uses manifest stub only
    })
]
```

**Required replacement** (RESEARCH.md Pattern 1 + Pattern 2, this session's primary finding):
```js
build: {
    rollupOptions: {
        input: {
            hub:       resolve(__dirname, '../index.html'),
            adventure: resolve(__dirname, '../adventure/index.html'),
        },
        output: { manualChunks: { phaser: ['phaser'] } },
    },
},
plugins: [
    VitePWA({
        registerType: 'autoUpdate',
        manifest: false,
        workbox: {
            globPatterns: ['**/*.{js,css,html,woff2,png,webmanifest}'],
            navigateFallback: undefined,   // overrides plugin's 'index.html' default — do not leave unset
        },
    })
]
```
Keep `base: './'` unchanged (line 5) — confirmed still correct, do not re-litigate.

---

### `public/datenschutz.html` (route, rewrite)

**Analog:** current `public/datenschutz.html` (same file; this session confirmed §2/§3 on-device storage sections can stay, §4 Supabase and §5 Brevo must be fully removed, §6 "no analytics" must become a real Cloudflare Web Analytics disclosure — see RESEARCH.md Pitfall 4). No code excerpt reproduced here since the file is legal copy, not code — the planner should diff against the final feature list (hosting, analytics, 3 storage keys: adventure save / hub progress / audio toggles), not the old text.

---

### `tests/og-tags.test.ts` (test, transform)

**Analog:** same file (current, 30 lines, read this session) — rewrite target, not a new pattern.

**Current assertion that must be removed/replaced** (lines 25-29):
```ts
it('og:image content is a root-relative or absolute path', () => {
    expect(html).toMatch(/content=["']\/og-image\.png/);   // asserts the BUGGY relative path
});
```
Replace with assertions against `https://barren-wuffett.pages.dev/og/hub.png` for `index.html` and a second test block reading `adventure/index.html` for its own absolute `og:image`.

## Shared Patterns

### IndexedDB store robustness (SaveService shape)
**Source:** `src/services/SaveService.ts` (full file)
**Apply to:** `src/shared/progressStore.ts` — identical try/catch-every-call, versioned, unconditional-`migrate()` shape with a separate `createStore('bw-hub', 'progress')`.

### Window probe naming convention
**Source:** `src/main.ts` lines 3-9
```ts
declare global { interface Window { __BW_GAME__?: unknown; } }
window.__BW_GAME__ = StartGame('game-container');
```
**Apply to:** `src/shared/testHooks.ts` → `window.__HUB__` (matches the existing `__X__` naming convention, per RESEARCH.md Code Examples).

### i18n `t(key)` string lookup
**Source:** `src/services/i18n.ts` (full file, 34 lines)
```ts
export function t(key: string): string {
    return (locale as Record<string, string>)[key] ?? key;
}
```
**Apply to:** every new string in `src/hub/*`, `src/shared/overlays.ts`, and the two new MainMenu/Settings strings — add keys to `public/locales/en/common.json`, never hardcode English (per `format-shell.md` Constraints — the spikes hardcoded English and that must not repeat here).

### Legal-link ≥44px hit area (post-fix)
**Source:** `MainMenu.ts`/`Settings.ts`, after `gsd/fix-menu-taps` merge — `paddedHitArea()` helper (not yet read in full this session; verify its signature when the branch lands before building the "← HUB" button on top of it).
**Apply to:** the new "← HUB" button in both scenes.

### CSP-safe self-hosting
**Source:** `public/_headers` (current, line 5) + `format-shell.md` Constraints
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```
**Apply to:** `@fontsource/pixelify-sans` must be copied into `public/fonts/` and `<link rel="preload">`'d exactly like `press-start-2p-latin.woff2` already is — no Google Fonts `<link>`, no CDN Phaser.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `public/og/hub.png`, `public/og/adventure.png` + their `card.html` source | utility (build-time asset render) | file-I/O | No existing Playwright-screenshot-of-static-HTML pipeline in this repo; `smoke.mjs` is the closest tool (same Playwright + `vite preview` harness) but renders the live app for testing, not a static card for asset output. Planner should follow `STACK.md`'s "Don't Hand-Roll" recommendation (Playwright screenshot of static `card.html`) directly — RESEARCH.md already specifies the approach in full. |
| `scripts/*` headless phone-viewport verification script | test/utility | event-driven | Closest analog is `smoke.mjs` (Playwright + `vite preview`, 412×915 viewport, console/pageerror/requestfailed capture) — strong match, extend rather than invent, listed above as "exact" but flagged here too since it's a new file, not an edit. |

## Metadata

**Analog search scope:** `src/`, `public/`, `vite/`, `tests/`, `.claude/skills/spike-findings-barren-wuffett/`, `.claude/skills/sketch-findings-barren-wuffett/`
**Files scanned:** `SaveService.ts`, `main.ts`, `i18n.ts`, `MainMenu.ts`, `Settings.ts`, `vite/config.prod.mjs`, `index.html`, `manifest.webmanifest`, `public/_headers`, `tests/og-tags.test.ts`, `format-shell.md`, `pixel-cast.md`, `hub-layout-cards.md`, `hubsprites.js`, `cast.js` (via skill reference), `gsd/fix-menu-taps` diff (via `git show`)
**Pattern extraction date:** 2026-10-16
**Tracked-source gate:** all analog paths above are git-tracked repo files or skill reference/source files under `.claude/skills/` (tracked in this repo) or the sibling tracked branch `gsd/fix-menu-taps` (read via `git show`, not a gitignored mirror). No `.gsd/capabilities/` mirror paths were used.
