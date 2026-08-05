/**
 * PaperThrowScene — paper-route mini-game (Phase 4 rebuild, L1E-05)
 *
 * The route is a real aiming game now:
 *   - Dawn-street backdrop; 5 characterful generated houses (two rows).
 *   - A neighbor appears at a house's door for a short window; the player
 *     TAPS THAT HOUSE (or presses 1-5) to throw a paper from Barren's spot.
 *   - Papers are limited (10 for 8 deliveries) — a throw at an empty door is
 *     a wasted paper, so ACCURACY matters, not just reaction time.
 *   - PERFECT! when the throw comes within 600ms of the neighbor appearing.
 *   - Ends on an explicit RESULTS SPLASH: delivered, accuracy %, perfects,
 *     coins, letter grade, NEW BEST! — then MINIGAME_COMPLETE on tap.
 *
 * Contracts preserved from Phase 2/3:
 *   - launch data: { zone, bestScore } (bestScore added in Phase 4)
 *   - MINIGAME_COMPLETE payload keeps { score, perfect } (coins seam reads
 *     these) and adds { delivered, throws } for best-score tracking.
 *   - init() resets ALL mutable state (scene instances are reused).
 *   - shutdown() removes every timer + pointer listener (Pitfall 2).
 */
import { Scene } from 'phaser';
import { GameEvents, Events } from '../../../events/GameEvents';
import { t } from '../../../services/i18n';
import { AudioService } from '../../../services/AudioService';
import { computeMinigameReward } from '../../../systems/Economy';
import {
    computeRouteResults, ROUTE_TARGET_DELIVERIES, ROUTE_TOTAL_PAPERS,
} from '../../../systems/RouteScoring';

const GAME_DURATION_S    = 60;
const NEIGHBOR_APPEAR_MS = 1800;   // neighbor stays at the door this long
const PERFECT_WINDOW_MS  = 600;
const COUNTDOWN_START    = 3;

// House layout — two rows; door offset is identical for every generated house
// (door center = sprite center + (0, +18) at scale 1, see tools/gen-assets.mjs)
const HOUSE_SCALE = 1.5;
const DOOR_OFFSET_Y = 18 * HOUSE_SCALE;
const HOUSE_POSITIONS = [
    { x: 110, y: 300 }, { x: 240, y: 300 }, { x: 370, y: 300 },
    { x: 170, y: 470 }, { x: 310, y: 470 },
] as const;

// Deterministic-but-varied neighbor sequence (no pure RNG droughts/repeats)
const NEIGHBOR_SEQ = [2, 0, 4, 1, 3, 1, 4, 0, 3, 2, 0, 3, 1, 4, 2] as const;
const GAP_SEQ      = [700, 950, 600, 1100, 800, 650, 1000, 750, 900, 600] as const;

type Phase = 'instructions' | 'game' | 'results' | 'done';

export class PaperThrowScene extends Scene {
    // Run state
    private delivered    = 0;
    private throws       = 0;
    private perfectCount = 0;
    private papersLeft   = ROUTE_TOTAL_PAPERS;
    private timeLeft     = GAME_DURATION_S;
    private bestScore    = 0;
    private seqIndex     = 0;
    private phase: Phase = 'instructions';

    // Neighbor state
    private neighborHouse    = -1;
    private neighborAppearAt = 0;
    private neighborSprite: Phaser.GameObjects.Image | null = null;

    // Display
    private houses: Phaser.GameObjects.Image[] = [];
    private papersText!:    Phaser.GameObjects.Text;
    private deliveredText!: Phaser.GameObjects.Text;
    private timerText!:     Phaser.GameObjects.Text;
    private barren!:        Phaser.GameObjects.Sprite;
    private introGroup:     Phaser.GameObjects.GameObject[] = [];
    private countdownText!: Phaser.GameObjects.Text;

    // Timers
    private countdownTimer:    Phaser.Time.TimerEvent | null = null;
    private gameTimer:         Phaser.Time.TimerEvent | null = null;
    private neighborTimer:     Phaser.Time.TimerEvent | null = null;
    private neighborHideTimer: Phaser.Time.TimerEvent | null = null;

    constructor() {
        super('PaperThrowScene');
    }

    init(data?: { bestScore?: number }): void {
        this.delivered    = 0;
        this.throws       = 0;
        this.perfectCount = 0;
        this.papersLeft   = ROUTE_TOTAL_PAPERS;
        this.timeLeft     = GAME_DURATION_S;
        this.bestScore    = data?.bestScore ?? 0;
        this.seqIndex     = 0;
        this.phase        = 'instructions';
        this.neighborHouse    = -1;
        this.neighborAppearAt = 0;
        this.neighborSprite   = null;
        this.houses           = [];
        this.introGroup       = [];
        this.countdownTimer    = null;
        this.gameTimer         = null;
        this.neighborTimer     = null;
        this.neighborHideTimer = null;
    }

    create(): void {
        const cx = this.scale.width / 2;

        this.buildBackdrop();
        this.buildHouses();

        // Barren at his corner, bottom center, facing up (frame 2 = up idle)
        this.barren = this.add.sprite(cx, 668, 'player_sheet', 2)
            .setScale(2.5).setDepth(4);
        this.tweens.add({
            targets: this.barren, y: 664,
            duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });

        // ── HUD ────────────────────────────────────────────────────────────
        const hudStyle = {
            fontSize: '8px', color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        };
        this.papersText = this.add.text(16, 96,
            t('minigame.papers').replace('{n}', String(this.papersLeft)), hudStyle)
            .setDepth(6);
        this.deliveredText = this.add.text(cx, 96,
            t('minigame.delivered').replace('{n}', '0').replace('{max}', String(ROUTE_TARGET_DELIVERIES)),
            hudStyle).setOrigin(0.5, 0).setDepth(6);
        this.timerText = this.add.text(464, 96,
            t('minigame.timer').replace('{n}', String(GAME_DURATION_S)), hudStyle)
            .setOrigin(1, 0).setDepth(6);

        // ── Intro panel ────────────────────────────────────────────────────
        const panel = this.add.rectangle(0, 0, 480, 854, 0x1a1a2e, 0.92)
            .setOrigin(0, 0).setDepth(10);
        const title = this.add.text(cx, 300, t('minigame.paperThrow.title'), {
            fontSize: '24px', color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setDepth(11);
        const instructions = this.add.text(cx, 370, t('minigame.paperThrow.instructions'), {
            fontSize: '8px', color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
            wordWrap: { width: 380, useAdvancedWrap: true },
            align: 'center', lineSpacing: 6,
        }).setOrigin(0.5).setDepth(11);
        this.countdownText = this.add.text(cx, 470,
            t('minigame.ready').replace('{n}', String(COUNTDOWN_START)), {
                fontSize: '16px', color: '#00ff88',
                fontFamily: '"Press Start 2P", monospace',
            }).setOrigin(0.5).setDepth(11);
        this.introGroup = [panel, title, instructions];

        // Keyboard aiming: 1-5
        if (this.input.keyboard) {
            for (let i = 0; i < 5; i++) {
                this.input.keyboard.on(`keydown-${['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'][i]}`,
                    () => this.aimAt(i));
            }
        }

        this.startCountdown();
    }

    // ── Backdrop: dawn over Ohama ─────────────────────────────────────────
    private buildBackdrop(): void {
        this.add.rectangle(0, 0, 480, 190, 0x2a3a5e).setOrigin(0, 0).setDepth(0);   // night sky
        this.add.rectangle(0, 190, 480, 40, 0x4a5a8e).setOrigin(0, 0).setDepth(0);  // dawn band
        this.add.rectangle(0, 230, 480, 30, 0xc8875a).setOrigin(0, 0).setDepth(0);  // sunrise glow
        this.add.rectangle(0, 260, 480, 594, 0x5a9048).setOrigin(0, 0).setDepth(0); // lawns
        // rising sun
        this.add.circle(400, 225, 16, 0xf5c842).setDepth(0);
        // road where Barren stands
        this.add.rectangle(0, 620, 480, 90, 0x8a8478).setOrigin(0, 0).setDepth(1);
        this.add.rectangle(0, 618, 480, 4, 0x6a6458).setOrigin(0, 0).setDepth(1);
        this.add.rectangle(0, 708, 480, 4, 0x6a6458).setOrigin(0, 0).setDepth(1);
        // dashed center line
        for (let x = 10; x < 480; x += 40) {
            this.add.rectangle(x, 663, 20, 3, 0xf4ecd8).setOrigin(0, 0.5).setDepth(1);
        }
    }

    private buildHouses(): void {
        HOUSE_POSITIONS.forEach((pos, i) => {
            const house = this.add.image(pos.x, pos.y, `house_0${i + 1}`)
                .setScale(HOUSE_SCALE)
                .setDepth(2)
                .setInteractive({ useHandCursor: true });
            house.on('pointerdown', () => this.aimAt(i));
            this.houses.push(house);
            // small aim badge (1-5) under each house — arcade-style, aids desktop
            this.add.text(pos.x, pos.y + 56, String(i + 1), {
                fontSize: '8px', color: '#f4ecd8',
                fontFamily: '"Press Start 2P", monospace',
                backgroundColor: '#1a1a2e88', padding: { x: 3, y: 2 },
            }).setOrigin(0.5).setDepth(3);
        });
    }

    // ── Countdown ─────────────────────────────────────────────────────────
    private startCountdown(): void {
        let remaining = COUNTDOWN_START;
        this.countdownTimer = this.time.addEvent({
            delay: 1000,
            repeat: COUNTDOWN_START - 1,  // fires exactly COUNTDOWN_START times
            callback: () => {
                remaining -= 1;
                if (remaining > 0) {
                    this.countdownText.setText(t('minigame.ready').replace('{n}', String(remaining)));
                } else {
                    this.countdownTimer = null;
                    this.beginGame();
                }
            },
        });
    }

    private beginGame(): void {
        if (this.phase !== 'instructions') return;
        this.phase = 'game';
        for (const o of this.introGroup) (o as Phaser.GameObjects.Rectangle).setVisible(false);
        this.countdownText.setVisible(false);

        this.gameTimer = this.time.addEvent({
            delay: 1000, loop: true,
            callback: () => {
                this.timeLeft -= 1;
                this.timerText.setText(t('minigame.timer').replace('{n}', String(Math.max(0, this.timeLeft))));
                if (this.timeLeft <= 15) this.timerText.setColor('#ff4444');
                if (this.timeLeft <= 0) this.endGame();
            },
        });
        this.scheduleNextNeighbor(600);
    }

    // ── Neighbor cycle ────────────────────────────────────────────────────
    private scheduleNextNeighbor(extraDelay = 0): void {
        if (this.phase !== 'game') return;
        const gap = GAP_SEQ[this.seqIndex % GAP_SEQ.length] + extraDelay;
        this.neighborTimer = this.time.delayedCall(gap, () => {
            if (this.phase !== 'game') return;
            this.showNeighbor(NEIGHBOR_SEQ[this.seqIndex % NEIGHBOR_SEQ.length]);
            this.seqIndex += 1;
        });
    }

    private showNeighbor(houseIndex: number): void {
        const pos = HOUSE_POSITIONS[houseIndex];
        this.neighborHouse    = houseIndex;
        this.neighborAppearAt = this.time.now;
        this.neighborSprite = this.add.image(pos.x, pos.y + DOOR_OFFSET_Y, 'neighbor')
            .setScale(HOUSE_SCALE).setDepth(3).setAlpha(0);
        // steps out of the door
        this.tweens.add({ targets: this.neighborSprite, alpha: 1, duration: 120 });
        // door glow on the active house
        this.houses[houseIndex].setTint(0xfff2c8);

        this.neighborHideTimer = this.time.delayedCall(NEIGHBOR_APPEAR_MS, () => {
            this.hideNeighbor();
            this.scheduleNextNeighbor();
        });
    }

    private hideNeighbor(): void {
        if (this.neighborHouse >= 0) this.houses[this.neighborHouse]?.clearTint();
        this.neighborHouse = -1;
        const spr = this.neighborSprite;
        this.neighborSprite = null;
        if (spr) {
            this.tweens.add({
                targets: spr, alpha: 0, duration: 120,
                onComplete: () => spr.destroy(),
            });
        }
        if (this.neighborHideTimer) { this.neighborHideTimer.remove(); this.neighborHideTimer = null; }
    }

    // ── Aiming / throwing ─────────────────────────────────────────────────
    private aimAt(houseIndex: number): void {
        if (this.phase !== 'game') return;
        if (this.papersLeft <= 0) return;

        this.papersLeft -= 1;
        this.throws += 1;
        this.papersText.setText(t('minigame.papers').replace('{n}', String(this.papersLeft)));
        AudioService.playSfx(this, 'throw');

        // hit is decided at throw time: neighbor present at THAT house
        const hit = houseIndex === this.neighborHouse;
        const elapsed = this.time.now - this.neighborAppearAt;
        const isPerfect = hit && elapsed <= PERFECT_WINDOW_MS;
        // the neighbor "goes back inside" immediately on a hit (caught the paper)
        const targetPos = HOUSE_POSITIONS[houseIndex];
        const arriveY = targetPos.y + DOOR_OFFSET_Y;

        // paper arc: spin + rise-then-fall to the door
        const paper = this.add.image(this.barren.x, this.barren.y - 20, 'paper_throw')
            .setDepth(5).setScale(1.4);
        this.tweens.add({ targets: paper, angle: 720, duration: 380 });
        this.tweens.add({ targets: paper, x: targetPos.x, duration: 380, ease: 'Linear' });
        this.tweens.add({
            targets: paper, y: arriveY - 60, duration: 190, ease: 'Quad.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: paper, y: arriveY, duration: 190, ease: 'Quad.easeIn',
                    onComplete: () => {
                        paper.destroy();
                        this.resolveThrow(houseIndex, hit, isPerfect);
                    },
                });
            },
        });

        if (hit) {
            // consume the neighbor window now so a second throw can't double-hit
            if (this.neighborHideTimer) { this.neighborHideTimer.remove(); this.neighborHideTimer = null; }
            this.hideNeighbor();
            this.scheduleNextNeighbor(300);
        }
    }

    private resolveThrow(houseIndex: number, hit: boolean, isPerfect: boolean): void {
        const pos = HOUSE_POSITIONS[houseIndex];
        if (hit) {
            this.delivered += 1;
            if (isPerfect) this.perfectCount += 1;
            AudioService.playSfx(this, 'thunk');
            this.cameras.main.shake(40, 0.002);
            this.deliveredText.setText(
                t('minigame.delivered')
                    .replace('{n}', String(this.delivered))
                    .replace('{max}', String(ROUTE_TARGET_DELIVERIES)));
            this.tweens.add({
                targets: this.deliveredText, scaleX: 1.25, scaleY: 1.25,
                duration: 80, yoyo: true,
            });
            if (isPerfect) this.floatLabel(pos.x, pos.y - 40, t('minigame.perfect'), '#00ff88');
        } else {
            AudioService.playSfx(this, 'miss');
            this.floatLabel(pos.x, pos.y - 40, t('minigame.wasted'), '#ff8844');
        }

        // End conditions (checked after the paper resolves so the last throw counts)
        if (this.phase === 'game'
            && (this.delivered >= ROUTE_TARGET_DELIVERIES || this.papersLeft <= 0)) {
            this.endGame();
        }
    }

    private floatLabel(x: number, y: number, text: string, color: string): void {
        const label = this.add.text(x, y, text, {
            fontSize: '10px', color,
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setDepth(8);
        this.tweens.add({
            targets: label, y: y - 30, alpha: 0, duration: 700, ease: 'Quad.easeOut',
            onComplete: () => label.destroy(),
        });
    }

    // ── Results splash ────────────────────────────────────────────────────
    private endGame(): void {
        if (this.phase !== 'game') return;
        this.phase = 'results';

        if (this.gameTimer)        { this.gameTimer.remove();        this.gameTimer = null; }
        if (this.neighborTimer)    { this.neighborTimer.remove();    this.neighborTimer = null; }
        this.hideNeighbor();

        const results = computeRouteResults(
            this.delivered, this.throws, this.perfectCount, this.bestScore);
        const coins = computeMinigameReward(this.delivered, this.perfectCount);
        const cx = this.scale.width / 2;

        // slight delay so the last thunk/miss reads before the splash
        this.time.delayedCall(500, () => {
            this.add.rectangle(0, 0, 480, 854, 0x1a1a2e, 0.94).setOrigin(0, 0).setDepth(20);
            this.add.rectangle(cx, 420, 380, 460, 0x16213e)
                .setStrokeStyle(2, 0xe8e8e8).setDepth(21);

            this.add.text(cx, 240, t('results.title'), {
                fontSize: '16px', color: '#e8e8e8',
                fontFamily: '"Press Start 2P", monospace',
            }).setOrigin(0.5).setDepth(22);

            const rows: Array<[string, string, string]> = [
                [t('results.delivered'), `${results.delivered}/${ROUTE_TARGET_DELIVERIES}`, '#e8e8e8'],
                [t('results.accuracy'),  `${results.accuracy}%`, '#e8e8e8'],
                [t('results.perfect'),   `x${results.perfects}`, '#00ff88'],
                [t('results.coins'),     `+${coins}`, '#f5c842'],
            ];
            rows.forEach(([label, value, color], i) => {
                const y = 300 + i * 44;
                this.add.text(cx - 160, y, label, {
                    fontSize: '8px', color: '#8a92b8',
                    fontFamily: '"Press Start 2P", monospace',
                }).setOrigin(0, 0.5).setDepth(22);
                this.add.text(cx + 160, y, value, {
                    fontSize: '16px', color,
                    fontFamily: '"Press Start 2P", monospace',
                }).setOrigin(1, 0.5).setDepth(22);
            });

            // Grade — big letter, color-coded
            const gradeColors: Record<string, string> = {
                S: '#f5c842', A: '#00ff88', B: '#6a9ac4', C: '#e8e8e8', D: '#ff8844',
            };
            this.add.text(cx - 160, 510, t('results.grade'), {
                fontSize: '8px', color: '#8a92b8',
                fontFamily: '"Press Start 2P", monospace',
            }).setOrigin(0, 0.5).setDepth(22);
            const gradeText = this.add.text(cx + 130, 512, results.grade, {
                fontSize: '48px', color: gradeColors[results.grade],
                fontFamily: '"Press Start 2P", monospace',
            }).setOrigin(0.5).setDepth(22).setScale(0);
            this.tweens.add({
                targets: gradeText, scaleX: 1, scaleY: 1,
                duration: 350, ease: 'Back.easeOut', delay: 200,
            });
            if (results.grade === 'S' || results.grade === 'A') {
                AudioService.playSfx(this, 'streak_bonus');
            }

            // NEW BEST!
            if (results.isNewBest) {
                const best = this.add.text(cx, 580, t('results.newBest'), {
                    fontSize: '16px', color: '#f5c842',
                    fontFamily: '"Press Start 2P", monospace',
                }).setOrigin(0.5).setDepth(22);
                this.tweens.add({
                    targets: best, alpha: 0.3,
                    duration: 400, yoyo: true, repeat: -1,
                });
            }

            const cont = this.add.text(cx, 630, t('results.continue'), {
                fontSize: '8px', color: '#00ff88',
                fontFamily: '"Press Start 2P", monospace',
            }).setOrigin(0.5).setDepth(22);
            this.tweens.add({ targets: cont, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });

            // small guard delay so the splash isn't dismissed by a stray tap
            this.time.delayedCall(400, () => {
                this.input.once('pointerdown', this.emitComplete, this);
                this.input.keyboard?.once('keydown-SPACE', this.emitComplete, this);
                this.input.keyboard?.once('keydown-ENTER', this.emitComplete, this);
            });
        });
    }

    private emitComplete(): void {
        if (this.phase === 'done') return;
        this.phase = 'done';
        GameEvents.emit(Events.MINIGAME_COMPLETE, {
            score:     this.delivered,
            perfect:   this.perfectCount,
            delivered: this.delivered,
            throws:    this.throws,
        });
    }

    shutdown(): void {
        if (this.countdownTimer)   { this.countdownTimer.remove();   this.countdownTimer = null; }
        if (this.gameTimer)        { this.gameTimer.remove();        this.gameTimer = null; }
        if (this.neighborTimer)    { this.neighborTimer.remove();    this.neighborTimer = null; }
        if (this.neighborHideTimer){ this.neighborHideTimer.remove(); this.neighborHideTimer = null; }
        this.input.off('pointerdown');
        this.input.keyboard?.removeAllListeners();
    }
}
