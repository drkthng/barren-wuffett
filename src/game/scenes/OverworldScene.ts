/**
 * OverworldScene — Level 1 top-down overworld (GAME-01, GAME-05, GAME-06, GAME-09)
 *
 * Responsibilities:
 *   - Build two-layer 16px tilemap (GROUND_DATA + DECO_DATA) via Arcade Physics
 *   - Instantiate Player + VirtualJoystick (touch only)
 *   - Place 3 NPCs, dog patrol (patience mechanic)
 *   - Call InputBus.update() + player.update() each tick
 *   - Show/hide TALK prompts by NPC proximity
 *   - Emit DIALOGUE_START on INTERACT-in-range
 *   - TriggerSystem drives enterMiniGame / enterBoss handoff (Plan 02-02)
 *   - Autosave on checkpoint events + HIDDEN
 *   - Launch UIScene as parallel overlay
 *
 * Pattern: PATTERNS.md OverworldScene.ts + RESEARCH Patterns 1/2/3/7
 * Pitfalls: 1 (no sync read of launched scene), 2 (sleep input cleanup), 6 (joystick safe area)
 */
import Phaser, { Scene } from 'phaser';
import { InputBus, Action } from '../../input/InputBus';
import { GameEvents, Events } from '../../events/GameEvents';
import { SaveService } from '../../services/SaveService';
import type { SaveState } from '../../services/SaveService';
import { LEVEL_01_MANIFEST, GROUND_DATA, DECO_DATA } from '../../data/levels/level-01';
import { Player } from '../../entities/Player';
import { NPC } from '../../entities/NPC';
import { t } from '../../services/i18n';
import { TriggerSystem } from '../../systems/TriggerSystem';
import { AudioService } from '../../services/AudioService';
import { BushEntity } from '../../entities/BushEntity';
import { WhackSystem } from '../../systems/WhackSystem';
import { ECONOMY_DATA } from '../../data/levels/level-01-economy';
import { firstWhackOrRoll } from '../../systems/PrizePack';
import type { PrizePackState } from '../../systems/PrizePack';
import { SwingTracker } from '../../systems/SwingTracker';
import { computeHospitalFee, applyPurchase, awardMinigameCoins } from '../../systems/Economy';

// NPC placement on the tile grid (in pixel coords = tile * 32 + 16)
const NPC_DEFS = [
    { x: 96,  y: 96,  texture: 'npc_grandpa',     npcId: 'grandpa',   dialogueKey: 'npc_grandpa' },
    { x: 344, y: 200, texture: 'npc_store_clerk',  npcId: 'storeClerk',dialogueKey: 'npc_store_clerk' },
    { x: 224, y: 320, texture: 'npc_rival',        npcId: 'rival',     dialogueKey: 'npc_rival' },
] as const;

// Dog patrol: horizontal patrol on row 14 (y=14*32+16=464), x range 64..320
const DOG_MIN_X   = 64;
const DOG_MAX_X   = 320;
const DOG_PERIOD  = 4000;  // 4-second full cycle
const DOG_GAP_MS  = 1500;  // gap window at far end (patience reward)
const PATIENCE_BONUS_COINS = 5;

// Boss trigger zone (tile row 22-24, center column) — kept for legacy proximity check
const BOSS_ZONE_X = 224;
const BOSS_ZONE_Y = 720;
const BOSS_ZONE_R = 48;

// Phase 3.1: player spawn/respawn. Was (96,96) — the exact pixel grandpa stands
// on, so the player spawned INSIDE the NPC. One tile south is open grass.
const SPAWN_X = 96;
const SPAWN_Y = 128;

// Phase 3.1 (FEEL-06): bushes regrow after this cooldown so the 60-coin bus
// pass is earnable without exploits (one-shot bushes capped total coins ~50).
const BUSH_REGROW_MS = 45000;

// Phase 3.1 (FEEL-06): set-piece marker positions (zone centers from TriggerSystem)
const MARKER_DEFS = [
    { zone: 'minigame_trigger', x: 352, y: 320, texture: 'marker_route', promptKey: 'trigger.route' },
    { zone: 'boss_trigger',     x: 256, y: 720, texture: 'marker_boss',  promptKey: 'trigger.boss' },
] as const;

export class OverworldScene extends Scene {
    // Player and movement
    private player!: Player;
    private joystick: { up: boolean; down: boolean; left: boolean; right: boolean } | null = null;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
    private wasd: {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
    } | null = null;

    // NPCs and UI
    private npcs: NPC[] = [];
    private talkPrompts: Map<string, Phaser.GameObjects.Text> = new Map();
    private blinkTimers: Map<string, Phaser.Time.TimerEvent> = new Map();

    // Dog patrol (Phase 3.1: gap window driven by the patrol tween's onYoyo —
    // the old separate TimerEvent drifted out of sync with the sprite)
    private dogSprite: Phaser.GameObjects.Image | null = null;
    private dogGapActive = false;
    private bossZoneVisited = false;

    // Trigger system (Plan 02-02)
    private triggerSystem!: TriggerSystem;
    private inHandoff = false;  // guards against double-trigger during scene launch queue

    // State
    private coins = 0;
    private flags: Record<string, boolean> = {};
    private journalUnlocked: string[] = [];
    private interactKey: Phaser.Input.Keyboard.Key | null = null;
    private pauseKey: Phaser.Input.Keyboard.Key | null = null;
    private currentNpcInRange: NPC | null = null;
    private inDialogue = false;

    // Phase 3: whack system
    private whackSystem!: WhackSystem;
    private whackableGroup!: Phaser.Physics.Arcade.Group;
    private bushEntities = new Map<string, BushEntity>();
    private prizePackState: PrizePackState = { slotIndex: 0 };
    private bushStreak = 0;  // used in Slice 2 (streak bonus)
    // Phase 3.1 (FEEL-05): one-award-per-swing guard
    private swingTracker = new SwingTracker();

    // Phase 3.1 (FEEL-06): set-piece trigger prompt state
    private pendingTrigger: { zone: string; target: string } | null = null;
    private triggerPrompt: Phaser.GameObjects.Text | null = null;
    private triggerMarkers = new Map<string, Phaser.GameObjects.Image>();

    // Phase 3: shop/hospital modal flags (guards update() when overlays are shown)
    private shopOpen = false;
    private hospitalShowing = false;

    // Phase 3: traversal gate
    private gateBarrier: Phaser.GameObjects.Rectangle | null = null;
    private gateSignText: Phaser.GameObjects.Text | null = null;

    // Phase 3 Slice 3: track last interacted NPC id (for shop entry after dialogue)
    private _lastNpcId: string | null = null;

    // Phase 3 Slice 3: shop purchase handler (stored ref for CR-03 cleanup)
    private onShopPurchase = (data: { itemId: string; price: number }): void => {
        const res = applyPurchase(this.coins, this.flags, data.itemId, data.price);
        if (!res) return;   // rejected (insufficient funds or already owned)
        this.coins    = res.newCoins;
        this.flags    = res.newFlags;
        AudioService.playSfx(this, 'purchase_chime');
        if (data.itemId === 'upgrade_traversal') {
            this.removeGate();
        }
        GameEvents.emit(Events.COINS_CHANGED, this.coins);
        // Refresh-only re-emit: UIScene's onShopOpen re-entry guard re-renders
        // the panel WITHOUT re-pausing OverworldScene (T-03-11 / Pitfall 3)
        GameEvents.emit(Events.SHOP_OPEN, { coins: this.coins, flags: { ...this.flags } });
        void SaveService.save(this.buildSaveState());
    };

    // Phase 3 Slice 3: shop close — clear the shopOpen guard (T-03-12)
    private onShopClose = (): void => {
        this.shopOpen = false;
    };

    // World-build gate: create() kicks off SaveService.load() and only builds the
    // world (and flips _ready) once the load promise settles. update() short-circuits
    // until _ready so no tick reads scene state before the save is applied (CR-01).
    private _ready = false;

    // Stored handler references for precise removal in shutdown() (WR-05, CR-03 fix)
    private _onHidden = (): void => { void SaveService.save(this.buildSaveState()); };
    private onDialogueComplete = (): void => {
        this.inDialogue = false;
        void SaveService.save(this.buildSaveState());
        // Phase 3 Slice 3: after storeClerk dialogue completes, open the shop (Open Question 2).
        // DEFER the SHOP_OPEN emit to the next tick. This same DIALOGUE_COMPLETE event is
        // ALSO handled by UIScene (registered after us), whose handler resets state to HUD and
        // resumes OverworldScene. Emitting synchronously here opens the shop while UIScene is
        // still in DIALOGUE state, and UIScene's later handler then reverts it to HUD — hiding
        // the shop while shopOpen stays true → soft-lock. Deferring lets UIScene finish its
        // DIALOGUE_COMPLETE first, so SHOP_OPEN lands cleanly from the HUD state.
        if (this._lastNpcId === 'storeClerk') {
            this._lastNpcId = null;
            this.shopOpen = true;
            this.time.delayedCall(0, () => {
                GameEvents.emit(Events.SHOP_OPEN, { coins: this.coins, flags: { ...this.flags } });
            });
        }
    };

    // Phase 3 Slice 2: HOSPITAL_DISMISS carrier — UIScene dismiss emits it; we respawn at home (D-11)
    // Phase 3.1 (FEEL-04): fade out → teleport → fade in, instead of an instant cross-map jump
    private onHospitalDismiss = (): void => {
        this.hospitalShowing = false;
        this.cameras.main.fadeOut(180, 26, 26, 46);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.player.sprite.setPosition(SPAWN_X, SPAWN_Y);
            this.cameras.main.fadeIn(180, 26, 26, 46);
            void SaveService.save(this.buildSaveState());
        });
    };

    constructor() {
        super('OverworldScene');
    }

    /**
     * create() must NOT build the world from saved state synchronously: Phaser does
     * NOT await init()/create(), and SaveService.load() is IndexedDB-backed and always
     * resolves on a later microtask. We therefore kick off the load here and build the
     * world only inside the resolved callback, flipping _ready when done. update() is
     * gated on _ready so no tick runs before saved coins/flags/position are applied (CR-01).
     */
    create(): void {
        void SaveService.load().then((saved) => {
            // Guard against the scene being shut down / restarted while the load
            // was in flight — building a dead scene throws on this.add/this.physics.
            if (!this.sys || !this.sys.isActive()) return;
            this.buildWorld(saved);
            this._ready = true;
        });
    }

    /**
     * Build the entire overworld from the (already-resolved) saved state.
     * Invoked exactly once from create()'s load callback — never before the
     * save promise settles, so this.coins/flags/position are authoritative here.
     */
    private buildWorld(saved: SaveState | undefined): void {
        // ── Apply saved state (if any) ─────────────────────────────────────
        if (saved) {
            this.coins = saved.coins;
            this.flags = saved.flags;
            this.journalUnlocked = saved.journalUnlocked ? [...saved.journalUnlocked] : [];
        }
        const startX = saved?.position?.x ?? SPAWN_X;
        const startY = saved?.position?.y ?? SPAWN_Y;

        // ── Tilemap: two layers, 16px tiles (Kenney Tiny Town) ────────────
        const TILE = 16;

        // Ground layer — grass + auto-tiled dirt; no collision
        // NOTE: margin=0, spacing=0 because tilemap_packed.png has no tile padding (no ghosting seams).
        const gMap = this.make.tilemap({ data: GROUND_DATA, tileWidth: TILE, tileHeight: TILE });
        const gTileset = gMap.addTilesetImage('tiny_town_tiles', 'tiny_town_tiles', TILE, TILE, 0, 0);
        if (gTileset) {
            gMap.createLayer(0, gTileset, 0, 0);
        }

        // Deco layer — collidable props; -1 cells are empty/transparent
        const dMap = this.make.tilemap({ data: DECO_DATA, tileWidth: TILE, tileHeight: TILE });
        const dTileset = dMap.addTilesetImage('tiny_town_tiles', 'tiny_town_tiles', TILE, TILE, 0, 0);
        const dLayer = dTileset ? dMap.createLayer(0, dTileset, 0, 0) : null;

        // Player must exist before collider is added
        this.player = new Player(this, startX, startY);

        if (dLayer) {
            dLayer.setCollisionByExclusion([-1]);   // all non-(-1) deco tiles block movement
            this.physics.add.collider(this.player.sprite, dLayer);
        }

        // Camera bounds — world pixel size is same as before (480×832) but formula changes
        // GROUND_DATA[0].length * 16 = 30 * 16 = 480; GROUND_DATA.length * 16 = 52 * 16 = 832
        this.cameras.main.setBounds(0, 0, GROUND_DATA[0].length * TILE, GROUND_DATA.length * TILE);
        this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);

        // Phase 3.1 (FEEL-01): Zelda-scale camera. Zoom 3 shows ~10 tiles across
        // (160×285 world px on the 480×854 canvas) so the town spans ~3×3 screens
        // and the camera genuinely scrolls. Deadzone keeps micro-jitter off the
        // camera; all HUD/touch UI lives in UIScene (own camera, unzoomed).
        this.cameras.main.setZoom(3);
        this.cameras.main.setDeadzone(40, 30);

        // Physics world must match the tilemap. Without this the world stays at the
        // default canvas size (480×854 > map height 832) and setCollideWorldBounds
        // lets the player walk 22px past the map's bottom edge (FEEL-05).
        this.physics.world.setBounds(0, 0, GROUND_DATA[0].length * TILE, GROUND_DATA.length * TILE);

        // Fade in from black — no hard cut into the world (FEEL-04)
        this.cameras.main.fadeIn(400, 26, 26, 46);

        // ── TriggerSystem (Plan 02-02) ─────────────────────────────────────
        this.triggerSystem = new TriggerSystem();

        // Defeat guard — permanently consume the boss zone so a beaten boss
        // never re-triggers, even after the player walks out and back in.
        // Order is load-bearing: this must run BEFORE armLoadPosition so that
        // armLoadPosition's consumed.has() check skips the already-consumed zone
        // (leaving it permanently suppressed, not re-armable via pendingExit).
        if (this.flags['boss_01_defeated']) {
            this.triggerSystem.consume('boss_trigger');
        }

        // Arm load-position: if the save parked the player inside any zone (e.g.,
        // the boss zone save written by enterBoss() before sleep), suppress the zone
        // until the player steps out — preventing an auto-launch on the first tick.
        this.triggerSystem.armLoadPosition(startX, startY);

        // ── Phase 3.1 (FEEL-06): visible set-piece markers + confirm prompt ──
        // Set pieces are no longer entered by invisible walk-over hijack: each
        // zone shows a bobbing marker, and standing in the zone shows a prompt.
        // INTERACT (Space/Enter) or tapping the marker launches the set piece.
        for (const def of MARKER_DEFS) {
            const marker = this.add.image(def.x, def.y, def.texture)
                .setDepth(4)
                .setInteractive(
                    new Phaser.Geom.Rectangle(-16, -16, 32, 32),
                    Phaser.Geom.Rectangle.Contains,
                );
            this.tweens.add({
                targets: marker, y: def.y - 3,
                duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
            });
            marker.on('pointerdown', () => {
                if (this.pendingTrigger?.zone === def.zone) this.confirmTrigger();
            });
            this.triggerMarkers.set(def.zone, marker);
        }
        // A beaten boss never re-triggers — hide its marker too
        if (this.flags['boss_01_defeated']) {
            this.triggerMarkers.get('boss_trigger')?.setVisible(false);
        }
        this.triggerPrompt = this.add.text(0, 0, '', {
            fontSize: '6px', color: '#f5c842',
            fontFamily: '"Press Start 2P", monospace',
            backgroundColor: '#1a1a2ecc', padding: { x: 3, y: 2 },
            align: 'center',
        }).setOrigin(0.5, 1).setDepth(6).setVisible(false);

        // Fade back in whenever we return from a set piece (FEEL-04)
        this.events.on(Phaser.Scenes.Events.WAKE, () => {
            this.cameras.main.fadeIn(250, 26, 26, 46);
        });

        // ── NPCs ───────────────────────────────────────────────────────────
        for (const def of NPC_DEFS) {
            const npc = new NPC(this, def.x, def.y, def.texture, def.npcId, def.dialogueKey);
            this.npcs.push(npc);

            // Touch interact: tap the NPC (zone covers sprite + TALK prompt;
            // Zone is unaffected by placeholder-texture scaling). Only fires
            // when the player is in range — same rule as Space/Enter.
            const tapZone = this.add.zone(def.x, def.y - 20, 64, 96)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });
            tapZone.on('pointerdown', () => {
                if (this.currentNpcInRange === npc) this.handleInteract();
            });

            // TALK prompt (hidden until in range)
            const prompt = this.add.text(def.x, def.y - 40, t('hud.talkPrompt'), {
                fontSize: '8px',
                color: '#00ff88',
                fontFamily: '"Press Start 2P", monospace',
            }).setOrigin(0.5).setVisible(false).setDepth(5);
            this.talkPrompts.set(def.npcId, prompt);
        }

        // ── Phase 3: Bush whackable group ─────────────────────────────────
        this.whackableGroup = this.physics.add.group();
        for (const bushDef of ECONOMY_DATA.bushes) {
            const bush = new BushEntity(this, bushDef.x, bushDef.y, bushDef.id, bushDef.special);
            this.whackableGroup.add(bush.sprite);
            this.bushEntities.set(bushDef.id, bush);
        }

        // ── Phase 3: WhackSystem (directional hitbox) ──────────────────────
        this.whackSystem = new WhackSystem(this);
        this.physics.add.overlap(
            this.whackSystem.hitbox,
            this.whackableGroup,
            this.onBushHit as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this,
        );

        // ── Phase 3: Traversal gate barrier ────────────────────────────────
        // Phase 3.1 (FEEL-05): the barrier is now a visible wooden barricade in
        // the single fenced gap into the east pocket (the pocket's perimeter is
        // sealed with fence deco tiles, so it can no longer be walked around).
        this.gateBarrier = this.add.rectangle(
            ECONOMY_DATA.gateBarrier.x, ECONOMY_DATA.gateBarrier.y,
            ECONOMY_DATA.gateBarrier.w, ECONOMY_DATA.gateBarrier.h,
            0x8a5a2a, 0.95,
        ).setStrokeStyle(1, 0x4a2f14).setDepth(4);
        this.physics.add.existing(this.gateBarrier, true);
        this.physics.add.collider(this.player.sprite, this.gateBarrier);
        // Gate sign — small tag above the barricade
        this.gateSignText = this.add.text(
            ECONOMY_DATA.gateBarrier.x, ECONOMY_DATA.gateBarrier.y - 22,
            'BUS PASS\nREQUIRED',
            {
                fontSize: '6px', color: '#ff4444',
                fontFamily: '"Press Start 2P", monospace',
                align: 'center', backgroundColor: '#1a1a2ecc', padding: { x: 2, y: 2 },
            },
        ).setOrigin(0.5).setDepth(5);
        if (this.flags['upgrade_traversal']) {
            this.removeGate();
        }

        // ── Phase 3 Slice 3: SHOP event listeners (CR-03) ─────────────────
        GameEvents.on(Events.SHOP_PURCHASE, this.onShopPurchase, this);
        GameEvents.on(Events.SHOP_CLOSE,    this.onShopClose,    this);

        // ── Shop sign over the Store Clerk's storefront (house tiles at rows 9-11, cols 20-22) ──
        this.add.text(344, 136, t('shop.title'), {
            fontSize: '8px', color: '#f5c842',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setDepth(6);

        // ── Dog patrol (patience mechanic GAME-06) ─────────────────────────
        this.dogSprite = this.add.image(DOG_MIN_X, 464, 'dog')
            .setDisplaySize(32, 16).setDepth(3);
        this.setupDogPatrol();

        // ── Touch controls (joystick + whack button) ──────────────────────
        // Phase 3.1 (FEEL-01): moved to UIScene. This scene's camera is zoomed 3×,
        // so screen-anchored controls can no longer live here — UIScene owns them
        // and shares the joystick handle via the game registry ('vjoy'). update()
        // lazily picks the handle up once the async plugin import resolves.

        // ── Keyboard ──────────────────────────────────────────────────────
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.wasd = {
                up:    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                down:  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                left:  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            };
            this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
            const enterKey   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
            this.pauseKey    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

            // Space/Enter: interact with NPC if in range, else whack (D-01 context-sensitive)
            this.interactKey.on('down', this.handleInteractOrWhack, this);
            enterKey.on('down', this.handleInteractOrWhack, this);
            this.pauseKey.on('down', () => {
                GameEvents.emit(Events.PAUSE_REQUESTED);
            });

            // Phase 3: J key = always-whack (unconditional, D-01)
            const jKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
            jKey.on('down', () => {
                InputBus.setAction(Action.WHACK, true);
            });
        }

        // ── Launch UIScene parallel overlay ────────────────────────────────
        this.scene.launch('UIScene');

        // ── Phase 3.1 (FEEL-03): overworld BGM loop ───────────────────────
        // Gated on the music toggle; added once (sound manager is game-global,
        // so guard against duplicates on scene restart). Stopped in shutdown().
        if (AudioService.getMusicEnabled() && this.cache.audio.exists('bgm_overworld')) {
            const existing = this.sound.get('bgm_overworld');
            if (!existing) {
                this.sound.add('bgm_overworld', { loop: true, volume: 0.5 }).play();
            } else if (!existing.isPlaying) {
                existing.play();
            }
        }

        // ── Autosave on game hidden (tab switch / phone lock) ─────────────
        // Stored as a class field so shutdown() can remove it precisely (WR-05 fix)
        this.game.events.on(Phaser.Core.Events.HIDDEN, this._onHidden, this);

        // ── Resume from dialogue ───────────────────────────────────────────
        GameEvents.on(Events.DIALOGUE_COMPLETE, this.onDialogueComplete, this);

        // ── Phase 3 Slice 2: HOSPITAL_DISMISS → respawn player at (96,96) (D-11, CR-03) ──
        GameEvents.on(Events.HOSPITAL_DISMISS, this.onHospitalDismiss, this);

        // Boss zone entry — first-time autosave + scene trigger
        // (full boss trigger wired in Plan 02-02 via TriggerSystem)
    }

    update(): void {
        // World not built yet (SaveService.load() still pending) — skip the tick so
        // nothing reads this.player/coins/flags before buildWorld() runs (CR-01).
        if (!this._ready) return;
        if (this.inDialogue || this.inHandoff || this.shopOpen || this.hospitalShowing) return;

        // Phase 3.1: joystick lives in UIScene now — pick up the shared handle
        // once the async rex-plugin import over there has resolved (FEEL-01)
        if (!this.joystick) {
            this.joystick = (this.registry.get('vjoy') as typeof this.joystick) ?? null;
        }

        // Build merged cursor stub (WASD + arrow keys)
        const mergedCursors = this.buildMergedCursors();
        InputBus.update(this.joystick, mergedCursors);
        this.player.update();

        // Phase 3: WHACK poll — consume the pulse and activate hitbox if cooldown allows
        if (InputBus.isActive(Action.WHACK)) {
            InputBus.setAction(Action.WHACK, false); // consume immediately
            if (this.player.whack()) {
                this.activateWhack();
            }
        }

        // NPC range checks
        this.currentNpcInRange = null;
        for (const npc of this.npcs) {
            const inRange = npc.isPlayerInRange(this.player.sprite);
            const prompt  = this.talkPrompts.get(npc.npcId);
            if (prompt) {
                if (inRange && !prompt.visible) {
                    this.showTalkPrompt(npc);
                } else if (!inRange && prompt.visible) {
                    this.hideTalkPrompt(npc);
                }
            }
            if (inRange) this.currentNpcInRange = npc;
        }

        // Boss zone proximity check (first visit autosave — legacy path)
        if (!this.bossZoneVisited) {
            const bx = this.player.sprite.x - BOSS_ZONE_X;
            const by = this.player.sprite.y - BOSS_ZONE_Y;
            if (Math.sqrt(bx * bx + by * by) <= BOSS_ZONE_R) {
                this.bossZoneVisited = true;
                this.flags['boss_zone_visited'] = true;
                void SaveService.save(this.buildSaveState());
            }
        }

        // ── Phase 3 Slice 2: Dog-bite detection (D-09, D-10; Pitfall 2: isInvincible guard) ──
        // isInvincible guard is MANDATORY — without it the overlap re-fires every frame draining coins
        if (this.dogSprite && !this.player.isInvincible) {
            const dx = this.player.sprite.x - this.dogSprite.x;
            const dy = this.player.sprite.y - this.dogSprite.y;
            if (Math.sqrt(dx * dx + dy * dy) < 24) {
                this.onDogBite();
            }
        }

        // ── Phase 3 Slice 2: Patience-bonus reward (GAME-06, D-09; CR-03 wiring) ──
        // The dog patrols row 14 (y≈464). When the gap window is open (dogGapActive)
        // and the player slips through the far-end corridor while the dog is away,
        // award the one-shot patience bonus. awardPatienceBonus() guards on both
        // dogGapActive and the patience_used flag so it can fire at most once.
        if (this.dogGapActive && !this.flags['patience_used']) {
            const py = this.player.sprite.y;
            const px = this.player.sprite.x;
            // Far-end gap corridor: south of the dog's row, near the far (max-X) end.
            if (py > 440 && px > DOG_MAX_X - 48) {
                this.awardPatienceBonus();
            }
        }

        // ── Phase 3 Slice 3: Traversal reward zone (east pocket, D-16) ───────
        // Phase 3.1: tightened to the fenced pocket itself (rows 5-8, cols 21+)
        // so the one-shot stash can't fire from the open grass south of it.
        if (this.flags['upgrade_traversal'] && !this.flags['traversal_reward_collected']) {
            const px = this.player.sprite.x;
            const py = this.player.sprite.y;
            if (px > 336 && py < 144) {
                this.awardTraversalReward();
            }
        }

        // ── TriggerSystem zone check (Phase 3.1 FEEL-06: prompt + confirm) ──
        // Standing in a zone shows the marker prompt; the set piece launches
        // only on INTERACT / marker tap — never by invisible walk-over hijack.
        const hit = this.triggerSystem.checkZones(
            this.player.sprite.x,
            this.player.sprite.y,
        );
        if (hit) {
            if (this.pendingTrigger?.zone !== hit.zone) {
                this.pendingTrigger = hit;
                const def = MARKER_DEFS.find(d => d.zone === hit.zone);
                if (def && this.triggerPrompt) {
                    this.triggerPrompt
                        .setText(t(def.promptKey))
                        .setPosition(def.x, def.y - 14)
                        .setVisible(true);
                }
            }
        } else if (this.pendingTrigger) {
            this.pendingTrigger = null;
            this.triggerPrompt?.setVisible(false);
        }
    }

    /**
     * Phase 3.1 (FEEL-06): confirmed set-piece entry — from INTERACT while inside
     * a trigger zone, or tapping the zone's marker. Consumes the zone and fades
     * into the target scene.
     */
    private confirmTrigger(): void {
        const hit = this.pendingTrigger;
        if (!hit || this.inHandoff) return;
        this.pendingTrigger = null;
        this.triggerPrompt?.setVisible(false);
        this.triggerSystem.consume(hit.zone);
        if (hit.target === 'PaperThrowScene') {
            this.enterMiniGame('PaperThrowScene', { zone: hit.zone });
        } else if (hit.target === 'BossScene') {
            this.enterBoss();
        }
    }

    // ── Scene handoff: mini-game ─────────────────────────────────────────

    /**
     * Sleep the overworld, launch a mini-game scene, listen for MINIGAME_COMPLETE
     * then wake the overworld and apply results (RESEARCH Pattern 3).
     * Pitfall 1: never read the launched scene synchronously.
     * Pitfall 2: input cleanup handled by PaperThrowScene.shutdown().
     */
    private enterMiniGame(sceneKey: string, data: object): void {
        this.inHandoff = true;
        // Phase 3.1 (FEEL-04): fade out, then hand off — no hard cut
        this.cameras.main.fadeOut(250, 26, 26, 46);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.sleep();
            this.scene.launch(sceneKey, data);
        });

        GameEvents.once(Events.MINIGAME_COMPLETE, (result: { score: number; perfect: number }) => {
            this.scene.stop(sceneKey);
            this.scene.wake();
            this.inHandoff = false;

            // Apply coin reward via injectable helper — emits COINS_CHANGED so HUD updates
            this.coins = awardMinigameCoins(this.coins, result, (n) => GameEvents.emit(Events.COINS_CHANGED, n));

            // Re-allow re-entry after returning from mini-game
            this.triggerSystem.release('minigame_trigger');

            // Save checkpoint
            void SaveService.save(this.buildSaveState());
        });
    }

    // ── Scene handoff: boss ──────────────────────────────────────────────

    /**
     * Sleep the overworld, launch BossScene, listen for BOSS_DEFEATED
     * then wake, set defeat flag, forward event to UIScene, save.
     * Pitfall 1: never read BossScene state synchronously.
     */
    private enterBoss(): void {
        this.inHandoff = true;

        // Save first-entry checkpoint before sleeping
        this.flags['boss_zone_visited'] = true;
        void SaveService.save(this.buildSaveState());

        // Phase 3.1 (FEEL-04): fade out, then hand off — no hard cut
        this.cameras.main.fadeOut(250, 26, 26, 46);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.sleep();
            this.scene.launch('BossScene');
        });

        GameEvents.once(Events.BOSS_DEFEATED, (result: { patienceBonus: number }) => {
            this.scene.stop('BossScene');
            this.scene.wake();
            this.inHandoff = false;

            // Mark boss defeated and apply patience bonus coins
            this.flags['boss_01_defeated'] = true;
            this.coins += (result?.patienceBonus ?? 0);

            // Track journal unlock (CR-08 fix: persist across saves)
            if (!this.journalUnlocked.includes(LEVEL_01_MANIFEST.journalUnlock)) {
                this.journalUnlocked.push(LEVEL_01_MANIFEST.journalUnlock);
            }

            // Save checkpoint
            void SaveService.save(this.buildSaveState());

            // Phase 3.1 (FEEL-05): hide the beaten boss's marker for this session
            this.triggerMarkers.get('boss_trigger')?.setVisible(false);

            // Phase 3.1 (FEEL-05): tell UIScene to show LEVEL_COMPLETE via a
            // DEDICATED event. Re-emitting BOSS_DEFEATED here used to stack a
            // second level-complete overlay on top of the first (UIScene heard
            // both BossScene's original emit and this re-emit).
            GameEvents.emit(Events.LEVEL_COMPLETE_SHOW, result);
        });
    }

    /**
     * Handle Space/Enter: interact with NPC if in range, else fire WHACK (D-01 context-sensitive).
     * Replaces the direct handleInteract() binding for Space/Enter keys.
     */
    private handleInteractOrWhack(): void {
        if (this.currentNpcInRange) {
            this.handleInteract();
        } else if (this.pendingTrigger) {
            // Phase 3.1 (FEEL-06): confirm set-piece entry while inside its zone
            this.confirmTrigger();
        } else {
            InputBus.setAction(Action.WHACK, true);
        }
    }

    /** Handle INTERACT action (Space / Enter / on-screen TALK button). */
    private handleInteract(): void {
        if (this.inDialogue) return;
        if (!this.currentNpcInRange) return;
        this.inDialogue = true;
        // Phase 3 Slice 3: track last NPC id for shop-entry after dialogue (Open Question 2)
        this._lastNpcId = this.currentNpcInRange.npcId;
        this.hideTalkPrompt(this.currentNpcInRange);
        // Store Clerk uses the shopIntro dialogue so the shop opens after it completes
        const dialogueKey = this.currentNpcInRange.npcId === 'storeClerk'
            ? 'storeClerk.shopIntro'
            : this.currentNpcInRange.dialogueKey;
        GameEvents.emit(Events.DIALOGUE_START, {
            npcId:       this.currentNpcInRange.npcId,
            dialogueKey,
        });
    }

    /**
     * Phase 3: Activate the whack — hitbox, swing overlay, SFX (D-02, D-03, D-04).
     * Called from update() when WHACK is polled and player.whack() cooldown allows.
     */
    private activateWhack(): void {
        const px = this.player.sprite.x;
        const py = this.player.sprite.y;
        const facing = this.player.facing;

        // Phase 3.1 (FEEL-05): new swing → clear the one-award-per-swing guard
        this.swingTracker.beginSwing();

        // Activate the directional hitbox (150ms active window, using WhackOffsets seam)
        // upgrade_newspaper effect: pass enlarged flag so WhackSystem grows the hitbox (D-14)
        this.whackSystem.activate(px, py, facing, !!this.flags['upgrade_newspaper']);

        // D-04: Overlay swing sprite — separate sprite, NOT a player_sheet re-cut
        // Anchored 20px in front of the player based on facing
        const offsets: Record<string, { ox: number; oy: number; flipX: boolean; flipY: boolean }> = {
            down:  { ox:   0, oy:  20, flipX: false, flipY: false },
            up:    { ox:   0, oy: -20, flipX: false, flipY: true  },
            left:  { ox: -20, oy:   0, flipX: true,  flipY: false },
            right: { ox:  20, oy:   0, flipX: false, flipY: false },
        };
        const off = offsets[facing] ?? offsets.down;
        const swingSprite = this.add.sprite(px + off.ox, py + off.oy, 'newspaper_swing')
            .setFlipX(off.flipX)
            .setFlipY(off.flipY)
            .setDepth(this.player.sprite.depth + 1);
        swingSprite.play('newspaper_swing_anim');
        // Auto-cleanup: hideOnComplete destroys visibility; clean up from scene on anim complete
        swingSprite.on('animationcomplete', () => swingSprite.destroy());

        // SFX (gated on mute toggle via AudioService, T-03-05)
        AudioService.playSfx(this, 'whack');
    }

    /**
     * Phase 3: Called by physics.add.overlap when the WhackSystem hitbox overlaps a bush sprite.
     * Clears the bush with visual/SFX feedback, then delegates to awardWhackDrop().
     *
     * @param _hitbox   The hitbox rectangle (unused — we look up the bush by its sprite data)
     * @param bushSprite The overlapping bush sprite
     */
    private onBushHit(
        _hitbox: Phaser.Types.Physics.Arcade.GameObjectWithBody,
        bushSprite: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    ): void {
        const sprite = bushSprite as Phaser.Physics.Arcade.Sprite;
        const bushId = sprite.getData('bushId') as string | undefined;
        if (!bushId) return;
        const bush = this.bushEntities.get(bushId);
        if (!bush || bush.isCleared()) return;
        // Phase 3.1 (FEEL-05): one award per swing per bush — arcade overlap
        // re-fires every frame the 150ms hitbox keeps intersecting the bush.
        if (!this.swingTracker.registerHit(bushId)) return;

        // Clear SYNCHRONOUSLY (marks cleared + disables body) so no later frame
        // of this overlap can double-award; the sprite stays visible for feedback.
        bush.onWhacked();

        // FEEL-04 juice: white flash + squash-pop tween, then hide; camera nudge
        sprite.setTint(0xffffff);
        this.cameras.main.shake(60, 0.004);
        this.tweens.add({
            targets: sprite,
            scaleX: 1.35, scaleY: 0.6, alpha: 0.4,
            duration: 110, ease: 'Quad.easeOut',
            onComplete: () => {
                sprite.clearTint();
                bush.hide();
                sprite.setScale(1).setAlpha(1);
            },
        });

        // FEEL-06: regrow after cooldown (staggered by a small deterministic
        // offset per bush so a cleared field doesn't pop back all at once)
        const stagger = (bushId.charCodeAt(bushId.length - 1) % 8) * 900;
        this.time.delayedCall(BUSH_REGROW_MS + stagger, () => {
            if (!bush.isCleared()) return;
            bush.reset();
            bush.sprite.setScale(0.2);
            this.tweens.add({
                targets: bush.sprite, scaleX: 1, scaleY: 1,
                duration: 250, ease: 'Back.easeOut',
            });
        });

        // Leaf particle burst (UI-SPEC §2b)
        try {
            const particles = this.add.particles(sprite.x, sprite.y, 'leaf_particle', {
                speed: { min: 40, max: 100 },
                angle: { min: 0, max: 360 },
                scale: { start: 1, end: 0 },
                alpha: { start: 1, end: 0 },
                lifespan: 400,
                gravityY: 80,
                quantity: 6,
                emitting: false,
            });
            particles.explode(6);
            this.time.delayedCall(500, () => particles.destroy());
        } catch {
            // Phaser 4 particle API fallback: brief alpha tween on leaf sprites (RESEARCH Open Question 1)
            for (let i = 0; i < 3; i++) {
                const leaf = this.add.image(
                    sprite.x + (Math.random() - 0.5) * 24,
                    sprite.y + (Math.random() - 0.5) * 24,
                    'leaf_particle',
                );
                this.tweens.add({
                    targets: leaf, alpha: 0, y: leaf.y - 20,
                    duration: 400,
                    onComplete: () => leaf.destroy(),
                });
            }
        }

        // Award prize-pack drop (filled in Task 2b; stub here so 2a compiles)
        this.awardWhackDrop(bush);
    }

    /**
     * Phase 3: Roll the prize-pack for a cleared bush and award coins/items (D-05, D-06, D-08).
     * Slice 2 extended: streak payout fires on the 8th consecutive bush-without-bite (D-07).
     *
     * - Uses firstWhackOrRoll() seam from Plan 01 for the D-06 first-whack guarantee.
     * - Sets first_whack_done flag AFTER the call (so first whack always returns a coin).
     * - Emits COINS_CHANGED on every coin delta (closes the D-08 HUD gap).
     * - Emits BUSH_WHACKED with streak count (HUD streak pips in UIScene).
     * - At streak 8: emits STREAK_BONUS (8 coins, or Journal page at special milestone bush).
     * - Autosaves via SaveService after every coin award.
     *
     * Note: bushStreak transient — NOT in buildSaveState() (D-07 spec).
     */
    private awardWhackDrop(bush: BushEntity): void {
        const drop = firstWhackOrRoll(this.flags, this.prizePackState);

        // D-06: mark first_whack_done AFTER the call so the override fires correctly
        if (!this.flags['first_whack_done']) {
            this.flags['first_whack_done'] = true;
        }

        if (drop.coins > 0) {
            this.coins += drop.coins;
            AudioService.playSfx(this, 'coin_ding');
            // Increment streak counter (reset to 0 by dog bite)
            this.bushStreak += 1;
            // BUSH_WHACKED carries streak so UIScene can update pip indicator (D-07)
            GameEvents.emit(Events.BUSH_WHACKED, { streak: this.bushStreak });
            // COINS_CHANGED — closes D-08 HUD gap; UIScene.onCoinsChanged drives HUD update
            GameEvents.emit(Events.COINS_CHANGED, this.coins);
            // Autosave
            void SaveService.save(this.buildSaveState());
        } else if (drop.item === 'snack') {
            // Snack drop: increment streak + emit BUSH_WHACKED (snack effect deferred to Slice 3)
            this.bushStreak += 1;
            GameEvents.emit(Events.BUSH_WHACKED, { streak: this.bushStreak });
            // No COINS_CHANGED (no coins), no autosave needed for snack (transient)
        }
        // No-drop (null-coalesced to {coins:0,item:null}): no events, no save

        // Phase 3 Slice 2: Streak bonus payout on 8th consecutive whack-without-bite (D-07)
        if (this.bushStreak >= 8) {
            this.bushStreak = 0;
            AudioService.playSfx(this, 'streak_bonus');
            if (bush.special) {
                // Milestone bush: Journal page (content key is a Phase-3 seed, Slice 3 wires content)
                const journalKey = 'journal_streak_milestone';
                if (!this.journalUnlocked.includes(journalKey)) {
                    this.journalUnlocked.push(journalKey);
                }
                GameEvents.emit(Events.STREAK_BONUS, { coins: 0, journal: true });
            } else {
                // Regular bush: 8-coin snowball bonus
                this.coins += 8;
                GameEvents.emit(Events.COINS_CHANGED, this.coins);
                GameEvents.emit(Events.STREAK_BONUS, { coins: 8, journal: false });
            }
            // Emit BUSH_WHACKED with 0 to clear the HUD pips after payout
            GameEvents.emit(Events.BUSH_WHACKED, { streak: 0 });
            void SaveService.save(this.buildSaveState());
        }
    }

    private showTalkPrompt(npc: NPC): void {
        const prompt = this.talkPrompts.get(npc.npcId);
        if (!prompt) return;
        prompt.setVisible(true);
        const timer = this.time.addEvent({
            delay: 500, loop: true,
            callback: () => prompt.setVisible(!prompt.visible),
        });
        this.blinkTimers.set(npc.npcId, timer);
    }

    private hideTalkPrompt(npc: NPC): void {
        const prompt = this.talkPrompts.get(npc.npcId);
        if (prompt) prompt.setVisible(false);
        const timer = this.blinkTimers.get(npc.npcId);
        if (timer) { timer.remove(); this.blinkTimers.delete(npc.npcId); }
    }

    private setupDogPatrol(): void {
        if (!this.dogSprite) return;
        // Phase 3.1 (FEEL-05): the gap window is driven by the SAME tween that
        // moves the dog (onYoyo fires exactly when it reaches the far end), so
        // the patience window can never drift out of sync with the sprite.
        // Previously a separate TimerEvent flipped the window on its own clock.
        this.tweens.add({
            targets: this.dogSprite,
            x: { from: DOG_MIN_X, to: DOG_MAX_X },
            duration: DOG_PERIOD / 2,
            repeat: -1,
            yoyo: true,
            onYoyo: () => {
                // Dog is at the far (max-X) end — patience gap opens
                this.dogSprite?.setFlipX(true);
                this.dogGapActive = true;
                this.time.delayedCall(DOG_GAP_MS, () => {
                    this.dogGapActive = false;
                });
            },
            onRepeat: () => {
                this.dogSprite?.setFlipX(false);
            },
        });
    }

    /**
     * Award patience bonus when player passes through the dog-gap route.
     * Called by OverworldScene.update() when player enters the gap corridor
     * and dogGapActive is true — OverworldScene handles the overlap check.
     */
    awardPatienceBonus(): void {
        if (!this.dogGapActive) return;
        // CR-03 idempotency: award the GAME-06 patience bonus at most once. Without
        // this guard update() would re-fire it every frame the player lingers in the
        // gap corridor while dogGapActive is true, draining the reward into a coin geyser.
        if (this.flags['patience_used']) return;
        this.coins += PATIENCE_BONUS_COINS;
        this.flags['patience_used'] = true;
        GameEvents.emit(Events.COINS_CHANGED, this.coins);
        GameEvents.emit(Events.PATIENCE_BONUS, PATIENCE_BONUS_COINS);
        void SaveService.save(this.buildSaveState());
    }

    /**
     * Phase 3 Slice 2: Handle dog-contact bite (D-09, D-10, D-11, D-12).
     * isInvincible is already checked in update() before this is called.
     * Sequence: SFX → streak reset → compute fee → knockback (sets i-frames) → completeHospital on finish.
     */
    private onDogBite(): void {
        AudioService.playSfx(this, 'dog_bite');
        // FEEL-04: a bite lands with weight — brief strong shake
        this.cameras.main.shake(120, 0.008);
        // Reset streak immediately (D-12) — pips clear via BUSH_WHACKED { streak: 0 }
        this.bushStreak = 0;
        GameEvents.emit(Events.BUSH_WHACKED, { streak: 0 });
        // Compute fee now (before coins change) so the overlay can show the correct amount.
        // WR-05: snapshot helmetOwned at the SAME instant as the fee so the two reads
        // can't desync during the ~960ms i-frame window; thread both into completeHospital.
        const fee = computeHospitalFee(this.coins, this.flags);
        const helmetOwned = !!this.flags['upgrade_helmet'];
        // applyKnockback sets _invincible=true synchronously (T-03-06: blocks re-entry immediately)
        // onComplete fires after ~960ms i-frame flash — then show the hospital beat
        this.player.applyKnockback(
            this.dogSprite!.x, this.dogSprite!.y,
            () => this.completeHospital(fee, helmetOwned),
        );
    }

    /**
     * Phase 3 Slice 2: Apply hospital fee + emit PLAYER_HOSPITALIZED after knockback (D-11).
     * Fee is authoritative here (coins can never go negative — T-03-07).
     * RESPAWN is NOT here — it happens in onHospitalDismiss when UIScene emits HOSPITAL_DISMISS.
     */
    private completeHospital(fee: number, helmetOwned: boolean): void {
        // CR-02: the fee was captured at bite time (~960ms ago). Re-clamp against
        // the LIVE balance at deduction time so we never deduct more than the player
        // currently holds, and so the overlay shows the amount actually removed.
        const liveFee = Math.min(fee, this.coins);
        this.coins = this.coins - liveFee;
        GameEvents.emit(Events.COINS_CHANGED, this.coins);
        this.hospitalShowing = true;
        GameEvents.emit(Events.PLAYER_HOSPITALIZED, {
            fee: liveFee,
            // WR-05: helmetOwned captured once in onDogBite and threaded through here
            // so it stays consistent with the fee that was computed at bite time.
            helmetOwned,
        });
        void SaveService.save(this.buildSaveState());
    }

    /**
     * Phase 3 Slice 3: Remove the traversal gate barrier when upgrade_traversal is purchased.
     * Disables the collider body and hides the sign text (D-16, Pattern 5).
     * Also gives a one-time coin stash + journal page in the now-accessible area.
     */
    private removeGate(): void {
        if (this.gateBarrier) {
            (this.gateBarrier.body as Phaser.Physics.Arcade.StaticBody).enable = false;
            this.gateBarrier.setVisible(false);  // Phase 3.1: barricade is visible art now
        }
        if (this.gateSignText) {
            this.gateSignText.setVisible(false);
        }
        // One-time reward (only when actually purchasing, not on load-restore)
        // The coin stash + journal page are awarded when the player first enters the area.
        // They are flagged by 'traversal_reward_collected' to prevent duplicate awards.
        // (Actual pickup is in update() via zone check — see awardTraversalReward.)
    }

    /**
     * Phase 3 Slice 3: Award the one-time traversal reward (coin stash + journal page).
     * Called from update() when the player enters the east reward area (past the gate).
     * Guarded by 'traversal_reward_collected' flag so it fires only once.
     */
    private awardTraversalReward(): void {
        if (this.flags['traversal_reward_collected']) return;
        this.flags['traversal_reward_collected'] = true;
        // Coin stash: 15 coins
        this.coins += 15;
        AudioService.playSfx(this, 'coin_ding');
        GameEvents.emit(Events.COINS_CHANGED, this.coins);
        // Journal page seed (content wired when Journal UI is built in Phase 5)
        const journalKey = 'journal_traversal_reward';
        if (!this.journalUnlocked.includes(journalKey)) {
            this.journalUnlocked.push(journalKey);
        }
        void SaveService.save(this.buildSaveState());
    }

    /** Build current save state from scene fields. */
    buildSaveState(): SaveState {
        return {
            version:         1,
            updatedAt:       Date.now(),
            level:           'level-01',
            position:        { x: this.player.sprite.x, y: this.player.sprite.y },
            flags:           { ...this.flags },
            coins:           this.coins,
            journalUnlocked: [...this.journalUnlocked],
        };
    }

    /** Merge WASD + arrow keys into a single CursorKeys-shaped object. */
    private buildMergedCursors(): Phaser.Types.Input.Keyboard.CursorKeys | null {
        if (!this.cursors) return null;
        if (!this.wasd) return this.cursors;
        return {
            up:    { isDown: this.cursors.up.isDown    || this.wasd.up.isDown    } as Phaser.Input.Keyboard.Key,
            down:  { isDown: this.cursors.down.isDown  || this.wasd.down.isDown  } as Phaser.Input.Keyboard.Key,
            left:  { isDown: this.cursors.left.isDown  || this.wasd.left.isDown  } as Phaser.Input.Keyboard.Key,
            right: { isDown: this.cursors.right.isDown || this.wasd.right.isDown } as Phaser.Input.Keyboard.Key,
            shift: this.cursors.shift,
            space: this.cursors.space,
        };
    }

    shutdown(): void {
        // Clear all blink timers (Pitfall 2)
        for (const timer of this.blinkTimers.values()) timer.remove();
        this.blinkTimers.clear();
        // Remove only this scene's listeners — pass fn + context so we don't
        // strip other scenes' listeners for the same event (CR-03, WR-05 fix)
        GameEvents.off(Events.DIALOGUE_COMPLETE, this.onDialogueComplete, this);
        // Phase 3 Slice 2: HOSPITAL_DISMISS cleanup (CR-03 — every on() needs off() for restart safety)
        GameEvents.off(Events.HOSPITAL_DISMISS, this.onHospitalDismiss, this);
        // Phase 3 Slice 3: SHOP_PURCHASE + SHOP_CLOSE cleanup (CR-03)
        GameEvents.off(Events.SHOP_PURCHASE, this.onShopPurchase, this);
        GameEvents.off(Events.SHOP_CLOSE,    this.onShopClose,    this);
        this.game.events.off(Phaser.Core.Events.HIDDEN, this._onHidden, this);
        this.input.off('pointerdown');
        // Phase 3.1: stop the BGM when leaving the overworld for good (quit to
        // menu / level complete). The sound manager is game-global — without this
        // the loop keeps playing over the MainMenu.
        this.sound.get('bgm_overworld')?.stop();
    }
}
