---
phase: 01-foundation-legal-shell
plan: "03"
subsystem: infra
tags: [cloudflare-pages, security-headers, deploy, legal, impressum, geltungssatz]

# Dependency graph
requires:
  - phase: 01-02
    provides: "Legal pages (Impressum, Datenschutz), Settings scene, npm run build exit 0"
provides:
  - "public/_headers with X-Frame-Options, X-Content-Type-Options, Referrer-Policy on all routes"
  - "Live Cloudflare Pages deployment at https://barren-wuffett.pages.dev"
  - ".deploy-url (machine-readable canonical URL)"
  - "README.md with deploy settings and pre-public-share checklist"
  - "Geltungssatz CONFIRMED 2026-06-14 — public sharing UNBLOCKED (game live at https://barren-wuffett.pages.dev)"
affects: [phase-02, phase-03, phase-04]

# Tech tracking
tech-stack:
  added: [cloudflare-pages, wrangler-cli]
  patterns:
    - "Security headers via public/_headers (Cloudflare Pages copies to dist/ at build)"
    - ".deploy-url as single source of truth for deployed URL (no env vars)"

key-files:
  created:
    - public/_headers
    - .node-version
    - .deploy-url
    - README.md
  modified: []

key-decisions:
  - "Wrangler CLI deploy used over Git integration — automation-first path succeeded"
  - "Task 3 (Geltungssatz) confirmed by user 2026-06-14 ('geltungssatz-confirmed') — public URL sharing UNBLOCKED (was deferred 2026-06-12)"
  - "LEGL-01 is functionally satisfied for the deployment half (pages live, linked, two-tap reachable) but NOT for the public-sharing half (external Geltungssatz pending)"

patterns-established:
  - "public/_headers: Cloudflare Pages copies to dist/ at build; apply security headers here, not in vite.config.ts"
  - ".deploy-url: single-file canonical URL, read via $(tr -d '[:space:]' < .deploy-url)"

requirements-completed: [INFR-01]

# Metrics
duration: ~20min (tasks 1-2); Task 3 deferred
completed: 2026-06-12
---

# Phase 01 Plan 03: Deploy + Security Headers Summary

**Cloudflare Pages deployment live at https://barren-wuffett.pages.dev with security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) — Geltungssatz CONFIRMED by user 2026-06-14; public URL sharing now UNBLOCKED**

## Performance

- **Duration:** ~20 min (Tasks 1-2); Task 3 deferred by user decision
- **Started:** 2026-06-11
- **Completed:** 2026-06-12 (Tasks 1-2); Task 3 open
- **Tasks:** 2 of 3 executed (1 deferred)
- **Files modified:** 4 (public/_headers, .node-version, .deploy-url, README.md)

## Accomplishments

- Security headers deployed to all routes: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` — verified live via curl
- Game is live at https://barren-wuffett.pages.dev (HTTP 200 on `/`, `/impressum`, `/datenschutz`); all three security headers confirmed in curl response
- `.deploy-url` written as the single machine-readable source of truth for the deployed URL

## Task Commits

Each task was committed atomically:

1. **Task 1: Security headers + deploy documentation** - `9d21e93` (feat)
2. **Task 2: Deploy static bundle to Cloudflare Pages** - `e79f034` (feat)
3. **Task 3: Geltungssatz checkpoint** - RESOLVED 2026-06-14 (human-action gate, no code commit — user signaled "geltungssatz-confirmed"; deferred 2026-06-12 → confirmed)

**Plan metadata:** (committed in this close-out)

## Files Created/Modified

- `public/_headers` — Cloudflare Pages security headers for all routes (`/*`), copied to `dist/_headers` at build
- `.node-version` — Pins Node 20 for Cloudflare Pages build environment; must also be set as `NODE_VERSION=20` in Pages dashboard
- `.deploy-url` — Contains `https://barren-wuffett.pages.dev` (single source of truth, no trailing whitespace beyond one newline)
- `README.md` — Local dev, Cloudflare Pages deploy settings, pre-public-share legal checklist (includes Geltungssatz step)

## Decisions Made

- **Wrangler CLI deploy over Git integration:** `npx wrangler pages deploy dist --project-name barren-wuffett` succeeded; dashboard Git-integration documented in README as fallback only.
- **Task 3 deferred by user (2026-06-12):** User explicitly stated "Geltungssatz machen wir später!" — plan closed out with deferral documented. Public sharing of the game URL remains blocked by this open legal gate.
- **LEGL-01 partial satisfaction:** The requirement is split into two halves. The deployment half (game live, legal pages reachable in two taps, security headers served) is satisfied. The external-Impressum half (Geltungssatz sentence on compoundingknowledge.com/impressum naming the game domain) remains OPEN.

## Deviations from Plan

None for Tasks 1-2 — executed exactly as written.

**Task 3 (type: checkpoint:human-action, gate: blocking-human):** Deferred by explicit user decision 2026-06-12. This is not an auto-fix or deviation — it is a user-directed mark-and-skip. The gate remains open and must be resolved before the game URL is shared publicly.

## Known Stubs / Open Gates

### RESOLVED LEGAL GATE — Task 3: Geltungssatz (confirmed 2026-06-14)

**Status:** RESOLVED. User signaled "geltungssatz-confirmed" on 2026-06-14 — the external Impressum now covers the game domain. Public sharing of the game URL is UNBLOCKED.

**What was required (now satisfied):**
1. Geltungssatz live on the external Impressum (compoundingknowledge.com) naming/covering the game domain ✓
2. Game Impressum/Imprint link reachable in ≤2 taps and pointing at that external page (game imprint → /en/imprint, commit 7553a10) ✓
3. User confirmed the sentence is live and the link resolves ✓ (2026-06-14)

**Result (in bold): PUBLIC SHARING of https://barren-wuffett.pages.dev is now PERMITTED — the Geltungssatz is live and the user confirmed on 2026-06-14.**

Resume signal received: `geltungssatz-confirmed` (2026-06-14)

## LEGL-01 Status

| Sub-requirement | Status |
|----------------|--------|
| Game live at public Cloudflare Pages URL showing menu screen | SATISFIED — https://barren-wuffett.pages.dev returns 200 |
| Security headers served on all routes | SATISFIED — verified live via curl |
| Legal pages reachable in two taps from deployed URL | SATISFIED — /impressum and /datenschutz return 200 with expected content |
| Geltungssatz confirmed on external Impressum (compoundingknowledge.com) | **SATISFIED — user confirmed "geltungssatz-confirmed" 2026-06-14** |
| Public URL sharing gate | LIFTED 2026-06-14 — game URL may now be shared publicly |

## Threat Surface Scan

No new surface beyond what the plan's threat_model anticipated. All T-03-01 through T-03-04 mitigations applied (headers live, HTTPS enforced by Cloudflare, public-share gate open). T-03-04 (Abmahnung risk) remains an active open gate — no new surface introduced.

## Issues Encountered

None for Tasks 1-2.

## User Setup Required

**Cloudflare Pages dashboard:** Set `NODE_VERSION=20` as an environment variable in the Pages project settings (documented in README.md). Build command `npm run build`, output directory `dist`.

**Geltungssatz (OPEN GATE):** See "Known Stubs / Open Gates" above. This is the only remaining setup item for Phase 1 legal completeness.

## Next Phase Readiness

- INFR-01 satisfied: game is live and serving security headers
- Phase 2 (Level 1 Offline Playable) may proceed — it does not depend on the Geltungssatz
- **Geltungssatz CONFIRMED 2026-06-14** — the public-sharing gate is LIFTED; the game URL (https://barren-wuffett.pages.dev) may now be shared publicly

---
*Phase: 01-foundation-legal-shell*
*Completed: 2026-06-12 (Tasks 1-2); Task 3 deferred pending user action*
