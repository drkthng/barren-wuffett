/**
 * hubsprites.js — hub-only pixel sprites for the sketches (snowball streak, padlock, check).
 * Same sprite format and drawing style as spike 002's cast.js ({ w, h, rows, pal }, 1-px auto-outline),
 * so renderCanvas()/dataURL() from cast.js render these too.
 */

const PAL = {
    K: '#1c1824',                                   // outline (same as the cast)
    X: '#ffffff', W: '#eef3fa', w: '#c9d6e8', u: '#8fa6c6', // snow: highlight / body / shade / deep shade
    Y: '#f2c23d', y: '#b8862a',                     // gold coin
    R: '#c93c3c', r: '#8c2531', T: '#fbfbf4',       // Cherry Fizz can red / shade / band
    t: '#7a5236',                                   // twig
    Z: '#9aa0b4', z: '#6c7286',                     // padlock steel
    G: '#5fbf5a', g: '#2f7f3a',                     // check green
};

class Px {
    constructor(w, h) { this.w = w; this.h = h; this.g = Array.from({ length: h }, () => Array(w).fill(null)); }
    set(x, y, c) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y][x] = c; return this; }
    get(x, y) { return (x >= 0 && y >= 0 && x < this.w && y < this.h) ? this.g[y][x] : null; }
    rect(x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, c); return this; }
    pts(list, c) { for (const [x, y] of list) this.set(x, y, c); return this; }
    ellipse(cx, cy, rx, ry, c, keep = () => true) {
        for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
            const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
            if (dx * dx + dy * dy <= 1 && keep(x, y, this.get(x, y))) this.set(x, y, c);
        }
        return this;
    }
    outline(c = 'K') {
        const add = [];
        for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
            if (this.g[y][x]) continue;
            if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const v = this.get(x + dx, y + dy); return v && v !== c; })) add.push([x, y]);
        }
        for (const [x, y] of add) this.g[y][x] = c;
        return this;
    }
    rows() { return this.g.map(r => r.map(c => c ?? '.').join('')); }
}
const sprite = (p, pal = {}) => ({ w: p.w, h: p.h, rows: p.rows(), pal: { ...PAL, ...pal } });

/** shaded snow ball of diameter d, bottom-aligned at baseline (exclusive), centred on cx */
function ball(p, cx, baseline, d) {
    const r = d / 2, cy = baseline - r;
    p.ellipse(cx, cy, r, r, 'W');
    // light from top-left: shade the lower-right crescent, deep shade on the very rim
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
        if (p.get(x, y) !== 'W') continue;
        const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r;
        const lit = -dx * 0.6 - dy * 0.8;           // dot with light dir
        if (lit < -0.55) p.set(x, y, 'u');
        else if (lit < -0.12) p.set(x, y, 'w');
    }
    // highlight
    const hx = Math.round(cx - r * 0.45), hy = Math.round(cy - r * 0.45);
    p.set(hx, hy, 'X');
    if (d >= 8) p.set(hx + 1, hy, 'X');
    if (d >= 11) { p.set(hx, hy + 1, 'X'); p.set(hx + 2, hy, 'X'); }
    // a couple of packed-snow specks so it reads as snow, not a pearl
    if (d >= 8) p.pts([[Math.round(cx + r * 0.2), Math.round(cy + r * 0.1)]], 'w');
    if (d >= 11) p.pts([[Math.round(cx - r * 0.3), Math.round(cy + r * 0.35)], [Math.round(cx + r * 0.45), Math.round(cy - r * 0.25)]], 'w');
    return { cx, cy, r };
}

/** Streak size step for a streak length, given milestone days (e.g. [3, 7, 30]) → 0..steps.length */
export function stepFor(days, milestones = [3, 7, 30]) {
    let s = 0;
    for (const m of milestones) if (days >= m) s++;
    return s;
}

const DIAMETERS = [6, 8, 11, 14];                   // step 0..3 (sizes scale with the step index)
const diam = step => DIAMETERS[Math.min(step, DIAMETERS.length - 1)];

/** A — plain snowball: just grows */
export function snowPlain(step) {
    const p = new Px(16, 16);
    ball(p, 8, 15, diam(step));
    return sprite(p.outline());
}

/** B — picks things up as it rolls: twig at step 1, coin at step 2, a Cherry Fizz can at step 3 */
export function snowPickup(step) {
    const p = new Px(18, 16);
    const { cx, cy, r } = ball(p, 9, 15, diam(step));
    if (step >= 1) {                                // twig poking out top-right
        const x0 = Math.round(cx + r * 0.55), y0 = Math.round(cy - r * 0.55);
        p.pts([[x0, y0], [x0 + 1, y0 - 1], [x0 + 2, y0 - 2], [x0 + 2, y0 - 1]], 't');
    }
    if (step >= 2) {                                // gold coin stuck in the left side
        const x = Math.round(cx - r * 0.75), y = Math.round(cy + r * 0.05);
        p.rect(x - 1, y - 1, x + 1, y + 1, 'Y'); p.set(x + 1, y + 1, 'y'); p.set(x - 1, y - 1, 'X');
    }
    if (step >= 3) {                                // Cherry Fizz can wedged in at the bottom right
        const x = Math.round(cx + r * 0.25), y = Math.round(cy + r * 0.25);
        p.rect(x, y, x + 2, y + 3, 'R'); p.rect(x + 2, y, x + 2, y + 3, 'r'); p.rect(x, y + 1, x + 2, y + 1, 'T');
    }
    return sprite(p.outline());
}

/** C — on the long hill: the ball rolls down a snowy slope, its track grows behind it */
export function snowHill(step) {
    const W = 34, H = 18;
    const p = new Px(W, H);
    // slope: from (0, 6) down to (W, H-2); snow fill below the line
    const yAt = x => Math.round(6 + (x / (W - 1)) * (H - 9));
    for (let x = 0; x < W; x++) for (let y = yAt(x); y < H; y++) p.set(x, y, y === yAt(x) ? 'W' : (y > yAt(x) + 2 ? 'u' : 'w'));
    // track groove behind the ball, longer with each step
    const d = diam(step);
    const bx = W - 4 - Math.ceil(d / 2);            // ball sits near the bottom of the slope
    const trackLen = [5, 10, 16, 24][Math.min(step, 3)];
    for (let x = Math.max(0, bx - trackLen); x < bx - 1; x++) p.set(x, yAt(x) + 1, 'u');
    // the ball rests on the slope surface
    ball(p, bx, yAt(bx) + 1, d);
    return sprite(p.outline());
}

export const SNOW_STYLES = {
    plain: { label: 'Plain snowball', make: snowPlain },
    pickup: { label: 'Picks things up', make: snowPickup },
    hill: { label: 'On the long hill', make: snowHill },
};

/** padlock 10×12 */
export function padlock() {
    const p = new Px(10, 12);
    p.rect(3, 1, 6, 1, 'Z'); p.rect(2, 2, 2, 5, 'Z'); p.rect(7, 2, 7, 5, 'Z'); // shackle
    p.rect(1, 5, 8, 10, 'Y'); p.rect(7, 5, 8, 10, 'y');                        // body
    p.rect(4, 7, 5, 8, 'K'); p.set(2, 6, 'X');                                 // keyhole + glint
    return sprite(p.outline());
}

/** check mark 9×8 */
export function check() {
    const p = new Px(9, 8);
    p.pts([[1, 3], [2, 4], [3, 5], [4, 4], [5, 3], [6, 2], [7, 1], [1, 4], [2, 5], [3, 6], [4, 5], [5, 4], [6, 3], [7, 2]], 'G');
    p.pts([[3, 6], [4, 5]], 'g');
    return sprite(p.outline());
}
