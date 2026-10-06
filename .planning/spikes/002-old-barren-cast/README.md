---
spike: 002
idea: replayable-barren-pivot
name: old-barren-cast
type: standard
validates: "Given the parody-only / €0 rules, when old Barren, Charlie and Mr. Market (greed + panic) are drawn as code-defined pixel art, then at phone size they read as a loving parody without a real likeness or brand"
verdict: VALIDATED
related: [001]
tags: [art, pixel-art, characters, procedural, parody, mobile]
---

# Spike 002: Old-Barren Cast

## What This Validates

**Given** the project's parody-only and €0 rules (no real names, likeness, voice or brand marks; CC0 or self-made art),
**when** the core cast — the iconic old Barren, Charlie, Mr. Market in three moods — plus three extras are drawn as code-defined pixel art,
**then** at phone size they read as a loving parody (white swept-back hair + big glasses + grin + suit = "that's obviously him") without copying a real face, and the art is cheap enough to vary per format.

Every format spike (003a/b/c) imports this cast, so the format comparison is about format, not art.

## Research

| Approach | Tool | Pros | Cons | Status |
|---|---|---|---|---|
| **Code-drawn shapes on a grid + auto-outline** | plain JS (`cast.js`) | zero licence risk; one style/outline weight for the whole cast; variants (moods, extras) cost minutes; editable by AI; no build step | quality depends on iteration | **CHOSEN** |
| CC0 character packs | Kenney | consistent, free | nothing reads as "old man, big glasses, suit"; generic | rejected |
| LPC character generator | OpenGameArt | flexible parts (old man, glasses, suit) | CC-BY-SA / GPL attribution + share-alike; LPC look clashes with the Kenney look of spike 001 | rejected |
| AI pixel tools | PixelLab | fast, varied | likeness risk if prompted with the real person; account limits; licence review | keep as a production option, never with real-name prompts |

**Chosen approach:** a tiny drawing vocabulary (`Px` class: ellipse, rect, mirrored points, recolour-by-predicate, 4-neighbour auto-outline) builds each 32×32 portrait from parts — body, neck, head, hair, brows, glasses, eyes, nose, mouth — so characters share proportions and the outline is always consistent. Moods are parameters (`mrMarket('greed' | 'panic' | 'neutral')`) plus palette overrides (flushed skin + green tie for greed, pale blue-grey for panic).

## How to Run

```bash
# from repo root — serves ALL spikes so format spikes can import ../002-old-barren-cast/cast.js
npx vite .planning/spikes --port 5180 --strictPort --host
# open http://localhost:5180/002-old-barren-cast/
node .planning/spikes/002-old-barren-cast/_shot.cjs   # headless render → _shot_gallery.png + console errors
```

## What to Expect

A gallery: a phone-width preview (greedy Mr. Market looming over walking arcade-Barren and a Cherry Fizz can, plus a Charlie dialogue card), then every sprite at 5–6× on light, 2× and 1× on dark.

- **Portraits (32×32):** Barren grin / calm / uh-oh, Charlie, Mr. Market neutral / GREED ($-eyes, flushed, green tie) / PANIC (pale, wide eyes, sweat, open mouth), crypto bro, banker, reporter.
- **Arcade Barren (20×28):** idle, walk A, walk B, oops (arms up).
- **Cherry Fizz can (10×14):** red can + cherry emblem, no brand marks.

## Investigation Trail

1. **First pass** (all parts, auto-outline): extras (crypto bro, banker, reporter) and Mr. Market's moods read immediately. Barren read as "old man with glasses", but:
   - hair looked like a **white helmet** (uniform colour, rectangular side blocks);
   - **white brows** vanished into the hair;
   - the red mouth line read as **lipstick**, not a grin;
   - arcade-Barren's hair mass swamped the face; Mr. Market's neutral eyes looked **cross-eyed**.
2. **Second pass:** combed-back strands as offset `h` pixels per row + a tufty, thinning side silhouette (helmet gone); grey brows darker than the hair with stray hairs (the heavy-brow-over-big-glasses look is the strongest "it's him" signal); dark mouth line + teeth + creases for the grin; smaller arcade crest so the glasses dominate; lidded sly eyes for neutral Mr. Market.
3. **Phone-size check:** at 4–6× (the sizes the formats use) everything is legible; at 1× only the silhouette survives, which is expected — no format renders portraits at 1×.

## Results

**VALIDATED** (technical + readability; the "does it read as Barren to you?" taste check rides on the final phone checkpoint).

- The parody reads from **four exaggerated traits** — white swept-back hair, thick oversized glasses, heavy grey brows, big grin — plus suit and red tie. No real face is traced; nothing is a brand mark.
- **Variants are cheap:** a new mood or character is a parameter or ~20 lines. Mr. Market's three moods share one function; palette overrides carry most of the mood.
- **Auto-outline** gives every sprite the same 1-px dark outline as the Kenney art from spike 001, so the cast can share a screen with the existing tileset.
- **Gotchas:** the mouth colour is shared (`M`), so a mouth tweak changes everyone (fine — it improved all of them); the mirror axis sits between columns 15|16, so features must be placed as mirrored pairs (`sym*` helpers); keep portraits at ≥3× on screen.

Evidence: `_shot_gallery.png`.
