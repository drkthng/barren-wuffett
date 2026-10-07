# Project Research Summary

**Project:** Barren Wuffett — v2.0 "The Barren Wuffett Hub"
**Domain:** Multi-page static-hosted PWA mini-game hub (Wordle/NYT-Games-style daily-return hub), built on an existing Phaser 4 + Vite 6 + TypeScript single-page adventure
**Researched:** 2026-10-07
**Confidence:** HIGH

## Executive Summary

This milestone converts an existing single-page Phaser adventure into a four-tile static mini-game hub (arcade, idle, swipe, plus the kept-as-is adventure demo), released one format at a time, each with its own X post. Experts building this shape of product (Wordle, NYT Games, Reigns-likes) converge on the same recipe the research independently arrived at: no backend, no accounts, a shared daily seed for comparability, a structured share-text artifact instead of attached images, and device-only progress (streak/checklist) accepted as disposable. Nothing in this milestone needs a new runtime framework or a router — it's a Vite multi-page build (`rollupOptions.input`, one real HTML file per route) with a small set of shared, Phaser-free TypeScript modules (`src/shared/*`) that every new format and the hub import, while the adventure's existing services stay untouched. The four spikes already validated the game feel on-device; what's new and unproven is the *porting* work — getting spike-era code through the production build's strict CSP, and wiring routing/PWA/analytics/OG correctly across five real HTML pages instead of one.

The recommended approach is: consolidate the unmerged branch stack and run the adventure's overdue phone check first (a regression gate, not new work), then build the shared shell once (config, daily seed, share flow, credit/About/legal overlay, device-only progress store, code-drawn cast — all CSP-clean, all Phaser-free except where Phaser is explicitly needed), deploy a hub+adventure-only checkpoint to validate the MPA/PWA/CSP plumbing on the real host, and only then port arcade → idle → swipe as three independent release slices that each depend only on the shared shell, not on each other. This ordering means Release 1 can ship without Releases 2 and 3 existing yet, matching the staggered-release requirement directly.

The main risks are not stack risk (every new "dependency" this milestone needs is either a config change or a build-time-only package) but integration risk specific to a static multi-page PWA: a stale service worker silently serving last release's hub after a new one ships (the single biggest threat to the "the new tile is unlocked" release moment actually landing), OG/X cards staying broken per-page if the per-page `<head>` block is ever centralized into a shared partial, iOS-specific gesture/audio/storage failures that the spikes never hit because they were only played on Android, and the recurring legal/parody-endorsement audit that must be re-run before *every* release, not just once at hub launch. All of these have concrete, cheap prevention steps documented in PITFALLS.md and should become explicit release-gate checklist items rather than one-time P1 tasks.

## Key Findings

### Recommended Stack

Zero new runtime/browser dependencies are required. Everything new is either a Vite config change (multi-page `rollupOptions.input`, `base`, `workbox.globPatterns`) or a build-time-only devDependency (self-hosted font package, `ffmpeg-static` for clip conversion) that never touches the shipped CSP. Cloudflare Web Analytics is a dashboard toggle plus a `script-src` CSP addition — no new vendor, no cookies, no consent banner. OG/X share cards are solved with a tool already in the repo (Playwright screenshot of a static `card.html`), not a new image-generation dependency or a serverless function.

**Core technologies:**
- Vite multi-page build (`build.rollupOptions.input`) — one real static HTML entry per route (hub, arcade, snowball, ceo, adventure) — no router library needed; Cloudflare Pages serves each path directly
- `@fontsource/pixelify-sans` (static weights) — self-hosted woff2 satisfying `font-src 'self'`, same convention already used for Press Start 2P
- `ffmpeg-static` + Playwright's `recordVideo` — dev-time-only gameplay clip capture/conversion for X posts, reusing Playwright (already a devDependency)
- Cloudflare Web Analytics, "automatic" dashboard mode — cookieless, same-origin beacon proxy, needs only a `script-src` CSP addition, no `connect-src` change
- vite-plugin-pwa, unchanged version, `generateSW` strategy kept — one PWA shell at root scope covering hub + all game pages via a build-wide `globPatterns` glob (currently unset/deferred — must finally be set this milestone)

### Expected Features

Grounded in four already-played spikes (Mr. Market arcade, Snowball idle, Barren-CEO swipe, code-drawn cast) plus genre comparables (Wordle, NYT Games, Reigns, Cookie Clicker).

**Must have (table stakes):**
- Game tile grid at the site root, with locked "coming soon, follow @handle" tiles for unreleased games (no fake countdowns)
- One shared shell module (config/seed/share/credit-About overlay) ported once, reused by all three new formats
- Credit + About/legal overlay visible (not buried) on every page — UWG §5a(4)
- Working absolute-URL OG/X share image per page — the current relative-URL bug must be fixed before Release 1's X post
- Daily seed = same game for every player, every UTC day (already built, porting only)
- Per-release X post with share card + short gameplay clip; native share sheet with X-intent fallback
- Cookieless Cloudflare Web Analytics wired site-wide; privacy page matching actual practice (no Supabase/Brevo)

**Should have (differentiators):**
- Cross-game daily checklist and play streak, device-only, UTC-day boundary matching the seed
- One unified code-drawn parody cast reused across all four formats (already built)
- One shared "Daily #N" number across the whole hub

**Defer (v2+ / explicitly rejected):**
- Accounts, cross-device sync, leaderboards, push notifications — all need a backend, contradicting the pivot
- Streak-loss guilt messaging or streak-freeze purchases — named anti-pattern; silent reset to 1 instead
- Countdown timers on locked tiles — manufactured urgency anti-pattern
- Idle prestige/ascension loop at launch — the format is a daily reset, not a persistent run
- Swipe deck expansion past 33 cards before launch — content treadmill, not a launch blocker

### Architecture Approach

A Vite multi-page static build where each route (hub, arcade, snowball, ceo, adventure) is a real, separate HTML entry with its own module graph; Rollup auto-splits shared imports (`src/shared/*`, `src/services/i18n.ts`) into common chunks while per-format-only code (Phaser, a format's own model) stays out of entries that don't need it. The adventure's existing services (`SaveService`, `ShareService`, `AudioService`, `ContentRegistry`) stay untouched and adventure-only; a new, deliberately separate `shared/progressStore.ts` (its own IndexedDB store) and `shared/shareFlow.ts` (text+url only, no image Blob) serve the three new formats instead of generalizing the adventure's image-coupled `ShareService`. One PWA registration at root scope covers the whole hub — no per-game installable scopes.

**Major components:**
1. `src/shared/*` — the load-bearing new boundary: config, daily seed, share flow, overlays, device-only progress store, release-gating flags, code-drawn cast — all Phaser-free, imported by hub + all three new formats
2. `src/hub/*` — vanilla TS + DOM tile grid and checklist/streak UI, reads `releaseConfig.ts` to decide which tiles are live vs. locked
3. `src/{arcade,snowball,ceo}/*` — one per format, each with its own bootstrap (arcade gets its own `Phaser.Game()` instance; snowball/ceo are DOM-only) plus a pure, Phaser-free model module ported from the spike's balance-sim code
4. `adventure/` — the former root `index.html` and all adventure code, moved unchanged to its own path, untouched by this milestone otherwise

### Critical Pitfalls

1. **Stale service worker serves an old build after release** — set `workbox.globPatterns` across every HTML entry (currently deferred since Phase 1), avoid the default single-entry `navigateFallback` (SPA assumption on an MPA), and test an *existing installed* client actually updates, not just a fresh load — this is the single biggest threat to a staggered-release plan where "the new tile is unlocked" is the whole point of each X post.
2. **OG/X share cards stay broken per-format** — each page needs its own absolute `og:image`/`og:url`/title, never centralized into the shared legal-links partial; re-crawl each release's share URL through X's Post Inspector after every deploy, since a broken card can't be fixed retroactively once the tweet is live.
3. **iOS-only failures the Android-only spikes never hit** — Web Audio unlock in the arcade's Phaser scene, `navigator.share()` called from a Phaser input handler instead of a plain DOM handler, and swipe-card drag fighting iOS pull-to-refresh/rubber-banding — all three need a real iPhone test before their respective release ships.
4. **Daily-seed determinism drift and spoiler leakage** — keep the seeded PRNG and any animation/particle randomness hard-separated (two RNG instances), assert the `?date=` fingerprint test per format, and keep share text to rank/category only, never literal event order.
5. **Parody/Persönlichkeitsrecht re-audit must run every release, not once** — the credit-only funnel reduces but doesn't eliminate the legal risk; a full-text name/endorsement audit (UI strings, share text, OG description, draft X post copy) is a release-gate checklist item for P2, P3, and P4 independently.

## Resolved Conflicts

**`base: ./` vs. `base: /` (STACK.md recommended switching; ARCHITECTURE.md treated the existing value as already correct).**

**Resolution: keep `base: ./` — do not switch to `/`.** Reasoning:
- ARCHITECTURE.md's finding is grounded in direct inspection of `vite/config.prod.mjs` (confirmed above) and the existing, already-deployed single-page build, where `base: ./` is the documented reason nested static paths already work — switching it is an unforced, unvalidated change to a setting the current site depends on.
- Vite's relative base resolves each HTML entry's asset URLs relative to that file's own output location; as long as the multi-page build's output directory structure mirrors each entry's input path (Vite's default behavior for named `rollupOptions.input` entries), every page — root or nested under `arcade/`, `snowball/`, `ceo/`, `adventure/` — resolves its own assets correctly regardless of depth. This is the same mechanism PITFALLS.md flags as "needs explicit verification," not "is broken."
- The two things STACK.md cited in favor of `/` are not actually base-path-dependent: absolute OG/X image URLs are hand-written full `https://` strings in each page's `<head>` (never derived from Vite's `base`), and the service worker scope is set explicitly via `vite-plugin-pwa`'s `scope`/`start_url` config, not inherited from `base`. Cloudflare Pages serving from the domain root makes `/` *safe*, but it doesn't make `/` *necessary* — and changing a proven-working setting adds risk with no corresponding benefit here.
- **Action for the roadmap:** keep `base: ./`, but add "deployed-preview check: every new HTML entry loads its own JS/CSS/fonts with zero 404s in the network tab, from a direct URL load" as an explicit P1 verification step before the hub+adventure checkpoint deploy, and repeat it for each new entry added in P2–P4. This satisfies PITFALLS.md's Pitfall ("Vite Multi-Page Relative Base Path Breaks Nested Game Routes") without touching the config.

## Open Questions to Carry Into the Roadmap

- **"Add to Home Screen" prompt is a genuine tradeoff, not a settled call.** PITFALLS.md (Pitfall 12) flags that installing to the Home Screen exempts a player's storage from iOS Safari's 7-day eviction cap for *unvisited* origins — directly protecting the streak mechanic — but v1.0's install-prompt pattern needs to be resurrected and is itself a UX decision (when to show it, how pushy it reads) that should be made explicitly in P1 planning, not left implicit. Frame it as "install protects your streak," not a generic PWA nicety.
- **Streak/checklist guilt-free rules are specified and should be treated as a contract, not a suggestion** (FEATURES.md): UTC-day boundary matching the seed's `DATE`; a game counts "done" only when its end screen is reached; streak increments once per UTC day on first completion; silent reset to 1 on a gap, no loss modal, no red messaging; no streak-freeze purchase; best-effort only, no defense against a cleared cache or a tampered device clock. These rules belong directly in `src/shared/progressStore.ts`'s spec, not as a later polish pass — get them right in P1 since every later release's checklist extension depends on the same store.

## Implications for Roadmap

### Phase 1: Consolidate + Shared Shell + Hub Checkpoint
**Rationale:** Every later release depends on this; it's also the only phase that touches existing adventure code (via the branch merge), so it should be isolated and verified before any new gameplay lands on top.
**Delivers:** `main` fast-forwarded through the Phase 2-4 chain + the menu-tap fix + the spike docs; adventure's overdue phone/UAT check passed once; `src/shared/*` (config, daily seed, share flow, overlays, device-only progress store with guilt-free streak rules, release-gating flags, code-drawn cast) built CSP-clean; hub page with tile grid, locked teaser tiles, adventure tile; multi-page Vite config (`hub`, `adventure` entries only); `workbox.globPatterns` finally set; absolute-URL OG cards fixed for hub + adventure; Cloudflare Web Analytics wired with matching CSP and a rewritten privacy page; deployed as a standalone checkpoint on the real host before any new format exists.
**Addresses:** Hub & Shared Shell table-stakes features (tile grid, locked tiles, credit/legal overlay, working OG card, daily seed), Analytics & Legal table stakes
**Avoids:** Pitfalls 1 (seed determinism), 5 (legal links multi-page), 6 (stale SW cache), 7 (OG card per-page), 8 (analytics CSP + privacy page), 9 (CSP porting foundation), 12 (storage eviction/private mode)

### Phase 2: Release 1 — Mr. Market Arcade
**Rationale:** The arcade is the one format using Phaser (new audio/gesture risk categories) and is first in the staggered-release order per PROJECT.md; shipping it in isolation surfaces iOS-specific Phaser+DOM-overlay risk before idle/swipe (pure DOM) are built.
**Delivers:** `market.ts` (pure, ported + Node sim), `MarketScene.ts` (Phaser) + its own `Game()` instance, npm Phaser replacing the spike's CDN script, self-hosted Pixelify Sans, arcade's own absolute OG card, headless phone check then real-phone feel pass, `releaseConfig.arcade = true`, deploy, X post.
**Uses:** Vite multi-page entry addition, `@fontsource/pixelify-sans`, Playwright `recordVideo` + `ffmpeg-static` for the release clip
**Implements:** `src/arcade/*` component per ARCHITECTURE.md's recommended structure

### Phase 3: Release 2 — Snowball Idle
**Rationale:** Independent of Release 1's gameplay code — only blocked on the P1 shared shell, so it can start as soon as P1 ships regardless of arcade's status; DOM-only, so it inherits iOS gesture safety by construction (no Phaser input layer).
**Delivers:** `econ.ts` (pure, ported + Node sim) + DOM UI, snowball's own OG card, headless check + phone feel pass, `releaseConfig.snowball = true`, deploy, X post.
**Addresses:** Idle-release table stakes (age progression, seeded daily offers) from FEATURES.md
**Avoids:** Pitfall 9 (CSP porting) re-run for this format's specific spike code

### Phase 4: Release 3 — Barren-CEO Swipe
**Rationale:** Last in the planned staggered order; the one format with a genuinely new iOS-specific failure mode (pointer-events vs. pull-to-refresh/rubber-banding) not present in either prior release, so it benefits from being built after the project has already done two real-iPhone release cycles.
**Delivers:** `cards.ts` (pure, ported + Node sim) + DOM UI with `touch-action`/`overscroll-behavior` CSS treatment, endings-collection grid, ceo's own OG card, headless check + phone feel pass (including real-device fast-flick/edge-drag test), `releaseConfig.ceo = true`, deploy, X post.
**Addresses:** Swipe-release table stakes (Reigns-style swipe, endings collection) from FEATURES.md
**Avoids:** Pitfall 11 (pointer-events vs. iOS scroll) — the one pitfall specific to this release

### Phase Ordering Rationale

- P1 must come first and alone because it's the only phase touching the unmerged branch stack and the adventure's regression risk — isolating it avoids compounding a merge/regression bug with new-format bugs.
- P2-P4 are deliberately independent of each other (each depends only on P1's shared shell, confirmed in both ARCHITECTURE.md's Build Order and FEATURES.md's Feature Dependencies), which lets the staggered-release requirement ("each format ships as soon as it passes its phone feel check") hold literally — P3 is not blocked by P2's completion, only by P1's.
- The P2→P3→P4 ordering shown here follows PROJECT.md's stated release order (arcade → idle → swipe) for roadmap narrative purposes, but the roadmapper should treat P3 and P4 as reorderable relative to each other if a phone-feel pass finishes out of sequence — only P1's position as a prerequisite is fixed.
- Grouping avoids Pitfall 9 (CSP porting) by making "runs under the real deployed CSP, not just localhost" an explicit per-phase deliverable rather than a P1-only concern, since P1 can't finish this on behalf of formats that don't exist in the real build yet.

### Research Flags

Needs deeper research during planning:
- **Phase 1:** the exact Workbox `globPatterns`/`navigateFallback` configuration for a multi-page site with a growing entry list (Pitfall 6) — the general pattern is documented here, but the precise glob/exclusion syntax should be verified against `vite-plugin-pwa`'s current docs when P1 is planned in detail.
- **Phase 2:** iOS Safari AudioContext unlock timing inside a DOM-overlay-triggers-Phaser-scene architecture (Pitfall 2) — this exact combination (DOM overlay + Phaser canvas underneath) is new to this repo; confirm the precise synchronous-unlock call sequence against Phaser 4's current sound-manager API during plan-phase.

Phases with standard, well-documented patterns (skip research-phase):
- **Phase 3:** pure DOM port of an already-balanced, already-played spike; no new architectural risk beyond what P1 already solved.
- **Phase 4:** the `touch-action`/`overscroll-behavior` CSS pattern for suppressing iOS native gestures is well-documented (PITFALLS.md cites it directly); the swipe mechanic itself is a straight port.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Zero new runtime deps keeps risk low; several specific claims (Cloudflare beacon CSP origins, package versions) cross-checked against official docs/registry and promoted to HIGH, but the overall MPA/PWA mechanics are community-sourced |
| Features | HIGH | Internal findings grounded in four spikes the user actually played on-device plus Node balance-sim data; external comparables (Wordle, NYT Games, Reigns) are well-documented genre conventions |
| Architecture | HIGH | Grounded in direct inspection of the current repo's actual files, configs, and git history; the few web-sourced supporting citations agree with each other and with this repo's already-working `base: ./` convention |
| Pitfalls | HIGH for CSP/build/PWA/iOS mechanics (verified against repo files and current docs); MEDIUM for X/Twitter card-caching specifics (undocumented, changes) and German legal items (needs qualified counsel per release, as in v1.0) |

**Overall confidence:** HIGH

### Gaps to Address

- **X/Twitter card cache behavior is not formally documented** and reportedly persists for days independent of live page changes — plan for a "verify via Post Inspector after every deploy, before posting" step rather than trusting a code fix alone; if a card is wrong on a live post, treat it as unrecoverable for that post (PITFALLS.md's Recovery Strategies table already covers this).
- **German legal specifics (Persönlichkeitsrecht/UWG) are MEDIUM confidence by design** — this research is not a substitute for qualified counsel review before each release, consistent with how v1.0 treated the same category of risk.
- **The open "feel" questions carried forward from the spikes** (arcade's 60s length/busyness, idle's 5-minute life and prestige question, swipe's humor-beyond-finance-followers and 33-card sufficiency) are explicitly *not* resolved by this research — FEATURES.md gives a recommendation for each (keep as spiked, ship as-is, don't add a meta-loop) but final validation is deferred to each release's real-phone feel pass, per the project's own verification practice.

## Sources

### Primary (HIGH confidence)
- Direct repo inspection: `vite/config.prod.mjs` (confirmed `base: ./`, `manualChunks`, PWA config), `index.html`, `src/main.ts`, `src/game/main.ts`, `public/_headers`, `public/manifest.webmanifest`, `src/services/{SaveService,ShareService,i18n,ContentRegistry}.ts`, `tests/og-tags.test.ts`, `git log`/`git merge-base` on the branch stack
- `.planning/PROJECT.md` — v2.0 milestone scope, constraints, decisions, branch-stack context
- `.claude/skills/spike-findings-barren-wuffett/SKILL.md` + `references/format-shell.md` + spike sources — curated, already-validated spike findings from four on-device playtests
- [Cloudflare Web Analytics FAQ](https://developers.cloudflare.com/web-analytics/faq/) — exact CSP origins, automatic vs. manual beacon behavior
- [Playwright `Video` API docs](https://playwright.dev/docs/api/class-video) — `recordVideo` finalize-on-close behavior
- [Apple Developer Forums — Safari iOS PWA data persistence beyond 7 days](https://developer.apple.com/forums/thread/710157) — Home-Screen-install storage exemption
- npm registry version checks for `ffmpeg-static`, `gifski`, `@fontsource/pixelify-sans`

### Secondary (MEDIUM confidence)
- [NYT Games 2024 redesign coverage (TechCrunch, Creative Review)](https://techcrunch.com/2024/03/07/nyt-games-redesigned-app-boost-discovery-simplify-navigation/) — hub-of-games pattern, no-login play
- Wordle design-history write-ups (Slate, Medium, beastoftraal.com) — emoji-grid share origin, client-side streak/localStorage design
- Vite multi-page community write-ups, `vite-plugin-pwa` discussion threads on scope/globPatterns — cross-checked against this repo's own already-working config
- [Cloudflare injects a beacon, CSP blocks it — DEV Community](https://dev.to/indiecoredev/cloudflare-injects-a-beacon-my-csp-said-no-20cl) — silent-failure mode confirmation
- [iOS Safari localStorage Private Mode quota=0 bug catalog](https://github.com/scottjehl/Device-Bugs/issues/63)

### Tertiary (LOW confidence)
- X/Twitter card-caching behavior and Post Inspector guidance (third-party synthesis, platform behavior undocumented and subject to change) — treat as "re-verify per release," not a fixed fact
- `.planning/milestones/v1.0-research/PITFALLS.md` — carried-forward items, rewritten for v2.0 context

---
*Research completed: 2026-10-07*
*Ready for roadmap: yes*
