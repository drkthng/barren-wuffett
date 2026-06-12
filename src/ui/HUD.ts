/**
 * HUD — overworld heads-up display rendered in UIScene
 *
 * Per UI-SPEC Component 1:
 *   - Coin counter (x=16,y=16, coin sprite + COINS:{n} text, scale tween on increment)
 *   - Pause button sprite (x=448,y=32, 44×44 input zone, emits PAUSE_REQUESTED)
 *   - Autosave disk flash (fade in/out 800ms on save)
 *   - Patience-bonus flash ("+{n} PATIENCE BONUS", #00ff88, float-up tween)
 *
 * Pattern: PATTERNS.md HUD.ts + UI-SPEC Component 1
 */
import { Scene } from 'phaser';
import { t } from '../services/i18n';
import { GameEvents, Events } from '../events/GameEvents';

export class HUD {
    private readonly scene: Scene;
    private coinText: Phaser.GameObjects.Text;
    private readonly saveIcon: Phaser.GameObjects.Image;
    private readonly container: Phaser.GameObjects.Container;

    constructor(scene: Scene) {
        this.scene = scene;

        // ── Coin counter (top-left) ──────────────────────────────────────────
        const coinIcon = scene.add.image(24, 24, 'coin').setDisplaySize(16, 16);
        this.coinText = scene.add.text(36, 16, this.formatCoins(0), {
            fontSize: '8px',
            color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        });

        // ── Autosave disk flash (bottom-left) ────────────────────────────────
        this.saveIcon = scene.add.image(16, 838, 'ui_save')
            .setDisplaySize(16, 16)
            .setAlpha(0);

        // ── Pause button (top-right) ─────────────────────────────────────────
        const pauseBtn = scene.add.image(448, 32, 'ui_pause').setDisplaySize(32, 32);
        pauseBtn.setInteractive(
            new Phaser.Geom.Rectangle(-22, -22, 44, 44),
            Phaser.Geom.Rectangle.Contains
        );
        pauseBtn.on('pointerdown', () => {
            pauseBtn.setAlpha(0.7);
            scene.time.delayedCall(100, () => pauseBtn.setAlpha(1));
            GameEvents.emit(Events.PAUSE_REQUESTED);
        });

        // Container holds all HUD elements
        this.container = scene.add.container(0, 0, [
            coinIcon, this.coinText, this.saveIcon, pauseBtn,
        ]).setDepth(20);
    }

    /** Update the displayed coin count. */
    setCoins(count: number): void {
        this.coinText.setText(this.formatCoins(count));
        // Scale-up tween on increment
        this.scene.tweens.add({
            targets: this.coinText,
            scaleX: 1.2, scaleY: 1.2,
            duration: 75,
            yoyo: true,
        });
    }

    /** Flash the autosave disk icon (800ms total). */
    flashSave(): void {
        this.scene.tweens.add({
            targets: this.saveIcon,
            alpha: 1,
            duration: 200,
            onComplete: () => {
                this.scene.tweens.add({
                    targets: this.saveIcon,
                    alpha: 0,
                    duration: 600,
                });
            },
        });
    }

    /** Flash the patience bonus text at canvas center, floating upward. */
    flashPatienceBonus(amount: number): void {
        const bonusText = this.scene.add.text(240, 200,
            t('hud.patienceBonus').replace('{n}', String(amount)), {
                fontSize: '8px',
                color: '#00ff88',
                fontFamily: '"Press Start 2P", monospace',
            }
        ).setOrigin(0.5).setDepth(25);

        this.scene.tweens.add({
            targets: bonusText,
            y: 160,
            alpha: 0,
            duration: 800,
            onComplete: () => bonusText.destroy(),
        });
    }

    /** Show or hide the HUD container. */
    setVisible(visible: boolean): void {
        this.container.setVisible(visible);
    }

    private formatCoins(n: number): string {
        return t('hud.coins').replace('{n}', String(n));
    }
}
