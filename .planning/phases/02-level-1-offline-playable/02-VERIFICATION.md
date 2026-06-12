---
phase: 02-level-1-offline-playable
verified: 2026-06-12T09:20:00Z
status: passed_with_gaps
score: 8/8 requirements code-verified; device UAT outstanding
gaps: []
human_verification:
  - test: "Virtual joystick feel and latency on real iPhone"
    expected: "Joystick responds <50ms perceived; not cut off by home indicator; player moves in all 4 directions"
    why_human: "Touch hardware and Phaser WebGL game loop required; cannot unit-test"
  - test: "Keyboard WASD and arrow keys move player (desktop)"
    expected: "Player moves in all 4 directions at ~80px/s; wall collision works"
    why_human: "Phaser WebGL scene requires a browser context"
  - test: "NPC dialogue triggers + typewriter + advance on tap"
    expected: "Walk to NPC, INTERACT; dialogue box types out at readable speed; tap advances then closes"
    why_human: "Phaser scene + pointer interaction requires real browser"
  - test: "Pause / resume including OS interruption; Settings reachable from pause menu"
    expected: "Escape/pause button pauses; SETTINGS opens Phase 1 Settings; RESUME resumes; switch apps + return resumes with audio intact"
    why_human: "Device lifecycle and Phaser scene management require real browser / phone"
  - test: "Patience mechanic rewards waiting (dog patrol)"
    expected: "Rushing the long way yields a lower coin reward; waiting for the 1.5s dog-patrol gap and taking the short route yields +5 PATIENCE BONUS and a higher coin total"
    why_human: "Gameplay timing judgment requires a real play-through"
  - test: "Save survives browser refresh (SAVE-01)"
    expected: "Complete one NPC interaction; refresh; game resumes at saved position with coins"
    why_human: "Real IndexedDB + page reload required"
  - test: "Mini-game completable + clean handoff (no phantom input)"
    expected: "Trigger zone launches PaperThrowScene; complete 5 houses / 60s; overworld resumes with coins updated; no phantom input bleeds into sleeping overworld"
    why_human: "Phaser scene handoff and timing require real browser"
  - test: "Boss completable; patience rewarded over rushing; miss resets with no permanent fail"
    expected: "DECLINE through Greed fills patience; BUY LOW! in Panic wins; missing the timer resets to Greed with no permanent fail; rushing cannot win"
    why_human: "Gameplay judgment requires a real play-through"
  - test: "Boss-defeat save persists across refresh"
    expected: "After defeating boss, refresh — boss_01_defeated flag persists, player does not refight from scratch"
    why_human: "Real IndexedDB + page reload required"
  - test: "One-tap share card on iOS (VIRL-01)"
    expected: "Defeat boss, tap SHARE WISDOM once; OS share sheet opens with a 1200x630 PNG; image is not black; quote + URL visible; no score shown"
    why_human: "Web Share API requires real user gesture + iOS share sheet"
  - test: "Share download fallback on desktop"
    expected: "Desktop Chrome: SHARE WISDOM offers barren-wuffett-victory.png download; button shows SAVED!"
    why_human: "Browser download behavior requires a real browser"
  - test: "Rich URL preview renders on messaging apps (VIRL-02)"
    expected: "Paste game URL in WhatsApp/Telegram or a link-preview debugger; og:image + og:title + og:description appear as a rich preview"
    why_human: "External platform crawlers required"
  - test: "Audio works on first tap (Phase 1 regression)"
    expected: "Music starts on first TAP TO START tap; still works after MainMenu now goes to OverworldScene"
    why_human: "Real iPhone audio and iOS AudioContext unlock required"
  - test: "Full offline play end-to-end (SAVE-02)"
    expected: "Airplane mode: load once, refresh, play Level 1 move → dialogue → mini-game → boss → share-fallback → save; no network requests beyond same-origin assets"
    why_human: "Network condition simulation and end-to-end flow require a real device"
open_items:
  - "Open legal gate from Phase 1: Geltungssatz deferred by user on 2026-06-12; public URL sharing blocked until resolved — unrelated to Phase 2 mechanics"
---

# Phase 2: Level 1 — Offline Playable Verification Report

**Phase Goal:** Level 1 is fully playable start-to-finish on a real iPhone with no account, no backend, and no internet connection — local save persists across refresh

**Verified:** 2026-06-12T09:20:00Z
**Status:** PASSED WITH GAPS (code-complete; device UAT outstanding per --auto chain auto-approval)
**Re-verification:** No — initial verification

---

## Build and Test Suite

| Check | Result |
|-------|--------|
| `npm run check` (TypeScript) | EXIT 0 — clean |
| `npm run build` | EXIT 0 — Vite + PWA build in 33.76s, 9 precache entries |
| `npx vitest run` | 61/61 PASSED across 9 test files |

All 61 tests pass. Test files include all 5 Wave 0 files created in Phase 2 plus 4 Phase 1 regression tests (audio-persistence, content-registry, i18n, parody-naming).

---

## Observable Truths (Goal-Backward)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Player can move through Level 1 overworld with virtual joystick on touch and arrow/WASD on desktop (GAME-01) | CODE VERIFIED | `src/input/InputBus.ts` update() ORs joystick+cursors; `OverworldScene.ts` calls `InputBus.update(joystick, mergedCursors)` each tick; 10 input-bus tests pass |
| 2 | Player can talk to NPCs via data-driven dialogue; DialogueBox typewriter; NPC interaction (GAME-05) | CODE VERIFIED | `src/data/dialogue/en/level-01.json` has all 8 required keys; `UIScene` loads dialogue via `loadDialogue()` and shows via `DialogueBox`; 5 dialogue tests pass |
| 3 | At least one mechanic rewards patience — dog patrol bonus + boss DECLINE→patience→BUY LOW (GAME-06) | CODE VERIFIED | `OverworldScene.awardPatienceBonus()` emits PATIENCE_BONUS +5 when dogGapActive; BossScene requires 3 DECLINEs to fill patience meter before panic phase; BUY LOW is the only win path; rushing has no win condition |
| 4 | Player can pause/resume anytime; Settings reachable from pause menu (GAME-09) | CODE VERIFIED | `UIScene` state machine handles PAUSE_REQUESTED → pauses OverworldScene; RESUME_REQUESTED resumes; Settings launched via `this.scene.launch('Settings')` from pause overlay; HIDDEN event autosaves on tab switch |
| 5 | Progress (level, coins, flags, journalUnlocked) persists in IndexedDB across refresh; no account needed (SAVE-01) | CODE VERIFIED | `SaveService` uses idb-keyval with versioned schema (SAVE_VERSION=1); `OverworldScene` saves on dialogue complete, boss defeat, HIDDEN event; journalUnlocked field persisted (CR-08 fix); 7 save-service tests pass incl. journalUnlocked regression |
| 6 | No Supabase import or fetch call in any src/ game path; game fully playable offline (SAVE-02) | CODE VERIFIED | Static assertion in save-service.test.ts confirms no supabase/fetch in SaveService source; `grep -rn "^import.*supabase" src/` returns 0 results; `grep -rn "fetch(" src/` returns 0 results |
| 7 | After boss defeat, player can share spoiler-free 1200x630 Canvas-rendered card in one tap; Blob pre-generated at BOSS_DEFEATED time; canShare guard; no score on card (VIRL-01) | CODE VERIFIED | `BossScene.handleAccept()` calls `prepareShareCard()` before emitting BOSS_DEFEATED; `ShareService` uses `renderer.snapshot` (not toDataURL); `shareCard()` has canShare guard + download fallback; `ShareCard.ts` has 0 score/highscore tokens; 8 share-service tests pass |
| 8 | og:image, og:title, og:description + twitter:card in index.html; og-image.png exists 1200x630 (VIRL-02) | CODE VERIFIED | index.html has og:image/og:title/og:description/og:type/og:url + twitter:card summary_large_image; public/og-image.png confirmed 1200x630 PNG by `file` command; 5 og-tags tests pass |

**Score: 8/8 truths code-verified**

---

## Required Artifacts

| Artifact | Status | Evidence |
|----------|--------|---------|
| `src/events/GameEvents.ts` | VERIFIED | Exports `Events` (7 constants) + `GameEvents` EventEmitter singleton |
| `src/input/InputBus.ts` | VERIFIED | `activeActions` Set, `InputBus.isActive/update/setAction`, WASD+arrows ORed |
| `src/services/SaveService.ts` | VERIFIED | `SAVE_VERSION=1`, `SaveState` interface, `save/load/migrate`, no supabase/fetch |
| `src/data/levels/level-01.ts` | VERIFIED | `MAP_DATA` 2D array, `LEVEL_01_MANIFEST` registered in ContentRegistry |
| `src/data/dialogue/en/level-01.json` | VERIFIED | 8 required keys: npc_grandpa, npc_store_clerk, npc_rival, boss_greed_01/02/03, boss_panic_01, boss_01_wisdom_quote |
| `src/game/scenes/OverworldScene.ts` | VERIFIED | Tilemap, Player, joystick, NPC zones, dog patrol, TriggerSystem, save checkpoints (448 lines) |
| `src/game/scenes/UIScene.ts` | VERIFIED | 4-state machine (HUD/DIALOGUE/PAUSE/LEVEL_COMPLETE), ShareService wired, CONTINUE→MainMenu (414 lines) |
| `src/game/main.ts` | VERIFIED | OverworldScene, UIScene, BossScene, PaperThrowScene in scene array |
| `src/systems/TriggerSystem.ts` | VERIFIED | `checkZones/consume/release` for minigame_trigger + boss_trigger zones |
| `src/game/scenes/minigames/PaperThrowScene.ts` | VERIFIED | Full mini-game: instructions+countdown (CR-05 fix), 5-house timing, MINIGAME_COMPLETE emit, shutdown cleanup |
| `src/game/scenes/BossScene.ts` | VERIFIED | Full two-phase boss: greed DECLINE + patience meter, panic BUY LOW + countdown (CR-06 fix), BOSS_DEFEATED emit, prepareShareCard pre-generation |
| `src/services/ShareService.ts` | VERIFIED | `prepareShareCard` (renderer.snapshot → 1200x630 → Blob), `shareCard` (cached Blob → canShare → share or download fallback) |
| `src/ui/ShareCard.ts` | VERIFIED | 1200x630 offscreen Canvas 2D render, no score tokens |
| `index.html` | VERIFIED | og:image, og:title, og:description, og:type, og:url, twitter:card — all present |
| `public/og-image.png` | VERIFIED | 1200x630 PNG, 11311 bytes, confirmed by `file` command |

---

## Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| `OverworldScene.ts` | `InputBus.ts` | `InputBus.update(joystick, mergedCursors)` in update() | WIRED — 2 occurrences |
| `Player.ts` | `InputBus.ts` | `InputBus.isActive(Action.MOVE_*)` → setVelocity | WIRED |
| `OverworldScene.ts` | `SaveService.ts` | `SaveService.save(buildSaveState())` on 7 checkpoint paths | WIRED — 7 occurrences |
| `UIScene.ts` | `GameEvents.ts` | `GameEvents.on(DIALOGUE_START/PAUSE_REQUESTED/...)` — 6 subscriptions | WIRED |
| `OverworldScene.ts` | `TriggerSystem.ts` | `triggerSystem.checkZones(x,y)` in update(); consume() + enterMiniGame/enterBoss | WIRED — 7 references |
| `PaperThrowScene.ts` | `GameEvents.ts` | `GameEvents.emit(Events.MINIGAME_COMPLETE, result)` | WIRED |
| `BossScene.ts` | `GameEvents.ts` | `GameEvents.emit(Events.BOSS_DEFEATED, {patienceBonus})` | WIRED |
| `BossScene.ts` | `ShareService.ts` | `prepareShareCard(this.game, wisdomQuote)` at win moment | WIRED — 3 references |
| `UIScene.ts` | `ShareService.ts` | `shareCard(this.game, quoteString)` in SHARE WISDOM pointerdown | WIRED — 4 references |
| `index.html` | `public/og-image.png` | `og:image` content="/og-image.png" | WIRED |

---

## Code Review Fixes Verified

All 17 code review findings fixed (IN-03 and IN-04 deferred as polish — confirmed intentional in REVIEW.md):

| Finding | Fix Verified In Code |
|---------|---------------------|
| CR-01: async create() race in OverworldScene | `init()` loads save; `create()` synchronous — confirmed at line 105 |
| CR-02: async create() race in BossScene | Static `import dialogueDataRaw from '...'` at top — confirmed at line 26 |
| CR-03: GameEvents.off() strips all listeners | All `.off()` calls pass `fn, this` — confirmed in OverworldScene.shutdown() + UIScene.shutdown() |
| CR-04: UIScene zombie overlay on MainMenu | `this.scene.stop('UIScene')` in continueBtn handler — confirmed at line 355 |
| CR-05: PaperThrowScene repeat N fires N+1 | `repeat: COUNTDOWN_START - 1` + `beginGame()` guard `if (this.phase !== 'instructions') return` — confirmed at lines 149, 167 |
| CR-06: BossScene panic timer off-by-one | `repeat: PANIC_DURATION_S - 1` — confirmed at line 334 |
| CR-07: SaveService returns raw malformed saves | `migrate(partial)` always called regardless of version — confirmed at lines 67-70 |
| CR-08: journalUnlocked always [] | `private journalUnlocked: string[]` field populated in boss defeat handler; spread in `buildSaveState()` — confirmed at lines 80, 324-326, 418 |
| WR-01: Tileset frame 16px vs tilemap 32px | Preloader uses `frameWidth: 32, frameHeight: 32` |
| WR-02: Unhandled async rejection in onDialogueStart | `try/catch` around the async handler — confirmed at line 84 |
| WR-03: Import assertion non-standard syntax | Removed `assert: { type: 'json' }` — confirmed at lines 36-40 |
| WR-04: iOS gesture broken on cold cache | Cold-cache path skips `navigator.share()` entirely, uses download anchor only — confirmed at ShareService.ts lines 116-135 |
| WR-05: HIDDEN handler can't be removed precisely | `private _onHidden = () => ...` class field; `game.events.off(HIDDEN, _onHidden, this)` — confirmed at lines 90, 444 |
| WR-06: Pause confirm YES/NO broken at non-default scale | `const canvasCenterX = this.scale.width / 2` — confirmed at UIScene.ts line 211 |
| WR-07: DialogueBox listener fragile teardown | `if (this.scene.input)` null guard in DialogueBox.destroy(); destroyed early in UIScene.shutdown() — confirmed at UIScene.ts line 411 |
| IN-01: ContentRegistry duplicate on HMR | Guard in ContentRegistry.register() |
| IN-02: SaveService.save() mutates caller object | `const toWrite = { ...state, version:..., updatedAt:... }` — confirmed at SaveService.ts line 51 |
| IN-03 | Skipped — intentional, deferred to gameplay polish |
| IN-04 | Skipped — intentional, deferred to test polish |

---

## Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|---------|
| GAME-01: Virtual joystick + keyboard via InputBus | SATISFIED | InputBus.update() ORs both sources; OverworldScene calls it each tick; 10 unit tests pass |
| GAME-05: Data-driven dialogue, DialogueBox typewriter, NPC interaction | SATISFIED | level-01.json dialogue trees; UIScene + DialogueBox; 5 dialogue tests pass |
| GAME-06: Patience mechanic (dog patrol bonus + boss DECLINE→BUY LOW) | SATISFIED | Dog patrol gap emits PATIENCE_BONUS +5; BossScene requires DECLINE×3 before panic phase; rushing has no win path |
| GAME-09: Pause/resume + Settings reachable | SATISFIED | UIScene pause state machine; HIDDEN event autosave; Settings launched from both MainMenu and pause overlay |
| SAVE-01: Versioned IndexedDB save, checkpoint saves, journalUnlocked persists | SATISFIED | SaveService SAVE_VERSION=1; 7 checkpoints in OverworldScene; journalUnlocked tracked + persisted; 7 save-service tests incl. CR-08 regression |
| SAVE-02: No supabase/fetch; fully offline | SATISFIED | Static assertion test confirms no backend imports; `grep` confirms zero supabase/fetch references in src/ |
| VIRL-01: renderer.snapshot, canShare guard, Blob pre-generation at BOSS_DEFEATED, spoiler-free (no score) | SATISFIED | All confirmed in ShareService.ts + BossScene.ts + ShareCard.ts; 8 share-service tests pass |
| VIRL-02: og:image/title/description + twitter:card in index.html, og-image.png 1200x630 | SATISFIED | Confirmed in index.html (5 og-tags tests pass) + public/og-image.png 1200x630 confirmed by file tool |

---

## Phase 1 Regression Tests

All 4 Phase 1 test files remain green in the 61-test suite:
- `tests/audio-persistence.test.ts` — 12 tests (audio persistence + unlock on iOS)
- `tests/parody-naming.test.ts` — 3 tests (no warren/buffett/munger/berkshire in locale files)
- `tests/i18n.test.ts` — 6 tests (i18n service loads; keys resolve)
- `tests/content-registry.test.ts` — 5 tests (ContentRegistry pattern)

---

## i18n Discipline

No hardcoded player-facing English string literals in new scene/UI files. Verified by:

```
grep -n -E "this\.add\.text\([^,]+,[^,]+,[ ]*['\"][A-Za-z]" \
  src/game/scenes/OverworldScene.ts src/game/scenes/UIScene.ts \
  src/game/scenes/BossScene.ts src/game/scenes/minigames/PaperThrowScene.ts \
  src/ui/HUD.ts src/ui/DialogueBox.ts
```

Returns no matches. All visible strings routed through `t()`.

---

## Anti-Patterns Scan

No `TBD`, `FIXME`, or `XXX` markers found in Phase 2 source files. No unreferenced debt markers. No placeholder return values in rendering paths. Comments that reference prior versions of code (e.g., CR-01 fix comments) are documentation, not stubs.

---

## Human Verification Required

The 3 device-checkpoint tasks (02-01-T3, 02-02-T3, 02-03-T3) were auto-approved in the `--auto` execution chain. All 14 manual-only behaviors from 02-VALIDATION.md are still outstanding. These cover real-device touch/audio/network behaviors that cannot be unit-tested.

**The phase is code-complete.** The phrase "on a real iPhone" in the phase goal requires the items listed above to be confirmed by a human on a physical device before the phase goal is strictly considered met. The automated tests and code review confirm the implementation is correct at the static and logic level.

### Device UAT Items (consolidated from 02-VALIDATION.md manual-only map)

See the `human_verification` list in the frontmatter for all 14 items. Key high-risk items:

1. **One-tap iOS share (VIRL-01)** — Web Share API must be called synchronously in the tap gesture; Blob pre-generation was implemented correctly in code but iOS sandbox behavior requires confirmation on device.

2. **Share card not black (VIRL-01)** — `renderer.snapshot` is the correct WebGL approach; requires a real WebGL context to confirm the snapshot captures the game frame correctly.

3. **Full offline play (SAVE-02)** — IndexedDB offline behavior in Airplane Mode requires a real Safari session.

4. **Audio on first tap iOS regression** — MainMenu now routes to OverworldScene instead of Settings; the Phase 1 audio unlock (first TAP TO START gesture) must still work in the new flow.

---

## Open Items (Unrelated to Phase 2)

- **Geltungssatz legal gate (Phase 1, open):** User-deferred on 2026-06-12. Public URL sharing blocked until resolved. This is a Phase 1 compliance item, not a Phase 2 blocker — Phase 2 is on branch `gsd/phase-02-level-1-offline-playable`, not yet merged to main.

---

## Summary

**Phase 2 is code-complete and review-clean.** All 8 requirements (GAME-01, GAME-05, GAME-06, GAME-09, SAVE-01, SAVE-02, VIRL-01, VIRL-02) are verified at the static/logic level. The build passes, TypeScript is clean, and 61/61 tests pass. All 17 code review blockers were fixed (2 low-risk info items intentionally deferred). The 3 device checkpoint human-verify tasks were auto-approved during the `--auto` execution chain — device UAT on a real iPhone remains outstanding.

---

_Verified: 2026-06-12T09:20:00Z_
_Verifier: Claude (gsd-verifier)_
