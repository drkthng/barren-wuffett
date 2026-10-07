# Spike Conventions

Patterns and stack choices established across spike sessions. New spikes follow these unless the question requires otherwise.

## Stack

- **Action formats → Phaser 4.1.0** (UMD via jsdelivr CDN `dist/phaser.min.js`; the real game bundles it via Vite). API for tilemaps / spritesheet anims / arcade physics / particles / camera shake is the pattern to mirror. (001, 003a)
- **Text- and number-heavy formats → DOM + vanilla JS** (crisp text, native buttons/scroll, `navigator.share` needs a real button). (003b, 003c)
- **Title / end / modal screens → DOM overlays** above a Phaser canvas, for the same reasons. (003a)
- **Serve:** one server for all spikes, from the repo root: `npx vite .planning/spikes --port 5180 --strictPort --host`. Spikes import shared modules across folders (`../002-old-barren-cast/cast.js`) and a phone on the LAN opens the hub `http://<PC-LAN-IP>:5180/` (`.planning/spikes/index.html`). The current game build is served beside it for comparison: `npx vite preview --config vite/config.prod.mjs --port 8080 --strictPort --host`. (Per-folder `npx vite <spike-dir>` still works for a standalone spike.)
- **Render config (Phaser):** `pixelArt: true, antialias: false, roundPixels: true`, `Scale.FIT` + `CENTER_BOTH`; portrait height follows the screen aspect (`H = clamp(480 * innerHeight / innerWidth, 760, 1040)`) so phones aren't letterboxed.
- **Fonts:** "Press Start 2P" for titles and numbers, "Pixelify Sans" for body text (Google Fonts in spikes). In Phaser text: 16 px for anything read in motion (catch labels, ticker); 8 px only for static labels. `await document.fonts.load(...)` before booting Phaser.

## Structure

- One folder per spike: `.planning/spikes/NNN-name/` with `index.html`, module files, `README.md`.
- Evidence and tooling prefixed `_`: `_shot_*.png`, `_verify.cjs` (Playwright, phone viewport 412×915 @2×, `isMobile`/`hasTouch`), `_sim.mjs` (Node balance simulator) when there is an economy.
- Shared cast lives in `002-old-barren-cast/cast.js`; the hub lives at `.planning/spikes/index.html`.
- Wrapped findings live in the project skill `.claude/skills/spike-findings-barren-wuffett/` (wrap-up 2026-10-07: 001-003c). Read it before a new spike so validated questions aren't re-spiked.
- A comparison verdict that is decided by feel on the phone gets recorded in both the README frontmatter and the MANIFEST row once the user has played it. Don't leave it at PENDING.
- Ports: 5180 spikes, 8080 current game build.

## Patterns

- **Code-drawn pixel art:** a sprite is `{ w, h, rows: string[], pal }` (one char per pixel, `.` = transparent). Characters are composed with the `Px` vocabulary in `cast.js` (ellipse, rect, mirrored points, recolour-by-predicate, 4-neighbour auto-outline) so the whole cast shares proportions and outline weight; render with `renderCanvas()` / `dataURL()`, or `this.textures.addCanvas()` in Phaser. Portraits 32×32 shown at ≥3×; icons 12–16 px. An icon that doubles as a gauge must fill its full height.
- **Parody by traits, never likeness:** exaggerate signature traits (old Barren = white swept-back hair, oversized glasses, heavy grey brows, grin, suit + red tie, Cherry Fizz). Parody names and brands only (Ohama, Fizzcoin, Pear Phones).
- **Daily seed:** FNV-1a(`<game>:<YYYY-MM-DD>`) → mulberry32; `DAILY_NO` counts UTC days from 2026-10-01. Generate the whole schedule up front (frame-rate independent) and fingerprint it so determinism is testable.
- **Test hooks in every playable spike:** `?date=`, `?speed=`, `?bot=`; a `window.__X__` probe object; a forensic `LOG` (ISO timestamp + category) with an "export log" link on the end screen.
- **Balance by simulation before play:** pure model module + Node `_sim.mjs` running several policies (smart, casual/saver, random, one-note always-left/right). This caught a solved swipe deck, a broke-heavy deck, a float exploit and a myopic-optimiser artefact — none of which a unit test would find.
- **Share:** Web Share API on coarse pointers; on desktop copy to clipboard and open the X intent `https://x.com/intent/tweet?text=…&url=…`. Share text = game + daily number, result + rank, one emoji/milestone line, `made by @handle`; the URL is passed separately.
- **Credit and legal in every spike:** a `HANDLE = '@Wolfhartvest'` constant at the top (the user's real X handle, given 2026-10-07), "made by" on title and end screens, an About overlay with "parody · not affiliated · not investment advice" and the creator's website (compoundingknowledge.com, About only). No email capture, no portfolio links in-game.
- **Share text is built synchronously** and `navigator.share` is the first thing awaited in the tap handler; otherwise iOS drops the user gesture. (003a, 003b, 003c; same rule as the game's `ShareService.ts`.)
- **Asset sourcing (art packs):** prefer CC0 packs fetchable without itch.io (itch returns 403 here) — GitHub raw and kenney.nl direct `.zip` both work. Confirm license in the pack's `License.txt`.
- **Tilemaps:** build from a 2D index array via `make.tilemap({ data, tileWidth:16, tileHeight:16 })` + `addTilesetImage(name, key, 16, 16, 0, 0)` + `createLayer`; `-1` = empty; two layers (ground + collidable deco). Mirrors the game's `level-01.ts` MAP_DATA.
- **Headless verification:** Playwright drives the page on a phone viewport, simulates input (including drags), screenshots, and reports console errors — proves the experience, not just that it serves. Look at every screenshot.

## Tools & Libraries

- **Phaser 4.1.0** — CDN UMD confirmed working (`phaser.umd.js` does NOT exist; use `phaser.min.js`). `textures.addCanvas`, `ParticleEmitter.explode`, `TintModes` all present.
- **Kenney Tiny Town** — CC0, 16×16, cozy-town environment tileset (no characters).
- **Google Fonts** Press Start 2P + Pixelify Sans — fine for spikes; self-host for production (the game's CSP is `font-src 'self'`; only `press-start-2p-latin.woff2` is in `public/fonts/` today).
- **Porting a spike into the real build:** `import Phaser from 'phaser'` instead of the CDN global (`script-src 'self'`); wrap the top-level `await document.fonts.load(...)` in an async `main()` (Vite 6's default target rejects top-level await); route strings through `t(key)`.
- **PowerShell System.Drawing** — reliable on this Windows box for generating/upscaling pixel art (note: `New-Object Bitmap($a,$b)` — precompute `$a/$b`; `(128*8,16*8)` mis-parses via comma precedence).
- Avoid: ImageMagick (`convert` resolves to Windows' system tool, not IM); itch.io direct fetch (403); balancing an idle economy against a greedy spend-everything bot alone (it under-rates saving — calibrate against a "check the shop every few seconds" policy).
