/**
 * WhackSystem — directional hitbox lifecycle (Phase 3, L1E-01)
 *
 * Phaser-aware class owning the short-lived directional hitbox rectangle.
 * Imports `whackHitboxOffset` from the Plan-01 pure seam (WhackOffsets.ts) —
 * does NOT re-inline the facing→offset table.
 *
 * Responsibilities:
 *   - Owns an invisible static-body Rectangle (32×24, alpha 0).
 *   - activate(x, y, facing, enlarged): positions the rect in front of the player,
 *     enables the body for ~150ms, then disables it.
 *   - Exposes `get hitbox()` so OverworldScene can register physics.add.overlap().
 *
 * Pattern: PATTERNS.md WhackSystem + RESEARCH Pattern 1 (Directional Melee Hitbox)
 * Pitfall: RESEARCH Pattern 2 (whackableGroup) — overlap registration is in OverworldScene.
 *
 * Architecture: WhackSystem owns ONLY the hitbox lifecycle.
 *   Bush clearing + prize-pack logic stays in OverworldScene (Architectural Responsibility Map).
 */
import Phaser from 'phaser';
import { whackHitboxOffset } from './WhackOffsets';

export class WhackSystem {
    private readonly _hitbox: Phaser.GameObjects.Rectangle;

    constructor(scene: Phaser.Scene) {
        // Invisible static-body rectangle for the directional hitbox (32×24)
        this._hitbox = scene.add.rectangle(0, 0, 32, 24, 0xff0000, 0).setActive(false);
        scene.physics.add.existing(this._hitbox, true); // true = static body
        (this._hitbox.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    }

    /**
     * Activate the hitbox in front of the player for ~150ms.
     *
     * @param playerX  Player sprite world X
     * @param playerY  Player sprite world Y
     * @param facing   'down' | 'up' | 'left' | 'right' (unknown falls back to 'down')
     * @param enlarged True when upgrade_newspaper is owned — grows hitbox by 8px reach + wider rect (D-14).
     */
    activate(playerX: number, playerY: number, facing: string, enlarged = false): void {
        const { dx, dy } = whackHitboxOffset(facing);

        // upgrade_newspaper effect: +8px reach in facing direction, wider rect (D-14, Slice 3)
        const baseW = enlarged ? 48 : 32;
        const baseH = enlarged ? 32 : 24;
        // Extra offset in facing direction (8px more reach when enlarged)
        const extraReach = enlarged ? 8 : 0;
        let finalDx = dx;
        let finalDy = dy;
        if (enlarged) {
            // Push the hitbox 8px further in the facing direction
            if (Math.abs(dx) > Math.abs(dy)) {
                finalDx = dx + Math.sign(dx) * extraReach;
            } else {
                finalDy = dy + Math.sign(dy) * extraReach;
            }
        }

        this._hitbox.setPosition(playerX + finalDx, playerY + finalDy);
        this._hitbox.setSize(baseW, baseH);

        const body = this._hitbox.body as Phaser.Physics.Arcade.StaticBody;
        body.enable = true;
        body.reset(playerX + finalDx, playerY + finalDy); // sync static body position

        // Active window ~150ms (D-02: 120–180ms)
        this._hitbox.scene.time.delayedCall(150, () => {
            body.enable = false;
            // Reset hitbox to base size after deactivation so next whack starts fresh
            this._hitbox.setSize(32, 24);
        });
    }

    /** The hitbox rectangle — OverworldScene registers physics.add.overlap() against it. */
    get hitbox(): Phaser.GameObjects.Rectangle {
        return this._hitbox;
    }
}
