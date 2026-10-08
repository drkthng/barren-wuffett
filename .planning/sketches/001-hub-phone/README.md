---
sketch: 001
name: hub-phone
question: "What should the finished hub look like on a phone, in each of its real states?"
winner: "C"
palette: cozy-dusk
new_badge: "keep until first played"
tags: [hub, layout, cards, palette, phase-5]
---

# Sketch 001: Hub on the Phone

## Design Question

This is Phase 5's D-05 phone mockup. The layout is already locked: stacked full-width cards in a fixed order, a named and dimmed teaser for locked games, a daily strip that fills in, the install hint under the strip, and a bottom sheet on a locked tap. The sketch decides what was left open: the **card treatment**, the **palette** and the **spacing**, and whether the strip and badges read right across the hub's real states. The answer feeds `/gsd-ui-phase 5` (UI-SPEC) before `/gsd-plan-phase 5`.

## How to View

The sketch imports the real spike cast (`../../spikes/002-old-barren-cast/cast.js`), so serve `.planning/` over LAN:

```
npx vite .planning --port 5181 --strictPort --host
```

Phone: `http://192.168.2.208:5181/sketches/001-hub-phone/`. Your PC's LAN IP may differ (check with `ipconfig`).

The URL hash keeps your place, e.g. `#b/6/navy` = variant B, state 6, navy palette. Tap ▴ to hide the sketch bar for a clean view. ⚙ (bottom right) holds palette, viewport, install-hint platform and annotate mode.

## Variants

- **A: Spike, polished.** The spike hub you liked, finished: flat rounded plum cards, 2× portraits, pill badges (✓ done today, best), a padlock on the greyed portrait, and the strip as one rounded row. This is the least effort to build.
- **B: Pixel cabinet.** SNES-menu windows: square bevelled cards with a 5 px drop that presses down 4 px, the portrait inside an inset scanline "screen", the kicker as a gold cartridge label, Press Start badges, and the strip as a white-bordered RPG window with DAILY / TODAY / STREAK cells. A locked card's screen goes dark, with a big padlock.
- **C: Game colours.** Bigger 3× portraits on a stage tinted in each game's colour (arcade green, snowball ice, CEO amber, adventure grass). ✓ badges and checklist squares share that colour, the snowball streak is the strip's hero, and locked cards are dashed outlines with a grey stage.

All three share the same content, states, bottom sheet, install hint and About overlay. Only the treatment differs.

## States (the chips under the variant tabs)

1. **P5 preview**: no daily is live, the strip shows "Daily #1" only, and the adventure is the only live card.
2. **Launch day**: arcade live and NEW, checklist 0/1, no snowball yet (a newcomer never sees "streak 0").
3. **Arcade done**: ✓ + best on the arcade card, the snowball appears at size 1.
4. **Day 3 + hint**: the snowball grows a step, and the install hint appears (try HOW? and ✕; switch the platform in ⚙).
5. **Day 12, none yet**: the snowball game just went live, 0/2 today, and the streak still shows 11 from yesterday.
6. **Day 41, all live**: 2/3 done, streak 30 after an earlier silent reset.

## Palettes (⚙ → Palette)

- **Spike plum** (default): the spike hub's exact colours.
- **Navy**: a cooler boardroom at night.
- **Cozy dusk**: warm cocoa and cream, echoing the adventure's cozy town.

## Decision (2026-10-08)

- **Winner: C, Game colours.** 3× portraits on a stage tinted in each game's colour; ✓ badges and checklist squares use the game colour; the snowball streak is the strip's hero; locked cards are dashed outlines with a grey stage and a greyscale portrait.
- **Palette: cozy dusk** (`themes/cozy-dusk.css`): warm cocoa surfaces, cream text, warmer gold, echoing the adventure's cozy town. This replaces the spike plum as the hub's starting palette.
- **NEW badge: keep.** A freshly released card shows NEW until that game is finished once, then never again.
- Chosen on the phone over LAN. A and B stay in the file for reference.

## What to Look For

- Does the hub still feel like the spike page you loved, only finished? Or does B or C feel more like a real game?
- Locked cards: dimmed enough to read as "not yet", but still a teaser you'd want? Is the "coming soon · follow @Wolfhartvest" line quiet enough not to feel like an ad?
- The strip: does "0/2 today" (state 5) read as a friendly nudge or a nag?
- The bottom sheet: does it feel native to your thumb? You can drag it down to dismiss.
- The install hint: slim enough? Does it get in the way of the cards?
- Readability at phone size: kicker 11 px Press Start, blurb 15 px Pixelify, B's 10 px Press Start badges.
- The snowball here is a placeholder (a plain ball). Sketch 002 designs the real one.
- A "NEW" badge on a freshly released card (states 2 and 5) is not in the Phase 5 decisions. Keep it or drop it?
