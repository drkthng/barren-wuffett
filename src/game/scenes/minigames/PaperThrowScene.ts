/**
 * PaperThrowScene — paper-route timing mini-game
 *
 * Responsibilities:
 *   - Show 3-second instructions + countdown
 *   - Present 5 houses with cycling neighbor appearances
 *   - Player taps TAP! prompt while neighbor is at door → delivery scored
 *   - 60s timer (turns #ff4444 at ≤15s); score/timer HUD
 *   - PERFECT! flash on tight timing
 *   - On 5 deliveries or timer expiry: emit MINIGAME_COMPLETE
 *   - shutdown(): remove all timers + this.input.off (Pitfall 2)
 *
 * Pattern: PATTERNS.md PaperThrowScene.ts (MainMenu.ts analog)
 * Pitfall 2: sleeping-scene input cleanup in shutdown()
 * UI-SPEC: Component 5 (Mini-Game HUD)
 */
import { Scene } from 'phaser';
import { GameEvents, Events } from '../../../events/GameEvents';
import { t } from '../../../services/i18n';

const TOTAL_HOUSES        = 5;
const GAME_DURATION_MS    = 60_000;   // 60 seconds
const NEIGHBOR_APPEAR_MS  = 2_000;    // neighbor stays at door for 2s
const NEIGHBOR_CYCLE_MS   = 4_000;    // gap between neighbor appearances
const PERFECT_WINDOW_MS   = 600;      // tight-timing window for PERFECT!
const COUNTDOWN_START     = 3;

type Phase = 'instructions' | 'game' | 'done';

export class PaperThrowScene extends Scene {
    // Game state
    private deliveries    = 0;
    private perfectCount  = 0;
    private timeLeft      = GAME_DURATION_MS / 1000;  // in seconds

    // HUD objects
    private scoreText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;

    // Instruction / countdown objects
    private instructionPanel!: Phaser.GameObjects.Rectangle;
    private titleText!:        Phaser.GameObjects.Text;
    private instructionsText!: Phaser.GameObjects.Text;
    private countdownText!:    Phaser.GameObjects.Text;

    // Gameplay objects
    private houseTargets: Phaser.GameObjects.Rectangle[] = [];
    private currentNeighborIndex = -1;
    private neighborVisible       = false;
    private neighborAppearAt      = 0;   // timestamp when neighbor appeared
    private tapPrompt!:            Phaser.GameObjects.Text;
    private tapBlinkTimer: Phaser.Time.TimerEvent | null = null;

    // Timers
    private countdownTimer:  Phaser.Time.TimerEvent | null = null;
    private gameTimer:       Phaser.Time.TimerEvent | null = null;
    private neighborTimer:   Phaser.Time.TimerEvent | null = null;
    private neighborHideTimer: Phaser.Time.TimerEvent | null = null;

    private phase: Phase = 'instructions';

    constructor() {
        super('PaperThrowScene');
    }

    /**
     * Phaser reuses scene instances across stop/launch cycles — class-field
     * initializers run only at construction. Without this reset, a second
     * play-through starts with phase='done' from the previous run, the
     * CR-05 guard blocks beginGame() and the countdown soft-locks at "1"
     * (RESEARCH Pattern 3: reset ALL mutable state in init(), not create()).
     */
    init(): void {
        this.deliveries           = 0;
        this.perfectCount         = 0;
        this.timeLeft             = GAME_DURATION_MS / 1000;
        this.houseTargets         = [];
        this.currentNeighborIndex = -1;
        this.neighborVisible      = false;
        this.neighborAppearAt     = 0;
        this.tapBlinkTimer        = null;
        this.countdownTimer       = null;
        this.gameTimer            = null;
        this.neighborTimer        = null;
        this.neighborHideTimer    = null;
        this.phase                = 'instructions';
    }

    create(): void {
        const cx = this.scale.width  / 2;  // 240

        // ── Instructions panel (full-screen) ─────────────────────────────
        this.instructionPanel = this.add.rectangle(0, 0, 480, 854, 0x1a1a2e)
            .setOrigin(0, 0).setDepth(10);

        this.titleText = this.add.text(cx, 280, t('minigame.paperThrow.title'), {
            fontSize: '24px',
            color:    '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setDepth(11);

        this.instructionsText = this.add.text(cx, 340, t('minigame.paperThrow.instructions'), {
            fontSize:   '8px',
            color:      '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
            wordWrap:   { width: 400, useAdvancedWrap: true },
            align:      'center',
        }).setOrigin(0.5).setDepth(11);

        this.countdownText = this.add.text(cx, 400, t('minigame.ready').replace('{n}', String(COUNTDOWN_START)), {
            fontSize:   '8px',
            color:      '#00ff88',
            fontFamily: '"Press Start 2P", monospace',
            align:      'center',
        }).setOrigin(0.5).setDepth(11);

        // ── Score / Timer HUD (visible during gameplay) ───────────────────
        this.scoreText = this.add.text(cx, 32, t('minigame.score').replace('{n}', '0'), {
            fontSize:   '16px',
            color:      '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5, 0).setDepth(5).setVisible(false);

        this.timerText = this.add.text(432, 32, t('minigame.timer').replace('{n}', String(GAME_DURATION_MS / 1000)), {
            fontSize:   '16px',
            color:      '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5, 0).setDepth(5).setVisible(false);

        // ── House targets (5 rectangles, spread horizontally) ────────────
        const houseY  = 500;
        const houseW  = 48;
        const houseH  = 64;
        const spacing = 80;
        const startX  = cx - (spacing * (TOTAL_HOUSES - 1)) / 2;

        for (let i = 0; i < TOTAL_HOUSES; i++) {
            const houseRect = this.add.rectangle(
                startX + i * spacing, houseY, houseW, houseH, 0x16213e
            ).setStrokeStyle(2, 0xe8e8e8).setDepth(2).setVisible(false);
            this.houseTargets.push(houseRect);
        }

        // Door neighbor indicator (colored dot on active house)
        // (neighbor presence shown by house turning accent color)

        // ── Tap prompt (shown when neighbor is at door) ───────────────────
        this.tapPrompt = this.add.text(cx, 680, t('minigame.throwNow'), {
            fontSize:   '24px',
            color:      '#00ff88',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setDepth(6).setVisible(false);

        // ── Pointer input ─────────────────────────────────────────────────
        this.input.on('pointerdown', this.handleTap, this);

        // ── Start countdown ───────────────────────────────────────────────
        this.startCountdown();
    }

    // ── Countdown phase ──────────────────────────────────────────────────

    private startCountdown(): void {
        let remaining = COUNTDOWN_START;

        // CR-05 fix: Phaser repeat:N fires N+1 times (first trigger + N repeats).
        // Using repeat:COUNTDOWN_START-1 fires exactly COUNTDOWN_START times,
        // preventing a 4th callback that would call beginGame() a second time
        // (remaining would be -1 which also satisfies the <= 0 check).
        this.countdownTimer = this.time.addEvent({
            delay: 1000,
            repeat: COUNTDOWN_START - 1,
            callback: () => {
                remaining -= 1;
                if (remaining > 0) {
                    this.countdownText.setText(t('minigame.ready').replace('{n}', String(remaining)));
                } else {
                    // Countdown done — start gameplay
                    this.countdownTimer = null;
                    this.beginGame();
                }
            },
        });
    }

    // ── Gameplay phase ───────────────────────────────────────────────────

    private beginGame(): void {
        // CR-05 fix: guard against double-call if countdown fires an extra tick
        if (this.phase !== 'instructions') return;
        this.phase = 'game';

        // Hide instruction panel
        this.instructionPanel.setVisible(false);
        this.titleText.setVisible(false);
        this.instructionsText.setVisible(false);
        this.countdownText.setVisible(false);

        // Show gameplay HUD
        this.scoreText.setVisible(true);
        this.timerText.setVisible(true);
        for (const h of this.houseTargets) h.setVisible(true);

        this.timeLeft = GAME_DURATION_MS / 1000;

        // Main game timer (ticks every second)
        this.gameTimer = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                this.timeLeft -= 1;
                const label = t('minigame.timer').replace('{n}', String(Math.max(0, this.timeLeft)));
                this.timerText.setText(label);
                if (this.timeLeft <= 15) {
                    this.timerText.setColor('#ff4444');
                }
                if (this.timeLeft <= 0) {
                    this.endGame(false);
                }
            },
        });

        // Neighbor appearance cycle
        this.scheduleNextNeighbor();
    }

    private scheduleNextNeighbor(): void {
        if (this.phase !== 'game') return;

        // Pick a random house (prefer houses not already delivered to)
        const availableHouses: number[] = [];
        for (let i = 0; i < TOTAL_HOUSES; i++) {
            availableHouses.push(i);
        }
        const idx = availableHouses[Math.floor(Math.random() * availableHouses.length)];

        this.neighborTimer = this.time.delayedCall(500, () => {
            if (this.phase !== 'game') return;
            this.showNeighbor(idx);
        });
    }

    private showNeighbor(houseIndex: number): void {
        if (this.phase !== 'game') return;

        this.currentNeighborIndex = houseIndex;
        this.neighborVisible       = true;
        this.neighborAppearAt      = this.time.now;

        // Highlight the active house
        for (let i = 0; i < this.houseTargets.length; i++) {
            this.houseTargets[i].setFillStyle(i === houseIndex ? 0x00ff88 : 0x16213e);
        }

        // Show TAP! prompt with 2Hz blink
        this.tapPrompt.setVisible(true);
        this.tapBlinkTimer = this.time.addEvent({
            delay: 250,
            loop: true,
            callback: () => this.tapPrompt.setVisible(!this.tapPrompt.visible),
        });

        // Neighbor leaves after NEIGHBOR_APPEAR_MS
        this.neighborHideTimer = this.time.delayedCall(NEIGHBOR_APPEAR_MS, () => {
            this.hideNeighbor();
            // Schedule next appearance after cycle gap
            this.neighborTimer = this.time.delayedCall(NEIGHBOR_CYCLE_MS, () => {
                this.scheduleNextNeighbor();
            });
        });
    }

    private hideNeighbor(): void {
        this.neighborVisible = false;
        this.currentNeighborIndex = -1;
        for (const h of this.houseTargets) h.setFillStyle(0x16213e);
        this.tapPrompt.setVisible(false);
        if (this.tapBlinkTimer) { this.tapBlinkTimer.remove(); this.tapBlinkTimer = null; }
    }

    private handleTap(): void {
        if (this.phase !== 'game') return;
        if (!this.neighborVisible) return;

        const elapsed = this.time.now - this.neighborAppearAt;
        const isPerfect = elapsed <= PERFECT_WINDOW_MS;

        // Score the delivery
        this.deliveries += 1;
        if (isPerfect) this.perfectCount += 1;

        // Tween a "paper" toward the active house
        this.throwPaper(this.currentNeighborIndex);

        // Hide the neighbor
        if (this.neighborHideTimer) { this.neighborHideTimer.remove(); this.neighborHideTimer = null; }
        this.hideNeighbor();

        // Update score HUD
        this.scoreText.setText(t('minigame.score').replace('{n}', String(this.deliveries)));

        // Scale-up tween on score text (same HUD coin pattern)
        this.tweens.add({
            targets: this.scoreText,
            scaleX: 1.2, scaleY: 1.2,
            duration: 75,
            yoyo: true,
        });

        // PERFECT! flash
        if (isPerfect) {
            this.showPerfectFlash();
        }

        // Schedule next neighbor
        this.time.delayedCall(800, () => this.scheduleNextNeighbor());

        // Check win condition
        if (this.deliveries >= TOTAL_HOUSES) {
            this.endGame(true);
        }
    }

    private throwPaper(houseIndex: number): void {
        if (houseIndex < 0 || houseIndex >= this.houseTargets.length) return;
        const target = this.houseTargets[houseIndex];

        // Paper starts at the bottom-center of the screen
        const paper = this.add.rectangle(240, 750, 16, 8, 0xe8e8e8).setDepth(7);
        this.tweens.add({
            targets:  paper,
            x:        target.x,
            y:        target.y,
            duration: 400,
            ease:     'Quad.easeOut',
            onComplete: () => paper.destroy(),
        });
    }

    private showPerfectFlash(): void {
        const cx = this.scale.width / 2;
        const perfectText = this.add.text(cx, 480, t('minigame.perfect'), {
            fontSize:   '16px',
            color:      '#00ff88',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setDepth(8);

        this.tweens.add({
            targets:  perfectText,
            y:        440,
            alpha:    0,
            duration: 800,
            ease:     'Quad.easeOut',
            onComplete: () => perfectText.destroy(),
        });
    }

    private endGame(allDelivered: boolean): void {
        if (this.phase === 'done') return;
        this.phase = 'done';

        // Clean up timers
        if (this.gameTimer)        { this.gameTimer.remove();        this.gameTimer = null; }
        if (this.neighborTimer)    { this.neighborTimer.remove();    this.neighborTimer = null; }
        if (this.neighborHideTimer){ this.neighborHideTimer.remove(); this.neighborHideTimer = null; }
        if (this.tapBlinkTimer)    { this.tapBlinkTimer.remove();    this.tapBlinkTimer = null; }

        this.tapPrompt.setVisible(false);

        // Show TIME'S UP! if timer expired
        if (!allDelivered) {
            const cx = this.scale.width / 2;
            const endText = this.add.text(cx, 427, t('minigame.timesUp'), {
                fontSize:   '16px',
                color:      '#ff4444',
                fontFamily: '"Press Start 2P", monospace',
            }).setOrigin(0.5).setDepth(10);

            this.time.delayedCall(1000, () => {
                endText.destroy();
                this.emitComplete();
            });
        } else {
            this.emitComplete();
        }
    }

    private emitComplete(): void {
        // Emit MINIGAME_COMPLETE — OverworldScene listens and wakes
        GameEvents.emit(Events.MINIGAME_COMPLETE, {
            score:   this.deliveries,
            perfect: this.perfectCount,
        });
    }

    shutdown(): void {
        // Remove all timers (Pitfall 2 — sleeping-scene input cleanup)
        if (this.countdownTimer)   { this.countdownTimer.remove();   this.countdownTimer = null; }
        if (this.gameTimer)        { this.gameTimer.remove();        this.gameTimer = null; }
        if (this.neighborTimer)    { this.neighborTimer.remove();    this.neighborTimer = null; }
        if (this.neighborHideTimer){ this.neighborHideTimer.remove(); this.neighborHideTimer = null; }
        if (this.tapBlinkTimer)    { this.tapBlinkTimer.remove();    this.tapBlinkTimer = null; }
        // Remove all pointer listeners (Pitfall 2)
        this.input.off('pointerdown', this.handleTap, this);
    }
}
