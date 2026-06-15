# Roadmap: Barren Wuffett

## Overview

Nine phases deliver Barren Wuffett v1.0, entertainment-first. A legally-safe scaffold comes first (so a public URL can exist without risk), then a fully offline-playable Level 1 (so nothing is built on an unproven game), then a cozy visual pass. Next, three phases deepen Level 1 until it's genuinely good — the rolled-up-newspaper whack economy, redesigned set-pieces (paper route + a non-linear Mr. Market boss), and a real young-Barren story — *before* any funnel exists. Only then do Levels 2-3 ship (reusing the proven ContentRegistry pattern), followed by the email funnel/backend, and finally public launch. The funnel is deliberately last: entertainment first, funnel second (user decision 2026-06-15). Each phase ends with a verifiable capability a human can test — not a technical milestone.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Legal Shell** - Deployable scaffold with Impressum/privacy pages, pixel-art engine config, parody naming, and mobile constraints locked in (completed 2026-06-12; Geltungssatz confirmed 2026-06-15)
- [x] **Phase 2: Level 1 — Offline Playable** - Complete end-to-end playable Level 1 with overworld, mini-game, boss fight, local save, and share card — no backend required (completed 2026-06-12)
- [x] **Phase 2.1: Visual Pass — Cozy Pixel Art (Level 1)** *(INSERTED)* - Replace placeholder art with a cohesive cozy 16-bit set (Kenney Tiny Town CC0), auto-tiled terrain, and animated character/NPC/boss sprites — no mechanics changes (completed 2026-06-14)
- [ ] **Phase 3: Level 1 — The Newspaper Verb & Economy** - Rolled-up-newspaper whack verb, bush/chore coin economy with fair deterministic drops, dog hazard, and a shop of permanent upgrades — the explore→earn→spend loop
- [ ] **Phase 4: Level 1 — Set Pieces** - Paper-route mini-game glow-up (characterful houses + score splash) and the Mr. Market "Mood Pendulum" boss redesign (read greed/panic, not a linear menu)
- [ ] **Phase 5: Level 1 — Story & Heart** - The 7-beat young-Barren story spine: new NPCs, cutscenes, Count-the-Caps + Pinball-Snowball hustle mini-games, and hidden Investment Journal collectible pages
- [ ] **Phase 6: Levels 2-3** - Remaining two levels using the ContentRegistry/manifest pattern with no engine code changes, each with a boss + genre-accent mini-game
- [ ] **Phase 7: Funnel & Backend** - Supabase cloud-save, Brevo double opt-in, GDPR consent, Investment Journal wiring, and cookieless analytics — end-to-end tested (moved to the end: entertainment first, funnel second)
- [ ] **Phase 8: Launch** - Final pre-launch checklist + public go-live at a public URL with the funnel active (optional PWA install prompt after Level 1)

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

**Plans**: 3 plans
Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Walking Skeleton: Phaser 4 + Vite + TypeScript scaffold, portrait pixel-art config, i18n + ContentRegistry seam, Boot/Preloader/MainMenu, Wave 0 tests

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Settings scene with persistent Music/SFX toggles (localStorage), static Impressum + Datenschutz pages, two-tap legal links + crawler DOM anchors

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — Security headers, Cloudflare Pages deploy (public URL live); Geltungssatz confirmed by user 2026-06-15 — public-sharing gate lifted

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

**Plans**: 3 plans
Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Playable overworld slice: GameEvents bus, wired InputBus (joystick+keyboard), versioned SaveService (IndexedDB), level-01 data + dialogue, Player/NPC, OverworldScene + UIScene (HUD, dialogue, pause), dog-patrol patience mechanic, Wave 0 tests

**Wave 2** *(blocked on Wave 1)*

- [x] 02-02-PLAN.md — Mini-game + boss slice: TriggerSystem, PaperThrowScene timing mini-game, Mr. Market two-phase boss fight (DECLINE builds patience / BUY LOW! wins)

**Wave 3** *(blocked on Wave 2)*

- [x] 02-03-PLAN.md — Share + viral slice: ShareService + ShareCard (1200×630 one-tap Web Share), Level Complete screen, og:image/og:title/og:description meta + static og-image.png

### Phase 02.1: Visual Pass — Cozy Pixel Art (Level 1) (INSERTED)

**Goal**: Level 1 reads as a real, cohesive cozy 16-bit pixel-art game (Zelda / FF-Mystic-Quest-adjacent) on a real phone — the placeholder colored-square sprites and stub tileset are replaced with a cohesive CC0 art set (Kenney Tiny Town base, validated in spike 001), terrain uses auto-tiled grass↔path transitions, and the player + NPCs + dog + Mr. Market boss have cohesive multi-frame animated sprites — all via the existing Preloader + ContentRegistry pipeline with NO mechanics/engine changes; mobile bundle stays lean
**Mode:** mvp
**Depends on**: Phase 2 (mechanics complete). Inserted before Phase 3 so the backend funnel is not built on a placeholder-looking game; does not functionally block Phase 3.
**Requirements**: ART-01, ART-02, ART-03, ART-04
**Success Criteria** (what must be TRUE):

  1. A player opening Level 1 sees a cohesive cozy 16-bit town (grass/paths/houses/trees/fences with clean auto-tiled edges) — no placeholder squares anywhere
  2. The player character and every NPC/dog/Mr. Market boss animate with cohesive multi-frame sprites; the player walks in 4 directions
  3. The visual upgrade is purely additive — all Phase 2 mechanics, saves, mini-game, boss, and share still work (61/61 tests stay green; no engine changes)
  4. The mobile bundle stays lean; the game still loads fast on 4G and works offline (PWA-friendly)
  5. A reusable art style guide + asset manifest exists so a future level needs only data + assets, not engine code

**Spike**: .planning/spikes/001-cozy-art-pipeline/ (VALIDATED — pipeline + cozy look proven; Kenney Tiny Town CC0; auto-tiling + animation demonstrated)

**Plans**: 3 plans (organized as vertical experience slices; fully sequential waves)
Plans:
**Wave 1**

- [x] 02.1-01-PLAN.md — Slice A "Overworld looks cozy": Wave-0 art-assets.test.ts scaffold; self-host Kenney Tiny Town tileset; rewrite level-01 as GROUND_DATA + DECO_DATA (30×52) with auto-tiled paths; two-layer 16px tilemap in OverworldScene (ART-01)

**Wave 2** *(blocked on Wave 1)*

- [x] 02.1-02-PLAN.md — Slice B "Characters come alive": license-gate checkpoint; source player/NPC/dog/boss sprites (PixelLab palette-locked / Kenney CC0 fallback); player 4-dir walk anims; Mr. Market greed/panic poses; ASSET-MANIFEST.md provenance (ART-02, ART-03)

**Wave 3** *(blocked on Wave 2)*

- [x] 02.1-03-PLAN.md — Slice C "Consistency + reuse": replace HUD coin + share-card victory art; complete ASSET-MANIFEST.md; author reusable art STYLE-GUIDE.md for Levels 2-3 reuse (ART-03, ART-04)

**UI hint**: yes

### Phase 3: Level 1 — The Newspaper Verb & Economy

**Goal**: As a player roaming the town of Ohama, I want to whack bushes and chores with my rolled-up newspaper to earn coins and spend them on a few permanent shop upgrades, so that exploring feels rewarding and my money finally has a purpose.
**Mode:** mvp
**Depends on**: Phase 2.1 (cozy art + Level 1 mechanics in place)
**Requirements**: L1E-01, L1E-02, L1E-03, L1E-04
**Design**: .planning/research/level-1-redesign-ideas.md, .planning/research/zelda-mystic-quest-patterns.md
**Success Criteria** (what must be TRUE):

  1. The player can swing the rolled-up newspaper as a real verb; bushes and whackable props react and clear with crisp visual/audio feedback (touch + keyboard)
  2. Whacking yields coins/items via a fair, deterministic 8-slot prize-pack (no long droughts); the very first bush always drops a coin; a HUD "snowball" coin counter tracks the running total
  3. The patrolling dog is a non-lethal hazard — contact knocks the player back, grants brief invulnerability, sends them to the "hospital" (respawn + small coin fee), and resets the bush-whacking streak bonus; never a death screen
  4. A town shop sells 3–4 permanent upgrades (newspaper upgrade, anti-dog helmet, a saved-for traversal unlock, a cheap snack); each purchase is felt for the rest of Level 1, with no forced grinding
  5. The traversal upgrade gates a previously-unreachable part of town, giving coins a clear purpose; the full explore→earn→spend loop works on a phone, offline

**Plans**: 4 plans (vertical experience slices across 4 waves)
Plans:

**Wave 0**

- [x] 03-01-PLAN.md — Wave 0: pure-TS PrizePack + Economy seams (rollPrizePack, applyPurchase, computeHospitalFee, applyKnockbackAngle) + 4 new test files + Action.WHACK + upgrade-flag persistence test (L1E-01..04)

**Wave 1** *(blocked on Wave 0)*

- [x] 03-02-PLAN.md — Slice 1 "the spine": WHACK verb + whack button + swing/particle/SFX, BushEntity + WhackSystem, deterministic prize-pack, first-bush coin, COINS_CHANGED → HUD (+N float) — closes the D-08 gap; autosave (L1E-01, L1E-02)

**Wave 2** *(blocked on Wave 1)*

- [x] 03-03-PLAN.md — Slice 2 "hazard + streak": 8-bush streak bonus, dog→non-lethal hazard (knockback + i-frames), WAKE UP IN HOSPITAL overlay + floored coin fee + streak reset (L1E-02, L1E-03)

**Wave 3** *(blocked on Wave 2)*

- [ ] 03-04-PLAN.md — Slice 3 "shop + gate": SHOP overlay + 4 items + OWNED/affordability, felt upgrades (newspaper reach, helmet fee-waiver, traversal gate + reward area); end-of-phase human-check (L1E-04)

### Phase 4: Level 1 — Set Pieces

**Goal**: As a player, I want to play a characterful paper-route mini-game that ends on a clear score screen and to beat a Mr. Market boss by reading his swinging greed and panic moods, so that Level 1's set pieces feel like real, fair challenges instead of a linear menu.
**Mode:** mvp
**Depends on**: Phase 3 (the newspaper-whack verb is reused by the boss)
**Requirements**: L1E-05, L1E-06
**Design**: .planning/research/level-1-redesign-ideas.md, .planning/research/zelda-mystic-quest-patterns.md
**Success Criteria** (what must be TRUE):

  1. The paper-route targets are characterful houses (varied designs, mailboxes/porches), not plain doors; aiming/throwing reads clearly on a phone
  2. The paper-route ends on an explicit results splash — papers delivered, accuracy %, coins earned, a letter grade, and a "NEW BEST!" indicator — so the mini-game has a clear win state
  3. Mr. Market is rebuilt as the "Mood Pendulum": a visible greed↔panic meter swings, his "FOMO" lures damage the player on contact, and the strike window opens when he swings to panic — reusing the newspaper-whack with no new mid-fight controls
  4. The boss is non-linear and fair — telegraphed, readable, survivable, recoverable on a miss — and winning rewards reading his mood (buy-fear / sell-greed) over a fixed sequence
  5. Defeating the boss flows into the existing Level Complete / share-card path with the Barren victory art

**Plans**: TBD
**UI hint**: yes

### Phase 5: Level 1 — Story & Heart

**Goal**: As a player, I want to experience young Barren's story through cutscenes, townsfolk, and small hustle mini-games that build toward the boss, so that Level 1's world feels alive and its finale feels earned.
**Mode:** mvp
**Depends on**: Phase 3, Phase 4 (economy + set pieces exist to hang the story on)
**Requirements**: L1E-07, L1E-08, L1E-09
**Design**: .planning/research/buffett-early-years-story.md
**Success Criteria** (what must be TRUE):

  1. Level 1 plays out the multi-beat story spine (The Spark → the first stock) from the design doc, giving the Mr. Market boss real motivation
  2. New named NPCs (Dottie, Donno, Barber Bristle, Old Penny) appear with distinct sprites + dialogue and drive specific beats; all content is parody-safe (no real names/brands/likenesses)
  3. At least two story mini-games ship — "Count-the-Caps" (research / market-share) and the "Pinball Snowball" (reinvest-for-passive-income compounding loop) — each an isolated scene with clean handoff back to the overworld
  4. Hidden Investment Journal collectible pages are scattered in Level 1; collecting them is content-only (no backend) and unlocks a reward, each entry carrying a visible disclaimer in Barren's voice (BaFin-safe — no buy/sell calls)
  5. Story is delivered through skippable, mobile-friendly cutscenes/dialogue and stays i18n-ready (English now, German-addable without code changes)

**Plans**: TBD
**UI hint**: yes

### Phase 6: Levels 2-3

**Goal**: The complete 3-level game is playable — Levels 2 and 3 ship using the ContentRegistry/manifest pattern with no engine code changes, each with distinct length, difficulty, a boss fight, and a genre-accent mini-game
**Mode:** mvp
**Depends on**: Phase 5 (Level 1 fully realized as the reusable template)
**Requirements**: GAME-02, GAME-03, GAME-04
**Success Criteria** (what must be TRUE):

  1. Player can complete all 3 levels (paper route, pinball/Coke hustle, first stock investment) each with distinct length, difficulty, and a boss fight — Mr. Market appears with era-specific behavior per level
  2. Each level contains a distinct mini-game accent from another genre (platformer, point-and-click, or resource management) implemented as an isolated scene with clean handoff back to the overworld
  3. Adding a level requires only a new data manifest + assets — no engine code changes — proving the ContentRegistry pattern

**Plans**: TBD
**UI hint**: yes

### Phase 7: Funnel & Backend

**Goal**: The complete email funnel is live and end-to-end tested — a player who completes a level can opt into cloud-save, receive a confirmation email via Brevo, unlock Investment Journal entries, and have all consent recorded in a GDPR-compliant way
**Mode:** mvp
**Depends on**: Phase 6 (a complete, polished game exists to attach the funnel to)
**Requirements**: FUNL-01, FUNL-02, FUNL-03, FUNL-04, FUNL-05, LEGL-03, LEGL-04, INFR-02, INFR-03
**Success Criteria** (what must be TRUE):

  1. After level completion, player sees an optional cloud-save prompt ("save your progress" framing); declining lets the game continue without friction; accepting triggers a real confirmation email delivered via Brevo custom SMTP (not Supabase default)
  2. Marketing consent uses a separate, unchecked checkbox; a player who ticks it receives a double opt-in confirmation email; a player who unticks it is not added to the marketing list — both flows verifiable with real email addresses
  3. After opting in, player can unlock Investment Journal entries (wiring the collectible system built in Phase 5 to email); each entry contains a visible financial disclaimer, is written in Barren's voice, and portfolio pointers read as information rather than calls to action
  4. A player who declined cloud-save is offered a secondary "deep cut" Journal entry unlock via newsletter subscription (softer, distinct touchpoint); this does not re-trigger the cloud-save prompt
  5. Cookieless analytics records level completions, email gate conversion events, and share-card clicks without requiring a cookie consent banner; data collection is limited to email, level progress, score, and consent timestamp

**Plans**: TBD

### Phase 8: Launch

**Goal**: The game goes live publicly at a public URL with the funnel active — the final pre-launch checklist passes and a soft PWA "install" path exists
**Mode:** mvp
**Depends on**: Phase 7
**Requirements**: INFR-01 (hosting live — already satisfied), plus the pre-launch checklist (LEGL-01/02 ✓, Geltungssatz ✓, security headers ✓)
**Success Criteria** (what must be TRUE):

  1. The pre-launch checklist passes: legal pages reachable in two taps, Geltungssatz confirmed (done 2026-06-15), parody-naming audit clean, security headers served, funnel flows verified end-to-end
  2. The game is announced/shared publicly at its public URL (https://barren-wuffett.pages.dev or a custom domain) with the funnel live
  3. An optional "Add to Home Screen" install prompt appears after Level 1 (beforeinstallprompt), per the PWA stack pattern; full offline-after-install service-worker hardening may follow as a fast-follow (v1.x)

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 2.1 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Legal Shell | 3/3 | Complete | 2026-06-12 (Geltungssatz confirmed 2026-06-15) |
| 2. Level 1 — Offline Playable | 3/3 | Complete | 2026-06-12 |
| 2.1. Visual Pass — Cozy Pixel Art *(INSERTED)* | 3/3 | Complete | 2026-06-14 |
| 3. Level 1 — The Newspaper Verb & Economy | 3/4 | In Progress|  |
| 4. Level 1 — Set Pieces | 0/TBD | Not started | - |
| 5. Level 1 — Story & Heart | 0/TBD | Not started | - |
| 6. Levels 2-3 | 0/TBD | Not started | - |
| 7. Funnel & Backend | 0/TBD | Not started | - |
| 8. Launch | 0/TBD | Not started | - |
