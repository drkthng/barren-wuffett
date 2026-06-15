/**
 * HUD — overworld heads-up display rendered in UIScene
 *
 * Per UI-SPEC Component 1:
 *   - Coin counter (x=16,y=16, coin sprite + COINS:{n} text, scale tween on increment)
 *   - Pause button sprite (x=448,y=32, 44×44 input zone, emits PAUSE_REQUESTED)
 *   - Autosave disk flash (fade in/out 800ms on save)
 *   - Patience-bonus flash ("+{n} PATIENCE BONUS", #00ff88, float-up tween)
 *
 * Pattern: PATTERNS.md HUD.ts + UI-SPEC Component 1
 */
import Phaser, { Scene } from 'phaser';
import { t } from '../services/i18n';
import { GameEvents, Events } from '../events/GameEvents';

export class HUD {
    private readonly scene: Scene;
    // Phase 3: split coin label + value for two-color rendering (UI-SPEC §3a)
    private coinLabel: Phaser.GameObjects.Text;
    private coinValue: Phaser.GameObjects.Text;
    // Legacy alias kept for setCoins tween target (no external refs outside this file)
    private get coinText(): Phaser.GameObjects.Text { return this.coinValue; }
    private readonly saveIcon: Phaser.GameObjects.Image;
    private readonly container: Phaser.GameObjects.Container;
    // Phase 3: streak pips (8 rectangles, visible when streak > 0)
    private readonly streakPips: Phaser.GameObjects.Rectangle[] = [];

    constructor(scene: Scene) {
        this.scene = scene;

        // ── Coin counter (top-left) — split label/value for two-color rendering (UI-SPEC §3a)
        const coinIcon = scene.add.image(24, 24, 'coin').setDisplaySize(16, 16);
        // "COINS:" label stays #e8e8e8; coin value uses #f5c842 (coin gold)
        this.coinLabel = scene.add.text(36, 16, t('hud.coinsLabel'), {
            fontSize: '8px',
            color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        });
        this.coinValue = scene.add.text(36 + this.coinLabel.width + 4, 16, '0', {
            fontSize: '8px',
            color: '#f5c842',
            fontFamily: '"Press Start 2P", monospace',
        });

        // ── Streak pips (Phase 3) — 8 × 12×8px rectangles at y=40 ──────────
        // Visible only when streak > 0 (D-07, UI-SPEC §3b)
        const streakLabel = scene.add.text(16, 40, t('hud.streak'), {
            fontSize: '8px',
            color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setVisible(false);
        // Store label ref for visibility toggling in updateStreak
        (this as unknown as { _streakLabel: Phaser.GameObjects.Text })._streakLabel = streakLabel;

        for (let i = 0; i < 8; i++) {
            const pip = scene.add.rectangle(72 + i * 16, 40, 12, 8, 0x16213e)
                .setDepth(20)
                .setVisible(false);
            this.streakPips.push(pip);
        }

        // ── Autosave disk flash (bottom-left) ────────────────────────────────
        this.saveIcon = scene.add.image(16, 838, 'ui_save')
            .setDisplaySize(16, 16)
            .setAlpha(0);

        // ── Pause button (top-right) ─────────────────────────────────────────
        const pauseBtn = scene.add.image(448, 32, 'ui_pause').setDisplaySize(32, 32);
        pauseBtn.setInteractive(
            new Phaser.Geom.Rectangle(-22, -22, 44, 44),
            Phaser.Geom.Rectangle.Contains
        );
        pauseBtn.on('pointerdown', () => {
            pauseBtn.setAlpha(0.7);
            scene.time.delayedCall(100, () => pauseBtn.setAlpha(1));
            GameEvents.emit(Events.PAUSE_REQUESTED);
        });

        // Container holds core HUD elements (pips are separate — depth set individually)
        this.container = scene.add.container(0, 0, [
            coinIcon, this.coinLabel, this.coinValue, streakLabel, this.saveIcon, pauseBtn,
        ]).setDepth(20);
    }

    /** Update the displayed coin count. */
    setCoins(count: number): void {
        this.coinValue.setText(String(count));
        // Reposition value text to follow label width (handles different number widths)
        this.coinValue.setX(36 + this.coinLabel.width + 4);
        // Scale-up tween on increment (on coinValue — the gold number)
        this.scene.tweens.add({
            targets: this.coinText,
            scaleX: 1.2, scaleY: 1.2,
            duration: 75,
            yoyo: true,
        });
    }

    /**
     * Phase 3: Flash a "+N" coin pickup float (snowball juice, UI-SPEC §2c / §3a).
     * Early-returns when amount ≤ 0. Uses #f5c842 coin-gold color.
     * Pattern: flashPatienceBonus (same float-up tween, different color + text).
     */
    flashCoinPickup(amount: number): void {
        if (amount <= 0) return;
        const pickupText = this.scene.add.text(240, 200,
            `+${amount}`,
            {
                fontSize: '8px',
                color: '#f5c842',
                fontFamily: '"Press Start 2P", monospace',
            }
        ).setOrigin(0.5).setDepth(25);

        this.scene.tweens.add({
            targets: pickupText,
            y: 160,
            alpha: 0,
            duration: 700,
            onComplete: () => pickupText.destroy(),
        });
    }

    /**
     * Phase 3: Update streak pips (UI-SPEC §3b).
     * Filled pips = #00ff88 (accent); empty = #16213e (secondary).
     * All pips hidden when n = 0 (no streak active).
     */
    updateStreak(n: number): void {
        const label = (this as unknown as { _streakLabel: Phaser.GameObjects.Text })._streakLabel;
        this.streakPips.forEach((pip, i) => {
            pip.setFillStyle(i < n ? 0x00ff88 : 0x16213e);
            pip.setVisible(n > 0);
        });
        if (label) label.setVisible(n > 0);
    }

    /**
     * Phase 3 Slice 2: Flash the streak bonus toast when the 8th bush is cleared (D-07).
     * Two-line format modeled on flashPatienceBonus (same float-up tween structure).
     * UI-SPEC §3c: line 1 = "STREAK BONUS!" (#00ff88, Heading 16px), line 2 = coins or journal.
     */
    flashStreakBonus(coins: number, journal: boolean): void {
        // Line 1: "STREAK BONUS!" in accent green
        const line1 = this.scene.add.text(240, 200,
            t('hud.streakBonus'),
            {
                fontSize: '16px',
                color: '#00ff88',
                fontFamily: '"Press Start 2P", monospace',
            }
        ).setOrigin(0.5).setDepth(25);

        // Line 2: coins amount or journal page label
        const line2Text = journal
            ? t('hud.streakBonusJournal')
            : t('hud.streakBonusCoins').replace('{n}', String(coins));

        const line2 = this.scene.add.text(240, 222,
            line2Text,
            {
                fontSize: '8px',
                color: '#f5c842',
                fontFamily: '"Press Start 2P", monospace',
            }
        ).setOrigin(0.5).setDepth(25);

        // Float-up + fade (1200ms, UI-SPEC §3c)
        this.scene.tweens.add({
            targets: [line1, line2],
            y: '-=40',
            alpha: 0,
            duration: 1200,
            onComplete: () => { line1.destroy(); line2.destroy(); },
        });
    }

    /** Flash the autosave disk icon (800ms total). */
    flashSave(): void {
        this.scene.tweens.add({
            targets: this.saveIcon,
            alpha: 1,
            duration: 200,
            onComplete: () => {
                this.scene.tweens.add({
                    targets: this.saveIcon,
                    alpha: 0,
                    duration: 600,
                });
            },
        });
    }

    /** Flash the patience bonus text at canvas center, floating upward. */
    flashPatienceBonus(amount: number): void {
        const bonusText = this.scene.add.text(240, 200,
            t('hud.patienceBonus').replace('{n}', String(amount)), {
                fontSize: '8px',
                color: '#00ff88',
                fontFamily: '"Press Start 2P", monospace',
            }
        ).setOrigin(0.5).setDepth(25);

        this.scene.tweens.add({
            targets: bonusText,
            y: 160,
            alpha: 0,
            duration: 800,
            onComplete: () => bonusText.destroy(),
        });
    }

    /** Show or hide the HUD container. */
    setVisible(visible: boolean): void {
        this.container.setVisible(visible);
    }

}
