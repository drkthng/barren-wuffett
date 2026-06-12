/**
 * TriggerSystem — zone-based overlap trigger detection for OverworldScene
 *
 * Maps LEVEL_01_MANIFEST trigger zone names to world-space rectangles and
 * exposes checkZones(player) which returns the first zone the player overlaps
 * that has not already been consumed this visit.
 *
 * Design: plain TypeScript utility (no Phaser Scene subclass). OverworldScene
 * owns and calls it. Zone geometry is hard-coded here for Level 1 (upgrade to
 * reading from manifest in Level 2+ when a Tiled tilemap provides zone rects).
 *
 * Pattern: RESEARCH.md Pattern 3 (scene-as-state handoff) + Phaser geometry
 * overlap (no new physics world — pure rectangle Contains check).
 * Pitfall 1: caller must never read launched-scene state synchronously.
 * Pitfall 2: sleeping-scene input — handled in OverworldScene.
 */

export interface TriggerZoneRect {
    x: number;   // left edge in world pixels
    y: number;   // top edge in world pixels
    w: number;   // width
    h: number;   // height
}

export interface TriggerHit {
    zone: string;   // zone name as in LEVEL_01_MANIFEST.triggers
    target: string; // scene key to launch
}

// Level 1 trigger zone rectangles (world pixel coordinates, 32px grid)
// minigame_trigger: rows 8-11, columns 9-12 → x=288,y=256 w=128,h=128
// boss_trigger: rows 21-24, columns 6-9 → x=192,y=672 w=128,h=96
const LEVEL_01_ZONES: Record<string, { rect: TriggerZoneRect; target: string }> = {
    minigame_trigger: {
        rect:   { x: 288, y: 256, w: 128, h: 128 },
        target: 'PaperThrowScene',
    },
    boss_trigger: {
        rect:   { x: 192, y: 672, w: 128, h: 96 },
        target: 'BossScene',
    },
};

export class TriggerSystem {
    /** Set of zone names already consumed (launched) during this visit. */
    private consumed = new Set<string>();

    /**
     * Check whether the player overlaps any trigger zone that has not yet
     * been consumed this visit.
     *
     * @param playerX - player world X (sprite.x, center-based)
     * @param playerY - player world Y (sprite.y, center-based)
     * @returns The first matching TriggerHit, or null if no overlap.
     */
    checkZones(playerX: number, playerY: number): TriggerHit | null {
        for (const [zone, def] of Object.entries(LEVEL_01_ZONES)) {
            if (this.consumed.has(zone)) continue;
            const { rect } = def;
            if (
                playerX >= rect.x &&
                playerX <= rect.x + rect.w &&
                playerY >= rect.y &&
                playerY <= rect.y + rect.h
            ) {
                return { zone, target: def.target };
            }
        }
        return null;
    }

    /**
     * Mark a zone as consumed so re-entering does not re-launch mid-handoff.
     * Call immediately before scene.sleep() + scene.launch().
     */
    consume(zone: string): void {
        this.consumed.add(zone);
    }

    /**
     * Release a consumed zone so the player can re-enter it after returning
     * from the sub-scene (e.g., replay mini-game). Call after overworld wakes.
     */
    release(zone: string): void {
        this.consumed.delete(zone);
    }
}
