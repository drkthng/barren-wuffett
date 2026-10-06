/**
 * cast.js — the code-drawn pixel cast for the replayable-barren-pivot spikes (Spike 002).
 *
 * Every character is built from simple shapes on a small grid (ellipses, rects, points),
 * then auto-outlined, so the whole cast shares proportions and outline weight.
 * No external art → no licence, no likeness: the parody comes from exaggerated signature
 * traits (white swept-back hair, big glasses, grin, suit), never from a real face.
 *
 * API (pure data at import time; DOM only inside the render helpers):
 *   SPRITES[name]              → { w, h, rows: string[], pal: {char: '#rrggbb'} }
 *   renderCanvas(sprite, scale)→ HTMLCanvasElement (nearest-neighbour, transparent bg)
 *   dataURL(sprite, scale)     → PNG data URL for <img>
 */

// ── Palette ────────────────────────────────────────────────────────────────
// One char per colour so sprite rows stay human-readable.
const BASE = {
    K: '#1c1824', // outline
    S: '#efb592', s: '#d18c6c', d: '#a3604b', p: '#e58373', q: '#f8d0b4', // skin / shade / deep / cheek / shine
    H: '#f4f5f7', h: '#c3c8d3', g: '#868ca0',                              // hair light / mid / dark
    B: '#a2a8b8', b: '#6c7286',                                            // brows (grey, darker than hair)
    F: '#2a2232', f: '#5b4c66', L: '#d4eaf6', l: '#ffffff',                // frames / frame hi / lens / glint
    E: '#2a2232', M: '#4e1d29', T: '#fbfbf4', o: '#c4415a',                // eye / mouth / teeth / tongue
    J: '#3a4463', j: '#272d45', W: '#f5f6f8', w: '#c4cad8',                // jacket / shade / shirt / shade
    R: '#c93c3c', r: '#8c2531', Y: '#f2c23d', y: '#b8862a',                // tie / tie shade / gold / gold shade
    G: '#5fbf5a', n: '#2f7f3a', U: '#7fc8ff', u: '#4a8fd0',                // green / dark green / sweat / sweat shade
    X: '#ffffff', Z: '#9b9b9b',                                            // pure white / grey
};

// ── Tiny grid canvas with a drawing vocabulary ──────────────────────────────
class Px {
    constructor(w, h) {
        this.w = w; this.h = h;
        this.g = Array.from({ length: h }, () => Array(w).fill(null));
    }
    set(x, y, c) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y][x] = c; return this; }
    get(x, y) { return (x >= 0 && y >= 0 && x < this.w && y < this.h) ? this.g[y][x] : null; }
    /** set (x,y) and its mirror across the vertical centre line */
    sym(x, y, c) { this.set(x, y, c); this.set(this.w - 1 - x, y, c); return this; }
    rect(x0, y0, x1, y1, c) {
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, c);
        return this;
    }
    symRect(x0, y0, x1, y1, c) { this.rect(x0, y0, x1, y1, c); return this.rect(this.w - 1 - x1, y0, this.w - 1 - x0, y1, c); }
    pts(list, c) { for (const [x, y] of list) this.set(x, y, c); return this; }
    symPts(list, c) { for (const [x, y] of list) this.sym(x, y, c); return this; }
    ellipse(cx, cy, rx, ry, c, keep = () => true) {
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
                if (dx * dx + dy * dy <= 1 && keep(x, y, this.get(x, y))) this.set(x, y, c);
            }
        }
        return this;
    }
    /** recolour existing pixels matching `from` where pred(x,y) holds */
    shade(from, to, pred) {
        for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
            if (this.g[y][x] === from && pred(x, y)) this.g[y][x] = to;
        }
        return this;
    }
    /** 1-px outline around the silhouette (4-neighbour) */
    outline(c = 'K') {
        const add = [];
        for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
            if (this.g[y][x]) continue;
            const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
                const v = this.get(x + dx, y + dy);
                return v && v !== c;
            });
            if (n) add.push([x, y]);
        }
        for (const [x, y] of add) this.g[y][x] = c;
        return this;
    }
    rows() { return this.g.map(r => r.map(c => c ?? '.').join('')); }
}

const sprite = (px, pal = {}) => ({ w: px.w, h: px.h, rows: px.rows(), pal: { ...BASE, ...pal } });

// ── Portrait building blocks (32×32 bust, mirror axis between cols 15|16) ───

/** suit body: shoulders, shirt V, tie, lapels */
function body(p, { tie = true, shirtV = true } = {}) {
    for (let y = 24; y < 32; y++) {
        const half = 7 + Math.round((y - 24) * 1.2);
        for (let x = 16 - half; x < 16 + half; x++) p.set(x, y, 'J');
    }
    p.shade('J', 'j', (x, y) => x >= 16 + 7 + Math.round((y - 24) * 1.2) - 3); // right-side shade
    if (shirtV) {
        const v = [[12, 19, 24], [13, 18, 25], [13, 18, 26], [14, 17, 27], [14, 17, 28], [15, 16, 29]];
        for (const [a, b, y] of v) p.rect(a, y, b, y, 'W');
        p.sym(12, 24, 'w');
        p.symPts([[12, 25], [13, 27], [14, 29]], 'j'); // lapel edges
    }
    if (tie) {
        p.rect(15, 25, 16, 26, 'R');            // knot
        p.rect(15, 27, 16, 31, 'R');
        p.rect(14, 29, 17, 31, 'R');            // tie widens
        p.pts([[16, 26], [16, 28], [17, 30], [17, 31]], 'r');
    }
}

function neck(p) { p.rect(12, 21, 19, 24, 's'); }

/** head + ears; long = slightly longer face */
function head(p, { long = false } = {}) {
    const ry = long ? 11 : 10.5;
    p.ellipse(16, 13.5, 8.5, ry, 'S');
    // ears
    p.ellipse(7, 14.5, 1.7, 2.7, 'S');
    p.ellipse(25, 14.5, 1.7, 2.7, 'S');
    p.symPts([[6, 14], [6, 15]], 's');
    // jaw / jowl shade
    p.shade('S', 's', (x, y) => y >= 21 && (x <= 10 || x >= 21));
    p.shade('S', 's', (x, y) => y >= 23);
}

/** Barren's hair: white crest swept back, receded temples, fluffy sides */
function hairBarren(p) {
    p.ellipse(16, 8.6, 9.6, 7.4, 'H', (x, y) => y <= 4);              // crest
    // swept-back strands: offset columns per row read as combed hair, not a helmet
    p.pts([[13, 2], [17, 2], [10, 3], [14, 3], [18, 3], [21, 3], [9, 4], [12, 4], [16, 4], [19, 4], [22, 4]], 'h');
    // sides: tufty silhouette, thinning toward the ears
    p.symPts([[7, 5], [8, 5], [9, 5], [7, 6], [8, 6], [6, 7], [7, 7], [8, 7], [7, 8], [8, 8],
              [7, 9], [6, 10], [7, 10], [8, 10], [7, 11]], 'H');
    p.symPts([[9, 6], [9, 7], [8, 9], [8, 11], [9, 9]], 'h');
    p.symPts([[7, 12], [8, 12]], 'g');
}

/** Charlie's hair: bald dome with a shine, white fringe low on the sides */
function hairCharlie(p) {
    p.symRect(7, 8, 8, 14, 'H');
    p.symPts([[9, 9], [9, 10]], 'H');
    p.symPts([[7, 13], [7, 14], [8, 14]], 'h');
    p.pts([[12, 5], [13, 5], [12, 6], [11, 7]], 'q');   // dome shine
}

function browsBarren(p) {
    p.symRect(10, 9, 13, 9, 'B');
    p.symRect(8, 10, 13, 10, 'B');
    p.symPts([[11, 8], [13, 8]], 'b');                 // stray bushy hairs
    p.symPts([[8, 10], [13, 9]], 'b');
}

/** big thick frames — Barren's signature */
function glassesBig(p) {
    p.symRect(8, 11, 14, 16, 'F');
    p.symRect(9, 12, 13, 15, 'L');
    p.rect(15, 12, 16, 12, 'F');                      // bridge
    p.symPts([[7, 12]], 'F');                          // temple arms
    p.pts([[9, 12], [10, 12], [9, 13], [18, 12], [19, 12], [18, 13]], 'l'); // glints (light from top-left)
    p.symPts([[8, 11]], 'f');
}

/** round thick frames — Charlie */
function glassesRound(p) {
    p.symRect(9, 11, 13, 11, 'F');
    p.symRect(9, 16, 13, 16, 'F');
    p.symRect(8, 12, 8, 15, 'F');
    p.symRect(14, 12, 14, 15, 'F');
    p.symRect(9, 12, 13, 15, 'L');
    p.rect(15, 13, 16, 13, 'F');
    p.symPts([[7, 13]], 'F');
    p.pts([[9, 12], [10, 12], [18, 12], [19, 12]], 'l');
}

function eyes(p, kind) {
    if (kind === 'happy') {                            // squinting grin eyes (^ ^)
        p.symPts([[10, 14], [11, 13], [12, 14]], 'E');
    } else if (kind === 'worried') {
        p.symPts([[11, 13], [11, 14]], 'E');
        p.symPts([[10, 12], [11, 12]], 'b');           // brows pulled up inside lens tops
    } else if (kind === 'stern') {
        p.symPts([[10, 14], [11, 14], [12, 14]], 'E');
    } else {                                           // neutral
        p.symPts([[11, 13], [11, 14]], 'E');
    }
}

function nose(p) {
    p.pts([[15, 17], [16, 17]], 'S');
    p.pts([[17, 17], [14, 18], [17, 18]], 's');
    p.pts([[15, 18], [16, 18]], 'd');
}

function mouth(p, kind) {
    if (kind === 'grin') {
        p.rect(12, 20, 19, 20, 'M');
        p.rect(12, 21, 19, 21, 'T');
        p.sym(11, 21, 'M');
        p.rect(13, 22, 18, 22, 'M');
        p.symPts([[11, 20], [10, 21]], 's');           // smile creases
        p.symPts([[9, 18], [10, 18]], 'p');            // cheeks
    } else if (kind === 'smile') {
        p.rect(12, 21, 19, 21, 'M');
        p.symPts([[11, 20]], 'M');
        p.symPts([[10, 19]], 's');
        p.symPts([[9, 18], [10, 18]], 'p');
    } else if (kind === 'flat') {
        p.rect(12, 21, 19, 21, 'M');
        p.symPts([[11, 22]], 'M');
    } else if (kind === 'o') {
        p.rect(14, 20, 17, 23, 'M');
        p.rect(15, 21, 16, 22, 'o');
        p.symPts([[13, 21], [13, 22]], 'M');
    }
}

function wrinkles(p, heavy = false) {
    p.pts([[13, 7], [14, 7], [17, 7], [18, 7]], 's');
    if (heavy) p.pts([[12, 8], [13, 8], [18, 8], [19, 8], [14, 6], [17, 6]], 's');
}

// ── Characters ─────────────────────────────────────────────────────────────

function barren({ eyes: e = 'happy', mouth: m = 'grin' } = {}) {
    const p = new Px(32, 32);
    body(p); neck(p); head(p);
    wrinkles(p);
    hairBarren(p); browsBarren(p);
    glassesBig(p); eyes(p, e);
    nose(p); mouth(p, m);
    return sprite(p.outline());
}

function charlie() {
    const p = new Px(32, 32);
    body(p); neck(p); head(p, { long: true });
    wrinkles(p, true);
    hairCharlie(p);
    p.symRect(9, 10, 13, 10, 'h');                     // flat grey brows
    glassesRound(p); eyes(p, 'stern');
    nose(p); mouth(p, 'flat');
    return sprite(p.outline(), { J: '#30343f', j: '#22252e', R: '#3b5ba5', r: '#28407a' });
}

/** Mr. Market: bowler hat, handlebar moustache, loud tie; mood changes face + palette */
function mrMarket(mood = 'neutral') {
    const p = new Px(32, 32);
    body(p); neck(p); head(p);
    // slick dark hair under the brim
    p.symRect(7, 8, 9, 10, 'h');
    // bowler hat
    p.ellipse(16, 5.5, 7, 4.5, 'F', (x, y) => y <= 6);
    p.rect(5, 7, 26, 7, 'F');
    p.rect(9, 6, 22, 6, 'R');                          // hat band (mood colour via palette)
    p.pts([[11, 3], [12, 2], [13, 2]], 'f');           // hat shine
    // brows
    if (mood === 'panic') p.symPts([[10, 10], [11, 9], [12, 9]], 'g');
    else if (mood === 'greed') p.symPts([[9, 9], [10, 9], [11, 10], [12, 10]], 'g');
    else { p.symRect(10, 10, 12, 10, 'g'); p.set(20, 9, 'g'); }
    // eyes
    if (mood === 'greed') {                            // $ $
        const dollar = [[11, 11], [10, 12], [11, 12], [12, 12], [10, 13], [11, 14], [12, 14], [12, 15], [10, 16], [11, 16], [12, 16], [11, 17]];
        p.pts(dollar, 'n');
        p.pts(dollar.map(([x, y]) => [x + 9, y]), 'n');
        p.symPts([[9, 13], [9, 14]], 'Y');
    } else if (mood === 'panic') {                     // wide white eyes, pin pupils
        p.symRect(10, 12, 12, 14, 'T');
        p.symPts([[11, 13]], 'E');
        p.symPts([[8, 6], [8, 7], [23 - 15, 8]], 'U');  // sweat on the temple
        p.pts([[22, 8], [23, 8], [23, 9], [22, 9], [23, 10]], 'U');
        p.pts([[9, 15], [9, 16], [22, 16], [22, 17]], 'U'); // tears
    } else {
        p.symRect(10, 13, 12, 13, 'g');               // heavy lids
        p.pts([[11, 14], [12, 14], [20, 14], [21, 14]], 'E'); // sly glance to his left
    }
    nose(p);
    // handlebar moustache
    p.rect(11, 19, 20, 19, 'h');
    p.symPts([[10, 18], [9, 17], [10, 19]], 'h');
    p.rect(13, 18, 18, 18, 'h');
    // mouth
    if (mood === 'greed') {
        p.rect(11, 20, 20, 20, 'T');
        p.rect(12, 21, 19, 21, 'M');
        p.symPts([[8, 18], [9, 19]], 'p');
    } else if (mood === 'panic') {
        p.rect(13, 20, 18, 23, 'M');
        p.rect(14, 21, 17, 22, 'o');
    } else {
        p.rect(14, 21, 19, 21, 'M');
        p.set(20, 20, 'M');
    }
    const pal = {
        h: '#4a3326', g: '#2f2019',
        J: '#4b3a5e', j: '#33283f',
    };
    if (mood === 'greed') Object.assign(pal, { S: '#f4ae86', s: '#d98a66', R: '#3fbf5a', r: '#22803a', p: '#ea6a5a' });
    else if (mood === 'panic') Object.assign(pal, { S: '#d8d4df', s: '#b2abbf', d: '#8a8299', R: '#7d8aa3', r: '#5a6680' });
    else Object.assign(pal, { R: '#e0a32e', r: '#a8761d' });
    return sprite(p.outline(), pal);
}

function cryptoBro() {
    const p = new Px(32, 32);
    // hoodie body
    for (let y = 24; y < 32; y++) {
        const half = 8 + Math.round((y - 24) * 1.2);
        for (let x = 16 - half; x < 16 + half; x++) p.set(x, y, 'J');
    }
    p.shade('J', 'j', (x, y) => x >= 16 + 8 + Math.round((y - 24) * 1.2) - 3);
    p.symRect(13, 25, 13, 30, 'w');                    // hoodie strings
    p.rect(12, 24, 19, 24, 'j');
    p.rect(14, 26, 17, 27, 'Y');                       // gold chain pendant
    p.symPts([[12, 25], [13, 26]], 'Y');
    neck(p); head(p);
    // backwards cap
    p.ellipse(16, 6.5, 8.6, 5.5, 'R', (x, y) => y <= 7);
    p.rect(6, 8, 10, 8, 'R');                          // strap side
    p.rect(21, 7, 25, 9, 'r');                         // cap back/strap
    p.pts([[16, 2], [15, 2]], 'r');
    // shades
    p.symRect(8, 12, 14, 14, 'F');
    p.rect(15, 12, 16, 12, 'F');
    p.symPts([[7, 12]], 'F');
    p.pts([[9, 12], [10, 12], [18, 12], [19, 12]], 'f');
    // stubble + smirk
    p.pts([[11, 21], [13, 22], [15, 23], [17, 23], [19, 22], [21, 21], [12, 23], [20, 23]], 'g');
    nose(p);
    p.rect(13, 20, 19, 20, 'M');
    p.set(20, 19, 'M');
    p.symPts([[10, 18]], 'p');
    return sprite(p.outline(), {
        J: '#7b4fd1', j: '#5a37a0', R: '#ff8a1f', r: '#c55f0c', g: '#8a6a55', h: '#6b4a3a',
    });
}

function banker() {
    const p = new Px(32, 32);
    body(p); neck(p); head(p);
    // pinstripes
    for (let y = 24; y < 32; y++) for (let x = 0; x < 32; x++) {
        if ((x % 3 === 0) && (p.get(x, y) === 'J' || p.get(x, y) === 'j')) p.set(x, y, 'w');
    }
    // slick dark hair, hard side part
    p.ellipse(16, 8, 9.4, 6.5, 'h', (x, y) => y <= 6);
    p.symRect(7, 6, 8, 10, 'h');
    p.rect(9, 7, 21, 7, 'h');
    p.pts([[12, 3], [12, 4], [12, 5], [12, 6]], 'g');  // part line
    p.pts([[16, 3], [19, 4], [21, 5]], 'H');           // shine (H = hair highlight here)
    // narrow glasses
    p.symRect(9, 13, 13, 13, 'F');
    p.symRect(9, 14, 13, 14, 'L');
    p.rect(14, 13, 17, 13, 'F');
    p.symRect(10, 11, 13, 11, 'g');                    // brows
    p.symPts([[11, 14]], 'E');
    nose(p);
    mouth(p, 'smile');
    p.set(20, 21, 'M');
    p.sym(10, 18, 'S');                                // banker: no rosy cheeks
    p.rect(22, 26, 24, 27, 'Y');                       // pocket square
    return sprite(p.outline(), {
        J: '#1f2a44', j: '#151d31', w: '#3b4a6d', h: '#2b2420', g: '#18130f', H: '#5a4a40', R: '#7a2b5c', r: '#55193f',
    });
}

function reporter() {
    const p = new Px(32, 32);
    body(p, { tie: false, shirtV: true });
    neck(p); head(p);
    // bob haircut
    p.ellipse(16, 10, 10, 9, 'H', (x, y) => y <= 7);
    p.symRect(6, 8, 9, 19, 'H');
    p.symPts([[10, 8], [10, 7], [11, 7]], 'H');
    p.symRect(6, 18, 8, 20, 'h');
    p.pts([[13, 4], [16, 3], [19, 4]], 'h');
    p.symRect(10, 10, 13, 10, 'g');                    // brows
    p.symPts([[11, 13], [11, 14], [12, 13]], 'E');
    p.symPts([[10, 12]], 'E');                         // lashes
    nose(p);
    p.rect(13, 21, 18, 21, 'o');                       // lipstick smile
    p.symPts([[12, 20]], 'o');
    p.symPts([[9, 18], [10, 18]], 'p');
    p.symPts([[6, 17]], 'Y');                          // earrings
    // microphone (bottom-right)
    p.rect(23, 21, 26, 24, 'Z');
    p.pts([[24, 22], [25, 23]], 'X');
    p.rect(24, 25, 25, 31, 'F');
    return sprite(p.outline(), {
        H: '#b0552e', h: '#7d3a1f', g: '#6a3320', J: '#d23b4a', j: '#9e2433',
    });
}

// ── Full-body Barren for the arcade (20×28; frames idle/walkA/walkB/oops) ──

function barrenBody(frame = 'idle') {
    const p = new Px(20, 28);
    // legs + shoes
    const legs = {
        idle: [[6, 8], [11, 13]], walkA: [[5, 7], [12, 14]], walkB: [[7, 9], [10, 12]], oops: [[5, 7], [12, 14]],
    }[frame];
    for (const [a, b] of legs) { p.rect(a, 22, b, 25, 'j'); p.rect(a - (a < 10 ? 1 : 0), 26, b + (b > 10 ? 1 : 0), 26, 'F'); }
    // jacket
    p.rect(4, 14, 15, 22, 'J');
    p.rect(13, 14, 15, 22, 'j');
    p.rect(8, 14, 11, 17, 'W');                         // shirt
    p.rect(9, 15, 10, 21, 'R');                         // tie
    p.pts([[10, 16], [10, 18], [10, 20]], 'r');
    // arms
    if (frame === 'oops') { p.rect(2, 9, 3, 15, 'J'); p.rect(16, 9, 17, 15, 'j'); p.rect(2, 7, 3, 8, 'S'); p.rect(16, 7, 17, 8, 'S'); }
    else { p.rect(3, 15, 3, 21, 'J'); p.rect(16, 15, 16, 21, 'j'); p.set(3, 22, 'S'); p.set(16, 22, 'S'); }
    // head
    p.ellipse(10, 8.5, 5.8, 6.2, 'S', (x, y) => y >= 2);
    p.ellipse(10, 4.6, 6.2, 3.4, 'H', (x, y) => y <= 3);   // white crest
    p.pts([[4, 4], [4, 5], [4, 6], [15, 4], [15, 5], [15, 6], [3, 5], [16, 5]], 'H'); // tufts
    p.pts([[7, 2], [11, 2], [5, 3], [9, 3], [13, 3]], 'h');
    // big glasses
    p.rect(5, 8, 9, 11, 'F'); p.rect(10, 9, 10, 9, 'F'); p.rect(11, 8, 15, 11, 'F');
    p.rect(6, 9, 8, 10, 'L'); p.rect(12, 9, 14, 10, 'L');
    p.pts([[6, 9], [12, 9]], 'l');
    if (frame === 'oops') p.pts([[7, 9], [13, 9], [7, 10], [13, 10]], 'E');
    else p.pts([[7, 10], [13, 10]], 'E');
    p.rect(5, 7, 8, 7, 'B'); p.rect(12, 7, 15, 7, 'B');
    // mouth
    if (frame === 'oops') { p.rect(9, 12, 11, 13, 'M'); }
    else { p.rect(8, 12, 12, 12, 'M'); p.pts([[7, 11], [13, 11]], 'M'); p.rect(9, 13, 11, 13, 'M'); }
    p.pts([[6, 12], [14, 12]], 'p');
    return sprite(p.outline());
}

/** Cherry Fizz — Barren's soda. Red can + cherry emblem; deliberately no real brand marks. */
function cherryFizz() {
    const p = new Px(10, 14);
    p.rect(1, 2, 8, 12, 'R');
    p.rect(7, 2, 8, 12, 'r');
    p.rect(2, 1, 7, 1, 'h'); p.rect(2, 13, 7, 13, 'h');
    p.rect(2, 3, 2, 11, 'l');
    p.rect(1, 5, 8, 9, 'X');                            // white band
    p.pts([[3, 7], [4, 8], [6, 7], [6, 8], [3, 8]], 'r'); // cherries
    p.pts([[4, 6], [5, 5], [6, 6]], 'n');               // stems
    return sprite(p.outline());
}

export const SPRITES = {
    barren: barren(),
    barrenSmile: barren({ eyes: 'neutral', mouth: 'smile' }),
    barrenWorried: barren({ eyes: 'worried', mouth: 'o' }),
    charlie: charlie(),
    marketNeutral: mrMarket('neutral'),
    marketGreed: mrMarket('greed'),
    marketPanic: mrMarket('panic'),
    cryptoBro: cryptoBro(),
    banker: banker(),
    reporter: reporter(),
    barrenIdle: barrenBody('idle'),
    barrenWalkA: barrenBody('walkA'),
    barrenWalkB: barrenBody('walkB'),
    barrenOops: barrenBody('oops'),
    cherryFizz: cherryFizz(),
};

// ── Rendering (browser only) ────────────────────────────────────────────────

export function renderCanvas(spr, scale = 1) {
    const cv = document.createElement('canvas');
    cv.width = spr.w * scale;
    cv.height = spr.h * scale;
    const ctx = cv.getContext('2d');
    spr.rows.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
            const k = row[x];
            if (k === '.') continue;
            ctx.fillStyle = spr.pal[k] ?? '#ff00ff';
            ctx.fillRect(x * scale, y * scale, scale, scale);
        }
    });
    return cv;
}

export const dataURL = (spr, scale = 1) => renderCanvas(spr, scale).toDataURL('image/png');
