/**
 * NPC — static sprite with 48px-radius interaction zone
 *
 * Plain TypeScript class (not a Phaser Scene).
 * Exposes npcId, dialogueKey, and isPlayerInRange() distance check.
 * The interaction zone is a visual-only 48px circle; overlap detection
 * uses isPlayerInRange() polled from OverworldScene.update().
 *
 * Pattern: PATTERNS.md NPC.ts (partial — class structure)
 */
import { Scene } from 'phaser';

export class NPC {
    readonly npcId: string;
    readonly dialogueKey: string;
    readonly sprite: Phaser.GameObjects.Image;

    private static readonly INTERACT_RADIUS = 48;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        textureKey: string,
        npcId: string,
        dialogueKey: string
    ) {
        this.npcId       = npcId;
        this.dialogueKey = dialogueKey;
        this.sprite      = scene.add.image(x, y, textureKey);
    }

    /** Returns true when the player sprite centre is within 48px of this NPC. */
    isPlayerInRange(playerSprite: Phaser.Physics.Arcade.Sprite): boolean {
        const dx = playerSprite.x - this.sprite.x;
        const dy = playerSprite.y - this.sprite.y;
        return Math.sqrt(dx * dx + dy * dy) <= NPC.INTERACT_RADIUS;
    }

    get x(): number { return this.sprite.x; }
    get y(): number { return this.sprite.y; }
}
