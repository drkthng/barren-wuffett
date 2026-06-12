---
phase: 2
slug: level-1-offline-playable
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-12
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (installed in Phase 1; `fake-indexeddb` devDependency added in Wave 0 of this phase) |
| **Config file** | `vitest.config.ts` (exists) |
| **Quick run command** | `npx vitest run --reporter=dot` |
| **Full suite command** | `npm run build && npm run check && npx vitest run` |
| **Estimated runtime** | ~60 seconds |

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
| (filled by planner — REQUIRED before sign-off) | | | | | | | | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements (from RESEARCH.md Validation Architecture)

- [ ] `fake-indexeddb` installed as devDependency (IndexedDB mocking in node test env)
- [ ] `tests/save-service.test.ts` — SAVE-01/SAVE-02 (save/load roundtrip, schema `version` field, survives simulated reload via vi.resetModules + fake-indexeddb)
- [ ] `tests/input-bus.test.ts` — GAME-01 (Action enum set/clear semantics, joystick+keyboard sources don't conflict)
- [ ] `tests/dialogue.test.ts` — GAME-05 (dialogue data parsing, node traversal, i18n key resolution)
- [ ] `tests/og-tags.test.ts` — VIRL-02 (index.html contains og:image, og:title, og:description with absolute URLs)
- [ ] `tests/share-service.test.ts` — VIRL-01 (share card data assembly, canShare guard fallback chain)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Virtual joystick feel/latency on real phone | GAME-01 | Touch hardware required | Move through overworld on iPhone; joystick responds <50ms perceived |
| Mini-game + boss completable, patience mechanic rewards waiting | GAME-06 | Gameplay judgment | Play Level 1 start-to-finish; deliberately wait for "buy low" moment vs grinding — waiting must yield better outcome |
| Offline play | SAVE-02 | Network condition | Load game once, enable airplane mode, refresh — game fully playable |
| Share card on iOS/Android | VIRL-01 | Web Share API needs real user gesture + OS share sheet | Defeat boss, tap share, confirm OS share sheet opens with image |
| Rich preview rendering | VIRL-02 | External platforms | Paste URL in WhatsApp/Telegram — image+title preview appears |
| Pause/resume incl. OS interruption | GAME-09 | Device lifecycle | Pause mid-game, switch apps, return — game resumes correctly, audio state intact |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending (planner must fill Per-Task Verification Map and complete sign-off)
