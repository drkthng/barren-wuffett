---
phase: 2
slug: level-1-offline-playable
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-12
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (installed in Phase 1; `fake-indexeddb` devDependency added in Wave 0 / plan 02-01 Task 1) |
| **Config file** | `vitest.config.ts` (exists) |
| **Quick run command** | `npx vitest run --reporter=dot` |
| **Full suite command** | `npm run build && npm run check && npx vitest run` |
| **Estimated runtime** | ~60 seconds |

**Note:** `tests/share-service.test.ts` requires the jsdom environment (set via a `// @vitest-environment jsdom` file-level comment). All other tests run in the node environment. Phaser scenes (OverworldScene, UIScene, BossScene, PaperThrowScene) require a WebGL context and are verified manually on-device (see Manual-Only Verifications) — this matches the Phase 1 precedent that scene-level behavior is human-verified.

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=dot`
- **After every plan wave:** Run `npm run build && npm run check && npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-T1 | 02-01 | 1 | SAVE-01, SAVE-02, GAME-01, GAME-05 | T-02-01, T-02-04, T-02-SC | SaveState version/shape guard; idb silent-fail; no supabase/fetch | unit (node + fake-indexeddb) | `npx vitest run --reporter=dot tests/save-service.test.ts tests/input-bus.test.ts tests/dialogue.test.ts` | ❌ W0 → created in this task | ⬜ pending |
| 02-01-T2 | 02-01 | 1 | GAME-01, GAME-05, GAME-06, GAME-09 | T-02-02 | Dialogue rendered as text not HTML; no eval | build/check proxy (scenes need WebGL) | `npm run check && npm run build && npx vitest run --reporter=dot` | ✅ (uses W0 tests, no new test file) | ⬜ pending |
| 02-01-T3 | 02-01 | 1 | GAME-01, GAME-05, GAME-06, GAME-09, SAVE-01, SAVE-02 | T-02-03 | Save holds no PII | manual (device) | n/a — see Manual-Only map | ✅ manual | ⬜ pending |
| 02-02-T1 | 02-02 | 2 | GAME-06 | T-02-05, T-02-06 | Result via event bus only; input cleanup on sleep | build/check proxy | `npm run check && npm run build && npx vitest run --reporter=dot` | ✅ (no new test file) | ⬜ pending |
| 02-02-T2 | 02-02 | 2 | GAME-06 | T-02-05, T-02-07 | Result via event bus; boss text from static JSON | build/check proxy | `npm run check && npm run build && npx vitest run --reporter=dot` | ✅ (no new test file) | ⬜ pending |
| 02-02-T3 | 02-02 | 2 | GAME-06 | T-02-06 | No phantom input; no permanent fail | manual (device) | n/a — see Manual-Only map | ✅ manual | ⬜ pending |
| 02-03-T1 | 02-03 | 3 | VIRL-01, VIRL-02 | T-02-08, T-02-10, T-02-11 | snapshot not toDataURL; canShare guard; no score on card; og:image asset exists | unit (jsdom + node) | `npx vitest run --reporter=dot tests/share-service.test.ts tests/og-tags.test.ts && npm run check && npm run build` | ❌ W0 → created in this task | ⬜ pending |
| 02-03-T2 | 02-03 | 3 | VIRL-01 | T-02-09, T-02-10 | Blob pre-generated in-gesture; no score on screen | build/check proxy | `npm run check && npm run build && npx vitest run --reporter=dot` | ✅ (uses W0 tests) | ⬜ pending |
| 02-03-T3 | 02-03 | 3 | VIRL-01, VIRL-02, SAVE-02 | T-02-09, T-02-11 | In-gesture share; HTTPS-only; offline | manual (device + external) | n/a — see Manual-Only map | ✅ manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Sampling continuity check:** No run of 3 consecutive code-producing tasks lacks an automated verify. Every `auto`/`tdd` task has an `<automated>` command (Wave 0 unit tests where node-testable; `npm run check && npm run build && npx vitest run` build-proxy where the behavior lives in a Phaser scene that needs WebGL). The three `checkpoint:human-verify` tasks (one per plan) cover device-only behaviors and are not counted toward the consecutive-automated rule because they produce no code.

---

## Wave 0 Requirements (from RESEARCH.md Validation Architecture)

Wave 0 test files are created inside the plans (not a separate plan) — node-testable services get their tests in the same task that creates them, RED-or-GREEN per the deep-work rule. Wave 0 is complete when all five test files exist and pass.

- [ ] `fake-indexeddb` installed as devDependency (plan 02-01 Task 1) — IndexedDB mocking in node test env
- [ ] `idb-keyval@6.2.5` installed as dependency (plan 02-01 Task 1)
- [ ] `tests/save-service.test.ts` — SAVE-01/SAVE-02 (save/load roundtrip, `version` field, v0→v1 migration, survives simulated reload via vi.resetModules + fake-indexeddb, static no-supabase/no-fetch assertion) — plan 02-01 Task 1
- [ ] `tests/input-bus.test.ts` — GAME-01 (Action enum set/clear semantics, joystick+keyboard sources OR without conflict) — plan 02-01 Task 1
- [ ] `tests/dialogue.test.ts` — GAME-05 (dialogue JSON parses, required NPC + boss + wisdom-quote keys present) — plan 02-01 Task 1
- [ ] `tests/og-tags.test.ts` — VIRL-02 (index.html contains og:image, og:title, og:description; og:image points at og-image.png) — plan 02-03 Task 1
- [ ] `tests/share-service.test.ts` — VIRL-01 (jsdom; canShare-guard fallback chain; file-share path; snapshot-not-toDataURL static assertion) — plan 02-03 Task 1

`wave_0_complete` flips to `true` when all six boxes above are checked during execution.

---

## Manual-Only Verifications

| Behavior | Requirement | Plan/Task | Why Manual | Test Instructions |
|----------|-------------|-----------|------------|-------------------|
| Virtual joystick feel/latency on real phone | GAME-01 | 02-01-T3 | Touch hardware required | Move through overworld on iPhone; joystick responds <50ms perceived; not cut off by home indicator (Pitfall 6) |
| Keyboard WASD/arrows move player | GAME-01 | 02-01-T3 | Phaser WebGL game loop | Desktop Chrome; player moves in all 4 directions at correct speed, collides with walls |
| NPC dialogue triggers + typewriter + advance | GAME-05 | 02-01-T3 | Phaser scene + pointer | Walk to NPC, INTERACT; dialogue box types out at readable speed; tap advances/closes |
| Pause/resume incl. OS interruption + Settings reachable | GAME-09 | 02-01-T3 | Device lifecycle | Escape/pause button pauses; SETTINGS opens Phase 1 Settings; RESUME resumes; switch apps + return resumes with audio intact |
| Patience mechanic rewards waiting (dog patrol) | GAME-06 | 02-01-T3 | Gameplay timing judgment | Rush the long way vs wait for the 1.5s gap — waiting yields +5 PATIENCE BONUS and higher coins |
| Save survives refresh | SAVE-01 | 02-01-T3 | Real IndexedDB + reload | Complete one NPC interaction; refresh; game resumes at saved position with coins |
| Mini-game completable + clean handoff | GAME-06 | 02-02-T3 | Phaser scene + timing | Trigger zone launches PaperThrowScene; complete 5 houses / 60s; overworld resumes, coins update, no phantom input (Pitfall 2) |
| Boss completable + patience rewarded over rushing | GAME-06 | 02-02-T3 | Gameplay judgment | DECLINE through Greed builds patience; BUY LOW! in Panic wins; missing the timer resets with no permanent fail; rushing cannot win |
| Boss-defeat save persists | SAVE-01 | 02-02-T3 | Real IndexedDB | After defeating boss, refresh — boss_01_defeated flag persists |
| One-tap share card on iOS | VIRL-01 | 02-03-T3 | Web Share API needs real user gesture + OS share sheet | Defeat boss, tap SHARE WISDOM once; OS share sheet opens with a 1200×630 PNG; image not black; quote + URL visible; no score (spoiler-free) |
| Share download fallback on desktop | VIRL-01 | 02-03-T3 | Browser share/download | Desktop Chrome: SHARE WISDOM offers barren-wuffett-victory.png download; button shows SAVED! |
| Rich URL preview | VIRL-02 | 02-03-T3 | External platforms | Paste game URL in WhatsApp/Telegram or a preview debugger — og:image + og:title + og:description preview appears |
| Audio works on first tap (regression) | GAME-07 (Phase 1) | 02-01-T3 | Real iPhone audio | Music starts on first TAP TO START tap (inherited Phase 1 behavior still holds after MainMenu→OverworldScene change) |
| Full offline play end-to-end | SAVE-02 | 02-03-T3 | Network condition | Airplane mode: load once, refresh, play Level 1 move→dialogue→mini-game→boss→share-fallback→save with no network |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (every auto/tdd task has an automated command; checkpoint tasks map to Manual-Only verifications)
- [x] Sampling continuity: no 3 consecutive code-producing tasks without automated verify
- [x] Wave 0 covers all MISSING references (save-service, input-bus, dialogue, og-tags, share-service — all five RESEARCH MISSING items have a creating task)
- [x] No watch-mode flags (all commands use `vitest run`, never `vitest` watch)
- [x] Feedback latency < 90s (quick run ~60s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready — Per-Task Verification Map filled, Wave 0 mapped to creating tasks, sign-off complete. `wave_0_complete` remains `false` until the five test files exist and pass during execution.
