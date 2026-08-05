/**
 * UIScene — parallel overlay: HUD, DialogueBox, pause menu, state machine
 *
 * Runs above OverworldScene, BossScene, and PaperThrowScene at all times.
 * 4-state machine: HUD | DIALOGUE | PAUSE | LEVEL_COMPLETE
 *
 * Subscribes via GameEvents.on:
 *   DIALOGUE_START    → DIALOGUE state, shows DialogueBox
 *   DIALOGUE_COMPLETE → HUD state
 *   PAUSE_REQUESTED   → PAUSE state, pauses OverworldScene
 *   RESUME_REQUESTED  → HUD state, resumes OverworldScene
 *   BOSS_DEFEATED     → LEVEL_COMPLETE state (stub — Plan 03 fleshes out)
 *   PATIENCE_BONUS    → HUD flash
 *
 * Pattern: PATTERNS.md UIScene.ts + UI-SPEC UIScene contract
 */
import Phaser, { Scene } from 'phaser';
import { t } from '../../services/i18n';
import { InputBus, Action } from '../../input/InputBus';
import { GameEvents, Events } from '../../events/GameEvents';
import { HUD } from '../../ui/HUD';
import { HospitalOverlay } from '../../ui/HospitalOverlay';
import { ShopOverlay } from '../../ui/ShopOverlay';
import { ECONOMY_DATA } from '../../data/levels/level-01-economy';
import { DialogueBox } from '../../ui/DialogueBox';
import type { DialogueLine } from '../../ui/DialogueBox';
import { shareCard } from '../../services/ShareService';
import { AudioService } from '../../services/AudioService';

type UIState = 'HUD' | 'DIALOGUE' | 'PAUSE' | 'LEVEL_COMPLETE' | 'SHOP' | 'HOSPITAL';

// Dialogue JSON (bundled; no runtime fetch)
// Using dynamic import so the module is not imported at the top level
// (which would prevent tests from mocking it).
// WR-03 fix: removed non-standard `assert: { type: 'json' }` syntax for
// consistency (Vite treats it as a hint only; BossScene imports without it).
let dialogueCache: Record<string, DialogueLine[] | string> | null = null;

async function loadDialogue(): Promise<Record<string, DialogueLine[] | string>> {
    if (dialogueCache) return dialogueCache;
    const mod = await import('../../data/dialogue/en/level-01.json') as {
        default: Record<string, DialogueLine[] | string>
    };
    dialogueCache = mod.default;
    return dialogueCache;
}

export class UIScene extends Scene {
    private hud!: HUD;
    private dialogueBox!: DialogueBox;
    private pauseOverlay!: Phaser.GameObjects.Container;
    private pauseBackdrop!: Phaser.GameObjects.Rectangle;
    private hospitalOverlay!: HospitalOverlay;
    private _hospitalDismissTimer: Phaser.Time.TimerEvent | null = null;
    private shopOverlay!: ShopOverlay;
    private escKey: Phaser.Input.Keyboard.Key | null = null;
    private uiState: UIState = 'HUD';

    // Phase 3.1 (FEEL-01): screen-anchored touch controls live HERE, not in the
    // zoomed OverworldScene. Joystick handle is shared via registry key 'vjoy'.
    private _whackBtn: Phaser.GameObjects.Image | null = null;
    private _vjParts: Phaser.GameObjects.GameObject[] = [];

    // Stored as a class field so shutdown() can pass it to .off() precisely (CR-03 fix)
    private onPatienceBonus = (amount: number): void => {
        this.hud.flashPatienceBonus(amount);
    };

    // Phase 3: COINS_CHANGED handler — closes the D-08 HUD↔coins gap
    // Tracks previous coin value to compute the delta for flashCoinPickup
    private _prevCoins = 0;
    private onCoinsChanged = (n: number): void => {
        this.hud.setCoins(n);
        this.hud.flashCoinPickup(n - this._prevCoins);
        this._prevCoins = n;
    };

    // Phase 3: BUSH_WHACKED handler — updates streak pip indicator (D-07)
    private onBushWhacked = (data: { streak: number }): void => {
        this.hud.updateStreak(data.streak);
    };

    // Phase 3 Slice 2: STREAK_BONUS handler — shows streak bonus toast in HUD (D-07, UI-SPEC §3c)
    private onStreakBonus = (data: { coins: number; journal: boolean }): void => {
        this.hud.flashStreakBonus(data.coins, data.journal);
    };

    // Phase 3 Slice 3: SHOP_OPEN handler — shows/refreshes shop panel (D-13, T-03-11)
    // Re-entry guard: if already in SHOP state, refresh the panel only (do NOT re-pause OverworldScene)
    private onShopOpen = (data: { coins: number; flags: Record<string, boolean> }): void => {
        if (this.uiState === 'SHOP') {
            // Refresh-only path: re-render the panel WITHOUT re-pausing (prevents Phaser double-pause)
            this.shopOverlay.show(data.coins, data.flags, ECONOMY_DATA.shopItems);
            return;
        }
        // First open: transition to SHOP state + pause OverworldScene
        this.setState('SHOP');
        if (this.scene.get('OverworldScene')?.scene.isActive()) {
            this.scene.pause('OverworldScene');
        }
        this.shopOverlay.show(data.coins, data.flags, ECONOMY_DATA.shopItems);
    };

    // Phase 3 Slice 3: SHOP_CLOSE handler — returns to HUD + resumes OverworldScene (D-13)
    private onShopClose = (): void => {
        if (this.uiState !== 'SHOP') return;
        this.setState('HUD');
        if (this.scene.get('OverworldScene')?.scene.isPaused()) {
            this.scene.resume('OverworldScene');
        }
    };

    // Phase 3 Slice 2: PLAYER_HOSPITALIZED handler — shows hospital splash + pauses OverworldScene
    // Double-fire guard: returns early if already in HOSPITAL state (T-03-14)
    private onPlayerHospitalized = (data: { fee: number; helmetOwned: boolean }): void => {
        if (this.uiState === 'HOSPITAL') return;
        this.setState('HOSPITAL');
        // Pause OverworldScene so player cannot move during the splash
        if (this.scene.get('OverworldScene')?.scene.isActive()) {
            this.scene.pause('OverworldScene');
        }
        // Schedule the dismiss paths FIRST so the player can always recover even if the
        // overlay render below throws — a stranded paused OverworldScene is an
        // unrecoverable freeze. (Auto-dismiss 1500ms — RESEARCH Pattern 4 — plus any tap.)
        this._hospitalDismissTimer = this.time.delayedCall(1500, this.dismissHospital);
        this.input.once('pointerdown', this.dismissHospital);
        this.hospitalOverlay.show(data.fee, data.helmetOwned);
        AudioService.playSfx(this, 'hospital_sting');
    };

    // Phase 3 Slice 2: Dismiss the hospital splash. Idempotent via _state check (T-03-14).
    // Emits HOSPITAL_DISMISS — this is the carrier that tells OverworldScene to respawn at (96,96).
    private dismissHospital = (): void => {
        if (this.uiState !== 'HOSPITAL') return;
        // Cancel auto-dismiss timer if it hasn't fired yet
        this._hospitalDismissTimer?.remove();
        this._hospitalDismissTimer = null;
        // Resume OverworldScene before setState (setState may call hud.setVisible)
        if (this.scene.get('OverworldScene')?.scene.isPaused()) {
            this.scene.resume('OverworldScene');
        }
        this.setState('HUD');
        // Emit the dismiss carrier — OverworldScene.onHospitalDismiss respawns player at (96,96)
        GameEvents.emit(Events.HOSPITAL_DISMISS);
    };

    constructor() {
        super('UIScene');
    }

    create(): void {
        // ── HUD ────────────────────────────────────────────────────────────
        this.hud = new HUD(this);

        // ── DialogueBox ────────────────────────────────────────────────────
        this.dialogueBox = new DialogueBox(this);

        // ── Pause overlay ──────────────────────────────────────────────────
        this.buildPauseOverlay();

        // ── Phase 3 Slice 2: Hospital overlay ─────────────────────────────
        this.hospitalOverlay = new HospitalOverlay(this);

        // ── Phase 3 Slice 3: Shop overlay ─────────────────────────────────
        this.shopOverlay = new ShopOverlay(this);

        // ── Phase 3.1 (FEEL-01): touch controls — joystick + whack button ──
        this.buildTouchControls();

        // ── ESC keyboard shortcut: close shop when in SHOP state ─────────
        if (this.input.keyboard) {
            this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
            this.escKey.on('down', () => {
                if (this.uiState === 'SHOP') {
                    GameEvents.emit(Events.SHOP_CLOSE);
                }
            });
        }

        // ── Event subscriptions ────────────────────────────────────────────
        GameEvents.on(Events.DIALOGUE_START, this.onDialogueStart, this);
        GameEvents.on(Events.DIALOGUE_COMPLETE, this.onDialogueComplete, this);
        GameEvents.on(Events.PAUSE_REQUESTED, this.onPauseRequested, this);
        GameEvents.on(Events.RESUME_REQUESTED, this.onResumeRequested, this);
        GameEvents.on(Events.LEVEL_COMPLETE_SHOW, this.onLevelCompleteShow, this);
        // CR-03 fix: use stored handler reference so shutdown() can remove precisely
        GameEvents.on(Events.PATIENCE_BONUS, this.onPatienceBonus, this);
        // Phase 3: coin HUD + streak pips
        GameEvents.on(Events.COINS_CHANGED, this.onCoinsChanged, this);
        GameEvents.on(Events.BUSH_WHACKED,  this.onBushWhacked,  this);
        // Phase 3 Slice 2: hospital splash + streak bonus flash (CR-03)
        GameEvents.on(Events.PLAYER_HOSPITALIZED, this.onPlayerHospitalized, this);
        GameEvents.on(Events.STREAK_BONUS,        this.onStreakBonus,         this);
        // Phase 3 Slice 3: shop open/close (CR-03)
        GameEvents.on(Events.SHOP_OPEN,  this.onShopOpen,  this);
        GameEvents.on(Events.SHOP_CLOSE, this.onShopClose, this);
        // Note: UIScene EMITS HOSPITAL_DISMISS; it does not listen for it — no .on() needed
    }

    // ── Event handlers ─────────────────────────────────────────────────────

    // WR-02 fix: wrap async handler in try/catch; emit DIALOGUE_COMPLETE as
    // fallback so the game is never stuck in DIALOGUE state on load failure
    private onDialogueStart = async (data: { npcId: string; dialogueKey: string }): Promise<void> => {
        try {
            this.setState('DIALOGUE');
            // Make dialogue modal: freeze the overworld so movement keys
            // (incl. ArrowDown used to advance dialogue) don't move the player.
            if (this.scene.get('OverworldScene')?.scene.isActive()) {
                this.scene.pause('OverworldScene');
            }
            const allDialogue = await loadDialogue();
            const lines = allDialogue[data.dialogueKey];
            if (Array.isArray(lines)) {
                this.dialogueBox.show(data.npcId, lines as DialogueLine[]);
            } else {
                // Key not found — close immediately so game is not stuck
                GameEvents.emit(Events.DIALOGUE_COMPLETE, { npcId: data.npcId });
            }
        } catch {
            this.setState('HUD');
        }
    };

    private onDialogueComplete = (): void => {
        if (this.scene.get('OverworldScene')?.scene.isPaused()) {
            this.scene.resume('OverworldScene');
        }
        this.setState('HUD');
        this.hud.flashSave();
    };

    private onPauseRequested = (): void => {
        if (this.uiState !== 'HUD') return;
        this.setState('PAUSE');
        if (this.scene.get('OverworldScene')?.scene.isActive()) {
            this.scene.pause('OverworldScene');
        }
    };

    private onResumeRequested = (): void => {
        this.setState('HUD');
        if (this.scene.get('OverworldScene')?.scene.isPaused()) {
            this.scene.resume('OverworldScene');
        }
    };

    // Level complete — Phase 3.1 (FEEL-05): listens for LEVEL_COMPLETE_SHOW
    // (emitted by OverworldScene AFTER it wakes from the boss handoff), with a
    // re-entry guard, and pauses the overworld so nothing runs underneath.
    // Previously this listened to raw BOSS_DEFEATED, which fired twice (BossScene
    // + OverworldScene re-emit) and stacked two overlays over a live overworld.
    private onLevelCompleteShow = (): void => {
        if (this.uiState === 'LEVEL_COMPLETE') return;
        this.setState('LEVEL_COMPLETE');
        // OverworldScene emits this right after calling scene.wake(), and wake is
        // QUEUED — the scene may not be active yet on this tick, so pausing here
        // can silently miss. update() below pauses it as soon as it comes active
        // (verified: a one-shot deferred pause still raced the wake).
        this.showLevelComplete();
    };

    // ── Phase 3.1: touch controls (moved from the now-zoomed OverworldScene) ──
    //
    // UIScene renders with an unzoomed camera, so screen coordinates hold.
    // The whack button is created for ALL input modes (desktop players can click
    // it too — previously there was no visible whack control on desktop at all).
    // The joystick stays touch-only. update() hides both whenever the overworld
    // is not actively running (mini-game, boss, dialogue, pause, overlays).
    private buildTouchControls(): void {
        // Whack button — UI-SPEC §1: 48×48 sprite at (360,750), 64×64 hit zone
        const whackBtn = this.add.image(360, 750, 'ui_newspaper_button')
            .setDisplaySize(48, 48)
            .setDepth(20)
            .setInteractive(
                new Phaser.Geom.Rectangle(-32, -32, 64, 64),
                Phaser.Geom.Rectangle.Contains,
            );
        whackBtn.on('pointerdown', () => {
            whackBtn.setAlpha(0.7).setScale(0.9);
            InputBus.setAction(Action.WHACK, true);
        });
        whackBtn.on('pointerup',  () => {
            whackBtn.setAlpha(1).setScale(1);
        });
        whackBtn.on('pointerout', () => {
            whackBtn.setAlpha(1).setScale(1);
        });
        this._whackBtn = whackBtn;

        // Joystick — touch devices only; custom base/thumb so visibility is ours
        if (this.sys.game.device.input.touch) {
            void import('phaser4-rex-plugins/plugins/virtualjoystick.js').then((VJModule) => {
                if (!this.sys || !this.sys.isActive()) return;
                const VJClass = (VJModule as { default?: unknown }).default ?? VJModule;
                const base  = this.add.circle(0, 0, 56, 0x16213e, 0.5).setStrokeStyle(2, 0x3a4a6e).setDepth(20);
                const thumb = this.add.circle(0, 0, 24, 0xe8e8e8, 0.75).setDepth(21);
                const Ctor = VJClass as new (scene: Scene, cfg: object) => object;
                const vj = new Ctor(this, {
                    x: 120, y: 750, radius: 56, base, thumb, dir: '8dir', forceMin: 16,
                });
                this._vjParts = [base, thumb];
                // Shared handle: OverworldScene.update() polls this via registry
                this.registry.set('vjoy', vj);
            });
        }
    }

    /**
     * Show the touch controls only while a surface that consumes them is live:
     * the overworld, or the BossScene (Phase 4: the Mood Pendulum fight reuses
     * movement + whack — same controls, no new mid-fight inputs). Hidden during
     * the mini-game, dialogue, shop, hospital, pause, and level-complete.
     */
    update(): void {
        const ow = this.scene.get('OverworldScene');
        const boss = this.scene.get('BossScene');
        const surfaceLive = (!!ow && ow.scene.isActive()) || (!!boss && boss.scene.isActive());
        const active = surfaceLive && this.uiState === 'HUD';
        this._whackBtn?.setVisible(active);
        for (const p of this._vjParts) (p as Phaser.GameObjects.Shape).setVisible(active);

        // LEVEL_COMPLETE must fully freeze the overworld beneath the overlay.
        // The wake queued by the boss handoff can complete AFTER the state
        // switch, so keep pausing until it lands (idempotent — isActive goes
        // false once paused).
        if (this.uiState === 'LEVEL_COMPLETE' && ow?.scene.isActive()) {
            this.scene.pause('OverworldScene');
        }
    }

    // ── Pause overlay build ────────────────────────────────────────────────

    private buildPauseOverlay(): void {
        // Full-canvas backdrop
        this.pauseBackdrop = this.add.rectangle(0, 0, 480, 854, 0x000000, 0.6)
            .setOrigin(0, 0)
            .setDepth(30)
            .setVisible(false);

        // Panel: 320×240 centered at x=240, y=427
        const panel = this.add.rectangle(240, 427, 320, 240, 0x16213e)
            .setStrokeStyle(2, 0xe8e8e8);

        // Title
        const titleText = this.add.text(240, 331, t('pause.title'), {
            fontSize: '24px', color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5);

        // RESUME button
        const resumeText = this.add.text(240, 379, t('pause.resume'), {
            fontSize: '16px', color: '#00ff88',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setInteractive(
            new Phaser.Geom.Rectangle(-160, -22, 320, 44),
            Phaser.Geom.Rectangle.Contains
        );
        resumeText.on('pointerdown', () => {
            resumeText.setAlpha(0.7);
            this.time.delayedCall(100, () => resumeText.setAlpha(1));
            GameEvents.emit(Events.RESUME_REQUESTED);
        });

        // SETTINGS button
        const settingsText = this.add.text(240, 427, t('pause.settings'), {
            fontSize: '16px', color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setInteractive(
            new Phaser.Geom.Rectangle(-160, -22, 320, 44),
            Phaser.Geom.Rectangle.Contains
        );
        settingsText.on('pointerdown', () => {
            settingsText.setAlpha(0.7);
            this.time.delayedCall(100, () => settingsText.setAlpha(1));
            this.scene.launch('Settings');
        });

        // QUIT TO MENU button + inline confirm
        const quitText = this.add.text(240, 475, t('pause.quitToMenu'), {
            fontSize: '16px', color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setInteractive(
            new Phaser.Geom.Rectangle(-160, -22, 320, 44),
            Phaser.Geom.Rectangle.Contains
        );

        const confirmText = this.add.text(240, 475, '', {
            fontSize: '8px', color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setVisible(false);

        let confirmTimeout: Phaser.Time.TimerEvent | null = null;

        const showQuitButtons = (): void => {
            quitText.setVisible(true);
            confirmText.setVisible(false);
            if (confirmTimeout) { confirmTimeout.remove(); confirmTimeout = null; }
        };

        quitText.on('pointerdown', () => {
            quitText.setVisible(false);
            confirmText.setText(`${t('pause.confirmQuit')}\n[${t('pause.confirmYes')}]  [${t('pause.confirmNo')}]`);
            confirmText.setVisible(true);
            // Auto-cancel after 3s
            confirmTimeout = this.time.delayedCall(3000, showQuitButtons);
        });

        confirmText.setInteractive(
            new Phaser.Geom.Rectangle(-160, -22, 320, 44),
            Phaser.Geom.Rectangle.Contains
        );
        confirmText.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // WR-06 fix: use scale.width/2 (runtime canvas center) instead of
            // hardcoded 240px — pointer.x is raw canvas pixels, which differs
            // from 240 when Scale.FIT shrinks the canvas on small phones.
            const canvasCenterX = this.scale.width / 2;
            if (pointer.x < canvasCenterX) {
                // YES — quit to main menu
                this.scene.stop('OverworldScene');
                this.scene.stop('UIScene');
                this.scene.start('MainMenu');
            } else {
                showQuitButtons();
            }
        });

        this.pauseOverlay = this.add.container(0, 0, [
            panel, titleText, resumeText, settingsText, quitText, confirmText,
        ]).setDepth(31).setVisible(false);
    }

    // ── Level complete full implementation (Plan 03) ───────────────────────
    showLevelComplete(): void {
        const cx = 240;

        // ── Full-canvas #1a1a2e overlay ─────────────────────────────────────
        const bg = this.add.rectangle(0, 0, 480, 854, 0x1a1a2e)
            .setOrigin(0, 0).setDepth(49);
        // #16213e border inset 8px from canvas edges
        this.add.rectangle(8, 8, 464, 838, 0x1a1a2e)
            .setOrigin(0, 0)
            .setStrokeStyle(2, 0x16213e)
            .setDepth(50);
        void bg; // used — Phaser owns this object

        // ── Barren victory sprite (y=80 is sprite center) ─────────────────
        const victorySprite = this.add.image(cx, 80, 'barren_victory')
            .setDisplaySize(48, 64)
            .setDepth(51);
        void victorySprite; // display-only

        // ── LEVEL COMPLETE heading ─────────────────────────────────────────
        this.add.text(cx, 176, t('levelComplete.heading'), {
            fontSize: '24px', color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setDepth(51);

        // ── BARREN'S WISDOM label ──────────────────────────────────────────
        this.add.text(cx, 216, t('levelComplete.wisdomLabel'), {
            fontSize: '8px', color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setDepth(51);

        // ── Retrieve wisdom quote from dialogue cache ──────────────────────
        // loadDialogue() is async; we already load it during DIALOGUE_START flow.
        // For level-complete we load it independently and populate after await.
        const quoteText = this.add.text(cx, 248, '', {
            fontSize: '8px', color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
            wordWrap: { width: 400, useAdvancedWrap: true },
            align: 'center',
        }).setOrigin(0.5, 0).setDepth(51);

        // Typewriter state
        let typewriterTimer: Phaser.Time.TimerEvent | null = null;
        let typewriterDone = false;
        let quoteString = '';

        const finishTypewriter = (): void => {
            if (!typewriterDone) {
                typewriterDone = true;
                if (typewriterTimer) { typewriterTimer.remove(); typewriterTimer = null; }
                quoteText.setText(quoteString);
                // Show cliffhanger after typewriter completes
                cliffhangerText.setVisible(true);
            }
        };

        // ── Attribution ────────────────────────────────────────────────────
        this.add.text(cx, 460, t('levelComplete.attribution'), {
            fontSize: '8px', color: '#00ff88',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setDepth(51);

        // ── SHARE WISDOM button ────────────────────────────────────────────
        const shareBtn = this.add.rectangle(cx, 516, 280, 56, 0x16213e)
            .setStrokeStyle(2, 0x00ff88)
            .setDepth(51)
            .setInteractive({ useHandCursor: true });

        const shareBtnLabel = this.add.text(cx, 516, t('levelComplete.share'), {
            fontSize: '16px', color: '#00ff88',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setDepth(52);

        // SHARE WISDOM pointerdown — call shareCard() directly in gesture call stack
        // (iOS Pitfall 4: no await before share(); the Blob is pre-cached in BossScene)
        shareBtn.on('pointerdown', () => {
            shareBtn.setAlpha(0.7);
            this.time.delayedCall(100, () => shareBtn.setAlpha(1));
            // shareCard() is called directly in the pointerdown handler — no prior await.
            // The Blob was pre-generated by BossScene.handleAccept → prepareShareCard().
            void shareCard(this.game, quoteString || t('levelComplete.wisdomLabel')).then(() => {
                // SHARED! or SAVED! label swap
                // canShare true → SHARED!, fallback (download) → SAVED!
                // Since we can't detect which path ran from the promise result,
                // we check if navigator.canShare would have been true
                const testBlob = new Blob([''], { type: 'image/png' });
                const testFile = new File([testBlob], 'test.png', { type: 'image/png' });
                const wasShare = typeof navigator.canShare === 'function'
                    && navigator.canShare({ files: [testFile] });
                shareBtnLabel.setText(wasShare
                    ? t('levelComplete.shareSuccess')
                    : t('levelComplete.shareFallback'));
                this.time.delayedCall(2000, () => {
                    shareBtnLabel.setText(t('levelComplete.share'));
                });
            }).catch(() => {
                // Share failed (e.g. user dismissed) — show fallback label
                shareBtnLabel.setText(t('levelComplete.shareFallback'));
                this.time.delayedCall(2000, () => {
                    shareBtnLabel.setText(t('levelComplete.share'));
                });
            });
        });

        // ── CONTINUE button ────────────────────────────────────────────────
        const continueBtn = this.add.rectangle(cx, 596, 280, 56, 0x16213e)
            .setStrokeStyle(2, 0xe8e8e8)
            .setDepth(51)
            .setInteractive({ useHandCursor: true });

        this.add.text(cx, 596, t('levelComplete.continue'), {
            fontSize: '16px', color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setDepth(52);

        continueBtn.on('pointerdown', () => {
            continueBtn.setAlpha(0.7);
            this.time.delayedCall(100, () => {
                // Stop all gameplay scenes and return to MainMenu.
                // CR-04 fix: also stop UIScene itself before starting MainMenu.
                // Without this, UIScene stays alive as a zombie overlay, keeping
                // all its GameEvents.on subscriptions active. A second game start
                // would then launch a second UIScene and double-register listeners.
                ['OverworldScene', 'BossScene', 'PaperThrowScene'].forEach(key => {
                    if (this.scene.get(key)?.scene.isActive() || this.scene.get(key)?.scene.isPaused()) {
                        this.scene.stop(key);
                    }
                });
                this.scene.stop('UIScene'); // stop self — prevents zombie overlay
                this.scene.start('MainMenu');
            });
        });

        // ── Cliffhanger text (hidden until typewriter done) ────────────────
        const cliffhangerText = this.add.text(cx, 700, t('levelComplete.cliffhanger'), {
            fontSize: '8px', color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
            wordWrap: { width: 400, useAdvancedWrap: true },
            align: 'center',
        }).setOrigin(0.5, 0).setDepth(51).setVisible(false);

        // ── Tap anywhere to skip typewriter ────────────────────────────────
        this.input.once('pointerdown', finishTypewriter);

        // ── Load quote and start typewriter ───────────────────────────────
        void loadDialogue().then((allDialogue) => {
            const rawQuote = allDialogue['boss_01_wisdom_quote'];
            quoteString = typeof rawQuote === 'string' ? rawQuote : t('levelComplete.wisdomLabel');

            // Typewriter: 20ms per character
            let charIndex = 0;
            typewriterTimer = this.time.addEvent({
                delay: 20,
                repeat: quoteString.length - 1,
                callback: () => {
                    charIndex += 1;
                    quoteText.setText(quoteString.slice(0, charIndex));
                    if (charIndex >= quoteString.length) {
                        finishTypewriter();
                    }
                },
            });
        });
    }

    // ── State machine ──────────────────────────────────────────────────────

    private setState(state: UIState): void {
        this.uiState = state;
        this.hud.setVisible(state === 'HUD');
        this.pauseBackdrop.setVisible(state === 'PAUSE');
        this.pauseOverlay.setVisible(state === 'PAUSE');
        // Phase 3 Slice 3: hide shop overlay when leaving SHOP state
        // show() is driven by onShopOpen (needs coins/flags payload), not here
        if (state !== 'SHOP') {
            this.shopOverlay?.hide();
        }
        // Phase 3 Slice 2: hide hospital overlay when leaving HOSPITAL state
        // show() is driven by onPlayerHospitalized (needs the fee payload), not here
        if (state !== 'HOSPITAL') {
            this.hospitalOverlay?.hide();
        }
    }

    shutdown(): void {
        // CR-03 fix: always pass fn+context so we only remove this scene's
        // listeners, not every listener for these events on the shared bus.
        GameEvents.off(Events.DIALOGUE_START,    this.onDialogueStart,    this);
        GameEvents.off(Events.DIALOGUE_COMPLETE, this.onDialogueComplete, this);
        GameEvents.off(Events.PAUSE_REQUESTED,   this.onPauseRequested,   this);
        GameEvents.off(Events.RESUME_REQUESTED,  this.onResumeRequested,  this);
        GameEvents.off(Events.LEVEL_COMPLETE_SHOW, this.onLevelCompleteShow, this);
        GameEvents.off(Events.PATIENCE_BONUS,    this.onPatienceBonus,    this);
        // Phase 3: remove COINS_CHANGED + BUSH_WHACKED handlers (CR-03 — no zombie listeners on restart)
        GameEvents.off(Events.COINS_CHANGED,     this.onCoinsChanged,     this);
        GameEvents.off(Events.BUSH_WHACKED,      this.onBushWhacked,      this);
        // Phase 3 Slice 2: remove PLAYER_HOSPITALIZED + STREAK_BONUS handlers (CR-03)
        // UIScene EMITS HOSPITAL_DISMISS but does not listen — no off() needed for that event
        GameEvents.off(Events.PLAYER_HOSPITALIZED, this.onPlayerHospitalized, this);
        GameEvents.off(Events.STREAK_BONUS,        this.onStreakBonus,         this);
        // Phase 3 Slice 3: remove SHOP_OPEN + SHOP_CLOSE handlers (CR-03)
        GameEvents.off(Events.SHOP_OPEN,  this.onShopOpen,  this);
        GameEvents.off(Events.SHOP_CLOSE, this.onShopClose, this);
        // Cancel pending dismiss timer on shutdown (avoids dangling callback)
        this._hospitalDismissTimer?.remove();
        this._hospitalDismissTimer = null;
        // WR-07 fix: destroy DialogueBox before Phaser tears down the input plugin
        this.dialogueBox.destroy();
    }
}
