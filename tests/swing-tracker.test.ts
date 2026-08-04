/**
 * Phase 3.1 (FEEL-05): one-award-per-swing regression.
 *
 * Root cause guarded here: arcade overlap re-fires its callback every frame the
 * 150ms whack hitbox keeps intersecting a bush, so one swing rolled the prize
 * pack ~5 times (inflating coins, jumping streak pips, triggering the 8-streak
 * bonus after ~2 bushes). SwingTracker admits exactly one hit per (swing, bush).
 */
import { describe, it, expect } from 'vitest';
import { SwingTracker } from '../src/systems/SwingTracker';

describe('SwingTracker — one award per swing per bush', () => {

    it('admits the first hit for a bush', () => {
        const t = new SwingTracker();
        t.beginSwing();
        expect(t.registerHit('bush_01')).toBe(true);
    });

    it('rejects repeated hits for the same bush within one swing (overlap re-fire)', () => {
        const t = new SwingTracker();
        t.beginSwing();
        expect(t.registerHit('bush_01')).toBe(true);
        // ~9 more frames of the 150ms hitbox overlapping the same bush
        for (let frame = 0; frame < 9; frame++) {
            expect(t.registerHit('bush_01')).toBe(false);
        }
    });

    it('admits multiple DIFFERENT bushes in one swing (wide swing hits two)', () => {
        const t = new SwingTracker();
        t.beginSwing();
        expect(t.registerHit('bush_01')).toBe(true);
        expect(t.registerHit('bush_02')).toBe(true);
        expect(t.registerHit('bush_02')).toBe(false);
    });

    it('a new swing re-admits a bush (regrown bushes are whackable again)', () => {
        const t = new SwingTracker();
        t.beginSwing();
        expect(t.registerHit('bush_01')).toBe(true);
        t.beginSwing();
        expect(t.registerHit('bush_01')).toBe(true);
    });

});
