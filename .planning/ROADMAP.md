# Roadmap: Barren Wuffett

## Milestones

- ✅ **v1.0 Level 1 Adventure + Email Funnel** - Phases 1-4 shipped, Phases 5-8 never started. Superseded 2026-10-07 by the pivot to a mini-game hub (archived in `milestones/v1.0-ROADMAP.md`, `milestones/v1.0-REQUIREMENTS.md`, `milestones/v1.0-phases/`)
- 🚧 **v2.0 The Barren Wuffett Hub** - Phases 5-8 (in progress)

## Overview

Four phases turn the existing single-page Level 1 adventure into a four-tile mini-game hub, released one format at a time. Phase 5 does the one piece of work every later phase depends on: merging the stalled branch stack into `main`, moving the adventure to `/adventure/`, building the shared shell once (config, daily seed, share flow, credit/About/legal overlay, device-only progress store, code-drawn cast), and standing up the hub itself — tile grid, checklist, streak, install hint — all CSP-clean and deployed only to a non-public Cloudflare preview URL. Phases 6-8 then port one new format each (the Mr. Market arcade, the Snowball idle game, Barren-the-CEO swipe) straight from its already-played spike, pass a real-phone feel check, and ship with its own X post. Phase 6 carries the milestone's one unrepeatable event — the first public deploy, which switches the live site from the old adventure-only build to the hub + arcade together — and every release gate it proves (per-page share card, spoiler-free share text, gameplay clip, written self-audit, go-ahead-gated public deploy, returning players getting the new build) gets re-verified in Phases 7 and 8. Phases 7 and 8 depend only on Phase 5's shared shell, not on each other or on Phase 6's gameplay code, so they could reorder if a phone-feel pass finishes out of sequence — but the planned release order (arcade → idle → swipe) holds unless the user says otherwise. Every release phase treats the human phone check as part of "done," not an optional follow-up — the lesson carried forward from v1.0, where three phases in a row shipped code-complete with the phone check still pending.

## Phases

**Phase Numbering:**

- Continues from v1.0, which ended at Phase 4 (its planned Phases 5-8 were never started and are archived). This milestone starts at Phase 5.
- Integer phases (5, 6, 7, 8): Planned milestone work
- Decimal phases (5.1, 5.2, ...): Urgent insertions, if any arise

- [ ] **Phase 5: Consolidate + Shared Shell + Hub Checkpoint** - Merge the branch stack into `main`, move the adventure to `/adventure/`, build the shared shell + hub, deploy to a non-public preview only
- [ ] **Phase 6: Release 1 — Mr. Market Arcade** - Port, phone feel pass, share card + clip, self-audit, then the first public deploy (hub + arcade together) and the X post
- [ ] **Phase 7: Release 2 — Snowball Idle** - Port, phone feel pass, share card + clip, self-audit, public deploy on go-ahead, X post
- [ ] **Phase 8: Release 3 — Barren-CEO Swipe** - Port, phone feel pass, share card + clip, self-audit, public deploy on go-ahead, X post

## Phase Details

### Phase 5: Consolidate + Shared Shell + Hub Checkpoint

**Goal**: One consolidated `main` holds the adventure, the shared hub modules, and the hub page itself — checked end-to-end on a non-public Cloudflare preview URL before any new game or public deploy exists
**Depends on**: v1.0 Phases 1-4 (archived baseline — the existing Phaser 4 + Vite + TS scaffold, legal shell, and Level 1 adventure code)
**Requirements**: INFR-06, INFR-07, INFR-08, INFR-09, SHELL-01, SHELL-02, SHELL-03, SHELL-04, SHELL-05, SHELL-06, SHELL-07, HUB-01, HUB-02, HUB-03, HUB-04, HUB-05, HUB-06, HUB-07, MEAS-01, LEGL-05, LEGL-07
**Research flag**: the exact Workbox `globPatterns`/`navigateFallback` configuration for a multi-page site with a growing entry list needs verifying against `vite-plugin-pwa`'s current docs during planning (Pitfall 6 — stale service worker serving an old build after a release)
**Success Criteria** (what must be TRUE):
  1. `main` holds the full Level 1 chain (v1.0 Phases 2.1-4), the menu-tap fix, and the spike docs with every existing test green; a headless phone-viewport regression run on `/adventure/` loads existing saves and reaches the boss and the level-complete screen
  2. Every page that exists at this point (`/` and `/adventure/`; the game paths arrive with their releases) loads directly from a fresh URL with zero 404s and zero CSP violations, the multi-page build is set up so each later release only adds an entry, and a client with the previous build cached gets the new build on its next visit without clearing site data
  3. The hub shows one tile per game — live games open with one tap, unreleased games read "coming soon, follow @Wolfhartvest" and link to the X profile, flipping a tile from locked to live is a single config change, and the adventure has its own tile labelled as an early demo
  4. A player sees today's checklist and a play streak that grows once per UTC day with at least one finished daily, silently resets to 1 after a missed day (no loss message, no freeze), survives reloads, and still works when storage is unavailable; after the 2nd streak day a dismissible Home-Screen-install hint appears once and never returns after dismissal
  5. Every page carries the credit line ("made by @Wolfhartvest"), the About overlay, the shared daily seed (reproducible via `?date=`), the code-drawn cast, and the strict CSP with self-hosted fonts and no third-party requests besides the analytics beacon; Cloudflare Web Analytics records page views per page with no cookies, legal links sit within two taps from every page, and the privacy page matches reality — all verified on a non-public Cloudflare preview URL only, since the public site does not change in this phase

**Plans**: 8 plans

Plans:
- [ ] 05-01-PLAN.md — Consolidate `main` (merge `gsd/fix-menu-taps`, push), move the adventure to `/adventure/` in a multi-page build, one root-scope service worker
- [ ] 05-02-PLAN.md — Shared shell modules (config, daily seed, progress store, release registry, share flow, test hooks, cast port), string table, self-hosted Pixelify Sans
- [ ] 05-03-PLAN.md — Hub page: cards in release order, daily strip with checklist and snowball streak, probe-only `window.__HUB__`
- [ ] 05-04-PLAN.md — Adventure inside the hub: "← HUB" + credit line, headless regression (saves load, boss, level complete)
- [ ] 05-05-PLAN.md — CSP + Cloudflare Web Analytics beacon, build entries from the release registry, privacy page (DE + EN), real 404
- [ ] 05-06-PLAN.md — Hub overlays: locked-card bottom sheet, Home-Screen install hint, shared About overlay
- [ ] 05-07-PLAN.md — Per-page absolute OG cards (hub + adventure), Home-Screen icon of old Barren, hub manifest
- [ ] 05-08-PLAN.md — Deploy to the non-public preview alias, deployed checks, cached-client update proof, phone sign-off (D-13)

**UI hint**: yes

### Phase 6: Release 1 — Mr. Market Arcade

**Goal**: The Mr. Market arcade ships as the hub's first live game — ported, tuned on a real phone, and publicly deployed together with the hub on the user's go-ahead, with its own X post
**Depends on**: Phase 5
**Requirements**: ARC-01, ARC-02, ARC-03, ARC-04, ARC-05, ARC-06, VIRL-03, VIRL-04, VIRL-05, LEGL-06, INFR-10
**Research flag**: iOS Safari AudioContext unlock timing inside a DOM-overlay-triggers-Phaser-scene architecture is new to this repo and needs confirming against Phaser 4's current sound-manager API during planning (Pitfall 2)
**Success Criteria** (what must be TRUE):
  1. Human phone gate: the user completes a full 60s run on a real phone and signs off that the length and item busyness feel right — before any public deploy
  2. The day's market is identical for every player regardless of frame rate (a per-date fingerprint test passes, visual-effect randomness never touches the seeded schedule), and reaching the end screen shows final value, %/yr, rank and decade squares, ticks the arcade on the hub checklist, and updates the best score
  3. Real-iPhone gate: sound plays on iPhone Safari after the first tap, and Share opens the native share sheet
  4. Release gate: the X card preview for the arcade's share URL is verified in X's Post Inspector, the gameplay clip (MP4 + GIF) and spoiler-free share text (rank + categories only, no event order) are ready, and the written self-audit (parody names only, no endorsement, no portfolio/eToro/wikifolio links, credit visible, nothing reads as investment advice) is signed off by the user — all before posting
  5. Public-deploy gate: `/arcade/` loads directly from a fresh URL on the preview deploy with zero 404s and zero CSP violations; the hub and arcade then go live together only on the user's explicit go-ahead — the milestone's first public deploy — and a player with the previous build cached gets the new build and the newly unlocked arcade tile on their next visit without clearing site data

**Plans**: TBD
**UI hint**: yes

### Phase 7: Release 2 — Snowball Idle

**Goal**: The Snowball idle game ships as the hub's second live game — ported, tuned on a real phone, and publicly deployed on the user's go-ahead, with its own X post
**Depends on**: Phase 5 (independent of Phase 6's gameplay code; planned to ship second per the release order)
**Requirements**: IDLE-01, IDLE-02, IDLE-03, IDLE-04
**Success Criteria** (what must be TRUE):
  1. Human phone gate: the user completes a full ~5-minute life (age 6 to 90) on a real phone and signs off that the life length and pacing feel right — before any public deploy
  2. Every player gets the same seeded Mr. Market offers for the day (crash first), reproducible via `?date=`, and reaching the end screen shows the life's result and rank, ticks the idle game on the hub checklist, and records the best
  3. Real-iPhone gate: the hustle-tap, buy, and reinvest flow works correctly on iPhone Safari with no stray scrolling or dead taps
  4. Release gate (re-verified): the X card preview is verified in X's Post Inspector, the gameplay clip and spoiler-free share text are ready, and the written self-audit is signed off by the user — all before posting
  5. Public-deploy gate (re-verified): `/snowball/` loads directly from a fresh URL on the preview deploy with zero 404s and zero CSP violations; the idle game then goes live only on the user's explicit go-ahead, and a player with the previous build cached gets the new build and the newly unlocked snowball tile without clearing site data

**Plans**: TBD
**UI hint**: yes

### Phase 8: Release 3 — Barren-CEO Swipe

**Goal**: The Barren-CEO swipe game ships as the hub's third live game — ported, tuned on a real phone (including a reader outside finance), and publicly deployed on the user's go-ahead, with its own X post
**Depends on**: Phase 5 (independent of Phases 6 and 7; planned to ship third per the release order)
**Requirements**: CEO-01, CEO-02, CEO-03, CEO-04, CEO-05
**Success Criteria** (what must be TRUE):
  1. Human phone gate: the user, plus one reader outside finance, completes a full run on a real phone and signs off before any public deploy
  2. Swiping balances the 4 two-sided meters with aging drift, endings collect in a persistent 3x3 grid (undiscovered endings show "???"), and reaching the end screen shows the ending and a career summary and ticks the CEO game on the hub checklist
  3. Real-iPhone gate: swiping on iPhone Safari, including fast flicks and edge drags, never triggers pull-to-refresh, page scroll, or rubber-banding
  4. Release gate (re-verified): the X card preview is verified in X's Post Inspector, the gameplay clip and spoiler-free share text are ready, and the written self-audit is signed off by the user — all before posting
  5. Public-deploy gate (re-verified): `/ceo/` loads directly from a fresh URL on the preview deploy with zero 404s and zero CSP violations; the CEO game then goes live only on the user's explicit go-ahead, and a player with the previous build cached gets the new build and the newly unlocked CEO tile without clearing site data

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute 5 → 6 → 7 → 8. Phases 7 and 8 depend only on Phase 5 and could reorder relative to each other if a phone-feel pass finishes out of sequence; the planned release order (arcade → idle → swipe) holds otherwise.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 5. Consolidate + Shared Shell + Hub Checkpoint | 0/TBD | Not started | - |
| 6. Release 1 — Mr. Market Arcade | 0/TBD | Not started | - |
| 7. Release 2 — Snowball Idle | 0/TBD | Not started | - |
| 8. Release 3 — Barren-CEO Swipe | 0/TBD | Not started | - |
