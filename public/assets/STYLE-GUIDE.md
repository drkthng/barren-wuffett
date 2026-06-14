# Barren Wuffett — Art Style Guide

**Version:** 1.0 (Phase 02.1, 2026-06-14)
**Audience:** Any developer adding a new level or replacing art in Phases 4+.
**Goal:** Reproduce the cozy 16-bit look with DATA + ASSETS ONLY — no engine code changes.

---

## 1. Palette

All sprites and tilesets use the warm Kenney Tiny Town tones. When generating or hand-drawing
any new asset, match against these anchors:

| Role | Hex | Notes |
|------|-----|-------|
| Lush grass (primary ground) | `#6abe30` | Base grass fill; most frequent colour on screen |
| Bright grass (highlight) | `#71c442` | Flower/light variant; use for grass-1 and grass-2 tiles |
| Warm highlight / skin | `#ffe478` | Character highlights, coin gold, warm accents |
| Earth / trunk / outline | `#b86f50` | Tree trunks, dirt paths, character outlines |
| Dark outline | `#1a1a2e` | Hard pixel outlines on characters and props |
| Roof red | `#c0392b` | Red-house roof tiles |
| Roof grey | `#7f8c8d` | Grey-house roof tiles |
| Path dirt center | `#c8a96e` | Dirt road center, auto-tiled path tiles |

**Rule:** Every new sprite must sample from (or harmonise with) this palette before commit.
New colours must be approved and added here. LPC sprites are FORBIDDEN — their palette diverges
and their GPL license propagates (see §5).

---

## 2. Grid + Perspective

- **Tile size:** 16 × 16 px. All levels use `tileWidth: 16, tileHeight: 16` in Phaser's
  `make.tilemap()`. The current world is 30 cols × 52 rows = 480 × 832 px.
- **Perspective:** Top-down, Zelda/FF-Mystic-Quest-adjacent. No isometric skew.
  Characters face one of four directions (down/up/left/right); no diagonal frames needed.
- **Pixel-art rendering (mandatory — see CLAUDE.md):**
  - Phaser config: `antialias: false, pixelArt: true, roundPixels: true`
  - Canvas CSS: `image-rendering: pixelated`
  - These settings are set at game boot and MUST NOT be changed per-scene.
- **Texture size cap:** All individual PNG files must be ≤ 2048 × 2048 px.
  Spritesheets for the player (128 × 16) and bosses (32–64 × 48) are well within this.
- **No SVG or executable assets** — PNG raster only, committed to the repo.

---

## 3. Tileset Vocabulary

**Tileset:** `public/assets/tilesets/tiny_town_tiles.png`
Kenney Tiny Town v1.1, CC0 1.0. 192 × 176 px, 12 cols × 11 rows = 132 tiles, 16 px each.
Load as a plain **image** (not spritesheet): `this.load.image('tiny_town_tiles', ...)`.
Use `tilemap_packed.png` only (margin = 0, spacing = 0) — the non-packed variant has 1 px
spacing that causes ghosting seams (see §6 Gotchas).

**Index map (0-indexed, 12-col sheet):**

| Tile | Index(es) | Notes |
|------|-----------|-------|
| Grass plain | 0 | Most common ground tile |
| Grass flower light | 1 | Sparse variation |
| Grass flower dark | 2 | Sparse variation |
| Dirt auto-tile top-left | 12 | 8-neighbour set: TL corner |
| Dirt auto-tile top-centre | 13 | TC edge |
| Dirt auto-tile top-right | 14 | TR corner |
| Dirt auto-tile mid-left | 24 | ML edge |
| Dirt auto-tile centre | 25 | Surrounded dirt fill |
| Dirt auto-tile mid-right | 26 | MR edge |
| Dirt auto-tile bot-left | 36 | BL corner |
| Dirt auto-tile bot-centre | 37 | BC edge |
| Dirt auto-tile bot-right | 38 | BR corner |
| Small tree orange | 3 | Use sparingly — reads thin |
| Small tree green | 4 | Use sparingly — reads thin |
| Bush | 5 | Great fill between trees |
| Big tree green (2×2) | 7,8 / 19,20 | Most lush; preferred over small trees |
| Big tree orange (2×2) | 10,11 / 22,23 | Autumn accent |
| Mushroom | 29 | Scatter detail |
| Pebbles | 43 | Scatter detail |
| Shrub | 17 | Hedge/detail |
| Red house roof row | 52,53,54 / 64,65,66 | 3-wide, 2-row roof |
| Red house base row | 84,85,86 | 3-wide wall with door/window |
| Grey house roof row | 48,49,50 / 60,61,62 | 3-wide, 2-row roof |
| Grey house base row | 88,89,90 | 3-wide wall with door/window |
| Fence | 44,45,46 | Horizontal fence run |
| Sign | 83 | Wooden sign prop |

Full annotated reference: `.planning/spikes/001-cozy-art-pipeline/` (`_tileset_indexed.png`).

---

## 4. Pipeline — The Reuse Contract (Data + Assets Only)

To add a **new level** (e.g. Level 2, Phase 4) without touching engine code:

### Step A — Author the tile arrays

Create `src/data/levels/level-XX.ts` and export two 2D arrays:

```typescript
// GROUND_DATA: rows × cols, no -1 values — every cell is a real Kenney tile index.
// Base grass is 0/1/2; dirt paths use the 8-neighbour auto-tile set (12-14/24-26/36-38).
export const GROUND_DATA: number[][] = [ /* ... */ ];

// DECO_DATA: same dimensions as GROUND_DATA.
// Collidable props (houses, trees, fences) use Kenney tile indices.
// -1 = empty (Phaser skips; do NOT use 0 as empty — 0 is plain grass).
export const DECO_DATA: number[][] = [ /* ... */ ];
```

**Two-layer rule:** GROUND_DATA is the base (no collision). DECO_DATA holds all collidable
props and uses `setCollisionByExclusion([-1])`. The existing `OverworldScene` already wires
both layers — just provide the arrays.

**Dirt auto-tiling:** For each dirt cell, apply the 8-neighbour rule (see RESEARCH.md Pattern 3)
to pick the correct corner/edge index. Pre-compute the final static arrays offline and commit
them — do NOT call `Math.random()` at runtime (scatter would change every session, blocking
NPC/trigger zones).

**Gameplay corridors:** Before committing, verify that NPC positions, trigger zones (mini-game,
boss), and any patrol paths are not blocked by DECO_DATA values. Keep those cells at -1.

### Step B — Register the level in ContentRegistry

Add a `LevelManifest` entry in `src/services/ContentRegistry.ts` (or the level file):

```typescript
export const LEVEL_XX_MANIFEST: LevelManifest = {
  id: 'level-XX',
  tilemapKey: 'tiny_town_tiles', // reuse existing tileset unless introducing a new one
  // other manifest fields...
};
ContentRegistry.register(LEVEL_XX_MANIFEST);
```

### Step C — Load and register spritesheets in Preloader

If the new level introduces new character sprites:

```typescript
// In Preloader.preload():
// Spritesheet — frameWidth/frameHeight must exactly match one animation frame in the PNG.
this.load.spritesheet('new_char', 'assets/images/new_char.png',
    { frameWidth: 16, frameHeight: 16 });

// In Preloader.create():
this.anims.create({
    key: 'new_char_down',
    frames: this.anims.generateFrameNumbers('new_char', { start: 0, end: 1 }),
    frameRate: 6,
    repeat: -1,
});
// ... repeat for up/left/right
```

If the character is static (single frame), use `load.image` instead of `load.spritesheet`.

### Step D — Reference, do not re-implement

`OverworldScene`'s two-layer tilemap setup and `Player`'s 4-direction animation system
already generalise. Do not copy their inner logic — feed them the new data and assets.

---

## 5. Sourcing Rules

| Rule | Detail |
|------|--------|
| License | CC0 or commercially-OK only. Kenney packs are CC0 (confirmed License.txt in repo). In-house pixel art is project-owned CC0. PixelLab AI-generated art is commercial-OK per their TOS (verify at time of use). |
| LPC sprites | FORBIDDEN. Dual GPL/CC-BY-SA license. GPL propagates to the whole codebase; CC-BY-SA requires attribution on every derivative. Neither is compatible with the project's commercial-funnel intent. |
| Palette lock | New sprites must use (or harmonise with) the anchors in §1. Use PixelLab's palette-lock feature or Aseprite's palette-swap workflow. |
| Size cap | Textures ≤ 2048 × 2048 px. Keep individual PNGs lean: the full character set is < 10 KB total. |
| Self-hosted | All assets committed under `public/assets/`. No runtime CDN, no hotlinking. PWA pre-cache (vite-plugin-pwa `globPatterns: ['**/*.png', ...]`) will cache every committed PNG automatically. |
| No SVG/scripts | PNG raster only. SVGs can contain scripts; PNGs cannot execute. All assets are decoded in the browser sandbox. |
| No real likenesses | Barren Wuffett and all characters are parody archetypes — not based on real individuals (LEGL-02). The share card (VIRL-01) renders `barren_victory.png`; this must remain parody-only because it leaves the device via Web Share. |
| Provenance tracking | Every asset that ships MUST have a row in `public/assets/ASSET-MANIFEST.md` with: Asset Key, File, Format/Size, Source, License, Provenance note, ART Req. No `[ASSUMED]` license entries — verify before commit. |

---

## 6. Gotchas

**Use `tilemap_packed.png`, not `tilemap.png`.**
The packed variant has 0 margin and 0 spacing. The non-packed `tilemap.png` has 1 px gaps
between tiles — `addTilesetImage(..., 16, 16, 0, 0)` on the non-packed file causes 1 px seams
and shifted tile picks. Always pass `margin: 0, spacing: 0`.

**-1 is the empty sentinel in DECO_DATA, not 0.**
Tile index 0 is plain grass (a valid drawable tile). Using 0 as "empty" in the deco layer
renders grass everywhere instead of leaving cells open. Phaser skips negative indices.

**`frameWidth` must exactly match one animation frame's pixel width.**
Loading a 16 × 16 character sheet with `frameWidth: 32` causes Phaser to pick every other
column — wrong frame or invisible sprite. See WR-01 comment in `src/game/scenes/Preloader.ts`.
Always set `frameWidth` / `frameHeight` to the pixel dimensions of a single frame.

**Pre-compute GROUND_DATA / DECO_DATA offline; do not scatter at runtime.**
If scatter placement uses `Math.random()` in `OverworldScene.create()`, the map changes every
session. A randomly-placed tree can block an NPC tap zone or a trigger zone. Generate arrays
offline (a one-shot script), inspect the result, commit the static arrays.

**Preserve gameplay corridors when re-skinning.**
The dog patrol row (pixel y ≈ 208–320, DECO_DATA rows 13–20, gap cols 4–5 and 12–17) must
remain clear of collidable tiles. The patience mechanic depends on the player being able to
reach the gap. Check these cells with the automated test (`tests/art-assets.test.ts` ART-01).

**NPCs use `add.image`, not `add.sprite`.**
`add.image` cannot play frame animations. If NPCs need idle animation in a future level,
change `NPC.ts` to use `add.sprite`. For static single-frame NPCs, `add.image` is correct
and simpler — a single well-drawn 16 × 16 frame reads fine at game scale.

**BossScene pose swap uses `setTexture`, not frame animation.**
The boss has two separate PNGs (`boss_mr_market_greed.png`, `boss_mr_market_panic.png`).
`BossScene` calls `bossSprite.setTexture(key)` on phase transitions — this works on
`add.image` objects and avoids upgrading to `add.sprite`. Reuse this pattern for future bosses.

---

*This guide was written during Phase 02.1 (2026-06-14). Update it whenever new palette anchors,
tile indices, or pipeline steps are added. Keep it as the single source of truth for the cozy look.*
