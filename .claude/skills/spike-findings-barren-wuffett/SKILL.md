---
name: spike-findings-barren-wuffett
description: Implementation blueprint from spike experiments. Requirements, proven patterns, and verified knowledge for building barren-wuffett — the Barren Wuffett mini-game hub (Mr. Market arcade, Snowball idle game, Barren-CEO swipe satire, the cozy adventure) with its code-drawn parody cast, daily seed, share flow and credit/legal shell. Auto-loaded during implementation work.
---

<context>
## Project: barren-wuffett

**cozy-visual-pass.** This idea upgraded Barren Wuffett's Level 1 from placeholder colored squares to a real cozy 16-bit pixel-art town (Zelda / Final Fantasy Mystic Quest-adjacent) **before** the Phase 3 backend funnel was built. It explored how to source and wire cohesive game art with no art-dev experience and a €0 budget, and proved the asset pipeline (free pack → tileset → Phaser tilemap + animated character) end-to-end. It has since shipped into the game.

**replayable-barren-pivot.** This is the pivot exploration after the 2026-10-06 assessment. The Zelda-light story adventure is play-once, content-heavy and weakly shareable, so the goal was a short-session, replayable, share-native format that makes a loving Buffett parody genuinely fun and grows the creator's X following. Three formats were spiked head-to-head on a phone against (D), the existing Level 1 adventure build, as the baseline: (A) a Mr. Market arcade, (B) a compounding idle game and (C) a Reigns-style swipe satire. All formats share one code-drawn pixel cast, so the comparison was about format, not art. **Outcome:** the user loved all four. The product becomes ONE mini-game hub site that launches A first, then B, then C, and keeps D.

Spike sessions wrapped: 2026-06-14 (001), 2026-10-06 to 2026-10-07 (002, 003a-c). Wrapped on 2026-10-07.
</context>

<requirements>
## Requirements

Non-negotiable design decisions from the user's choices while spiking. Every feature-area reference honours the ones for its idea.

### replayable-barren-pivot (the hub and its formats; this supersedes the old email/Supabase/Brevo funnel in PROJECT.md / ROADMAP.md)

- **Fun first.** Entertainment is the product; growing the creator's X following already counts as a win.
- **Credit, not funnel:** a visible "made by @handle" on title and end screens, the @handle in the share text, and the website in an About screen. The handle is **`@Wolfhartvest`**, kept in one config constant. The website, compoundingknowledge.com, appears in the About screen only.
- **No email capture, no backend, no eToro / wikifolio / portfolio links inside the game.** Barren never endorses or points to anything (parody + endorsement is PITFALLS #4; under UWG §5a(4), subtle must not mean hidden).
- **The face is the iconic OLD Barren:** white swept-back hair, big thick glasses, suit, Cherry Fizz. Charlie is the sidekick and Mr. Market (greed ↔ panic) is the villain. Parody names only; no real names, likeness, voice or brand marks.
- **Mobile portrait first, static hosting only (€0).**
- **Compare by feel on a phone:** all spikes reachable from one LAN hub URL, with the current adventure build (D) linked as the baseline.
- **One hub site, staggered releases.** Ship ONE Barren Wuffett mini-game hub site. Launch **A (arcade) first**, then add **B (idle)** and **C (swipe)** as each is polished. Each release is a new X post. **Keep the adventure (D)** in the hub.

### cozy-visual-pass (the adventure's art)

- **Art look:** a cozy 16-bit town (warm suburb, Stardew/Sprout-Lands-adjacent).
- **License discipline:** prefer **CC0** assets, and track license and provenance for anything shipped.
- **Cohesion first:** one consistent base pack drives the world, and generated or AI assets must palette-match it.
- **No engine changes:** art flows through the existing tilemap (`level-01.ts` MAP_DATA) + `Preloader.ts` spritesheet + ContentRegistry patterns.
- **Pipeline = pack → tileset PNG → Phaser tilemap (2D index array) + `generateFrameNumbers` anims.**
</requirements>

<findings_index>
## Feature Areas

| Area | Reference | Key Finding |
|------|-----------|-------------|
| Format shell (hub plumbing) | references/format-shell.md | One daily seed (FNV-1a → mulberry32, schedule precomputed + fingerprinted), one share flow (Web Share on touch → clipboard + X intent), one credit/About shell, test hooks + forensic log, and Node balance sims serve every format. Porting needs the real build's CSP: npm Phaser, self-hosted fonts, no top-level await. |
| Mr. Market arcade (release 1) | references/mr-market-arcade.md | 60 s drag-to-catch arcade game. Catches change the growth *rate* and the snowball compounds per game-second. Panic knives at 22 % + 1.2 s grace keep "buy the panic" the core moment. Real skill gradient: smart 15-20 %/yr vs idle/random 2-8 %. |
| Snowball idle (release 2) | references/snowball-idle.md | DOM incremental, age 6→90 in ~5 min. Every life gets the full seeded offer cast (crash first). Patience beats spending only once balance is calibrated to a "saver" human, not a greedy optimiser. |
| Barren, CEO swipe (release 3) | references/swipe-satire.md | Pointer-Events swipe over a pure deck, with four two-sided meters plus aging drift. Hints show *which* meters move, never the direction. Thoughtful players win ~48 % and random players die by ~51. Content (cards) is the release treadmill. |
| Pixel cast (all formats) | references/pixel-cast.md | `Px` grid vocabulary + auto-outline builds every character in code. The parody reads from traits (swept-back white hair, heavy grey brows over big glasses, grin). Moods are parameters + palette overrides. Show at ≥ 3×. |
| Adventure art pipeline (D) | references/adventure-art-pipeline.md | Kenney Tiny Town (CC0) → two index-array tilemap layers + 4-direction spritesheet anims, with auto-tiled dirt edges. Already shipped into the game. |

## Build order implied by the findings

1. The hub shell plus the shared modules (config, daily seed, share, overlays, cast) in the real Vite + TS build, honouring its CSP.
2. Port the arcade (Phaser scene + pure `buildMarket`), fix the OG/X share card, deploy, and post on X.
3. Port the idle game (DOM + pure `econ.js`), then the swipe game (DOM + pure `cards.js`), each with its sim and a headless phone check. Each is its own release and post.
4. Link the adventure from the hub, unchanged.

## Source Files

Original spike source files are preserved in `sources/` for complete reference. The relative imports still resolve: the formats import `../002-old-barren-cast/cast.js`, and `sources/hub-index.html` is the phone hub. The originals live in `.planning/spikes/`. Serve them with `npx vite .planning/spikes --port 5180 --strictPort --host`.
</findings_index>

<metadata>
## Processed Spikes

- 001-cozy-art-pipeline
- 002-old-barren-cast
- 003a-mr-market-arcade
- 003b-snowball-idle
- 003c-swipe-satire
</metadata>
