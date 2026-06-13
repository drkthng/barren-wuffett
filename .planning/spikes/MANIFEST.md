# Spike Manifest

## Idea

Upgrade Barren Wuffett's Level 1 from placeholder colored squares to a real cozy 16-bit pixel-art town (Zelda / Final Fantasy Mystic Quest-adjacent) **before** building the Phase 3 backend funnel. Explore how to source and wire cohesive game art with no art-dev experience and a €0 budget, and prove the asset pipeline (free pack → tileset → Phaser tilemap + animated character) end-to-end.

## Requirements

Design decisions that emerged during spiking. Non-negotiable for the real build (Phase 2.5 — Visual Pass).

- **Art look:** cozy 16-bit town (warm suburb, Stardew/Sprout-Lands-adjacent) — chosen by user.
- **License discipline:** prefer **CC0** assets (shippable, no attribution) given the €0 + legally-cautious constraint. Track license/provenance for anything shipped.
- **Cohesion first:** one consistent base pack drives the world; generated/AI assets must palette-match it. Mixing styles is what makes a game look janky.
- **No engine changes:** new art flows through the existing tilemap (`level-01.ts` MAP_DATA) + `Preloader.ts` spritesheet + ContentRegistry patterns. Art is additive, not a mechanics rewrite.
- **Pipeline = pack → tileset PNG → Phaser tilemap (2D index array) + `generateFrameNumbers` anims** (proven in spike 001).

## Spikes

| # | Name | Type | Validates | Verdict | Tags |
|---|------|------|-----------|---------|------|
| 001 | cozy-art-pipeline | standard | One CC0 pack → cozy Phaser town + 4-dir character; pipeline feasible <1h | ✓ VALIDATED | art, phaser, tilemap, pixel-art, cc0, kenney |
