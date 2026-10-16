# Sketch Wrap-Up Summary

**Date:** 2026-10-16
**Sketches processed:** 2
**Design areas:** Hub layout & cards, Streak snowball
**Skill output:** `./.claude/skills/sketch-findings-barren-wuffett/`

## Included Sketches

| # | Name | Winner | Design Area |
|---|------|--------|-------------|
| 001 | hub-phone | C: Game colours + cozy-dusk palette, NEW badge until first played | Hub layout & cards |
| 002 | streak-snowball | A: Plain snowball, steps 3·7·14·30, keep the old number after a miss | Streak snowball |

## Excluded Sketches

| # | Name | Reason |
|---|------|--------|
| (none) | | |

## Design Direction

This is the spike phone hub, finished rather than redesigned. It's a dark, cozy 16-bit menu that you drop into daily, with the code-drawn parody cast as the faces of the games. The credit is quiet, the X follow prompt appears only on locked cards, and the streak is a small growing pixel snowball with no guilt mechanics.

## Key Decisions

- **Layout:** one 460 px column. Top to bottom: title, tagline, daily strip, install hint (from streak day 2, dismissed for good), stacked full-width cards in release order (Arcade → Snowball → CEO → Adventure), then the footer credit and legal links.
- **Cards:** 3× cast portraits on a 96 px stage tinted in the game's colour (arcade green, snowball ice, CEO amber, adventure grass). The ✓ badge and checklist square share that colour, and NEW shows until a game's first finish. A locked card is a dashed outline with a grey stage, a greyscale portrait and a padlock, and a tap opens a drag-to-dismiss bottom sheet with "OPEN X".
- **Palette:** cozy dusk (cocoa `#221a1d` / `#31252a`, cream `#f7ecd8`, gold `#ffc95e`, ice `#bfe3f2`). It replaces the spike plum.
- **Typography:** Press Start 2P for labels and numbers, Pixelify Sans for reading text (blurb 15 px, title 19 px). Both are self-hosted in production.
- **Spacing and shape:** a 12 px card gap, 16 px gutters, radii of 18 (strip, hint), 20 (cards) and 24 (sheet), and ≥ 44 px tap targets.
- **Streak:** a plain shaded snowball in a 16×16 cell at 3×, with diameters 6/8/10/12/14 at days 3·7·14·30. A new size squash-pops with eight sparks, the same size gets a small roll, and the number pops either way. There's no snowball before the first finished daily. After a miss, the old number stays until the next finished daily restarts it at 1, with no message.
- **Copy:** the tagline, the four card kickers and blurbs, the hint, the sheet and the tooltip copy were all approved as shown in the sketch.
