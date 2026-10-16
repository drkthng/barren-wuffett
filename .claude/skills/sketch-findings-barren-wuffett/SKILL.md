---
name: sketch-findings-barren-wuffett
description: Validated design decisions, CSS patterns, and visual direction from sketch experiments. Auto-loaded during UI implementation on barren-wuffett — the finished phone hub (game-colour cards on cozy-dusk, daily strip, locked-card bottom sheet, install hint) and the pixel snowball streak (sprite, size steps 3·7·14·30, growth moment, silent reset).
---

<context>
## Project: barren-wuffett

Grow the spike phone hub (`.planning/spikes/index.html`, which the user played and loved on Android) into its polished, finished version. Don't start a new design. It should feel like a dark, cozy 16-bit menu: a gold Press Start kicker, Pixelify Sans body text and the code-drawn parody cast (old Barren, Charlie, Mr. Market) as the faces of the games. It should feel like a tiny arcade you drop into every day, never like an ad. The credit is visible but quiet. The X follow prompt appears only on locked cards and their sheet. The streak is a small pixel snowball that grows, the compounding metaphor made visible: a little reward, never a chore, and there's no guilt when it resets. Mobile portrait first, judged on the phone.

**Reference points:** the spike phone hub (`.planning/spikes/index.html`); the code-drawn cast (`.planning/spikes/002-old-barren-cast/cast.js`, also in `spike-findings-barren-wuffett`); a Wordle-style daily number plus a device-only streak, with Duolingo's guilt mechanics deliberately left out (`.planning/research/FEATURES.md` §Streak & Checklist UX Rules); and SNES-era menu windows (tried as variant B, not chosen).

The structure is locked by Phase 5 context (`05-CONTEXT.md` D-01..D-10, D-14). The sketches decided the treatment, palette, spacing, snowball sprite and steps, blurb copy and bottom-sheet styling.

Sketch sessions wrapped: 2026-10-08 (001, 002). Wrapped on 2026-10-16.
</context>

<design_direction>
## Overall Direction

- **Palette: cozy dusk.** Warm cocoa surfaces (`#221a1d` bg, `#31252a` surface), cream text (`#f7ecd8`), warm gold (`#ffc95e`) for the title, kickers, DAILY #N, NEW and the primary button, and ice (`#bfe3f2`) behind the streak. It replaces the spike plum.
- **Game colours.** Every game owns an accent (arcade `#6fbf4a`, snowball `#a8dcf0`, CEO `#e0874a`, adventure `#b5d86a`), set as `--accent` on the element and mixed into stages, ✓ badges, checklist squares and the sheet header via `color-mix`.
- **Type:** Press Start 2P for the labels and numbers, Pixelify Sans for reading text (blurb 15 px, card title 19 px/600). Self-host both in production because of the CSP.
- **Layout:** one 460 px column, stacked full-width cards (radius 20) with 3× cast portraits on a tinted 96 px stage, a rounded strip (radius 18) with the snowball box on its left, and a bottom sheet (radius 24) for locked cards.
- **Locked state:** a dashed outline, a grey stage, a greyscale portrait and a padlock. It's a teaser, not a wall.
- **The streak:** a plain shaded pixel snowball, 6 → 14 px through steps at days 3·7·14·30. It squash-pops with sparks on each new size. A miss is silent: the old number stays until the next finished daily restarts it at 1.
- **Interaction feel:** a 140 ms press state, hover only on `(hover: hover)`, a drag-to-dismiss sheet, ≥ 44 px tap targets, a soft `fadein` as the strip fills in, and no streak 0 and no loss copy anywhere.
</design_direction>

<findings_index>
## Design Areas

| Area | Reference | Key Decision |
|------|-----------|--------------|
| Hub layout & cards | references/hub-layout-cards.md | Variant C "Game colours" on cozy dusk: 3× portraits on game-tinted stages, game-coloured ✓ and checklist, dashed locked cards with a sheet, NEW until first played, approved card and hint copy, 6 hub states as fixtures |
| Streak snowball | references/streak-snowball.md | Plain snowball (16×16 cell, 3×), diameters 6/8/10/12/14 at days 3·7·14·30, grow/nudge/appear + number pop, keep the old number after a miss until the next finished daily |

## Theme

The winning theme file is `sources/themes/cozy-dusk.css`. `default.css` (spike plum) and `navy.css` are kept only so the sketches' palette switcher works. Neither was chosen.

## Source Files

The original sketch HTML is preserved in `sources/` for complete reference: `001-hub-phone/index.html` (variants A/B/C, C marked ★), `002-streak-snowball/index.html` (styles A/B/C, A marked ★) and `_lib/hubsprites.js` (snowball, padlock and check sprites). The sketches import the spike cast via `../../spikes/002-old-barren-cast/cast.js`, which doesn't resolve from this folder. To view them live, serve the originals instead: `npx vite .planning --port 5181 --strictPort --host`, then open `/sketches/001-hub-phone/`.

Related: `spike-findings-barren-wuffett` holds the hub plumbing (daily seed, share flow, credit/About shell, CSP notes) and the pixel cast these designs sit on.
</findings_index>

<metadata>
## Processed Sketches

- 001-hub-phone
- 002-streak-snowball
</metadata>
