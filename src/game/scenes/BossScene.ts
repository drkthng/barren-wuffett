/**
 * BossScene — Mr. Market two-phase patience boss fight (GAME-06 climax)
 *
 * Responsibilities:
 *   - Full-canvas phase-tint Rectangle (0xff4444 greed / 0x4444ff panic, alpha 0.15)
 *   - Mr. Market sprite + name/phase labels
 *   - 5-tick state bar + 3-segment patience meter
 *   - Speech bubble with boss offer text from level-01.json
 *   - Greed phase: DECLINE button — 3 declines → PATIENCE MAXED! → Panic phase
 *   - Panic phase: 3s countdown + BUY LOW! button; hit in time → BOSS_DEFEATED
 *   - Miss outcome: TOO SLOW! → reset to Greed, no permanent fail
 *   - shutdown(): remove timers + this.input.off (Pitfall 2)
 *
 * Pattern: PATTERNS.md BossScene.ts + RESEARCH Game Design Boss Fight
 * UI-SPEC: Component 4 (Boss Scene UI)
 * Pitfall 1: results only via BOSS_DEFEATED event — no sync read of this scene
 * Pitfall 2: shutdown() input cleanup
 */
import { Scene } from 'phaser';
import { GameEvents, Events } from '../../events/GameEvents';
import { t } from '../../services/i18n';
import { prepareShareCard } from '../../services/ShareService';
// Static import eliminates the async create() data race (CR-02 fix):
// Phaser does not await async create(); if we used a dynamic import()
// here, update() could fire before dialogueData was populated.
import dialogueDataRaw from '../../data/dialogue/en/level-01.json';

const TOTAL_DECLINES   = 3;   // declines needed to fill patience meter + trigger panic
const PANIC_DURATION_S = 3;   // seconds for the panic-phase timer

type Phase = 'intro' | 'greed' | 'panic' | 'done';

// Boss offer lines from level-01.json — keys to load dynamically
const GREED_KEYS = ['boss_greed_01', 'boss_greed_02', 'boss_greed_03'] as const;

export class BossScene extends Scene {
    // Phase state
    private phase: Phase = 'intro';
    private declinesCount = 0;
    private greedOfferIndex = 0;

    // Tint rectangle
    private tintRect!: Phaser.GameObjects.Rectangle;

    // Boss sprite + labels (bossSprite / nameText are display-only — stored in displayObjects)
    private displayObjects: Phaser.GameObjects.GameObject[] = [];
    private phaseLabel!:    Phaser.GameObjects.Text;

    // State bar (5 ticks) + patience meter (3 segments)
    private stateTicks:      Phaser.GameObjects.Rectangle[] = [];
    private patienceSegments: Phaser.GameObjects.Rectangle[] = [];

    // Speech bubble + offer text (bubbleRect is display-only — stored in displayObjects)
    private offerText!:     Phaser.GameObjects.Text;

    // Hint text (first encounter)
    private hintText!:      Phaser.GameObjects.Text;
    private hintShown = false;
    private hintTimer: Phaser.Time.TimerEvent | null = null;

    // Greed DECLINE button
    private declineButton!:  Phaser.GameObjects.Rectangle;
    private declineLabel!:   Phaser.GameObjects.Text;

    // Panic phase objects
    private timerText!:      Phaser.GameObjects.Text;
    private acceptButton!:   Phaser.GameObjects.Rectangle;
    private acceptLabel!:    Phaser.GameObjects.Text;
    private panicCountdown = PANIC_DURATION_S;
    private panicTimer: Phaser.Time.TimerEvent | null = null;

    // Flash text (patience maxed, too slow, win)
    private flashText!: Phaser.GameObjects.Text;

    // Loaded dialogue data
    private dialogueData: Record<string, unknown> = {};

    constructor() {
        super('BossScene');
    }

    create(): void {
        const cx = this.scale.width  / 2;  // 240

        // ── Load boss dialogue data (statically imported — CR-02 fix) ──────
        this.dialogueData = dialogueDataRaw as Record<string, unknown>;

        // ── Full-canvas phase tint (depth 0, behind all sprites) ──────────
        this.tintRect = this.add.rectangle(0, 0, 480, 854, 0xff4444)
            .setOrigin(0, 0)
            .setAlpha(0)
            .setDepth(0);
        // Tween to 0.15 on create (greed phase intro)
        this.tweens.add({ targets: this.tintRect, alpha: 0.15, duration: 500 });

        // ── Mr. Market boss sprite ─────────────────────────────────────────
        this.displayObjects.push(
            this.add.image(cx, 380, 'boss_mr_market')
                .setDisplaySize(64, 96)
                .setDepth(2)
        );

        // ── Name label ─────────────────────────────────────────────────────
        this.displayObjects.push(
            this.add.text(cx, 48, t('boss.mrMarket.name'), {
                fontSize:   '16px',
                color:      '#e8e8e8',
                fontFamily: '"Press Start 2P", monospace',
            }).setOrigin(0.5).setDepth(5)
        );

        // ── Phase label ────────────────────────────────────────────────────
        this.phaseLabel = this.add.text(cx, 72, t('boss.phase.greed'), {
            fontSize:   '8px',
            color:      '#ff4444',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setDepth(5);

        // ── State bar (5 ticks at y=80) ────────────────────────────────────
        const tickW = 16, tickH = 12, tickGap = 4;
        const barWidth = TOTAL_DECLINES * (tickW + tickGap) - tickGap;
        const barStartX = cx - barWidth / 2;
        for (let i = 0; i < TOTAL_DECLINES; i++) {
            const tick = this.add.rectangle(
                barStartX + i * (tickW + tickGap) + tickW / 2,
                96, tickW, tickH, 0xff4444
            ).setStrokeStyle(1, 0xe8e8e8).setDepth(5);
            this.stateTicks.push(tick);
        }

        // ── Patience meter label + 3 segments ─────────────────────────────
        this.add.text(cx - 48, 108, t('boss.patienceMeter'), {
            fontSize:   '8px',
            color:      '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0, 0.5).setDepth(5);

        const segW = 16, segH = 8, segGap = 2;
        for (let i = 0; i < TOTAL_DECLINES; i++) {
            const seg = this.add.rectangle(
                216 + i * (segW + segGap) + segW / 2,
                108, segW, segH, 0x16213e
            ).setStrokeStyle(1, 0x00ff88).setDepth(5);
            this.patienceSegments.push(seg);
        }

        // ── Speech bubble ──────────────────────────────────────────────────
        this.displayObjects.push(
            this.add.rectangle(cx, 320, 280, 48, 0x16213e, 1)
                .setStrokeStyle(2, 0xe8e8e8).setDepth(4)
        );

        this.offerText = this.add.text(cx, 320, '', {
            fontSize:   '8px',
            color:      '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
            wordWrap:   { width: 260, useAdvancedWrap: true },
            align:      'center',
        }).setOrigin(0.5).setDepth(5);

        // ── Hint text (first encounter) ────────────────────────────────────
        this.hintText = this.add.text(cx, 120, t('boss.hint.decline'), {
            fontSize:   '8px',
            color:      '#00ff88',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setDepth(6).setVisible(false);

        // ── DECLINE button (Greed phase, y=700) ───────────────────────────
        this.declineButton = this.add.rectangle(cx, 700, 240, 56, 0x16213e)
            .setStrokeStyle(2, 0x00ff88)
            .setDepth(5)
            .setInteractive({ useHandCursor: true });

        this.declineLabel = this.add.text(cx, 700, t('boss.decline'), {
            fontSize:   '16px',
            color:      '#00ff88',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setDepth(6);

        this.declineButton.on('pointerdown', this.handleDecline, this);

        // ── Panic phase — timer text + ACCEPT (BUY LOW!) button ───────────
        this.timerText = this.add.text(cx, 680, t('boss.timer').replace('{n}', String(PANIC_DURATION_S)), {
            fontSize:   '8px',
            color:      '#ff4444',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setDepth(6).setVisible(false);

        this.acceptButton = this.add.rectangle(cx, 700, 240, 56, 0x16213e)
            .setStrokeStyle(2, 0x4444ff)
            .setDepth(5)
            .setVisible(false)
            .setInteractive({ useHandCursor: true });

        this.acceptLabel = this.add.text(cx, 700, t('boss.accept'), {
            fontSize:   '16px',
            color:      '#00ff88',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setDepth(6).setVisible(false);

        this.acceptButton.on('pointerdown', this.handleAccept, this);

        // ── Flash text (patience maxed, win, too slow) ────────────────────
        this.flashText = this.add.text(cx, 427, '', {
            fontSize:   '16px',
            color:      '#00ff88',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setDepth(10).setVisible(false);

        // ── Start intro then greed phase ──────────────────────────────────
        // Brief 1s pause to let the tint tween settle, then begin
        this.time.delayedCall(1000, () => this.beginGreedPhase());
    }

    // ── Greed Phase ──────────────────────────────────────────────────────

    private beginGreedPhase(): void {
        this.phase             = 'greed';
        this.declinesCount     = 0;
        this.greedOfferIndex   = 0;

        // Reset tint to greed (0xff4444)
        this.tweens.add({ targets: this.tintRect, fillColor: 0xff4444, alpha: 0.15, duration: 500 });
        this.tintRect.setFillStyle(0xff4444);

        // Reset phase label color + text
        this.phaseLabel.setText(t('boss.phase.greed')).setColor('#ff4444');
        this.tweens.add({ targets: this.phaseLabel, scaleX: 1.3, scaleY: 1.3, duration: 150, yoyo: true });

        // Reset state bar ticks (all filled red = greed)
        for (const tick of this.stateTicks) tick.setFillStyle(0xff4444);

        // Reset patience segments (all empty)
        for (const seg of this.patienceSegments) seg.setFillStyle(0x16213e);

        // Show DECLINE button; hide panic UI
        this.declineButton.setVisible(true);
        this.declineLabel.setVisible(true);
        this.timerText.setVisible(false);
        this.acceptButton.setVisible(false);
        this.acceptLabel.setVisible(false);

        // Show first offer
        this.showOffer(0);

        // Show first-encounter hint
        if (!this.hintShown) {
            this.hintShown = true;
            this.hintText.setVisible(true);
            this.hintTimer = this.time.delayedCall(3000, () => {
                this.hintText.setVisible(false);
            });
        }
    }

    private showOffer(index: number): void {
        const key = GREED_KEYS[index] as string;
        const entry = this.dialogueData[key] as Array<{ portrait: string; text: string }> | undefined;
        const text  = Array.isArray(entry) && entry.length > 0 ? entry[0].text : key;
        this.offerText.setText(text);
    }

    private handleDecline(): void {
        if (this.phase !== 'greed') return;

        // Dismiss hint on first decline
        if (this.hintText.visible) {
            this.hintText.setVisible(false);
            if (this.hintTimer) { this.hintTimer.remove(); this.hintTimer = null; }
        }

        // Button press feedback (scale down)
        this.tweens.add({
            targets: [this.declineButton, this.declineLabel],
            scaleX: 0.95, scaleY: 0.95,
            duration: 100,
            yoyo: true,
        });

        this.declinesCount += 1;

        // Deplete one state tick (right-to-left)
        const tickIndex = TOTAL_DECLINES - this.declinesCount;
        if (tickIndex >= 0) this.stateTicks[tickIndex]?.setFillStyle(0x16213e);

        // Fill one patience segment (left-to-right)
        const segIndex = this.declinesCount - 1;
        if (segIndex < this.patienceSegments.length) {
            this.patienceSegments[segIndex]?.setFillStyle(0x00ff88);
        }

        if (this.declinesCount >= TOTAL_DECLINES) {
            // All declines done — transition to panic
            this.declineButton.disableInteractive();
            this.showFlash(t('boss.patienceFull'), '#00ff88', 1000, () => this.beginPanicPhase());
        } else {
            // Advance to next offer
            this.greedOfferIndex = Math.min(this.greedOfferIndex + 1, GREED_KEYS.length - 1);
            this.showOffer(this.greedOfferIndex);
        }
    }

    // ── Panic Phase ──────────────────────────────────────────────────────

    private beginPanicPhase(): void {
        this.phase = 'panic';
        this.panicCountdown = PANIC_DURATION_S;

        // Swap tint to panic (0x4444ff)
        this.tintRect.setFillStyle(0x4444ff);
        this.tweens.add({ targets: this.tintRect, alpha: 0.15, duration: 500 });

        // Update phase label
        this.phaseLabel.setText(t('boss.phase.panic')).setColor('#4444ff');
        this.tweens.add({ targets: this.phaseLabel, scaleX: 1.3, scaleY: 1.3, duration: 150, yoyo: true });

        // Show panic offer text
        const panicEntry = this.dialogueData['boss_panic_01'] as Array<{ portrait: string; text: string }> | undefined;
        const panicText  = Array.isArray(panicEntry) && panicEntry.length > 0 ? panicEntry[0].text : 'boss_panic_01';
        this.offerText.setText(panicText);

        // Hide DECLINE; show BUY LOW! + timer
        this.declineButton.setVisible(false);
        this.declineLabel.setVisible(false);
        this.timerText.setVisible(true).setText(t('boss.timer').replace('{n}', String(this.panicCountdown)));
        this.acceptButton.setVisible(true).setInteractive({ useHandCursor: true });
        this.acceptLabel.setVisible(true);

        // Start 3s countdown.
        // CR-06 fix: Phaser repeat:N fires N+1 times (first trigger + N repeats).
        // Using repeat:PANIC_DURATION_S-1 fires exactly PANIC_DURATION_S times.
        this.panicTimer = this.time.addEvent({
            delay: 1000,
            repeat: PANIC_DURATION_S - 1,
            callback: () => {
                this.panicCountdown -= 1;
                this.timerText.setText(t('boss.timer').replace('{n}', String(Math.max(0, this.panicCountdown))));
                if (this.panicCountdown <= 0) {
                    this.handlePanicExpiry();
                }
            },
        });
    }

    private handleAccept(): void {
        if (this.phase !== 'panic') return;

        // Cancel panic timer
        if (this.panicTimer) { this.panicTimer.remove(); this.panicTimer = null; }

        this.phase = 'done';

        // BUY LOW! win flash then emit BOSS_DEFEATED
        const winFlash = this.add.text(this.scale.width / 2, 427, t('boss.winFlash'), {
            fontSize:   '24px',
            color:      '#00ff88',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setDepth(10);

        this.tweens.add({ targets: winFlash, alpha: 0, duration: 1000, delay: 500,
            onComplete: () => winFlash.destroy(),
        });

        // patienceBonus = number of declines completed (max TOTAL_DECLINES)
        const patienceBonus = this.declinesCount;

        // PRE-GENERATE the share card Blob NOW (RESEARCH Pitfall 4).
        // The Blob must be cached before the SHARE WISDOM button appears so that
        // the tap handler can call navigator.share() in the user-gesture call stack
        // with no preceding await — iOS requires share() be called synchronously in
        // the gesture call stack (no async gap between tap and share()).
        // We pass the wisdom quote string from the dialogue data.
        const wisdomQuote = typeof this.dialogueData['boss_01_wisdom_quote'] === 'string'
            ? (this.dialogueData['boss_01_wisdom_quote'] as string)
            : '';
        // Fire-and-forget: prepareShareCard caches the Blob internally in ShareService.
        // No await here — the 1s delayedCall gives enough time for the async cache to fill
        // before the SHARE WISDOM button is tapped (the level-complete screen takes ~2s to appear).
        void prepareShareCard(this.game, wisdomQuote);

        this.time.delayedCall(1000, () => {
            GameEvents.emit(Events.BOSS_DEFEATED, { patienceBonus });
        });
    }

    private handlePanicExpiry(): void {
        if (this.phase !== 'panic') return;
        if (this.panicTimer) { this.panicTimer.remove(); this.panicTimer = null; }

        // Hide panic button
        this.acceptButton.disableInteractive();
        this.timerText.setVisible(false);

        // Screen flash (#ff4444 alpha 0.4 for 200ms)
        const screenFlash = this.add.rectangle(0, 0, 480, 854, 0xff4444)
            .setOrigin(0, 0).setAlpha(0.4).setDepth(9);
        this.time.delayedCall(200, () => screenFlash.destroy());

        // TOO SLOW! message for 2 seconds, then reset
        this.showFlash(t('boss.tooSlow'), '#ff4444', 2000, () => {
            // Re-enable DECLINE button and reset to Greed phase
            this.declineButton.setInteractive({ useHandCursor: true });
            this.beginGreedPhase();
        });
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    private showFlash(text: string, color: string, duration: number, onDone: () => void): void {
        const cx = this.scale.width / 2;
        this.flashText.setText(text).setColor(color).setVisible(true);
        // Bounce flash text to center
        this.flashText.setPosition(cx, 427);
        this.time.delayedCall(duration, () => {
            this.flashText.setVisible(false);
            onDone();
        });
    }

    shutdown(): void {
        // Remove all timers (Pitfall 2)
        if (this.panicTimer)  { this.panicTimer.remove();  this.panicTimer = null; }
        if (this.hintTimer)   { this.hintTimer.remove();   this.hintTimer = null; }
        // Remove all pointer listeners
        this.input.off('pointerdown');
        if (this.declineButton) this.declineButton.removeAllListeners();
        if (this.acceptButton)  this.acceptButton.removeAllListeners();
    }
}
