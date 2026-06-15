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
     * @param enlarged Reserved for the upgrade_newspaper effect (Slice 3); no-op this slice.
     */
    activate(playerX: number, playerY: number, facing: string, enlarged = false): void {
        void enlarged; // deferred to Slice 3 — param accepted now so no signature change needed
        const { dx, dy } = whackHitboxOffset(facing);
        this._hitbox.setPosition(playerX + dx, playerY + dy);
        const body = this._hitbox.body as Phaser.Physics.Arcade.StaticBody;
        body.enable = true;
        body.reset(playerX + dx, playerY + dy); // sync static body position after setPosition

        // Active window ~150ms (D-02: 120–180ms)
        this._hitbox.scene.time.delayedCall(150, () => {
            body.enable = false;
        });
    }

    /** The hitbox rectangle — OverworldScene registers physics.add.overlap() against it. */
    get hitbox(): Phaser.GameObjects.Rectangle {
        return this._hitbox;
    }
}
