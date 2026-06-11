# Roadmap: Barren Wuffett

## Overview

Four phases deliver the complete Barren Wuffett MVP: a legally-safe scaffold first (so a public URL can exist without risk), then a fully offline-playable Level 1 on real devices (so backend work is never built on an unproven game), then the email funnel and compliance layer (so launch traffic is captured correctly), and finally Levels 2-3 and public launch (using the ContentRegistry pattern already proven in Phase 2). Each phase ends with a verifiable capability a human can test — not a technical milestone.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Legal Shell** - Deployable scaffold with Impressum/privacy pages, pixel-art engine config, parody naming, and mobile constraints locked in
- [ ] **Phase 2: Level 1 — Offline Playable** - Complete end-to-end playable Level 1 with overworld, mini-game, boss fight, local save, and share card — no backend required
- [ ] **Phase 3: Funnel & Backend** - Supabase cloud-save, Brevo double opt-in, GDPR consent, Investment Journal content, and cookieless analytics — end-to-end tested before launch
- [ ] **Phase 4: Levels 2-3 + Launch** - Remaining levels using ContentRegistry/manifest pattern, PWA hardening, and public launch

## Phase Details

### Phase 1: Foundation & Legal Shell

**Goal**: A deployable Cloudflare Pages project exists with legal pages live, engine constraints enforced, and parody naming established — safe to share any URL publicly
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: LEGL-01, LEGL-02, INFR-01, INFR-04, INFR-05, GAME-07, GAME-08, GAME-10
**Success Criteria** (what must be TRUE):

  1. A visitor can open the deployed URL and see the game's loading/menu screen (Cloudflare Pages hosting live)
  2. Impressum and Privacy Policy pages are reachable within two taps/clicks from any game screen
  3. No real names, photos, or company logos appear anywhere in user-facing text or assets — only parody names ("Barren Wuffett," "Mr. Market," etc.)
  4. The game renders correctly in portrait mode on a real mobile phone with no zoom breakage, and audio toggle state persists across sessions
  5. All player-facing strings live in an i18n-ready structure (English content, German-addable without code changes)

**Plans**: 3 plansPlans:
**Wave 1**

- [x] 01-01-PLAN.md — Walking Skeleton: Phaser 4 + Vite + TypeScript scaffold, portrait pixel-art config, i18n + ContentRegistry seam, Boot/Preloader/MainMenu, Wave 0 tests

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 01-02-PLAN.md — Settings scene with persistent Music/SFX toggles (localStorage), static Impressum + Datenschutz pages, two-tap legal links + crawler DOM anchors

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 01-03-PLAN.md — Security headers, Cloudflare Pages deploy (public URL), Geltungssatz human-action gate before public sharing

### Phase 2: Level 1 — Offline Playable

**Goal**: Level 1 is fully playable start-to-finish on a real iPhone with no account, no backend, and no internet connection — local save persists across refresh
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: GAME-01, GAME-05, GAME-06, GAME-09, SAVE-01, SAVE-02, VIRL-01, VIRL-02
**Success Criteria** (what must be TRUE):

  1. Player can move through the Level 1 overworld using the virtual joystick on a phone and keyboard on desktop, interact with NPCs via dialogue, and pause/resume at any time
  2. Player can complete the Level 1 mini-game and boss fight; at least one mechanic in Level 1 rewards patience/timing over grinding (e.g., waiting for the right buy moment yields better outcome)
  3. Player progress (level reached, unlocks) survives browser refresh and return visits with no account — stored in IndexedDB; game is fully functional offline
  4. After defeating the Level 1 boss, player can share a spoiler-free Canvas-rendered card in one tap; the game's URL renders a rich preview (og:image, og:title, og:description) on messaging apps and social platforms
  5. Audio (music + SFX) works correctly on a real iPhone after first user gesture, and all visual assets load fast on 4G with a branded progress bar visible during load

**Plans**: TBD
**UI hint**: yes

### Phase 3: Funnel & Backend

**Goal**: The complete email funnel is live and end-to-end tested — a player who completes Level 1 can opt into cloud-save, receive a confirmation email via Brevo, unlock Investment Journal entries, and have all consent recorded in a GDPR-compliant way
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: FUNL-01, FUNL-02, FUNL-03, FUNL-04, FUNL-05, LEGL-03, LEGL-04, INFR-02, INFR-03
**Success Criteria** (what must be TRUE):

  1. After Level 1 completion, player sees an optional cloud-save prompt ("save your progress" framing); declining lets the game continue without friction; accepting triggers a real confirmation email delivered via Brevo custom SMTP (not Supabase default)
  2. Marketing consent uses a separate, unchecked checkbox; a player who ticks it receives a double opt-in confirmation email; a player who unticks it is not added to the marketing list — both flows verifiable with real email addresses
  3. After opting in, player can unlock the Level 1 Investment Journal entry; each entry contains a visible financial disclaimer, is written in Barren's voice, and portfolio pointers read as information rather than calls to action
  4. A player who declined cloud-save is offered a secondary "deep cut" Journal entry unlock via newsletter subscription (softer, distinct touchpoint); this does not re-trigger the cloud-save prompt
  5. Cookieless analytics records level completions, email gate conversion events, and share-card clicks without requiring a cookie consent banner; data collection is limited to email, level progress, score, and consent timestamp

**Plans**: TBD

### Phase 4: Levels 2-3 + Launch

**Goal**: The complete 3-level game is playable and publicly launched — Levels 2 and 3 ship using the ContentRegistry/manifest pattern with no engine code changes, PWA is hardened, and the game is live at a public URL
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: GAME-02, GAME-03, GAME-04
**Success Criteria** (what must be TRUE):

  1. Player can complete all 3 levels (paper route, pinball/Coke hustle, first stock investment) each with distinct length, difficulty, and a boss fight — Mr. Market appears with era-specific behavior per level
  2. Each level contains a distinct mini-game accent from another genre (platformer, point-and-click, or resource management) implemented as an isolated scene with clean handoff back to the overworld
  3. The game installs as a PWA and plays offline after install; adding a future level requires only a new data manifest file — no engine code changes needed

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Legal Shell | 1/3 | In Progress|  |
| 2. Level 1 — Offline Playable | 0/TBD | Not started | - |
| 3. Funnel & Backend | 0/TBD | Not started | - |
| 4. Levels 2-3 + Launch | 0/TBD | Not started | - |
