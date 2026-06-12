---
phase: 01-foundation-legal-shell
reviewed: 2026-06-12T00:00:00Z
depth: standard
files_reviewed: 27
files_reviewed_list:
  - index.html
  - package.json
  - public/_headers
  - public/datenschutz.html
  - public/impressum.html
  - public/legal.css
  - public/locales/de/common.json
  - public/locales/en/common.json
  - public/manifest.webmanifest
  - public/style.css
  - src/game/main.ts
  - src/game/scenes/Boot.ts
  - src/game/scenes/MainMenu.ts
  - src/game/scenes/Preloader.ts
  - src/game/scenes/Settings.ts
  - src/input/InputBus.ts
  - src/main.ts
  - src/services/AudioService.ts
  - src/services/ContentRegistry.ts
  - src/services/i18n.ts
  - tests/audio-persistence.test.ts
  - tests/content-registry.test.ts
  - tests/i18n.test.ts
  - tests/parody-naming.test.ts
  - tsconfig.json
  - vite/config.dev.mjs
  - vite/config.prod.mjs
findings:
  critical: 4
  warning: 6
  info: 4
  total: 14
status: fixed
fixed_at: 2026-06-12T07:10:00Z
fixes:
  CR-01: {fixed: yes, commit: 3885c57}
  CR-02: {fixed: yes, commit: 48418ea}
  CR-03: {fixed: yes, commit: a7362d9}
  CR-04: {fixed: yes, commit: 593886c}
  WR-01: {fixed: yes, commit: 4478312}
  WR-02: {fixed: yes, commit: f12843f}
  WR-03: {fixed: yes, commit: 3885c57}
  WR-04: {fixed: yes, commit: 48418ea}
  WR-05: {fixed: yes, commit: 3885c57}
  WR-06: {fixed: yes, commit: 201d4de}
  IN-01: {fixed: yes, commit: 33a19ca}
  IN-02: {fixed: yes, commit: 053e0b1}
  IN-03: {fixed: yes, commit: 7a266db}
  IN-04: {fixed: yes, commit: a238d34}
---

# Phase 1: Code Review Report

**Reviewed:** 2026-06-12
**Depth:** standard
**Files Reviewed:** 27
**Status:** issues_found

---

## Summary

Phase 1 implements the foundation and legal shell: Phaser 4 scene scaffold (Boot, Preloader, MainMenu, Settings), audio persistence via `localStorage`, a thin i18n service, static legal pages (impressum, datenschutz), and security headers for Cloudflare Pages. The architecture is sound and the scope is modest, but there are four blockers that must be resolved before the URL can be shared publicly: a race condition that allows any canvas tap to bypass the legal-link hit areas in MainMenu, missing Content-Security-Policy, an unguarded `localStorage` call that throws in Private-Browsing / storage-restricted contexts, and a test isolation defect that makes the audio persistence test suite a false-positive factory. Six warnings address correctness degraders that are likely to surface in Phase 2 integration.

---

## Critical Issues

### CR-01: "Tap Anywhere" handler fires before legal-link pointerdown — legal navigation can be silently swallowed

**Status:** fixed — commit `3885c57`

**File:** `src/game/scenes/MainMenu.ts:98`

**Issue:** `this.input.once('pointerdown', ...)` registers a one-shot listener on the *scene-wide input manager* — it fires for *every* pointer-down event anywhere on the canvas, including on the IMPRESSUM and PRIVACY POLICY text objects. Because scene-input events propagate through input handlers in registration order, the `input.once` handler runs at the same tick as the text objects' `pointerdown` callbacks. The actual firing order of `once` vs. object-level `on` is undocumented and varies by Phaser internals; in practice the scene-level `once` fires *first*, which means tapping IMPRESSUM will (a) call `window.open('/impressum', '_self')` and (b) simultaneously call `this.sound.unlock()` then `this.scene.start('Settings')` — causing a scene transition in the same frame as the navigation, potentially cancelling the navigation on mobile browsers that block `window.open` outside a clean user gesture. Even on desktop it leaves the user in Settings after returning from the legal page instead of MainMenu.

**Fix:** Restrict the audio-unlock / scene-transition handler to a named zone (the TAP TO START text, or any region that excludes the legal footer). The cleanest approach is to give `tapText` an interactive zone and listen on that object instead of the global input manager:

```typescript
// Instead of:
this.input.once('pointerdown', () => { ... });

// Do:
tapText.setInteractive(
    new Phaser.Geom.Rectangle(
        -tapText.width / 2 - 20, -22,
        tapText.width + 40, 44
    ),
    Phaser.Geom.Rectangle.Contains
);
tapText.once('pointerdown', () => {
    this.sound.unlock();
    this.scene.start('Settings');
});
```

Alternatively, add a guard in the scene-level handler: check that the pointer is *not* over an interactive child before proceeding (Phaser exposes `this.input.hitTestPointer(pointer)` for this).

---

### CR-02: No Content-Security-Policy header — XSS and data-injection surface is fully open

**Status:** fixed — commit `48418ea`

**File:** `public/_headers:1`

**Issue:** `public/_headers` only sets `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy`. There is no `Content-Security-Policy` header. For Phase 1 the CSP could be very tight because the app is a static canvas game with no inline scripts, no external XHR, and no eval usage. Without a CSP, any injected script (e.g., via a future DOM-manipulation bug, a compromised CDN resource, or a Cloudflare-level injection) runs with full origin authority. This matters especially because the Datenschutz page notes future Supabase and Brevo integrations — adding those in Phase 3 without a pre-existing CSP forces a retroactive header audit under time pressure.

A tight Phase-1 CSP is cheap to write now and eliminates an entire threat class.

**Fix — add to `public/_headers` under the `/*` rule:**

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

Notes:
- `'unsafe-inline'` for `style-src` is required for the inline `<style>` block in `index.html` (lines 12-23). If that block is moved to `style.css` in Phase 2, drop `'unsafe-inline'`.
- `frame-ancestors 'none'` supersedes `X-Frame-Options: DENY` on modern browsers (keep both for broad compatibility).
- When Supabase is added in Phase 3, extend `connect-src` to include the Supabase project URL.

---

### CR-03: `localStorage` access in `AudioService` throws in Safari Private Browsing and storage-restricted contexts — crashes Boot scene

**Status:** fixed — commit `a7362d9`

**File:** `src/services/AudioService.ts:16-19`

**Issue:** `localStorage.getItem()` and `localStorage.setItem()` throw a `SecurityError` (DOM Exception 18) in Safari when the browser is in Private Browsing mode, when third-party storage is blocked by ITP, or when the user has disabled localStorage in Safari preferences. The `AudioService` module calls these directly with no try/catch. `Boot.ts` calls `AudioService.getMusicEnabled()` and `AudioService.getSfxEnabled()` synchronously in `create()`. A thrown `SecurityError` here will crash the Boot scene before the game ever renders, showing users a blank canvas with no error message. This affects a non-trivial percentage of mobile Safari users (all Private Browsing).

**Fix:** Wrap all `localStorage` access in `AudioService` with a try/catch and fall back to in-memory defaults:

```typescript
const KEYS = { music: 'bw_music_on', sfx: 'bw_sfx_on' } as const;

function safeGet(key: string): string | null {
    try { return localStorage.getItem(key); }
    catch { return null; }
}
function safeSet(key: string, value: string): void {
    try { localStorage.setItem(key, value); }
    catch { /* ignore — in-memory state still reflects the toggle */ }
}

export const AudioService = {
    getMusicEnabled: (): boolean => safeGet(KEYS.music) !== 'false',
    setMusicEnabled: (on: boolean): void => { safeSet(KEYS.music, String(on)); },
    getSfxEnabled:   (): boolean => safeGet(KEYS.sfx) !== 'false',
    setSfxEnabled:   (on: boolean): void => { safeSet(KEYS.sfx, String(on)); },
};
```

---

### CR-04: Audio persistence tests share module state across `describe` blocks — false-positive isolation

**Status:** fixed — commit `593886c`

**File:** `tests/audio-persistence.test.ts:41-127`

**Issue:** Each `beforeEach` calls `installLocalStorage()` which replaces `globalThis.localStorage`, but it does **not** reset the vitest module registry. Every `await import('../src/services/AudioService.js')` call inside a test is resolved from the module cache after the first successful import. This means:

1. `AudioService` is bound to whichever `globalThis.localStorage` was installed at first import time, not the fresh mock installed by the current `beforeEach`.
2. Tests in the second and third `describe` blocks that call `AudioService.setMusicEnabled(false)` are mutating the same in-memory representation; if the test runner happens to skip `beforeEach` isolation (e.g., due to a future `--isolate` flag change or test order change), the "default state" tests (first `describe`) can see mutations from prior `describe` blocks.
3. The "survives simulated reload" test (lines 82-100) asserts that the storage key is `'false'` after `setMusicEnabled(false)` — this is not a reload simulation at all; it reads from the same in-memory mock object within the same JS tick. It would pass even if `AudioService` never touched `localStorage`.

The root cause is that `AudioService` accesses `localStorage` via the global reference at *call time* (not import time), which means the `installLocalStorage()` swap actually does take effect for in-process reads/writes — but the test *assumes* module re-import while relying on the fact that it does NOT re-import. This is fragile; a future `--pool=forks` or `isolateModules: true` config change will break it.

**Fix:** Add `vi.resetModules()` in `beforeEach` and use a consistent import pattern:

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('AudioService — default state', () => {
    beforeEach(() => {
        vi.resetModules();
        installLocalStorage();
    });

    it('getMusicEnabled() returns true when nothing is stored', async () => {
        const { AudioService } = await import('../src/services/AudioService.js');
        expect(AudioService.getMusicEnabled()).toBe(true);
    });
    // ...
});
```

Additionally add an `afterEach(() => vi.resetModules())` to prevent cross-suite contamination.

---

## Warnings

### WR-01: Boot.ts applies music mute via `this.sound.mute` but Settings uses `this.sound.setMute()` — API inconsistency that may not persist across scene transitions

**Status:** fixed — commit `4478312`

**File:** `src/game/scenes/Boot.ts:15` and `src/game/scenes/Settings.ts:31`

**Issue:** `Boot.ts` sets `this.sound.mute = true` (direct property assignment) while `Settings.ts` calls `this.sound.setMute(!newState)`. In Phaser 4, `SoundManager.mute` is a property setter that invokes the same internal path as `setMute()`, so both are technically equivalent today. However, when `Settings.ts` scene is started and returns to `MainMenu`, the Sound Manager is shared globally; if Phaser 4 internally recreates or resets `mute` state on scene lifecycle hooks (documented as a known Phaser 3 pitfall), the Boot mute-setting is lost. Additionally, the mute state set in Boot is never re-read when re-entering Settings — `createToggle` reads `AudioService.getMusicEnabled()` for the *visual* initial state, and `this.sound.setMute(!newState)` for the *audio* initial state. If a user lands in Settings for the second time, the toggle visual will be correct (from localStorage) but the Phaser mute state depends on what happened in the previous scene, not on `localStorage`. These can diverge.

**Fix:** In Boot, use the same API as Settings for consistency and read-back safety:

```typescript
// Boot.ts create():
this.sound.setMute(!musicEnabled);  // instead of: this.sound.mute = true
```

Also add a sync step at the start of Settings.create() to ensure the Sound Manager state always matches localStorage on scene entry:

```typescript
// Settings.ts create(), before building UI:
this.sound.setMute(!AudioService.getMusicEnabled());
```

---

### WR-02: Preloader always transitions to MainMenu even on load error — error state is displayed but game advances

**Status:** fixed — commit `f12843f`

**File:** `src/game/scenes/Preloader.ts:53-64`

**Issue:** The `loaderror` handler (line 53) shows `errorText` and hides `loadingLabel`, but `create()` (line 62) unconditionally calls `this.scene.start('MainMenu')`. If a load error occurs, `create()` still fires after `preload()` completes (or fails), transitioning to MainMenu with a missing `logo` asset. MainMenu then calls `this.add.image(cx, 120, 'logo')` — if the texture is missing, Phaser renders a placeholder or throws depending on configuration. The error message shown in Preloader is never visible long enough to be read, as the scene transitions immediately.

**Fix:** Track error state and guard the transition:

```typescript
private hasLoadError = false;

preload(): void {
    // ...
    this.load.on('loaderror', () => {
        this.hasLoadError = true;
        loadingLabel.setVisible(false);
        errorText.setVisible(true);
    });
    // ...
}

create(): void {
    if (!this.hasLoadError) {
        this.scene.start('MainMenu');
    }
    // On error: stay in Preloader showing the error text; user can refresh
}
```

---

### WR-03: Legal-link hit zones in MainMenu use `impressumText.width` before the text object is rendered — width is 0 at construction time

**Status:** fixed — commit `3885c57`

**File:** `src/game/scenes/MainMenu.ts:62-70` and `src/game/scenes/MainMenu.ts:78-86`

**Issue:** `impressumText` and `datenschutzText` are created with `.setInteractive({ useHandCursor: true })` on lines 59 and 76, then immediately overridden with a custom `Rectangle` interactive zone on lines 62-70 and 78-86. The `Rectangle` is constructed using `-impressumText.width / 2` and `impressumText.width`. However, `this.add.text()` with a web font ('Press Start 2P') will have `width = 0` synchronously at `create()` time until the font loads — the font is loaded via CSS (Google Fonts) not as a Phaser-loaded bitmap font, so the WebFontLoader callback has not yet fired. The hit zone will therefore be `Rectangle(0, -22, 0, 44)` — a zero-width zone that is impossible to tap. The Settings scene handles this correctly with `Math.max(impressumText.width, 44)` but still has the same font-load-timing exposure.

**Fix (option A — safe minimum width):** Use `Math.max(impressumText.width, 80)` in MainMenu (matching the approach in Settings) so that even with width=0 at construction time, there is a minimum 80px tap zone:

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

**Fix (option B — correct approach):** Load the font as a Phaser BitmapFont in Preloader so it is guaranteed available before `create()` runs, then use `this.add.bitmapText()` throughout. This matches the UI-SPEC intent ("Press Start 2P loaded as a Phaser BitmapFont").

---

### WR-04: `_headers` file has no trailing newline — Cloudflare Pages may silently drop the last header

**Status:** fixed — commit `48418ea`

**File:** `public/_headers:4`

**Issue:** The raw bytes of `public/_headers` end with `strict-origin-when-cross-origin\r\n` — the file is 116 bytes and the final header is on line 4 with no blank line after. Cloudflare Pages' `_headers` parser documents that header rules must be terminated by a blank line before the next route rule, but more critically, some versions of the Cloudflare Pages builder have been observed to skip the last line of a `_headers` file when it lacks a trailing newline. In this file that last line is `Referrer-Policy: strict-origin-when-cross-origin`. If it is dropped silently, referrer-policy protection is absent in production with no local indication.

**Fix:** Add a blank trailing line to `public/_headers`:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

```
(blank line after the last header)

---

### WR-05: VirtualJoystick smoke-test import leaks a production dead-code bundle into every build

**Status:** fixed — commit `3885c57`

**File:** `src/game/scenes/MainMenu.ts:6-8`

**Issue:** `phaser4-rex-plugins/plugins/virtualjoystick.js` is imported in `MainMenu.ts` solely as a bundler path-resolution check. The comment says "Do NOT instantiate — Phase 2 wires the actual joystick." However, Vite/Rollup *will* include this module in the production bundle because it is a static import (not a dynamic `import()`). This adds the full VirtualJoystick plugin weight to the Phase 1 production bundle unnecessarily. More importantly, this also means the `_rexCheck` assignment (line 8) exists in production JavaScript — a dead code path that a minifier may or may not elide depending on whether it detects the side-effect.

**Fix:** Remove the import entirely from `MainMenu.ts`. The path-resolution smoke test should live in a dedicated test file (or a `config.dev.mjs` alias check), not in a production scene. If Phase 2 needs the plugin, import it at that time in the scene that actually instantiates it.

```typescript
// Remove these lines from MainMenu.ts:
// import VirtualJoystick from 'phaser4-rex-plugins/plugins/virtualjoystick.js';
// const _rexCheck: typeof VirtualJoystick = VirtualJoystick;
```

---

### WR-06: `datenschutz.html` back-link text is hardcoded English — i18n violation on a German legal page

**Status:** fixed — commit `201d4de`

**File:** `public/datenschutz.html:104`
**File:** `public/impressum.html:35`

**Issue:** Both legal pages have `← BACK TO GAME` as the back-link text (hardcoded English). The Datenschutz page is `<html lang="de">` and contains entirely German content. An English string on a German legal page is inconsistent and may read oddly to German users. The UI-SPEC lists `legal.backToGame` = `← BACK TO GAME` explicitly as an HTML-only key (not in i18n JSON, by design), and notes "used in HTML, not Phaser" — so this is intentional per spec.

However the spec says the copy is `← BACK TO GAME` but the legal pages are entirely in German. The Phase 1 constraint that German locale is empty (`{}`) is a locale-service concern, but these are static HTML pages where a German string could and should be hardcoded directly.

**Fix:** Change the back-link text on German-language legal pages to the German equivalent, matching the locale of the surrounding content:

```html
<!-- datenschutz.html line 104 — change to: -->
<a href="/" class="back-link">← ZURÜCK ZUM SPIEL</a>

<!-- impressum.html line 35 — change to: -->
<a href="/" class="back-link">← ZURÜCK ZUM SPIEL</a>
```

---

## Info

### IN-01: `public/locales/de/common.json` is a bare `{}` — parody-naming test passes trivially for the German locale

**Status:** fixed — commit `33a19ca`

**File:** `public/locales/de/common.json:1`
**File:** `tests/parody-naming.test.ts:32-43`

**Issue:** The German locale file contains `{}`. The parody-naming test for `de/common.json` iterates `Object.values({})` which is an empty array — both `for` loops never execute and the test passes with zero assertions. This is by design for Phase 1 per the UI-SPEC ("German locale file must be created as an empty object `{}` in Phase 1"), but the test gives false confidence that German locale is clean: once German strings are added in a future phase, the test only fires if someone remembers to run it. The test should at least assert that it ran at least one check.

**Fix:** Add a minimum-assertion guard to the German locale test:

```typescript
it('de/common.json contains no forbidden real names in its values', async () => {
    const mod = await import('../public/locales/de/common.json', { assert: { type: 'json' } });
    const locale = mod.default as Record<string, string>;
    const values = Object.values(locale);
    // Guard: when German strings are added, this test must actually check them
    // (Phase 1: values is [] so the loop is a no-op — accepted by design)
    for (const forbidden of FORBIDDEN) {
        for (const value of values) {
            expect(value.toLowerCase()).not.toContain(forbidden);
        }
    }
    // Uncomment when Phase 2 populates de/common.json:
    // expect(values.length).toBeGreaterThan(0);
});
```

---

### IN-02: `tsconfig.json` disables `noUnusedLocals` and `noUnusedParameters` — suppresses compiler enforcement of the i18n key contract

**Status:** fixed — commit `053e0b1`

**File:** `tsconfig.json:14-15`

**Issue:** `"noUnusedLocals": false` and `"noUnusedParameters": false` are explicitly set to off. This means the `_rexCheck` dead-code variable in `MainMenu.ts` (see WR-05) and any future unused imports/parameters will pass `tsc --noEmit` silently. Given the phase constraint that all player-facing strings must go through `t(key)`, enabling `noUnusedLocals` would catch cases where a developer imports `t` and accidentally uses a literal string instead.

**Fix:** Enable both flags. The existing codebase compiles cleanly with them enabled (the only violation is `_rexCheck` in MainMenu.ts, which should be removed per WR-05):

```json
"noUnusedLocals": true,
"noUnusedParameters": true
```

---

### IN-03: `manifest.webmanifest` and `vite/config.prod.mjs` duplicate the PWA manifest — risk of divergence

**Status:** fixed — commit `7a266db`

**File:** `public/manifest.webmanifest`
**File:** `vite/config.prod.mjs:28-46`

**Issue:** The PWA manifest is defined in two places: `public/manifest.webmanifest` (the static file) and inside the `VitePWA()` plugin options in `config.prod.mjs`. `vite-plugin-pwa` with an inline `manifest` option *generates* a manifest into the build output, which will shadow or conflict with the static `public/manifest.webmanifest`. The static file includes `orientation: "portrait"` and `start_url: "./"` that the inline config omits. The generated manifest wins at runtime, meaning `orientation: "portrait"` (required for the portrait-only layout contract) is absent from the produced PWA manifest.

**Fix:** Remove the inline `manifest` block from `config.prod.mjs` and rely solely on `public/manifest.webmanifest`. Configure `vite-plugin-pwa` to not override the manifest:

```javascript
VitePWA({
    registerType: 'autoUpdate',
    // Remove the manifest: {...} block — use public/manifest.webmanifest as the source of truth
    manifest: false,  // or omit; vite-plugin-pwa will use the static file
})
```

Alternatively, move the authoritative manifest into the plugin config and delete `public/manifest.webmanifest`, but the static file approach is simpler and avoids drift.

---

### IN-04: `Settings.ts:88` has a hardcoded `'← BACK'` string — i18n violation

**Status:** fixed — commit `a238d34`

**File:** `src/game/scenes/Settings.ts:88`

**Issue:** The back-button text `'← BACK'` is hardcoded in `Settings.ts`. The project constraint states "all player-facing strings via i18n t() (no hardcoded English in scenes)". The UI-SPEC Copywriting Contract does not list a key for the back button label in Settings — it only mentions `legal.backToGame` for HTML pages. A key is needed for this string.

**Fix:** Add a key to `public/locales/en/common.json`:

```json
"nav.back": "← BACK"
```

Then use it in `Settings.ts:88`:

```typescript
const backText = this.add.text(cx, 780, t('nav.back'), { ... });
```

---

_Reviewed: 2026-06-12_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
