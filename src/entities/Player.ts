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
    private facing: 'down' | 'up' | 'left' | 'right' = 'down';

    constructor(scene: Scene, x: number, y: number) {
        // Use player_sheet (spritesheet) instead of single-image 'player' — start at frame 0
        this.sprite = scene.physics.add.sprite(x, y, 'player_sheet', 0);
        this.sprite.setCollideWorldBounds(true);
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
            this.sprite.setFrame(idleFrames[this.facing]);
        } else {
            // Update facing from dominant axis and play the matching directional anim
            if (Math.abs(vx) > Math.abs(vy)) {
                this.facing = vx < 0 ? 'left' : 'right';
            } else {
                this.facing = vy < 0 ? 'up' : 'down';
            }
            // true = don't restart if already playing this anim (Phaser dedup)
            this.sprite.anims.play(`player_${this.facing}`, true);
        }
    }
}
