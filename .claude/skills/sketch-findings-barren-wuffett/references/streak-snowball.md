# Streak Snowball

The streak symbol is a code-drawn pixel snowball that grows a size step at milestone days. It is the compounding metaphor made visible: a small reward, never a chore, with no guilt when it resets (Phase 5 D-07; `.planning/research/FEATURES.md` §Streak & Checklist UX Rules). Sketch 002 decided its look, its growth steps and its after-miss behaviour, all inside the winning strip from sketch 001 at real size. Decided on the phone on 2026-10-08.

## Design Decisions

- **Winner: A, Plain snowball.** It is a shaded ball that just grows, lit from the top left, with a 1-px auto-outline (`K` `#1c1824`, the same outline as the cast). It is bottom-aligned in a **16×16 cell** and shown at **3×** (48×48 img) in the strip's ice-tinted box.
- **Size steps at days 3 · 7 · 14 · 30.** There are five sizes, with ball diameters of **6 / 8 / 10 / 12 / 14 px** (18 → 42 px on screen at 3×). The two-week step means the 7 → 30 stretch still gets one growth.

  | Streak days | Step | Diameter |
  |-------------|------|----------|
  | 1–2 | 0 | 6 px |
  | 3–6 | 1 | 8 px |
  | 7–13 | 2 | 10 px |
  | 14–29 | 3 | 12 px |
  | 30+ | 4 | 14 px (full size) |

- **The growth moment** plays when a daily is finished and the hub is shown:
  - **Reaching a new size:** a squash-pop (`grow`, .55 s) with **eight pixel sparks** flying out.
  - **The same size:** a small roll (`nudge`, .4 s, slides in from the left).
  - **The first appearance** (a streak of 1 after none): `appear`, a scale-up from 0.2 that overshoots to 1.12.
  - **Every time**, the number pops (`numpop`: scale 1.4 and a flash of gold).
- **After a miss, keep the old number** until the next finished daily, which restarts it at 1. There is no loss message and no streak freeze. This matches FEATURES.md rule 4 (reset on the next completion).
- **No snowball before the first finished daily.** The strip goes `.solo`, so a "streak 0" never shows.
- **It must read as snow**, not a pearl, moon or egg, even at 6 px. That's why it gets the lower-right shade crescent, the deep-shade rim and the packed-snow specks from 8 px up.

## Sprite Recipe

These are drawn with the cast's `Px` grid vocabulary (`sources/_lib/hubsprites.js`), so they're ready to port into `src/shared/cast.ts` next to the cast. The palette:

| Char | Colour | Role |
|------|--------|------|
| `K` | `#1c1824` | outline |
| `X` | `#ffffff` | highlight |
| `W` | `#eef3fa` | snow body |
| `w` | `#c9d6e8` | shade, packed-snow specks |
| `u` | `#8fa6c6` | deep shade (rim) |

```js
/** Size step for a streak length: how many milestones have been reached. 0..milestones.length */
export function stepFor(days, milestones = [3, 7, 14, 30]) {
  let s = 0;
  for (const m of milestones) if (days >= m) s++;
  return s;
}

/** Diameter for step 0..total: 6 px at the start, 14 px at the last milestone. total = 4 → 6/8/10/12/14 */
const diam = (step, total = 4) => Math.round(6 + 8 * Math.min(step, total) / total);

/** Shaded snow ball of diameter d, bottom-aligned at `baseline` (exclusive), centred on cx */
function ball(p, cx, baseline, d) {
  const r = d / 2, cy = baseline - r;
  p.ellipse(cx, cy, r, r, 'W');
  // light from the top left: shade the lower-right crescent, deep shade on the very rim
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
    if (p.get(x, y) !== 'W') continue;
    const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r;
    const lit = -dx * 0.6 - dy * 0.8;                     // dot with the light direction
    if (lit < -0.55) p.set(x, y, 'u');
    else if (lit < -0.12) p.set(x, y, 'w');
  }
  const hx = Math.round(cx - r * 0.45), hy = Math.round(cy - r * 0.45);   // highlight grows with size
  p.set(hx, hy, 'X');
  if (d >= 8) p.set(hx + 1, hy, 'X');
  if (d >= 11) { p.set(hx, hy + 1, 'X'); p.set(hx + 2, hy, 'X'); }
  // packed-snow specks so it reads as snow, not a pearl
  if (d >= 8) p.pts([[Math.round(cx + r * 0.2), Math.round(cy + r * 0.1)]], 'w');
  if (d >= 11) p.pts([[Math.round(cx - r * 0.3), Math.round(cy + r * 0.35)], [Math.round(cx + r * 0.45), Math.round(cy - r * 0.25)]], 'w');
}

export function snowPlain(step, total = 4) {
  const p = new Px(16, 16);
  ball(p, 8, 15, diam(step, total));
  return sprite(p.outline());                              // 1-px K outline around everything
}
```

`hubsprites.js` keeps a hard-coded `[6, 8, 11, 14]` branch for `total === 3`. With the chosen four milestones, only the formula path applies. Drop that branch when porting.

The hub also uses two more sprites from the same file: `padlock()` (10×12, steel shackle and gold body, shown at 2× on locked cards) and `check()` (9×8, green).

## CSS Patterns

```css
.hero img { transform-origin: 50% 100%; }   /* grow from the ground, not the centre */

@keyframes grow   { 0% { transform: scale(.55); } 55% { transform: scale(1.22, 1.1); } 78% { transform: scale(.95, 1.04); } 100% { transform: none; } }
@keyframes nudge  { 0% { transform: translateX(-6px); } 55% { transform: translateX(2px); } 100% { transform: none; } }
@keyframes appear { 0% { transform: scale(.2); opacity: 0; } 70% { transform: scale(1.12); opacity: 1; } 100% { transform: none; } }
@keyframes numpop { 0% { transform: scale(1); } 40% { transform: scale(1.4); color: var(--color-primary); } 100% { transform: scale(1); } }
@keyframes spark  { from { transform: translate(0, 0); opacity: 1; } to { transform: translate(var(--dx), var(--dy)); opacity: 0; } }

.a-grow   { animation: grow .55s cubic-bezier(.2,.8,.2,1); }
.a-nudge  { animation: nudge .4s ease-out; }
.a-appear { animation: appear .45s ease-out; }
.a-num    { animation: numpop .45s ease-out; display: inline-block; }
.spark { position: absolute; width: 4px; height: 4px; background: #fff; box-shadow: 0 0 0 1px #1c1824;
         animation: spark .6s ease-out forwards; pointer-events: none; }
```

## Behaviour

```js
// After a finished daily: pick the animation by what changed
const kind = wasHidden ? 'appear' : stepFor(after) > stepFor(before) ? 'grow' : 'nudge';
img.classList.add({ grow: 'a-grow', appear: 'a-appear', nudge: 'a-nudge' }[kind]);
numberEl.classList.add('a-num');
if (kind === 'grow') sparks(hero, img);

// Eight sparks from the ball's centre (55 % down), snapped to even pixels, biased slightly upward
function sparks(hero, img) {
  const hb = hero.getBoundingClientRect(), ib = img.getBoundingClientRect();
  const cx = ib.left - hb.left + ib.width / 2, cy = ib.top - hb.top + ib.height * 0.55;
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8 + Math.random() * 0.4, r = 22 + Math.random() * 12;
    const s = document.createElement('span');
    s.className = 'spark';
    s.style.left = cx - 2 + 'px'; s.style.top = cy - 2 + 'px';
    s.style.setProperty('--dx', Math.round(Math.cos(a) * r / 2) * 2 + 'px');
    s.style.setProperty('--dy', Math.round(Math.sin(a) * r / 2) * 2 - 6 + 'px');
    hero.appendChild(s);                     // the hero box needs position: relative
    setTimeout(() => s.remove(), 650);
  }
}
```

**The streak's state machine (device-only).** It stores `streak` and the last finished daily number.

- **Finishing today's daily:** if the last finished daily was yesterday's, the streak goes up by one. If a day was missed, it restarts at 1, silently. If nothing was ever finished, it starts at 1 and plays `appear`.
- **Opening the hub after a miss:** the strip still shows the old streak and the old size, with no message and no greying out. The drop to 1 only appears with the next finished daily.
- **Streak 0** (never finished one): the snowball is hidden and the strip is `.solo`.

## What to Avoid

- **B, "Picks things up"** (not chosen): the same ball, collecting a twig after the first milestone, a gold coin halfway and a Cherry Fizz can at the last.
- **C, "On the long hill"** (not chosen): the ball on a snowy slope with a track that grows behind it. It is 34 px wide, which widens the strip's snowball box.
- **The other step ladders** (not chosen): 3·7·30 (the 7 → 30 gap has no growth), 2·5·10·30 and 7·30·100.
- **Hiding the snowball after a miss** (not chosen): the strip would drop the snowball until the next finished daily.
- **Loss mechanics of any kind:** a "you lost your streak" message, a freeze or repair offer, a countdown, or a nagging reminder. Duolingo's guilt mechanics are deliberately out.
- **Smoothing at scale.** Render with `image-rendering: pixelated` at integer scales (3× in the strip, 6× for any large view). Never scale by a fraction.

## Origin

Synthesized from sketch: 002 (streak-snowball), winner A, steps 3·7·14·30, keep the old number after a miss, decided 2026-10-08.
Source files: `sources/002-streak-snowball/index.html` (all three styles, with the growth-moment controls), `sources/_lib/hubsprites.js` (`snowPlain`, `stepFor`, `padlock`, `check`).
