---
phase: 03-level-1-the-newspaper-verb-economy
plan: "04"
subsystem: shop-economy-ui
tags: [phaser4, shop-overlay, uiscene, economy, upgrade-effects, traversal-gate, i18n, events]
dependency_graph:
  requires:
    - src/systems/Economy.ts (applyPurchase + computeHospitalFee — Plan 01 seam)
    - src/data/levels/level-01-economy.ts (ECONOMY_DATA.shopItems, gateBarrier — Plan 02 seam)
    - src/events/GameEvents.ts (SHOP_OPEN, SHOP_PURCHASE, SHOP_CLOSE — Plan 02 seam, already present)
    - src/systems/WhackSystem.ts (activate() enlarged param no-op — Plan 02 seam; now activated)
    - src/ui/HospitalOverlay.ts (UIScene HOSPITAL state pattern — Plan 03 seam)
  provides:
    - src/ui/ShopOverlay.ts (SHOP panel — 4 item rows, OWNED/BUY/unaffordable states, notEnoughCoins feedback)
    - UIScene SHOP state + onShopOpen (re-entry guard) + onShopClose + ESC shortcut
    - OverworldScene store-clerk → shopIntro dialogue → SHOP_OPEN; onShopPurchase; removeGate; awardTraversalReward
    - WhackSystem enlarged hitbox (+8px reach + wider rect when upgrade_newspaper owned)
    - Traversal gate (barrier + sign text) + east-town reward zone (15 coins + journal_traversal_reward)
    - storeClerk.shopIntro dialogue (level-01.json); shop.* i18n keys (common.json)
  affects:
    - Phase 4 (upgrade_newspaper persists — boss/paper-route combat will inherit enlarged hitbox; upgrade_helmet waiver carries forward)
    - Phase 5 (journal_traversal_reward + journal_streak_milestone keys await Journal UI)
    - Phase 7 (SaveState.flags bag extended with upgrade_* + traversal_reward_collected — no schema migration needed)
tech_stack:
  added: []
  patterns:
    - ShopOverlay plain-TS class owned by UIScene (same pattern as HUD, HospitalOverlay, DialogueBox)
    - UIScene re-entry guard — if _state === 'SHOP', call shopOverlay.show() ONLY; do NOT re-pause (T-03-11 / Pitfall 3)
    - Post-purchase panel refresh via SHOP_OPEN re-emit (OverworldScene emits → UIScene re-entry guard re-renders rows)
    - Store Clerk shop entry via dialogueKey override (shopIntro) + onDialogueComplete _lastNpcId check (Open Question 2 safest path)
    - Traversal reward via update() zone check (not a physics trigger) — simple x/y bounds guard after gate removal
    - WhackSystem enlarged param: setSize(48,32) + 8px extra reach offset vs. base 32x24; reset to base on deactivate
key_files:
  created:
    - src/ui/ShopOverlay.ts (SHOP panel with 4 item rows + CLOSE button + notEnoughCoins feedback)
  modified:
    - src/game/scenes/UIScene.ts (SHOP state, onShopOpen/onShopClose handlers, ESC shortcut, ShopOverlay instantiation, CR-03 cleanup)
    - src/game/scenes/OverworldScene.ts (_lastNpcId tracking, handleInteract dialogueKey override, onDialogueComplete SHOP_OPEN emit, onShopPurchase, onShopClose, removeGate, awardTraversalReward, gate sign text, traversal reward zone in update(), CR-03 cleanup)
    - src/systems/WhackSystem.ts (activate() enlarged hitbox — +8px reach + 48x32 rect when enlarged=true)
    - src/data/dialogue/en/level-01.json (storeClerk.shopIntro — portrait/text shape)
    - public/locales/en/common.json (shop.* i18n key block)
key-decisions:
  - "ShopOverlay.show() destroys and re-creates item rows on each call — safe to call repeatedly for post-purchase refresh without rebuilding the panel backdrop/title/close"
  - "Store Clerk shop entry uses dialogueKey override ('storeClerk.shopIntro') in handleInteract + _lastNpcId check in onDialogueComplete — reuses existing dialogue pipeline with no structural change to handleInteract()"
  - "Traversal reward zone uses a simple x/y bounds check in update() (px>340, py<200) rather than a physics trigger zone — avoids adding a new TriggerSystem entry mid-phase"
  - "WhackSystem enlarged effect: both wider rect (48x32 vs 32x24) AND extra reach (+8px offset in facing direction) — both effects felt immediately on purchase"
  - "Gate sign text ('ROAD CLOSED — BUS PASS REQUIRED') is a Phaser.GameObjects.Text object hidden by removeGate() — satisfies Open Question 3 (invisible body + sign MVP)"
requirements-completed: [L1E-04]
duration: 6min
completed: "2026-06-15T20:08:58Z"
---

# Phase 03 Plan 04: Shop + Upgrades + Traversal Gate Summary

**UIScene SHOP overlay (4 items, OWNED/BUY/unaffordable states) wired to Economy.applyPurchase via SHOP_PURCHASE event, with newspaper-enlarges-whack, helmet-waives-fee, and Bus-Pass-opens-east-town upgrade effects closing the explore→earn→spend loop.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-06-15T20:02:40Z
- **Completed:** 2026-06-15T20:08:58Z
- **Tasks:** 3 (2 implementation + 1 verification)
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments

- ShopOverlay (320×380 panel, 4 item rows) with OWNED/BUY/unaffordable states, "NOT ENOUGH COINS" flash + row shake, CLOSE button; UIScene SHOP state with re-entry guard preventing Phaser double-pause
- Store Clerk NPC → shopIntro dialogue → SHOP_OPEN → shop opens; purchases validated by Economy.applyPurchase in OverworldScene; panel refreshed via post-purchase SHOP_OPEN re-emit
- Upgrade effects: newspaper (WhackSystem 48×32 hitbox + 8px extra reach), helmet (computeHospitalFee already reads flag), traversal (gate barrier disabled + sign hidden + 15-coin east-town reward zone + journal_traversal_reward seed)

## Task Commits

1. **Task 1: ShopOverlay + UIScene SHOP state + Store-Clerk entry** - `3093b63` (feat)
2. **Task 2: Upgrade effects — newspaper reach + traversal gate + reward zone** - `6d4c502` (feat)
3. **Task 3: End-of-phase verification** — automated suite 121/121 green, tsc clean; human SC-1..SC-5 check on phone pending

## Files Created/Modified

- `src/ui/ShopOverlay.ts` — NEW: 320×380 SHOP panel, 4 item rows, OWNED/BUY/unaffordable states, notEnoughCoins flash + row shake, CLOSE emits SHOP_CLOSE
- `src/game/scenes/UIScene.ts` — SHOP state, onShopOpen (re-entry guard), onShopClose, ESC shortcut, ShopOverlay import + instantiation, CR-03 shutdown pairs for SHOP_OPEN/SHOP_CLOSE
- `src/game/scenes/OverworldScene.ts` — _lastNpcId field, dialogueKey override for storeClerk, onDialogueComplete SHOP_OPEN emit, onShopPurchase (applyPurchase + removeGate + refresh re-emit), onShopClose (clears shopOpen flag), removeGate() + awardTraversalReward(), gate sign text, traversal reward zone in update(), SHOP_PURCHASE/SHOP_CLOSE CR-03 cleanup
- `src/systems/WhackSystem.ts` — activate() enlarged param now active: 48×32 rect + 8px extra reach when enlarged=true; resets to 32×24 on deactivate
- `src/data/dialogue/en/level-01.json` — storeClerk.shopIntro key (portrait/text shape matching existing file)
- `public/locales/en/common.json` — shop.* key block (title, close, buy, owned, notEnoughCoins, price, 4×name+desc)

## Decisions Made

- ShopOverlay.show() rebuilds item rows on each call (destroy + re-create) so the post-purchase refresh path works without rebuilding the full panel. Backdrop/panel/title/close button are permanent.
- Store Clerk shop entry uses a dialogueKey override (`storeClerk.shopIntro`) in handleInteract() + `_lastNpcId === 'storeClerk'` check in onDialogueComplete — the safest path per RESEARCH Open Question 2 (reuses existing dialogue pipeline with no structural change).
- WhackSystem enlarged effect applies both wider rect (48×32 vs 32×24) AND 8px extra reach in facing direction — "bigger whack range" is immediately felt.
- Traversal reward uses a simple update() x/y bounds check (px>340, py<200) rather than a TriggerSystem entry — avoids architectural change mid-phase.
- Gate visual: text-based sign "ROAD CLOSED — BUS PASS REQUIRED" (Phaser.GameObjects.Text at gate center) satisfies Open Question 3 MVP requirement; removeGate() hides it.

## Deviations from Plan

None — plan executed exactly as written. All seams from Plans 01–03 consumed correctly:
- `applyPurchase` from Economy.ts — confirmed returns null on rejection, new flags obj (no mutation)
- `computeHospitalFee` reads `upgrade_helmet` flag — helmet waiver confirmed already wired from Plan 03
- `SHOP_OPEN/SHOP_PURCHASE/SHOP_CLOSE` constants already in GameEvents from Plan 02 — no append needed
- Shop icons + `purchase_chime` already loaded in Preloader from Plan 02 — no Preloader changes needed

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| `journal_traversal_reward` Journal page not displayed | `src/game/scenes/OverworldScene.ts` | `awardTraversalReward()` | Journal UI + content display deferred to Phase 5; key is pushed to `journalUnlocked` and saved |
| `journal_streak_milestone` Journal page not displayed | `src/game/scenes/OverworldScene.ts` | `awardWhackDrop()` | Same — Phase 5 Journal UI |
| Snack consumable effect (energy restore) | `src/game/scenes/OverworldScene.ts` | `awardWhackDrop()` | Snack is purchasable and deducts coins; the in-game effect (streak extend or HP) deferred — marked as consumable with no flag set (D-15) |
| Placeholder PNG images (item icons, bush, swing) | `public/assets/images/*.png` | n/a | Art pass (Phase 2.1 formal sign-off deferred); functional placeholders prevent Phaser loaderror |
| Placeholder OGG audio | `public/assets/audio/sfx_*.ogg` | n/a | Art pass; Phaser logs decode warning but does not block game loop |

All stubs are intentional; none block the plan's goal (full explore→earn→spend loop is complete and functional).

## Threat Surface Scan

No new network endpoints, auth paths, fetch calls, or Supabase interactions. Client-side Phaser only.

Threat mitigations confirmed applied:
- T-03-10: All purchases validated by `Economy.applyPurchase` in OverworldScene (authoritative); UIScene only requests via SHOP_PURCHASE event. Insufficient coins or already-owned return null → no deduction.
- T-03-11: UIScene `onShopOpen` re-entry guard (`this.uiState === 'SHOP'`) re-renders panel data without re-pausing — prevents Phaser double-pause feedback loop.
- T-03-12: `shopOpen` flag set in `onDialogueComplete` (before SHOP_OPEN emit) and cleared in `onShopClose`; `update()` early-returns on `shopOpen || hospitalShowing`.
- T-03-13: Every `GameEvents.on(SHOP_*)` in create() has matching `off()` in shutdown() for both UIScene and OverworldScene (CR-03).
- T-03-SC: Zero new npm packages installed.

## Self-Check: PASSED

### Files exist:
- `src/ui/ShopOverlay.ts` — FOUND
- `src/game/scenes/UIScene.ts` — FOUND (onShopOpen, onShopClose, ShopOverlay import)
- `src/game/scenes/OverworldScene.ts` — FOUND (onShopPurchase, removeGate, awardTraversalReward)
- `src/systems/WhackSystem.ts` — FOUND (enlarged hitbox activated)
- `src/data/dialogue/en/level-01.json` — FOUND (storeClerk.shopIntro)
- `public/locales/en/common.json` — FOUND (shop.* keys)

### Commits exist:
- `3093b63` feat(03-04): ShopOverlay + UIScene SHOP state + Store-Clerk shop entry + i18n — FOUND
- `6d4c502` feat(03-04): upgrade effects — newspaper enlarges whack, traversal reward zone — FOUND

### Static checks:
- `npm test` (121/121 passing) — GREEN
- `npm run check` (tsc --noEmit) — CLEAN
- INFR-04 (no economy literals in *Scene.ts) — CONFIRMED (only ECONOMY_DATA references)
- INFR-05 (no hardcoded player strings in TS) — CONFIRMED (all shop/clerk strings via t())
- CR-03 (shutdown listener pairs): SHOP_OPEN/SHOP_CLOSE off() in UIScene.shutdown() + SHOP_PURCHASE/SHOP_CLOSE off() in OverworldScene.shutdown() — CONFIRMED
- T-03-11 (re-entry guard): `if (this.uiState === 'SHOP') { this.shopOverlay.show(...); return; }` present — CONFIRMED
- T-03-12 (shopOpen guard): `if (this.inDialogue || this.inHandoff || this.shopOpen || this.hospitalShowing) return;` in update() — CONFIRMED
