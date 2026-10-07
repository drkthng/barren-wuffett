# Pixel Cast: code-drawn old Barren, Charlie, Mr. Market and extras

Every character is built in code from simple shapes on a small grid, then given a 1-px outline automatically. There is no external art, so there is no licence risk and no likeness: the parody comes from exaggerated signature traits, never from a real face. One file (`cast.js`) feeds every format, as Phaser textures or as `<img>` data URLs.

## Requirements

From idea `replayable-barren-pivot`:

- **The face is the iconic OLD Barren**: white swept-back hair, big thick glasses, suit, Cherry Fizz. Charlie is the sidekick, and Mr. Market (greed ↔ panic) is the villain.
- **Parody names only; no real names, likeness, voice or brand marks.** Cherry Fizz is a red can with a cherry emblem and no logo.
- €0: CC0 or self-made art only.
- Mobile portrait first: everything must read at phone size.
- One hub site, where every format and the hub shares this one cast.

## How to Build It

### The sprite format

```js
// one char per pixel, '.' = transparent; pal maps chars → colours
{ w: 32, h: 32, rows: ['....KKKK....', …], pal: { K: '#1c1824', S: '#efb592', … } }
```

One shared palette (`BASE`) uses mnemonic chars: `K` outline · `S s d p q` skin / shade / deep / cheek / shine · `H h g` hair light / mid / dark · `B b` brows · `F f L l` frames / frame highlight / lens / glint · `E M T o` eye / mouth / teeth / tongue · `J j W w` jacket / shirt · `R r` tie · `Y y` gold · `G n` green · `U u` sweat. A character overrides only the chars it recolours, e.g. Charlie's navy suit and blue tie.

### The drawing vocabulary (`Px` class)

```js
const p = new Px(32, 32);
p.set(x, y, c); p.sym(x, y, c);            // sym = also mirror across the vertical centre (cols 15|16)
p.rect(x0, y0, x1, y1, c); p.symRect(…);
p.pts([[x, y], …], c); p.symPts(…);
p.ellipse(cx, cy, rx, ry, c, keep);        // keep(x, y, existing) limits the fill (e.g. y <= 4 for a crest)
p.shade(from, to, pred);                   // recolour existing pixels where pred(x, y)
p.outline('K');                            // 4-neighbour 1-px outline around the silhouette, call LAST
const sprite = (px, pal = {}) => ({ w: px.w, h: px.h, rows: px.rows(), pal: { ...BASE, ...pal } });
```

Portraits are assembled from shared parts in a fixed order, so the whole cast shares proportions and outline weight:

```js
function barren({ eyes: e = 'happy', mouth: m = 'grin' } = {}) {
    const p = new Px(32, 32);
    body(p); neck(p); head(p); wrinkles(p);
    hairBarren(p); browsBarren(p);
    glassesBig(p); eyes(p, e);
    nose(p); mouth(p, m);
    return sprite(p.outline());
}
```

**Moods are parameters plus palette overrides.** `mrMarket('greed' | 'panic' | 'neutral')` shares one function. Greed gets `$` eyes, flushed skin and a green tie and hat band. Panic gets pale blue-grey skin, wide white eyes with pin pupils, sweat and tears, and an open mouth. Neutral gets heavy-lidded sly eyes and a gold band. Every Mr. Market has a bowler hat and a handlebar moustache.

### The cast that exists (`SPRITES`)

| Key | Size | Notes |
|---|---|---|
| `barren`, `barrenSmile`, `barrenWorried` | 32×32 | grin / calm / uh-oh |
| `charlie` | 32×32 | bald dome with shine, low white fringe, round frames, stern, flat mouth |
| `marketNeutral`, `marketGreed`, `marketPanic` | 32×32 | the villain's three moods |
| `cryptoBro`, `banker`, `reporter` | 32×32 | hoodie + gold chain + backwards cap + shades · pinstripes + side part · bob + microphone |
| `barrenIdle`, `barrenWalkA`, `barrenWalkB`, `barrenOops` | 20×28 | full-body arcade Barren; oops = arms up |
| `cherryFizz` | 10×14 | red can, white band, cherries, no brand |

Item sprites for a format live next to it in the same format (`003a/items.js`: bill, shop, bubble, rocket, Fizzcoin, knife, Charlie "NO." bubble, hearts; `003b/icons.js`: business icons; `003c/micons.js`: meter icons).

### Rendering

```js
// Phaser: register once, then scale the image
this.textures.addCanvas(key, renderCanvas(spr, 1));
this.add.image(x, y, 'marketGreed').setScale(5);
// DOM: a data URL at the display scale
img.src = dataURL(SPRITES.barren, 4);      // CSS: image-rendering: pixelated
```

`renderCanvas` paints one `fillRect` per pixel. Unknown palette chars render magenta (`#ff00ff`), so a typo is obvious.

## What to Avoid

- **Uniform white hair with rectangular side blocks.** It reads as a white *helmet*. Draw combed-back strands as offset mid-tone pixels per row and a tufty side silhouette that thins toward the ears.
- **White brows.** They vanish into the hair. Heavy **grey brows, darker than the hair**, over big glasses are the strongest "it's him" signal.
- **A red mouth line.** It reads as lipstick. Use a dark mouth line with teeth and smile creases for the grin.
- **A big hair mass on the small arcade body.** It swamps the face. Shrink the crest so the glasses dominate.
- **Symmetric dot eyes on a neutral face.** They looked cross-eyed, so use lidded eyes glancing to one side.
- **Unpaired features.** The mirror axis sits between columns 15|16, so place features as mirrored pairs with the `sym*` helpers or the face goes lopsided.
- **AI pixel tools prompted with the real person's name.** That is a likeness risk. PixelLab stays a production option only with trait-based prompts.
- LPC character packs (CC-BY-SA / GPL share-alike, and a clashing look) and generic CC0 packs (nothing reads as "old man, big glasses, suit").

## Constraints

- Portraits are 32×32 and must be shown at **≥ 3×** (the formats use 4-6×). At 1× only the silhouette survives.
- The mouth colour `M` is shared, so a mouth tweak changes everyone. That is fine, since it improved all of them.
- The auto-outline gives every sprite the same 1-px dark outline as the Kenney Tiny Town art (see `adventure-art-pipeline.md`), so the cast can share a screen with the adventure's tiles.
- A new mood or extra costs a parameter or about 20 lines.
- **Open taste check:** "does it read as Barren to you?" rode on the phone checkpoint, which the user passed on 2026-10-06 (they loved all four directions).

## Origin

Synthesized from spike: 002.
Source files available in: `sources/002-old-barren-cast/` (`cast.js`, a gallery `index.html`, `_shot.cjs`).
