---
phase: "05"
slug: "consolidate-shared-shell-hub-checkpoint"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-16"
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest `^2.0.0` (Node env) + Playwright `^1.60.0` (headless Chromium, 412×915 phone viewport) |
| **Config file** | `vitest.config.ts`; Playwright runs as standalone scripts (`smoke.mjs` pattern, `vite preview()` + `chromium.launch()`) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test && node smoke.mjs` (plus the extended headless playthrough / preview-URL checks added in Wave 0) |
| **Estimated runtime** | ~50 s (Vitest), ~2 min with headless checks |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test && node smoke.mjs` (or its extended replacement) against `vite preview`
- **Before `/gsd-verify-work`:** Full suite green locally AND the headless phone-viewport checks (INFR-07/08) re-run against the deployed non-public Cloudflare preview URL — CSP is inert on localhost
- **Max feedback latency:** ~60 seconds

---

## Per-Task Verification Map

*Filled by the planner/executor once PLAN.md task IDs exist. Requirement-level map from research:*

| Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|----------|-----------|-------------------|-------------|--------|
| INFR-06 | Every existing test green after consolidation | unit (existing suite) | `npm test` | ✅ (227 tests) | ⬜ pending |
| INFR-07 | `/adventure/` loads existing saves, reaches boss + level-complete | e2e headless phone | extended playthrough script via `window.__BW_GAME__` | ❌ W0 | ⬜ pending |
| INFR-08 | Every page loads from fresh direct URL, zero 404s / CSP violations | e2e headless against deployed preview | preview-URL route check script (`requestfailed` + CSP console events empty) | ❌ W0 | ⬜ pending |
| INFR-09 | Cached client gets new build on next visit | manual / scripted two-pass SW check | documented procedure | ❌ W0 | ⬜ pending |
| HUB-02 | Flag flip changes tile lock state; locked tile has no `href` | unit | `npm test` (`tests/release-config.test.ts`) | ❌ W0 | ⬜ pending |
| HUB-04/05/07 | Checklist/streak logic, UTC day, silent reset, storage-failure degrade | unit + headless probe | `npm test` (`tests/progress-store.test.ts`) + `window.__HUB__` probe | ❌ W0 | ⬜ pending |
| SHELL-03 | Daily seed determinism via `?date=` | unit | `npm test` (`tests/daily-seed.test.ts`) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/daily-seed.test.ts` — SHELL-03 fingerprint determinism
- [ ] `tests/progress-store.test.ts` — HUB-04/05/07 checklist/streak + storage-failure degrade
- [ ] `tests/release-config.test.ts` — HUB-02 tile lock flag
- [ ] Extended headless Playwright script — INFR-07 adventure playthrough to boss + level-complete; INFR-08 per-route zero-404/zero-CSP check against the preview URL
- [ ] Documented cached-client update procedure — INFR-09

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cached client picks up new build | INFR-09 | One-time two-deploy SW lifecycle check | Load preview build N, deploy build N+1 to same alias, reload, confirm new content without clearing site data |
| Cloudflare Web Analytics records per-page views, no cookies | MEAS-01 | Requires Cloudflare dashboard | Visit each preview route, confirm page views in dashboard, confirm no cookies set in DevTools |
| Human phone sign-off on preview URL | D-13 | Experiential judgement on a real phone | Open preview URL on phone, walk hub → adventure → legal pages |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
