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
