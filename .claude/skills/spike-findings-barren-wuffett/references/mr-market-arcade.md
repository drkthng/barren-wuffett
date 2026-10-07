# Mr. Market Arcade ("Barren Wuffett vs. Mr. Market"): the first release

A one-thumb, 60-second arcade game. Mr. Market's mood swings between GREED and PANIC, and he throws things. The player drags Barren, and the snowball he pushes, to catch bargains and dodge junk. Each catch changes the snowball's growth *rate*, and the snowball compounds every game-second ("year"), so early good catches are worth the most. **This format won the comparison and launches first.**

## Requirements

From idea `replayable-barren-pivot`:

- Fun first; growing the X following counts as a win.
- Credit, not funnel: "made by @Wolfhartvest" on title + end, the handle in the share text, website only in About.
- No email, no backend, no eToro / wikifolio / portfolio links in the game. Barren never endorses anything.
- The iconic OLD Barren + Charlie + Mr. Market (greed ↔ panic). Parody names only.
- Mobile portrait first, static hosting (€0).
- One hub site. **The arcade launches first**, then idle, then swipe. The adventure stays.

## How to Build It

### Scene and layout

- Phaser 4.1.0: `pixelArt: true, antialias: false, roundPixels: true`, `Scale.FIT` + `CENTER_BOTH`, with one scene.
- Width is fixed at `W = 480`, and **height follows the phone's aspect** so portrait phones aren't letterboxed:
  `H = Math.round(Math.min(1040, Math.max(760, (W * innerHeight) / Math.max(1, innerWidth))))`. `GROUND_Y = H - 48`.
- Layer the screen from top to bottom: a HUD band (0-92: SNOWBALL value, %/YR rate, YEAR n/60, `DAILY #N`, 3 hearts, shield/fizz icons); Mr. Market at (240, 182) at 5× scale; a GREED|PANIC meter with a knob at y 288; a headline ticker at y 318; a skyline; and the street with Barren and the snowball.
- Register textures from the code-drawn cast: `this.textures.addCanvas(key, renderCanvas(spr, 1))` for every `SPRITES` and `ITEMS` entry, then `setScale(3)` on items and `setScale(5)` on Mr. Market (see `pixel-cast.md`).
- Input: drag anywhere. `pointerdown`/`pointermove` set `targetX`, and Barren moves toward it at `MOVE_SPEED = 620` px/s in real time. Arrow keys move ±60 on desktop.

### The daily market (pure, precomputed)

`buildMarket(dateStr)` returns `{ mood(t), events, spawns, fingerprint }` from `mulberry32(hashStr('barren-market:' + date))`:

```js
const period = 6.5 + rnd() * 2.5, phase = rnd() * Math.PI * 2;
const k = 0.3 / YEARS;                                   // swings get 30 % faster over a career
const mood = (t) => {
    const cyc = -Math.log(1 - k * t) / (period * k);     // INTEGRATED frequency: no phase jump on speed-up
    let m = 0.8 * Math.sin(2 * Math.PI * cyc + phase) + 0.2 * Math.sin(2 * Math.PI * cyc * 2.7 + 2 * phase);
    // inside a seeded event window, blend toward +1 (crash) or −1 (bubble) with a sine envelope
    return clamp(m, -1, 1);
};
const stateOf = (m) => (m >= 0.35 ? 'panic' : m <= -0.35 ? 'greed' : 'neutral');
```

- Events: 2 crashes + 1 bubble, one in each window `[10,20] [27,38] [44,54]`, in a seeded order. Each lasts 4-6 s and shows a CRASH!/BUBBLE! banner + a camera shake.
- Spawns: walk `t` from 1.4 to 59.4. The item type is a weighted pick by mood state. Speed is `(150 + 120·prog)` ×1.2 in panic and ×0.92 in greed. The gap is `(0.8 − 0.36·prog)` ×1.25 in neutral and ×0.7 inside an event. Each spawn stores `{t, type, speed, x0, x}` (throw origin near Mr. Market, landing x anywhere in 40-440).

### The tuned numbers (from two balance passes)

| Knob | Value |
|---|---|
| Career | `YEARS = 60` (60 s of game time) · start $10,000 at **5 %/yr** · rate clamp −8 %…+35 % |
| Catches (rate Δ, value ×) | bill +0.6 %, ×1.01 · shop +1.5 %, ×1.03 · bubble −1.0 %, ×0.92 · rocket −1.5 %, ×0.88 · Fizzcoin −1.0 %, ×0.90 · knife −0.5 %, ×0.90 and −1 heart |
| Weights: panic | bill 44 · shop 18 · **knife 22** · fizz 8 · charlie 8 |
| Weights: greed | bubble 26 · rocket 18 · coin 18 · bill 18 · shop 5 · fizz 7 · charlie 8 |
| Weights: neutral | bill 30 · shop 8 · bubble 14 · coin 12 · rocket 8 · knife 8 · fizz 8 · charlie 8 |
| Hearts | 3. Three knives = **SHAKEN OUT** (compounding stops; the remaining decades are flat) |
| Knife grace | `KNIFE_IFRAMES = 1.2` game-s; later knives fall *past* a blinking Barren |
| Power-ups | Cherry Fizz = 4 s at half game speed · Charlie = blocks the next bad catch (`CHARLIE: "NO."`) |
| Ranks (rounded CAGR) | ≥20 % THE ORACLE OF OHAMA · ≥15 % VALUE INVESTOR · ≥10 % SOLID COMPOUNDER · ≥6 % INDEX HUGGER · ≥2 % DAY TRADER · else BAGHOLDER |
| Decade squares | 6 squares of 10-year CAGR: 🟩 ≥12 % · 🟨 ≥6 % · 🟥 below |

Compounding each frame: `R.V *= Math.pow(1 + R.r, dt)`, where `dt` is game time (`× TEST_SPEED`, ×0.5 in slow-mo). **Rank uses the rounded rate the player sees**: `Math.round(cagr * 1000) / 1000`.

### Juice that mattered

- Snowball radius: `clamp(16 + 9·log10(V / 10 000), 14, 74)`. It is drawn with Graphics and its dimples rotate with the distance rolled. Barren steps aside to push it once it outgrows him: `barrenX = px − max(0, radius − 30)·0.95`.
- Catches pop a 16 px label + 8 px sub-label (`BOUGHT THE TOP` / `−1.0%/YR`) that float up and fade. Good catches burst sparks, bad ones shake the camera, and knives shake harder and swap Barren to his "oops" frame.
- The mood drives everything at once: Mr. Market's texture (greed/panic/neutral), a squash on each throw, a jitter in panic, a sky lerp (blue → vivid gold in greed, → plum in panic, with `pow(m, 0.6)` easing), the meter knob and the ticker headlines ("SELL EVERYTHING", "MY BARBER BOUGHT ROCKETS").
- Sound comes from a tiny WebAudio square/saw/triangle blip synth. It needs no assets; call `audio().resume()` on the PLAY tap.

### End and share

End screen: `BARREN RETIRES` or `SHAKEN OUT IN YEAR N!`, Barren beside a CSS snowball sized by log-value, the value, the %/yr + rank, the decade squares and the stats line. Share text:

```
Barren Wuffett vs. Mr. Market · Daily #6 📈
Snowball $540M · 19.9%/yr · VALUE INVESTOR
🟨🟨🟩🟩🟩🟩
47 bargains · 2 bubbles · 2 🔪
made by @Wolfhartvest
```

### Autopilot (for checks)

`?bot=1` predicts each falling item's landing x at the catch line. It chases the nearest reachable good item that has no bad item within ~0.4 s / radius+30 px, then side-steps any bad item heading for it. `?bot=idle` stands still, and `?bot=random` wanders.

## What to Avoid

- **Too many knives in panic.** At 34 % of panic throws, the smart bot was shaken out in 2 of 3 runs, so "buy the panic" (the core joke) turned into knife-dodging. 22 % plus the 1.2 s grace fixed it.
- **A starting rate that can't clear the first decade square.** At 4 % the first square was always 🟥. Start at 5 %.
- **8 px text for anything read in motion** (catch labels, ticker). It is unreadable on a phone, so use 16 px. 8 px is fine only for static labels.
- **A greed sky lerped straight to gold.** It goes muddy grey-green halfway. Ease it with `pow(m, 0.6)` toward a vivid `0xffc94d`.
- **How-to sentences as bare text nodes in a flex row.** They break into columns, so wrap each in a `<span>`.
- **An end screen with only the snowball.** It looked lonely; put Barren beside it.

## Constraints

- Measured skill gradient (3 markets × 3 bots, second pass): smart 15.0-19.9 %/yr ($43M-$540M), never shaken out · idle 1.7-8.5 % · random 2.5-7.8 %. That is ~100-10,000× in value between strategies, so scores mean something, and ORACLE sits just above a scripted bot.
- Determinism: one date gave fingerprint `e758782c` (103 throws) twice, and the next date gave `cff61bbe` (96 throws).
- Phaser is ~1.3 MB minified (`phaser.min.js`). It is already a dependency of the real game (and a separate `phaser` chunk in `vite/config.prod.mjs`).
- **Open feel questions (never answered, so watch them in playtests):** is 60 s the right length; is reading item *types* fun or busy; does the snowball-behind-Barren read; do the jokes land without the how-to?
- The real game already has a pure, unit-tested `src/systems/MoodPendulum.ts` (a sinusoidal greed/panic seam with a threshold, from the Phase 4 boss). The arcade's `mood(t)` is a different, seeded, event-blended curve, so reuse the *type* (`'greed' | 'neutral' | 'panic'`), not the class.

## Origin

Synthesized from spike: 003a.
Source files available in: `sources/003a-mr-market-arcade/` (`game.js`, `items.js`, `index.html`, `_verify.cjs`). It imports `../002-old-barren-cast/cast.js`.
