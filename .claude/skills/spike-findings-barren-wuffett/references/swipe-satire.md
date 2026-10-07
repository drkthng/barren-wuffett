# Barren, CEO: the Reigns-style swipe satire (third release)

The player runs Ohama Holdings as Barren from age 30 to 96 by swiping left or right on whoever is asking: Charlie, Mr. Market in three moods, the crypto bro, the banker, the reporter. Four meters must stay out of both extremes. Nine endings collect across careers. A run is 2-4 minutes, and the jokes carry it.

## Requirements

From idea `replayable-barren-pivot`:

- Fun first; growing the X following counts as a win.
- Credit, not funnel: "made by @Wolfhartvest" on title + end, the handle in the share text, website only in About.
- No email, no backend, no eToro / wikifolio / portfolio links in the game. Barren never endorses anything. **No card gives investment advice.** Every ask is a parody situation.
- The iconic OLD Barren + Charlie + Mr. Market (greed / panic / neutral). Parody names only (Ohama, Fizzcoin, Pear Phones).
- Mobile portrait first, static hosting (€0).
- One hub site. **The swipe game is the third release.** The adventure stays.

## How to Build It

### Stack: DOM + Pointer Events + CSS transforms

No gesture library and no Phaser. Pointer Events give native 60 fps drag in a tiny amount of code, and buttons + arrow keys come free for accessibility. The column is `max-width: 460px`, padded by `env(safe-area-inset-bottom)`.

### The deck is data (`cards.js`, pure, also run by Node)

```js
export const METERS = [ {id:'cash'}, {id:'holders'}, {id:'calm' /* PATIENCE */}, {id:'fizz' /* CHERRY FIZZ */} ];
export const START_AGE = 30, END_AGE = 96, YEARS_PER_CARD = 2;
export const FX_SCALE = 1.3;                        // swing size
export const DRIFT = { calm: 1, fizz: -2 };         // every card: a bit more patient, more tired

// a card:
{ id: 'bank-loan', who: 'banker', name: 'The Banker', text: 'Take this cheap loan! Leverage makes your winners bigger!', once: true,
  left:  { label: 'No debt', fx: { calm: 8, holders: -6 } },
  right: { label: 'Borrow',  fx: { cash: 22, calm: -10 }, then: 'bank-margin' } }   // queues a follow-up
```

- `who` is a portrait key from the shared cast. Each speaker gets a card colour (panic plum, greed gold, Charlie navy, crypto-bro purple, banker dark blue, reporter red).
- 33 cards: 30 regular + 3 follow-ups (`followUp: true`, reached only via `then`): Fizzcoin "buy the dip?", the banker's MARGIN CALL, and the mill losing money "twenty years in a row".
- **Some "yes" options must *earn* cash** (a TV deal, selling the brick company at a crazy price, raising candy prices again), or saying yes always means going broke.

### The engine

```js
export function nextCard(run, rnd) {
    const due = run.queue.find(q => q.at <= run.choices);           // follow-up lands 2 cards later
    if (due) { run.queue = run.queue.filter(q => q !== due); return CARDS.find(c => c.id === due.id); }
    const recent = new Set(run.seen.slice(-10));                     // no repeats within 10
    const pool = CARDS.filter(c => !c.followUp && !recent.has(c.id) && !(c.once && run.used.has(c.id)));
    return pool[Math.floor(rnd() * pool.length)];
}
export function choose(run, card, side) {
    // 1) apply fx × FX_SCALE (rounded, clamped 0..100)  2) apply DRIFT  3) age += 2  4) queue `then` at choices+2
    if (run.age >= END_AGE) return (run.ending = 'emeritus');       // reaching 96 WINS, even on a tipping swipe
    // 5) else any meter at 0 → `${id}-0`, at 100 → `${id}-100`
}
```

Nine endings: BROKE (cash 0), CASH MOUNTAIN (cash 100), OUSTED (holders 0), THE CULT (holders 100), DAY TRADER (patience 0), TOO PATIENT (patience 100), BURNOUT (fizz 0), SUGAR RUSH (fizz 100), and CHAIRMAN EMERITUS at 96. Each has a reaction face and a one-line punchline ("Your cash pile got its own zip code").

### The drag

```js
cardEl.addEventListener('pointerdown', e => { dragging = true; startX = e.clientX; cardEl.setPointerCapture(e.pointerId); });
cardEl.addEventListener('pointermove', e => {
    dx = e.clientX - startX;
    cardEl.style.transform = `translateX(${dx}px) rotate(${dx / 16}deg)`;
    const side = dx < -18 ? 'left' : dx > 18 ? 'right' : null;      // label fades in over 70 px
    showHints(side);                                                // dots under touched meters; big dot if |fx| >= 10
});
// release: |dx| > 90 → decide(side) (card flies out ±520 px, rotate ±28°); else spring back
```

**Hints show *which* meters a choice moves and how much (big or small dot), never the direction.** That gap is the game. The labelled buttons (`← No debt` / `Borrow →`) show the same hints on hover. Each new card enters from `translateY(26px) scale(.92)` with opacity 0. Use a double `requestAnimationFrame` so the transition actually runs.

Meters are pixel icons that **fill like liquid**: a ghost image plus a fill image clipped with `clip-path: inset(${100 - v}% 0 0 0)` (0.35 s transition), and a flash-up / flash-down class on change.

### Daily + collection

- Seed `barren-deck:${DATE}:${career}`, with the career counter starting at 1, so **the first career of the day is the same deck order for everyone** and later careers vary.
- Endings collect in `localStorage['barren-ceo-endings']`, wrapped in try/catch and best-effort. The end screen shows a 3×3 grid with `???` for undiscovered endings and a `NEW ENDING:` prefix on a first find.

### Share text

```
Barren, CEO 🗂️ · Daily Deck #6
Made it to 96 — CHAIRMAN EMERITUS 🏆        (or: Lasted N years at Ohama Holdings)
Ending: CHAIRMAN EMERITUS · 1/9 endings found
made by @Wolfhartvest
```

## What to Avoid

- **A solvable deck.** In pass 1, a "keep every meter near 50" player reached 96 **96 %** of the time, so there was no replay value. Aging pressure (DRIFT) plus ×1.3 swings fixed it.
- **A deck where yes = spend.** Random swipers went BROKE 66 % of the time. Add cards where yes *earns*.
- **Patience drift +2.** Thoughtful players then ended TOO PATIENT 58 % of the time. Use +1.
- **Losing on the finish line.** A career that reached 96 but maxed a meter on its last swipe was shown TOO PATIENT. Check the age before the meters.
- **Meter icons that use only the middle of their 16 px.** 29 % cash looked empty. An icon that doubles as a gauge must fill its full height (money bag, tall busts).
- Gesture libraries (Hammer.js, interact.js). They add weight for nothing.

## Constraints

- Sim (2,000 careers × 4 policies, pass 3): random **10.5 cards (~age 51)** across six different endings (BROKE 47 %) · balanced **27.7 cards, Emeritus 48 %** · always-left / always-right die by ~45. Rare endings (SUGAR RUSH, DAY TRADER) need deliberate play, which makes them bait for collectors.
- **Content is the treadmill.** 33 cards repeat quickly (Reigns ships hundreds). This format scales with writing, not code, so new cards are the release cadence.
- **Open feel questions:** is it funny to people who don't follow finance; are 33 cards enough before repeats feel stale; does the share line need a hook beyond the ending name?

## Origin

Synthesized from spike: 003c.
Source files available in: `sources/003c-swipe-satire/` (`cards.js`, `swipe.js`, `micons.js`, `index.html`, `_sim.mjs`, `_verify.cjs`).
