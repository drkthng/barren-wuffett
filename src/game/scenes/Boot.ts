import { Scene } from 'phaser';
import { AudioService } from '../../services/AudioService';

export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    create(): void {
        // Read audio preferences from localStorage and apply to Sound Manager
        const musicEnabled = AudioService.getMusicEnabled();
        const sfxEnabled = AudioService.getSfxEnabled();

        // Use setMute() API for consistency with Settings.ts (avoids property vs method divergence)
        this.sound.setMute(!musicEnabled);

        // Store for later use (SFX muting is scene-level in Phaser 4)
        this.registry.set('sfxEnabled', sfxEnabled);

        // Canvas text snapshots the font at creation time — wait for the self-hosted
        // pixel font (capped at 1.5s so a failed font load never blocks the game).
        const fontReady = document.fonts
            ? document.fonts.load('16px "Press Start 2P"').catch(() => undefined)
            : Promise.resolve(undefined);
        const timeout = new Promise((resolve) => setTimeout(resolve, 1500));

        Promise.race([fontReady, timeout]).then(() => {
            this.scene.start('Preloader');
        });
    }
}
