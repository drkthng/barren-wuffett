---
phase: 1
slug: foundation-legal-shell
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-11
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (to be installed in Wave 0 alongside the Vite scaffold) |
| **Config file** | none — Wave 0 installs |
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
| (filled by planner) | | | | | | | | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest` installed as devDependency with `npm run build` passing
- [ ] `tests/i18n.test.ts` — stubs for INFR-05 (all player-facing strings resolve through i18n layer)
- [ ] `tests/parody-naming.test.ts` — stubs for LEGL-02 (no forbidden real names in locale files)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Portrait rendering on real phone, no pinch-zoom breakage | GAME-10 | Requires real device viewport/touch behavior | Open deployed URL on a real phone in portrait; verify menu fills screen, pinch-zoom does nothing |
| Audio toggle persists across sessions on iOS | GAME-07 | iOS WebAudio unlock requires a real user gesture | Tap to start, toggle music off, reload page, verify toggle state retained and audio stays off |
| Impressum/Privacy reachable in two taps | LEGL-01 | Visual navigation check | From menu and from legal footer, count taps to each legal page |
| Deployed URL serves menu screen | INFR-01 | End-to-end hosting check | Open Cloudflare Pages URL on phone and desktop |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
