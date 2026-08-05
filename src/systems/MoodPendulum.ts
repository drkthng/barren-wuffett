/**
 * MoodPendulum — Mr. Market's swinging mood (Phase 4, L1E-06). Pure TS.
 *
 * The whole boss redesign hangs on this seam: mood oscillates sinusoidally
 * between GREED (-1) and PANIC (+1); the fight is a READ of that state —
 *   - state 'greed'  (mood ≤ -threshold): he inflates, hurls FOMO lures;
 *     whacking him now punishes the player ("bought high").
 *   - state 'panic'  (mood ≥ +threshold): the strike window — whacks land.
 *   - state 'neutral' between thresholds: transition, nothing lands.
 *
 * Each landed hit calls speedUp() — the market gets more erratic (shorter
 * period), so later strike windows are shorter in real time. Deterministic:
 * tick(dtMs) only; no Date.now(), no RNG — fully unit-testable.
 */

export type MoodState = 'greed' | 'neutral' | 'panic';

export class MoodPendulum {
    private periodMs: number;
    private readonly threshold: number;
    private readonly minPeriodMs: number;
    /** phase in [0,1): 0 → mood 0 rising toward panic */
    private phase: number;

    constructor(opts?: { periodMs?: number; threshold?: number; minPeriodMs?: number; startPhase?: number }) {
        this.periodMs    = opts?.periodMs    ?? 8000;
        // 0.5 → the panic window is exactly 1/3 of the cycle (~2.7s at 8s):
        // long enough to sprint in from mid-arena, short enough to reward
        // pre-positioning as the meter rises (the anticipation read).
        this.threshold   = opts?.threshold   ?? 0.5;
        this.minPeriodMs = opts?.minPeriodMs ?? 3500;
        // default start: deep in greed so the fight opens with lures to read
        this.phase       = opts?.startPhase  ?? 0.75;
    }

    /** Advance the pendulum. dtMs must be ≥ 0. */
    tick(dtMs: number): void {
        this.phase = (this.phase + dtMs / this.periodMs) % 1;
    }

    /** Mood in [-1, +1]: -1 = full greed, +1 = full panic. */
    get mood(): number {
        return Math.sin(this.phase * Math.PI * 2);
    }

    get state(): MoodState {
        const m = this.mood;
        if (m >= this.threshold) return 'panic';
        if (m <= -this.threshold) return 'greed';
        return 'neutral';
    }

    /** True exactly when a whack would land (the strike window). */
    canStrike(): boolean {
        return this.state === 'panic';
    }

    /**
     * After a landed hit the market gets faster/more erratic.
     * Period shrinks by `factor` but never below minPeriodMs.
     */
    speedUp(factor = 0.8): void {
        this.periodMs = Math.max(this.minPeriodMs, this.periodMs * factor);
    }

    /** Current full-cycle period (exposed for lure cadence + tests). */
    get period(): number {
        return this.periodMs;
    }
}
