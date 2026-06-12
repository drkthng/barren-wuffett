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

    constructor(scene: Scene, x: number, y: number) {
        this.sprite = scene.physics.add.sprite(x, y, 'player');
        this.sprite.setCollideWorldBounds(true);
    }

    update(): void {
        const vx = InputBus.isActive(Action.MOVE_LEFT)  ? -80
                 : InputBus.isActive(Action.MOVE_RIGHT) ?  80 : 0;
        const vy = InputBus.isActive(Action.MOVE_UP)    ? -80
                 : InputBus.isActive(Action.MOVE_DOWN)  ?  80 : 0;
        this.sprite.setVelocity(vx, vy);
    }
}
