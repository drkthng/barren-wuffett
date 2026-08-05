/**
 * Phase 4 (L1E-05): RouteScoring pure seam — grade table, accuracy, NEW BEST.
 */
import { describe, it, expect } from 'vitest';
import {
    computeRouteResults, ROUTE_TARGET_DELIVERIES, ROUTE_TOTAL_PAPERS,
} from '../src/systems/RouteScoring';

describe('computeRouteResults — accuracy', () => {

    it('accuracy = delivered/throws rounded to whole %', () => {
        expect(computeRouteResults(8, 10, 0, 0).accuracy).toBe(80);
        expect(computeRouteResults(8, 9, 0, 0).accuracy).toBe(89);
        expect(computeRouteResults(8, 8, 0, 0).accuracy).toBe(100);
    });

    it('zero throws → 100% (nothing wasted), grade D (nothing delivered)', () => {
        const r = computeRouteResults(0, 0, 0, 0);
        expect(r.accuracy).toBe(100);
        expect(r.grade).toBe('D');
    });

});

describe('computeRouteResults — grade table', () => {

    it('S: all delivered, accuracy ≥ 90, ≥ 4 perfects', () => {
        expect(computeRouteResults(8, 8, 4, 0).grade).toBe('S');
        expect(computeRouteResults(8, 8, 8, 0).grade).toBe('S');
    });

    it('A: all delivered but not S-clean (accuracy < 90 or < 4 perfects)', () => {
        expect(computeRouteResults(8, 8, 3, 0).grade).toBe('A');     // too few perfects
        expect(computeRouteResults(8, 10, 8, 0).grade).toBe('A');    // 80% accuracy
    });

    it('B: ≥ 6 delivered; C: ≥ 4; D below', () => {
        expect(computeRouteResults(6, 10, 0, 0).grade).toBe('B');
        expect(computeRouteResults(7, 10, 6, 0).grade).toBe('B');
        expect(computeRouteResults(4, 10, 0, 0).grade).toBe('C');
        expect(computeRouteResults(5, 10, 0, 0).grade).toBe('C');
        expect(computeRouteResults(3, 10, 3, 0).grade).toBe('D');
    });

    it('all-delivered with accuracy < 75 still grades B (dropped out of A)', () => {
        // 8 delivered from 11 throws = 73% — impossible in-game (10 papers) but
        // the table must stay total: falls through to the ≥6-delivered B tier
        expect(computeRouteResults(8, 11, 0, 0).grade).toBe('B');
    });

});

describe('computeRouteResults — NEW BEST detection', () => {

    it('flags only strictly-better delivered counts', () => {
        expect(computeRouteResults(5, 10, 0, 4).isNewBest).toBe(true);
        expect(computeRouteResults(5, 10, 0, 5).isNewBest).toBe(false);
        expect(computeRouteResults(5, 10, 0, 6).isNewBest).toBe(false);
        expect(computeRouteResults(1, 10, 0, 0).isNewBest).toBe(true);   // first run
    });

});

describe('route constants', () => {

    it('10 papers for 8 deliveries — accuracy has real stakes', () => {
        expect(ROUTE_TOTAL_PAPERS).toBe(10);
        expect(ROUTE_TARGET_DELIVERIES).toBe(8);
        expect(ROUTE_TOTAL_PAPERS).toBeGreaterThan(ROUTE_TARGET_DELIVERIES);
    });

});
