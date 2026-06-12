import { Scene } from 'phaser';
import { t } from '../../services/i18n';

export class Preloader extends Scene {
    private hasLoadError = false;

    constructor() {
        super('Preloader');
    }

    preload(): void {
        const { width } = this.scale;
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

        // Error handler — set flag to prevent scene transition in create()
        this.load.on('loaderror', () => {
            this.hasLoadError = true;
            loadingLabel.setVisible(false);
            errorText.setVisible(true);
        });

        // Load game assets
        this.load.image('logo', 'assets/images/logo.png');

        // Phase 2 assets — placeholder PNGs created in public/assets/images/
        this.load.image('player',          'assets/images/player.png');
        this.load.image('npc_grandpa',     'assets/images/npc_grandpa.png');
        this.load.image('npc_store_clerk', 'assets/images/npc_store_clerk.png');
        this.load.image('npc_rival',       'assets/images/npc_rival.png');
        this.load.image('boss_mr_market',  'assets/images/boss_mr_market.png');
        this.load.image('dog',             'assets/images/dog.png');
        this.load.image('coin',            'assets/images/coin.png');
        this.load.image('ui_save',         'assets/images/ui_save.png');
        this.load.image('ui_pause',        'assets/images/ui_pause.png');
        this.load.image('barren_victory',  'assets/images/barren_victory.png');
        this.load.image('bw_monogram',     'assets/images/bw_monogram.png');
        this.load.spritesheet('omaha_tiles', 'assets/tilesets/omaha_tiles.png', {
            frameWidth: 16, frameHeight: 16,
        });
    }

    create(): void {
        // Guard: do not advance to MainMenu if a load error occurred.
        // The error text remains visible; user can refresh the page.
        if (!this.hasLoadError) {
            this.scene.start('MainMenu');
        }
    }
}
