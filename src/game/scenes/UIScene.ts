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
import { Scene } from 'phaser';
import { t } from '../../services/i18n';
import { GameEvents, Events } from '../../events/GameEvents';
import { HUD } from '../../ui/HUD';
import { DialogueBox } from '../../ui/DialogueBox';
import type { DialogueLine } from '../../ui/DialogueBox';
import { shareCard } from '../../services/ShareService';

type UIState = 'HUD' | 'DIALOGUE' | 'PAUSE' | 'LEVEL_COMPLETE';

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
    private uiState: UIState = 'HUD';

    // Stored as a class field so shutdown() can pass it to .off() precisely (CR-03 fix)
    private onPatienceBonus = (amount: number): void => {
        this.hud.flashPatienceBonus(amount);
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

        // ── Event subscriptions ────────────────────────────────────────────
        GameEvents.on(Events.DIALOGUE_START, this.onDialogueStart, this);
        GameEvents.on(Events.DIALOGUE_COMPLETE, this.onDialogueComplete, this);
        GameEvents.on(Events.PAUSE_REQUESTED, this.onPauseRequested, this);
        GameEvents.on(Events.RESUME_REQUESTED, this.onResumeRequested, this);
        GameEvents.on(Events.BOSS_DEFEATED, this.onBossDefeated, this);
        // CR-03 fix: use stored handler reference so shutdown() can remove precisely
        GameEvents.on(Events.PATIENCE_BONUS, this.onPatienceBonus, this);
    }

    // ── Event handlers ─────────────────────────────────────────────────────

    // WR-02 fix: wrap async handler in try/catch; emit DIALOGUE_COMPLETE as
    // fallback so the game is never stuck in DIALOGUE state on load failure
    private onDialogueStart = async (data: { npcId: string; dialogueKey: string }): Promise<void> => {
        try {
            this.setState('DIALOGUE');
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

    // Level complete — stub seam for Plan 03
    private onBossDefeated = (): void => {
        this.setState('LEVEL_COMPLETE');
        this.showLevelComplete(); // plan 03 seam
    };

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
    }

    shutdown(): void {
        // CR-03 fix: always pass fn+context so we only remove this scene's
        // listeners, not every listener for these events on the shared bus.
        GameEvents.off(Events.DIALOGUE_START,    this.onDialogueStart,    this);
        GameEvents.off(Events.DIALOGUE_COMPLETE, this.onDialogueComplete, this);
        GameEvents.off(Events.PAUSE_REQUESTED,   this.onPauseRequested,   this);
        GameEvents.off(Events.RESUME_REQUESTED,  this.onResumeRequested,  this);
        GameEvents.off(Events.BOSS_DEFEATED,     this.onBossDefeated,     this);
        GameEvents.off(Events.PATIENCE_BONUS,    this.onPatienceBonus,    this);
        // WR-07 fix: destroy DialogueBox before Phaser tears down the input plugin
        this.dialogueBox.destroy();
    }
}
