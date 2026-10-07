# Barren Wuffett

## What This Is

A free, mobile-first browser mini-game hub (HTML5/PWA at barren-wuffett.pages.dev) starring Barren Wuffett, a loving parody of the iconic old value investor, with Charlie as his sidekick and Mr. Market as the villain. Short, replayable daily games (the Mr. Market arcade, the Snowball idle life and the Barren-the-CEO swipe satire) sit beside the original Level 1 adventure. Each one plays in minutes and is built to be shared on X. The only funnel is credit: "made by @Wolfhartvest" on screens and in share text, and the creator's website in the About screen.

## Core Value

A fun, replayable Buffett parody that people come back to daily and share on X. Entertainment is the product, a growing @Wolfhartvest following is the win, and nothing ever feels like an ad.

## Business Context

- **Customer**: value-investing and finance fans on X first, casual phone players second
- **Revenue model**: none directly. The games grow the creator's X following, which leads indirectly to their website, eToro and wikifolio
- **Success metric**: X follower growth per release, backed by plays per release (Cloudflare Web Analytics, cookieless)
- **Strategy notes**: `.planning/spikes/WRAP-UP-SUMMARY.md` and the `spike-findings-barren-wuffett` skill (the pivot blueprint)

## Current Milestone: v2.0 The Barren Wuffett Hub

**Goal:** Turn barren-wuffett.pages.dev into one mini-game hub starring old Barren. Release the arcade, the idle game and the swipe game one at a time, each with its own X post, and grow @Wolfhartvest's following.

**Target features:**
- Baseline: merge the unmerged Level 1 branch chain (2.1 → 4) and the menu-tap fix into `main`. Port the shared spike modules (config + handle constant, daily seed, share flow, credit/About/legal overlay, code-drawn cast) into the real Vite + TS build, within its CSP.
- Hub page at the site root:
  - tiles for all four games; unreleased ones are locked "coming soon, follow @Wolfhartvest" teasers
  - a daily checklist and a play streak, stored on the device only
  - the adventure behind its own tile as an early demo, unchanged
- Release 1, the Mr. Market arcade: port, phone feel pass, per-game share card + gameplay clip, deploy
- Release 2, the Snowball idle game: port, phone feel pass, share card + clip, deploy
- Release 3, Barren the CEO (swipe): port, phone feel pass, share card + clip, deploy
- Cookieless Cloudflare Web Analytics, with a privacy page that matches it (Supabase/Brevo mentions removed)

## Requirements

### Validated

<!-- Shipped in v1.0 and still relied upon. -->

- ✓ Phaser 4 + Vite + TypeScript scaffold: portrait pixel-art config, `t(key)` i18n seam, ContentRegistry, Wave-0 test harness (v1.0 Phase 1)
- ✓ Legal shell: Impressum via the compoundingknowledge.com Geltungssatz, Datenschutz page, legal links within two taps, security headers + strict CSP, Cloudflare Pages deploy (v1.0 Phase 1)
- ✓ Web Share flow: share text built synchronously, `navigator.share` awaited first so iOS keeps the gesture (v1.0 Phase 2)
- ✓ Cozy pixel-art pipeline (Kenney Tiny Town CC0 → tilemap + spritesheet anims) with asset provenance tracking (v1.0 Phase 2.1)
- ✓ Level 1 adventure playable offline: overworld, touch controls, IndexedDB save, newspaper verb + economy, paper route, Mr. Market Mood Pendulum boss (v1.0 Phases 2-4; 3.1 + 4 never got their phone check, so it ships as-is as an early demo)

### Active

<!-- v2.0 scope. Hypotheses until shipped. Detailed REQ-IDs live in REQUIREMENTS.md. -->

- [ ] One consolidated `main` holding the Level 1 work, the menu-tap fix and the hub
- [ ] Shared hub modules in the real build: handle/site config, daily seed, share flow, credit/About/legal overlay, code-drawn cast
- [ ] Hub page at the site root with game tiles, locked teaser tiles, a daily checklist + streak (stored on the device only), and the adventure tile
- [ ] Mr. Market arcade released: ported, tuned on the phone, share card + gameplay clip, deployed
- [ ] Snowball idle game released: ported, tuned on the phone, share card + clip, deployed
- [ ] Barren the CEO swipe game released: ported, tuned on the phone, share card + clip, deployed
- [ ] Working X/OG share cards (absolute URLs, real images) for the hub and each game
- [ ] Cookieless Cloudflare Web Analytics, with a privacy page that matches what the site actually does

### Out of Scope

- Email capture, cloud-save, Supabase, Brevo, newsletter: dropped in the 2026-10-06 pivot. The funnel is credit only, and it avoids GDPR double-opt-in overhead and a backend
- eToro / wikifolio / portfolio links inside any game, and Barren endorsing anything: parody + endorsement is a legal risk (PITFALLS #4), and under UWG §5a(4) subtle must not mean hidden
- Leaderboards or any server-side state: €0 static hosting only. The shared daily seed and share text do the social job
- Investment Journal collectibles: they were a device for the old funnel. Revisit only as pure entertainment
- New adventure content (Story & Heart, Levels 2-3): the adventure is linked as-is. Revisit after the three releases, based on how it's played
- Native App Store / Play Store apps: browser/PWA first, since stores bring review risk, a revenue cut and rules about finance links
- Payments / in-app purchases: no monetization inside the game
- German localization: English first for the X audience; strings stay in `t(key)` for later
- Real names, photos, voices or logos of real people or companies: parody names and traits only

## Context

- **History:** v1.0 (a Zelda-light adventure + email funnel) shipped Phases 1-4 and stopped there. A feel audit (2026-08-04) and the pivot assessment (2026-10-06) found the adventure play-once, content-heavy and weakly shareable. The tech foundation, hosting, legal shell and reusable systems were kept, and the game design was overhauled.
- **Pivot spikes (2026-10-06/07):** 002 (code-drawn old-Barren cast), 003a (Mr. Market arcade), 003b (Snowball idle) and 003c (Barren-CEO swipe) were all played on Android Chrome. The user loved every direction, which led to the one-hub, staggered-release plan. The blueprint, with proven numbers, balance-sim findings and porting costs, lives in the `spike-findings-barren-wuffett` skill. The spike sources are in `.planning/spikes/`.
- **Open feel questions carried forward:** the arcade's 60 s length and item busyness; the idle game's life length and whether it needs a prestige loop; whether the swipe game is funny beyond finance followers, and whether 33 cards is enough.
- **Repo state at milestone start:** `main` holds only Phase 2. Phases 2.1 → 3 → 3.1 → 4 sit on stacked unmerged branches, with `spike/pivot-formats` on top. The menu-tap fix (commit ab9cbe1) is on `gsd/fix-menu-taps`, with a follow-up todo for the whack/pause hit areas. The live site is still the 2026-06-11 Phase-1 build.
- **Porting costs (known):**
  - the CSP (`script-src 'self'`, `font-src 'self'`) needs npm Phaser and a self-hosted Pixelify Sans
  - Vite 6's default target rejects top-level await
  - strings go through `t(key)`
  - the current OG card is broken: relative `og:image` URLs and a blank navy image
- **Verification practice:** unit tests miss experiential breakage. Every release is played headlessly on a phone viewport (Playwright, `window.__X__` probes, screenshots), then checked by the user on a real phone before any deploy.
- **Operator:** based in Germany, so GDPR, the Impressum duty and UWG apply. The X handle is @Wolfhartvest and the website is compoundingknowledge.com.

## Constraints

- **Budget**: 0 € recurring. Static hosting on Cloudflare Pages free tier; no backend services
- **Platform**: mobile portrait first in the browser (HTML5/PWA); desktop is secondary
- **Release cadence**: each format ships as soon as it passes its phone feel check. One release is one X post. Public deploys happen only with the user's explicit go-ahead
- **Legal**: parody framing and parody names only. Credit is visible, never hidden (UWG §5a(4)). Nothing in the game reads as investment advice or an endorsement. The privacy page must match exactly what the site does
- **Tech**: the existing Phaser 4.1 + Vite 6 + TS build and its strict CSP; Phaser for action formats, DOM for text-heavy formats (per the spike conventions)
- **Skills**: no prior game-dev experience. Claude builds, and the user judges by feel on a real phone

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Browser/PWA first, no app stores | Instant shareable distribution, no store rules on finance links, no revenue cut | ✓ Good |
| One core genre (Zelda-light top-down) + mini-game accents | Four full genres = four games of effort | ⚠️ Superseded 2026-10-06: the adventure is play-once and weakly shareable; replaced by a hub of short-session formats |
| v1 scope = childhood/youth (3-5 levels) | Fastest complete arc | ⚠️ Superseded: Level 1 only, kept as a demo in the hub |
| 16-bit pixel-art style | Genre homage, reliable for AI/free assets, small for web | ✓ Good: cozy CC0 pipeline for the adventure, code-drawn cast for the hub |
| English first | Larger audience, international topic | ✓ Good (kept) |
| Email capture via cloud-save + bonus unlock + leaderboard | Cloud-save converts best | ✗ Dropped 2026-10-06: credit-only funnel, no backend |
| Investment Journal must stand on its own | Funnel content must be unannoying and valuable | ✗ Dropped with the email funnel |
| Loving-parody tone with parody names | Legally safest, most shareable | ✓ Good: now the iconic OLD Barren (white swept-back hair, big glasses, Cherry Fizz) |
| Free tiers only | Zero-cost operation | ✓ Good (kept, now static-only) |
| Entertainment first, funnel last (2026-06-15 rearrange) | Don't build a funnel on an unfun game | ✓ Good: led to the feel audit and the pivot |
| ONE mini-game hub, staggered releases: arcade → idle → swipe; adventure kept | User loved all four spiked directions on the phone (2026-10-06) | — Pending |
| Credit-only funnel: "made by @Wolfhartvest" + share text + website in About | "Extremely subtle", but UWG means visible; X followers already count as a win | — Pending |
| Code-drawn cast (`cast.js`) for the hub's art | No licence or likeness risk, consistent across formats, reads at phone size | — Pending (validated in spike 002) |
| Shared daily seed + device-only progress (checklist, streak, bests) | Wordle-style daily return without a backend | — Pending |
| Cookieless Cloudflare Web Analytics | See plays per release without a consent banner or cookies | — Pending |
| Each release: port → phone feel pass → share card + clip → deploy on go-ahead | The user judges by feel; the experiential gate was skipped three times in v1.0 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-07 after starting milestone v2.0 (pivot to the mini-game hub)*
