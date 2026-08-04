/**
 * Phase 3.1 (FEEL-05): diagonal movement speed regression.
 *
 * Root cause guarded here: raw ±80 on both axes moved the player at √2 × 80
 * ≈ 113 px/s on diagonals — 41% faster than walking straight.
 */
import { describe, it, expect } from 'vitest';
import { normalizeVelocity } from '../src/systems/Movement';

describe('normalizeVelocity — diagonals match cardinal speed', () => {

    it('cardinal movement is unchanged', () => {
        expect(normalizeVelocity(80, 0)).toEqual({ vx: 80, vy: 0 });
        expect(normalizeVelocity(0, -80)).toEqual({ vx: 0, vy: -80 });
        expect(normalizeVelocity(0, 0)).toEqual({ vx: 0, vy: 0 });
    });

    it('diagonal magnitude equals cardinal magnitude', () => {
        const { vx, vy } = normalizeVelocity(80, 80);
        expect(Math.hypot(vx, vy)).toBeCloseTo(80, 5);
    });

    it('all four diagonals normalize and keep their signs', () => {
        for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
            const { vx, vy } = normalizeVelocity(80 * sx, 80 * sy);
            expect(Math.sign(vx)).toBe(sx);
            expect(Math.sign(vy)).toBe(sy);
            expect(Math.hypot(vx, vy)).toBeCloseTo(80, 5);
        }
    });

});
