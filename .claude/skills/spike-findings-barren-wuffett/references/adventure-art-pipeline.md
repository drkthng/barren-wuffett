# Adventure Art Pipeline: CC0 pack → Phaser tilemap + 4-direction character

This turns the adventure's placeholder squares into a cozy 16-bit town with one CC0 pack (Kenney Tiny Town) through the game's existing tilemap and spritesheet patterns. It was proven in spike 001 and has **already shipped into the game**: `public/assets/tilesets/tiny_town_tiles.png`, with provenance in `public/assets/ASSET-MANIFEST.md`. Use this file when extending the adventure (D), which stays in the hub.

## Requirements

From idea `cozy-visual-pass`:

- **Art look:** a cozy 16-bit town (warm suburb, Stardew/Sprout-Lands-adjacent), chosen by the user.
- **License discipline:** prefer **CC0** assets (shippable, no attribution) given the €0 + legally-cautious constraint. Track license and provenance for anything shipped.
- **Cohesion first:** one consistent base pack drives the world, and generated or AI assets must palette-match it. Mixing styles is what makes a game look janky.
- **No engine changes:** new art flows through the existing tilemap (`level-01.ts` MAP_DATA) + `Preloader.ts` spritesheet + ContentRegistry patterns. Art is additive, not a mechanics rewrite.
- **Pipeline = pack → tileset PNG → Phaser tilemap (2D index array) + `generateFrameNumbers` anims.**

## How to Build It

1. **Fetch the pack** directly. Both `kenney.nl` `.zip` downloads and GitHub raw URLs work from this machine. Confirm CC0 in the pack's `License.txt`, then add a row to `public/assets/ASSET-MANIFEST.md`.
2. **Use the packed sheet** (`Tilemap/tilemap_packed.png`: 12 columns, 16×16, 0 margin, 0 spacing). Build a numbered reference by upscaling it with per-cell index labels (`sources/001-cozy-art-pipeline/_tileset_indexed.png`).
3. **Two layers from 2D index arrays** (`-1` = empty): a ground layer and a collidable decoration layer.

```js
preload() {
    this.load.image('tt', 'assets/tiny-town/Tilemap/tilemap_packed.png');
    this.load.spritesheet('player', 'assets/player.png', { frameWidth: 16, frameHeight: 16 });
}
create() {
    const gMap = this.make.tilemap({ data: ground, tileWidth: 16, tileHeight: 16 });
    gMap.createLayer(0, gMap.addTilesetImage('tt', 'tt', 16, 16, 0, 0), 0, 0);
    const dMap = this.make.tilemap({ data: deco, tileWidth: 16, tileHeight: 16 });
    const dLayer = dMap.createLayer(0, dMap.addTilesetImage('tt', 'tt', 16, 16, 0, 0), 0, 0);
    dLayer.setCollisionByExclusion([-1]);

    const mk = (key, s, e) => this.anims.create({ key, frames: this.anims.generateFrameNumbers('player', { start: s, end: e }), frameRate: 6, repeat: -1 });
    mk('down', 0, 1); mk('up', 2, 3); mk('left', 4, 5); mk('right', 6, 7);

    this.player = this.physics.add.sprite(x, y, 'player', 0);
    this.player.body.setSize(8, 6).setOffset(4, 10);          // feet-only hitbox
    this.physics.add.collider(this.player, dLayer);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);
    this.cameras.main.roundPixels = true;
}
```

4. **Auto-tile the paths.** Keep a boolean `dirt[y][x]` grid. For each dirt cell, check which of its four neighbours are grass and pick the rounded edge tile: two open sides → a corner (tl/tr/bl/br), one → an edge (tc/bc/ml/mr), none → the centre `25`. Grass cells randomly use variant `1` (7 %) or `2` (4 %) over the base `0`. This was the biggest polish win.
5. **Place set pieces first, then scatter.** Stamp the 3×3 houses and 2×2 big trees only where `free()` allows (not dirt, not taken), then scatter bushes generously and small trees sparingly.
6. **Idle frames by facing:** when velocity is 0, stop the anim and `setFrame({ down: 0, up: 2, left: 4, right: 6 }[facing])`. Normalise diagonal input so diagonals aren't faster.

### Tiny Town index map (12-col packed sheet)

- Grass `0/1/2` · dirt centre `25`, rounded edges `12-14 / 24-26 / 36-38`
- Trees: small green `4`, small orange `3`, big green `7,8 / 19,20`, big orange `10,11 / 22,23`, bush `5`, shrub `17`, mushroom `29`, pebbles `43`
- Red house: roof `52,53,54 / 64,65,66`, wall `84,85,86` · grey house: roof `48,49,50 / 60,61,62`, wall `88,89,90`
- Fence `44,45,46` · sign `83`

## What to Avoid

- **Expecting characters in Tiny Town.** It is environment-only. Characters come from somewhere else; the game uses in-house sprites palette-locked to Kenney's warm tones (`#6abe30 #71c442 #ffe478 #b86f50`).
- **Hard grass↔dirt rectangles.** Tiny Town's dirt is a rounded *patch* set, not a 4-way road set, so always auto-tile the edges.
- **Small-tree tiles (`3`/`4`) as the main vegetation.** They read as sparse saplings at 16 px. Lean on bushes (`5`) and the big 2×2 trees.
- **Tiled "Collection of Images" tilesets.** Phaser's parser does not support them. Use single embedded spritesheet tilesets.
- **LPC sprites.** GPL / share-alike propagation risk, ruled out in `ASSET-MANIFEST.md`.
- **itch.io packs** (Sprout Lands, Cute Fantasy). itch returns 403 to scripted fetches, and the licences are restrictive.
- **ImageMagick `convert`** on this Windows box. It resolves to Windows' own `convert.exe`. Use PowerShell `System.Drawing` for pixel-art generation and upscaling, and precompute dimensions (`New-Object Bitmap($a,$b)` mis-parses `(128*8,16*8)`).

## Constraints

- Tiny Town is CC0 1.0, 16×16 tiles in a 132-tile packed sheet, ~5 KB, so it is mobile- and PWA-friendly.
- Phaser config: `pixelArt: true, antialias: false, roundPixels: true` before the first render, and `image-rendering: pixelated` on the canvas.
- The full pipeline went from download to a walking, colliding character in under an hour. The user signed off on the look on 2026-06-14.
- Verify by playing, not by tests. Earlier phases shipped "complete" with green tests while the art was broken (1×1-px bushes, silent SFX stubs). Build, serve `vite preview --config vite/config.prod.mjs`, drive it with Playwright (`window.__BW_GAME__`) and look at the screenshots.

## Origin

Synthesized from spike: 001.
Source files available in: `sources/001-cozy-art-pipeline/` (`index.html`, `_shot.mjs`, `_tileset_indexed.png`, `assets/`).
