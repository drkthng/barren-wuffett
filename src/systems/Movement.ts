/**
 * Movement — pure velocity helpers (Phase 3.1, FEEL-05)
 *
 * normalizeVelocity: clamps diagonal movement to the same speed as cardinal
 * movement. Without this, holding two axes moved the player at √2 × speed
 * (113 px/s instead of 80), making diagonals the objectively best way to walk.
 */
export function normalizeVelocity(vx: number, vy: number): { vx: number; vy: number } {
    if (vx !== 0 && vy !== 0) {
        const inv = 1 / Math.SQRT2;
        return { vx: vx * inv, vy: vy * inv };
    }
    return { vx, vy };
}
