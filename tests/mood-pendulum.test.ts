/**
 * Phase 4 (L1E-06): MoodPendulum pure seam — the boss's readable mood swing.
 */
import { describe, it, expect } from 'vitest';
import { MoodPendulum } from '../src/systems/MoodPendulum';

describe('MoodPendulum — oscillation and states', () => {

    it('sweeps greed → neutral → panic over one period', () => {
        const p = new MoodPendulum({ periodMs: 1000, startPhase: 0 });
        // phase 0 → mood 0 (neutral)
        expect(p.state).toBe('neutral');
        p.tick(250);                      // quarter period → mood +1
        expect(p.mood).toBeCloseTo(1, 5);
        expect(p.state).toBe('panic');
        expect(p.canStrike()).toBe(true);
        p.tick(500);                      // three quarters → mood -1
        expect(p.mood).toBeCloseTo(-1, 5);
        expect(p.state).toBe('greed');
        expect(p.canStrike()).toBe(false);
        p.tick(250);                      // full cycle → back to 0
        expect(p.mood).toBeCloseTo(0, 5);
        expect(p.state).toBe('neutral');
    });

    it('threshold splits the three states symmetrically', () => {
        const p = new MoodPendulum({ periodMs: 1000, threshold: 0.5, startPhase: 0 });
        // mood = sin(2π·t/1000); sin = 0.5 at t = 1000/12 ≈ 83.3
        p.tick(84);
        expect(p.state).toBe('panic');
        const q = new MoodPendulum({ periodMs: 1000, threshold: 0.5, startPhase: 0 });
        q.tick(82);
        expect(q.state).toBe('neutral');
    });

    it('default start phase opens the fight in greed (lures teach the read first)', () => {
        const p = new MoodPendulum();
        expect(p.state).toBe('greed');
    });

    it('is deterministic — same ticks, same mood', () => {
        const a = new MoodPendulum({ periodMs: 7777 });
        const b = new MoodPendulum({ periodMs: 7777 });
        for (let i = 0; i < 100; i++) { a.tick(16.6); b.tick(16.6); }
        expect(a.mood).toBe(b.mood);
    });

});

describe('MoodPendulum — speedUp (market gets erratic per hit)', () => {

    it('each hit shrinks the period by the factor', () => {
        const p = new MoodPendulum({ periodMs: 8000 });
        p.speedUp(0.8);
        expect(p.period).toBeCloseTo(6400, 5);
        p.speedUp(0.8);
        expect(p.period).toBeCloseTo(5120, 5);
    });

    it('never drops below minPeriodMs (stays humanly readable)', () => {
        const p = new MoodPendulum({ periodMs: 4000, minPeriodMs: 3500 });
        p.speedUp(0.5);
        expect(p.period).toBe(3500);
        p.speedUp(0.5);
        expect(p.period).toBe(3500);
    });

    it('a faster period sweeps states faster after speedUp', () => {
        const p = new MoodPendulum({ periodMs: 1000, startPhase: 0, minPeriodMs: 100 });
        p.speedUp(0.5); // period 500
        p.tick(125);    // quarter of 500 → mood +1
        expect(p.mood).toBeCloseTo(1, 5);
    });

});
