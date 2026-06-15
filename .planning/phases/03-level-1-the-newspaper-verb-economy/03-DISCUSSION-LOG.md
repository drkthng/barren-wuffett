# Phase 3: Level 1 — The Newspaper Verb & Economy - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-15
**Phase:** 3-level-1-the-newspaper-verb-economy
**Mode:** `--auto` (Claude auto-selected the recommended option for each area; no interactive prompts)
**Areas discussed:** Whack verb, Prize-pack economy & snowball HUD, Dog hazard & hospital, Shop / upgrades / traversal gate, Architecture & persistence

---

## Whack Verb (L1E-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated context-sensitive action | `Action.WHACK` + on-screen newspaper button + key; talk stays tap-on-NPC; no new mid-game control | ✓ |
| Reuse INTERACT (Space) for both | One button does talk-or-whack everywhere | |
| Auto-whack on bush proximity | No explicit input; whack triggers by walking into bushes | |

**Choice:** Dedicated context-sensitive action (D-01..D-04).
**Notes:** Keeps the verb reusable by the Phase-4 boss with no new control. Swing = overlay sprite, not a player-sheet re-cut (cheapest). Hitbox in front of `facing`, ~150ms active, ~350ms cooldown.

---

## Prize-Pack Economy & Snowball HUD (L1E-02)

| Option | Description | Selected |
|--------|-------------|----------|
| ALttP deterministic 8-slot pack | `[1,—,1,3,1,snack,1,5]` @ ~55%, per-pack counter; first bush = guaranteed coin; streak-8 bonus | ✓ |
| Pure random drops | Each whack rolls independently | |
| Fixed coin-per-bush | Every bush = N coins, no variance | |

**Choice:** Deterministic 8-slot pack (D-05..D-08), copied verbatim from `zelda-mystic-quest-patterns.md` §2.
**Notes:** Deterministic counter = "no long droughts" (L1E-02) while individual whacks still feel random. Surfaced a real gap: `HUD.setCoins()` is never called today, so the counter must be wired via a new `COINS_CHANGED` event for the snowball to be visible at all.

---

## Dog Hazard & Hospital (L1E-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Knockback + i-frames + hospital fee + streak reset | Keep patrol + patience reward; bite → recover loop; helmet waives fee | ✓ |
| Scatter coins to re-collect | Bite drops coins on the ground you can claw back | |
| Pure HP/damage model | Dog deals damage to a health bar | |

**Choice:** Knockback + i-frames + hospital (D-09..D-12).
**Notes:** Success Criterion 3 explicitly specifies "hospital (respawn + small coin fee)" and "resets the streak" — this overrides the design doc's softer scatter-coins alternative (kept as deferred polish). Never a death screen. Helmet upgrade waives the fee, tying hazard↔shop↔economy.

---

## Shop, Upgrades & Traversal Gate (L1E-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Store-Clerk NPC → UIScene SHOP overlay | Reuse existing NPC + modal state machine; coins authoritative in OverworldScene via events | ✓ |
| Dedicated ShopScene (sleep/launch/wake) | Full scene handoff like PaperThrowScene | |
| Auto-buy / pickup upgrades in world | No shop UI; upgrades found in the world | |

**Choice:** Store-Clerk → UIScene SHOP overlay (D-13..D-16); 4 items (Sunday Edition / Bike Helmet / Bus Pass / Snack).
**Notes:** Permanent upgrades persist via the existing `SaveState.flags` bag — **no schema migration**. Traversal gate = a barrier removed when `upgrade_traversal` is set, opening a rewarded area so coins have a clear purpose. Prices tuned for ~1–2 buys by boss time, no grind.

---

## Architecture & Persistence (INFR-04, INFR-05, SAVE-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Generic engine systems + level-data content | Whack/economy/shop systems content-agnostic; bushes/pack/shop/gate as data | ✓ |
| Hardcode all content in OverworldScene | Faster but breaks the data-manifest contract | |

**Choice:** Generic systems + level data (D-17..D-20).
**Notes:** Honors INFR-04 (adding a level = adding data, not engine code). All strings via `t()`/dialogue JSON (INFR-05). Offline/local only (SAVE-02). Art/audio via the proven CC0 Kenney pipeline (spike 001); placeholder-first OK.

## Claude's Discretion

- All tuning numbers (prices, drop %, hospital fee, i-frame/cooldown durations, streak threshold, knockback distance).
- Exact gated-area location + special/hidden bush placements.
- Exact whack key letter(s); shop-as-overlay vs small ShopScene if the overlay proves awkward.
- Whether the newspaper upgrade increases reach, hitbox, or both.

## Deferred Ideas

- Phase 4: Mood-Pendulum boss, paper-route glow-up + results splash.
- Phase 5: story spine, new parody NPCs, cutscenes, Count-the-Caps + Pinball-Snowball mini-games, full Journal reward payoff (Phase 3 only seeds hidden pages).
- Later/optional: sell-trade loop, second shop / vending-machine gag, hidden cellar "cave", scatter-coins dog-penalty variant.
- Phase 7: funnel/backend, cloud-save, real Journal email unlock.
- Housekeeping: unpackaged `.planning/spikes/MANIFEST.md` — optional `/gsd-spike --wrap-up`.
