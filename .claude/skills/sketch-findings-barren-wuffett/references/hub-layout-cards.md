# Hub Layout & Cards

The finished phone hub: the spike hub (`.planning/spikes/index.html`) grown into its polished version, never a new design. Phase 5 context (`05-CONTEXT.md` D-01..D-10, D-14) locked the structure. Sketch 001 decided the treatment: **variant C, "Game colours"**, on the **cozy-dusk** palette. It was judged on the phone over LAN on 2026-10-08.

## Design Decisions

### Locked structure (Phase 5, not re-opened by the sketch)

- Top to bottom: the title, the tagline, the **daily strip**, the **install hint** (when due), the **cards**, then the footer.
- Stacked full-width cards in a fixed release order: **Arcade → Snowball → CEO → Adventure (early demo)**.
- A locked card is a named, dimmed teaser with a padlock and "coming soon · follow @Wolfhartvest". Tapping it opens a **bottom sheet**.
- The daily strip fills in over time. It starts as "Daily #N" only, gains the checklist once a daily is live, and gains the snowball after the first finished daily.
- A slim install hint sits under the strip from the hub visit **after streak day 2**. Dismissing it removes it for good.
- The tagline reads: **"Daily games about patience, compounding and a very moody Mr. Market."**

### Chosen treatment: C, Game colours

- **Each game owns a colour.** It sets the card's `--accent` and tints the portrait stage, the ✓ badge, the checklist square and the sheet header:

  | Game | Token | cozy-dusk | Portrait (cast key) | Kicker |
  |------|-------|-----------|---------------------|--------|
  | Arcade | `--game-arcade` | `#6fbf4a` | `marketGreed` | `ARCADE · 60 S` |
  | Snowball | `--game-snowball` | `#a8dcf0` | `barren` | `IDLE · 5 MIN` |
  | CEO | `--game-ceo` | `#e0874a` | `charlie` | `SWIPE · 2–4 MIN` |
  | Adventure | `--game-adventure` | `#b5d86a` | `barrenIdle` | `ADVENTURE · EARLY DEMO` |

- **Portraits are 3×** (32×32 cast sprites → 96×96) on a rounded stage tinted with the game colour, with a darker 16 px floor band. The portrait stands on the floor (`place-items: end center`).
- **The snowball streak is the strip's main element.** It sits in an ice-tinted box on the strip's left, shown at 3× with the number in Press Start. The sprite itself is specified in `streak-snowball.md`.
- **A locked card is a dashed outline**: a transparent background, a 2 px dashed `--color-border` and `--accent: var(--color-locked)`. Its stage turns grey and its portrait goes greyscale (`brightness(.55)`, `opacity .7`). The title and blurb drop to 60 % opacity, and a padlock sprite (2×) sits in the stage's top-right corner.
- **Badges are pills.** `NEW` is gold Press Start 9 px. `done today` uses the game colour with dark text and no check sprite. The best score sits on a quiet `--color-surface-2` pill. The locked line is plain muted text.
- **The NEW badge stays** on a freshly released card until that game has been finished once, then never shows again. This one was added by the sketch; Phase 5 had not decided it.
- **There is never a "streak 0".** A newcomer sees no snowball at all until their first finished daily.

### Palette: cozy dusk

Warm cocoa surfaces, cream text and a warmer gold echo the adventure's cozy town. **This replaces the spike plum** as the hub's starting palette. The full token set is `sources/themes/cozy-dusk.css`:

| Token | Value | Use |
|-------|-------|-----|
| `--color-bg` | `#221a1d` | page |
| `--color-surface` | `#31252a` | cards, strip, hint, sheet, panel |
| `--color-surface-2` | `#3e2f33` | quiet pills, tint base for stages |
| `--color-inset` | `#181215` | wells |
| `--color-border` | `#4d3b3f` | locked card dashes |
| `--color-text` | `#f7ecd8` | cream |
| `--color-text-soft` | `#dccbb7` | blurbs, checklist label |
| `--color-text-muted` | `#b8a596` | tagline, footer, locked line |
| `--color-primary` | `#ffc95e` | gold: title, kicker, DAILY #N, NEW, primary button |
| `--color-primary-hover` | `#ffdb8a` | |
| `--color-accent` | `#bfe3f2` | ice, used to tint the streak box |
| `--color-success` | `#8fcf6a` | |
| `--color-locked` | `#7a6862` | locked accent |
| `--color-scrim` | `rgba(18,12,14,.68)` | behind the sheet and About |

### Typography and spacing

- **Fonts:** Press Start 2P (`--font-pixel`) for the title, kickers, DAILY #N, the streak number, NEW and buttons. Pixelify Sans 400/600 (`--font-sans`) for everything else. The sketches load both from Google Fonts. **Production must self-host them** because of the real build's CSP (see `spike-findings-barren-wuffett` → `format-shell.md`).
- **Sizes:** title 16 px pixel; kicker 11 px pixel (`--text-xs`); card title 19 px / 600 (`--text-lg`); blurb 15 px (`--text-base`); tagline 16 px; badge 13.5 px; DAILY #N 12 px pixel; streak number 16 px pixel; footer 14 px.
- **Layout:** the hub column is `max-width: 460px`, with 16 px side padding and a bottom padding of `28px + env(safe-area-inset-bottom)`. Cards are spaced 12 px apart and the strip has 12 px below it.
- **Radii:** strip and hint 18, cards 20, portrait stage 14, sheet top corners 24, About panel 22, primary button 14.
- **Tap targets:** the hint's ✕ and HOW? are ≥ 44 px. Footer links get 12 px of vertical padding.

### Card and blurb copy (approved in the sketch)

- **Arcade, "Barren vs. Mr. Market":** "Catch the bargains when Mr. Market panics, dodge his greedy junk. Same market for everyone today."
- **Snowball, "Barren's Snowball":** "Gum stand to empire by age 90. Buy businesses, reinvest, and keep your nerve when Mr. Market makes offers."
- **CEO, "Barren, CEO":** "Swipe yes or no on everyone's asks. Keep four meters out of the extremes. Nine endings to find."
- **Adventure, "The Value Investing Adventure":** "Young Barren's paper route in a cozy town, with Mr. Market as the boss. Level 1 of a bigger story."
- **Best badges:** `best 14.2 %/yr` (arcade), `best $84M at 90` (snowball), `5/9 endings` (CEO: no "best" prefix).
- **Install hint:** "Keep your bests and endings safe: **add Barren to your Home Screen**", with `HOW?` on iOS (it expands two steps: "Tap ⬆ Share in Safari's toolbar" and "Choose **Add to Home Screen**") or `ADD` on Android (it fires the browser's own install prompt).
- **Locked sheet:** the kicker and title, then "Coming soon. Follow **@Wolfhartvest** on X to hear when it drops.", then `OPEN X` (primary) and `CLOSE` (ghost).
- **Streak tooltip** (tap the streak box): "N days in a row with a finished daily".
- **Footer:** "made by @Wolfhartvest · about", then "Impressum · Privacy". **About:** a cast row (charlie, barren, marketGreed at 2×), the parody and no-advice line, "Made by @Wolfhartvest", and compoundingknowledge.com (it appears **only** here).

Per the project convention, route all of this copy through the `t(key)` string table.

### The hub's real states (use these as test fixtures)

| # | State | Strip | Cards |
|---|-------|-------|-------|
| 1 | P5 preview | `DAILY #1` only (solo strip, no checklist) | only the adventure is live |
| 2 | Launch day | checklist 0/1, no snowball | arcade live + NEW |
| 3 | Arcade done | snowball appears (size 1), 1/1 | arcade ✓ + best (NEW is gone) |
| 4 | Day 3 + hint | snowball grows a step | install hint shows |
| 5 | Day 12, none yet | 0/2 today, the streak still shows 11 | snowball game live + NEW |
| 6 | Day 41, all live | 2/3, streak 30 after an earlier silent reset | three ✓/best rows |

## CSS Patterns

The game colour is a per-element custom property, and everything tints from it with `color-mix`:

```css
/* the card sets --accent inline: style="--accent: var(--game-arcade)" (locked → var(--color-locked)) */
.card { display: flex; gap: 12px; align-items: center; background: var(--color-surface);
        border-radius: 20px; padding: 10px 12px 10px 10px; border: 2px solid transparent;
        user-select: none; transition: transform .12s ease, border-color .15s ease, background .15s ease; }
.card.pressed { border-color: var(--accent); transform: scale(.985); }       /* added on tap, removed after 140 ms */
@media (hover: hover) { .card:hover { border-color: color-mix(in srgb, var(--accent) 45%, transparent); } }

.art { position: relative; flex: none; display: grid; place-items: end center;
       width: 96px; height: 96px; border-radius: 14px; overflow: hidden;
       background: color-mix(in srgb, var(--accent) 28%, var(--color-surface-2)); }
.art::before { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 16px;   /* floor band */
               background: color-mix(in srgb, var(--accent) 50%, var(--color-surface-2)); }
.art img.portrait { position: relative; }
img.px { image-rendering: pixelated; display: block; }

.card.locked { background: transparent; border: 2px dashed var(--color-border); --accent: var(--color-locked); }
.card.locked .art img.portrait { filter: grayscale(1) brightness(.55); opacity: .7; }
.card.locked .t, .card.locked .d { opacity: .6; }
.lockpin { position: absolute; top: 6px; right: 6px; z-index: 2; }

.badge { display: inline-flex; align-items: center; gap: 5px; font-size: 13.5px; line-height: 1; padding: 4px 8px;
         border-radius: 9999px; background: var(--color-surface-2); color: var(--color-text-soft); }
.badge.done { background: var(--accent); color: #15121c; font-weight: 600; }
.badge.new  { background: var(--color-primary); color: #15121c; font-family: var(--font-pixel); font-size: 9px; padding: 5px 7px; }
.badge.lock { background: transparent; padding-left: 0; color: var(--color-text-muted); }
```

The strip, with the snowball box on the left:

```css
.strip { display: flex; align-items: center; gap: 12px; background: var(--color-surface);
         border-radius: 18px; padding: 10px 14px 10px 10px; min-height: 56px; margin-bottom: 12px; }
.strip.solo { padding-left: 14px; }                                   /* no streak yet */
.hero { display: flex; align-items: flex-end; gap: 2px; padding: 4px 10px 4px 6px; border-radius: 14px;
        background: color-mix(in srgb, var(--color-accent) 16%, var(--color-surface-2)); }
.hero .n { font-family: var(--font-pixel); font-size: 16px; margin-bottom: 4px; }
.strip-main { display: flex; flex-direction: column; gap: 6px; }
.daily { font-family: var(--font-pixel); font-size: 12px; color: var(--color-primary); }
.check { display: inline-flex; align-items: center; gap: 8px; font-size: 15px; color: var(--color-text-soft); }
.box { width: 11px; height: 11px; border: 2px solid color-mix(in srgb, var(--accent) 70%, var(--color-text-muted)); border-radius: 3px; }
.box.on { background: var(--accent); border-color: var(--accent); }   /* each box sets its game's --accent */
```

The bottom sheet slides up, has a tinted header band, and can be dragged down to dismiss:

```css
.scrim { position: fixed; inset: 0; z-index: 50; background: var(--color-scrim); opacity: 0; pointer-events: none; transition: opacity .2s ease; }
.scrim.show { opacity: 1; pointer-events: auto; }
.sheet { position: fixed; left: 0; right: 0; bottom: 0; z-index: 51; margin: 0 auto; max-width: 460px;
         transform: translateY(105%); visibility: hidden; touch-action: none; overflow: hidden;
         transition: transform .26s cubic-bezier(.2,.8,.2,1), visibility 0s linear .26s;
         padding: 10px 18px calc(18px + env(safe-area-inset-bottom));
         background: var(--color-surface); border-radius: 24px 24px 0 0; box-shadow: var(--shadow-lg); }
.sheet.show { transform: translateY(0); visibility: visible; transition: transform .26s cubic-bezier(.2,.8,.2,1); }
.sheet.dragging { transition: none; }
.sheet::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 64px; z-index: -1;
                 background: color-mix(in srgb, var(--accent) 22%, transparent); }
.sheet .grab { width: 44px; height: 5px; border-radius: 3px; background: var(--color-text-muted); opacity: .5; margin: 2px auto 12px; }
.btn { display: block; width: 100%; font-family: var(--font-pixel); font-size: 13px; padding: 14px 10px; border: 0; margin-top: 10px; }
.btn.primary { background: var(--color-primary); color: #1d1a27; border-radius: 14px;
               box-shadow: 0 4px 0 color-mix(in srgb, var(--color-primary) 55%, #000); }
.btn.primary:active { transform: translateY(3px); box-shadow: 0 1px 0 color-mix(in srgb, var(--color-primary) 55%, #000); }
.btn.ghost { background: transparent; color: var(--color-text-muted); }
```

Dismissing the install hint collapses it in place, then removes it from the DOM:

```css
.hint { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; padding: 6px 4px 6px 12px; margin-bottom: 12px;
        background: var(--color-surface); border-radius: 18px; overflow: hidden; max-height: 220px;
        transition: opacity .2s ease, transform .2s ease, max-height .25s ease, margin .25s ease, padding .25s ease; }
.hint.gone { opacity: 0; transform: translateY(-6px); max-height: 0; margin: 0; padding-top: 0; padding-bottom: 0; }
```

Newly revealed strip parts get a light `fadein` (`.25s`, 4 px rise) so the strip "fills in" rather than snapping.

## HTML Structures

```html
<main class="hub">
  <h1 class="hub-title">BARREN WUFFETT</h1>
  <p class="tagline">Daily games about patience, compounding and a very moody Mr. Market.</p>

  <section class="strip">                      <!-- add .solo when there is no streak yet -->
    <div class="hero streak" data-tip="11 days in a row with a finished daily">
      <img class="px" width="48" height="48" src="…snowball 3×…"><span class="n">11</span>
    </div>
    <div class="strip-main">
      <span class="daily">DAILY #12</span>
      <span class="check"><span class="boxes">
        <span class="box" style="--accent:var(--game-arcade)"></span>
        <span class="box" style="--accent:var(--game-snowball)"></span>
      </span>0/2 today</span>                   <!-- omitted until a daily is live -->
    </div>
  </section>

  <aside class="hint">…msg… <button class="how">HOW?</button> <button class="x" aria-label="Dismiss">✕</button><ol class="steps">…</ol></aside>

  <nav class="cards">
    <a class="card" data-id="arcade" style="--accent:var(--game-arcade)" role="button" tabindex="0">
      <div class="art"><img class="px portrait" width="96" height="96" src="…"></div>
      <div class="body">
        <div class="k">ARCADE · 60 S</div>
        <div class="t">Barren vs. Mr. Market</div>
        <div class="d">…blurb…</div>
        <div class="badges"><span class="badge new">NEW</span><span class="badge done">done today</span><span class="badge">best 14.2 %/yr</span></div>
      </div>
    </a>
    <a class="card locked" data-id="ceo" style="--accent:var(--color-locked)" role="button" tabindex="0">
      <div class="art"><img class="px portrait" …><img class="px lockpin" width="20" height="24" …></div>
      <div class="body">… <div class="badges"><span class="badge lock">coming soon · follow @Wolfhartvest</span></div></div>
    </a>
  </nav>

  <footer class="foot">
    <div class="credit">made by <span class="handle">@Wolfhartvest</span> · <a>about</a></div>
    <div class="legal"><a href="/impressum">Impressum</a> · <a href="/datenschutz">Privacy</a></div>
  </footer>
</main>

<div class="scrim"></div>
<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">  <!-- sets --accent per game -->
  <div class="grab"></div>
  <div class="top"><div class="art">…2× portrait…</div><div><div class="s-k">…</div><div class="s-t" id="sheet-title">…</div></div></div>
  <p class="s-msg">Coming soon. Follow <b>@Wolfhartvest</b> on X to hear when it drops.</p>
  <button class="btn primary">OPEN X</button>
  <button class="btn ghost">CLOSE</button>
</div>
```

**Interaction rules:**

- A card tap adds `.pressed` for 140 ms. A live card navigates to its path. A locked card opens the sheet after 120 ms.
- The sheet closes on a scrim tap, CLOSE, Escape, or a downward pointer-drag of more than 70 px. A shorter drag snaps back. Pointer capture runs on the sheet, and buttons are excluded from the drag.
- `OPEN X` opens `x.com/Wolfhartvest` in a new tab, with the handle taken from the config constant.
- Tapping the streak box shows a speech bubble tooltip for 2.4 s, anchored left.

## What to Avoid

- **Variant A, "Spike, polished"** (not chosen): flat rounded plum cards, 2× portraits on no stage, a padlock pinned bottom-right, and the strip as one rounded row with the streak pushed right.
- **Variant B, "Pixel cabinet"** (not chosen): SNES-menu bevelled square cards with a 5 px drop that press down 4 px, an inset scanline "screen" behind the portrait, a gold cartridge-label kicker, 10 px Press Start badges, and an RPG-window strip with DAILY / TODAY / STREAK cells.
- **The spike plum (`default.css`) and navy palettes** (not chosen). Don't carry the spike's plum values into the hub.
- **Hover styles without `@media (hover: hover)`.** Phones keep a sticky `:hover` after a tap.
- **A "streak 0" or any loss or guilt copy.** A newcomer sees no snowball, and a reset is silent.
- **The X follow prompt anywhere but locked cards and their sheet.** The credit stays quiet in the footer, and compoundingknowledge.com appears only in About.
- **The 3 · 7 · 30 milestones in sketch 001's code.** Sketch 002 replaced them with **3 · 7 · 14 · 30**.

## Origin

Synthesized from sketch: 001 (hub-phone), winner C plus the cozy-dusk palette, decided 2026-10-08.
Source files: `sources/001-hub-phone/index.html` (all three variants; C is marked ★), `sources/themes/cozy-dusk.css`, `sources/_lib/hubsprites.js` (padlock, check).
