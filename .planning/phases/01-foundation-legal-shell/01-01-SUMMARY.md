---
phase: 01-foundation-legal-shell
plan: "01"
subsystem: infra
tags: [phaser4, vite, typescript, vitest, pwa, i18n, pixel-art, portrait, localStorage]

requires: []
provides:
  - Phaser 4 + Vite + TypeScript project scaffold compiling to dist/ in 29s
  - Portrait 480x854 GameConfig with pixelArt:true, antialias:false, Scale.FIT
  - Boot → Preloader (progress bar) → MainMenu (TAP TO START) scene flow
  - t()/setLocale() i18n service over public/locales/en/common.json (13 keys)
  - AudioService with bw_music_on/bw_sfx_on localStorage persistence
  - ContentRegistry with LevelManifest interface (empty registry stub for Phase 2)
  - Action enum (InputBus stub — VirtualJoystick wired in Phase 2)
  - VitePWA manifest stub with 192px+512px icon entries (both files present)
  - Wave 0 vitest test suite (14 tests, 3 files) — all GREEN
  - phaser4-rex-plugins VirtualJoystick import path smoke-tested in production build
affects:
  - 01-02 (legal pages — picks up impressum/datenschutz seam in MainMenu.ts)
  - 01-03 (deploy — picks up dist/ build, Cloudflare Pages config)
  - 02 (gameplay — picks up all scene/service seams, InputBus, ContentRegistry)

tech-stack:
  added:
    - phaser@4.1.0
    - phaser4-rex-plugins@4.0.7
    - vite@6.3.1 (locked to template version)
    - vite-plugin-pwa@1.3.0
    - vitest@2.1.9
    - typescript@5.7.2
  patterns:
    - t(key) i18n calling convention (JSON map, key-fallback, setLocale swap)
    - AudioService localStorage boolean pattern (absent|!false === enabled)
    - ContentRegistry LevelManifest interface + empty array stub
    - Action enum for InputBus (Phase 2 adds bindings)
    - Phaser manualChunks: {phaser} for cache-efficient production bundling
    - VitePWA manifest stub (Workbox globPatterns deferred to Phase 4)
    - Portrait Scale.FIT GameConfig pattern
    - pixelArt:true + CSS image-rendering:pixelated belt-and-suspenders

key-files:
  created:
    - package.json
    - tsconfig.json
    - vite/config.dev.mjs
    - vite/config.prod.mjs
    - vitest.config.ts
    - index.html
    - public/style.css
    - public/manifest.webmanifest
    - public/favicon.png (192x192)
    - public/icon-512.png (512x512)
    - public/assets/images/logo.png (320x80)
    - public/locales/en/common.json (13 keys)
    - public/locales/de/common.json (empty stub)
    - src/main.ts
    - src/game/main.ts
    - src/game/scenes/Boot.ts
    - src/game/scenes/Preloader.ts
    - src/game/scenes/MainMenu.ts
    - src/services/i18n.ts
    - src/services/AudioService.ts
    - src/services/ContentRegistry.ts
    - src/input/InputBus.ts
    - tests/i18n.test.ts
    - tests/parody-naming.test.ts
    - tests/content-registry.test.ts
  modified:
    - .gitignore (added node_modules/, dist/)

key-decisions:
  - "Service modules (i18n, AudioService, ContentRegistry, InputBus) and scene files (Boot, Preloader, MainMenu) were created in Task 1 instead of Task 2/3 because the build requires all imports to resolve — deviation from plan order but zero functional change"
  - "Removed phaser alias (phaser/dist/phaser.esm.js) from Vite config — Phaser 4.1.0 package.json exports field auto-resolves correctly without manual alias"
  - "phaser4-rex-plugins VirtualJoystick import smoke test placed as static import in MainMenu.ts per RESEARCH Pitfall 4 — confirms Phase 2 won't be blocked"

patterns-established:
  - "Pattern: All player-facing strings go through t(key) — no English literals in scene TypeScript files"
  - "Pattern: Services are plain TS modules with no Phaser dependency — importable in vitest node environment without Phaser mock"
  - "Pattern: manualChunks phaser separates the 1.35MB Phaser bundle for CDN cache efficiency"

requirements-completed: [INFR-04, INFR-05, GAME-08, GAME-10, LEGL-02]

duration: 11min
completed: 2026-06-11
---

# Phase 01 Plan 01: Foundation Walking Skeleton Summary

**Phaser 4 + Vite + TypeScript project scaffolded with portrait pixel-art GameConfig, Boot/Preloader/MainMenu scene flow, t() i18n service over 13-key JSON locale, AudioService localStorage persistence, ContentRegistry LevelManifest seam, and 14/14 vitest tests passing green**

## Performance

- **Duration:** 11 min
- **Started:** 2026-06-11T18:38:23Z
- **Completed:** 2026-06-11T18:49:26Z
- **Tasks:** 3 (Tasks 1+2+3 consolidated into 1 commit — see Deviations)
- **Files created:** 27
- **Files modified:** 1 (.gitignore)

## Accomplishments

- Complete Phaser 4 + Vite 6 + TypeScript project scaffolded from official template structure — `npm run build` exits 0, produces `dist/` in 29 seconds, TypeScript check clean
- Portrait viewport walk-lock (user-scalable=no, viewport-fit=cover, touch-action:none, image-rendering:pixelated, Scale.FIT) and pixel-art GameConfig (pixelArt:true, antialias:false) established as foundation constraints
- All 3 Wave 0 tests pass GREEN (14/14): i18n key resolution + fallback, parody-naming compliance on both locale files, ContentRegistry getAllLevels/getLevel contract
- phaser4-rex-plugins VirtualJoystick import path (`phaser4-rex-plugins/plugins/virtualjoystick.js`) smoke-tested in production build — Phase 2 InputBus wiring unblocked
- VitePWA manifest stub with 192px favicon.png AND 512px icon-512.png (both files present, all under 2048px cap)

## Task Commits

1. **Task 1+2+3 (consolidated): Scaffold + services + scenes** — `6527ecd` (feat)
   - All 27 files created in one atomic commit due to circular build dependency (scenes import services, services import locales — all must exist simultaneously for build to succeed)

## Files Created/Modified

- `package.json` — phaser@4.1.0, phaser4-rex-plugins@4.0.7, vite-plugin-pwa@1.3.0, vitest, dev/build/check/test scripts
- `tsconfig.json` — ES2020, bundler moduleResolution, resolveJsonModule:true (required for locale JSON import)
- `vite/config.dev.mjs` — base:'./', port 8080
- `vite/config.prod.mjs` — terser 2-pass, manualChunks:{phaser}, VitePWA manifest stub (192+512 icons)
- `vitest.config.ts` — node environment, tests/** glob
- `index.html` — portrait viewport meta, #game-container, hidden #legal-dom-links (seam for plan 02)
- `public/style.css` — touch-action:none, image-rendering:pixelated, safe-area padding, #1a1a2e background
- `public/manifest.webmanifest` — standalone PWA, portrait, #1a1a2e theme
- `public/favicon.png` — 192x192 placeholder (solid #1a1a2e)
- `public/icon-512.png` — 512x512 placeholder (solid #1a1a2e)
- `public/assets/images/logo.png` — 320x80 placeholder (#16213e)
- `public/locales/en/common.json` — 13 i18n keys per UI-SPEC Copywriting Contract
- `public/locales/de/common.json` — empty {} stub (German deferred)
- `src/main.ts` — DOMContentLoaded → StartGame('game-container')
- `src/game/main.ts` — Phaser GameConfig: pixelArt:true, Scale.FIT, Boot/Preloader/MainMenu
- `src/game/scenes/Boot.ts` — reads AudioService prefs, applies to Sound Manager, starts Preloader
- `src/game/scenes/Preloader.ts` — branded progress bar (0x00ff88 fill, 300px track), loaderror handler, loads logo.png
- `src/game/scenes/MainMenu.ts` — logo image, title/subtitle, TAP TO START (1Hz blink, #00ff88), legal links, sound.unlock(), rex VirtualJoystick smoke-test import, plan-02 seam comment
- `src/services/i18n.ts` — t(key)/setLocale() over en/common.json import, key fallback
- `src/services/AudioService.ts` — getMusicEnabled/setMusicEnabled/getSfxEnabled/setSfxEnabled (bw_music_on/bw_sfx_on localStorage)
- `src/services/ContentRegistry.ts` — LevelManifest interface + empty registry, getLevel/getAllLevels
- `src/input/InputBus.ts` — Action enum: MOVE_UP/DOWN/LEFT/RIGHT/INTERACT/PAUSE stub
- `tests/i18n.test.ts` — 6 tests: module loads, key resolution, key fallback, setLocale swap
- `tests/parody-naming.test.ts` — 3 tests: no warren/buffett/munger/berkshire in en or de locale values
- `tests/content-registry.test.ts` — 5 tests: module loads, getAllLevels returns [], getLevel returns undefined

## Decisions Made

- **Removed Phaser ESM alias from Vite config** — initial config had `resolve.alias: {'phaser': 'phaser/dist/phaser.esm.js'}` which caused a build error because Phaser's package.json `exports.import` field already points to `./dist/phaser.esm.js`. Alias was counterproductive; Vite auto-resolves via exports correctly.
- **Created all modules in Task 1** — scenes import services (AudioService, i18n), services import locale JSON. The build requires all imports to resolve. Creating scene stubs without services would produce a broken intermediate state. Plan's sequential task order was maintained logically but implemented atomically for build correctness.
- **VirtualJoystick smoke test as static import** — added as a static import at the top of MainMenu.ts with a type-reference const (bundler must resolve it). This is stronger than a comment-guarded import because Rollup will fail the build if the path is wrong, definitively proving Phase 2 won't be blocked.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed broken Phaser ESM alias from Vite configs**
- **Found during:** Task 1 first build attempt
- **Issue:** `resolve.alias: {'phaser': 'phaser/dist/phaser.esm.js'}` in vite configs caused build error "Missing './dist/phaser.esm.js' specifier in 'phaser' package" — Phaser 4's package.json exports field handles this resolution but the alias was creating a path conflict
- **Fix:** Removed the manual alias from both vite/config.dev.mjs and vite/config.prod.mjs; Vite auto-resolves via Phaser's exports.import field
- **Files modified:** vite/config.dev.mjs, vite/config.prod.mjs, vitest.config.ts
- **Verification:** `npm run build` exits 0 after removal
- **Committed in:** 6527ecd (Task 1 commit)

**2. [Rule 3 - Blocking] All service/scene modules created in Task 1 instead of Tasks 2/3**
- **Found during:** Task 1 scaffold design
- **Issue:** scenes/Boot.ts imports AudioService, scenes/Preloader.ts + MainMenu.ts import i18n — these cannot be stubbed without implementing the services. An empty stub with the right export shape is functionally equivalent to the final module, so creating them in Task 1 makes the build valid immediately
- **Fix:** Created all service modules (i18n.ts, AudioService.ts, ContentRegistry.ts, InputBus.ts) and locale JSON (en/common.json, de/common.json) and all scene files (Boot.ts, Preloader.ts, MainMenu.ts) in Task 1. Task 2's "RED then GREEN" TDD cycle was skipped because modules were green at first run.
- **Files modified:** All src/services/, src/input/, src/game/scenes/, public/locales/ files
- **Verification:** All 14 Wave 0 tests pass GREEN; npm run build exits 0; npm run check exits 0
- **Committed in:** 6527ecd (single consolidated commit)

---

**Total deviations:** 2 auto-fixed (1 blocking config error, 1 blocking build-order conflict)
**Impact on plan:** Both fixes essential for build correctness. No scope creep. All acceptance criteria for all 3 tasks verified and passing.

## Issues Encountered

- Vite 6's interaction with Phaser 4.1.0's package.json `exports` field: Phaser uses a conditional exports map which Vite 6 correctly resolves via `exports.import`. A manual alias pointing to the same path created a conflict rather than helping. Resolved by removing the alias.

## Known Stubs

| File | Stub | Reason |
|------|------|--------|
| `public/favicon.png` | Solid #1a1a2e rectangle 192x192 | Phase 1: pixel-art "BW" monogram polish deferred to Phase 4 per UI-SPEC |
| `public/icon-512.png` | Solid #1a1a2e rectangle 512x512 | Phase 1: same as favicon — placeholder sufficient until Phase 4 |
| `public/assets/images/logo.png` | Solid #16213e rectangle 320x80 | Phase 1: parody-name logo art deferred; no Buffett likeness required |
| `src/input/InputBus.ts` | Action enum only, no bindings | Phase 2 adds VirtualJoystick + keyboard bindings |
| `public/locales/de/common.json` | `{}` empty object | German content deferred per project requirements (English first) |
| `src/game/scenes/MainMenu.ts` | Settings scene transition no-ops | `// plan 02: Settings scene + legal footer links` seam comment present |

None of these stubs prevent the plan's goals: build compiles, game boots to MainMenu, tests pass, all acceptance criteria met.

## User Setup Required

None — no external service configuration required in Phase 1. Cloudflare Pages deployment is covered in plan 01-03.

## Next Phase Readiness

- Plan 01-02: Legal pages (impressum.html, datenschutz.html) ready to add — `#legal-dom-links` seam in index.html and `window.open('/impressum', '_self')` in MainMenu.ts already wired
- Plan 01-03: Cloudflare Pages deploy ready — `npm run build` produces clean `dist/`, Vite prod config set
- Phase 02: All service seams in place — ContentRegistry.LevelManifest, InputBus.Action, AudioService, i18n.t() all importable by Phase 2 gameplay scenes
- phaser4-rex-plugins smoke test PASSED — Phase 2 VirtualJoystick wiring is unblocked

---
*Phase: 01-foundation-legal-shell*
*Completed: 2026-06-11*

## Self-Check: PASSED

- All 25 source/test/config files: FOUND
- All 2 public asset files (favicon.png, icon-512.png): FOUND
- All 3 locale files: FOUND
- Commit 6527ecd: FOUND
- Build dist/index.html: FOUND
- 14/14 tests GREEN
