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

        // Tileset: Kenney Tiny Town CC0, 16px tiles, loaded as a plain image.
        // The tilemap renderer uses the packed sheet directly; no frameWidth needed.
        // Uses tilemap_packed.png (margin=0, spacing=0) to avoid 1px ghosting seams.
        this.load.image('tiny_town_tiles', 'assets/tilesets/tiny_town_tiles.png');

        // Phase 02.1 character sprites — cohesive palette-matched pixel art
        // Player: load as spritesheet (128×16, 8 frames @ 16×16 — WR-01: frameWidth must match one frame)
        this.load.spritesheet('player_sheet', 'assets/images/player.png',
            { frameWidth: 16, frameHeight: 16 });
        // NPCs/dog: static single-frame images (add.image in NPC.ts — no animation needed for MVP)
        this.load.image('npc_grandpa',     'assets/images/npc_grandpa.png');
        this.load.image('npc_store_clerk', 'assets/images/npc_store_clerk.png');
        this.load.image('npc_rival',       'assets/images/npc_rival.png');
        this.load.image('dog',             'assets/images/dog.png');
        // Boss: two separate images for greed/panic poses — setTexture() approach (RESEARCH Pitfall 6a)
        this.load.image('boss_mr_market_greed', 'assets/images/boss_mr_market_greed.png');
        this.load.image('boss_mr_market_panic', 'assets/images/boss_mr_market_panic.png');
        this.load.image('coin',            'assets/images/coin.png');
        this.load.image('ui_save',         'assets/images/ui_save.png');
        this.load.image('ui_pause',        'assets/images/ui_pause.png');
        this.load.image('barren_victory',  'assets/images/barren_victory.png');
        this.load.image('bw_monogram',     'assets/images/bw_monogram.png');

        // Phase 3: whack button + swing spritesheet + bush + leaf particle
        this.load.image('ui_newspaper_button', 'assets/images/ui_newspaper_button.png');
        this.load.spritesheet('newspaper_swing', 'assets/images/newspaper_swing.png',
            { frameWidth: 32, frameHeight: 32 }); // 3 frames, 96×32 sheet
        this.load.image('bush',         'assets/images/bush.png');
        this.load.image('leaf_particle', 'assets/images/leaf_particle.png');
        // Shop item icons
        this.load.image('item_newspaper_upgrade', 'assets/images/item_newspaper_upgrade.png');
        this.load.image('item_helmet',   'assets/images/item_helmet.png');
        this.load.image('item_bus_pass', 'assets/images/item_bus_pass.png');
        this.load.image('item_snack',    'assets/images/item_snack.png');
        // SFX — placeholder OGG files; art pass will replace with real audio
        this.load.audio('whack',          'assets/audio/sfx_whack.ogg');
        this.load.audio('coin_ding',      'assets/audio/sfx_coin_ding.ogg');
        this.load.audio('dog_bite',       'assets/audio/sfx_dog_bite.ogg');
        this.load.audio('purchase_chime', 'assets/audio/sfx_purchase.ogg');
        this.load.audio('hospital_sting', 'assets/audio/sfx_hospital.ogg');
        this.load.audio('streak_bonus',   'assets/audio/sfx_streak_bonus.ogg');
    }

    create(): void {
        // Register 4-direction walk animations for the player.
        // Must be done in Preloader so they exist globally before any scene starts.
        // Frames: 0-1=down, 2-3=up, 4-5=left, 6-7=right (PATTERNS.md 4-Dir Anim Registration)
        ['down', 'up', 'left', 'right'].forEach((dir, i) => {
            this.anims.create({
                key: `player_${dir}`,
                frames: this.anims.generateFrameNumbers('player_sheet', { start: i * 2, end: i * 2 + 1 }),
                frameRate: 6,
                repeat: -1,
            });
        });

        // Phase 3: newspaper swing animation (3 frames, 18fps, no repeat, hideOnComplete)
        // Overlay sprite separate from player_sheet — does NOT modify player walk anims (D-04)
        this.anims.create({
            key: 'newspaper_swing_anim',
            frames: this.anims.generateFrameNumbers('newspaper_swing', { start: 0, end: 2 }),
            frameRate: 18,
            repeat: 0,
            hideOnComplete: true,
        });

        // Guard: do not advance to MainMenu if a load error occurred.
        // The error text remains visible; user can refresh the page.
        if (!this.hasLoadError) {
            this.scene.start('MainMenu');
        }
    }
}
