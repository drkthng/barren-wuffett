# Sketch Manifest

## Design Direction

Grow the spike phone hub (`.planning/spikes/index.html`, which the user played and loved on Android) into its polished, finished version. Don't start a new design. It should feel like a dark, cozy 16-bit menu: a gold Press Start kicker, Pixelify Sans body text and the code-drawn parody cast (old Barren, Charlie, Mr. Market) as the faces of the games. It should feel like a tiny arcade you drop into every day, never like an ad. The credit is visible but quiet. The X follow prompt appears only on locked cards and their sheet. The streak is a small pixel snowball that grows, the compounding metaphor made visible: a little reward, never a chore, and there's no guilt when it resets. Mobile portrait first, judged on the phone.

Locked by Phase 5 context (`05-CONTEXT.md` D-01..D-10, D-14), so sketches don't re-open them:
- stacked full-width cards in fixed release order: Arcade → Snowball → CEO → Adventure (early demo)
- a locked card is a named, dimmed teaser with a padlock and "coming soon · follow @Wolfhartvest", plus a bottom sheet on tap
- a daily strip under the title ("Daily #N", then the checklist once a daily is live, then the snowball after the first finished daily)
- a slim, dismissible install hint under the strip after streak day 2
- tagline: "Daily games about patience, compounding and a very moody Mr. Market."

Open for the sketches to decide: card treatment, palette, spacing, the snowball sprite and its size steps, blurb copy, and the bottom-sheet styling.

## Reference Points

- The spike phone hub: `.planning/spikes/index.html` (screenshot `.planning/spikes/_shot_hub.png`)
- The code-drawn cast: `.planning/spikes/002-old-barren-cast/cast.js`
- Wordle-style daily number plus a device-only streak, with Duolingo's guilt mechanics deliberately left out (`.planning/research/FEATURES.md` §Streak & Checklist UX Rules)
- SNES-era menu windows (the "pixel cabinet" variant)

## How to View

Serve `.planning/` over LAN so your phone can open the sketches (they import the spike cast, so file:// won't work):

```
npx vite .planning --port 5181 --strictPort --host
```

Then open `http://<PC-LAN-IP>:5181/sketches/001-hub-phone/` on your phone.

## Sketches

| # | Name | Design Question | Winner | Tags |
|---|------|----------------|--------|------|
| 001 | hub-phone | What should the finished hub look like on a phone, in each of its real states? | **C: Game colours** + cozy-dusk palette, NEW badge until first played | hub, layout, cards, palette, phase-5 |
| 002 | streak-snowball | How should the pixel snowball streak look and grow? | **A: Plain snowball**, steps 3·7·14·30, keep the old number after a miss | hub, streak, sprite, phase-5 |
