# Phase 5: Consolidate + Shared Shell + Hub Checkpoint - Context

**Gathered:** 2026-10-08
**Status:** Ready for planning (after the hub phone mockup + UI-SPEC, see D-05)

<domain>
## Phase Boundary

Phase 5 ends with one consolidated `main` that holds:

- the Level 1 adventure, moved to `/adventure/`
- the shared Phaser-free shell in `src/shared/*`: config, daily seed, share flow, credit/About/legal overlay, the device-only progress store and the code-drawn cast
- the hub page at `/`: card list, locked teaser cards, daily strip with checklist and streak, and the install hint

All of it is CSP-clean, built as a Vite multi-page build with one root PWA, and checked on a **non-public Cloudflare preview URL only**. No new game is ported and the public site does not change in this phase. The first public deploy is Phase 6, when the hub and arcade go live together.

Requirements: INFR-06, INFR-07, INFR-08, INFR-09, SHELL-01..07, HUB-01..07, MEAS-01, LEGL-05, LEGL-07.

</domain>

<decisions>
## Implementation Decisions

### Carried forward (locked earlier; do not re-litigate)
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
- **D-01:** The layout is **stacked full-width cards**, grown from the spike phone hub (`sources/hub-index.html`). Each card has the cast portrait on the left, then a gold Press Start kicker ("ARCADE · 60 S"), the title and a one-line blurb, with room for badges (✓ done today, best score, 🔒). The credit "made by @Wolfhartvest · about" sits in the footer.
- **D-02:** Locked cards are a **named, dimmed teaser**:
  - the real kicker, title and blurb show
  - the cast art is greyed out
  - a padlock and "coming soon · follow @Wolfhartvest" sit on the card
  - no mystery silhouettes, no countdown
- **D-03:** Cards stay in **fixed release order**: Arcade → Snowball → CEO → Adventure ("EARLY DEMO") last. Positions never reshuffle. Each release unlocks its card in place.
- **D-04:** Tapping a locked card opens a **small bottom sheet**: "Coming soon. Follow @Wolfhartvest on X to hear when it drops" with [Open X] (to x.com/Wolfhartvest, new tab) and [Close]. An accidental tap never leaves the site.
- **D-05:** **Phone mockup before the plan is locked.**
  - Build a throwaway HTML hub mockup with the real code-drawn cast and serve it over LAN like the spike hub.
  - The user judges it on their phone, and the result feeds the UI-SPEC (`/gsd-ui-phase 5`) before `/gsd-plan-phase 5`.
  - Per the user's working style (memory: visual-polish-spike-first), visual decisions are made from screenshots or a phone, not from prose.

### Daily strip & streak
- **D-06:** The strip under the title shows "Daily #N", the streak and today's checklist (e.g. "1/3"). The ✓ and best-score badges on each live card come from the same `progressStore`.
- **D-07:** The streak symbol is a **code-drawn pixel snowball** next to the number, drawn in the `cast.js` Px style. It grows a size step at milestone days, proposed at 3, 7 and 30; the exact steps get tuned in the mockup. Not 🔥, not plain text.
- **D-08:** **Daily #1 = the public launch day.** `EPOCH` is set in Phase 6 to the day the hub and arcade go live, so the first X post says "Daily #1". In Phase 5 `EPOCH` is a clearly marked placeholder and preview testing uses `?date=`. Dates before `EPOCH` must not render as "Daily #0" or a negative number; how they are handled is Claude's discretion. — **Reversibility:** one-way (once Phase 6 ships) — every share text published from launch on carries "Daily #N" from this epoch, so moving it later breaks continuity with posts already on X.
- **D-09:** The strip **fills in as there is something to show**:
  - "Daily #N" always shows.
  - The checklist appears once at least one daily is live.
  - The snowball appears after the first finished daily.
  - A newcomer never sees "streak 0" or "0/0".
  - On the Phase 5 preview, where no daily is live, the strip shows only "Daily #N".
- **D-10:** The install hint is a **slim dismissible card right under the daily strip on the hub**: "Keep your bests and endings safe: add Barren to your Home Screen" [How?] [✕]. It appears on the next hub visit after streak day 2. It never appears inside a game.

### Adventure inside the hub
- **D-11:** A **"← HUB" text button** goes on the adventure's title screen (`src/game/scenes/MainMenu.ts`) and its Settings screen (`src/game/scenes/Settings.ts`). These are the two scenes that already host the Impressum and Privacy links, so the button reuses that pattern: a ≥44 px hit area, `window.open(..., '_self')` to the hub. This fixes the iOS standalone-PWA trap, where there is no back button. It must never overlap gameplay controls.
- **D-12:** The adventure gets **only the credit line "made by @Wolfhartvest" on its title screen**, made in the same edit as D-11. It gets no About overlay, since the hub has one. Otherwise the adventure stays unchanged, including its own image-card share flow. This deliberately narrows ROADMAP success criterion 5 ("every page carries…"): the full shell (About overlay, daily seed, cast) applies to the hub and the new game pages. For `/adventure/` the credit line plus the existing two-tap legal links are enough.
- **D-13:** **Phase 5 is done** when Claude's headless checks pass **and** the user signs off on their phone. Headless checks:
  - the adventure on `/adventure/` loads existing saves and reaches the boss and the level-complete screen
  - `/` and `/adventure/` load from fresh direct URLs with zero 404s and zero CSP violations
  - a client with the previous build cached gets the new build
  - the streak and checklist behave correctly via probes

  Then the user opens the preview URL on their phone and signs off the hub, plus a quick look at the adventure. The phase is not complete while that check is pending (the v1.0 lesson). A full adventure phone pass (ADV-01) stays deferred.

### Name, icon & legal pages
- **D-14:** Hub title "BARREN WUFFETT". Tagline: **"Daily games about patience, compounding and a very moody Mr. Market."** It echoes the About copy, so the hub, About, manifest description and share card speak with one voice. The adventure's own `game.subtitle` ("THE VALUE INVESTING ADVENTURE") stays on its title screen.
- **D-15:** Home-Screen icon and manifest:
  - the icon is the **code-drawn old Barren portrait** (white swept-back hair, big glasses) on the hub's background colour
  - rendered at 192 and 512, including a maskable variant
  - `short_name` becomes **"Barren"**, and the manifest `name`/`description` describe the hub, not the adventure
  - `start_url` and `scope` stay at the root
- **D-16:** The hub's X/OG share card is 1200×630 and shows the **cast lineup**: Charlie, Barren and Mr. Market (greed) side by side, big and pixel-crisp on the hub background, with "BARREN WUFFETT" and the tagline.
  - It is rendered from a static `card.html` via Playwright, the approach chosen in the research.
  - Every page has its own `og:*`/`twitter:*` block with **absolute** URLs (`https://barren-wuffett.pages.dev/...`).
  - `/adventure/` gets its own card. Its content is Claude's discretion, e.g. a cozy-town shot with the title.
  - The old blank-navy `og-image.png` and the relative `/og-image.png` references go away.
- **D-17:** The privacy page is **German (binding) plus an English version below it on the same page**. It describes exactly what the site does: Cloudflare Pages hosting, cookieless Cloudflare Web Analytics, and on-device storage (adventure save, hub progress store, audio toggles). No Supabase, Brevo or email mentions. Link labels across the hub read "Impressum · Privacy". The Impressum keeps its existing compoundingknowledge.com Geltungssatz link structure.

### Claude's Discretion
- How the branches get consolidated. Proposed:
  1. Fast-forward `main` through the linear `phase-02 → 02.1 → 03 → 03.1 → 04` chain.
  2. Bring in `gsd/fix-menu-taps` (`ab9cbe1` + `5fe9533`; it lives in the worktree `../barren-wuffett-fix`).
  3. Merge `spike/pivot-formats` (docs only).

  Every existing test stays green. Push to origin is fine, since deploys go through wrangler and not Git integration. Phase work then happens on `gsd/phase-5-...` per `config.json` branching.
- The preview deploy mechanism: e.g. `npx wrangler pages deploy dist --project-name barren-wuffett --branch <preview-alias>`, so that production is never touched. Do **not** run a production deploy in this phase.
- Workbox `globPatterns`/`navigateFallback` for the multi-page site, the research flag (Pitfall 6). Verify against current `vite-plugin-pwa` docs. Don't use the SPA-style single `navigateFallback`.
- Cloudflare Web Analytics wiring (automatic injection vs a manual snippet) and the exact CSP origins. Verify the hostnames before editing `_headers`, because a syntax error there breaks every page.
- The hub's colour palette and spacing: the spike plum (`#1d1a27`) is the starting point, and the phone mockup decides. The same goes for the snowball sprite and its size steps, the card art per game (the spike used `marketGreed`, `barren`, `charlie`, `barrenIdle`), the blurb copy and the bottom-sheet styling.
- A self-hosted Pixelify Sans (`@fontsource/pixelify-sans`) next to the existing Press Start 2P.
- How streak and checklist get verified in Phase 5 while no daily is live: unit tests on `progressStore` plus a `window.__HUB__` probe that can simulate finished dailies. The probe stays dev/probe-only and is never visible to players.
- The desktop layout: a centered column (the spike used `max-width: 460px`). Desktop is secondary.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope & requirements
- `.planning/ROADMAP.md` §"Phase 5: Consolidate + Shared Shell + Hub Checkpoint": goal, the 5 success criteria and the Workbox research flag
- `.planning/REQUIREMENTS.md`: INFR-06..09, SHELL-01..07, HUB-01..07, MEAS-01, LEGL-05, LEGL-07 (plus the Out of Scope table)
- `.planning/PROJECT.md`: constraints (€0, CSP, legal, UWG §5a(4) visible credit), Key Decisions, repo state at milestone start

### Spike blueprint (the proven patterns to port)
- `.claude/skills/spike-findings-barren-wuffett/SKILL.md`: index and build order
- `.claude/skills/spike-findings-barren-wuffett/references/format-shell.md`: config constants, daily seed code, share flow, the About copy (verbatim), test hooks + forensic log, CSP porting constraints (npm Phaser, self-hosted fonts, no top-level await, `t(key)`)
- `.claude/skills/spike-findings-barren-wuffett/references/pixel-cast.md`: the `Px` vocabulary, palette chars, render at ≥ 3×, what to avoid
- `.claude/skills/spike-findings-barren-wuffett/sources/002-old-barren-cast/cast.js`: the cast source to port to `src/shared/cast.ts`
- `.claude/skills/spike-findings-barren-wuffett/sources/hub-index.html`: **the visual baseline for D-01** (card markup and styles the user already liked on the phone)

### Milestone research
- `.planning/research/SUMMARY.md`: resolved conflicts (keep `base: './'`), open questions, Phase 1 = this phase
- `.planning/research/ARCHITECTURE.md`: project structure, `src/shared/*` boundary, progress store pattern, release gating, branch-stack facts, PWA scope decision, anti-patterns
- `.planning/research/PITFALLS.md`: stale SW (6), per-page OG (7), analytics CSP + privacy (8), CSP porting (9), storage eviction / private mode (12), multi-page relative base
- `.planning/research/FEATURES.md` §"Streak & Checklist UX Rules": the streak/checklist contract
- `.planning/research/STACK.md`: Cloudflare Web Analytics CSP origins, `@fontsource/pixelify-sans`, Playwright card rendering
- `.planning/research/ENGAGEMENT.md`: anti-patterns (streak guilt, FOMO timers, notification begging)

### Existing code & config touched by this phase
- `index.html`: becomes the hub. Its current content moves verbatim to `adventure/index.html`.
- `vite/config.prod.mjs`, `vite/config.dev.mjs`: multi-entry `input`, `workbox.globPatterns` (never set since v1.0 Phase 1)
- `public/_headers`: CSP (`script-src 'self'; font-src 'self'; connect-src 'self'`), the analytics origins get added here
- `public/manifest.webmanifest`: name, short_name, description and icons change (D-15)
- `public/datenschutz.html`: rewrite (D-17). `public/impressum.html` stays reachable within two taps.
- `src/game/scenes/MainMenu.ts`, `src/game/scenes/Settings.ts`: "← HUB" button + credit line (D-11, D-12); the existing legal-link hit-area pattern lives here
- `src/services/SaveService.ts`: the robustness pattern for `progressStore` (try/catch, version, migrate)
- `src/services/i18n.ts`, `public/locales/en/common.json`: all new strings go through `t(key)`
- `tests/og-tags.test.ts`: currently **asserts the buggy relative `/og-image.png`** and must be rewritten for absolute per-page URLs
- `smoke.mjs`: the Playwright + `vite preview` pattern for headless phone checks (412×915)
- `.planning/milestones/v1.0-phases/01-foundation-legal-shell/01-03-SUMMARY.md`: deploys go through `wrangler pages deploy` (direct upload). The README's "Connect to Git" section is stale.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `cast.js` (spike 002): `Px` grid builder, `SPRITES`, `renderCanvas`, `dataURL`. It covers the hub card art, the snowball sprite (new, same vocabulary), the app icon (D-15) and the share-card lineup (D-16).
- `sources/hub-index.html`: card markup and CSS (`a.card`, `.k` kicker, `.t` title, `.d` blurb, 64 px pixelated portrait) to grow into the real hub.
- `SaveService.ts`: the IndexedDB robustness pattern to mirror in `src/shared/progressStore.ts`.
- `i18n.ts`: dependency-free `t(key)`, reusable unchanged on every page.
- `public/fonts/press-start-2p-latin.woff2` plus its `<link rel="preload">` pattern in `index.html`. Pixelify Sans follows the same pattern.
- `smoke.mjs`: the Playwright harness pattern (vite preview, 412×915, console/pageerror/requestfailed capture).

### Established Patterns
- Pure TS modules have no Phaser import (`src/systems/{Economy,MoodPendulum,...}.ts`). `src/shared/*` and the hub extend this convention.
- `manualChunks: { phaser: ['phaser'] }` already isolates Phaser, so the hub never loads it as long as `src/shared/*` stays Phaser-free.
- The legal links in `MainMenu.ts`/`Settings.ts` are Phaser text with extended ≥44 px hit areas, opened with `window.open('/impressum', '_self')`. The "← HUB" button reuses this. The `gsd/fix-menu-taps` fix (full-label hit areas) must be merged first, since it touches the same code.
- Vitest runs in Node and reads static files with `readFileSync`. There is no DOM runner, so hub DOM behaviour gets verified headlessly with Playwright probes.

### Integration Points
- Root `index.html` → hub entry. `adventure/index.html` → the same `<script src="/src/main.ts">` + `#game-container` as today. Asset paths must survive the move under `base: './'`; verify on the preview with a direct URL load.
- `datenschutz.html`'s "← ZURÜCK ZUM SPIEL" link and the adventure's legal links point at `/`, which becomes the hub. That's acceptable, but check that every legal page keeps a way back.
- The adventure's save (`bw-saves`, origin-scoped IndexedDB) survives the path move without migration. Verify that existing saves load (INFR-07).
- The installed-PWA icon now opens the hub instead of the adventure. This is intended.

</code_context>

<specifics>
## Specific Ideas

- "Grow the spike phone hub": the user already played `.planning/spikes/index.html` on Android and loved it. The real hub should feel like that page's polished, finished version, not a new design.
- The pixel snowball as the streak symbol is the compounding metaphor made visible. It should feel like a small reward, never a chore.
- The first X post should be able to say "Daily #1" (D-08).
- Nothing on the hub may read as an ad. The credit is visible but quiet, and the X follow prompt appears only on locked cards and their sheet.

</specifics>

<deferred>
## Deferred Ideas

- ADV-01: a full phone pass of the adventure (v1.0 Phases 3.1 + 4) and the whack/pause hit-area fix stay in Future Requirements. Phase 5 only does a headless regression run plus a quick look during the sign-off (D-13).
- Preview-URL privacy (e.g. Cloudflare Access in front of the preview alias): raised as a candidate gray area but not discussed. Default: an unshared, unlinked preview alias, `noindex` by Cloudflare's default.

### Reviewed Todos (not folded)
- `2026-06-11-research-gewerbe-versicherung-finanz-content.md` (Gewerbe-Versicherung für Finanz-Content recherchieren): **kept for Phase 6**, to be settled before the first public deploy. Phase 5 has no public deploy.

</deferred>

---

*Phase: 05-consolidate-shared-shell-hub-checkpoint*
*Context gathered: 2026-10-08*
