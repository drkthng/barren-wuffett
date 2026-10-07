# Project Research Summary

**Project:** Barren Wuffett
**Domain:** Mobile-first HTML5/PWA pixel-art top-down adventure + trust-first marketing funnel
**Researched:** 2026-06-11
**Confidence:** HIGH

## Executive Summary

Barren Wuffett is a free, mobile-first HTML5/PWA browser game built in Phaser 4 + TypeScript + Vite on Cloudflare Pages (zero-cost hosting). It parodies Warren Buffett's early life across 3-5 top-down adventure levels, using the game itself as a trust-building email funnel to drive traffic to the creator's wikifolio/eToro portfolios. Research across five dimensions -- stack, features, architecture, pitfalls, and engagement -- converges on a single strategic principle: **the game must earn trust before it asks for anything**. The audience is finance-curious adults with above-average skepticism toward lead-generation schemes; every design decision must pass the test "would this embarrass the creator if written up as a dark pattern?"

The recommended architecture is offline-first with optional backend. The game is fully playable in a browser with no account, no login, and no email required for any level. IndexedDB (via idb-keyval) is the durable local store. Supabase is introduced only when a player actively opts into cloud-save, and anonymous Supabase sessions are never created at game boot -- each one counts toward the 50k MAU free-tier quota. The email capture funnel is built around three genuinely value-delivering touchpoints: a cloud-save offer after Level 1 completion (15-25% opt-in rate), a leaderboard submission gate, and a bonus Investment Journal unlock -- none of which block progress for players who decline.

The key tension in the research is timing: FEATURES.md argues "email capture is the funnel MVP and must ship with Level 1," while ARCHITECTURE.md and PITFALLS.md argue the game must be fully offline-playable first and Supabase deferred to avoid free-tier entanglement. The resolution is sequential, not either/or: **build the game fully offline-playable first (Phase 2), then build and test all funnel infrastructure -- Impressum, Privacy Policy, custom SMTP, double-opt-in flow -- before any public URL is shared (Phase 3).** A launch without a working funnel wastes the launch traffic; a launch with a broken or legally non-compliant funnel is worse. The funnel must be complete and tested before launch, but must not be built before the game works on a real iPhone.

---

## Key Findings

### Recommended Stack

The stack is zero-cost and deliberately minimal. Phaser 4 (v4.1.0, released April 2026) is the clear engine choice: largest community, most LLM training data, full TypeScript types, native Tiled JSON tilemap support, and built-in iOS audio unlock handling. Vite 6 + TypeScript 5 provides the build layer; vite-plugin-pwa adds service-worker and web-app-manifest with a single import. Cloudflare Pages hosts the static bundle with unlimited bandwidth on the free tier -- critical if any social share goes viral. Supabase (free tier: 500 MB DB, 50k MAU/month) provides Postgres, Auth, and Row-Level Security. Brevo handles transactional and marketing email (300 emails/day free, unlimited stored contacts, native double opt-in, EU-based infrastructure, DPA included). Aseprite ($20 one-time) is the only non-free tool and the clearest ROI in the budget.

**Core technologies:**
- **Phaser 4.1.0**: Game engine (rendering, scenes, input, tilemaps, audio) -- most LLM knowledge, full TS types, active maintenance
- **TypeScript 5 + Vite 6**: Type-safe game code + fast dev server + PWA plugin host -- catches LLM-generated code errors at compile time
- **vite-plugin-pwa 0.21.x**: Service worker, offline cache, installable PWA -- zero-config Workbox integration
- **Cloudflare Pages**: Static hosting -- unlimited bandwidth on free tier, critical for viral resilience
- **Supabase (free tier)**: Auth + Postgres for cloud-save + leaderboard -- real SQL, RLS, magic-link auth
- **Brevo (free tier)**: Transactional + marketing email -- double opt-in native, EU infra, DPA, unlimited stored contacts
- **phaser4-rex-plugins (VirtualJoystick)**: On-screen mobile joystick -- battle-tested standard for Phaser mobile
- **idb-keyval**: IndexedDB wrapper for local save -- async, non-blocking, avoids localStorage 5 MB cap and Safari 7-day eviction

**Key version warning:** Use phaser4-rex-plugins (not phaser3-rex-plugins) -- wrong package causes silent import errors.

### Expected Features

The feature research draws a hard line between features that serve the audience (trust-building, value-delivering) and features that exploit them (dark patterns the finance audience recognizes and abandons). Conversion benchmark: 15-25% email opt-in from players completing Level 1, with 50-70% ticking the marketing consent checkbox. Lead quality is high because they are self-selected, invested players.

**Must have for launch (table stakes + funnel):**
- Touch controls (virtual D-pad) -- mobile-first audience; keyboard-only is unplayable
- Portrait-mode support with orientation overlay -- >70% of mobile sessions start in portrait
- Audio toggle (music + SFX, persisted) -- iOS auto-play policy makes this non-optional
- Loading progress indicator -- blank screen on first load kills first impressions
- Local save (IndexedDB) -- prerequisite for cloud-save; prevents frustration on refresh
- Cloud-save email gate (post-Level-1, "save progress" framing) -- primary conversion mechanism; must ship at launch
- Investment Journal (1 entry per level, email-gated) -- the value payload that makes the email ask feel fair
- Barren's Wisdom end-screen with portfolio link (one per level, discreet) -- the only explicit funnel mention
- Impressum + Privacy Policy pages -- legally mandatory before any public URL goes live
- Share card (Canvas-rendered, spoiler-free) -- zero-cost distribution; boss defeats become acquisition touchpoints
- og:image + og:title + og:description meta tags -- ensures share cards render in social previews

**Should have -- add after core loop is validated (v1.x):**
- Leaderboard -- add when >100 email captures (dead leaderboard is worse than none)
- PWA install prompt -- add after first 50 players; trigger after Level 1 completion
- Service worker / offline support -- add after PWA install is proven stable
- Referral bonus system -- add when share card click data shows measurable referral patterns
- Bonus Journal "deep cut" unlock -- secondary email touchpoint for non-converters

**Defer to v2+:**
- Daily login streaks / FOMO timers -- contradicts the Buffett brand and backfires with this audience
- Paid level packs (Graham era, Berkshire era) -- architecture prepared from v1; build payment only after traction
- German localization -- English first; i18n key structure kept tidy from day one
- Charlie Munger companion character ("Chucky") -- delightful v2 addition, disproportionate v1 scope

**Anti-features (never build in v1):**
- Forced login before play, interstitial ads, aggressive popups, pre-ticked marketing checkboxes, daily streak guilt, variable-reward loot boxes, energy systems, pay-to-skip difficulty inflation, FOMO timers

### Architecture Approach

The architecture is offline-first, scene-as-state, content-as-data. All game state writes go to IndexedDB immediately; cloud sync is fire-and-forget async only when the player has linked an email. The Supabase anonymous session is created only on explicit player opt-in -- never at game boot. Each distinct mechanic (top-down overworld, platformer accent, boss fight) is its own Phaser scene; the overworld sleeps and the mini-game launches, then the overworld wakes on MINIGAME_COMPLETE. A Global Event Bus (singleton EventEmitter) decouples all cross-scene communication. Level data lives in TypeScript manifest objects in src/data/levels/; adding a new level = adding one data file, no engine code changes.

**Major components:**
1. **Scene Manager + Global Event Bus** -- scene lifecycle and decoupled cross-scene messaging; prevents monolithic scene anti-pattern
2. **InputBus (Touch + Keyboard abstraction)** -- unified Action enum; VirtualJoystick on mobile; must be built before any game entity
3. **SaveService (IndexedDB-primary, Supabase-secondary)** -- local writes always first; cloud sync is fire-and-forget; backend is authoritative for recovery after iOS storage eviction
4. **ContentRegistry + Level Manifests** -- all level/NPC/journal data as TypeScript objects; engine reads manifests, never hard-codes level logic
5. **UIScene (parallel overlay)** -- persistent HUD, dialogue boxes, email capture modal; always-on scene layered above game scenes
6. **JournalService** -- tracks unlocked entries; serialized to save state; entries defined in content data
7. **SupabaseClient singleton** -- single import point for all backend calls; never imported directly into scenes

**Suggested build order (from ARCHITECTURE.md):**
Vite scaffold -> Boot/Preload/Menu -> InputBus -> OverworldScene + tilemap -> ContentRegistry + first level manifest -> i18n Service -> UIScene + DialogueBox -> Entity system -> TriggerSystem -> First mini-game scene -> SaveService (local only) -> JournalService -> BossScene -> Supabase integration -> Email capture flow -> PWA hardening

### Critical Pitfalls

1. **The Four Genres Trap** -- Building platformer, point-and-click, Kingdom-style, and Zelda-style as equal pillars = four games of work, project never ships. Prevention: mini-games capped at 20% of total dev time; core Zelda loop ships and is locked before any mini-game work begins; any mini-game requiring its own tileset or new physics does not ship in v1.

2. **iOS Safari Audio Lockout** -- All audio is silent on iOS until AudioContext.resume() is called inside a direct user gesture. Phaser 4 has built-in iOS audio unlock; test on a real iPhone (not simulator) as Phase 2 acceptance criterion.

3. **iOS WebGL Memory Crash** -- Oversized texture atlases cause silent browser process termination after 2-5 minutes on iPhones. Hard cap: no single atlas larger than 2048x2048. Load per-level, unload on exit. Test on iPhone SE before declaring any level complete.

4. **German Personality Rights (Persoenlichkeitsrecht)** -- Using Buffett's recognizable traits primarily for commercial traffic can fail the German primary-purpose test. Prevention: parody names everywhere ("Barren Wuffett," "Mr. Market"), no realistic likeness, explicit parody labeling. Run full-text search for "Warren," "Buffett," "Munger," "Berkshire" before launch -- none should appear in any user-facing string.

5. **GDPR/UWG Double Opt-In Missing** -- German UWG Section 7 independently requires confirmed double opt-in for marketing email (fines up to EUR 50,000). The Supabase default SMTP (2 emails/hour) will fail at any real launch traffic; Brevo custom SMTP must be configured before any user-facing testing.

6. **Impressum Missing at Launch** -- Section 5 TMG requires full contact info reachable within two clicks from any public URL. Abmahnanwaelte actively scan new sites; missing Impressum triggers EUR 300-1,500 demand per incident. Create /impressum and /datenschutz before any domain goes live.

7. **Supabase Anonymous Sessions at Boot** -- Creating anon sessions on game start means every bot and 5-second bounce counts as MAU. At 50k MAU the free tier ends. Delay all Supabase auth until explicit player opt-in.

8. **PWA iOS Storage Eviction** -- iOS silently evicts IndexedDB after ~7 days of PWA inactivity. Save architecture must treat Supabase as authoritative store and local cache as performance optimization only; pull from backend on load if local state is missing.

9. **Email Gate Timing** -- An email prompt before meaningful gameplay produces 70-90% bounce from the finance-audience. Gate must trigger only after Level 1 completion, framed as "save your progress" not "sign up for updates."

10. **Investment Journal as Regulated Financial Promotion** -- Specific buy/sell recommendations or return forecasts require BaFin authorization. Every Journal entry must be educational/personal-opinion, with a visible "not investment advice" disclaimer, attributed to creator, portfolio link framed as "see how I apply these principles."

---

## Implications for Roadmap

The research points to a four-phase structure. Sequencing is driven by three constraints: (1) legal pages must exist before any public URL, (2) the game must work on iOS before any backend work, (3) funnel infrastructure must be complete and tested before launch but built after the game is proven.

### Phase 1: Project Foundation and Legal Shell

**Rationale:** Legal exposure begins the moment a public URL exists. Impressum, Privacy Policy, and parody-naming conventions must be established before anything is publicly accessible. The development scaffold must enforce technical constraints (pixel-art config, per-level asset loading caps, iOS audio unlock wiring, touch input) that are nearly impossible to retrofit.

**Delivers:** Deployable Cloudflare Pages project with /impressum + /datenschutz routes, Vite + Phaser 4 + TypeScript scaffold with correct pixel-art config (antialias: false, pixelArt: true), PWA manifest shell, InputBus (touch + keyboard), style bible + canonical reference sprite, parody naming convention document.

**Addresses from FEATURES.md:** Mobile viewport meta tag, portrait-mode handling stub, audio toggle scaffolding, legal pages.

**Avoids from PITFALLS.md:** Impressum missing at launch (P6), German personality rights naming violations (P4), iOS audio lockout via scaffold setup (P2), iOS memory crash via 2048px atlas cap in asset pipeline (P3), touch input 300ms delay via touchstart events from day one (P11), AI asset style drift via style bible (P10).

**Research flag:** Standard patterns. No phase-specific research needed.

---

### Phase 2: Playable Core Loop -- Level 1 (Offline-Complete)

**Rationale:** The game must be fully playable offline on a real iPhone before any backend work begins. This validates the core loop, confirms iOS compatibility, and ensures Phase 3 funnel infrastructure is built for a game that actually works.

**Delivers:** Level 1 complete end-to-end -- overworld exploration, one scope-capped mini-game accent (reuses existing sprites + one new input handler), boss fight (Mr. Market first appearance), Journal entry unlock ceremony, Barren's Wisdom end-screen, local save (IndexedDB via idb-keyval), loading progress indicator, audio system with iOS unlock confirmed on real device, share card (Canvas-rendered) with og tags.

**Addresses from FEATURES.md:** Touch controls, portrait-mode, audio toggle, loading progress, local save, share card, og tags, Investment Journal entry #1, Barren's Wisdom end-screen #1.

**Avoids from PITFALLS.md:** Four genres trap -- mini-game is scope-capped before Phase 2 begins (P1); iOS audio lockout -- tested on real iPhone as acceptance criterion (P2); iOS memory crash -- 2048px cap enforced (P3); monolithic scene anti-pattern -- UIScene runs in parallel; localStorage anti-pattern -- idb-keyval from day one.

**Engagement mechanics (from ENGAGEMENT.md):** Curiosity gap cliffhanger on level-complete screen, boss foreshadowing music/palette shift 30-60s before fight, Journal unlock ritual (distinct paper-rustle SFX + brief page-appear animation), patience-vs-rushing mechanic (dog on timer in Level 1), game juice (screen shake scaled to hit size, coin clink + particle burst, button visual response <50ms), "Mr. Market in shadow" cliffhanger teaser at level end.

**Research flag:** Likely needs phase research. Phaser 4 scene.sleep()/launch()/wake() mini-game handoff and boss fight mobile control overlay benefit from targeted research during phase planning.

---

### Phase 3: Funnel Infrastructure -- Email, Backend, Legal Compliance

**Rationale:** This phase builds everything needed to convert players into email subscribers before any public traffic lands. It must be complete and end-to-end tested before launch. Building it before Phase 2 would create Supabase entanglement before the game was proven; building it after launch wastes the one-time launch traffic spike.

**Delivers:** Supabase project configured (custom SMTP via Brevo, RLS policies, cloud_saves + leaderboard tables, anon-to-email upgrade auth flow), double opt-in flow tested end-to-end with real email addresses, cloud-save email gate UI (post-Level-1, "save progress" framing), GDPR consent recording (timestamp + scope in save state), Brevo list with double opt-in enforced at list level, Privacy Policy updated to name all processors (Supabase, Brevo, Cloudflare), "resend confirmation" UI button, Supabase keep-alive configured (weekly ping), Investment Journal content written and passed through BaFin content checklist (not investment advice, creator attribution, visible disclaimer, portfolio link framed correctly), eToro/wikifolio affiliate disclosure on any page with a portfolio link, backend-primary save architecture (Supabase authoritative, IndexedDB is cache).

**Addresses from FEATURES.md:** Cloud-save email gate, Investment Journal email-gated delivery, GDPR double opt-in, email drip sequence trigger setup.

**Avoids from PITFALLS.md:** GDPR/UWG double opt-in missing (P5), Supabase SMTP rate limits at launch (P9), anonymous sessions at boot (ARCHITECTURE anti-pattern 2), PWA iOS storage eviction -- backend-primary save (P12), Investment Journal as regulated advice (P8), email gate killing retention -- correct trigger timing (P7).

**Research flag:** Needs phase research. Supabase anon-to-email upgrade auth flow, Brevo double opt-in API configuration, and GDPR consent timestamp/scope storage patterns need targeted research.

---

### Phase 4: Levels 2-5 and Launch Readiness

**Rationale:** With core loop proven and funnel working, remaining levels are built using established patterns. Each level adds one thematic mechanic. PWA hardening and install prompt are added here after the game is stable. Soft launch precedes public launch for funnel validation.

**Delivers:** Levels 2-5 (each with overworld, one scope-capped mini-game, boss fight, Journal entry, end-screen), compound interest HUD ("Wuffett Value" tracker, Level 2), buy-low timing mini-game (Level 2), Margin of Safety boss mechanic (Level 3), Mr. Market mood-cycle boss (Level 3), stock-ticker + hold/anxiety-meter boss mechanic (Levels 4-5), PWA hardening (Workbox caching strategy, offline smoke test), PWA install prompt triggered after Level 1 completion, soft launch validation, public launch.

**Addresses from FEATURES.md:** All remaining P1 Level content, PWA install prompt (P2), service worker / offline support (P2).

**Avoids from PITFALLS.md:** Four genres trap -- each level uses ContentRegistry/manifest pattern, no engine code changes (P1); scope creep -- each additional level is additive, not multiplicative.

**Engagement mechanics (from ENGAGEMENT.md):** Buy-low timing mechanic (Level 2), compound interest HUD (Level 2), Margin of Safety labeled HUD buffer in boss fight (Level 3), Mr. Market irrationality cycles (Level 3), patience-hold mechanic with visual anxiety meter (Levels 4-5), Journal entry standalone quality gate ("would I share this without the game?"), Journal entry share cards (quote-card format for finance audience).

**Research flag:** Levels 2-4 use established patterns (skip research-phase). Level 5 stock-ticker mechanic needs scoping research to define minimum viable implementation.

---

### Phase Ordering Rationale

- **Legal-first (Phase 1):** Impressum and parody naming cannot be retrofitted after a launch-day Abmahnung. They cost almost nothing to build first.
- **Game-before-backend (Phase 2 before Phase 3):** Building Supabase on top of an unproven mobile game creates double risk. Phase 2 acceptance criteria include "audio works on real iPhone SE" -- if that fails, Phase 3 does not start.
- **Funnel-before-launch (Phase 3 before any public URL sharing):** Launch without working double opt-in and verified email delivery wastes the one-time attention spike. Supabase default SMTP (2 emails/hour) is a hard blocker for any real traffic.
- **Scale-after-validation (Phase 4):** ContentRegistry/manifest pattern means each additional level is a data file addition, not engine modification. No architectural surprises.

### Research Flags

Phases needing deeper research during planning:
- **Phase 2:** Phaser 4 scene.sleep()/launch()/wake() mini-game handoff with typed data passing; boss fight mobile control hint overlay
- **Phase 3:** Supabase anonymous-to-email upgrade auth flow; Brevo double opt-in API; GDPR consent timestamp/scope storage schema
- **Phase 4 (Level 5 only):** Stock-ticker simulation scoping -- minimum viable implementation that feels authentic

Phases with standard patterns (skip research-phase):
- **Phase 1:** Vite + Phaser 4 + TypeScript has official templates; Cloudflare Pages deployment is trivially documented
- **Phase 4 (Levels 2-4):** ContentRegistry + manifest + mini-game scene handoff proven in Phase 2; no new patterns

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Engine, hosting, email tool verified against official docs/pricing pages as of 2026-06-11 |
| Features | HIGH (table stakes) / MEDIUM (conversion rates) | Conversion rate estimates (15-25%) from gamified lead-gen case studies, not this specific game |
| Architecture | HIGH | Core Phaser scene patterns and offline-first save are well-documented standards |
| Pitfalls | HIGH (technical) / MEDIUM (legal) | iOS Safari and memory crash are well-documented; legal pitfalls require qualified DE counsel before launch |
| Engagement | HIGH (theory) / MEDIUM (application) | SDT and Octalysis are peer-reviewed; specific mechanic mappings need real player feedback for calibration |

**Overall confidence:** HIGH for build decisions; MEDIUM for legal compliance (requires qualified counsel) and engagement tuning (requires real player feedback).

### Gaps to Address

- **Phaser 4 rex-plugin availability:** Verify phaser4-rex-plugins package name on npm before scaffolding. If VirtualJoystick has not been ported to Phaser 4, fall back to Phaser 3.90.
- **Legal counsel:** German Persoenlichkeitsrecht, UWG Section 7, and BaFin finfluencer regulations need jurisdiction-specific legal review before the first real subscriber is added.
- **iOS Safari Phaser 4 compatibility:** Phaser 4 is recent; test on real iPhone SE as the first Phase 2 acceptance criterion.
- **Engagement tuning:** Build difficulty parameters as level manifest data (enemy speed/health) so tuning requires no code changes.
- **eToro/wikifolio affiliate T&Cs:** Verify current disclosure requirements against eToro partner T&Cs and German UWG partner disclosure rules.

---

## Sources

### Primary (HIGH confidence)
- https://phaser.io/download/release/v4.1.0 -- version confirmation, bundle size (345 KB minified)
- https://phaser.io/news/2026/05/phaser-3-vs-phaser-4 -- migration notes, greenfield recommendation
- https://supabase.com/pricing -- free tier limits (500 MB DB, 50k MAU/month)
- https://supabase.com/docs/guides/auth/rate-limits -- 2 emails/hour default SMTP hard limit
- https://www.brevo.com/pricing/ -- 300 emails/day free, unlimited contacts
- https://developers.cloudflare.com/pages/platform/limits/ -- unlimited bandwidth on free tier
- https://github.com/vite-pwa/vite-plugin-pwa -- PWA integration approach
- Deci & Ryan -- Self-Determination Theory in Digital Games -- autonomy/competence/relatedness framework
- "Level Up or Game Over: Dark Patterns in Mobile Games" (ACM 2024) -- temporal dark patterns reduce adult appeal
- https://heydata.eu/en/magazine/opt-in-and-opt-out-how-does-double-opt-in-work-according-to-gdpr-2 -- UWG Section 7 requirement
- https://www.ionos.com/digitalguide/websites/digital-law/a-case-for-thinking-global-germanys-impressum-laws/ -- Section 5 TMG requirements

### Secondary (MEDIUM confidence)
- https://bliz.cc/blog/gamified-lead-generation -- 12-22% opt-in rate benchmarks
- https://medium.com/@tabfoundry/marketing-game-case-study-14-3-days-spent-in-the-game-674-new-leads-3-days-and-871-in-new-sales-923ea4abae77 -- 89.5% capture rate in branded game
- https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide -- iOS storage eviction behavior
- https://www.sza.de/en/thinktank/bafin-finfluencer-guide-legal-requirements-social-media -- financial promotion regulatory line
- https://se-legal.de/ai-voice-imitation-personality-rights-german-law/?lang=en -- Persoenlichkeitsrecht commercial exploitation test
- Yu-kai Chou -- Octalysis Framework -- Core Drive 4 (Ownership) applied to Investment Journal design
- Loewenstein (1994) -- Information Gap Theory -- curiosity gap mechanic design
- https://phaser.discourse.group/t/phaser-3-mobile-performance-ios-android/1435 -- iOS WebGL memory limits

### Tertiary (LOW confidence -- verify before use)
- phaser4-rex-plugins package on npm -- package name needs verification before scaffolding
- PixelLab AI review -- free tier generation limits need current verification
- eToro affiliate compliance guidelines -- current T&Cs need direct verification with eToro partner program

---

*Research completed: 2026-06-11*
*Research dimensions: Stack, Features, Architecture, Pitfalls, Engagement (5 dimensions)*
*Ready for roadmap: yes*
