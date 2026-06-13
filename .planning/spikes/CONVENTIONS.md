# Spike Conventions

Patterns and stack choices established across spike sessions. New spikes follow these unless the question requires otherwise.

## Stack

- **Engine:** Phaser 4.1.0 (UMD via jsdelivr CDN `dist/phaser.min.js` for standalone spikes; the real game bundles it via Vite). API for tilemaps / spritesheet anims / arcade physics is the pattern to mirror.
- **Serve:** `npx vite <spike-dir> --port <p> --strictPort` — reuses the project's installed Vite; no per-spike config. CDN `<script>` for Phaser means no bundling needed.
- **Render config:** `pixelArt: true, antialias: false, roundPixels: true`, `Scale.FIT` + `CENTER_BOTH` — matches the project's pixel-art mandate (see CLAUDE.md).

## Structure

- One folder per spike: `.planning/spikes/NNN-name/` with `index.html`, `assets/`, `README.md`.
- Scratch/evidence files prefixed `_` (e.g., `_shot_*.png`, `_tileset_indexed.png`, `_shot.mjs`).
- Default serve port: 5180.

## Patterns

- **Asset sourcing:** prefer CC0 packs fetchable without itch.io (itch returns 403 here) — GitHub raw and kenney.nl direct `.zip` both work. Confirm license in the pack's `License.txt`.
- **Tilemaps:** build from a 2D index array via `make.tilemap({ data, tileWidth:16, tileHeight:16 })` + `addTilesetImage(name, key, 16, 16, 0, 0)` + `createLayer`; `-1` = empty; two layers (ground + collidable deco). Mirrors the game's `level-01.ts` MAP_DATA.
- **Character anims:** load `this.load.spritesheet(key, png, { frameWidth, frameHeight })`; `generateFrameNumbers` per direction; idle = first frame of facing.
- **Index discovery:** upscale a packed tileset with System.Drawing (PowerShell) and stamp per-cell indices to map tiles reliably (`_tileset_indexed.png`).
- **Headless verification:** Playwright (installed) drives the page, simulates input, screenshots, and reports console errors — proves rendering, not just serving.

## Tools & Libraries

- **Phaser 4.1.0** — CDN UMD confirmed working (`phaser.umd.js` does NOT exist; use `phaser.min.js`).
- **Kenney Tiny Town** — CC0, 16×16, cozy-town environment tileset (no characters). Good default base for cozy overworlds.
- **PowerShell System.Drawing** — reliable on this Windows box for generating/upscaling pixel art (note: `New-Object Bitmap($a,$b)` — precompute `$a/$b`; `(128*8,16*8)` mis-parses via comma precedence).
- Avoid: ImageMagick (`convert` resolves to Windows' system tool, not IM); itch.io direct fetch (403).
