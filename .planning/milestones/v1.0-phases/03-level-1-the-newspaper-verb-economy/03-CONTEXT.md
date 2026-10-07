# Phase 3: Level 1 — The Newspaper Verb & Economy - Context

**Gathered:** 2026-06-15
**Status:** Ready for planning
**Source:** discuss-phase --auto (decisions auto-selected from design docs + codebase; tuning numbers are playtest defaults)

<domain>
## Phase Boundary

This phase delivers the **core explore → earn → spend loop** for Level 1 (the town of Ohama):

- **Whack verb** — the rolled-up newspaper becomes a real interaction verb; the player swings it to clear bushes and whack props.
- **Coin economy** — whackables drop coins/items via a fair, deterministic 8-slot prize-pack; a HUD "snowball" coin total tracks the running count.
- **Dog hazard** — the existing patrolling dog becomes a non-lethal hazard (knockback + i-frames + "hospital" respawn with a small coin fee + bush-streak reset). Never a death screen.
- **Shop + upgrades** — a town shop sells 3–4 permanent upgrades; the traversal upgrade gates a previously-unreachable part of town, giving coins a clear purpose.

**Covers requirements:** L1E-01 (whack verb), L1E-02 (prize-pack + snowball HUD), L1E-03 (dog hazard), L1E-04 (shop + traversal gate).

**Foundation only.** This phase is the mechanics/economy substrate. It explicitly does NOT include: the paper-route glow-up or the Mood-Pendulum boss redesign (Phase 4), or the story spine / new NPCs / cutscenes / story mini-games / the full Investment Journal reward payoff (Phase 5), or anything funnel/backend (Phase 7).

</domain>

<decisions>
## Implementation Decisions

### A. Newspaper Whack Verb (L1E-01)

- **D-01: Whack is a dedicated, context-sensitive action.** Add `Action.WHACK` to `InputBus`. Touch: a new on-screen **newspaper button** in the bottom-right thumb zone (≥44px, mirrored opposite the joystick at ~x=120,y=750). Keyboard: Space/Enter whacks when **no NPC is in interact range** (otherwise it talks — reuse the existing `handleInteract` gate), plus a dedicated always-whack key (e.g., `J`). Talk-to-NPC stays the existing tap-on-NPC zone. No new control is introduced mid-game (so the boss in Phase 4 can reuse the same verb).
- **D-02: Hit detection = a short-lived directional hitbox** in front of the player based on `facing`, active ~120–180ms, with a ~300–400ms cooldown between swings. It overlaps a Phaser physics **"whackable" group** (bushes/props now; dog/boss reuse the same verb later).
- **D-03: Crisp feedback on every whack** — newspaper swing animation (arc tween/overlay), bush shake → leaf/puff particle → bush clears (hidden + marked cleared), a whack SFX + coin "ding" on drop, optional tiny on-hit flash. Bushes **regrow on level re-entry** (soft farm) — the deterministic pack + streak cap prevent grinding.
- **D-04: Player swing animation = an overlay sprite, not a player-sheet re-cut.** `player_sheet` is 8 frames (4-dir walk only); add the swing as a separate `newspaper_swing` sprite/tween anchored to the player by facing. Cheapest path, no re-art of the existing sheet.

### B. Prize-Pack Economy & Snowball HUD (L1E-02)

- **D-05: Adopt the ALttP deterministic 8-slot prize-pack verbatim** as the starting tune (from `zelda-mystic-quest-patterns.md` §2): slots = `[1 coin, nothing, 1 coin, 3 coins, 1 coin, snack(heart), 1 coin, 5 coins]`; ~**55% drop chance** per successful whack; a per-pack counter advances each whack so *what* drops is deterministic-by-slot while *whether* it drops is the 55% roll. Average ≈ 1.7 coins per successful whack — predictable over a field, no long droughts.
- **D-06: First bush of a new game ALWAYS drops a coin** (tutorial juice) — a one-time override tracked by a save flag (`first_whack_done`).
- **D-07: Snowball streak bonus (Zelda-1 style).** Whack **8 bushes without taking a dog hit** → next clear yields a bonus pile (start: 8 coins); at a few hand-placed milestone bushes it yields a collectible **Investment Journal page** (content-only seed for the deferred funnel — no backend). A dog hit **resets the streak to 0**. Streak is transient (not persisted).
- **D-08: Wire coins → HUD (closes a real gap).** Today nothing calls `HUD.setCoins()` — `OverworldScene.coins` is never pushed to the counter, so it reads 0. Add a `COINS_CHANGED` event (OverworldScene → UIScene/HUD), fire it on every coin delta, and reuse the existing scale-tween + a small "+N" float (the `flashPatienceBonus` float pattern) as the "snowball growing" juice. The coin counter **is** the snowball (compounding theme); a snowball-icon reskin is optional polish.

### C. Dog Hazard & Hospital Loop (L1E-03)

- **D-09: Convert the existing patrol dog into a hazard.** Keep the readable left↔right patrol (DECO gap rows 13–20) **and keep the patience-gap reward** (slipping past safely = +coins; honors GAME-06). Add a bite on contact **only when the player is not in i-frames**.
- **D-10: On bite** — knock the player back a few tiles away from the dog (~150–200ms tween, no damage during knockback) and grant **~0.8–1.0s i-frames** with a sprite flash (can't be re-bitten), then trigger the hospital beat.
- **D-11: Hospital beat (the gag — locked by Success Criterion 3).** A brief **"WAKE UP IN HOSPITAL"** splash (a new UIScene overlay state `HOSPITAL`, ~1–1.5s, tap/auto-dismiss) → respawn at a fixed clinic/home point (start: 96,96) → deduct a **small coin fee** (start: 5, floored at 0) → reset the bush streak. Never a death screen; fully recoverable.
- **D-12: Helmet ties the loop together.** Owning the helmet (`upgrade_helmet`) **waives the hospital coin fee** (still knockback + i-frames + streak reset — just no money lost). This connects hazard ↔ shop ↔ economy.

### D. Shop, Upgrades & Traversal Gate (L1E-04)

- **D-13: Shop opens via the existing Store Clerk NPC** (`storeClerk`, pixel 352,160). Render it as a **UIScene overlay state `SHOP`** (extend the existing HUD/DIALOGUE/PAUSE/LEVEL_COMPLETE state machine), not a separate scene. **Coins stay authoritative in OverworldScene**; purchases flow over events (`SHOP_OPEN`, `SHOP_PURCHASE{itemId}`) — OverworldScene validates the balance, applies the effect, persists, and emits `COINS_CHANGED`.
- **D-14: Four shop items** (Success Criterion 4), starting prices to playtest:
  1. **Sunday Edition** (newspaper upgrade) — bigger whack hitbox/reach. ~20 coins → `upgrade_newspaper`.
  2. **Bike Helmet** (anti-dog) — waives the hospital fee. ~35 coins → `upgrade_helmet`.
  3. **Bus Pass / Good Shoes** (traversal unlock) — opens the gated area; the big-ticket "save-for" item. ~60 coins → `upgrade_traversal`.
  4. **Snack** (heart/consumable) — the only consumable, cheap. ~5 coins → immediate effect, not persisted as owned.
  Tuned so a player can afford ~1–2 by boss time; **no forced grinding**.
- **D-15: Permanent upgrades persist via the existing `SaveState.flags` bag** (`upgrade_newspaper` / `upgrade_helmet` / `upgrade_traversal` booleans) — **no SaveState schema change or migration needed** (coins already persist). Snack is consumable. A purchased permanent upgrade shows as "OWNED" and can't be re-bought.
- **D-16: Traversal gate = a barrier removed by a flag.** A collidable barrier (deco tile or guarded zone) blocks a currently-unreachable town area until `upgrade_traversal` is set; once owned, the barrier opens and the new area yields a tangible reward (a coin stash + a hidden Journal page) so coins have a clear purpose. Exact tiles chosen at plan/execute time (candidate: the east path cols 20–29 rows 7–8, or a creek crossing) — the *mechanism* is the locked decision.

### E. Architecture, Data & Cross-cutting (INFR-04, INFR-05, SAVE-02, mobile)

- **D-17: Generic engine systems + level-data content (INFR-04).** New systems (a whack/hitbox system, a deterministic prize-pack/economy module, a shop module) are **content-agnostic**. Level-specific content — bush positions + special bushes, the prize-pack table, shop inventory + prices, gate location — lives in **level data** (extend the `level-01` manifest or add a sibling `src/data/levels/level-01-economy.ts`) consumed by the systems. Extend the `LevelManifest` type minimally where needed; keep the ContentRegistry pattern.
- **D-18: All new player-facing strings via `t()` + `src/data/dialogue/en/level-01.json`** (INFR-05) — shop labels/prices, hospital splash, whack/empty prompts, clerk shop lines. English now, German addable without refactor.
- **D-19: New `GameEvents` constants** following the frozen-constants pattern: `COINS_CHANGED`, `BUSH_WHACKED`, `PLAYER_HOSPITALIZED` (dog bite), `HOSPITAL_DISMISS` (hospital-splash dismiss → OverworldScene respawn carrier; UIScene emits, OverworldScene listens and respawns the player at 96,96), `SHOP_OPEN`, `SHOP_PURCHASE`, `SHOP_CLOSE`, `STREAK_BONUS`.

### Claude's Discretion

- All **tuning numbers** (prices, drop %, hospital fee, i-frame duration, streak threshold, knockback distance, cooldown) are starting defaults to adjust by playtest.
- Exact **gated-area location** and the placement of the 2–4 special/hidden bushes.
- Exact **whack key letter(s)**; whether the shop stays a UIScene overlay or becomes a small `ShopScene` if the overlay proves awkward.
- Whether the newspaper-upgrade effect is reach, hitbox size, or both.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design direction (the source of the mechanics + tuning)
- `.planning/research/level-1-redesign-ideas.md` — user's raw ideas + the locked overall direction (bush-whack economy, dog-as-glue, shops, the P3/P4/P5 split).
- `.planning/research/zelda-mystic-quest-patterns.md` — the copyable specs: **§2** deterministic prize-pack + streak + first-whack guarantee, **§3** shop/upgrade tiers + traversal gate, **§4** non-lethal dog (knockback/i-frames/streak coupling/hospital gag), **§1** onboarding (give the verb early + safe practice bushes), **§7** Level-1 pacing template.
- `.planning/research/buffett-early-years-story.md` — tone + parody cast/place names (Ohama, Mr. Market); mostly Phase 5, used here only for naming/voice consistency.

### Scope contract
- `.planning/ROADMAP.md` → Phase 3 section — the authoritative **Success Criteria** (the hospital coin-fee + streak-reset wording in SC-3 overrides the design doc's softer "scatter coins to re-collect" alternative).
- `.planning/REQUIREMENTS.md` → **L1E-01, L1E-02, L1E-03, L1E-04** (+ guardrails: INFR-04 data-manifest levels, INFR-05 i18n, SAVE-02 offline, GAME-06 patience, and the "Out of Scope" no-grind/no-dark-pattern rules).

### Code (integration points — read before touching)
- `src/game/scenes/OverworldScene.ts` — the hub: player, dog patrol, NPCs, coins, triggers, autosave.
- `src/entities/Player.ts` — movement only today; gains whack + knockback + i-frames.
- `src/input/InputBus.ts` — `Action` enum + polling; gains `WHACK`.
- `src/ui/HUD.ts` — coin counter + `setCoins()` + tweens + `flashPatienceBonus` float (reuse for snowball juice).
- `src/game/scenes/UIScene.ts` — modal state machine; gains `SHOP` + `HOSPITAL` states.
- `src/events/GameEvents.ts` — frozen event-name constants pattern.
- `src/services/SaveService.ts` — `SaveState.flags` (upgrades) + `coins`; no migration needed.
- `src/services/ContentRegistry.ts` + `src/data/levels/level-01.ts` — `LevelManifest` + the GROUND/DECO arrays (dog-gap rows 13–20; NPC/boss/trigger coords).
- `src/entities/NPC.ts` — store-clerk interaction (shop entry).
- `src/systems/TriggerSystem.ts` — zone rects (gate/shop zones if needed).
- `src/game/scenes/Preloader.ts` — asset/spritesheet + anim registration pipeline.
- `src/services/AudioService.ts` — SFX/music toggle semantics.
- `src/services/i18n.ts` + `src/data/dialogue/en/level-01.json` — string + dialogue pattern.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **HUD** already has a coin counter, `setCoins(n)`, an increment scale-tween, and a float-up `flashPatienceBonus` — reuse directly for the snowball total + "+N" pickups.
- **GameEvents** singleton bus — add new constants and emit/subscribe (no new infra).
- **SaveService** — `SaveState.flags: Record<string,boolean>` is a generic bag → store permanent upgrades with zero schema change; `coins` already persisted.
- **ContentRegistry / LevelManifest** — established data-manifest pattern for level content.
- **NPC (storeClerk)** — already placed; the natural shop entry point.
- **TriggerSystem** — rectangle zone-overlap utility for gate/shop zones.
- **Preloader + AudioService + i18n/dialogue JSON** — the asset/sfx/string pipelines are all in place.

### Established Patterns
- **Data-manifest levels** (INFR-04): content as data, engine stays generic.
- **Scene-as-state handoff** (PaperThrowScene/BossScene sleep→launch→wake) — available if the shop ever needs to be a scene, but D-13 prefers the lighter UIScene overlay.
- **UIScene modal state machine** (HUD/DIALOGUE/PAUSE/LEVEL_COMPLETE) — extend with SHOP + HOSPITAL.
- **Plain-TS entity classes** holding a Phaser sprite, polling `InputBus` each tick.
- **Deterministic, offline-precomputed level arrays** — no runtime RNG for layout.

### Integration Points
- **OverworldScene is the orchestration hub** — owns coins, dog, player, triggers, save; most Phase-3 wiring lands here.
- **The HUD↔coins gap** (D-08) must be closed for the snowball criterion to be visible at all.
- **Player** needs three new capabilities (whack, knockback, i-frames) — keep movement (±80px/s) untouched.
- **SaveState.flags** is the persistence seam for upgrades; **journalUnlocked** array already exists for the seed Journal pages.

</code_context>

<specifics>
## Specific Ideas

- Prize-pack table copied verbatim from `zelda-mystic-quest-patterns.md` §2: `[1 coin, nothing, 1 coin, 3 coins, 1 coin, snack, 1 coin, 5 coins]` @ ~55%.
- Shop item archetypes map 1:1 to the research's "sword upgrade / shield / flippers / heart-refill" tiers.
- "WAKE UP IN HOSPITAL" splash is the memorable parody beat (the LA shopkeeper-gag tone), not a punishment screen.
- The coin total framed as a **snowball** reinforces the compounding/value-investing theme that pays off in the boss (Phase 4) and Journal (Phase 5/7).

</specifics>

<deferred>
## Deferred Ideas

- **Mood-Pendulum boss redesign** and **paper-route glow-up + results splash** → Phase 4 (L1E-05, L1E-06).
- **Story spine, new parody NPCs (Dottie/Donno/Barber Bristle/Old Penny), cutscenes, Count-the-Caps + Pinball-Snowball mini-games, full Journal reward payoff** → Phase 5 (L1E-07..09). Phase 3 only *seeds* hidden Journal pages as content.
- **Sell/trade loop** (buy-low/sell-high gag with found collectibles) — thematic but extra scope; revisit with the boss theme.
- **Second shop / vending-machine gag** and a **hidden cellar/shed "cave"** — nice-to-have exploration rewards; one shop keeps the economy legible for now.
- **Scatter-coins-you-can-re-collect** dog-penalty variant — chose the hospital coin-fee per Success Criterion 3; keep the scatter idea as a possible polish.
- **Funnel/backend, cloud-save, real Journal email unlock** → Phase 7.

> ⚠ Note: `.planning/spikes/MANIFEST.md` exists but is unpackaged. Optional: run `/gsd-spike --wrap-up` to surface spike findings as a discoverable skill for future phases (non-blocking).

</deferred>

---

*Phase: 03-level-1-the-newspaper-verb-economy*
*Context gathered: 2026-06-15 via discuss-phase --auto*
