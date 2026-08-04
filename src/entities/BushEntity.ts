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
     * Phase 3.1 (FEEL-05): marks cleared + disables the body SYNCHRONOUSLY so the
     * still-live overlap can never re-fire an award on later frames; the sprite
     * stays visible so the caller can play the squash/flash before hide().
     * Caller (OverworldScene) handles particles, SFX, tweens, and prize-pack roll.
     */
    onWhacked(): void {
        if (this._cleared) return;
        this._cleared = true;
        (this.sprite.body as Phaser.Physics.Arcade.Body).enable = false;
    }

    /** Hide the sprite after the clear feedback finished (FEEL-04 squash tween). */
    hide(): void {
        this.sprite.setVisible(false);
    }

    /**
     * Regrow the bush (Phase 3.1: on a timer after clearing — D-03 soft farm; the
     * deterministic pack + streak cap keep farming from being optimal).
     * Re-shows the sprite and re-enables the physics body; clears the cleared flag.
     */
    reset(): void {
        this._cleared = false;
        this.sprite.setVisible(true);
        this.sprite.setScale(1).setAlpha(1);
        (this.sprite.body as Phaser.Physics.Arcade.Body).enable = true;
    }
}
