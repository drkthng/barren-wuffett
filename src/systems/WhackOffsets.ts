/**
 * WhackOffsets — directional hitbox offset lookup (Phase 3, L1E-01)
 *
 * Pure TypeScript module — NO Phaser import. Importable in the vitest node env.
 *
 * Implements D-02: The directional hitbox is placed in front of the player based
 * on `facing`. WhackSystem (Slice 1) imports this instead of inlining the table,
 * so the 4-facing math is unit-tested without a Phaser Scene.
 *
 * Pattern: TriggerSystem.ts (pure-TS, no Phaser, exported constants + function)
 * Source: RESEARCH.md Pattern 1 "Directional Melee Hitbox" (verbatim facing→offset table)
 */

/** Distance in pixels the hitbox is placed in front of the player. */
export const WHACK_REACH = 24;

/**
 * Per-facing hitbox offsets relative to the player's center.
 *
 * D-02 table (verbatim from RESEARCH Pattern 1):
 *   - down:  +Y (forward when facing screen-bottom)
 *   - up:    -Y (forward when facing screen-top)
 *   - left:  -X (forward when facing screen-left)
 *   - right: +X (forward when facing screen-right)
 */
export const WHACK_OFFSETS: Record<string, { dx: number; dy: number }> = {
    down:  { dx: 0,           dy:  WHACK_REACH },
    up:    { dx: 0,           dy: -WHACK_REACH },
    left:  { dx: -WHACK_REACH, dy: 0 },
    right: { dx:  WHACK_REACH, dy: 0 },
};

/**
 * Return the hitbox offset for the given facing direction.
 * Unknown facings fall back to 'down' (matching the RESEARCH `?? offsets.down` pattern).
 */
export function whackHitboxOffset(facing: string): { dx: number; dy: number } {
    return WHACK_OFFSETS[facing] ?? WHACK_OFFSETS.down;
}
