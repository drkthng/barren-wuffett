---
phase: 1
slug: foundation-legal-shell
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-11
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (installed in Wave 0 — plan 01-01 Task 1 — alongside the Vite scaffold) |
| **Config file** | `vitest.config.ts` (created in plan 01-01 Task 1) |
| **Quick run command** | `npx vitest run --reporter=dot` |
| **Full suite command** | `npm run build && npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=dot`
- **After every plan wave:** Run `npm run build && npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-T1 | 01-01 | 1 | INFR-05, LEGL-02, INFR-04, GAME-08, GAME-10 | T-01-SC, T-01-02 | Scaffold builds clean; viewport zoom-lock + pixel-art CSS; PWA manifest references both 192/512 icons; all textures ≤2048px; three Wave 0 test stubs collect cleanly (RED) | build + test-collection | `npm install && npm run build && npx vitest run --reporter=dot \|\| true` | ✅ created here | ⬜ pending |
| 01-01-T2 | 01-01 | 1 | INFR-05, LEGL-02, INFR-04 | T-01-03 | i18n key-fallback, AudioService localStorage semantics, ContentRegistry empty-registry, parody-naming filter — all three Wave 0 tests GREEN | unit (tdd) | `npx vitest run --reporter=dot` | ✅ tests/i18n.test.ts, tests/parody-naming.test.ts, tests/content-registry.test.ts | ⬜ pending |
| 01-01-T3 | 01-01 | 1 | INFR-05, GAME-08, GAME-10, LEGL-02 | T-01-SC, T-01-03 | Boot→Preloader→MainMenu compiles; rex VirtualJoystick import path resolves in prod build; no hardcoded English (grep gate); branded progress bar | build + grep gate | `npm run build && npm run check` | n/a (source-grep gates) | ⬜ pending |
| 01-02-T1 | 01-02 | 2 | GAME-07 | T-02-04 | Music/SFX toggles persist to localStorage and survive a simulated reload; default-enabled; SFX independent of Music | unit (tdd) | `npx vitest run tests/audio-persistence.test.ts --reporter=dot && npm run build` | ✅ tests/audio-persistence.test.ts | ⬜ pending |
| 01-02-T2 | 01-02 | 2 | LEGL-01, LEGL-02 | T-02-01, T-02-02, T-02-03 | Static legal pages link external Impressum + name all four processors; crawler-visible DOM anchors; no real names; two-tap reachable | build + grep gate | `npm run build` | n/a (built-artifact + source-grep gates) | ⬜ pending |
| 01-03-T1 | 01-03 | 3 | INFR-01, LEGL-01 | T-03-01, T-03-02, T-03-03 | Security headers (`X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`) ship via `public/_headers`; README documents deploy + pre-public-share checklist | build + content gate | `npm run build` | ✅ public/_headers, .node-version, README.md | ⬜ pending |
| 01-03-T2 | 01-03 | 3 | INFR-01 | T-03-01, T-03-05 | Deployed URL written to `.deploy-url`; `/`, `/impressum`, `/datenschutz` return HTTP 200; `X-Frame-Options` header served; viewport lock served | deploy + live-curl gate | `npm run build && test -s .deploy-url && DEPLOY_URL="$(tr -d '[:space:]' < .deploy-url)" && curl -sS -o /dev/null -w "%{http_code}" "${DEPLOY_URL}/impressum" \| grep -q 200` | ✅ .deploy-url (written in action) | ⬜ pending |
| 01-03-T3 | 01-03 | 3 | LEGL-01 | T-03-04 | Geltungssatz confirmed on compoundingknowledge.com/impressum naming the game domain before any public sharing | manual (blocking human-action) | n/a — manual gate (resume-signal "geltungssatz-confirmed") | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `vitest` installed as devDependency with `vitest.config.ts` and `npm run build` passing (plan 01-01 Task 1)
- [x] `tests/i18n.test.ts` — INFR-05 (all player-facing strings resolve through the i18n layer; `t()` falls back to the key when missing)
- [x] `tests/parody-naming.test.ts` — LEGL-02 (no forbidden real names — `warren`/`buffett`/`munger`/`berkshire`, case-insensitive — in any locale JSON value)
- [x] `tests/content-registry.test.ts` — INFR-04 (`ContentRegistry.getAllLevels()` returns an array; `getLevel('nope')` returns undefined)

All four Wave 0 test files are created syntactically-valid and collectable in plan 01-01 Task 1 (RED), then turned GREEN against real modules in plan 01-01 Task 2. `tests/audio-persistence.test.ts` (GAME-07) is created in plan 01-02 Task 1 alongside the Settings scene — it is not a Wave 0 stub because the AudioService contract it tests already exists from plan 01-01 Task 2.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Portrait rendering on real phone, no pinch-zoom breakage | GAME-10 | Requires real device viewport/touch behavior | Open deployed URL on a real phone in portrait; verify menu fills screen, pinch-zoom does nothing |
| Audio toggle persists across sessions on iOS | GAME-07 | iOS WebAudio unlock requires a real user gesture | Tap to start, toggle music off, reload page, verify toggle state retained and audio stays off |
| Impressum/Privacy reachable in two taps | LEGL-01 | Visual navigation check | From menu and from legal footer, count taps to each legal page |
| Deployed URL serves menu screen | INFR-01 | End-to-end hosting check | Open Cloudflare Pages URL on phone and desktop |
| Geltungssatz live on compoundingknowledge.com naming the game domain | LEGL-01 | Requires editing an external site outside this repo | Open compoundingknowledge.com/impressum; confirm the sentence naming the deployed domain is present before any public sharing (plan 01-03 Task 3) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (01-03-T3 is the single legitimate manual gate — a blocking human-action that edits an external site; all other tasks carry an automated command)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (every auto task across plans 01-01..01-03 has an automated command; the only manual task is the terminal legal gate)
- [x] Wave 0 covers all MISSING references (i18n, parody-naming, content-registry stubs created before the modules they test)
- [x] No watch-mode flags (all commands use `vitest run`, not `vitest`)
- [x] Feedback latency < 60s (full suite ~30s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-11
</content>
