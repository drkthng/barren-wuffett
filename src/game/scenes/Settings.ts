import Phaser, { Scene } from 'phaser';
import { t } from '../../services/i18n';
import { AudioService } from '../../services/AudioService';

export class Settings extends Scene {
    constructor() {
        super('Settings');
    }

    create(): void {
        const { width } = this.scale;
        const cx = width / 2;

        // Sync Sound Manager mute state with localStorage on every scene entry
        // Prevents divergence when re-entering Settings after a scene transition
        this.sound.setMute(!AudioService.getMusicEnabled());

        // ── Heading ─────────────────────────────────────────────────────────
        this.add.text(cx, 80, t('settings.title'), {
            fontSize: '16px',
            color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5);

        // ── Music toggle row (y=200) ─────────────────────────────────────────
        this.add.text(cx - 80, 200, t('audio.music'), {
            fontSize: '16px',
            color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5);

        this.createToggle(cx + 80, 200, AudioService.getMusicEnabled(), (newState) => {
            AudioService.setMusicEnabled(newState);
            // Apply mute state to Phaser Sound Manager
            this.sound.setMute(!newState);
        });

        // ── SFX toggle row (y=260) ───────────────────────────────────────────
        this.add.text(cx - 80, 260, t('audio.sfx'), {
            fontSize: '16px',
            color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5);

        this.createToggle(cx + 80, 260, AudioService.getSfxEnabled(), (newState) => {
            AudioService.setSfxEnabled(newState);
            // For SFX, we only mute music-channel sounds if both are off;
            // SFX muting is handled at play-call time using getSfxEnabled() check in Phase 2.
            // Here we just persist and provide a visual response.
        });

        // ── Legal footer strip (y=700) ─────────────────────────────────────
        const impressumText = this.add.text(cx - 80, 700, t('legal.impressum'), {
            fontSize: '8px',
            color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5);

        impressumText.setInteractive(
            new Phaser.Geom.Rectangle(
                -impressumText.width / 2,
                -22,
                Math.max(impressumText.width, 44),
                44
            ),
            Phaser.Geom.Rectangle.Contains
        );
        impressumText.on('pointerdown', () => {
            window.open('/impressum', '_self');
        });

        const datenschutzText = this.add.text(cx + 60, 700, t('legal.datenschutz'), {
            fontSize: '8px',
            color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5);

        datenschutzText.setInteractive(
            new Phaser.Geom.Rectangle(
                -datenschutzText.width / 2,
                -22,
                Math.max(datenschutzText.width, 44),
                44
            ),
            Phaser.Geom.Rectangle.Contains
        );
        datenschutzText.on('pointerdown', () => {
            window.open('/datenschutz', '_self');
        });

        // ── Back navigation (tap anywhere below toggle rows) ────────────────
        const backText = this.add.text(cx, 780, t('nav.back'), {
            fontSize: '8px',
            color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        backText.setInteractive(
            new Phaser.Geom.Rectangle(
                -backText.width / 2,
                -22,
                Math.max(backText.width, 80),
                44
            ),
            Phaser.Geom.Rectangle.Contains
        );
        backText.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }

    /**
     * Creates a 44x44px interactive toggle button at (x, y).
     * ON state: filled #00ff88 block + " ON" label in #00ff88
     * OFF state: filled #16213e block + " OFF" label in #e8e8e8
     *
     * @param x          Center x of the toggle button
     * @param y          Center y of the toggle button
     * @param initial    Initial enabled state
     * @param onChange   Called with the new boolean state on each tap
     */
    private createToggle(
        x: number,
        y: number,
        initial: boolean,
        onChange: (newState: boolean) => void
    ): Phaser.GameObjects.Container {
        let enabled = initial;

        // Background block (44x44 px)
        const block = this.add.rectangle(0, 0, 44, 44, enabled ? 0x00ff88 : 0x16213e);

        // State label text
        const label = this.add.text(0, 0, enabled ? ` ${t('audio.on')}` : ` ${t('audio.off')}`, {
            fontSize: '8px',
            color: enabled ? '#00ff88' : '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5);

        // Container combines block + label at (x, y)
        const container = this.add.container(x, y, [block, label]);

        // Interactive zone over the full 44x44 block (WCAG 2.5.5)
        container.setSize(44, 44);
        container.setInteractive({ useHandCursor: true });

        container.on('pointerdown', () => {
            enabled = !enabled;

            // Update visuals
            block.setFillStyle(enabled ? 0x00ff88 : 0x16213e);
            label.setText(enabled ? ` ${t('audio.on')}` : ` ${t('audio.off')}`);
            label.setColor(enabled ? '#00ff88' : '#e8e8e8');

            // Persist and notify
            onChange(enabled);
        });

        return container;
    }
}
