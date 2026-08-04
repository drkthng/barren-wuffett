/**
 * Phase 3.1 (FEEL-05): bush/spawn/gate placement vs. the collision layer.
 *
 * Root cause guarded here: Phase 3 shipped 8 of 14 bushes embedded in collidable
 * DECO tiles (including a SPECIAL milestone bush inside a house), the player
 * spawned on the exact pixel grandpa occupies, and the bus-pass gate stood in
 * open grass that could be walked around. These are pure data invariants —
 * cross-reference them so a map edit can never silently regress them.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { DECO_DATA } from '../src/data/levels/level-01';
import { ECONOMY_DATA } from '../src/data/levels/level-01-economy';

const TILE = 16;
const cellOf = (x: number, y: number) => ({ row: Math.floor(y / TILE), col: Math.floor(x / TILE) });
const isOpen = (row: number, col: number) => DECO_DATA[row]?.[col] === -1;

describe('FEEL-05: every whackable bush sits on an open (non-collidable) cell', () => {

    for (const bush of ECONOMY_DATA.bushes) {
        it(`${bush.id} at (${bush.x},${bush.y}) is reachable`, () => {
            const { row, col } = cellOf(bush.x, bush.y);
            expect(
                isOpen(row, col),
                `${bush.id} sits on DECO_DATA[${row}][${col}] = ${DECO_DATA[row][col]} (collidable)`,
            ).toBe(true);
        });
    }

    it('bushes occupy distinct cells (no stacked bushes)', () => {
        const cells = ECONOMY_DATA.bushes.map(b => {
            const { row, col } = cellOf(b.x, b.y);
            return `${row},${col}`;
        });
        expect(new Set(cells).size).toBe(cells.length);
    });

    it('at least two bushes sit within 6 tiles of the spawn (onboarding practice targets)', () => {
        const near = ECONOMY_DATA.bushes.filter(b =>
            Math.abs(b.x - 96) <= 6 * TILE && Math.abs(b.y - 128) <= 6 * TILE);
        expect(near.length).toBeGreaterThanOrEqual(2);
    });

});

describe('FEEL-05: spawn + gate geometry', () => {

    it('player spawn (96,128) is on open ground, one tile clear of grandpa (96,96)', () => {
        const { row, col } = cellOf(96, 128);
        expect(isOpen(row, col)).toBe(true);
        // grandpa stands at (96,96) — the old spawn placed the player inside him;
        // OverworldScene SPAWN_X/SPAWN_Y must not regress to the NPC's cell
        const src = readFileSync(resolve(__dirname, '../src/game/scenes/OverworldScene.ts'), 'utf8');
        expect(src).toMatch(/const SPAWN_X = 96;/);
        expect(src).toMatch(/const SPAWN_Y = 128;/);
    });

    it('the gate cells (rows 6-7, col 20) are open — the pocket entrance', () => {
        expect(isOpen(6, 20)).toBe(true);
        expect(isOpen(7, 20)).toBe(true);
    });

    it('the east reward pocket is sealed except for the gate (no walk-around)', () => {
        // West wall: col 20 rows 5 and 8 fenced (gate occupies rows 6-7)
        expect(isOpen(5, 20)).toBe(false);
        expect(isOpen(8, 20)).toBe(false);
        // North edge: row 4, cols 21-29 all blocked
        for (let col = 21; col <= 29; col++) {
            expect(isOpen(4, col), `north edge DECO_DATA[4][${col}]`).toBe(false);
        }
        // South edge: row 9, cols 20-29 all blocked
        for (let col = 20; col <= 29; col++) {
            expect(isOpen(9, col), `south edge DECO_DATA[9][${col}]`).toBe(false);
        }
    });

    it('gateBarrier rect covers the gate cells exactly (16 wide, col 20)', () => {
        const g = ECONOMY_DATA.gateBarrier;
        expect(g.x - g.w / 2).toBe(20 * TILE);       // left edge on col 20
        expect(g.x + g.w / 2).toBe(21 * TILE);       // right edge
        expect(g.y - g.h / 2).toBe(6 * TILE);        // top edge on row 6
        expect(g.y + g.h / 2).toBe(8 * TILE);        // bottom edge after row 7
    });

});
