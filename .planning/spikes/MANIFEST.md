# Spike Manifest

## Ideas

### cozy-visual-pass

Upgrade Barren Wuffett's Level 1 from placeholder colored squares to a real cozy 16-bit pixel-art town (Zelda / Final Fantasy Mystic Quest-adjacent) **before** building the Phase 3 backend funnel. Explore how to source and wire cohesive game art with no art-dev experience and a €0 budget, and prove the asset pipeline (free pack → tileset → Phaser tilemap + animated character) end-to-end.

**Requirements:**

Design decisions that emerged during spiking. Non-negotiable for the real build (Phase 2.5 — Visual Pass).

- **Art look:** cozy 16-bit town (warm suburb, Stardew/Sprout-Lands-adjacent) — chosen by user.
- **License discipline:** prefer **CC0** assets (shippable, no attribution) given the €0 + legally-cautious constraint. Track license/provenance for anything shipped.
- **Cohesion first:** one consistent base pack drives the world; generated/AI assets must palette-match it. Mixing styles is what makes a game look janky.
- **No engine changes:** new art flows through the existing tilemap (`level-01.ts` MAP_DATA) + `Preloader.ts` spritesheet + ContentRegistry patterns. Art is additive, not a mechanics rewrite.
- **Pipeline = pack → tileset PNG → Phaser tilemap (2D index array) + `generateFrameNumbers` anims** (proven in spike 001).

### replayable-barren-pivot

Pivot exploration after the 2026-10-06 assessment: the Zelda-light story adventure is play-once, content-heavy and weakly shareable, so find the short-session, replayable, share-native game format that makes a loving Buffett parody genuinely fun and grows the creator's X following. Three formats are spiked head-to-head on a phone — (A) a Mr. Market arcade, (B) a compounding idle game, (C) a Reigns-style swipe satire — against (D) the existing Level 1 adventure build as the baseline. All formats share one code-drawn pixel cast so the comparison is about format, not art.

**Requirements:**

- **Fun first.** Entertainment is the product; growing the creator's X following already counts as a win.
- **Credit, not funnel:** a visible "made by @handle" on title/end screens, the @handle in the share text, and the website in an About screen. The handle is the placeholder `@yourhandle` in one config constant until the user supplies it.
- **No email capture, no backend, no eToro / wikifolio / portfolio links inside the game.** Barren never endorses or points to anything (parody + endorsement is PITFALLS #4; UWG §5a(4) means subtle must not mean hidden).
- **The face is the iconic OLD Barren** — white swept-back hair, big thick glasses, suit, Cherry Fizz — with Charlie as sidekick and Mr. Market (greed ↔ panic) as the villain. Parody names only; no real names, likeness, voice or brand marks.
- **Mobile portrait first, static hosting only (€0).**
- **Compare by feel on a phone:** all spikes reachable from one LAN hub URL, with the current adventure build (D) linked as the baseline.

## Spikes

| # | Idea | Name | Type | Validates | Verdict | Tags |
|---|------|------|------|-----------|---------|------|
| 001 | cozy-visual-pass | cozy-art-pipeline | standard | One CC0 pack → cozy Phaser town + 4-dir character; pipeline feasible <1h | ✓ VALIDATED | art, phaser, tilemap, pixel-art, cc0, kenney |
| 002 | replayable-barren-pivot | old-barren-cast | standard | Code-drawn pixel cast (old Barren, Charlie, Mr. Market greed/panic, extras) reads as a loving parody at phone size, no likeness/brands | ✓ VALIDATED | art, pixel-art, characters, procedural, parody |
| 003a | replayable-barren-pivot | mr-market-arcade | comparison | 60 s one-thumb arcade: catch panic bargains / dodge greedy junk, compounding snowball, deterministic daily market, share line with @handle | ◆ PENDING (feel) | arcade, phaser, daily-seed, share, compounding |
| 003b | replayable-barren-pivot | snowball-idle | comparison | 5-minute compounding idle life (gum stand → empire), seeded Mr. Market offers, narrated by old Barren, share line with @handle | ◆ PENDING (feel) | idle, incremental, dom, compounding, daily-seed, share |
| 003c | replayable-barren-pivot | swipe-satire | comparison | Reigns-style swipe career as Barren: 33 joke cards, 4 two-sided meters, 9 collectible endings, share line with @handle | ◆ PENDING (feel) | swipe, reigns-like, dom, satire, endings, share |
