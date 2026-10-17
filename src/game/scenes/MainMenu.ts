import Phaser, { Scene } from 'phaser';
import { t } from '../../services/i18n';

/**
 * Hit area of w × h centred on a Text's own bounds. Phaser hit areas live in the object's
 * LOCAL top-left space (not origin-relative); the old (-width/2, -22) form shifted every zone
 * up-left by half its size, so taps on the right half of a label — or just below it — missed.
 */
function paddedHitArea(t: Phaser.GameObjects.Text, w: number, h = 44): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle((t.width - w) / 2, (t.height - h) / 2, w, h);
}

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

        // 1Hz blink (500ms on, 500ms dim) — alpha, NOT setVisible: invisible
        // GameObjects receive no input in Phaser, which made the CTA deaf
        // half the time.
        this.blinkTimer = this.time.addEvent({
            delay: 500,
            loop: true,
            callback: () => {
                tapText.setAlpha(tapText.alpha === 1 ? 0.3 : 1);
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
            paddedHitArea(impressumText, Math.max(impressumText.width, 80)),
            Phaser.Geom.Rectangle.Contains
        );

        const datenschutzText = this.add.text(cx + 60, 800, t('legal.datenschutz'), {
            fontSize: '8px',
            color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Math.max(..., 80) guards against zero-width before web font loads
        datenschutzText.setInteractive(
            paddedHitArea(datenschutzText, Math.max(datenschutzText.width, 80)),
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
            paddedHitArea(tapText, tapText.width + 40),
            Phaser.Geom.Rectangle.Contains
        );
        // 'on' + guard flag instead of 'once': a thrown error in a once-handler
        // permanently kills the button; the flag still prevents double-start.
        let started = false;
        tapText.on('pointerdown', () => {
            if (started) return;
            started = true;
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
            paddedHitArea(settingsLink, Math.max(settingsLink.width, 80)),
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
