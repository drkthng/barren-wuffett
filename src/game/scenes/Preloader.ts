import { Scene } from 'phaser';
import { t } from '../../services/i18n';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    preload(): void {
        const { width, height } = this.scale;
        const cx = width / 2;

        // Title
        this.add.text(cx, 300, t('game.title'), {
            fontSize: '24px',
            color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(cx, 340, t('game.subtitle'), {
            fontSize: '8px',
            color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5);

        // Progress bar track
        this.add.rectangle(cx, 420, 302, 14, 0x16213e).setStrokeStyle(2, 0xe8e8e8);

        // Progress bar fill (starts at 0 width)
        const fill = this.add.rectangle(cx - 150, 420, 0, 12, 0x00ff88).setOrigin(0, 0.5);

        // Loading label
        const loadingLabel = this.add.text(cx, 444, t('loading.progress'), {
            fontSize: '8px',
            color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5);

        // Error text (hidden until needed)
        const errorText = this.add.text(cx, 470, t('loading.error'), {
            fontSize: '8px',
            color: '#ff4444',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setVisible(false);

        // Progress event — fill grows from 0 to 300px
        this.load.on('progress', (value: number) => {
            fill.width = 300 * value;
        });

        // Error handler
        this.load.on('loaderror', () => {
            loadingLabel.setVisible(false);
            errorText.setVisible(true);
        });

        // Load game assets
        this.load.image('logo', 'assets/images/logo.png');
    }

    create(): void {
        this.scene.start('MainMenu');
    }
}
