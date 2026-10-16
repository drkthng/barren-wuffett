---
sketch: 002
name: streak-snowball
question: "How should the pixel snowball streak look and grow?"
winner: "A"
milestones: [3, 7, 14, 30]
after_miss: "keep the old number until the next finished daily"
tags: [hub, streak, sprite, phase-5]
---

# Sketch 002: Streak Snowball

## Design Question

D-07 makes the streak symbol a code-drawn pixel snowball that grows a size step at milestone days (proposed: 3, 7, 30). It is the compounding metaphor made visible: a small reward, never a chore. This sketch decides **what the snowball looks like**, **which days it grows on**, and **what the strip shows after a missed day**, where the streak silently restarts at 1 and no loss is ever mentioned. Everything is shown inside the winning strip from sketch 001 (variant C, cozy dusk) at real size.

## How to View

```
npx vite .planning --port 5181 --strictPort --host
```

Phone: `http://192.168.2.208:5181/sketches/002-streak-snowball/` (same Wi-Fi).

The variant tabs jump to each style. The **Streak** slider scrubs the sizes. **▶ Finish a daily** plays the growth moment: a pop with pixel sparks when the snowball reaches a new size, otherwise a small roll. **Miss a day** shows the silent reset. The **steps** dropdown changes the milestone days. In ⚙ you can switch palette, viewport and strip scale (2× / 3×). Tap a ladder rung to jump to that day, or tap the snowball for its tooltip.

## Variants

- **A: Plain snowball.** A shaded ball that just grows, 6 → 14 px (18 → 42 px in the strip at 3×). The quietest option.
- **B: Picks things up.** The same ball, collecting a twig after the first milestone, a gold coin halfway and a Cherry Fizz can at the last. Each milestone adds something to spot.
- **C: On the long hill.** The ball sits on a snowy slope with a track behind it that grows longer each step: "a long hill" made visible. It is wider (34 px), so the strip's hero box widens.

All three are drawn in `_lib/hubsprites.js` with the same grid + auto-outline vocabulary as `cast.js`, ready to port to `src/shared/cast.ts`.

## Decision (2026-10-08)

- **Winner: A, Plain snowball.** A shaded ball, light from the top left, with a 1-px auto-outline, bottom-aligned in a 16×16 cell and shown at 3× in the strip's hero box.
- **Size steps: 3 · 7 · 14 · 30.** Five sizes with diameters 6 / 8 / 10 / 12 / 14 px (`diam(step, 4)` in `_lib/hubsprites.js`), so the 7 → 30 stretch gets a growth at two weeks.
- **Growth moment:** a squash-pop with eight pixel sparks when it reaches a new size, a small roll otherwise, and the number pops each time.
- **After a miss: keep the old number** until the next finished daily, which restarts it at 1. This matches FEATURES.md rule 4 (reset on the next completion, no loss message, no freeze).
- B and C stay in the file for reference.

## What to Look For

- Does it read as a **snowball** (not a pearl, moon or egg) at day 1, where it's at its smallest?
- The growth moment: does reaching day 3/7/30 feel like a little reward? Is the pop too much or too little?
- B's pickups: charming, or clutter at 3×?
- C's hill: does the wider hero box crowd the strip next to "DAILY #N"?
- Steps: 3·7·30 (proposed) vs. 3·7·14·30 vs. 2·5·10·30 vs. 7·30·100. How long is the gap between 7 and 30 without a size change?
- After a miss: **hide the snowball** until the next finished daily (a fresh "1" appears), or **keep the old number** until then (then it drops to 1)? Hiding never shows a loss; keeping shows the drop.
