/**
 * RouteScoring — pure results computation for the paper-route mini-game
 * (Phase 4, L1E-05). No Phaser.
 *
 * The route ends on an explicit results splash: delivered count, accuracy %,
 * a letter grade, and NEW BEST detection — this seam owns those rules so the
 * scene stays presentation-only and the tuning is unit-testable.
 */

export const ROUTE_TARGET_DELIVERIES = 8;
export const ROUTE_TOTAL_PAPERS = 10;

export interface RouteResults {
    delivered: number;
    throws: number;
    perfects: number;
    /** 0-100, rounded; 100 when no throws (nothing wasted) */
    accuracy: number;
    grade: 'S' | 'A' | 'B' | 'C' | 'D';
    isNewBest: boolean;
}

/**
 * Grade table (delivered out of ROUTE_TARGET_DELIVERIES):
 *   S — all delivered, accuracy ≥ 90 and ≥ 4 PERFECTs (clean sweep)
 *   A — all delivered, accuracy ≥ 75
 *   B — ≥ 6 delivered
 *   C — ≥ 4 delivered
 *   D — everything else
 */
export function computeRouteResults(
    delivered: number,
    throws: number,
    perfects: number,
    previousBest: number,
): RouteResults {
    const accuracy = throws === 0 ? 100 : Math.round((delivered / throws) * 100);
    let grade: RouteResults['grade'];
    if (delivered >= ROUTE_TARGET_DELIVERIES && accuracy >= 90 && perfects >= 4) grade = 'S';
    else if (delivered >= ROUTE_TARGET_DELIVERIES && accuracy >= 75) grade = 'A';
    else if (delivered >= 6) grade = 'B';
    else if (delivered >= 4) grade = 'C';
    else grade = 'D';
    return {
        delivered,
        throws,
        perfects,
        accuracy,
        grade,
        isNewBest: delivered > previousBest,
    };
}
