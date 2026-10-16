---
gsd_state_version: "1.0"
milestone: v2.0
milestone_name: The Barren Wuffett Hub
current_phase: 05
current_phase_name: Consolidate + Shared Shell + Hub Checkpoint
status: planning
stopped_at: Phase 5 UI-SPEC approved
last_updated: "2026-10-16T20:41:01.777Z"
last_activity: 2026-10-07
last_activity_desc: v2.0 roadmap written (Phases 5-8), REQUIREMENTS.md traceability filled, 41/41 requirements mapped
state_head: 98d2aa9f87d82847e511f72d13136d43689b2434
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 8
  completed_plans: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-07)

**Core value:** A fun, replayable Buffett parody that people come back to daily and share on X. Entertainment is the product, a growing @Wolfhartvest following is the win, and nothing ever feels like an ad.
**Current focus:** Phase 5 — Consolidate + Shared Shell + Hub Checkpoint

## Current Position

Phase: 05 (Consolidate + Shared Shell + Hub Checkpoint) — READY TO EXECUTE
Plan: — (not yet planned)
Status: Roadmap created, ready to plan
Last activity: 2026-10-07 — v2.0 roadmap written (Phases 5-8), REQUIREMENTS.md traceability filled, 41/41 requirements mapped

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 01-foundation-legal-shell P01-01 | 11min | 3 tasks | 27 files |
| Phase 01 P01-02 | 8min | 2 tasks | 7 files |
| Phase 01 P01-03 | ~20min | 2/3 tasks (1 deferred) | 4 files |
| Phase 02 P02-02 | 25min | 3 tasks | 4 files |
| Phase 02.1 P02 | 15min | 4 tasks | 10 files |
| Phase 02.1 P03 | 10min | 2 tasks | 6 files |
| Phase 03 P01 | 4min | 2 tasks | 11 files |
| Phase 03 P02 | 11min | 3 tasks | 30 files |
| Phase 03 P03 | 7 | 2 tasks | 6 files |
| Phase 03 P04 | 6min | 2 tasks + 1 verification | 5 files |

## Accumulated Context

### Roadmap Evolution

- Phase 2.1 (Visual Pass — Cozy Pixel Art) inserted after Phase 2 on 2026-06-14 (URGENT) — replace placeholder art with a cohesive cozy 16-bit set (Kenney Tiny Town CC0) before Phase 3 backend, so the funnel isn't built on a placeholder-looking game. Spike 001 VALIDATED the approach.
- Roadmap rearranged 2026-06-15 (entertainment-first, user decision): the funnel/backend (old Phase 3) moved to Phase 7 — built only after the game is genuinely good. Level 1 expanded into 3 new phases: 3 (The Newspaper Verb & Economy), 4 (Set Pieces — paper-route glow-up + Mr. Market "Mood Pendulum" boss redesign, direction A), 5 (Story & Heart — 7-beat young-Barren spine + Investment Journal collectibles). Old Phase 4 split into Phase 6 (Levels 2-3) and Phase 8 (Launch). New requirements L1E-01..09. Design: .planning/research/level-1-redesign-ideas.md (+ zelda-mystic-quest-patterns.md, buffett-early-years-story.md).
- Phase 3.1 (Game Feel: Zelda Camera, Juice & Repair) inserted 2026-08-04 after the feel audit (`.planning/research/level-1-feel-audit.md`): user played the game and was unimpressed; audit found (1) the whole 480×832 world renders on one static screen — no Zelda camera, (2) Phase 3's feature layer shipped with 1×1-pixel art and 44-byte silent SFX stubs, (3) five mechanical bugs (multi-award whack, double level-complete overlay, 8 bushes inside collision tiles, no-op newspaper-upgrade hitbox, walk-around-able gate) that passed CI because no test instantiates a live scene. New requirements FEEL-01..06. Phase 4 now depends on 3.1. PROCESS LESSON: phases must not be marked Complete while `human_needed` UAT items sit pending — the experiential gate was skipped three phases in a row; plans must contain an explicit asset-production step (art + audio), not stubs-for-later.
- v1.0 closed superseded 2026-10-07 (not completed): a feel audit + the pivot assessment found the adventure play-once and weakly shareable. v1.0's planned Phases 5-8 (Story & Heart, Levels 2-3, Funnel & Backend, Launch) were archived unbuilt; 32/47 v1.0 requirements were checked off. Archive: `milestones/v1.0-ROADMAP.md`, `milestones/v1.0-REQUIREMENTS.md`, `milestones/v1.0-phases/`.
- v2.0 roadmap created 2026-10-07: 4 phases (5-8), continuing numbering from v1.0's Phase 4, covering all 41 v2.0 requirements. Phase 5 consolidates the branch stack, builds `src/shared/*` and the hub, and deploys to a non-public preview only. Phases 6-8 each release one new format (arcade, idle, swipe) with its own phone-feel pass, real-iPhone check, X-card verification, self-audit and go-ahead-gated deploy; all three depend only on Phase 5 and can reorder relative to each other, but the planned order is arcade → idle → swipe.

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v2.0 pivot (2026-10-06): dropped the email/Supabase/Brevo funnel for a credit-only one ("made by @Wolfhartvest"); replaced the single adventure with a staggered-release mini-game hub (arcade → idle → swipe) after spiking and playing all three on Android.
- v2.0: each release phase's "done" includes the human phone-feel check and the real-iPhone check before any public deploy — the v1.0 lesson (phases marked complete with phone checks pending) is now a roadmap-level gate, not a note.
- v2.0: Phase 6 (the arcade) carries the milestone's only public-deploy cutover — hub + arcade go live together on the user's go-ahead; Phases 7 and 8 ship their own format afterward, same gate pattern.
- Init: Legal pages (Impressum, Datenschutz) must exist before any public URL is shared — Phase 1 acceptance gate (satisfied in v1.0; carries forward as LEGL-05/LEGL-07 in v2.0).
- [Phase ?]: Removed Phaser ESM alias from Vite config — Phaser 4.1.0 exports field auto-resolves; manual alias created path conflict
- [Phase ?]: All service/scene modules created atomically in Task 1 due to circular import requirements — build requires scenes+services+locales to all exist simultaneously
- [Phase ?]: phaser4-rex-plugins VirtualJoystick import smoke-tested in prod build (Pitfall 4) — Phase 2 InputBus wiring unblocked
- [Phase ?]: Settings scene uses Phaser Container for toggle buttons with setSize(44,44) for WCAG 2.5.5 touch target compliance
- [Phase 02.1]: ui_pause + ui_save included in scope (user-approved deviation) — clears all remaining HUD black boxes with no engine code changes
- [Phase 02.1]: STYLE-GUIDE.md written as durable reference prose (not a task log) so Phase 4 developers can reproduce the cozy look with data + assets only — no engine code
- [Phase 03]: PrizePack firstWhackOrRoll does NOT advance the slot on first-whack override — D-06 slot sequence starts fresh from slot 0 once done
- [Phase 03]: Economy.applyPurchase returns a new flags object (immutable, never mutates input) — snack never sets a flag key (D-15)
- [Phase 03]: AudioService.playSfx(scene,key) takes scene arg — AudioService stays stateless singleton (no singleton Phaser ref held)
- [Phase 03]: COINS_CHANGED wired end-to-end in Plan 02 — OverworldScene emits on every coin delta; UIScene.onCoinsChanged drives HUD.setCoins + flashCoinPickup (D-08 gap closed)
- [Phase 03]: ShopOverlay.show() rebuilds item rows on each call (destroy+recreate) — safe post-purchase refresh without rebuilding backdrop/title/close
- [Phase 03]: Store Clerk shop entry uses dialogueKey override ('storeClerk.shopIntro') + _lastNpcId check in onDialogueComplete — reuses existing dialogue pipeline with no structural change
- [Phase 03]: WhackSystem enlarged effect applies both wider rect (48x32) AND +8px reach in facing direction when upgrade_newspaper owned (D-14)

### Pending Todos

- Gewerbe-Versicherung für Finanz-Content-Tätigkeit recherchieren (legal) — vor öffentlichem Launch klären; pragmatischer Teilersatz für Medienanwalt-Check

### Blockers/Concerns

- LEGAL GATE — RESOLVED 2026-06-14: user confirmed "geltungssatz-confirmed". External imprint (compoundingknowledge.com/en/imprint) names the game; game imprint links back in ≤2 clicks (commit 7553a10). Public-URL sharing gate LIFTED — https://barren-wuffett.pages.dev may now be shared publicly.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| legal | Geltungssatz / imprint: external imprint (compoundingknowledge.com/en/imprint) names the game; game imprint links there in ≤2 clicks (commit 7553a10). User confirmed "geltungssatz-confirmed" 2026-06-14 → public-sharing gate LIFTED. | RESOLVED 2026-06-14 | 2026-06-12 |
| adventure | ADV-01: phone check of v1.0 Phases 3.1 + 4 build, plus the whack/pause hit-area fix | Deferred to Future Requirements (v2.0 REQUIREMENTS.md) | 2026-10-07 |
| adventure | ADV-02: Story & Heart (7-beat young-Barren spine) and Levels 2-3, per the archived v1.0 roadmap | Deferred to Future Requirements (v2.0 REQUIREMENTS.md) | 2026-10-07 |
| reach | I18N-01: German localization (strings already go through `t(key)`) | Deferred to Future Requirements (v2.0 REQUIREMENTS.md) | 2026-10-07 |

## Session Continuity

Last session: 2026-10-16T11:48:30.116Z
Stopped at: Phase 5 UI-SPEC approved
Resume file: .planning/phases/05-consolidate-shared-shell-hub-checkpoint/05-UI-SPEC.md

Resume steps (next session):

  1. Run `/gsd-discuss-phase 5` to gather context before planning Phase 5 (Consolidate + Shared Shell + Hub Checkpoint).
