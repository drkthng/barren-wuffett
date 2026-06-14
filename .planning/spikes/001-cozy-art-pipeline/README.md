---
spike: 001
name: cozy-art-pipeline
type: standard
validates: "Given one cohesive free pixel-art pack, when wired into a Phaser tilemap + 4-direction animated character, then Level 1 reads as a real cozy 16-bit town and the pack->tileset->anim pipeline is proven in <1h"
verdict: VALIDATED
related: []
tags: [art, graphics, phaser, tilemap, pixel-art, cc0, kenney, mobile]
---

# Spike 001: Cozy Art Pipeline

## What This Validates

**Given** one cohesive free pixel-art pack,
**when** its tileset is wired into a Phaser tilemap and paired with a 4-direction animated character sprite,
**then** the overworld reads as a real cozy 16-bit town (Zelda/Mystic-Quest-adjacent) and the full pipeline (pack → tileset → Phaser tilemap + animations) is proven feasible in well under an hour.

This de-risks a future **Phase 2.5 — Visual Pass** before committing to a full art effort. Mechanics are already complete (Phase 2); this is purely the visual layer.

## Research

| Approach | Source | License | Cohesive? | Has 4-dir character? | Fetchable (no itch)? | Verdict |
|----------|--------|---------|-----------|----------------------|----------------------|---------|
| Ninja Adventure | github.com/pixel-boy/NinjaAdventure | CC0 | yes | yes (ninja/samurai) | yes (GitHub) | Fantasy theme — wrong vibe for cozy suburb |
| **Kenney Tiny Town** | kenney.nl/assets/tiny-town | **CC0** | **yes** | **no** (env only) | **yes (direct .zip)** | **CHOSEN — ideal cozy-town tiles, ships free** |
| Sprout Lands / Cute Fantasy | itch.io | attribution / restrictive | yes | varies | no (itch 403) | Best suburban vibe but not auto-fetchable; restrictive license |

**Chosen approach:** Kenney **Tiny Town** (CC0, 16×16, 132-tile packed sheet) for the world. It is the strongest cozy-town aesthetic that is (a) CC0 = shippable with no attribution (fits the €0 + legally-cautious constraint), and (b) directly fetchable. Tiny Town is **environment-only** (no characters), so a player character was generated as a deliberate stand-in to prove the animation pipeline; the real phase sources a cohesive character (PixelLab palette-match, LPC, or commission).

**Gotchas found:**
- Kenney Tiny Town has **no character/animation sprites** — pair it with a separate character source.
- Tiny Town dirt is a **rounded "patch" set**, not a 4-way road tileset. Hard grass↔dirt edges look abrupt; the real phase needs the edge tiles (12-14 / 24-26 / 36-38) via Tiled's terrain/auto-tile brush.
- Small-tree tiles (idx 3/4) read as sparse saplings at 16px; **bushes (5) and big trees (7,8/19,20) look lush** — lean on those.

## How to Run

```bash
# from repo root (Vite is already a project dependency)
npx vite .planning/spikes/001-cozy-art-pipeline --port 5180 --strictPort
# then open http://localhost:5180/  — walk with arrows/WASD or the on-screen pad
```

Headless render check (proves it draws, not just serves):
```bash
node .planning/spikes/001-cozy-art-pipeline/_shot.mjs   # writes _shot_*.png, logs console errors
```

## What to Expect

A scrolling cozy town: lush grass with flower variants, a dirt crossroads, red- and grey-roofed houses with doors/windows, trees/bushes/mushrooms, a wooden fence and sign. A little character walks in 4 directions (face when walking toward you, back-of-head away, side profiles), camera follows, and houses/trees/fences block movement.

## Index Map (Kenney Tiny Town, 12-col packed sheet)

- Grass `0/1/2` · Dirt `25` (rounded edges `12-14/24-26/36-38`)
- Trees: small green `4`, small orange `3`, big green `7,8/19,20`, bush `5`, mushroom `29`, pebbles `43`, shrub `17`
- Red house: roof `52,53,54`/`64,65,66`, wall `84,85,86` · Grey house: roof `48,49,50`/`60,61,62`, wall `88,89,90`
- Fence `44,45,46` · Sign `83`
- (Full numbered reference: `_tileset_indexed.png`)

## Investigation Trail

1. Confirmed outbound network → can fetch CC0 assets directly (github raw 200, kenney.nl 200; itch.io 403).
2. Evaluated Ninja Adventure (CC0, GitHub) — real 4-dir characters but fantasy/ninja theme, wrong for a 1940s-suburb cozy read.
3. Pivoted to Kenney Tiny Town (CC0) — fetched the `.zip`, confirmed CC0 1.0 in `License.txt` + on `Sample.png`.
4. Discovered Tiny Town is environment-only → **generated** an 8-frame (4-dir × 2 walk) 16×16 character via System.Drawing, palette-matched to Kenney's warm tones.
5. Mapped tile indices by upscaling the packed sheet 7× with per-cell index labels (`_tileset_indexed.png`).
6. Built the demo using the **same pattern the real game uses** — a 2D index array → `make.tilemap({data})` (cf. `src/data/levels/level-01.ts` MAP_DATA) + `generateFrameNumbers` anims (cf. `Preloader.ts` spritesheet load).
7. Verified render headlessly with Playwright: **0 console/page errors**; screenshots confirm tilemap composition, 4-dir animation, arcade collision (blocked at tree clump), and camera-follow scroll.

## Results

**VALIDATED.** A single CC0 pack turns the placeholder-square overworld into a convincing cozy 16-bit town, and the pack→tileset→Phaser-anim pipeline is confirmed working and identical to the game's existing tilemap/spritesheet patterns — built in well under an hour. Evidence: `_shot_1_idle.png`, `_shot_2_right.png`, `_shot_3_down.png`.

**Signal for the build (Phase 2.5):**
- **Use Kenney Tiny Town (CC0)** as the Level 1 base tileset — free, shippable, no attribution, tiny bundle (mobile/PWA-friendly).
- **Add grass↔dirt transition tiles** (auto-tiling) so paths aren't hard rectangles — this is the single biggest polish win.
- **Source a cohesive character set** (player + 3 NPCs + dog + Mr. Market) — Tiny Town has none; PixelLab palette-matched to Kenney, or LPC, or commission. The generated stand-in is throwaway.
- **Reuse fuller trees/bushes**; use small-tree tiles sparingly.
- Pipeline = no engine changes: feed new tile indices into the existing `level-01.ts` MAP_DATA + register sprites in `Preloader.ts`. ContentRegistry/manifest pattern already supports this.

**Aesthetic sign-off:** user approved the look (2026-06-14).

## Polish Iteration (2026-06-14)

Applied the three recommended polishes in-spike to preview the target quality:
1. **Path auto-tiling** — 8-neighbour rule maps dirt cells to Kenney's rounded 3×3 set (`12-14/24-26/36-38`); roads and a plaza now have rounded grass↔dirt edges + a T-junction instead of hard rectangles.
2. **Lusher vegetation** — favour bushes (`5`) + big leafy trees (`7,8/19,20`, `10,11/22,23`); small saplings used sparingly.
3. **Character** — regenerated with a dark Kenney-style outline + simple shading.

Re-verified headless (0 console errors). Screenshots refreshed. These three techniques carry forward as Phase 2.5 implementation notes.
