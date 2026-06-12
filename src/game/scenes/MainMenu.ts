import { Scene } from 'phaser';
import { t } from '../../services/i18n';

export class MainMenu extends Scene {
    private blinkTimer: Phaser.Time.TimerEvent | null = null;

    constructor() {
        super('MainMenu');
    }

    create(): void {
        const { width } = this.scale;
        const cx = width / 2;

        // Game logo (loaded in Preloader)
        this.add.image(cx, 120, 'logo').setDisplaySize(320, 160);

        // Game title
        this.add.text(cx, 300, t('game.title'), {
            fontSize: '24px',
            color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5);

        // Game subtitle
        this.add.text(cx, 332, t('game.subtitle'), {
            fontSize: '8px',
            color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5);

        // TAP TO START — primary CTA (accent color, blinks at 1Hz)
        const tapText = this.add.text(cx, 427, t('menu.tapToStart'), {
            fontSize: '16px',
            color: '#00ff88',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5);

        // 1Hz blink (500ms on, 500ms off)
        this.blinkTimer = this.time.addEvent({
            delay: 500,
            loop: true,
            callback: () => {
                tapText.setVisible(!tapText.visible);
            }
        });

        // Legal footer links (Phaser text objects with extended hit areas)
        const impressumText = this.add.text(cx - 80, 800, t('legal.impressum'), {
            fontSize: '8px',
            color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Extend impressum hit area to 44px tall minimum (WCAG 2.5.5)
        // Math.max(..., 80) guards against zero-width before web font loads
        impressumText.setInteractive(
            new Phaser.Geom.Rectangle(
                -Math.max(impressumText.width, 80) / 2,
                -22,
                Math.max(impressumText.width, 80),
                44
            ),
            Phaser.Geom.Rectangle.Contains
        );

        const datenschutzText = this.add.text(cx + 60, 800, t('legal.datenschutz'), {
            fontSize: '8px',
            color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Math.max(..., 80) guards against zero-width before web font loads
        datenschutzText.setInteractive(
            new Phaser.Geom.Rectangle(
                -Math.max(datenschutzText.width, 80) / 2,
                -22,
                Math.max(datenschutzText.width, 80),
                44
            ),
            Phaser.Geom.Rectangle.Contains
        );

        // Legal link handlers
        impressumText.on('pointerdown', () => {
            window.open('/impressum', '_self');
        });

        datenschutzText.on('pointerdown', () => {
            window.open('/datenschutz', '_self');
        });

        // TAP TO START handler — iOS audio unlock gate (RESEARCH Pattern 2)
        // Bound to tapText object (not the global input manager) so legal-link
        // taps on IMPRESSUM / PRIVACY POLICY do not collide with this handler.
        tapText.setInteractive(
            new Phaser.Geom.Rectangle(
                -tapText.width / 2 - 20,
                -22,
                tapText.width + 40,
                44
            ),
            Phaser.Geom.Rectangle.Contains
        );
        tapText.once('pointerdown', () => {
            this.sound.unlock();
            this.scene.start('OverworldScene');
        });

        // SETTINGS affordance — small link below TAP TO START
        // (reachable from main menu AND from the pause menu per GAME-09)
        const settingsLink = this.add.text(cx, 480, t('settings.title'), {
            fontSize: '8px',
            color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        settingsLink.setInteractive(
            new Phaser.Geom.Rectangle(
                -Math.max(settingsLink.width, 80) / 2,
                -22,
                Math.max(settingsLink.width, 80),
                44
            ),
            Phaser.Geom.Rectangle.Contains
        );
        settingsLink.on('pointerdown', () => {
            this.scene.start('Settings');
        });
    }

    shutdown(): void {
        if (this.blinkTimer) {
            this.blinkTimer.remove();
            this.blinkTimer = null;
        }
    }
}
