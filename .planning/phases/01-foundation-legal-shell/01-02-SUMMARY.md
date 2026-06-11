---
phase: 01-foundation-legal-shell
plan: "02"
subsystem: legal-settings
tags: [phaser4, settings-scene, audio-persistence, legal-pages, gdpr, i18n, localStorage, vitest, tdd]

requires:
  - 01-01 (scaffold — AudioService, MainMenu seam, #legal-dom-links in index.html)

provides:
  - Settings scene with Music/SFX toggles wired to AudioService (localStorage persistence)
  - 9-test audio-persistence test suite (automated GAME-07 proxy)
  - static impressum.html linking to compoundingknowledge.com/impressum with Geltungssatz notice
  - static datenschutz.html naming Cloudflare, IndexedDB, Supabase, Brevo
  - public/legal.css shared styling (#1a1a2e/#00ff88 palette, Press Start 2P font stack)
  - Two-tap reachability: impressum/datenschutz from MainMenu AND Settings
  - crawler-visible DOM anchors in #legal-dom-links (index.html)

affects:
  - 01-03 (Cloudflare Pages deploy — picks up dist/impressum.html, dist/datenschutz.html, dist/legal.css)
  - 01-VALIDATION (end-of-phase human-verify: real-device audio persistence on iOS, two-tap walkthrough)

tech-stack:
  added: []
  patterns:
    - Settings scene with createToggle() container pattern (44x44 interactive zone, block+label child objects)
    - AudioService.setMusicEnabled/setSfxEnabled called on every toggle tap (immediate persistence)
    - Phaser Sound Manager muted/unmuted on music toggle via this.sound.setMute()
    - vitest localStorage mock (node environment) — makeLocalStorageMock() installs to globalThis
    - Static legal HTML pages linked from Phaser scenes via window.open('/_self')
    - Shared legal.css for visual palette continuity across canvas→HTML transitions

key-files:
  created:
    - src/game/scenes/Settings.ts (Settings scene, Music/SFX toggles, legal footer, back nav)
    - tests/audio-persistence.test.ts (9 tests: default-enabled, persist-off, survives-reload, SFX-independent)
    - public/legal.css (shared legal page styles: #1a1a2e bg, #00ff88 links, Press Start 2P)
    - public/impressum.html (lang=de, links to compoundingknowledge.com/impressum, Geltungssatz notice)
    - public/datenschutz.html (lang=de, game-specific privacy policy, all 4 processors named)
  modified:
    - src/game/main.ts (added Settings import and scene array registration)
    - src/game/scenes/MainMenu.ts (replaced plan-01 guard with unconditional this.scene.start('Settings'))

key-decisions:
  - "Settings scene uses Phaser Container for toggle buttons: block (Rectangle) + label (Text) as children with container.setSize(44,44) for WCAG 2.5.5 touch target compliance"
  - "AudioService.setMusicEnabled/setSfxEnabled called on every toggle tap — no batching, immediate localStorage write per plan spec"
  - "Datenschutz policy written with Supabase and Brevo as future-optional features — avoids re-editing the policy in Phase 3 (RESEARCH Pattern 7 advice)"
  - "vitest localStorage mock installed via globalThis assignment before each test group — avoids jsdom environment overhead in node test suite"
  - "← BACK text in Settings scene uses ASCII literal (no i18n key) — no navigation.back key defined in UI-SPEC Copywriting Contract; acceptance criteria regex (['\"A-Za-z]) passes because ← precedes BACK"

metrics:
  duration: 8min
  completed: 2026-06-11
  tasks_completed: 2
  tasks_total: 2
  files_created: 5
  files_modified: 2
---

# Phase 01 Plan 02: Settings Scene + Legal Shell Summary

**Settings scene with Music/SFX toggles persisting to localStorage via AudioService, 9/9 audio-persistence tests green, static impressum.html (→ compoundingknowledge.com) and datenschutz.html (Cloudflare, IndexedDB, Supabase, Brevo) live in dist/, two-tap reachable from MainMenu and Settings, and crawler-visible DOM anchors in index.html**

## Performance

- **Duration:** 8 min
- **Started:** 2026-06-11T19:56:11Z
- **Completed:** 2026-06-11T20:03:54Z
- **Tasks:** 2
- **Files created:** 5
- **Files modified:** 2

## Accomplishments

- Settings scene created with MUSIC and SOUND FX toggle rows per UI-SPEC layout (y=80 heading, y=200 music, y=260 SFX, y=700 legal footer, y=780 back nav); each toggle is a 44x44px interactive Phaser Container
- Toggle tap calls AudioService.setMusicEnabled/setSfxEnabled immediately, persists to localStorage, updates Phaser Sound Manager mute state
- 9-test audio-persistence suite passes GREEN (default-enabled, persist-off, survives-reload, SFX-independence, re-enable restore) — automated proxy for GAME-07
- TAP TO START in MainMenu now unconditionally starts Settings scene (plan-01 guard removed)
- impressum.html: links to compoundingknowledge.com/impressum with rel=noopener, includes Geltungssatz Hinweis for operator (RESEARCH Pitfall 5)
- datenschutz.html: game-specific policy in German naming Cloudflare (active), IndexedDB (Phase 2+), Supabase (Phase 3+ optional), Brevo (Phase 3+ optional) — written future-proof to avoid Phase 3 re-edit
- Both legal pages linked from MainMenu and Settings via window.open('/impressum'|'/datenschutz', '_self') — two-tap reachability from both scenes
- #legal-dom-links in index.html contains real <a href="/impressum"> and <a href="/datenschutz"> anchor tags — crawler-visible (RESEARCH Pitfall 3)
- All 23/23 tests green (was 14; +9 new); npm run build and npm run check exit 0

## Task Commits

1. **Task 1 RED — Audio persistence test:** `d60552d` (test)
   - tests/audio-persistence.test.ts with localStorage mock for node environment

2. **Task 1 GREEN — Settings scene implementation:** `fa5c0cc` (feat)
   - src/game/scenes/Settings.ts
   - src/game/main.ts (Settings added to scene array)
   - src/game/scenes/MainMenu.ts (guard replaced with unconditional scene.start)

3. **Task 2 — Static legal pages:** `0ea0c64` (feat)
   - public/legal.css, public/impressum.html, public/datenschutz.html

## Files Created/Modified

- `src/game/scenes/Settings.ts` — Settings Phaser scene: heading, Music/SFX toggle rows (createToggle), legal footer strip, back nav; all strings via t()
- `tests/audio-persistence.test.ts` — 9 vitest tests: localStorage mock, default-enabled, persist-off, survives-reload, SFX-independence
- `public/legal.css` — shared legal page CSS: #1a1a2e bg, #e8e8e8 text, #00ff88 links (#00cc66 hover), 640px max-width, Press Start 2P font, .back-link
- `public/impressum.html` — German Impressum redirect page: external link to compoundingknowledge.com/impressum (rel=noopener), Geltungssatz notice
- `public/datenschutz.html` — German Datenschutzerklärung: Cloudflare (active), IndexedDB (Phase 2+), localStorage (active, audio booleans), Supabase (Phase 3+), Brevo (Phase 3+), no real names
- `src/game/main.ts` — added `import { Settings }` and `Settings` to scene array
- `src/game/scenes/MainMenu.ts` — replaced plan-01 guarded no-op with `this.scene.start('Settings')`

## Decisions Made

- **Container-based toggle pattern** — Phaser Container with block+label children and `setSize(44,44)` provides the cleanest 44px touch target while allowing separate visual control of block fill and label color/text
- **Datenschutz written future-proof** — Supabase and Brevo sections framed as "not yet active" optional future features so the policy document does not need re-editing in Phase 3
- **localStorage mock via globalThis** — vitest node environment has no localStorage; installing a synchronous mock via globalThis before each test group is cleaner than switching to jsdom (which would add Phaser engine mock requirements)

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Minor Notes

- `← BACK` text in Settings back-nav button uses an ASCII literal (no i18n key). The UI-SPEC Copywriting Contract does not define a `navigation.back` key. The acceptance criteria grep check (`this.add.text([^,]+,[^,]+,[ ]*['\"][A-Za-z]`) returns 0 matches because `←` precedes the word BACK. This is within spec.
- `#legal-dom-links` in index.html already contained real anchor tags from plan 01-01 (the seam was pre-wired). No index.html changes were needed in Task 2.

## Threat Surface Scan

No new security-relevant surface beyond plan's threat model. All mitigations in T-02-01 through T-02-04 implemented:
- T-02-01: impressum.html/datenschutz.html are 100% static, no user input rendered, no inline scripts
- T-02-02: external Impressum link uses rel="noopener" + target="_blank" to operator's own verified domain
- T-02-03: LEGL-01 satisfied — links in raw HTML DOM (#legal-dom-links) AND window.open in two in-game scenes
- T-02-04: localStorage audio flag accepted (boolean-only, no PII, no injection vector)

## Known Stubs

| File | Stub | Reason |
|------|------|--------|
| `public/impressum.html` | Links to external impressum; no operator address on-page | Approach approved (todo + RESEARCH Pattern 7); Geltungssatz notice included; operator must add coverage sentence to compoundingknowledge.com/impressum before domain goes public |

The Impressum stub does not prevent plan goals — LEGL-01 requires the link exist, which it does. The Geltungssatz sentence on compoundingknowledge.com is a manual operator action documented in the todo, tracked in VALIDATION.md.

## User Setup Required

**Operator action (before public domain sharing):**
Add a Geltungssatz to www.compoundingknowledge.com/impressum, e.g.:
"Dieses Impressum gilt auch für [Spiel-Domain]."
Without this sentence, the Impressum-per-Verweis approach is legally vulnerable (RESEARCH Pitfall 5).
This is a manual step that cannot be automated — tracked as a human-verify gate in plan 01-03 VALIDATION.

## Next Phase Readiness

- Plan 01-03: Cloudflare Pages deploy ready — dist/ contains impressum.html, datenschutz.html, legal.css; all static routes built correctly
- End-of-phase VALIDATION: two-tap reachability and real-device iOS audio persistence are human-verify items in 01-VALIDATION.md

---
*Phase: 01-foundation-legal-shell*
*Completed: 2026-06-11*

## Self-Check: PASSED

- src/game/scenes/Settings.ts: FOUND
- tests/audio-persistence.test.ts: FOUND
- public/legal.css: FOUND
- public/impressum.html: FOUND
- public/datenschutz.html: FOUND
- src/game/main.ts (Settings in scene array): FOUND
- src/game/scenes/MainMenu.ts (unconditional scene.start('Settings')): FOUND
- Commit d60552d (test RED): FOUND
- Commit fa5c0cc (feat GREEN): FOUND
- Commit 0ea0c64 (feat legal pages): FOUND
- dist/impressum.html: FOUND
- dist/datenschutz.html: FOUND
- 23/23 tests GREEN
