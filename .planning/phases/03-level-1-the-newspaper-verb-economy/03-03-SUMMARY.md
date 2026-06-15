---
phase: 03-level-1-the-newspaper-verb-economy
plan: "03"
subsystem: hazard-and-streak
tags: [phaser4, dog-hazard, knockback, i-frames, hospital, hospital-overlay, streak-bonus, uiscene, i18n, economy]
dependency_graph:
  requires:
    - src/entities/Player.ts (applyKnockback + isInvincible — Plan 02 seam)
    - src/systems/Economy.ts (computeHospitalFee — Plan 01 seam)
    - src/events/GameEvents.ts (PLAYER_HOSPITALIZED, STREAK_BONUS — Plan 02; HOSPITAL_DISMISS — this plan)
    - src/ui/HUD.ts (updateStreak, flashCoinPickup — Plan 02; flashStreakBonus — this plan)
  provides:
    - src/ui/HospitalOverlay.ts (HOSPITAL UIScene panel — new)
    - HOSPITAL_DISMISS event constant + OverworldScene→UIScene→OverworldScene dismiss carrier
    - dog-bite hazard (onDogBite/completeHospital in OverworldScene)
    - 8-bush streak bonus payout (extended awardWhackDrop in OverworldScene)
    - UIScene HOSPITAL state + onPlayerHospitalized/dismissHospital/onStreakBonus handlers
    - i18n: hospital.heading / fee / feeLow / helmetBlocked / dismiss
  affects:
    - Slice 3 shop (reads flags.upgrade_helmet for fee waiver — computeHospitalFee already returns 0)
    - Phase 4+ (risk/reward loop complete: streak gain vs. dog-bite loss)
tech_stack:
  added: []
  patterns:
    - isInvincible guard on dog-bite distance check (T-03-06 DoS prevention — no coin-drain loop)
    - HOSPITAL_DISMISS event as respawn carrier (UIScene emits → OverworldScene repositions player)
    - dismissHospital idempotent via uiState check (T-03-14 double-fire prevention)
    - HospitalOverlay = plain-TS class owned by UIScene (same pattern as HUD, DialogueBox)
    - Back.Out scale-in tween on panel (200ms, 0.7→1.0) — cozy gag, no red flash (L1E-03)
    - auto-dismiss timer + pointerdown dismiss (RESEARCH Pattern 4)
    - awardWhackDrop streak payout: check streak >= 8 after prize-pack roll; special bush = Journal page
    - CR-03 shutdown pairs: every .on() in create() has matching .off() in shutdown() for both scenes
key_files:
  created:
    - src/ui/HospitalOverlay.ts
  modified:
    - src/events/GameEvents.ts (HOSPITAL_DISMISS constant added)
    - src/entities/Player.ts (no change — applyKnockback already present from Plan 02)
    - src/game/scenes/OverworldScene.ts (dog-bite detection, onDogBite, completeHospital, onHospitalDismiss, awardWhackDrop streak extension, CR-03 pairs)
    - src/game/scenes/UIScene.ts (HospitalOverlay, HOSPITAL state, onPlayerHospitalized, dismissHospital, onStreakBonus, setState extension, CR-03 pairs)
    - src/ui/HUD.ts (flashStreakBonus added)
    - public/locales/en/common.json (hospital.* keys)
decisions:
  - "HOSPITAL_DISMISS is emitted by UIScene (dismiss) and listened to by OverworldScene (respawn) — UIScene does NOT listen for it, so no off() needed in UIScene shutdown"
  - "hospitalShowing flag set in completeHospital (before PLAYER_HOSPITALIZED emit) and cleared in onHospitalDismiss — guards update() from running during splash"
  - "Streak bonus payout fires after prize-pack logic within awardWhackDrop so the streak count is consistent whether the drop was coins, snack, or nothing"
  - "Special bush journal key 'journal_streak_milestone' is a Phase-3 seed — content and display deferred to Slice 3; duplicate guard prevents re-push on streak re-trigger"
  - "Preloader already loads dog_bite / hospital_sting / streak_bonus OGG stubs from Plan 02 — no Preloader changes needed"
metrics:
  duration: "7 minutes"
  completed_date: "2026-06-15T19:58:00Z"
  tasks_completed: 2
  files_created: 1
  files_modified: 5
---

# Phase 03 Plan 03: Hazard + Streak Summary

**One-liner:** Dog patrol converted to non-lethal contact hazard (knockback + ~960ms i-frames + WAKE UP IN HOSPITAL splash + floored coin fee + streak reset) and 8-bush snowball streak pays out 8 coins (or Journal page at milestone), closing the risk/reward loop for the verb economy.

## What Was Built

Slice 2 of Phase 3: the hazard + streak half of the newspaper verb economy. After this plan the full risk/reward loop is playable: build an 8-bush streak → bonus; walk into the dog → knocked back → HOSPITAL splash → dismiss → respawn at (96,96) with fee deducted → streak reset. Never a death screen.

### Task 1: Dog-bite hazard + hospital fee + streak bonus payout

**`src/events/GameEvents.ts`** — Added `HOSPITAL_DISMISS: 'HOSPITAL_DISMISS'` to the frozen Events object (D-19). (`PLAYER_HOSPITALIZED` and `STREAK_BONUS` were already present from Plan 02.)

**`src/game/scenes/OverworldScene.ts`** — Extended:

- Import `computeHospitalFee` from `Economy.ts` (Plan-01 seam — not reimplemented).
- `onHospitalDismiss` class-field handler: clears `hospitalShowing` flag, respawns player at (96,96), autosaves.
- `HOSPITAL_DISMISS` registered in create() + off() in shutdown() (CR-03).
- Dog-bite detection in update(): `if (this.dogSprite && !this.player.isInvincible)` + distance < 24 → `onDogBite()`. The `isInvincible` guard is the T-03-06 mitigation — blocks re-fire every frame.
- `onDogBite()`: SFX, streak reset → `BUSH_WHACKED{0}` (clears HUD pips), compute fee, `player.applyKnockback(dogX, dogY, () => completeHospital(fee))`.
- `completeHospital(fee)`: authoritative coin deduction via `Math.max(0, coins - fee)` (T-03-07), `COINS_CHANGED`, sets `hospitalShowing = true`, emits `PLAYER_HOSPITALIZED { fee, helmetOwned }`, autosaves. Respawn is NOT here — it waits for `HOSPITAL_DISMISS`.
- `awardWhackDrop` extended: after prize-pack roll, checks `this.bushStreak >= 8` → resets to 0 → `streak_bonus` SFX → special bush: push `journal_streak_milestone` key + `STREAK_BONUS{coins:0,journal:true}`; regular bush: +8 coins + `COINS_CHANGED` + `STREAK_BONUS{coins:8,journal:false}`; clear pips via `BUSH_WHACKED{0}` + autosave.
- `awardPatienceBonus()` untouched (GAME-06 preserved — dog is now both patience reward and hazard, D-09).

### Task 2: HospitalOverlay + UIScene HOSPITAL state + streak-bonus flash + i18n

**`src/ui/HospitalOverlay.ts`** (new) — Plain-TS class owned by UIScene (same pattern as HUD):
- Backdrop: full-canvas #000 at alpha 0.6, depth 30.
- Panel: 360×220 centered at (240,427), fill #1a1a2e, stroke #e8e8e8 2px, depth 31.
- Heading: `t('hospital.heading')`, Display 24px, word-wrap 280px.
- Fee text: dynamic in `show()` per UI-SPEC §5 logic: helmet → `#00ff88`; fee ≥1 → `t('hospital.fee')` #ff4444; fee 0 → `t('hospital.feeLow')` #ff4444.
- Hint: `t('hospital.dismiss')`, Label 8px, alpha 0.6.
- `show()`: set fee text, make visible, Back.Out scale-in tween (0.7→1.0, 200ms). No skull/GAME OVER/red flash (L1E-03).
- `hide()`: sets all elements invisible.

**`src/game/scenes/UIScene.ts`** — Extended:
- Import `HospitalOverlay` and `AudioService`.
- New fields: `hospitalOverlay`, `_hospitalDismissTimer`.
- `onPlayerHospitalized`: early-return if already in HOSPITAL (T-03-14 double-fire guard); `setState('HOSPITAL')`; pause OverworldScene; `hospitalOverlay.show(fee, helmetOwned)`; `AudioService.playSfx(this,'hospital_sting')`; 1500ms delayedCall to `dismissHospital`; `input.once('pointerdown', dismissHospital)`.
- `dismissHospital`: idempotent via `uiState !== 'HOSPITAL'` check; removes timer; resumes OverworldScene; `setState('HUD')`; emits `HOSPITAL_DISMISS` (the carrier).
- `onStreakBonus`: `hud.flashStreakBonus(data.coins, data.journal)`.
- `setState()` extended: hides `hospitalOverlay` when leaving HOSPITAL state.
- `create()`: instantiate `HospitalOverlay`; register `PLAYER_HOSPITALIZED` + `STREAK_BONUS`.
- `shutdown()`: `off()` both handlers + cancel `_hospitalDismissTimer` (CR-03 + no dangling callback).

**`src/ui/HUD.ts`** — Added `flashStreakBonus(coins, journal)`: two-line float-up toast, line 1 `t('hud.streakBonus')` in #00ff88 16px, line 2 coins/journal in #f5c842 8px, 1200ms float-up tween + fade (UI-SPEC §3c).

**`public/locales/en/common.json`** — Added 5 hospital keys: `hospital.heading`, `hospital.fee`, `hospital.feeLow`, `hospital.helmetBlocked`, `hospital.dismiss`. All ALL-CAPS per Copywriting Contract (D-18).

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written with one minor clarification below.

### Implementation Notes

**HospitalOverlay text placement:** Per the pattern, panel texts (heading, hint) are created as Phaser.GameObjects.Text objects outside the panel Container (at depth 32) and stored via `panel.setData()` for show/hide management. The fee text is a separate field for easy color/content updates. This matches the pause overlay pattern where labels are positioned absolutely on the canvas rather than nested in the container.

**UIScene `_state` field correction:** The plan's pseudocode referenced `this._state` but the UIScene field is `this.uiState` (established in Plan 01). Used `this.uiState` throughout — no behavior change.

**`hospitalShowing` flag lifecycle:** Set in `completeHospital()` (immediately before `PLAYER_HOSPITALIZED` emit, so OverworldScene's update() guard activates before the next tick), cleared in `onHospitalDismiss()` (after position reset). This prevents the `update()` input loop from running during the splash and during the respawn repositioning.

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| `journal_streak_milestone` Journal page not displayed | `src/game/scenes/OverworldScene.ts` | Journal UI + content display deferred to Slice 3; the key is pushed to `journalUnlocked` array and saved. |
| `snack` consumable effect | `src/game/scenes/OverworldScene.ts` | Snack effect (HP restore / streak extend) deferred to Slice 3. |
| Placeholder OGG audio (dog_bite, hospital_sting, streak_bonus) | `public/assets/audio/sfx_*.ogg` | 44-byte minimal headers from Plan 02. Art pass will replace. |
| Placeholder PNG images | `public/assets/images/*.png` | From Plan 02 art placeholders. Art pass will replace. |

All stubs are intentional; none block this plan's goal (dog hazard + hospital respawn + streak bonus loop is complete and functional).

## Threat Surface Scan

No new network endpoints, auth paths, fetch calls, or Supabase interactions. Client-side Phaser only.

Threat mitigations confirmed applied:
- T-03-06: `!player.isInvincible` guard in update() before `onDogBite()` — synchronous; `_invincible=true` is set at the start of `applyKnockback` before any async callback.
- T-03-07: `this.coins = Math.max(0, this.coins - fee)` + `computeHospitalFee` floors at `min(5, coins)` — balance never negative.
- T-03-08: `!!this.flags['upgrade_helmet']` truthiness read — missing/garbage = falsy → standard fee.
- T-03-09: HospitalOverlay uses no skull, no GAME OVER, no red flash — cozy gag heading only.
- T-03-14: `dismissHospital` early-return on `uiState !== 'HOSPITAL'`; `_hospitalDismissTimer?.remove()` before emit.

## Self-Check: PASSED

### Files exist:

- `src/ui/HospitalOverlay.ts` — FOUND (HospitalOverlay class)
- `src/events/GameEvents.ts` — FOUND (HOSPITAL_DISMISS confirmed)
- `src/game/scenes/OverworldScene.ts` — FOUND (onDogBite, completeHospital, onHospitalDismiss)
- `src/game/scenes/UIScene.ts` — FOUND (HOSPITAL state, onPlayerHospitalized, dismissHospital)
- `src/ui/HUD.ts` — FOUND (flashStreakBonus)
- `public/locales/en/common.json` — FOUND (hospital.* keys)

### Commits exist:

- `89c0dcb` feat(03-03): dog-bite hazard + i-frames + hospital fee + 8-bush streak bonus — FOUND
- `f5c7639` feat(03-03): HospitalOverlay + UIScene HOSPITAL state + streak bonus flash + i18n — FOUND

### Static checks:

- `npm test` (121/121 passing) — GREEN
- `npm run check` (tsc --noEmit) — CLEAN
- INFR-05 (no hardcoded strings in TS): all hospital/streak strings via `t()` — CONFIRMED
- CR-03 (shutdown listener pairs): HOSPITAL_DISMISS off() in OverworldScene.shutdown(), PLAYER_HOSPITALIZED + STREAK_BONUS off() in UIScene.shutdown() — CONFIRMED
- T-03-06 (isInvincible guard): guard present in update() before distance check — CONFIRMED
- T-03-14 (dismissHospital idempotent): `if (this.uiState !== 'HOSPITAL') return;` present — CONFIRMED
- L1E-03 acceptance (no death screen): HospitalOverlay uses no skull/GAME OVER/red flash — CONFIRMED
