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
import { computeHospitalFee } from '../../systems/Economy';

// NPC placement on the tile grid (in pixel coords = tile * 32 + 16)
const NPC_DEFS = [
    { x: 96,  y: 96,  texture: 'npc_grandpa',     npcId: 'grandpa',   dialogueKey: 'npc_grandpa' },
    { x: 352, y: 160, texture: 'npc_store_clerk',  npcId: 'storeClerk',dialogueKey: 'npc_store_clerk' },
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

    // Dog patrol
    private dogSprite: Phaser.GameObjects.Image | null = null;
    private dogTimer: Phaser.Time.TimerEvent | null = null;
    private dogDir = 1;
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

    // Phase 3: shop/hospital modal flags (guards update() when overlays are shown)
    private shopOpen = false;
    private hospitalShowing = false;

    // Phase 3: traversal gate
    private gateBarrier: Phaser.GameObjects.Rectangle | null = null;

    // Loaded in init() before create() is called — avoids async create() race (CR-01)
    private _savedState: SaveState | undefined = undefined;

    // Stored handler references for precise removal in shutdown() (WR-05, CR-03 fix)
    private _onHidden = (): void => { void SaveService.save(this.buildSaveState()); };
    private onDialogueComplete = (): void => {
        this.inDialogue = false;
        void SaveService.save(this.buildSaveState());
    };

    // Phase 3 Slice 2: HOSPITAL_DISMISS carrier — UIScene dismiss emits it; we respawn at (96,96) (D-11)
    private onHospitalDismiss = (): void => {
        this.hospitalShowing = false;
        this.player.sprite.setPosition(96, 96);
        void SaveService.save(this.buildSaveState());
    };

    constructor() {
        super('OverworldScene');
    }

    /**
     * init() runs synchronously in the Phaser lifecycle before create().
     * We load save data here so create() can remain synchronous and
     * update() never runs before this.player is assigned (CR-01 fix).
     */
    async init(): Promise<void> {
        this._savedState = await SaveService.load();
    }

    create(): void {
        // ── Load saved state (if any) ──────────────────────────────────────
        const saved: SaveState | undefined = this._savedState;
        if (saved) {
            this.coins = saved.coins;
            this.flags = saved.flags;
            this.journalUnlocked = saved.journalUnlocked ? [...saved.journalUnlocked] : [];
        }
        const startX = saved?.position?.x ?? 96;
        const startY = saved?.position?.y ?? 96;

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
        this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

        // ── TriggerSystem (Plan 02-02) ─────────────────────────────────────
        this.triggerSystem = new TriggerSystem();

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
        this.gateBarrier = this.add.rectangle(
            ECONOMY_DATA.gateBarrier.x, ECONOMY_DATA.gateBarrier.y,
            ECONOMY_DATA.gateBarrier.w, ECONOMY_DATA.gateBarrier.h,
            0x000000, 0,
        );
        this.physics.add.existing(this.gateBarrier, true);
        this.physics.add.collider(this.player.sprite, this.gateBarrier);
        if (this.flags['upgrade_traversal']) {
            (this.gateBarrier.body as Phaser.Physics.Arcade.StaticBody).enable = false;
        }

        // ── Dog patrol (patience mechanic GAME-06) ─────────────────────────
        this.dogSprite = this.add.image(DOG_MIN_X, 464, 'dog')
            .setDisplaySize(32, 16).setDepth(3);
        this.setupDogPatrol();

        // ── VirtualJoystick (touch devices only) ──────────────────────────
        // Dynamic import is intentionally fire-and-forget here. The joystick is
        // purely additive — if it resolves after a few frames the player has
        // keyboard fallback via WASD/arrows. The critical async create() race
        // (update() running before this.player is set) is fully fixed by moving
        // SaveService.load() to init().  The joystick import only controls
        // touch input, so a brief delay is acceptable.
        if (this.sys.game.device.input.touch) {
            void import('phaser4-rex-plugins/plugins/virtualjoystick.js').then((VJModule) => {
                const VJClass = VJModule.default ?? VJModule;
                const vj = new VJClass(this, {
                    x: 120, y: 750, radius: 80, dir: '8dir', forceMin: 16,
                }) as { up: boolean; down: boolean; left: boolean; right: boolean };
                this.joystick = vj;
            });

            // ── Phase 3: Touch whack button (right-thumb zone) ─────────────
            // UI-SPEC §1: 64×64 interactive zone at (360,750); visual 48×48 sprite
            const whackBtn = this.add.image(360, 750, 'ui_newspaper_button')
                .setDisplaySize(48, 48)
                .setDepth(10)
                .setInteractive(
                    new Phaser.Geom.Rectangle(-32, -32, 64, 64),
                    Phaser.Geom.Rectangle.Contains,
                );
            // 2px #00ff88 stroke on the outer zone area (signals active interactive element)
            const whackBtnBorder = this.add.graphics().setDepth(10);
            whackBtnBorder.lineStyle(2, 0x00ff88, 1);
            whackBtnBorder.strokeRect(360 - 32, 750 - 32, 64, 64);

            whackBtn.on('pointerdown', () => {
                whackBtn.setAlpha(0.7).setScale(0.9);
                InputBus.setAction(Action.WHACK, true);
            });
            whackBtn.on('pointerup',  () => {
                whackBtn.setAlpha(1).setScale(1);
                InputBus.setAction(Action.WHACK, false);
            });
            whackBtn.on('pointerout', () => {
                whackBtn.setAlpha(1).setScale(1);
                InputBus.setAction(Action.WHACK, false);
            });
        }

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
        if (this.inDialogue || this.inHandoff || this.shopOpen || this.hospitalShowing) return;

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

        // ── TriggerSystem zone check ───────────────────────────────────────
        const hit = this.triggerSystem.checkZones(
            this.player.sprite.x,
            this.player.sprite.y,
        );
        if (hit) {
            this.triggerSystem.consume(hit.zone);
            if (hit.target === 'PaperThrowScene') {
                this.enterMiniGame('PaperThrowScene', { zone: hit.zone });
            } else if (hit.target === 'BossScene') {
                this.enterBoss();
            }
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
        this.scene.sleep();
        this.scene.launch(sceneKey, data);

        GameEvents.once(Events.MINIGAME_COMPLETE, (result: { score: number; perfect: number }) => {
            this.scene.stop(sceneKey);
            this.scene.wake();
            this.inHandoff = false;

            // Apply coin reward: 2 coins per delivery + 3 bonus per perfect
            const earned = result.score * 2 + result.perfect * 3;
            this.coins += earned;

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

        this.scene.sleep();
        this.scene.launch('BossScene');

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

            // Forward BOSS_DEFEATED to UIScene so it can show LEVEL_COMPLETE
            // (UIScene already listens on GameEvents.on(Events.BOSS_DEFEATED))
            // Re-emit so UIScene state machine picks it up after wake
            GameEvents.emit(Events.BOSS_DEFEATED, result);
        });
    }

    /**
     * Handle Space/Enter: interact with NPC if in range, else fire WHACK (D-01 context-sensitive).
     * Replaces the direct handleInteract() binding for Space/Enter keys.
     */
    private handleInteractOrWhack(): void {
        if (this.currentNpcInRange) {
            this.handleInteract();
        } else {
            InputBus.setAction(Action.WHACK, true);
        }
    }

    /** Handle INTERACT action (Space / Enter / on-screen TALK button). */
    private handleInteract(): void {
        if (this.inDialogue) return;
        if (!this.currentNpcInRange) return;
        this.inDialogue = true;
        this.hideTalkPrompt(this.currentNpcInRange);
        GameEvents.emit(Events.DIALOGUE_START, {
            npcId:       this.currentNpcInRange.npcId,
            dialogueKey: this.currentNpcInRange.dialogueKey,
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

        // Activate the directional hitbox (150ms active window, using WhackOffsets seam)
        this.whackSystem.activate(px, py, facing);

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

        // On-hit white flash before hiding (UI-SPEC §2d)
        sprite.setTint(0xffffff);
        this.time.delayedCall(80, () => {
            sprite.clearTint();
            bush.onWhacked(); // hide + disable body
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
        // Dog toggles direction every half-period; patience gap at far end
        this.dogTimer = this.time.addEvent({
            delay: DOG_PERIOD / 2,
            loop: true,
            callback: () => {
                this.dogDir *= -1;
                if (this.dogDir < 0) {
                    // Dog at far right — gap window open for GAP_MS
                    this.dogGapActive = true;
                    this.time.delayedCall(DOG_GAP_MS, () => {
                        this.dogGapActive = false;
                    });
                }
            },
        });

        // Smooth patrol movement via tweens
        this.tweens.add({
            targets: this.dogSprite,
            x: { from: DOG_MIN_X, to: DOG_MAX_X },
            duration: DOG_PERIOD / 2,
            repeat: -1,
            yoyo: true,
        });
    }

    /**
     * Award patience bonus when player passes through the dog-gap route.
     * Called by OverworldScene.update() when player enters the gap corridor
     * and dogGapActive is true — OverworldScene handles the overlap check.
     */
    awardPatienceBonus(): void {
        if (!this.dogGapActive) return;
        this.coins += PATIENCE_BONUS_COINS;
        this.flags['patience_used'] = true;
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
        // Reset streak immediately (D-12) — pips clear via BUSH_WHACKED { streak: 0 }
        this.bushStreak = 0;
        GameEvents.emit(Events.BUSH_WHACKED, { streak: 0 });
        // Compute fee now (before coins change) so the overlay can show the correct amount
        const fee = computeHospitalFee(this.coins, this.flags);
        // applyKnockback sets _invincible=true synchronously (T-03-06: blocks re-entry immediately)
        // onComplete fires after ~960ms i-frame flash — then show the hospital beat
        this.player.applyKnockback(
            this.dogSprite!.x, this.dogSprite!.y,
            () => this.completeHospital(fee),
        );
    }

    /**
     * Phase 3 Slice 2: Apply hospital fee + emit PLAYER_HOSPITALIZED after knockback (D-11).
     * Fee is authoritative here (coins can never go negative — T-03-07).
     * RESPAWN is NOT here — it happens in onHospitalDismiss when UIScene emits HOSPITAL_DISMISS.
     */
    private completeHospital(fee: number): void {
        this.coins = Math.max(0, this.coins - fee);
        GameEvents.emit(Events.COINS_CHANGED, this.coins);
        this.hospitalShowing = true;
        GameEvents.emit(Events.PLAYER_HOSPITALIZED, {
            fee,
            helmetOwned: !!this.flags['upgrade_helmet'],
        });
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
        if (this.dogTimer) { this.dogTimer.remove(); this.dogTimer = null; }
        // Remove only this scene's listeners — pass fn + context so we don't
        // strip other scenes' listeners for the same event (CR-03, WR-05 fix)
        GameEvents.off(Events.DIALOGUE_COMPLETE, this.onDialogueComplete, this);
        // Phase 3 Slice 2: HOSPITAL_DISMISS cleanup (CR-03 — every on() needs off() for restart safety)
        GameEvents.off(Events.HOSPITAL_DISMISS, this.onHospitalDismiss, this);
        this.game.events.off(Phaser.Core.Events.HIDDEN, this._onHidden, this);
        this.input.off('pointerdown');
    }
}
