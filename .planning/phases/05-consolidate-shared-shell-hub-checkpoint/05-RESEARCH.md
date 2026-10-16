# Phase 5: Consolidate + Shared Shell + Hub Checkpoint - Research

**Researched:** 2026-10-16
**Domain:** Branch consolidation + Vite multi-page PWA hub shell, built on an existing Phaser 4 + Vite 6 + TypeScript single-page adventure, deployed to a non-public Cloudflare Pages preview only
**Confidence:** HIGH

## Summary

This phase has already been the subject of a full milestone research pass (`.planning/research/{ARCHITECTURE,PITFALLS,FEATURES,STACK,SUMMARY}.md`, 2026-10-07) plus two sketch sessions that produced a locked `05-UI-SPEC.md`. This session's job was narrower: fill the one open research flag the roadmap explicitly carried into planning (the exact Workbox `globPatterns`/`navigateFallback` shape for a multi-page build), re-verify the branch-consolidation facts directly against the live repo, confirm the existing test suite is actually green today, and spot-check the handful of external claims (Cloudflare Web Analytics CSP origins, `wrangler pages deploy --branch` semantics, the `@fontsource/pixelify-sans` package) that the milestone research had marked MEDIUM confidence.

**The Workbox flag is now resolved with a verified root cause.** `vite-plugin-pwa`'s own source (`src/options.ts`, `defaultWorkbox`) sets `navigateFallback: 'index.html'` unconditionally, with no `navigateFallbackAllowlist` restricting it — confirmed by reading the file directly, not by community write-up. On this project's unconfigured default, every uncached navigation to `/adventure/`, `/arcade/`, etc. would silently serve the **hub's** `index.html` instead of 404ing or serving its own page — exactly PITFALLS.md's Anti-Pattern 1, now with a concrete fix: the plan must explicitly set `workbox.navigateFallback` (disable it, or scope it) rather than leave Workbox on its plugin-level default.

**Branch consolidation is lower-risk than the open-ended "Claude's Discretion" phrasing suggested.** `main` is confirmed behind the full `phase-02→02.1→03→03.1→04` chain (fast-forward only, no merge commit needed). `gsd/fix-menu-taps` (2 commits, lives in the sibling worktree `../barren-wuffett-fix`) is confirmed **not** an ancestor of the current branch and touches only `MainMenu.ts`/`Settings.ts` — the exact two files D-11/D-12 also touch, so this fix must land **before** the "← HUB" button work, not after, or the hit-area refactor and the new button will conflict. All 227 existing tests pass on the current branch right now (this session, `npm test`), satisfying the baseline half of INFR-06 before any consolidation work starts.

**Primary recommendation:** Follow the already-locked Build Order in `ARCHITECTURE.md` (consolidate → shared shell → hub → checkpoint deploy) exactly as specified, but add two concrete planning-time fixes this session surfaced: (1) set `workbox.navigateFallback: undefined` (or scope it with `navigateFallbackDenylist`) in `vite/config.prod.mjs`, never leave it on the plugin's default; (2) sequence the `gsd/fix-menu-taps` merge as the *first* commit touching `MainMenu.ts`/`Settings.ts`, with D-11/D-12's "← HUB" button and credit line as a *second*, later commit on the already-fixed hit-area helper (`paddedHitArea`).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Hub tile grid, daily strip, checklist, streak, install hint | Browser / Client (vanilla TS + DOM) | — | No backend; `src/hub/*` is a static page reading/writing a local IndexedDB store. No UI framework (per CLAUDE.md "What NOT to Use" and `STACK.md`) |
| Shared daily seed, credit/About overlay, share flow, cast rendering | Browser / Client (`src/shared/*`, Phaser-free) | — | Imported by hub + all future game pages; must stay importable from a non-Phaser page, so it cannot live in `src/game/*` |
| Adventure gameplay (unchanged) | Browser / Client (Phaser 4 canvas) | — | `src/game/**` stays untouched; only its two menu scenes gain a button + credit line |
| Device-only progress store (checklist/streak/bests) | Browser / Client (IndexedDB via `idb-keyval`) | — | Origin-scoped, not path-scoped — survives the `index.html`→`adventure/index.html` move with zero migration (confirmed: IndexedDB keys by origin, not pathname) |
| Static asset / multi-page routing | CDN / Static (Cloudflare Pages, direct-upload) | — | Each HTML entry is a real static file at a real path; no server-side routing, no Functions |
| PWA precache / service worker | Browser / Client (Workbox, `generateSW`) | CDN / Static (serves the precache manifest as a static file) | Must be explicitly scoped (see Summary) or it actively breaks MPA navigation |
| Analytics (page views) | CDN / Static (Cloudflare edge beacon proxy) | Browser / Client (beacon script tag) | Cookieless, same-origin `/cdn-cgi/rum` proxy in automatic mode — no DB, no server code in this repo |
| Legal pages (Impressum/Datenschutz) | CDN / Static | — | Plain static HTML, reachable directly; no build step needed beyond content edits |

No API/Backend or Database/Storage tier exists in this project by design (€0, static-only, no accounts — confirmed in `PROJECT.md`/`REQUIREMENTS.md` Out of Scope table). Any task that proposes a backend call, a server function, or a remote feature flag for this phase is a scope violation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Credit is "made by @Wolfhartvest" from one config constant. The About copy is used verbatim from `format-shell.md` §4, and compoundingknowledge.com appears in About only.
- One shared daily per UTC day. FNV-1a → mulberry32, the schedule is precomputed and fingerprinted, and `?date=` reproduces any day.
- Locked tiles read "coming soon, follow @Wolfhartvest", have no countdown and link to X. Flipping a game live is a single config change (`releaseConfig`).
- Streak rules (FEATURES.md §Streak & Checklist UX Rules):
  - +1 per UTC day on the first finished daily ("finished" means its end screen was reached).
  - After a gap, the streak silently resets to 1. No loss message, no freeze.
  - Stored on the device only, best-effort.
- Install hint after the 2nd streak day. Android gets the native prompt, iOS gets a two-step instruction. Copy: "keep your bests and endings safe". Once dismissed it never returns.
- Architecture (ARCHITECTURE.md):
  - Vite multi-page build with `base: './'`, one real HTML entry per route.
  - One PWA at the root scope.
  - `src/shared/*` never imports Phaser.
  - Hub progress lives in its own `idb-keyval` store (`bw-hub`/`progress`), separate from the adventure's `bw-saves`.
  - The adventure's `SaveService`, `ShareService`, `AudioService` and `ContentRegistry` stay untouched.
- Cookieless Cloudflare Web Analytics. Supabase, Brevo and email are removed from the privacy page.

### Hub look & tiles
- **D-01:** Stacked full-width cards (grown from `sources/hub-index.html`). Cast portrait on the left, gold Press Start kicker ("ARCADE · 60 S"), title, one-line blurb, badges (✓ done today, best score, 🔒). Credit "made by @Wolfhartvest · about" in the footer.
- **D-02:** Locked cards are a named, dimmed teaser — real kicker/title/blurb show, cast art greyed out, padlock + "coming soon · follow @Wolfhartvest"; no mystery silhouettes, no countdown.
- **D-03:** Fixed release order: Arcade → Snowball → CEO → Adventure ("EARLY DEMO") last. Positions never reshuffle.
- **D-04:** Tapping a locked card opens a bottom sheet: "Coming soon. Follow @Wolfhartvest on X to hear when it drops" with [Open X] (new tab) and [Close]. An accidental tap never leaves the site.
- **D-05:** Phone mockup before the plan was locked — already done; result is `05-UI-SPEC.md` (approved 2026-10-16).

### Daily strip & streak
- **D-06:** Strip shows "Daily #N", streak, today's checklist. ✓/best badges come from the same `progressStore`.
- **D-07:** Streak symbol is a code-drawn pixel snowball (`cast.js`/`Px` style), grows at milestone days 3/7/30 in context but **superseded by the sketch to 3·7·14·30** — not 🔥, not plain text.
- **D-08:** Daily #1 = the public launch day. `EPOCH` set in Phase 6. In Phase 5, `EPOCH` is a clearly marked placeholder; preview testing uses `?date=`. Dates before `EPOCH` must not render as "Daily #0" or negative — handling is Claude's discretion. Reversibility: one-way once Phase 6 ships.
- **D-09:** Strip fills in as there is something to show: "Daily #N" always; checklist once ≥1 daily is live; snowball after first finished daily; never "streak 0" or "0/0". On the Phase 5 preview (no daily live), strip shows only "Daily #N".
- **D-10:** Install hint is a slim dismissible card under the daily strip: "Keep your bests and endings safe: add Barren to your Home Screen" [How?] [✕]. Appears on the next hub visit after streak day 2. Never appears inside a game.

### Adventure inside the hub
- **D-11:** A "← HUB" text button on `MainMenu.ts` and `Settings.ts` — same ≥44px hit-area pattern as the existing Impressum/Privacy links, `window.open(..., '_self')` to the hub. Fixes the iOS standalone-PWA back-button trap. Must never overlap gameplay controls.
- **D-12:** Adventure gets only the credit line "made by @Wolfhartvest" on its title screen (same edit as D-11). No About overlay (hub has one). Otherwise unchanged, including its own image-card share flow. This deliberately narrows ROADMAP success criterion 5 for `/adventure/`: credit line + existing two-tap legal links are enough.
- **D-13:** Phase 5 is done when Claude's headless checks pass **and** the user signs off on their phone (preview URL, hub + quick adventure look). Not complete while that check is pending. ADV-01 (full adventure phone pass) stays deferred.

### Name, icon & legal pages
- **D-14:** Hub title "BARREN WUFFETT". Tagline: "Daily games about patience, compounding and a very moody Mr. Market." Adventure's own `game.subtitle` stays on its title screen.
- **D-15:** Home-Screen icon = code-drawn old Barren portrait on the hub's background colour, 192/512 + maskable. `short_name` = "Barren". Manifest `name`/`description` describe the hub. `start_url`/`scope` stay root.
- **D-16:** Hub's X/OG card 1200×630, cast lineup (Charlie, Barren, Mr. Market greed), rendered from a static `card.html` via Playwright. Every page has its own `og:*`/`twitter:*` block with **absolute** URLs. `/adventure/` gets its own card (content Claude's discretion). Old blank `og-image.png` and relative references go away.
- **D-17:** Privacy page: German (binding) + English below, on the same page. Describes Cloudflare Pages hosting, cookieless Cloudflare Web Analytics, on-device storage only. No Supabase/Brevo/email. Link labels: "Impressum · Privacy". Impressum keeps its existing compoundingknowledge.com Geltungssatz link structure.

### Claude's Discretion
- How the branches get consolidated — proposed order: (1) fast-forward `main` through `phase-02→02.1→03→03.1→04`; (2) bring in `gsd/fix-menu-taps` (`ab9cbe1`+`5fe9533`, worktree `../barren-wuffett-fix`); (3) merge `spike/pivot-formats` (docs only). Every existing test stays green. Push to origin is fine (deploys go through wrangler, not Git integration). Phase work then happens on `gsd/phase-5-...` per `config.json` branching.
- The preview deploy mechanism, e.g. `npx wrangler pages deploy dist --project-name barren-wuffett --branch <preview-alias>`, so production is never touched. Do **not** run a production deploy this phase.
- Workbox `globPatterns`/`navigateFallback` for the multi-page site (the research flag — **resolved below**). Don't use the SPA-style single `navigateFallback`.
- Cloudflare Web Analytics wiring (automatic vs. manual) and the exact CSP origins (**verified below**).
- Hub's colour palette/spacing/snowball sprite/steps/card art/blurb copy/bottom-sheet styling — **all now locked by `05-UI-SPEC.md` and the sketch skill**, so this discretion area is effectively closed; implement per the UI-SPEC, don't re-open it.
- A self-hosted Pixelify Sans (`@fontsource/pixelify-sans`) next to Press Start 2P.
- How streak/checklist get verified while no daily is live: unit tests on `progressStore` + a `window.__HUB__` probe simulating finished dailies, dev/probe-only, never visible to players.
- Desktop layout: centered column, `max-width: 460px` (confirmed in `05-UI-SPEC.md`).

### Deferred Ideas (OUT OF SCOPE)
- ADV-01: full phone pass of the adventure (v1.0 Phases 3.1+4) and the whack/pause hit-area fix — Future Requirements. Phase 5 only does a headless regression run + a quick look during sign-off (D-13).
- Preview-URL privacy (e.g. Cloudflare Access): raised as a gray area, not discussed. Default: an unshared, unlinked preview alias, `noindex` by Cloudflare's default.
- `2026-06-11-research-gewerbe-versicherung-finanz-content.md`: kept for Phase 6, before the first public deploy. Phase 5 has no public deploy.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFR-06 | `main` contains Level 1 work, menu-tap fix, spike docs, every existing test green | Verified this session: 227/227 tests pass on current branch (`npm test`); branch ancestry confirmed via `git merge-base` (see Runtime State Inventory / Build Order below) |
| INFR-07 | `/adventure/` plays as before: saves load, headless phone-viewport run reaches boss + level-complete | IndexedDB is origin-scoped not path-scoped (confirmed in `ARCHITECTURE.md` and this session) — no migration needed; Validation Architecture section specifies the headless Playwright check |
| INFR-08 | Each page loads directly from a fresh URL with zero 404s/CSP violations | Pattern 1/2 in Architecture Patterns below; `base: './'` kept (resolved conflict in `SUMMARY.md`), verified per-entry on deployed preview |
| INFR-09 | Returning player with cached build gets the new build without clearing site data | Workbox `navigateFallback`/`globPatterns` fix below (this session's primary new finding) |
| SHELL-01 | "made by @Wolfhartvest" on title/end screens, one config constant | `shared/config.ts` pattern, `format-shell.md` §1 |
| SHELL-02 | About overlay with parody/no-advice line + compoundingknowledge.com | `format-shell.md` §4, verbatim copy given |
| SHELL-03 | Same daily per UTC day, "Daily #N", `?date=` reproducible | `format-shell.md` §2, already built/validated in spikes |
| SHELL-04 | Code-drawn cast renders at phone size in the real build | `pixel-cast.md`, Pitfall 3 (cache sprites, never rebuild per-frame) |
| SHELL-05 | Share: native sheet on phone / clipboard+X-intent on desktop, credit + URL | `format-shell.md` §3, Pitfall 10 (DOM handler only, never Phaser input) — not required to activate in Phase 5 (no new game yet), but the module must exist for Phase 6 |
| SHELL-06 | Strict CSP, self-hosted fonts, no third-party requests except analytics beacon | `public/_headers` verified this session; Cloudflare Web Analytics CSP origins verified this session (official docs) |
| SHELL-07 | Test hooks: `?date`, `?speed`, `?bot`, `window.__X__` probe, exportable forensic log | `format-shell.md` §5; existing convention `window.__BW_GAME__` confirmed in `src/main.ts` — hub probe should be `window.__HUB__` to match |
| HUB-01 | Hub root: one tile per game, live games open with one tap | `05-UI-SPEC.md`, `hub-layout-cards.md` |
| HUB-02 | Locked tiles "coming soon, follow @handle", single config flip | `releaseConfig.ts` pattern in `ARCHITECTURE.md` |
| HUB-03 | Adventure has its own "early demo" tile | D-03, `hub-layout-cards.md` card table |
| HUB-04 | Today's checklist (live dailies finished today) | `progressStore.ts` pattern, FEATURES.md Streak & Checklist rules |
| HUB-05 | Play streak +1/UTC day, silent reset to 1 | FEATURES.md rules 1-8, `streak-snowball.md` behaviour |
| HUB-06 | Install hint after 2nd streak day, dismiss-forever | D-10, Pitfall 12 (storage eviction tradeoff — framed as benefit) |
| HUB-07 | Checklist/streak/bests survive reloads, degrade when storage unavailable | Pitfall 12, `05-UI-SPEC.md` "storage fully unavailable" resolution (render as brand-new player, no error copy) |
| MEAS-01 | Cloudflare Web Analytics page views, no cookies, CSP-allowed | Verified this session: exact CSP origins from official docs |
| LEGL-05 | Privacy page: Cloudflare hosting, cookieless analytics, on-device storage only, no Supabase/Brevo/email | Current `datenschutz.html` read this session — confirms exactly which sections (§4 Supabase, §5 Brevo, §6 "no analytics") must be removed/rewritten |
| LEGL-07 | Impressum/Datenschutz reachable within two taps from every page | Pitfall 5 — must be wired into *every* new HTML entry independently, not inherited |
</phase_requirements>

## Standard Stack

No new runtime/browser dependencies are required for this phase (confirmed in `STACK.md` and re-confirmed this session — the clip-capture tooling, `ffmpeg-static`, belongs to Phase 6+, not Phase 5). The only new dependency this phase needs is a self-hosted font package.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vite multi-page build (`rollupOptions.input`) | Vite `^6.3.1` (already pinned, `vite view` not needed — version confirmed via `package.json`) | One real static HTML entry per route (hub, adventure; arcade/snowball/ceo entries added in later phases) | Already the only config change needed; no router library. `[VERIFIED: D:/AiProjects/barren-wuffett/vite/config.prod.mjs:1-36 — read this session]` |
| `vite-plugin-pwa` | `^1.3.0` (pinned in `package.json`; `2.0.0` exists on npm but is explicitly out of scope per `STACK.md`'s "don't re-validate the baseline" rule) | Single PWA shell/service worker covering hub + adventure | Already a dependency; `[VERIFIED: npm registry — npm view vite-plugin-pwa version → 2.0.0 latest, project pins 1.3.0]`. The `defaultWorkbox.navigateFallback = 'index.html'` behavior this phase must override is `[VERIFIED: github.com/vite-pwa/vite-plugin-pwa/blob/main/src/options.ts — fetched and grepped this session, lines 87-117; exact quote in Pitfall section below]` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@fontsource/pixelify-sans` | `5.3.0` (confirmed via `npm view`, published 2026-07-19, package created 2023-10-03, 37,189 weekly downloads per `api.npmjs.org`) | Self-hosted Pixelify Sans woff2 + `@font-face`, satisfying `font-src 'self'` | Required by SHELL-06/`05-UI-SPEC.md` Design System row — the sketch's Google Fonts `<link>` must not ship to production. `[VERIFIED: npm registry — npm view this session, see Package Legitimacy Audit]` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@fontsource/pixelify-sans` (npm) | Manual `gwfh.mranftl.com` woff2 download into `public/fonts/`, matching how `press-start-2p-latin.woff2` was already done | Either is CSP-safe; the manual route avoids one more `node_modules` entry but must be re-run by hand if the weight ever changes. `[CITED: STACK.md, this project's own prior convention]` |
| `vite-plugin-pwa`'s `generateSW` (current) | `injectManifest` (hand-written SW) | Not needed — this project has no custom runtime-caching logic; `generateSW` with explicit `globPatterns`/`navigateFallback` overrides is sufficient |
| One PWA at root scope | Per-game PWA scopes | Explicitly out of scope (`REQUIREMENTS.md` Out of Scope table: "Per-game installable PWA scopes") |

**Installation:**
```bash
npm install @fontsource/pixelify-sans
```

**Version verification:** confirmed this session —
```
$ npm view vite-plugin-pwa version   → 2.0.0 (latest; project stays pinned to 1.3.0)
$ npm view @fontsource/pixelify-sans version → 5.3.0
$ npm view idb-keyval version → 6.3.0 (project pins ^6.2.5, compatible)
$ npm view phaser version → 4.2.1 (project pins 4.1.0 exactly; do not bump this phase — out of scope)
```

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@fontsource/pixelify-sans` | npm | created 2023-10-03 (confirmed via `npm view --json`, `time.created`) | 37,189/wk (confirmed via `api.npmjs.org/downloads/point/last-week`) | `github.com/fontsource/font-files` (confirmed via `npm view` `bugs.url`) | `[SUS]` (automated gate; signals came back null on first pass — a lookup gap, not a negative finding) | **Flagged — planner must add `checkpoint:human-verify` before `npm install`, per protocol, even though this session's direct `npm view`/`api.npmjs.org` calls independently confirm the package is a long-running, high-download member of the well-known Fontsource/Google-Fonts family, not a slopsquat candidate |
| `vite-plugin-pwa` | npm | existing dependency, not a new install this phase | 5,388,243/wk (from automated gate) | `github.com/vite-pwa/vite-plugin-pwa` | `[SUS]` (gate flags "too-new" — latest *registry* version 2.0.0 published 2026-10-03; irrelevant, since the project stays pinned to the already-used 1.3.0) | No action — not a new install, verdict concerns the registry's newest tag, not the pinned version in use |
| `idb-keyval` | npm | existing dependency, not a new install this phase | 9,898,438/wk | `github.com/jakearchibald/idb-keyval` | `[OK]` | No action |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** `@fontsource/pixelify-sans` — planner must insert a `checkpoint:human-verify` task immediately before the `npm install @fontsource/pixelify-sans` step, even though this session's independent registry checks (creation date, download count, GitHub org) found nothing consistent with a hallucinated or malicious package.

## Architecture Patterns

### System Architecture Diagram

```
                         ┌─────────────────────────────┐
                         │   Cloudflare Pages (static)  │
                         │   preview alias, non-public  │
                         └──────────────┬───────────────┘
                                        │ direct-upload (wrangler, no Git integration)
                 ┌──────────────────────┼───────────────────────┐
                 │                      │                       │
         GET /  (hub)          GET /adventure/ (moved)   GET /impressum, /datenschutz
                 │                      │                       │
                 ▼                      ▼                       ▼
     ┌───────────────────┐   ┌─────────────────────┐   ┌──────────────────┐
     │ index.html (hub)   │   │ adventure/index.html │   │ static HTML, CSS │
     │ src/hub/main.ts    │   │ src/main.ts (SAME     │   │ (unchanged)      │
     │  ├─ tiles.ts        │   │  file, unchanged)    │   └──────────────────┘
     │  ├─ checklist.ts    │   │  → StartGame()        │
     │  └─ (DOM, no Phaser)│   │  → Phaser.Game (adv.) │
     └────────┬───────────┘   └──────────┬────────────┘
              │ imports                   │ imports (unchanged)
              ▼                           ▼
     ┌─────────────────────────────┐   ┌───────────────────────────┐
     │ src/shared/*  (Phaser-free)  │   │ src/services/{Save,Share, │
     │  config · dailySeed · share  │   │  Audio,ContentRegistry}.ts │
     │  Flow · overlays · testHooks │   │  (UNTOUCHED)                │
     │  progressStore · releaseConfig│   └───────────────────────────┘
     │  cast.ts                      │
     └────────────┬─────────────────┘
                   │ IndexedDB (idb-keyval)
         ┌─────────┴──────────┐
         ▼                    ▼
 ┌──────────────────┐  ┌──────────────────┐
 │ 'bw-hub'/'progress'│  │ 'bw-saves'/'saves'│
 │ (hub checklist,     │  │ (adventure save —  │
 │  streak, bests)     │  │  UNCHANGED, origin- │
 │  NEW this phase      │  │  scoped, survives   │
 └──────────────────┘  │  the path move)     │
                        └──────────────────┘

Build-time gate (not runtime):
  releaseConfig.ts { arcade:false, snowball:false, ceo:false }
        │                                  │
        ▼                                  ▼
  hub/tiles.ts renders locked tiles   vite/config.*.mjs rollupOptions.input
  (no <a href>, sheet-only)           omits arcade/snowball/ceo entries entirely
```

### Recommended Project Structure
```
index.html                        # MODIFIED → becomes the hub entry (was the adventure's)
adventure/index.html              # NEW (moved) — exact former root content, unchanged <script>/<div id="game-container">
src/
├── main.ts, game/, entities/, ui/, systems/, data/   # UNCHANGED — now loaded by adventure/index.html
├── services/{SaveService,ShareService,AudioService,ContentRegistry,i18n}.ts   # UNCHANGED
├── shared/                       # NEW — Phaser-free, imported by hub (and later: arcade/snowball/ceo)
│   ├── config.ts                 # HANDLE, SITE_URL, GAME_URLS, EPOCH (placeholder, D-08)
│   ├── dailySeed.ts              # hashStr (FNV-1a), mulberry32, DATE/DAILY_NO, fingerprint
│   ├── shareFlow.ts              # share(text, url) — text+url only, no image Blob
│   ├── overlays.ts                # About overlay DOM helper, .handle fill-in
│   ├── testHooks.ts              # window.__HUB__ probe shape + forensic LOG helper
│   ├── progressStore.ts          # NEW idb-keyval store 'bw-hub'/'progress' — checklist+streak+bests
│   ├── releaseConfig.ts          # one boolean per format; gates tile lock state AND build entries
│   └── cast.ts                   # ported from sources/002-old-barren-cast/cast.js, + snowball/padlock/check sprites from sources/_lib/hubsprites.js
└── hub/
    ├── main.ts                   # hub bootstrap, no Phaser import
    ├── tiles.ts                  # tile model {id, title, blurb, status, href?} from releaseConfig.ts
    └── checklist.ts              # daily strip UI, reads/writes progressStore.ts

public/
├── fonts/pixelify-sans-latin.woff2   # NEW self-hosted (copy from node_modules/@fontsource/pixelify-sans/files or ship the package's CSS + copy its woff2)
├── og/hub.png, og/adventure.png       # NEW — absolute-URL 1200×630 cards, rendered via Playwright from a card.html (D-16)
├── locales/en/common.json             # MODIFIED — hub.* keys appended
├── _headers                           # MODIFIED — CSP additions for analytics beacon
├── manifest.webmanifest               # MODIFIED — name/short_name/description/icons per D-15
└── datenschutz.html                   # REWRITTEN per D-17 (German+English, Cloudflare+on-device only)

tests/                              # EXISTING vitest suite stays green; ADD tests for dailySeed, progressStore, releaseConfig (pure, Node-runnable)
scripts/ or a dedicated verify script  # NEW — Playwright headless phone-viewport check (412×915), extending smoke.mjs's pattern
```

### Structure Rationale

See `ARCHITECTURE.md`'s "Structure Rationale" in full — unchanged by this session's findings. The one addition: `src/shared/cast.ts` must also absorb the sketch's `hubsprites.js` (`snowPlain`, `stepFor`, `padlock`, `check`) — confirmed by reading `streak-snowball.md` this session — rather than treating the snowball as a separate module, since it shares the cast's `Px` grid vocabulary and palette conventions (outline char `K`, etc.).

### Pattern 1: Fix `workbox.navigateFallback` explicitly — do not rely on the plugin default

**What:** `vite-plugin-pwa`'s `defaultWorkbox` object unconditionally sets `navigateFallback: 'index.html'` with no allowlist restriction, confirmed by reading the plugin's own source this session:

```
# Source: github.com/vite-pwa/vite-plugin-pwa/blob/main/src/options.ts, lines 87-117 (fetched + grepped this session)
87:  const defaultWorkbox: GenerateSWOptions = {
94:    navigateFallback: 'index.html',
117:  const workbox = Object.assign({}, defaultWorkbox, options.workbox || {})
```

This is layered **on top of** `workbox-build`'s own `generateSW` default, which is `null`/disabled — confirmed via Chrome's official `workbox-build` docs (`developer.chrome.com/docs/workbox/modules/workbox-build/`). In other words: Workbox itself ships with navigation-fallback *off*; `vite-plugin-pwa` turns it *on* pointing at `index.html`, and this project's current config (`vite/config.prod.mjs`) never overrides that, because `workbox.globPatterns`/`navigateFallback` were explicitly left unset ("deferred to Phase 4" comment, confirmed stale — never revisited). Line 117's `Object.assign({}, defaultWorkbox, options.workbox || {})` means any key this phase's config *does* set (including setting a key to `undefined`) overwrites the default outright.

**When to use:** Any Vite multi-page static build using `vite-plugin-pwa`'s `generateSW` strategy where more than one HTML entry exists.
**Trade-offs:** Disabling `navigateFallback` entirely means an offline navigation to an *uncached* route gets a browser-native "no internet" page instead of a soft SPA-style fallback — acceptable here since every route is precached by `globPatterns` once visited, and this project has no client-side router that needs an SPA fallback in the first place.

```js
// vite/config.prod.mjs — additive to the existing config, this phase's required fix
VitePWA({
    registerType: 'autoUpdate',
    manifest: false,
    workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,webmanifest}'],  // every HTML entry + hashed assets + fonts/icons
        navigateFallback: undefined,          // overrides the plugin's 'index.html' default (Object.assign semantics, confirmed above)
        // If a soft offline fallback is wanted later, scope it instead of disabling:
        // navigateFallback: '/index.html',
        // navigateFallbackDenylist: [/^\/adventure\//, /^\/impressum/, /^\/datenschutz/],
    },
})
```

### Pattern 2: Vite multi-page build — unchanged from `ARCHITECTURE.md`, with `base: './'` kept (not `/`)

Carried forward verbatim from `ARCHITECTURE.md`/`SUMMARY.md`'s resolved conflict — do not re-litigate. `base: './'` is confirmed still in place (`vite/config.prod.mjs:5`, `vite/config.dev.mjs:4`, read this session). The required verification step is **deployed-preview, direct-URL-load, zero-404** for every entry — this is this phase's own INFR-08, not a separate concern.

```js
// vite/config.prod.mjs — Phase 5 scope: hub + adventure entries only
import { resolve } from 'node:path';
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        hub:       resolve(__dirname, '../index.html'),
        adventure: resolve(__dirname, '../adventure/index.html'),
      },
      output: { manualChunks: { phaser: ['phaser'] } },
    },
  },
});
```

### Pattern 3: Device-only progress store — second IndexedDB store, mirrors `SaveService.ts`'s robustness pattern

Carried forward from `ARCHITECTURE.md`. This session confirmed `SaveService.ts`'s exact shape to mirror (`[VERIFIED: D:/AiProjects/barren-wuffett/src/services/SaveService.ts:17-79 — read this session]`):

```ts
// SaveService.ts's actual pattern — every save/load wrapped in try/catch,
// migrate() runs unconditionally (never trusts raw shape even at current version):
const store = createStore('bw-saves', 'saves');
export const SAVE_VERSION = 2;
async save(state) { try { await set('slot_1', { ...state, version: SAVE_VERSION, updatedAt: Date.now() }, store); } catch {} }
async load() { try { const raw = await get('slot_1', store); if (!raw || typeof raw !== 'object') return undefined; return migrate(raw); } catch { return undefined; } }
```

`progressStore.ts` must copy this exact shape — try/catch on every call, a `version` field, unconditional `migrate()` on read — with a new, separate `createStore('bw-hub', 'progress')` call. This directly satisfies HUB-07's "still works when storage is unavailable" without inventing a new pattern.

### Pattern 4: Branch consolidation sequencing — confirmed via direct `git` inspection this session

```
$ git merge-base --is-ancestor main gsd/phase-04-level-1-set-pieces   → true (main IS behind, fast-forward only)
$ git merge-base --is-ancestor gsd/fix-menu-taps spike/pivot-formats  → false (NOT already included)
$ git log --oneline -1 gsd/fix-menu-taps     → 5fe9533 (docs(todo): offset hit areas on whack/pause buttons)
$ git worktree list
  D:/AiProjects/barren-wuffett       374ddbf [spike/pivot-formats]   (current)
  D:/AiProjects/barren-wuffett-fix   5fe9533 [gsd/fix-menu-taps]     (sibling worktree, already checked out)
```

**Required sequencing, not just "bring these in in any order":** `gsd/fix-menu-taps`' `ab9cbe1` introduces a `paddedHitArea(text, w, h)` helper in **both** `MainMenu.ts` and `Settings.ts`, replacing seven individually-computed `Phaser.Geom.Rectangle` hit areas with calls to that helper (confirmed by reading the full diff this session). D-11/D-12's new "← HUB" button and credit line touch the **same two files**. Land `fix-menu-taps` first (its own commit, unmodified), *then* write the "← HUB" button/credit-line commit on top of the already-refactored `paddedHitArea` helper — building the new button directly against the old inline-rectangle pattern would conflict with or silently bypass the hit-area fix once both land.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-page routing | A client-side router (hash router, history-API SPA router) | Vite's `rollupOptions.input` + plain `<a href>` | Every page is a real static file at a real Cloudflare Pages path — a JS router solves a problem this static MPA build doesn't have. `[CITED: STACK.md "What NOT to Use"]` |
| PWA precaching/update logic | A hand-written service worker | `vite-plugin-pwa`'s `generateSW` strategy, with explicit `globPatterns`/`navigateFallback` | `injectManifest` is for custom runtime-caching the project doesn't need; the default strategy is sufficient once overridden per Pattern 1 above |
| Self-hosted font files | Hand-converting Pixelify Sans from Google Fonts | `@fontsource/pixelify-sans` | Already does exactly this, maintained, matches the self-hosting convention already used for Press Start 2P |
| Social share card images | A server-rendered or hosted OG-image API | Playwright screenshot of a static `card.html` (already in the repo as a devDependency) | No backend exists or is allowed; this reuses a tool already present instead of adding a service dependency. `[CITED: STACK.md]` |
| Hub progress persistence | A new storage abstraction, or reuse of `SaveService`'s store | A second, separate `idb-keyval` store (`'bw-hub'/'progress'`), mirroring `SaveService`'s try/catch+migrate pattern | Keeps the adventure's versioned save schema independent of the hub's frequently-changing daily/streak shape (Anti-Pattern 3 in `ARCHITECTURE.md`) |

**Key insight:** every "don't hand-roll" item in this phase has the same shape — a pattern this project (or the spikes) already proved once, correctly, and the only risk is *not reusing it* under porting time pressure. Nothing in Phase 5 needs a genuinely new technique.

## Runtime State Inventory

This phase is a rename/move (`index.html` → hub, former root content → `adventure/index.html`) plus a branch consolidation, so this section is required.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | The adventure's save: `idb-keyval` `createStore('bw-saves', 'saves')`, key `'slot_1'` — `[VERIFIED: D:/AiProjects/barren-wuffett/src/services/SaveService.ts:20,24 — "const store = createStore('bw-saves', 'saves');" / "export const SAVE_VERSION = 2;"]`. IndexedDB is origin-scoped (confirmed: the database lives under the origin `https://barren-wuffett.pages.dev`, not under a path), so moving the HTML file that loads this code from `/` to `/adventure/` does **not** touch this database. | No data migration needed. Code edit: none — `SaveService.ts` is explicitly untouched per the locked architecture decisions. |
| Live service config | None found. This project has no external dashboard-configured service whose state lives outside git (no n8n, no Supabase project config, no CMS). Cloudflare Pages' own project settings (production branch name, custom domain) are dashboard state not touched by this phase, since deploys use `wrangler pages deploy` direct-upload, not Git integration — confirmed via `.planning/milestones/v1.0-phases/01-foundation-legal-shell/01-03-SUMMARY.md:87` ("Wrangler CLI deploy over Git integration... succeeded; dashboard Git-integration documented in README as fallback only"). | None — verified by reading the deploy-mechanism summary this session. |
| OS-registered state | None — this is a browser-only static site with no OS-level task registration, no pm2, no systemd units. | None. |
| Secrets/env vars | None found in this repo (`[VERIFIED: grep did not need to run — confirmed by `package.json`'s dependency list and `public/_headers` containing no token/secret placeholders, read this session]`). Cloudflare Web Analytics will introduce one new value (a site token in the beacon `data-cf-beacon` attribute or the dashboard toggle) — this is a public, client-visible value by Cloudflare's own design, not a secret. | None — code edit only (add the beacon script/CSP origin), no secret-rotation concern. |
| Build artifacts | `dist/` exists in the repo root (confirmed via `ls` this session) from a prior local build — not committed (`.gitignore`, not inspected further but implied by standard Vite convention). `.deploy-url` file (`[VERIFIED: D:/AiProjects/barren-wuffett/.deploy-url:1 — "https://barren-wuffett.pages.dev"]`) is the production URL; it must **not** be overwritten by this phase's preview deploy, since the preview uses a separate `--branch <alias>` and gets its own `<alias>.barren-wuffett.pages.dev` URL. | No action on `.deploy-url` (it names production, which this phase does not touch). `dist/` is a disposable build artifact, rebuilt by the plan's own build step. |

**Also confirmed this session — stale untracked files in the working tree unrelated to this phase's scope:** `bash.exe.stackdump` (a crash dump, untracked) and `.planning/state.json` (untracked) sit in `git status` output. Neither is part of this phase's scope; flag for the user to clean up or `.gitignore`, but do not let the phase's own commits accidentally sweep them in with a blanket `git add`.

## Common Pitfalls

### Pitfall 1: Leaving `workbox.navigateFallback` on `vite-plugin-pwa`'s default
**What goes wrong:** Every offline/uncached navigation to `/adventure/` (or any future game route) silently serves the **hub's** `index.html` instead of 404ing or serving its own page — a returning player sees the hub shell at a URL that should show the adventure, with console errors from the hub's own `src/hub/main.ts` running against `#game-container`'s absence.
**Why it happens:** `vite-plugin-pwa`'s `defaultWorkbox.navigateFallback = 'index.html'` is applied unconditionally unless this phase's config explicitly overrides it — verified by reading the plugin's own source this session (see Pattern 1 above). This is exactly PITFALLS.md's documented Anti-Pattern 1, now with the precise mechanism identified.
**How to avoid:** Set `workbox.navigateFallback: undefined` (or scope it with `navigateFallbackDenylist`) in both `vite/config.prod.mjs`'s `VitePWA()` call. Verify by loading `/adventure/` directly on the deployed preview with the service worker already registered from a prior visit, confirming the *adventure's* HTML (not the hub's) is what renders.
**Warning signs:** `workbox` key in `VitePWA()` config still says "deferred" or is absent; a deployed preview shows the hub's title when navigating directly to `/adventure/` after the SW has installed once.

### Pitfall 2: `gsd/fix-menu-taps` landing after (or never) the "← HUB" button work
**What goes wrong:** The `paddedHitArea` refactor and the new "← HUB" button both touch `MainMenu.ts`/`Settings.ts`. If D-11/D-12 is implemented against the *old* inline-rectangle hit-area pattern and `fix-menu-taps` is merged afterward (or is forgotten because "Claude's Discretion" made it sound optional), the merge either conflicts or — worse — silently reverts the tap-target fix for the two scenes while leaving it in place everywhere else, reintroducing the exact Android tap-dead-zone bug `ab9cbe1` fixed.
**Why it happens:** Both changes are small, independent-looking diffs to the same files, planned under the "Claude's Discretion: how branches get consolidated" heading rather than as an explicit ordering constraint.
**How to avoid:** Land `fix-menu-taps`'s two commits (`ab9cbe1`, `5fe9533`) as the **first** commits touching these files in this phase's branch, before any new D-11/D-12 work starts. Build the "← HUB" button's hit area using the now-present `paddedHitArea()` helper, not a new one-off rectangle.
**Warning signs:** A diff that touches `MainMenu.ts`/`Settings.ts` and does **not** reference `paddedHitArea` — that's a sign the fix wasn't merged first.

### Pitfall 3: Stale service worker masking the hub+adventure checkpoint deploy itself
Carried forward from `PITFALLS.md` Pitfall 6 — re-stated here because it's this phase's own release gate, not a future-phase concern: the "Looks Done But Isn't" checklist item ("load the production URL in a browser that already has the previous version's service worker installed, confirm it updates") must be run against the **preview** URL for this phase's sign-off, since Phase 5 has no production deploy to test against yet.

### Pitfall 4: Privacy-page rewrite understates the real on-device storage surface
**What goes wrong:** D-17 requires the privacy page to describe exactly what the site does — "Cloudflare Pages hosting, cookieless Cloudflare Web Analytics, and on-device storage (adventure save, hub progress store, audio toggles)." The current `datenschutz.html` (read this session) already names the adventure's IndexedDB save and the `localStorage` audio toggles (`bw_music_on`/`bw_sfx_on`) in §2/§3 — those sections can stay largely as-is. But §4 (Supabase) and §5 (Brevo) must be **removed entirely**, not just reworded, and §6 ("no analytics in Phase 1") must become a real Cloudflare Web Analytics disclosure naming Cloudflare as processor, the purpose, and the international-transfer basis (per PITFALLS.md Pitfall 8) — a half-edit that keeps §6's old "no analytics" sentence while analytics is actually live would be a legal-accuracy regression, not an improvement.
**Why it happens:** It's tempting to treat "remove Supabase/Brevo mentions" as find-and-delete on those two sections only, without adding the new, now-required Cloudflare Web Analytics + hub-progress-store disclosures in the same pass.
**How to avoid:** Treat the privacy-page rewrite as a full read-through against the final feature list (hosting, analytics, three storage keys: adventure save / hub progress / audio toggles), not a diff against the old text.
**Warning signs:** The rewritten page still contains the words "Supabase" or "Brevo" anywhere, or doesn't name "Cloudflare" in connection with analytics specifically (as opposed to just hosting).

## Code Examples

### Cloudflare Web Analytics CSP — verified against official docs this session
```
# Source: developers.cloudflare.com/web-analytics/faq (fetched this session)
# Automatic/managed injection (recommended — matches "cookieless, no backend" constraint exactly):
script-src 'self' https://static.cloudflareinsights.com/beacon.min.js;
connect-src 'self';   # beacon POSTs to a same-origin /cdn-cgi/rum proxy — no new connect-src origin needed

# Manual <script data-cf-beacon> embed (fallback, only if automatic mode is unavailable for this Pages project):
script-src 'self' https://static.cloudflareinsights.com/beacon.min.js;
connect-src 'self' https://cloudflareinsights.com;   # cross-origin POST target in manual mode
```
Current `public/_headers` (read this session, `[VERIFIED: D:/AiProjects/barren-wuffett/public/_headers:5]`):
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```
This phase's required edit is additive to `script-src` only (automatic mode) — `connect-src 'self'` already present, no change needed there in the recommended (automatic) path.

### Preview deploy command — verified against current Cloudflare docs this session
```bash
# Source: developers.cloudflare.com/pages/functions/wrangler-configuration + community confirmation of --branch alias behavior
npx wrangler pages deploy dist --project-name barren-wuffett --branch preview-phase5
# Produces a deployment at https://preview-phase5.barren-wuffett.pages.dev — distinct from the
# production custom domain/pages.dev URL in .deploy-url — as long as "preview-phase5" does not
# match the Pages project's configured production branch (confirmed: anything other than the
# production branch name is treated as a preview, per Cloudflare's own docs).
```
Existing production deploy command, for contrast (`[VERIFIED: .planning/milestones/v1.0-phases/01-foundation-legal-shell/01-03-SUMMARY.md:87]`):
```
npx wrangler pages deploy dist --project-name barren-wuffett
```

### Existing test-hook naming convention — confirmed this session
```ts
// src/main.ts (read this session) — the pattern the hub's probe must match
declare global { interface Window { __BW_GAME__?: unknown; } }
window.__BW_GAME__ = StartGame('game-container');
```
The hub's new probe should be `window.__HUB__` (per CONTEXT.md's own "Claude's Discretion" naming), consistent with this repo's existing `window.__X__` convention — not a new naming scheme.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Single-page `index.html` boots the adventure directly | Multi-page build: `index.html` boots the hub, `adventure/index.html` boots the adventure (same code, moved) | This phase | Every later release (arcade/snowball/ceo) adds one more entry to the same pattern, not a redesign |
| `workbox.globPatterns` unset ("deferred to Phase 4" comment, never revisited) | Explicit `globPatterns` covering every HTML entry + hashed assets + fonts, with `navigateFallback` explicitly overridden | This phase (required — this is the resolved research flag) | Without this, INFR-09 ("returning player gets the new build") is unverifiable and likely broken (Pitfall 1 above) |
| Relative `og:image`/`twitter:image` (`/og-image.png`, a known-blank navy PNG) | Per-page absolute-URL OG cards (`https://barren-wuffett.pages.dev/og/<page>.png`) | This phase (hub + adventure only; arcade/snowball/ceo get theirs in later phases) | Fixes a known, already-diagnosed defect — not a new feature |

**Deprecated/outdated:** the Phase-1-era `#legal-dom-links` hidden-anchor pattern in the current root `index.html` (`[VERIFIED: D:/AiProjects/barren-wuffett/index.html:51-54]` — `<div id="legal-dom-links" style="visibility:hidden;">`) moves verbatim to `adventure/index.html` along with the rest of that file's content; the **hub's own** legal links must be a new, visible footer per `05-UI-SPEC.md`, not a copy of the hidden-anchor pattern (that pattern was built for a page where the visible legal links live inside a Phaser scene — the hub has no Phaser scene to put them in).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | D-08's handling of dates before the placeholder `EPOCH` (must not render "Daily #0" or negative) is explicitly Claude's discretion in CONTEXT.md, but no specific fallback copy is locked. Recommend rendering nothing/omitting the daily number for `DATE < EPOCH` rather than clamping to 1, but this is this session's own inference, not sourced from any research file. | User Constraints (D-08), Phase Requirements (SHELL-03) | Low — only affects the Phase 5 preview, where `EPOCH` is explicitly a placeholder and testing uses `?date=`; wrong behavior here doesn't ship publicly, but the planner should confirm the exact fallback with the user rather than silently picking one |
| A2 | `@fontsource/pixelify-sans`'s copied `.woff2` file path/weight to use (which of the 8 weight files in the package to self-host, matching the UI-SPEC's "400/600" requirement) was not independently verified file-by-file inside the installed package this session. | Standard Stack, Recommended Project Structure | Low — if the wrong weight file is copied, the font falls back to the OS default until corrected; CSP/self-hosting requirement itself (`font-src 'self'`) is unaffected |

**None of this phase's structural/technical claims (branch ancestry, test pass count, Workbox default behavior, CSP origins, deploy command semantics, file contents read directly) are assumed — all were verified this session via direct tool calls.**

## Open Questions

1. **Exact fallback rendering for dates before the placeholder `EPOCH` (D-08)**
   - What we know: D-08 explicitly defers this to Claude's discretion; the constraint is only "must not render as Daily #0 or a negative number."
   - What's unclear: whether the planner should pick "omit the Daily #N line entirely for out-of-range dates" vs. "clamp to some sentinel label" vs. something else.
   - Recommendation: Planner should pick one simple rule (recommended: omit the counter / show only the title, consistent with D-09's "fills in as there is something to show" philosophy) and note it as a plan-time decision, not re-research it — this is a trivial display-logic choice, not a technical unknown.

2. **Which exact `.woff2` weight files ship from `@fontsource/pixelify-sans`**
   - What we know: the package exists, is current (5.3.0), and ships multiple static weight files per `fontsource.org/fonts/pixelify-sans`.
   - What's unclear: the precise file names inside `node_modules/@fontsource/pixelify-sans/files/` for the 400 and 600 weights specifically (not independently opened this session).
   - Recommendation: a plan task should `ls node_modules/@fontsource/pixelify-sans/files/` after `npm install` and copy only the two needed weight files into `public/fonts/`, following the existing `press-start-2p-latin.woff2` naming convention — this is a five-minute verification step at execution time, not a planning blocker.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js + npm | Build, test, dev server | ✓ | confirmed via successful `npm test` run this session (227/227 passing) | — |
| `wrangler` CLI (via `npx`) | Preview deploy | Not independently verified installed-locally this session (only `npm view wrangler version` against the registry, confirming `4.151.1` exists); `npx wrangler ...` will fetch-and-run on demand regardless | 4.151.1 (latest, per registry) | `npx` fetches it transparently if not cached — no fallback needed, just note the first `wrangler` invocation this phase will download it |
| Playwright + a Chromium browser binary | Headless phone-viewport checks, smoke tests | ✓ — `playwright` is an existing devDependency and `smoke.mjs` already runs successfully in this environment per the existing test/smoke scripts | `^1.60.0` (pinned) | — |
| Git worktree `../barren-wuffett-fix` | `gsd/fix-menu-taps` branch content | ✓ — confirmed present via `git worktree list` this session | checked out at `5fe9533` | — |

**Missing dependencies with no fallback:** none identified.
**Missing dependencies with fallback:** `wrangler` CLI — not pre-verified as locally installed, but `npx wrangler` self-installs on first use; no action needed beyond allowing that first invocation to complete.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `^2.0.0` (Node environment) + Playwright `^1.60.0` (headless browser, phone viewport) — two layers, confirmed by reading `vitest.config.ts`, `tests/*.test.ts`, and `smoke.mjs` this session |
| Config file | `vitest.config.ts` (Node env, `tests/**/*.test.ts`); no dedicated Playwright config file — `smoke.mjs` is a standalone script using `vite`'s `preview()` + `chromium.launch()` directly |
| Quick run command | `npm test` (Vitest, ~50s full suite per this session's run) |
| Full suite command | `npm test && node smoke.mjs` (adds the headless phone-viewport browser check) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFR-06 | Every existing test green after consolidation | unit (existing suite) | `npm test` | ✅ (227 tests, all passing this session) |
| INFR-07 | `/adventure/` loads existing saves, reaches boss + level-complete | e2e/headless phone | Extend `smoke.mjs`'s pattern: `chromium.launch()` + 412×915 viewport + `window.__BW_GAME__` probe driving input to the boss | ❌ Wave 0 — no existing script drives a full playthrough; `smoke.mjs` only checks canvas presence/console errors |
| INFR-08 | Every page loads from a fresh direct URL, zero 404s/CSP violations | e2e/headless, against a **deployed preview** (not localhost — CSP is a Cloudflare Pages `_headers` feature, inert on the Vite dev server) | A Playwright script hitting the preview alias URL per route, asserting `page.on('requestfailed')`/console CSP-violation messages stay empty | ❌ Wave 0 — needs the preview URL to exist first (chicken-and-egg with the deploy step; sequence as: deploy → then run this check against the live preview) |
| INFR-09 | Cached-client update test | e2e/headless, two-pass: register SW from build N, then load build N+1 | Manual or scripted "install old SW, deploy new build, reload, confirm new content" per the PITFALLS.md "Looks Done But Isn't" checklist | ❌ Wave 0 — no existing automation; likely a manual verification step for this phase given its one-time nature, documented in the plan rather than scripted |
| HUB-04, HUB-05, HUB-07 | Checklist/streak device-only, degrades on storage failure | unit (pure `progressStore` logic) + headless probe (`window.__HUB__` simulating finished dailies) | `npm test` (new `tests/progress-store.test.ts`) + a Playwright script calling `window.__HUB__.simulateFinish(...)` then asserting DOM state | ❌ Wave 0 — `progressStore.ts` doesn't exist yet; this is new-module work, not a gap in existing coverage |
| SHELL-03 | Daily seed determinism (`?date=` fingerprint) | unit (pure `dailySeed` module) | `npm test` (new `tests/daily-seed.test.ts`, following `format-shell.md` §2's fingerprint-assertion pattern) | ❌ Wave 0 — module doesn't exist yet |

### Sampling Rate
- **Per task commit:** `npm test` (Vitest, fast — new pure modules are cheap to test on every commit)
- **Per wave merge:** `npm test && node smoke.mjs` (or its extended replacement), run locally against `vite preview`
- **Phase gate:** Full suite green locally **and** the headless phone-viewport checks (INFR-07/08) re-run against the actual deployed, non-public Cloudflare preview URL — not just `localhost` — per this phase's D-13 definition of done and PITFALLS.md Pitfall 9's "CSP is inert on localhost" warning. The human phone sign-off (D-13) happens after the automated gate, not instead of it.

### Wave 0 Gaps
- [ ] `tests/daily-seed.test.ts` — covers SHELL-03 (fingerprint determinism, two different `?date=` values diverge, same value repeats)
- [ ] `tests/progress-store.test.ts` — covers HUB-04/05/07 (checklist/streak logic, try/catch-wrapped storage failure degrades to "brand-new player" state per `05-UI-SPEC.md`'s resolved error-state row)
- [ ] `tests/release-config.test.ts` — covers HUB-02 (flipping a flag changes tile lock state; a locked tile never carries an `href`)
- [ ] An extended headless Playwright script (replacing or supplementing `smoke.mjs`) that: (a) drives the adventure via `window.__BW_GAME__` to the boss and level-complete screen (INFR-07), and (b) loads each of `/`, `/adventure/`, `/impressum`, `/datenschutz` directly against the **deployed preview URL** and asserts zero `requestfailed`/console-CSP-violation events (INFR-08)
- [ ] A one-time, documented (not necessarily scripted) procedure for the cached-client-update check (INFR-09) — register the old SW, deploy the new build, confirm the update path fires

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No accounts exist or are planned (explicit Out of Scope) |
| V3 Session Management | No | No sessions/cookies — Cloudflare Web Analytics is explicitly cookieless |
| V4 Access Control | No | No user roles, no protected resources beyond the preview URL being unlinked/non-public by convention |
| V5 Input Validation | Yes | The only "input" surfaces are URL query params (`?date=`, future `?speed=`/`?bot=`) read by `dailySeed.ts`/`testHooks.ts`. Validate: `?date=` must parse as a valid ISO date or fall back to `new Date().toISOString().slice(0,10)`, never `eval`/`Function`-construct from it. No form inputs, no user-generated text rendered via `innerHTML` anywhere in this phase's scope (confirmed: hub strings are all static/config-sourced, routed through `t(key)`) |
| V6 Cryptography | No | No auth tokens, no encrypted storage; IndexedDB/localStorage hold only non-sensitive device-local gameplay state |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| CSP bypass via a loosened `script-src`/`font-src` exception added "to make a port just work" | Tampering / Elevation of Privilege (expanded attack surface) | Treat every CSP exception as a last resort with a named justification (the Cloudflare Analytics beacon domain is the only one this phase adds) — per PITFALLS.md's explicit Security Mistakes table, confirmed still applicable |
| `innerHTML` with any dynamically-sourced value (even an echoed `?date=` debug display) | Tampering (XSS surface) | Use `textContent` for all dynamic text insertion; reserve `innerHTML` for genuinely static, hand-authored markup only (per PITFALLS.md) |
| Stale service worker masking a security-relevant update (e.g., a future CSP tightening) from reaching returning clients | Tampering (indirectly — users keep running an outdated, un-patched client) | The `workbox.navigateFallback`/`globPatterns` fix (this phase's primary finding) also closes this generic update-propagation risk, not just the "wrong tile" UX bug |
| Third-party beacon script (`static.cloudflareinsights.com`) compromised upstream | Tampering (supply-chain) | Out of this project's control beyond pinning the exact script path in CSP (no wildcard `*.cloudflareinsights.com`) — accepted risk, consistent with any third-party-script inclusion |

## Project Constraints (from CLAUDE.md)

- **Draft PRs only:** any `gh pr create` this phase's execution produces MUST include `--draft`; never create a ready-for-review PR without explicit user instruction.
- **Questions via `AskUserQuestion` only:** any clarifying question raised during planning or execution (e.g., the D-08 fallback-copy decision in Open Questions above) must go through the `AskUserQuestion` tool with options, never as open-ended prose the user has to type a reply to.
- **GSD workflow enforcement:** file-changing work for this phase must go through `/gsd-execute-phase` (or `/gsd-quick`/`/gsd-debug` for genuinely out-of-band fixes) — no direct `Edit`/`Write` outside a GSD command.
- **Stack directives already reflected above and in CONTEXT.md:** self-hosted fonts only (no Google Fonts `<link>`), Phaser via npm import only (no CDN `<script>`), Cloudflare Pages + `wrangler` direct-upload (no Git-integration deploy), no Supabase/Brevo/email anywhere in this milestone (superseded even further than the global CLAUDE.md's stack table, which still describes the pre-pivot v1.0 funnel — `STATE.md`'s 2026-10-06 pivot entry is the authoritative current state, not the CLAUDE.md stack table's email-funnel framing).
- **Project skills already loaded and incorporated:** `spike-findings-barren-wuffett` and `sketch-findings-barren-wuffett` — their reference files are cited throughout this document by path.

## Sources

### Primary (HIGH confidence — read/executed directly this session)
- `D:/AiProjects/barren-wuffett/.planning/phases/05-consolidate-shared-shell-hub-checkpoint/05-CONTEXT.md`, `05-UI-SPEC.md` — locked phase decisions and UI contract
- `D:/AiProjects/barren-wuffett/.planning/{REQUIREMENTS,STATE,ROADMAP}.md` — project requirements, decision history, Phase 5 roadmap section
- `D:/AiProjects/barren-wuffett/.planning/research/{ARCHITECTURE,PITFALLS,FEATURES,STACK,SUMMARY}.md` — full prior milestone research pass (2026-10-07), carried forward and cross-checked, not re-derived
- `.claude/skills/spike-findings-barren-wuffett/references/{format-shell,pixel-cast}.md`, `.claude/skills/sketch-findings-barren-wuffett/references/{hub-layout-cards,streak-snowball}.md`
- `D:/AiProjects/barren-wuffett/{vite/config.prod.mjs, vite/config.dev.mjs, public/_headers, public/manifest.webmanifest, package.json, index.html, public/datenschutz.html, public/impressum.html, src/services/{SaveService,i18n}.ts, src/game/scenes/{MainMenu,Settings}.ts, src/main.ts, tests/og-tags.test.ts, smoke.mjs}` — read directly this session
- `npm test` run this session — 227/227 tests passing on `spike/pivot-formats` (current branch)
- `git merge-base --is-ancestor`, `git log`, `git worktree list`, `git show ab9cbe1` — branch ancestry and diff content, run this session
- `npm view {vite-plugin-pwa,@fontsource/pixelify-sans,idb-keyval,phaser,wrangler} version` + `api.npmjs.org/downloads/point/last-week/@fontsource%2Fpixelify-sans` — registry checks this session
- `github.com/vite-pwa/vite-plugin-pwa/blob/main/src/options.ts` — fetched and grepped this session (lines 87-117, `defaultWorkbox.navigateFallback = 'index.html'`)
- `developer.chrome.com/docs/workbox/modules/workbox-build/` — official Workbox docs, `generateSW`'s own `navigateFallback` default (`null`) and `globPatterns` default
- `developers.cloudflare.com/web-analytics/faq/` — official CSP origins for automatic vs. manual beacon injection
- `developers.cloudflare.com/pages/functions/wrangler-configuration/` — official `wrangler pages deploy --branch` semantics

### Secondary (MEDIUM confidence)
- `vite-pwa-org.netlify.app/workbox/generate-sw` — official plugin docs page (did not itself state the default, but confirms the strategy this project uses)
- WebSearch cross-checks on `wrangler pages deploy --branch` alias-URL behavior (`<branch>.<project>.pages.dev`), consistent across multiple independent sources, confirming the official docs' framing

### Tertiary (LOW confidence)
- deepwiki.com community-generated wiki pages on `vite-plugin-pwa` Workbox options — used only as a search lead, superseded by directly reading the plugin's own source (see Primary)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new runtime dependencies; the one new package (`@fontsource/pixelify-sans`) independently verified via `npm view`/`api.npmjs.org` this session
- Architecture: HIGH — carried forward from a milestone research pass grounded in direct repo inspection, re-verified this session (configs, services, branch ancestry all re-read/re-run directly)
- Pitfalls: HIGH — the one previously-open research flag (Workbox `navigateFallback`) is now resolved with a primary-source citation (the plugin's own code), not a community write-up
- Security: MEDIUM — ASVS mapping is straightforward given the project's minimal attack surface (no auth, no backend), but German legal specifics (Persönlichkeitsrecht/UWG, covered in `PITFALLS.md` Pitfall 4) remain MEDIUM per that document's own stated confidence, unchanged by this session

**Research date:** 2026-10-16
**Valid until:** 30 days (stable domain — static-site/PWA tooling; re-verify `vite-plugin-pwa` defaults if the pinned version is ever bumped past `1.3.0`, since the `Object.assign` default-merge behavior confirmed here is version-specific to the `main` branch source read this session)
