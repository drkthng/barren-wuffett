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

type UIState = 'HUD' | 'DIALOGUE' | 'PAUSE' | 'LEVEL_COMPLETE';

// Dialogue JSON (bundled; no runtime fetch)
// Using dynamic import so the module is not imported at the top level
// (which would prevent tests from mocking it).
let dialogueCache: Record<string, DialogueLine[] | string> | null = null;

async function loadDialogue(): Promise<Record<string, DialogueLine[] | string>> {
    if (dialogueCache) return dialogueCache;
    const mod = await import('../../data/dialogue/en/level-01.json', {
        assert: { type: 'json' }
    }) as { default: Record<string, DialogueLine[] | string> };
    dialogueCache = mod.default;
    return dialogueCache;
}

export class UIScene extends Scene {
    private hud!: HUD;
    private dialogueBox!: DialogueBox;
    private pauseOverlay!: Phaser.GameObjects.Container;
    private pauseBackdrop!: Phaser.GameObjects.Rectangle;
    private uiState: UIState = 'HUD';

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
        GameEvents.on(Events.PATIENCE_BONUS, (amount: number) => {
            this.hud.flashPatienceBonus(amount);
        }, this);
    }

    // ── Event handlers ─────────────────────────────────────────────────────

    private onDialogueStart = async (data: { npcId: string; dialogueKey: string }): Promise<void> => {
        this.setState('DIALOGUE');
        const allDialogue = await loadDialogue();
        const lines = allDialogue[data.dialogueKey];
        if (Array.isArray(lines)) {
            this.dialogueBox.show(data.npcId, lines as DialogueLine[]);
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
            // Split YES/NO by horizontal position (left half = YES, right half = NO)
            if (pointer.x < 240) {
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

    // ── Level complete stub — Plan 03 seam ────────────────────────────────
    // plan 03
    showLevelComplete(): void {
        // Full implementation in Plan 03.
        // Minimal stub: show a centered text so it's not silent.
        const heading = this.add.text(240, 427, t('levelComplete.heading'), {
            fontSize: '24px', color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setDepth(50);
        this.add.rectangle(0, 0, 480, 854, 0x1a1a2e)
            .setOrigin(0, 0).setDepth(49);
        // Suppress lint: heading is visible to player
        void heading;
    }

    // ── State machine ──────────────────────────────────────────────────────

    private setState(state: UIState): void {
        this.uiState = state;
        this.hud.setVisible(state === 'HUD');
        this.pauseBackdrop.setVisible(state === 'PAUSE');
        this.pauseOverlay.setVisible(state === 'PAUSE');
    }

    shutdown(): void {
        GameEvents.off(Events.DIALOGUE_START);
        GameEvents.off(Events.DIALOGUE_COMPLETE);
        GameEvents.off(Events.PAUSE_REQUESTED);
        GameEvents.off(Events.RESUME_REQUESTED);
        GameEvents.off(Events.BOSS_DEFEATED);
        GameEvents.off(Events.PATIENCE_BONUS);
        this.dialogueBox.destroy();
    }
}
