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

        this.scene.start('Preloader');
    }
}
