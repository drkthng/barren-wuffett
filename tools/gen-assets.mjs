/**
 * gen-assets.mjs — deterministic generator for Barren Wuffett's original pixel art + SFX.
 *
 * Phase 3.1 (FEEL-02, FEEL-03): replaces every 1×1/stub placeholder with real,
 * hand-authored pixel maps and synthesized WAV sound effects. Zero dependencies
 * (node:zlib for PNG deflate). Re-run with:  node tools/gen-assets.mjs
 *
 * All output is original art (drawn as pixel maps below) — no external assets,
 * no licensing concerns. Style follows public/assets/STYLE-GUIDE.md: 16px grid,
 * dark outlines, warm cozy palette compatible with Kenney Tiny Town.
 */
import zlib from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IMG = join(ROOT, 'public/assets/images');
const AUD = join(ROOT, 'public/assets/audio');
mkdirSync(IMG, { recursive: true });
mkdirSync(AUD, { recursive: true });

// ── PNG encoder ──────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        t[n] = c;
    }
    return t;
})();
function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
}
function writePng(path, w, h, rgba) {
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0);
    ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8;  // bit depth
    ihdr[9] = 6;  // color type RGBA
    const stride = w * 4;
    const raw = Buffer.alloc(h * (1 + stride));
    for (let y = 0; y < h; y++) {
        raw[y * (1 + stride)] = 0; // filter: none
        rgba.copy(raw, y * (1 + stride) + 1, y * stride, (y + 1) * stride);
    }
    const png = Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        pngChunk('IHDR', ihdr),
        pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
        pngChunk('IEND', Buffer.alloc(0)),
    ]);
    writeFileSync(path, png);
    console.log(`png  ${path.replace(ROOT, '.')}  ${w}x${h}  ${png.length}B`);
}

// ── Pixel canvas helpers ─────────────────────────────────────────────────────
function hex(c) {
    return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), 255];
}
function canvas(w, h) {
    const px = Buffer.alloc(w * h * 4); // transparent
    return {
        w, h, px,
        set(x, y, rgba) {
            x = Math.round(x); y = Math.round(y);
            if (x < 0 || y < 0 || x >= w || y >= h) return;
            px.set(rgba, (y * w + x) * 4);
        },
        rect(x0, y0, rw, rh, rgba) {
            for (let y = y0; y < y0 + rh; y++) for (let x = x0; x < x0 + rw; x++) this.set(x, y, rgba);
        },
        write(path) { writePng(path, w, h, px); },
    };
}
/** Render a string pixel map with a palette ('.' = transparent). Validates dimensions. */
function sprite(path, rows, palette, scale = 1) {
    const h = rows.length, w = rows[0].length;
    for (const r of rows) if (r.length !== w) throw new Error(`ragged row in ${path}: "${r}"`);
    const c = canvas(w * scale, h * scale);
    const pal = Object.fromEntries(Object.entries(palette).map(([k, v]) => [k, hex(v)]));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const ch = rows[y][x];
        if (ch === '.') continue;
        const col = pal[ch];
        if (!col) throw new Error(`unknown palette char '${ch}' in ${path}`);
        c.rect(x * scale, y * scale, scale, scale, col);
    }
    c.write(path);
}

// ── 3×5 micro font (for the logo masthead) ──────────────────────────────────
const FONT = {
    A: ['010', '101', '111', '101', '101'],
    B: ['110', '101', '110', '101', '110'],
    E: ['111', '100', '110', '100', '111'],
    F: ['111', '100', '110', '100', '100'],
    N: ['1001', '1101', '1111', '1011', '1001'],
    R: ['110', '101', '110', '110', '101'],
    T: ['111', '010', '010', '010', '010'],
    U: ['101', '101', '101', '101', '111'],
    W: ['10001', '10001', '10101', '11011', '10001'],
    ' ': ['00', '00', '00', '00', '00'],
};
function glyphW(ch) { return FONT[ch][0].length; }
function drawText(c, text, x0, y0, scale, rgba) {
    let x = x0;
    for (const ch of text) {
        const glyph = FONT[ch];
        if (!glyph) throw new Error(`no glyph for '${ch}'`);
        for (let gy = 0; gy < 5; gy++) for (let gx = 0; gx < glyphW(ch); gx++) {
            if (glyph[gy][gx] === '1') c.rect(x + gx * scale, y0 + gy * scale, scale, scale, rgba);
        }
        x += (glyphW(ch) + 1) * scale;
    }
    return x - scale; // right edge
}
function textWidth(text, scale) {
    let w = 0;
    for (const ch of text) w += (glyphW(ch) + 1) * scale;
    return w - scale;
}

// ═════════════════════════════════════════════════════════════════════════════
// SPRITES
// ═════════════════════════════════════════════════════════════════════════════

// Whackable bush — 16×16. Distinct from deco tileset bushes: brighter greens +
// red berries ("something's in there"), dark outline, small ground shadow.
sprite(join(IMG, 'bush.png'), [
    '......oooo......',
    '....oommmmoo....',
    '...ommllllmmo...',
    '..omllhlllllmo..',
    '.omlllllrllllmo.',
    '.omllllllllhlmo.',
    'omlhllrllllllmo.',
    'omllllllllrllmmo',
    'omlllllhlllllmdo',
    'omrllllllllllmdo',
    '.omllllrllllmdo.',
    '.oommllllllmdoo.',
    '..ooommmmmmdoo..',
    '...soodddddoos..',
    '....ssssssss....',
    '................',
], { o: '#1b4d20', d: '#2d7a35', m: '#43a047', l: '#66bb4a', h: '#9ccc65', r: '#e53935', s: '#2a2a1e' });

// Leaf particle — 8×8 diamond leaf with vein.
sprite(join(IMG, 'leaf_particle.png'), [
    '...gg...',
    '..glLg..',
    '.glLllg.',
    'glLlllvg',
    '.gLllvg.',
    '..gvvg..',
    '...gg...',
    '........',
], { g: '#2d7a35', l: '#66bb4a', L: '#9ccc65', v: '#43a047' });

// Newspaper swing — 96×32 sheet, 3 frames of 32×32. A rolled paper sweeping
// left→center→right below a pivot, with cream motion-trail arcs.
{
    const c = canvas(96, 32);
    const CREAM = hex('#f5f0e1'), GREY = hex('#b8b0a0'), INK = hex('#5a5548'), TRAIL = hex('#ffffff');
    const frames = [
        { a: -1.05, trailFrom: -1.45 },
        { a: -0.20, trailFrom: -0.95 },
        { a: 0.75, trailFrom: 0.05 },
    ];
    frames.forEach((f, i) => {
        const ox = i * 32 + 16, oy = 6; // pivot top-center of the frame
        // motion trail: two thin arcs at radius 14 & 17 sweeping from trailFrom to a
        for (const r of [14, 17]) {
            for (let t = f.trailFrom; t < f.a; t += 0.03) {
                const px = ox + Math.sin(t) * r, py = oy + Math.cos(t) * r;
                if ((Math.round(t * 33) % 2) === 0) c.set(px, py, TRAIL);
            }
        }
        // the rolled paper: an 11px-long, 5px-wide roll at angle a, radius 10..21
        for (let r = 10; r <= 21; r++) {
            for (let s = -2; s <= 2; s++) {
                const px = ox + Math.sin(f.a) * r + Math.cos(f.a) * s;
                const py = oy + Math.cos(f.a) * r - Math.sin(f.a) * s;
                const col = Math.abs(s) === 2 ? GREY : CREAM;
                c.set(px, py, col);
            }
        }
        // ink band near the tip (newspaper print)
        for (let s = -2; s <= 2; s++) {
            const r = 19;
            c.set(ox + Math.sin(f.a) * r + Math.cos(f.a) * s, oy + Math.cos(f.a) * r - Math.sin(f.a) * s, INK);
        }
    });
    c.write(join(IMG, 'newspaper_swing.png'));
}

// Touch whack button — 48×48. Dark round button + diagonal rolled newspaper.
{
    const c = canvas(48, 48);
    const BG = hex('#16213e'), RIM = hex('#3a4a6e'), CREAM = hex('#f5f0e1'), GREY = hex('#b8b0a0'), INK = hex('#5a5548');
    for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
        const d = Math.hypot(x - 23.5, y - 23.5);
        if (d <= 21) c.set(x, y, BG);
        if (d > 21 && d <= 23) c.set(x, y, RIM);
    }
    // rolled newspaper: thick diagonal from (13,34) to (34,13)
    for (let t = 0; t <= 21; t++) {
        const x = 13 + t, y = 34 - t;
        for (let s = -3; s <= 3; s++) {
            const px = x + s * 0.7071, py = y + s * 0.7071;
            c.set(px, py, Math.abs(s) === 3 ? GREY : CREAM);
        }
    }
    // roll end cap (spiral hint) at the lower-left end
    c.rect(10, 32, 5, 5, GREY);
    c.rect(11, 33, 3, 3, CREAM);
    c.set(12, 34, INK);
    // print lines on the roll
    for (let t = 6; t <= 16; t += 4) c.set(13 + t, 34 - t, INK);
    c.write(join(IMG, 'ui_newspaper_button.png'));
}

// Shop item icons — 16×16 each.
sprite(join(IMG, 'item_newspaper_upgrade.png'), [
    '................',
    '..oooooooooo....',
    '.owwwwwwwwwwo...',
    '.owiiwwwiiwwo...',
    '.owwwwwwwwwwoo..',
    '.owiiiwwiiwwrro.',
    '.owwwwwwwwworro.',
    '.owiiwwiiiwwwwo.',
    '.owwwwwwwwwwwwo.',
    '.owiiiwwwiiwwwo.',
    '.owwwwwwwwwwwwo.',
    '..oooooooooooo..',
    '................',
    '................',
    '................',
    '................',
], { o: '#5a5548', w: '#f5f0e1', i: '#8a8478', r: '#e53935' });

sprite(join(IMG, 'item_helmet.png'), [
    '................',
    '.....ooooo......',
    '...oobbbbboo....',
    '..obbllbbbbbo...',
    '..obllbbbbbbo...',
    '.obbllbbbbbbbo..',
    '.oblbbbbbbbbbo..',
    '.obbbbbbbbbbbo..',
    '.ooooooooooooo..',
    '..o..........o..',
    '..o..........o..',
    '...oo......oo...',
    '.....oooooo.....',
    '................',
    '................',
    '................',
], { o: '#1b2a4a', b: '#3f6fbf', l: '#7fa8e0' });

sprite(join(IMG, 'item_bus_pass.png'), [
    '................',
    '................',
    '..oooooooooooo..',
    '.oyyyyyyyyyyyyo.',
    '.oyddyyyyyyddyo.',
    '.oyyyybbbbyyyyo.',
    '.oyyyybyybyyyyo.',
    '.oyddyybbyyddyo.',
    '.oyyyyyyyyyyyyo.',
    '.oyddddddddddyo.',
    '.oyyyyyyyyyyyyo.',
    '..oooooooooooo..',
    '................',
    '................',
    '................',
    '................',
], { o: '#7a5a10', y: '#f5c842', d: '#c79a20', b: '#1b2a4a' });

sprite(join(IMG, 'item_snack.png'), [
    '................',
    '....oooooo......',
    '..oottttttoo....',
    '.ottdtttttdto...',
    '.otttttdttttto..',
    'ottdtttttttdtto.',
    'otttttdttttttto.',
    'ottttttttdtttto.',
    '.otdtttttttto...',
    '.ottttdttttto...',
    '..oottttttoo....',
    '....oooooo......',
    '................',
    '................',
    '................',
    '................',
], { o: '#6b4a1e', t: '#d9a05a', d: '#5a3a1a' });

// BW monogram coin — 16×16 gold coin with a dark B.
sprite(join(IMG, 'bw_monogram.png'), [
    '....oooooooo....',
    '..oogggggggoo...',
    '.ogggyyyyygggo..',
    '.ogyyyyyyyyygo..',
    'ogyybbbyyyyyygo.',
    'ogyybybbyyyyygo.',
    'ogyybbbyyyyyygo.',
    'ogyybybbyyyyygo.',
    'ogyybbbyyyyyygo.',
    '.ogyyyyyyyyygo..',
    '.ogggyyyyygggo..',
    '..oogggggggoo...',
    '....oooooooo....',
    '................',
    '................',
    '................',
], { o: '#7a5a10', g: '#c79a20', y: '#f5c842', b: '#5a3a10' });

// Set-piece markers — 16×16 (Phase 3.1 Plan 02: visible trigger markers).
sprite(join(IMG, 'marker_route.png'), [
    '................',
    '..oooooooooo....',
    '.owwwwwwwwwwoo..',
    '.owwwwwwwwwwwo..',
    '.oiiwwiiwwiiwo..',
    '.owwwwwwwwwwwo..',
    'oorrrrrrrrrrroo.',
    'owwrwwwwwwwrwwo.',
    'owwrwwiiwwwrwwo.',
    'owwrwwwwwwwrwwo.',
    'oowwwwwwwwwwwoo.',
    '.owwiiwwwiiwwo..',
    '.owwwwwwwwwwwo..',
    '..ooooooooooo...',
    '................',
    '................',
], { o: '#5a5548', w: '#f5f0e1', i: '#8a8478', r: '#e53935' });

sprite(join(IMG, 'marker_boss.png'), [
    '................',
    '....oooooooo....',
    '...oddddddddo...',
    '...oddddddddo...',
    '...oddddddddo...',
    '...oddddddddo...',
    '...orrrrrrrro...',
    '.oooddddddddooo.',
    'oddddddddddddddo',
    'oddddddddddddddo',
    '.oooooooooooooo.',
    '......gggg......',
    '.....gyyyyg.....',
    '.....gyggyg.....',
    '.....gyyyyg.....',
    '......gggg......',
], { o: '#111122', d: '#2a2a3e', r: '#e53935', g: '#7a5a10', y: '#f5c842' });

// Logo masthead — 320×160 (MainMenu displays at 320×160).
{
    const c = canvas(320, 160);
    const CREAM = hex('#f4ecd8'), BLACK = hex('#1a1a12'), RED = hex('#c0392b'), GOLD = hex('#c79a20');
    c.rect(0, 0, 320, 160, BLACK);
    c.rect(4, 4, 312, 152, CREAM);
    c.rect(8, 8, 304, 144, CREAM);
    // inner frame
    for (let x = 8; x < 312; x++) { c.set(x, 8, BLACK); c.set(x, 151, BLACK); }
    for (let y = 8; y < 152; y++) { c.set(8, y, BLACK); c.set(311, y, BLACK); }
    // masthead rules
    c.rect(16, 30, 288, 2, BLACK);
    c.rect(16, 128, 288, 2, BLACK);
    // title
    const s = 7;
    const l1 = 'BARREN', l2 = 'WUFFETT';
    drawText(c, l1, Math.floor((320 - textWidth(l1, s)) / 2), 40, s, BLACK);
    drawText(c, l2, Math.floor((320 - textWidth(l2, s)) / 2), 82, s, BLACK);
    // red accent underline under WUFFETT
    c.rect(Math.floor((320 - textWidth(l2, s)) / 2), 120, textWidth(l2, s), 3, RED);
    // corner coins
    for (const [cx, cy] of [[24, 19], [296, 19], [24, 140], [296, 140]]) {
        for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) {
            if (Math.hypot(x, y) <= 5) c.set(cx + x, cy + y, GOLD);
        }
    }
    c.write(join(IMG, 'logo.png'));
}

// ── Phase 4 (L1E-05): characterful route houses — 48×64, procedurally drawn ──
// Standard geometry so the scene can place the neighbor at the same spot for
// every house: door center x=24, door bottom y=58 (5 distinct looks otherwise).
function drawHouse(path, cfg) {
    const c = canvas(48, 64);
    const OUT = hex('#2a2320');
    const wall = hex(cfg.wall), wallD = hex(cfg.wallShade);
    const roof = hex(cfg.roof), roofD = hex(cfg.roofShade);
    const trim = hex(cfg.trim), glass = hex('#9fd8e8'), glassD = hex('#5a9ab0');
    const doorC = hex(cfg.door);

    // Walls: x 4..43, y roofBase..58
    const roofBase = cfg.flatRoof ? 18 : 24;
    for (let y = roofBase; y <= 58; y++) for (let x = 4; x <= 43; x++) {
        c.set(x, y, (y % 8 < 4) === ((x % 16) < 8) && cfg.pattern ? wallD : wall);
    }
    // Wall outline
    for (let y = roofBase; y <= 58; y++) { c.set(4, y, OUT); c.set(43, y, OUT); }
    for (let x = 4; x <= 43; x++) c.set(x, 58, OUT);

    if (cfg.flatRoof) {
        // Flat roof with parapet
        c.rect(2, 14, 44, 4, roof);
        for (let x = 2; x <= 45; x++) { c.set(x, 13, OUT); c.set(x, 18, OUT); }
        c.set(2, 14, OUT); c.set(45, 14, OUT);
    } else {
        // Pitched roof: apex (23/24, 8) down to eaves (0/47, 24)
        for (let y = 8; y <= 24; y++) {
            const half = Math.floor(((y - 8) / 16) * 24);
            for (let x = 23 - half; x <= 24 + half; x++) {
                c.set(x, y, (x < 24 - half + 3) ? roofD : roof);
            }
            c.set(23 - half, y, OUT); c.set(24 + half, y, OUT);
        }
        for (let x = 0; x <= 47; x++) c.set(x, 24, OUT);
    }
    // Chimney on some houses
    if (cfg.chimney) { c.rect(34, 6, 6, 12, wallD); c.rect(33, 5, 8, 2, OUT); }

    // Door: center x=24 → x 19..29, y 42..57, with frame + knob + step
    c.rect(18, 41, 13, 1, OUT);
    c.rect(18, 41, 1, 17, OUT); c.rect(30, 41, 1, 17, OUT);
    c.rect(19, 42, 11, 16, doorC);
    c.set(27, 50, hex('#f5c842')); // knob
    c.rect(17, 58, 15, 2, hex('#8a8478'));  // step
    // Windows: one each side of the door
    for (const wx of [8, 35]) {
        c.rect(wx - 1, 33, 8, 8, OUT);
        c.rect(wx, 34, 6, 6, glass);
        c.set(wx + 1, 35, glassD); c.set(wx + 4, 38, glassD);
        c.rect(wx - 1, 36, 8, 1, OUT); c.rect(wx + 2, 33, 1, 8, OUT);
        if (cfg.flowerBox) c.rect(wx - 1, 41, 8, 2, hex('#c0392b'));
    }
    // Upper window (pitched roofs only)
    if (!cfg.flatRoof && cfg.atticWindow) {
        c.rect(21, 14, 6, 6, OUT); c.rect(22, 15, 4, 4, glass);
    }
    // Mailbox on a post (right of the step) or porch awning
    if (cfg.mailbox) {
        c.rect(38, 50, 2, 8, hex('#6b4a2a'));
        c.rect(35, 46, 8, 5, hex(cfg.mailboxColor ?? '#c0392b'));
        c.rect(35, 46, 8, 1, OUT); c.rect(35, 50, 8, 1, OUT);
        c.set(42, 47, hex('#f5c842'));
    } else {
        // Porch awning over the door
        c.rect(15, 38, 19, 3, trim);
        c.rect(15, 38, 19, 1, OUT);
        c.rect(16, 41, 1, 4, OUT); c.rect(32, 41, 1, 4, OUT);
    }
    c.write(path);
}
drawHouse(join(IMG, 'house_01.png'), { wall: '#c65b4a', wallShade: '#a84836', roof: '#7a4a6a', roofShade: '#5e3852', trim: '#f4ecd8', door: '#5a3a1a', mailbox: true, mailboxColor: '#2e6fa8', pattern: true, chimney: true });
drawHouse(join(IMG, 'house_02.png'), { wall: '#6a9ac4', wallShade: '#527ba0', roof: '#3a4a6e', roofShade: '#2c3854', trim: '#f4ecd8', door: '#7a3020', mailbox: false, atticWindow: true });
drawHouse(join(IMG, 'house_03.png'), { wall: '#8fbf6a', wallShade: '#71a050', roof: '#6b4a2a', roofShade: '#523822', trim: '#f4ecd8', door: '#3a2a5a', mailbox: true, flowerBox: true });
drawHouse(join(IMG, 'house_04.png'), { wall: '#e8d8a8', wallShade: '#c8b888', roof: '#c0392b', roofShade: '#96281c', trim: '#5a3a1a', door: '#2e6fa8', mailbox: false, atticWindow: true, chimney: true });
drawHouse(join(IMG, 'house_05.png'), { wall: '#9a9aa8', wallShade: '#7c7c8a', roof: '#4a4a58', roofShade: '#38384a', trim: '#f5c842', door: '#6b1f1f', mailbox: true, flatRoof: true, pattern: true });

// Neighbor at the door — 16×16 little townsperson
sprite(join(IMG, 'neighbor.png'), [
    '....oooo........',
    '...ohhhho.......',
    '..ohhhhhho......',
    '..ossssssso.....',
    '..osespseso.....',
    '..ossssssso.....',
    '...osmmso.......',
    '..occccccco.....',
    '.ochccccchco....',
    '.ochccccchco....',
    '..occccccco.....',
    '...opppppo......',
    '...oppoppo......',
    '...oppoppo......',
    '..oddo..oddo....',
    '................',
], { o: '#2a2320', h: '#6b4a2a', s: '#e8b88a', e: '#2a2320', p: '#3a4a6e', m: '#c06a5a', c: '#c9564a', d: '#5a3a1a' });

// Composure heart — 16×16 (boss fight HP, Phase 4 L1E-06)
sprite(join(IMG, 'heart.png'), [
    '................',
    '..ooo....ooo....',
    '.orrro..orrro...',
    'orrhrrooorrrro..',
    'orhhrrrrrrrrro..',
    'orrrrrrrrrrrro..',
    'orrrrrrrrrrrro..',
    '.orrrrrrrrrro...',
    '..orrrrrrrro....',
    '...orrrrrro.....',
    '....orrrro......',
    '.....orro.......',
    '......oo........',
    '................',
    '................',
    '................',
], { o: '#5a1520', r: '#e0393e', h: '#ff8a8a' });

// Thrown paper — 12×8 rolled newspaper (side view)
sprite(join(IMG, 'paper_throw.png'), [
    '............',
    '..oooooooo..',
    '.owwwwwwwwo.',
    'owiwwwwwiwwo',
    'owwwwiwwwwo.',
    '.owwwwwwwo..',
    '..ooooooo...',
    '............',
], { o: '#5a5548', w: '#f5f0e1', i: '#8a8478' });

// ═════════════════════════════════════════════════════════════════════════════
// SFX — synthesized WAVs (22050 Hz mono 16-bit)
// ═════════════════════════════════════════════════════════════════════════════
const RATE = 22050;
function writeWav(path, samples, rate = RATE) {
    const n = samples.length;
    const buf = Buffer.alloc(44 + n * 2);
    buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8);
    buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
    buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
    buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
    for (let i = 0; i < n; i++) {
        const v = Math.max(-1, Math.min(1, samples[i]));
        buf.writeInt16LE((v * 32767) | 0, 44 + i * 2);
    }
    writeFileSync(path, buf);
    console.log(`wav  ${path.replace(ROOT, '.')}  ${(n / rate).toFixed(2)}s  ${buf.length}B`);
}
function silence(dur, rate = RATE) { return new Float32Array(Math.floor(dur * rate)); }
/** Tone with linear pitch glide, attack/exp-decay envelope. wave: square|triangle|sine|noise */
function tone({ freq, freqEnd = null, dur, vol = 0.5, wave = 'square', decay = 6, attack = 0.004, rate = RATE }) {
    const n = Math.floor(dur * rate);
    const out = new Float32Array(n);
    let phase = 0;
    const f1 = freqEnd ?? freq;
    for (let i = 0; i < n; i++) {
        const tt = i / n;
        const f = freq + (f1 - freq) * tt;
        phase += f / rate;
        let s;
        const p = phase % 1;
        if (wave === 'square') s = p < 0.5 ? 1 : -1;
        else if (wave === 'triangle') s = 4 * Math.abs(p - 0.5) - 1;
        else if (wave === 'noise') s = Math.random() * 2 - 1;
        else s = Math.sin(2 * Math.PI * p);
        const env = Math.min(1, (i / rate) / attack) * Math.exp(-decay * tt);
        out[i] = s * vol * env;
    }
    return out;
}
function mix(...tracks) {
    const n = Math.max(...tracks.map(t => t.length));
    const out = new Float32Array(n);
    for (const t of tracks) for (let i = 0; i < t.length; i++) out[i] += t[i];
    return out;
}
function concat(...tracks) {
    const n = tracks.reduce((a, t) => a + t.length, 0);
    const out = new Float32Array(n);
    let o = 0;
    for (const t of tracks) { out.set(t, o); o += t.length; }
    return out;
}
// deterministic noise (seeded LCG so re-runs are byte-identical)
let seed = 0x1234567;
function rand() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
function noiseBurst({ dur, vol = 0.5, decay = 10, rate = RATE }) {
    const n = Math.floor(dur * rate);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        out[i] = (rand() * 2 - 1) * vol * Math.exp(-decay * (i / n));
    }
    return out;
}

// whack: noise thwack + low thump
writeWav(join(AUD, 'sfx_whack.wav'), mix(
    noiseBurst({ dur: 0.09, vol: 0.55, decay: 9 }),
    tone({ freq: 160, freqEnd: 70, dur: 0.09, vol: 0.5, wave: 'sine', decay: 7 }),
));
// coin: classic two-tone ding (B5 → E6)
writeWav(join(AUD, 'sfx_coin_ding.wav'), concat(
    tone({ freq: 987.77, dur: 0.06, vol: 0.35, wave: 'square', decay: 2 }),
    tone({ freq: 1318.51, dur: 0.17, vol: 0.35, wave: 'square', decay: 5 }),
));
// dog bite: two gruff downward growl-barks
writeWav(join(AUD, 'sfx_dog_bite.wav'), concat(
    mix(tone({ freq: 220, freqEnd: 120, dur: 0.09, vol: 0.5, wave: 'square', decay: 5 }),
        noiseBurst({ dur: 0.09, vol: 0.22, decay: 6 })),
    silence(0.03),
    mix(tone({ freq: 180, freqEnd: 90, dur: 0.12, vol: 0.5, wave: 'square', decay: 5 }),
        noiseBurst({ dur: 0.12, vol: 0.2, decay: 6 })),
));
// purchase: rising register arpeggio C5 E5 G5 C6
writeWav(join(AUD, 'sfx_purchase.wav'), concat(
    tone({ freq: 523.25, dur: 0.07, vol: 0.32, decay: 3 }),
    tone({ freq: 659.25, dur: 0.07, vol: 0.32, decay: 3 }),
    tone({ freq: 783.99, dur: 0.07, vol: 0.32, decay: 3 }),
    tone({ freq: 1046.5, dur: 0.16, vol: 0.34, decay: 4 }),
));
// hospital: comic sad-trombone descent E4 → Eb4 → D4 with wobble
writeWav(join(AUD, 'sfx_hospital.wav'), concat(
    tone({ freq: 329.63, freqEnd: 320, dur: 0.18, vol: 0.34, wave: 'triangle', decay: 2 }),
    tone({ freq: 311.13, freqEnd: 300, dur: 0.18, vol: 0.34, wave: 'triangle', decay: 2 }),
    tone({ freq: 293.66, freqEnd: 233, dur: 0.42, vol: 0.36, wave: 'triangle', decay: 3 }),
));
// streak bonus: fanfare C5 G5 C6 + E6/G6 chord
writeWav(join(AUD, 'sfx_streak_bonus.wav'), concat(
    tone({ freq: 523.25, dur: 0.08, vol: 0.3, decay: 2 }),
    tone({ freq: 783.99, dur: 0.08, vol: 0.3, decay: 2 }),
    tone({ freq: 1046.5, dur: 0.1, vol: 0.3, decay: 2 }),
    mix(tone({ freq: 1318.51, dur: 0.3, vol: 0.22, decay: 4 }),
        tone({ freq: 1567.98, dur: 0.3, vol: 0.18, decay: 4 })),
));

// ── Phase 4 SFX ──────────────────────────────────────────────────────────────
// throw: rising whoosh (noise swelling then decaying)
{
    const n = Math.floor(0.16 * RATE);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const tt = i / n;
        const env = tt < 0.35 ? tt / 0.35 : Math.exp(-6 * (tt - 0.35));
        out[i] = (rand() * 2 - 1) * 0.35 * env;
    }
    writeWav(join(AUD, 'sfx_throw.wav'), out);
}
// thunk: porch thud — low sine + tiny click
writeWav(join(AUD, 'sfx_thunk.wav'), mix(
    tone({ freq: 110, freqEnd: 70, dur: 0.09, vol: 0.55, wave: 'sine', decay: 8 }),
    noiseBurst({ dur: 0.03, vol: 0.25, decay: 14 }),
));
// miss: soft deflating blip
writeWav(join(AUD, 'sfx_miss.wav'), tone({ freq: 420, freqEnd: 180, dur: 0.14, vol: 0.22, wave: 'triangle', decay: 5 }));
// hurt: sharp downward zap (lure contact / bought high)
writeWav(join(AUD, 'sfx_hurt.wav'), mix(
    tone({ freq: 640, freqEnd: 140, dur: 0.13, vol: 0.4, wave: 'square', decay: 6 }),
    noiseBurst({ dur: 0.07, vol: 0.2, decay: 9 }),
));
// boss_hit: whack thud + cash-register double ding
writeWav(join(AUD, 'sfx_boss_hit.wav'), concat(
    mix(noiseBurst({ dur: 0.07, vol: 0.5, decay: 9 }),
        tone({ freq: 150, freqEnd: 80, dur: 0.07, vol: 0.5, wave: 'sine', decay: 7 })),
    tone({ freq: 1318.51, dur: 0.06, vol: 0.3, decay: 3 }),
    tone({ freq: 1760, dur: 0.12, vol: 0.3, decay: 5 }),
));
// win: ascending fanfare + chord
writeWav(join(AUD, 'sfx_win.wav'), concat(
    tone({ freq: 523.25, dur: 0.09, vol: 0.3, decay: 2 }),
    tone({ freq: 659.25, dur: 0.09, vol: 0.3, decay: 2 }),
    tone({ freq: 783.99, dur: 0.09, vol: 0.3, decay: 2 }),
    tone({ freq: 1046.5, dur: 0.11, vol: 0.32, decay: 2 }),
    mix(tone({ freq: 1046.5, dur: 0.45, vol: 0.2, decay: 3 }),
        tone({ freq: 1318.51, dur: 0.45, vol: 0.18, decay: 3 }),
        tone({ freq: 1567.98, dur: 0.45, vol: 0.15, decay: 3 })),
));

// bgm: gentle 4-bar C-pentatonic loop @ 100bpm, soft triangle lead + low root.
{
    const BPM = 100, rate = 11025;
    const eighth = 60 / BPM / 2;
    const N = { C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.0, A4: 440.0, C5: 523.25, D5: 587.33, E5: 659.25, G3: 196.0, A3: 220.0, F3: 174.61, C3: 130.81 };
    const lead = ['E4', 'G4', 'A4', 'C5', 'A4', 'G4', 'E4', 'D4',
                  'C4', 'E4', 'G4', 'E4', 'D4', 'C4', 'D4', 'E4',
                  'G4', 'A4', 'C5', 'D5', 'C5', 'A4', 'G4', 'E4',
                  'D4', 'E4', 'G4', 'A4', 'G4', 'E4', 'D4', 'C4'];
    const bass = ['C3', 'G3', 'A3', 'F3']; // one per bar
    const leadTrack = concat(...lead.map(n =>
        tone({ freq: N[n], dur: eighth, vol: 0.16, wave: 'triangle', decay: 1.2, attack: 0.01, rate })));
    const bassTrack = concat(...bass.map(n =>
        tone({ freq: N[n], dur: eighth * 8, vol: 0.11, wave: 'sine', decay: 0.8, attack: 0.02, rate })));
    writeWav(join(AUD, 'bgm_overworld.wav'), mix(leadTrack, bassTrack), rate);
}

console.log('done.');
