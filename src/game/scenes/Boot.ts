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

        if (!musicEnabled) {
            this.sound.mute = true;
        }

        // Store for later use (SFX muting is scene-level in Phaser 4)
        this.registry.set('sfxEnabled', sfxEnabled);

        this.scene.start('Preloader');
    }
}
