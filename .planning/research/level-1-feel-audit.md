# Level 1 — Game-Feel Audit (2026-08-04)

**Status:** COMPLETE — full audit of the built game vs. the project's vision ("Zelda-light top-down adventure that is genuinely fun"). Conducted via headless Playwright playthrough of the production build (screenshots), asset byte-level inspection, and a full source map of `src/` + `tests/`.

**Verdict in one sentence:** The *architecture and plans are good*; the game doesn't feel like Zelda because the **camera shows the whole world on one static screen**, the **entire Phase-3 feature layer shipped with invisible art and silent audio**, and **five mechanical bugs** undermine the economy loop — all of which passed CI because the test suite only covers pure-logic seams, never a live scene.

---

## A. Root causes, ranked by impact

### A-1. The camera is not a Zelda camera (single biggest issue)
- World = 30×52 tiles @16px = **480×832 px**. Game canvas = 480×854. The entire town fits on ONE static screen; `startFollow` (`OverworldScene.ts:228`) can never scroll because there is nothing to scroll.
- The player renders ~10px tall — an ant on a miniature board. Zelda-likes show **~10 tiles across** (zoom ≈ 3 at this resolution) with the camera following through a world several screens big. Exploration *feeling* comes from not seeing everything at once.
- Consequence chain: houses unreadable, NPCs indistinguishable from the player, world text ("ROAD CLOSED — BUS PASS REQUIRED") rendered microscopic in the world, HUD overlapping map buildings.
- **Fix:** camera zoom ~3× + follow + deadzone; move the touch whack button out of OverworldScene into UIScene (which has its own camera); `physics.world.setBounds(0,0,480,832)` (currently never set — the player can walk 22px past the map's bottom edge).

### A-2. The Phase-3 feature layer is invisible and silent
Byte-verified placeholder assets still shipping (`public/assets/`):
| Asset | Reality | Consequence |
|---|---|---|
| `bush.png` | **1×1 green pixel**, and `BushEntity.ts:24` never sets a display size | The 14 whackable bushes — the core verb target — are literally invisible |
| `newspaper_swing.png` | 96×32 uniform mustard rectangle (all 3 "frames" identical) | The whack "animation" is a flat yellow block |
| `ui_newspaper_button.png` | 1×1 pixel (stretched to 48×48) | The touch whack button is a green smear |
| `item_*.png` ×4, `leaf_particle.png`, `bw_monogram.png` | 1×1 pixels | Shop rows have no icons; leaf burst invisible |
| `logo.png` | 320×80 uniform `#16213e` on a `#1a1a2e` background | Main menu shows an empty dark rectangle |
| all 6 `sfx_*.ogg` | **44-byte empty Ogg headers** — Phaser decode fails, every `playSfx` is a no-op | The game is 100% silent. No BGM exists at all (`bgm_overworld` key is never loaded). BossScene and PaperThrowScene contain zero audio calls even in code. |

### A-3. Mechanical bugs that survived CI (all with file:line)
1. **One whack awards ~5 prize rolls.** `OverworldScene.ts:650-698` — `onBushHit` disables the bush body only after an 80ms `delayedCall`, but the award runs immediately and arcade `overlap` re-fires every frame (hitbox live 150ms). Streak pips jump; economy pays ~5×; ~5 IndexedDB saves per bush. All Phase-3 tuning is invalidated by this.
2. **Level-complete screen renders twice.** `OverworldScene.ts:575` re-emits `BOSS_DEFEATED`; `UIScene.onBossDefeated` (`:240`) has no re-entry guard → two stacked overlays, two typewriters, duplicate SHARE/CONTINUE buttons.
3. **Overworld keeps running under the level-complete screen** (never paused, unlike SHOP/HOSPITAL/DIALOGUE).
4. **8 of 14 bushes are embedded in collidable deco tiles** (cross-referenced `ECONOMY_DATA.bushes` vs `DECO_DATA`), including SPECIAL milestone `bush_14` inside a house — unreachable journal-page milestone.
5. **`upgrade_newspaper` (20 coins) is mostly a no-op.** `WhackSystem.ts:61` resizes the GameObject, not its `StaticBody` — only the +8px reach offset applies.
6. **Bus-pass gate is walk-around-able.** Barrier rect covers x 248–392 on a path whose open grass rows span x 320–480 (`level-01-economy.ts:106` vs `DECO_DATA` rows 6/9).
7. Diagonal movement is 1.41× faster than cardinal (`Player.ts:85-89`, no normalization).
8. Dog patrol tween and its "gap window" timer are independent and drift apart (`OverworldScene.ts:782-808`).

### A-4. Set pieces trigger invisibly and play as stubs
- Both triggers are **invisible floor rectangles** (`TriggerSystem.ts:34-40`); roaming the town suddenly hijacks you into a mini-game with no marker, prompt, or agency. (Confirmed in playthrough — wandering near the shop teleported the session into PAPER ROUTE!)
- **Paper route** = tap-anywhere-on-screen reaction test on 5 gray `add.rectangle`s (no houses, no aiming, no keyboard support, no SFX, `Math.random` target choice with dead "prefer undelivered" comment) — `PaperThrowScene.ts:235,281`.
- **Boss** = 4 button taps (DECLINE ×3 with no timer/penalty/fail state → BUY LOW within 3s, infinite retries) — a menu, not a fight. Phase 4 already plans both redesigns; the audit confirms nothing here is worth preserving beyond the scene lifecycle wiring.

### A-5. Feel/juice is absent by omission
- **Zero camera effects in the entire codebase** — no shake, flash, fade, or zoom punch. Every scene change is a hard cut; hospital respawn is an instant cross-map teleport.
- 29 `delayedCall`s vs 12 tweens in gameplay scenes — most "animation" is a timer toggling `setVisible` (blink).
- No hitstop, no bush squash, no player attack pose, no idle anim.
- `BushEntity.reset()` (regrow) exists but is never called — bushes are one-shot, which (once bug A-3.1 is fixed) makes total earnable coins ≈ 50 vs. 120 needed to buy out the shop: **the economy as designed cannot fund its own big-ticket item without regrowth.**

## B. Why the process missed this (for the workflow decision)
1. **142/142 tests green, but no test instantiates a Scene/entity** — pure seams + file-existence checks. `art-assets.test.ts` checks >200 bytes for *some* sprites, but bush/swing/button/items were never added to its list.
2. **Verification honestly said `human_needed` on all 7 experiential items** (`03-VERIFICATION.md`) — but phases kept getting marked Complete and the roadmap advanced while UAT sat pending. The experiential gate exists on paper and is skipped in practice.
3. **No step in any plan actually produces art/audio.** Specs name files + durations; execution creates stubs "for the art pass later"; nothing schedules the art pass. (Phase 2.1 did this properly for tiles/characters — and everything added since regressed to stubs.)
4. Three post-phase quick-fixes (whack dead in browser, boss auto-launch on load, route paying no coins) are the same pattern: logic-level tests pass, the lived game breaks.

## C. What is genuinely good (keep)
- Architecture: scene lifecycle (sleep/launch/wake), event bus, InputBus, versioned SaveService, ContentRegistry manifest pattern, pure-TS economy seams — all solid and reusable.
- The pixel art that exists (Kenney tiles, player/NPC/dog/boss sprites) reads cozy — at 3× zoom it will finally be visible.
- The design research (`zelda-mystic-quest-patterns.md`, `buffett-early-years-story.md`) is excellent and largely un-implemented — the ideas are ahead of the build.
- Plans/roadmap sequencing (feel → set pieces → story → levels 2-3 → funnel) is right.

## D. Disposition
→ New **Phase 3.1 (INSERTED): "Level 1 — Game Feel: Zelda Camera, Juice & Repair"** executes fixes A-1..A-5 before Phase 4 builds set pieces on a broken base. Phase 4/5/6 plans stay as designed (they already cover the mini-game/boss/story rebuilds).
→ Level 2 work stays in Phase 6 — building a second level before Level 1 feels good would repeat the core mistake.
→ Evidence: playthrough screenshots in the session log; asset bytes + file:line refs above.
