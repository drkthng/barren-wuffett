/**
 * BushEntity — whackable bush prop (Phase 3, L1E-01)
 *
 * Plain TypeScript class (not a Phaser Scene).
 * Holds a Phaser Arcade Sprite. Created via scene.physics.add.sprite().
 *
 * Pattern: PATTERNS.md BushEntity.ts (analog: Player.ts plain-TS-class-owns-Phaser-sprite)
 *
 * Key rules:
 *   - sprite.setData('bushId', id) in constructor so overlap callbacks can look up the entity.
 *   - onWhacked(): hides + disables body WITHOUT destroying sprite (re-usable on re-entry).
 *   - reset(): regrows bush on level re-entry (D-03 — soft farm; deterministic pack + streak cap prevent grinding).
 */
import { Scene } from 'phaser';

export class BushEntity {
    readonly sprite: Phaser.Physics.Arcade.Sprite;
    private _cleared = false;
    private readonly _id: string;
    /** true = milestone bush (streak bonus / journal page — Slice 2) */
    readonly special: boolean;

    constructor(scene: Scene, x: number, y: number, id: string, special = false) {
        this.sprite = scene.physics.add.sprite(x, y, 'bush');
        // Pitfall 8 (RESEARCH): overlap callback looks up entity by this key
        this.sprite.setData('bushId', id);
        this._id = id;
        this.special = special;
    }

    isCleared(): boolean { return this._cleared; }
    get id(): string { return this._id; }

    /**
     * Called when the directional hitbox overlaps this bush.
     * Hides the sprite and disables the physics body — does NOT destroy the sprite
     * so reset() can regrow it on re-entry.
     * Caller (OverworldScene) handles particles, SFX, and prize-pack roll.
     */
    onWhacked(): void {
        if (this._cleared) return;
        this._cleared = true;
        this.sprite.setVisible(false);
        (this.sprite.body as Phaser.Physics.Arcade.Body).enable = false;
    }

    /**
     * Called on level re-entry — bushes regrow (D-03).
     * Re-shows the sprite and re-enables the physics body; clears the cleared flag.
     */
    reset(): void {
        this._cleared = false;
        this.sprite.setVisible(true);
        (this.sprite.body as Phaser.Physics.Arcade.Body).enable = true;
    }
}
