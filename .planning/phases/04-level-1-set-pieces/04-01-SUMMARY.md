---
phase: 04-level-1-set-pieces
plan: 01
status: complete
commit: e4b8487
completed: 2026-08-05
requirements: [L1E-05]
---

# Summary 04-01 — Paper-route glow-up

**Delivered:** Full `PaperThrowScene` rebuild. Dawn-street backdrop (sky bands, rising sun, road with dashed center line), 5 procedurally generated characterful houses (`tools/gen-assets.mjs` `drawHouse` — distinct palettes, pitched/flat roofs, chimneys, mailboxes, porch awnings, flower boxes; standardized door position), a neighbor sprite that steps onto a porch, and real aiming: tap the house (or keys 1-5) to arc a spinning paper from Barren's corner. 10 papers for 8 deliveries — throws at empty doors are WASTED, so accuracy matters. PERFECT within 600ms.

Ends on an explicit results splash: DELIVERED n/8, ACCURACY %, PERFECT count, COINS (existing `computeMinigameReward` seam), animated letter grade S/A/B/C/D, blinking NEW BEST!, tap/Space to continue. `RouteScoring` pure seam owns the grade table + NEW BEST detection (unit-tested). Best-delivered persists via SaveState v2 `bestScores.paper_route` (v1 saves migrate; OverworldScene owns the field, passes it via launch data, records it from the extended MINIGAME_COMPLETE payload — `{score, perfect}` contract preserved). New SFX: throw whoosh, porch thunk, soft miss.

**Verification:** headless full run — 8/8 delivered on 9 throws (one deliberate waste), 89% accuracy → grade A (correctly not S), coins 34 = 8×2+6×3, NEW BEST shown, best persisted after return to the overworld. Zero console errors.
