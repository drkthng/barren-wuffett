/**
 * Wave 0: Art-asset structural assertions (ART-01..04)
 *
 * Node-only tests — NO Phaser import, NO WebGL required.
 * Guards structural invariants for the whole Phase 02.1 visual pass:
 *
 *   ART-01  (Plan 02.1-01 — this plan): tileset + GROUND_DATA/DECO_DATA + dog-gap corridor
 *   ART-02  (Plan 02.1-02):             character spritesheets + dimensions
 *   ART-03  (Plan 02.1-02/03):          ASSET-MANIFEST.md provenance file
 *   ART-04  (Plan 02.1-03):             STYLE-GUIDE.md document
 *
 * Dog patrol corridor constraint (must stay -1 in DECO_DATA):
 *   Rows 13–20, gap columns 4–5 and 12–17
 *   This matches the comment in src/data/levels/level-01.ts.
 *
 * Pattern: tests/og-tags.test.ts (readFileSync + describe/it/expect node-fs)
 */
import { describe, it, expect } from 'vitest';
import { existsSync, statSync, openSync, readSync, closeSync } from 'fs';
import { resolve } from 'path';

/**
 * Read the first 24 bytes of a PNG file and extract width/height from the IHDR chunk.
 * PNG spec: bytes 16-19 = width (big-endian uint32), bytes 20-23 = height.
 */
function getPngDimensions(filePath: string): { width: number; height: number } {
    const buf = Buffer.alloc(24);
    const fd = openSync(filePath, 'r');
    readSync(fd, buf, 0, 24, 0);
    closeSync(fd);
    return {
        width:  buf.readUInt32BE(16),
        height: buf.readUInt32BE(20),
    };
}

// ── ART-01: Tileset asset + tile-data arrays + dog-patrol corridor ────────────

describe('ART-01: Kenney Tiny Town tileset and level-01 tile arrays', () => {

    it('tiny_town_tiles.png exists in public/assets/tilesets/', () => {
        const p = resolve(__dirname, '../public/assets/tilesets/tiny_town_tiles.png');
        expect(existsSync(p)).toBe(true);
    });

    it('tiny_town_tiles.png is > 200 bytes (not a stub)', () => {
        const p = resolve(__dirname, '../public/assets/tilesets/tiny_town_tiles.png');
        expect(statSync(p).size).toBeGreaterThan(200);
    });

    it('LEVEL_01_MANIFEST.tilemapKey is "tiny_town_tiles"', async () => {
        const { LEVEL_01_MANIFEST } = await import('../src/data/levels/level-01.js');
        expect(LEVEL_01_MANIFEST.tilemapKey).toBe('tiny_town_tiles');
    });

    it('tilemapKey PNG exists in public/assets/tilesets/', async () => {
        const { LEVEL_01_MANIFEST } = await import('../src/data/levels/level-01.js');
        const p = resolve(__dirname, `../public/assets/tilesets/${LEVEL_01_MANIFEST.tilemapKey}.png`);
        expect(existsSync(p)).toBe(true);
    });

    it('GROUND_DATA is 52 rows × 30 cols', async () => {
        const { GROUND_DATA } = await import('../src/data/levels/level-01.js');
        expect(GROUND_DATA).toHaveLength(52);
        expect(GROUND_DATA[0]).toHaveLength(30);
    });

    it('DECO_DATA is 52 rows × 30 cols', async () => {
        const { DECO_DATA } = await import('../src/data/levels/level-01.js');
        expect(DECO_DATA).toHaveLength(52);
        expect(DECO_DATA[0]).toHaveLength(30);
    });

    it('GROUND_DATA has no -1 cells (every ground cell is a real tile)', async () => {
        const { GROUND_DATA } = await import('../src/data/levels/level-01.js');
        for (let row = 0; row < GROUND_DATA.length; row++) {
            for (let col = 0; col < GROUND_DATA[row].length; col++) {
                if (GROUND_DATA[row][col] === -1) {
                    throw new Error(`GROUND_DATA[${row}][${col}] is -1 — ground layer must never use -1`);
                }
            }
        }
        expect(true).toBe(true);
    });

    // Dog patrol corridor assertion:
    // DECO_DATA rows 13-20 at gap columns 4-5 and 12-17 MUST be -1.
    // These match the comment in level-01.ts: "Dog patrol gap: rows 13-20, cols 4-5 and 12-17"
    it('dog patrol corridor (rows 13–20, cols 4–5) are -1 in DECO_DATA', async () => {
        const { DECO_DATA } = await import('../src/data/levels/level-01.js');
        for (let row = 13; row <= 20; row++) {
            expect(DECO_DATA[row][4], `DECO_DATA[${row}][4]`).toBe(-1);
            expect(DECO_DATA[row][5], `DECO_DATA[${row}][5]`).toBe(-1);
        }
    });

    it('dog patrol corridor (rows 13–20, cols 12–17) are -1 in DECO_DATA', async () => {
        const { DECO_DATA } = await import('../src/data/levels/level-01.js');
        for (let row = 13; row <= 20; row++) {
            for (let col = 12; col <= 17; col++) {
                expect(DECO_DATA[row][col], `DECO_DATA[${row}][${col}]`).toBe(-1);
            }
        }
    });

});

// ── ART-02: Character spritesheets exist and are not placeholder stubs ────────

describe('ART-02: character spritesheets exist and are not placeholders', () => {

    // All character PNGs that ship with Phase 02 (Plan 02.1-02 delivers these)
    const chars = [
        'player',
        'npc_grandpa',
        'npc_store_clerk',
        'npc_rival',
        'dog',
        'boss_mr_market_greed',
        'boss_mr_market_panic',
    ];

    for (const name of chars) {
        it(`${name}.png exists in public/assets/images/ and is > 200 bytes`, () => {
            const p = resolve(__dirname, `../public/assets/images/${name}.png`);
            expect(existsSync(p)).toBe(true);
            expect(statSync(p).size).toBeGreaterThan(200);
        });
    }

    it('player.png is 128×16 (8 frames @ 16×16 — 4 directions × 2 walk frames)', () => {
        const p = resolve(__dirname, '../public/assets/images/player.png');
        const dims = getPngDimensions(p);
        expect(dims.width).toBe(128);
        expect(dims.height).toBe(16);
    });

});

// ── FEEL-02/03: Phase 3.1 — interactive-object art + SFX are real, never stubs ──
//
// Phase 3 shipped its entire feature layer with 1×1-pixel PNGs and 44-byte OGG
// headers, and this suite didn't catch it because those files were not on the
// checked list. Every interactive sprite is now asserted by EXACT dimensions
// (a 1×1 placeholder can never pass) and every SFX by RIFF magic + real length.
describe('FEEL-02: interactive sprites are real pixel art with exact dimensions', () => {

    const sprites: Array<[string, number, number]> = [
        ['bush',                   16,  16],
        ['leaf_particle',           8,   8],
        ['newspaper_swing',        96,  32],
        ['ui_newspaper_button',    48,  48],
        ['item_newspaper_upgrade', 16,  16],
        ['item_helmet',            16,  16],
        ['item_bus_pass',          16,  16],
        ['item_snack',             16,  16],
        ['bw_monogram',            16,  16],
        ['marker_route',           16,  16],
        ['marker_boss',            16,  16],
        ['logo',                  320, 160],
        // Phase 4 (L1E-05): characterful route houses + neighbor + paper
        ['house_01',               48,  64],
        ['house_02',               48,  64],
        ['house_03',               48,  64],
        ['house_04',               48,  64],
        ['house_05',               48,  64],
        ['neighbor',               16,  16],
        ['paper_throw',            12,   8],
        ['heart',                  16,  16],
    ];

    for (const [name, w, h] of sprites) {
        it(`${name}.png is exactly ${w}×${h} (not a 1×1 placeholder)`, () => {
            const p = resolve(__dirname, `../public/assets/images/${name}.png`);
            expect(existsSync(p), `${name}.png missing`).toBe(true);
            const dims = getPngDimensions(p);
            expect(dims.width,  `${name}.png width`).toBe(w);
            expect(dims.height, `${name}.png height`).toBe(h);
        });
    }

});

describe('FEEL-03: SFX + BGM are real decodable audio, never stub headers', () => {

    const sfx = [
        'sfx_whack', 'sfx_coin_ding', 'sfx_dog_bite',
        'sfx_purchase', 'sfx_hospital', 'sfx_streak_bonus',
        'bgm_overworld',
        // Phase 4: set-piece SFX
        'sfx_throw', 'sfx_thunk', 'sfx_miss',
        'sfx_hurt', 'sfx_boss_hit', 'sfx_win',
    ];

    for (const name of sfx) {
        it(`${name}.wav exists, has RIFF/WAVE magic, and carries > 1KB of samples`, () => {
            const p = resolve(__dirname, `../public/assets/audio/${name}.wav`);
            expect(existsSync(p), `${name}.wav missing`).toBe(true);
            expect(statSync(p).size).toBeGreaterThan(1024);
            const buf = Buffer.alloc(12);
            const fd = openSync(p, 'r');
            readSync(fd, buf, 0, 12, 0);
            closeSync(fd);
            expect(buf.toString('ascii', 0, 4)).toBe('RIFF');
            expect(buf.toString('ascii', 8, 12)).toBe('WAVE');
        });
    }

});

// ── ART-03: Provenance manifest exists ───────────────────────────────────────

describe('ART-03: provenance manifest exists', () => {

    it('ASSET-MANIFEST.md exists in public/assets/ and is non-empty', () => {
        const p = resolve(__dirname, '../public/assets/ASSET-MANIFEST.md');
        expect(existsSync(p)).toBe(true);
        expect(statSync(p).size).toBeGreaterThan(0);
    });

});

// ── ART-04: Style guide exists ───────────────────────────────────────────────

describe('ART-04: style guide exists', () => {

    it('STYLE-GUIDE.md exists in public/assets/ and is non-empty', () => {
        const p = resolve(__dirname, '../public/assets/STYLE-GUIDE.md');
        expect(existsSync(p)).toBe(true);
        expect(statSync(p).size).toBeGreaterThan(0);
    });

});
