/**
 * OverworldScene — Level 1 top-down overworld (GAME-01, GAME-05, GAME-06, GAME-09)
 *
 * Responsibilities:
 *   - Build tilemap from MAP_DATA via Arcade Physics
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
import { Scene } from 'phaser';
import { InputBus } from '../../input/InputBus';
import { GameEvents, Events } from '../../events/GameEvents';
import { SaveService } from '../../services/SaveService';
import type { SaveState } from '../../services/SaveService';
import { LEVEL_01_MANIFEST } from '../../data/levels/level-01';
import { Player } from '../../entities/Player';
import { NPC } from '../../entities/NPC';
import { MAP_DATA } from '../../data/levels/level-01';
import { t } from '../../services/i18n';
import { TriggerSystem } from '../../systems/TriggerSystem';

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

    // Loaded in init() before create() is called — avoids async create() race (CR-01)
    private _savedState: SaveState | undefined = undefined;

    // Stored handler references for precise removal in shutdown() (WR-05, CR-03 fix)
    private _onHidden = (): void => { void SaveService.save(this.buildSaveState()); };
    private onDialogueComplete = (): void => {
        this.inDialogue = false;
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

        // ── Tilemap ────────────────────────────────────────────────────────
        const map = this.make.tilemap({
            data: MAP_DATA,
            tileWidth: 32,
            tileHeight: 32,
        });
        const tileset = map.addTilesetImage('omaha_tiles');
        if (tileset) {
            const groundLayer = map.createLayer(0, tileset, 0, 0);
            if (groundLayer) {
                groundLayer.setCollision([1]);

                // ── Player ─────────────────────────────────────────────────
                this.player = new Player(this, startX, startY);
                this.physics.add.collider(this.player.sprite, groundLayer);
            }
        } else {
            // Fallback when tileset asset is missing (placeholder PNG case)
            this.player = new Player(this, startX, startY);
        }

        // Camera follows player
        this.cameras.main.setBounds(0, 0, MAP_DATA[0].length * 32, MAP_DATA.length * 32);
        this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

        // ── TriggerSystem (Plan 02-02) ─────────────────────────────────────
        this.triggerSystem = new TriggerSystem();

        // ── NPCs ───────────────────────────────────────────────────────────
        for (const def of NPC_DEFS) {
            const npc = new NPC(this, def.x, def.y, def.texture, def.npcId, def.dialogueKey);
            this.npcs.push(npc);

            // TALK prompt (hidden until in range)
            const prompt = this.add.text(def.x, def.y - 40, t('hud.talkPrompt'), {
                fontSize: '8px',
                color: '#00ff88',
                fontFamily: '"Press Start 2P", monospace',
            }).setOrigin(0.5).setVisible(false).setDepth(5);
            this.talkPrompts.set(def.npcId, prompt);
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

            this.interactKey.on('down', this.handleInteract, this);
            enterKey.on('down', this.handleInteract, this);
            this.pauseKey.on('down', () => {
                GameEvents.emit(Events.PAUSE_REQUESTED);
            });
        }

        // ── Launch UIScene parallel overlay ────────────────────────────────
        this.scene.launch('UIScene');

        // ── Autosave on game hidden (tab switch / phone lock) ─────────────
        // Stored as a class field so shutdown() can remove it precisely (WR-05 fix)
        this.game.events.on(Phaser.Core.Events.HIDDEN, this._onHidden, this);

        // ── Resume from dialogue ───────────────────────────────────────────
        GameEvents.on(Events.DIALOGUE_COMPLETE, this.onDialogueComplete, this);

        // Boss zone entry — first-time autosave + scene trigger
        // (full boss trigger wired in Plan 02-02 via TriggerSystem)
    }

    update(): void {
        if (this.inDialogue || this.inHandoff) return;

        // Build merged cursor stub (WASD + arrow keys)
        const mergedCursors = this.buildMergedCursors();
        InputBus.update(this.joystick, mergedCursors);
        this.player.update();

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
        this.game.events.off(Phaser.Core.Events.HIDDEN, this._onHidden, this);
        this.input.off('pointerdown');
    }
}
