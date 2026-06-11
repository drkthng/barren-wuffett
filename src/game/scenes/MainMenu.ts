import { Scene } from 'phaser';
import { t } from '../../services/i18n';
// Rex VirtualJoystick import path smoke test (RESEARCH Pitfall 4)
// Confirms the import path resolves in a production build before Phase 2 depends on it.
// Do NOT instantiate — Phase 2 wires the actual joystick.
import VirtualJoystick from 'phaser4-rex-plugins/plugins/virtualjoystick.js';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _rexCheck: typeof VirtualJoystick = VirtualJoystick; // bundler must resolve this

export class MainMenu extends Scene {
    private blinkTimer: Phaser.Time.TimerEvent | null = null;

    constructor() {
        super('MainMenu');
    }

    create(): void {
        const { width, height } = this.scale;
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
        impressumText.setInteractive(
            new Phaser.Geom.Rectangle(
                -impressumText.width / 2,
                -22,
                impressumText.width,
                44
            ),
            Phaser.Geom.Rectangle.Contains
        );

        const datenschutzText = this.add.text(cx + 60, 800, t('legal.datenschutz'), {
            fontSize: '8px',
            color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        datenschutzText.setInteractive(
            new Phaser.Geom.Rectangle(
                -datenschutzText.width / 2,
                -22,
                datenschutzText.width,
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
        this.input.once('pointerdown', () => {
            this.sound.unlock();
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
