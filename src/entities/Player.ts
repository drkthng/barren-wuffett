/**
 * Player — physics sprite driven by InputBus
 *
 * Plain TypeScript class (not a Phaser Scene).
 * Accepts the scene as a constructor parameter; creates its own physics sprite.
 * update() polls InputBus.isActive() each tick and applies velocity at ±80px/s.
 *
 * Pattern: PATTERNS.md Player.ts (partial — class structure from MainMenu.ts analog)
 */
import { Scene } from 'phaser';
import { InputBus, Action } from '../input/InputBus';

export class Player {
    readonly sprite: Phaser.Physics.Arcade.Sprite;
    // Tracks the last movement direction for idle frame selection
    private _facing: 'down' | 'up' | 'left' | 'right' = 'down';
    // Phase 3: whack cooldown + i-frame state
    private _whackCooldown = false;
    private _invincible = false;
    // Phaser scene reference needed for time.delayedCall (whack cooldown, knockback tweens)
    private readonly _scene: Scene;

    constructor(scene: Scene, x: number, y: number) {
        this._scene = scene;
        // Use player_sheet (spritesheet) instead of single-image 'player' — start at frame 0
        this.sprite = scene.physics.add.sprite(x, y, 'player_sheet', 0);
        this.sprite.setCollideWorldBounds(true);
    }

    /** Current facing direction — consumed by WhackSystem for hitbox placement (D-02). */
    get facing(): 'down' | 'up' | 'left' | 'right' { return this._facing; }

    /** True while i-frames are active (knockback from dog bite — D-10). */
    get isInvincible(): boolean { return this._invincible; }

    /**
     * Gate the whack action with a ~350ms cooldown (D-02: 300–400ms between swings).
     * Returns true if the whack was accepted (caller should activate the hitbox + anim).
     * Returns false if still on cooldown (or i-frames — player can't swing while airborne).
     *
     * Pattern: PATTERNS.md Player.ts whack() method
     */
    whack(): boolean {
        if (this._whackCooldown || this._invincible) return false;
        this._whackCooldown = true;
        this._scene.time.delayedCall(350, () => { this._whackCooldown = false; });
        return true;
    }

    /**
     * Apply knockback from a hazard (dog bite — D-10).
     * ~48px tween away from the source, then ~960ms i-frame flash, then restore.
     *
     * Pattern: PATTERNS.md Player.ts applyKnockback()
     */
    applyKnockback(fromX: number, fromY: number, onComplete: () => void): void {
        this._invincible = true;
        (this.sprite.body as Phaser.Physics.Arcade.Body).moves = false;
        this.sprite.setVelocity(0, 0);
        const DIST = 48;
        const angle = Math.atan2(this.sprite.y - fromY, this.sprite.x - fromX);
        this._scene.tweens.add({
            targets: this.sprite,
            x: this.sprite.x + Math.cos(angle) * DIST,
            y: this.sprite.y + Math.sin(angle) * DIST,
            duration: 180, ease: 'Power2',
            onComplete: () => {
                (this.sprite.body as Phaser.Physics.Arcade.Body).moves = true;
                // i-frame flash: alpha oscillation 6× 80ms yoyo ≈ 960ms
                this._scene.tweens.add({
                    targets: this.sprite, alpha: 0, duration: 80,
                    yoyo: true, repeat: 5,
                    onComplete: () => {
                        this.sprite.setAlpha(1);
                        this._invincible = false;
                        onComplete();
                    },
                });
            },
        });
    }

    update(): void {
        // Velocity logic unchanged (±80px/s via InputBus)
        const vx = InputBus.isActive(Action.MOVE_LEFT)  ? -80
                 : InputBus.isActive(Action.MOVE_RIGHT) ?  80 : 0;
        const vy = InputBus.isActive(Action.MOVE_UP)    ? -80
                 : InputBus.isActive(Action.MOVE_DOWN)  ?  80 : 0;
        this.sprite.setVelocity(vx, vy);

        // Additive: play directional walk anim or show idle frame — velocity logic above is unchanged
        if (vx === 0 && vy === 0) {
            // Idle: stop animation and show the first frame of the current facing direction
            this.sprite.anims.stop();
            const idleFrames: Record<string, number> = { down: 0, up: 2, left: 4, right: 6 };
            this.sprite.setFrame(idleFrames[this._facing]);
        } else {
            // Update facing from dominant axis and play the matching directional anim
            if (Math.abs(vx) > Math.abs(vy)) {
                this._facing = vx < 0 ? 'left' : 'right';
            } else {
                this._facing = vy < 0 ? 'up' : 'down';
            }
            // true = don't restart if already playing this anim (Phaser dedup)
            this.sprite.anims.play(`player_${this._facing}`, true);
        }
    }
}
