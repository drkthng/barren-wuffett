# Requirements: Barren Wuffett

**Defined:** 2026-10-07 (milestone v2.0 The Barren Wuffett Hub)
**Core Value:** A fun, replayable Buffett parody that people come back to daily and share on X. Entertainment is the product, a growing @Wolfhartvest following is the win, and nothing ever feels like an ad.

v1.0's requirements (adventure + email funnel) are archived in `milestones/v1.0-REQUIREMENTS.md`. Category prefixes continue from v1.0 where they still fit (INFR, VIRL, LEGL).

## v2.0 Requirements

### Baseline & Build

- [ ] **INFR-06**: `main` contains the full Level 1 work (v1.0 Phases 2.1-4), the menu-tap fix (`gsd/fix-menu-taps`) and the spike docs, with every existing test green
- [ ] **INFR-07**: Player opens the adventure at `/adventure/` and it plays as before: existing saves load, and a headless phone-viewport regression run reaches the boss and the level-complete screen
- [ ] **INFR-08**: Each page (`/`, `/arcade/`, `/snowball/`, `/ceo/`, `/adventure/`) loads directly from a fresh URL on the deployed site with zero 404s and zero CSP violations
- [ ] **INFR-09**: A returning player whose browser cached the previous build gets the new build, including newly unlocked tiles, on their next visit after a release, without clearing site data
- [ ] **INFR-10**: Every build can be checked on a non-public Cloudflare preview URL first. The public site changes only on the user's explicit go-ahead, and the first public hub deploy ships together with the arcade

### Shared Shell

- [ ] **SHELL-01**: Every new game shows "made by @Wolfhartvest" on its title and end screens, sourced from one config constant
- [ ] **SHELL-02**: Every new game has an About overlay with "parody · not affiliated · not investment advice" and the creator's website (compoundingknowledge.com, About only)
- [ ] **SHELL-03**: Every player gets the same daily game per UTC day, numbered "Daily #N" consistently across the hub and all games, and `?date=` reproduces any day
- [ ] **SHELL-04**: The code-drawn cast (old Barren, Charlie, Mr. Market greed/panic/neutral, extras) renders in the real build at phone size, matching spike 002
- [ ] **SHELL-05**: Player taps Share and gets the native share sheet on a phone, or clipboard + X intent on desktop, with text ending in "made by @Wolfhartvest" and the game's URL passed separately
- [ ] **SHELL-06**: All new pages run under the strict CSP with self-hosted fonts (Press Start 2P, Pixelify Sans) and make no third-party requests except the analytics beacon
- [ ] **SHELL-07**: Every new game exposes the test hooks headless phone checks rely on: `?date`, `?speed`, `?bot`, a `window.__X__` probe, and an exportable forensic log

### Hub

- [ ] **HUB-01**: Player opening the site root sees the hub: one tile per game with cast art, and every live game opens with one tap
- [ ] **HUB-02**: Unreleased games show as locked tiles reading "coming soon, follow @Wolfhartvest" (no countdown) that link to the X profile, and flipping a game from locked to live is a single config change
- [ ] **HUB-03**: The adventure has its own tile, labelled as an early demo, which opens `/adventure/`
- [ ] **HUB-04**: Player sees today's checklist: which live dailies they have finished today (finished = reached that game's end screen)
- [ ] **HUB-05**: Player sees a play streak that grows by one per UTC day with at least one finished daily, and silently restarts at 1 after a missed day (no loss message, no freeze)
- [ ] **HUB-06**: After their 2nd streak day, player sees a dismissible hint to add the hub to their Home Screen ("keep your bests and endings safe"): the native prompt on Android, a two-step instruction on iOS. Once dismissed, it never returns
- [ ] **HUB-07**: Checklist, streak and best scores survive reloads, and the hub and games still work when storage is unavailable (e.g. private mode)

### Mr. Market Arcade (Release 1)

- [ ] **ARC-01**: Player plays a 60 s one-thumb drag run, catching panic bargains and dodging greedy junk while the compounding snowball grows, ported from spike 003a into the real build (npm Phaser)
- [ ] **ARC-02**: The day's market is identical for every player at any frame rate (a per-date fingerprint test passes), and visual-effect randomness never touches the seeded schedule
- [ ] **ARC-03**: The end screen shows final value, %/yr, rank and decade squares, with Share and Play again. Reaching it ticks the arcade on the hub checklist and updates the best score
- [ ] **ARC-04**: Good and bad items read at a glance on a phone through shape and colour families, confirmed in the phone feel pass
- [ ] **ARC-05**: Sound plays on iPhone Safari after the first tap, and sharing from the end screen opens the share sheet on iPhone
- [ ] **ARC-06**: The arcade passes the user's phone feel pass (length and busyness tuned) before release, and balance sims still show smart play clearly beating idle and random play

### Snowball Idle (Release 2)

- [ ] **IDLE-01**: Player lives a ~5-minute compounding life from age 6 to 90 (hustle taps, buy and reinvest), ported from spike 003b as DOM + a pure economy model
- [ ] **IDLE-02**: Each day's life deals the same seeded Mr. Market offers to everyone (crash first), reproducible with `?date=`
- [ ] **IDLE-03**: The end screen shows the life's result and rank, with Share and Play again. Reaching it ticks the idle game on the hub checklist and records the best
- [ ] **IDLE-04**: The idle game passes the user's phone feel pass (life length, pacing) before release, and sims show patience beating spending for a "saver" policy

### Barren the CEO Swipe (Release 3)

- [ ] **CEO-01**: Player swipes cards left or right as Barren the CEO, balancing 4 two-sided meters with aging drift, ported from spike 003c (33 cards) as DOM + a pure deck model
- [ ] **CEO-02**: Swiping on iPhone Safari never triggers pull-to-refresh, page scroll or rubber-banding, including fast flicks and edge drags
- [ ] **CEO-03**: Player collects endings in a 3×3 grid (undiscovered endings show "???") that persists across runs
- [ ] **CEO-04**: The end screen shows the ending and a career summary, with Share and Play again. Reaching it ticks the CEO game on the hub checklist
- [ ] **CEO-05**: The swipe game passes the user's phone feel pass before release, including one reader outside finance, and sims show the deck isn't solved (thoughtful play wins about half the time, random play dies early)

### Share & Launch Kit

- [ ] **VIRL-03**: Pasting any page's URL into X shows a card with that page's own 1200×630 image, title and description (absolute URLs), verified in X's card preview after each deploy and before posting
- [ ] **VIRL-04**: Each release comes with a short gameplay clip (MP4 + GIF) recorded headlessly on a phone viewport, ready to attach to its X post
- [ ] **VIRL-05**: Share text carries the game, daily number, result + rank and an emoji line, and never spoils the day's game (rank and categories only, no event order)

### Analytics & Legal

- [ ] **MEAS-01**: Creator can see page views per page (hub and each game) in Cloudflare Web Analytics, with no cookies set and the beacon allowed by the CSP
- [ ] **LEGL-05**: The privacy page describes exactly what the site does: Cloudflare hosting, cookieless analytics and on-device progress storage, with no Supabase, Brevo or email mentions
- [ ] **LEGL-06**: Every release passes a written self-audit over all its text (UI strings, share text, share card, page meta): parody names only, no endorsement, no portfolio/eToro/wikifolio links, credit visible, nothing reads as investment advice. The user signs it off before the public deploy
- [ ] **LEGL-07**: Impressum and Datenschutz are reachable within two taps from every page (hub and each game)

## Future Requirements

Deferred: acknowledged, but not in this milestone's roadmap.

### Content & Depth

- **CEO-06**: The swipe deck grows beyond 33 cards as a post-launch content cadence (each batch can be its own X post)
- **IDLE-05**: Idle personal-best comparison, only if the feel pass finds the 5-minute life too thin (never a prestige loop)
- **HUB-08**: Silent one-day streak grace, only if players find the streak too brittle

### Adventure

- **ADV-01**: Phone check of the v1.0 Phases 3.1 + 4 build, plus the whack/pause hit-area fix (pending todo)
- **ADV-02**: Story & Heart (7-beat young-Barren spine) and Levels 2-3, per the archived v1.0 roadmap

### Reach

- **I18N-01**: German localization (strings already go through `t(key)`)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Accounts / login / cross-device sync | Needs a backend + consent flow, which the 2026-10-06 pivot dropped. Progress is device-only and disposable, like Wordle's |
| Leaderboards / any server-side state | €0 static hosting only. The shared daily seed + share text do the comparison job |
| Email capture, newsletter, Supabase, Brevo | Credit-only funnel (pivot decision 2026-10-06) |
| eToro / wikifolio / portfolio links in any game, Barren endorsing anything | Parody + endorsement legal risk (PITFALLS #4); UWG §5a(4) |
| Push notifications | Notification-begging anti-pattern (ENGAGEMENT.md), weak iOS web-push support, needs a consent prompt |
| Streak-loss guilt messages, streak-freeze purchases | Named anti-pattern; no monetization to sell from |
| Countdown timers on locked tiles | Manufactured urgency; release dates depend on feel passes, not a calendar |
| Idle prestige / ascension loop | The format resets daily by seed. A prestige loop needs new cross-day state and risks turning the comedy into a grind |
| Per-game installable PWA scopes | One root-scope PWA covers the hub; more scopes add complexity nothing needs |
| UI framework (React/Vue) or client-side router for the hub | Multi-page static HTML + vanilla TS is enough; the spikes proved DOM formats without one |
| Native app stores, payments | Unchanged from v1.0: browser first, no monetization in-game |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFR-06 | Phase 5 | Pending |
| INFR-07 | Phase 5 | Pending |
| INFR-08 | Phase 5 | Pending |
| INFR-09 | Phase 5 | Pending |
| INFR-10 | Phase 6 | Pending |
| SHELL-01 | Phase 5 | Pending |
| SHELL-02 | Phase 5 | Pending |
| SHELL-03 | Phase 5 | Pending |
| SHELL-04 | Phase 5 | Pending |
| SHELL-05 | Phase 5 | Pending |
| SHELL-06 | Phase 5 | Pending |
| SHELL-07 | Phase 5 | Pending |
| HUB-01 | Phase 5 | Pending |
| HUB-02 | Phase 5 | Pending |
| HUB-03 | Phase 5 | Pending |
| HUB-04 | Phase 5 | Pending |
| HUB-05 | Phase 5 | Pending |
| HUB-06 | Phase 5 | Pending |
| HUB-07 | Phase 5 | Pending |
| ARC-01 | Phase 6 | Pending |
| ARC-02 | Phase 6 | Pending |
| ARC-03 | Phase 6 | Pending |
| ARC-04 | Phase 6 | Pending |
| ARC-05 | Phase 6 | Pending |
| ARC-06 | Phase 6 | Pending |
| IDLE-01 | Phase 7 | Pending |
| IDLE-02 | Phase 7 | Pending |
| IDLE-03 | Phase 7 | Pending |
| IDLE-04 | Phase 7 | Pending |
| CEO-01 | Phase 8 | Pending |
| CEO-02 | Phase 8 | Pending |
| CEO-03 | Phase 8 | Pending |
| CEO-04 | Phase 8 | Pending |
| CEO-05 | Phase 8 | Pending |
| VIRL-03 | Phase 6 | Pending |
| VIRL-04 | Phase 6 | Pending |
| VIRL-05 | Phase 6 | Pending |
| MEAS-01 | Phase 5 | Pending |
| LEGL-05 | Phase 5 | Pending |
| LEGL-06 | Phase 6 | Pending |
| LEGL-07 | Phase 5 | Pending |

**Coverage:**
- v2.0 requirements: 41 total
- Mapped to phases: 41
- Unmapped: 0 ✓

---
*Requirements defined: 2026-10-07*
*Last updated: 2026-10-07 after v2.0 roadmap creation (Phases 5-8, 41/41 requirements mapped, no orphans)*
