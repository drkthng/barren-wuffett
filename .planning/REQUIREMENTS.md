# Requirements: Barren Wuffett

**Defined:** 2026-06-11
**Core Value:** A fun, shareable game that makes players *want* to leave their email and discover the creator's real investment portfolios — entertainment first, funnel second, never feeling like an ad.

## v1 Requirements

### Core Gameplay

- [ ] **GAME-01**: Player can move the character through a top-down pixel-art overworld with a virtual joystick/D-pad on touch devices and keyboard on desktop (input via unified InputBus)
- [ ] **GAME-02**: Player can complete 3 levels covering Buffett's childhood/youth (paper route, pinball/Coke hustle, first stock investment), each with distinct length and difficulty
- [ ] **GAME-03**: Each level ends with a boss fight (Mr. Market archetype with era-specific behavior, e.g., greed phase / panic phase)
- [ ] **GAME-04**: Each level contains at least one mini-game accent from another genre (platformer, point & click, light resource management), implemented as an isolated scene with clean handoff
- [ ] **GAME-05**: Player can talk to NPCs through a dialogue system (data-driven JSON dialogue)
- [ ] **GAME-06**: At least one core mechanic per level rewards patience/timing in the spirit of value investing (e.g., waiting for the right buy moment beats grinding)
- [ ] **GAME-07**: Music and SFX have separate persistent toggles; audio unlocks correctly on iOS after first user gesture
- [x] **GAME-08**: Game shows a branded loading progress bar and loads fast on 4G (initial bundle lean, level assets lazy-loaded, textures ≤2048px)
- [ ] **GAME-09**: Player can pause/resume anytime; settings screen reachable from main menu and pause menu
- [x] **GAME-10**: Game plays well in portrait mode on phones (orientation handled gracefully, no pinch-zoom breakage)

### Save & Progress

- [ ] **SAVE-01**: Player progress persists locally (IndexedDB) across refresh and return visits — no account needed to play
- [ ] **SAVE-02**: Game is fully playable offline-anonymous; backend is never required for core gameplay

### Funnel & Email

- [ ] **FUNL-01**: After completing Level 1, player is offered cloud-save ("never lose your progress") via email — optional, dismissible, game continues without it
- [ ] **FUNL-02**: Player unlocks one Investment Journal entry per level via email; each entry is standalone-quality investing insight in Barren's voice (quality test: "would I share this if the game didn't exist?")
- [ ] **FUNL-03**: Journal portfolio pointers read as information, not calls-to-action; discreet creator mention on level end-screens ("Barren's Wisdom" quote with small portfolio link)
- [ ] **FUNL-04**: Player who declines cloud-save can unlock an exclusive "deep cut" Journal entry via newsletter subscription (secondary, softer touchpoint)
- [ ] **FUNL-05**: Marketing consent uses a separate, unchecked checkbox with double opt-in (confirmation email); functional save consent is separate from marketing consent

### Virality

- [ ] **VIRL-01**: After each boss defeat, player can share a Canvas-rendered card (1200×630, quote-based and spoiler-free, no raw highscores) with one tap
- [ ] **VIRL-02**: Game URL renders rich previews on social/messaging platforms (og:image, og:title, og:description)

### Legal & Compliance

- [ ] **LEGL-01**: Impressum and privacy policy pages are live and linked (footer + settings) before any public URL is shared
- [x] **LEGL-02**: All persons/companies use parody names only ("Barren Wuffett" etc.) — no real names, photos, likenesses, or logos
- [ ] **LEGL-03**: Every Journal entry passes a content checklist: visible financial disclaimer, no specific buy/sell recommendation (BaFin test)
- [ ] **LEGL-04**: Data collection is minimal: email, level progress, score, consent timestamp — nothing else; every marketing email has an unsubscribe link

### Infrastructure

- [ ] **INFR-01**: Game is deployed on Cloudflare Pages (free tier) and playable via public URL
- [ ] **INFR-02**: Supabase handles email capture and cloud save; custom SMTP (Brevo) configured before any user-facing email flows
- [ ] **INFR-03**: Cookieless analytics tracks the funnel (level completions, gate conversion, share clicks) without a consent banner
- [x] **INFR-04**: Levels are defined as data manifests (ContentRegistry) — adding a level or future pack means adding data files, not engine code
- [x] **INFR-05**: All player-facing text lives in an i18n-ready structure (English content, German addable without refactor)

## v2 Requirements (Deferred)

### v1.x (after launch validation)

- **Leaderboard** — email-gated submission, public top 10; add after ~100 email captures (dead leaderboard is harmful)
- **PWA install prompt** — after Level 1 completion; add once core game is stable with first ~50 players
- **Offline play via service worker** — add once players actually install the PWA
- **Referral bonus system** — in-game cosmetic reward for shares; add when share-card analytics show traction
- **Lore-card collectibles + gallery** — ungated exploration rewards; add when there's enough content to display
- **Levels 4–5** — complete the childhood/youth arc as fast-follow updates

### v2+

- **German localization** — i18n structure is ready from v1
- **Paid level packs** (Graham era, Berkshire era) — architecture prepared via ContentRegistry; payment flow only after traction
- **Companion character "Charlie"** — purchasable sidekick; legal check (Munger personality rights) before shipping
- **Multiple save slots**

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native App Store / Play Store apps | Browser/PWA first; store rules restrict email capture and finance links, 15–30% cut |
| Payments / IAP in v1 | Monetization later; v1 only keeps architecture extensible |
| Ads (any format) | One bad ad placement poisons the trust the funnel depends on |
| Forced login wall | 93% abandonment; anonymous play is non-negotiable |
| Streaks, FOMO timers, energy systems, notification begging | Read as manipulation by finance-savvy adults; contradicts the Buffett brand |
| Aggressive email popups / pre-ticked consent | Dark patterns; pre-ticked boxes are illegal under GDPR |
| Social login (OAuth) | Vendor dependency + privacy distrust; magic-link email is better for this audience |
| Real names/likenesses/logos (Buffett, Munger, Berkshire) | Legal risk; parody framing is the protection |
| Full life story in v1 | Childhood/youth arc only; later eras are future packs |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GAME-01 | Phase 2 | Pending |
| GAME-02 | Phase 4 | Pending |
| GAME-03 | Phase 4 | Pending |
| GAME-04 | Phase 4 | Pending |
| GAME-05 | Phase 2 | Pending |
| GAME-06 | Phase 2 | Pending |
| GAME-07 | Phase 1 | Pending |
| GAME-08 | Phase 1 | Complete |
| GAME-09 | Phase 2 | Pending |
| GAME-10 | Phase 1 | Complete |
| SAVE-01 | Phase 2 | Pending |
| SAVE-02 | Phase 2 | Pending |
| FUNL-01 | Phase 3 | Pending |
| FUNL-02 | Phase 3 | Pending |
| FUNL-03 | Phase 3 | Pending |
| FUNL-04 | Phase 3 | Pending |
| FUNL-05 | Phase 3 | Pending |
| VIRL-01 | Phase 2 | Pending |
| VIRL-02 | Phase 2 | Pending |
| LEGL-01 | Phase 1 | Pending |
| LEGL-02 | Phase 1 | Complete |
| LEGL-03 | Phase 3 | Pending |
| LEGL-04 | Phase 3 | Pending |
| INFR-01 | Phase 1 | Pending |
| INFR-02 | Phase 3 | Pending |
| INFR-03 | Phase 3 | Pending |
| INFR-04 | Phase 1 | Complete |
| INFR-05 | Phase 1 | Complete |

---
*Last updated: 2026-06-11 after roadmap creation*
