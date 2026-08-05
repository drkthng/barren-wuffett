/**
 * BossScene — Mr. Market "Mood Pendulum" (Phase 4 rebuild, L1E-06, Direction A)
 *
 * The fight is a MOOD READ, not a menu:
 *   - A visible GREED↔PANIC meter swings continuously (MoodPendulum seam).
 *   - GREED: Mr. Market inflates, glows green, and hurls FOMO coin lures that
 *     home toward the player — lure contact costs 1 composure. Whacking him
 *     now is "buying high" and ALSO costs composure.
 *   - PANIC: the strike window — move in close and WHACK (same verb, same
 *     controls as the overworld: joystick/WASD + whack button/J/Space).
 *     3 landed hits win; each hit makes the pendulum swing faster.
 *   - Composure 0 is never a death screen: "SHAKEN OUT!" lesson → fresh retry.
 *
 * Contracts preserved:
 *   - Win → prepareShareCard(wisdom) then BOSS_DEFEATED { patienceBonus }
 *     (bonus = composure remaining, 1-3 — same magnitude as before).
 *   - init() resets all mutable state; shutdown() removes timers/listeners.
 *   - UIScene shows the joystick + whack button while this scene runs.
 */
import Phaser, { Scene } from 'phaser';
import { GameEvents, Events } from '../../events/GameEvents';
import { InputBus, Action } from '../../input/InputBus';
import { MoodPendulum } from '../../systems/MoodPendulum';
import type { MoodState } from '../../systems/MoodPendulum';
import { AudioService } from '../../services/AudioService';
import { t } from '../../services/i18n';
import { prepareShareCard } from '../../services/ShareService';
import dialogueDataRaw from '../../data/dialogue/en/level-01.json';

const HITS_TO_WIN     = 3;
const MAX_COMPOSURE   = 3;
const STRIKE_RANGE    = 80;    // px from boss center for a whack to reach him
const LURE_SPEED      = 150;   // px/s toward the player
const LURE_INTERVAL   = 850;   // ms between lures while greedy
const LURE_LIFE_MS    = 4000;
const WHACK_COOLDOWN  = 350;
const IFRAME_MS       = 900;
// 120 px/s: a full-arena sprint (≈300px) fits inside one 8s-period panic
// window (~2.7s) — anticipating the swing is better, but never mandatory
const PLAYER_SPEED    = 120;

const BOSS_X = 240;
const BOSS_Y = 250;

const GREED_KEYS = ['boss_greed_01', 'boss_greed_02', 'boss_greed_03'] as const;

type Phase = 'intro' | 'fight' | 'shaken' | 'done';

export class BossScene extends Scene {
    private phase: Phase = 'intro';
    private pendulum!: MoodPendulum;
    private prevMoodState: MoodState = 'neutral';
    private hits = 0;
    private composure = MAX_COMPOSURE;
    private whackCooldown = false;
    private invincibleUntil = 0;
    private tauntIndex = 0;

    // Display
    private tintRect!: Phaser.GameObjects.Rectangle;
    private bossSprite!: Phaser.GameObjects.Image;
    private player!: Phaser.Physics.Arcade.Sprite;
    private meterKnob!: Phaser.GameObjects.Rectangle;
    private strikeText!: Phaser.GameObjects.Text;
    private tauntText!: Phaser.GameObjects.Text;
    private hearts: Phaser.GameObjects.Image[] = [];
    private hitPips: Phaser.GameObjects.Rectangle[] = [];
    private lures: Phaser.Physics.Arcade.Image[] = [];

    // Input
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
    private wasd: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key> | null = null;
    private joystick: { up: boolean; down: boolean; left: boolean; right: boolean } | null = null;

    // Timers
    private lureTimer: Phaser.Time.TimerEvent | null = null;
    private tauntTimer: Phaser.Time.TimerEvent | null = null;

    private dialogueData: Record<string, unknown> = {};

    constructor() {
        super('BossScene');
    }

    init(): void {
        this.phase           = 'intro';
        this.pendulum        = new MoodPendulum();
        this.prevMoodState   = 'neutral';
        this.hits            = 0;
        this.composure       = MAX_COMPOSURE;
        this.whackCooldown   = false;
        this.invincibleUntil = 0;
        this.tauntIndex      = 0;
        this.hearts          = [];
        this.hitPips         = [];
        this.lures           = [];
        this.joystick        = null;
        this.lureTimer       = null;
        this.tauntTimer      = null;
    }

    create(): void {
        const cx = this.scale.width / 2;
        this.dialogueData = dialogueDataRaw as Record<string, unknown>;

        // ── Arena backdrop ────────────────────────────────────────────────
        this.add.rectangle(0, 0, 480, 854, 0x1a1a2e).setOrigin(0, 0).setDepth(0);
        this.tintRect = this.add.rectangle(0, 0, 480, 854, 0x44aa66)
            .setOrigin(0, 0).setAlpha(0.08).setDepth(0);
        // trading floor
        this.add.rectangle(0, 320, 480, 500, 0x23233c).setOrigin(0, 0).setDepth(0);
        for (let y = 380; y < 820; y += 60) {
            this.add.rectangle(0, y, 480, 1, 0x2e2e4e).setOrigin(0, 0).setDepth(0);
        }

        // ── Mr. Market ────────────────────────────────────────────────────
        this.bossSprite = this.add.image(BOSS_X, BOSS_Y, 'boss_mr_market_greed')
            .setDisplaySize(64, 96).setDepth(3);
        this.add.text(cx, 44, t('boss.mrMarket.name'), {
            fontSize: '16px', color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setDepth(5);

        // Taunt bubble
        this.tauntText = this.add.text(cx, 170, '', {
            fontSize: '8px', color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
            backgroundColor: '#16213e', padding: { x: 6, y: 4 },
            wordWrap: { width: 300, useAdvancedWrap: true }, align: 'center',
        }).setOrigin(0.5).setDepth(5);

        // ── Mood meter ────────────────────────────────────────────────────
        this.buildMoodMeter(cx);

        // ── Composure hearts + hit pips ───────────────────────────────────
        this.add.text(16, 96, t('boss.composure'), {
            fontSize: '6px', color: '#8a92b8',
            fontFamily: '"Press Start 2P", monospace',
        }).setDepth(5);
        for (let i = 0; i < MAX_COMPOSURE; i++) {
            this.hearts.push(this.add.image(24 + i * 22, 120, 'heart').setScale(1.2).setDepth(5));
        }
        this.add.text(464, 96, t('boss.hits'), {
            fontSize: '6px', color: '#8a92b8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(1, 0).setDepth(5);
        for (let i = 0; i < HITS_TO_WIN; i++) {
            this.hitPips.push(
                this.add.rectangle(464 - (HITS_TO_WIN - 1 - i) * 22, 120, 16, 12, 0x16213e)
                    .setStrokeStyle(1, 0x00ff88).setDepth(5),
            );
        }

        // ── Strike callout ────────────────────────────────────────────────
        this.strikeText = this.add.text(cx, 360, t('boss.strikeNow'), {
            fontSize: '8px', color: '#ff4444',
            fontFamily: '"Press Start 2P", monospace',
            backgroundColor: '#1a1a2ecc', padding: { x: 4, y: 3 },
        }).setOrigin(0.5).setDepth(6).setVisible(false);

        // ── Player (physics; the arena is its own world) ──────────────────
        this.physics.world.setBounds(24, 330, 432, 470);
        this.player = this.physics.add.sprite(cx, 640, 'player_sheet', 2);
        this.player.setCollideWorldBounds(true).setDepth(4);

        // ── Keyboard ──────────────────────────────────────────────────────
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.wasd = {
                up:    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                down:  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                left:  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            };
            const whack = () => InputBus.setAction(Action.WHACK, true);
            this.input.keyboard.on('keydown-J', whack);
            this.input.keyboard.on('keydown-SPACE', whack);
            this.input.keyboard.on('keydown-ENTER', whack);
        }

        // ── Intro overlay ─────────────────────────────────────────────────
        const introPanel = this.add.rectangle(0, 0, 480, 854, 0x1a1a2e, 0.92)
            .setOrigin(0, 0).setDepth(10);
        const introTitle = this.add.text(cx, 300, t('boss.mrMarket.name'), {
            fontSize: '24px', color: '#ff4444',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setDepth(11);
        const introHow = this.add.text(cx, 400, t('boss.howto'), {
            fontSize: '8px', color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
            align: 'center', lineSpacing: 8,
        }).setOrigin(0.5).setDepth(11);
        this.time.delayedCall(2600, () => {
            introPanel.setVisible(false);
            introTitle.setVisible(false);
            introHow.setVisible(false);
            this.beginFight();
        });

        this.cameras.main.fadeIn(300, 26, 26, 46);
    }

    private buildMoodMeter(cx: number): void {
        const METER_X = 70, METER_W = 340, METER_Y = 130;
        this.add.rectangle(cx, METER_Y, METER_W, 18, 0x16213e)
            .setStrokeStyle(2, 0xe8e8e8).setDepth(5);
        // strike zone (right end = panic side)
        const zoneW = METER_W * 0.16;
        this.add.rectangle(METER_X + METER_W - zoneW / 2, METER_Y, zoneW, 14, 0xff4444, 0.35).setDepth(5);
        // labels sit UNDER the meter ends (clear of the composure/hits HUD)
        this.add.text(METER_X, METER_Y + 16, t('boss.meter.greed'), {
            fontSize: '6px', color: '#00ff88',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0, 0).setDepth(5);
        this.add.text(METER_X + METER_W, METER_Y + 16, t('boss.meter.panic'), {
            fontSize: '6px', color: '#ff4444',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(1, 0).setDepth(5);
        this.meterKnob = this.add.rectangle(cx, METER_Y, 10, 26, 0xf5c842)
            .setStrokeStyle(1, 0x1a1a2e).setDepth(6);
        this.meterKnob.setData('meterX', METER_X);
        this.meterKnob.setData('meterW', METER_W);
    }

    // ── Fight loop ────────────────────────────────────────────────────────

    private beginFight(): void {
        this.phase = 'fight';
        this.showTaunt();
        this.tauntTimer = this.time.addEvent({
            delay: 3500, loop: true, callback: () => this.showTaunt(),
        });
        this.lureTimer = this.time.addEvent({
            delay: LURE_INTERVAL, loop: true, callback: () => this.spawnLure(),
        });
    }

    private showTaunt(): void {
        if (this.phase !== 'fight') return;
        const state = this.pendulum.state;
        const key = state === 'panic'
            ? 'boss_panic_01'
            : GREED_KEYS[this.tauntIndex++ % GREED_KEYS.length];
        const entry = this.dialogueData[key] as Array<{ text: string }> | undefined;
        this.tauntText.setText(Array.isArray(entry) && entry.length ? entry[0].text : '');
    }

    update(_time: number, delta: number): void {
        if (this.phase !== 'fight') {
            this.player?.setVelocity(0, 0);
            return;
        }

        this.pendulum.tick(delta);
        this.updateMoodPresentation();

        // ── Movement (same controls as the overworld) ─────────────────────
        if (!this.joystick) {
            this.joystick = (this.registry.get('vjoy') as typeof this.joystick) ?? null;
        }
        InputBus.update(this.joystick, this.buildMergedCursors());
        const vx = (InputBus.isActive(Action.MOVE_LEFT) ? -1 : 0) + (InputBus.isActive(Action.MOVE_RIGHT) ? 1 : 0);
        const vy = (InputBus.isActive(Action.MOVE_UP) ? -1 : 0) + (InputBus.isActive(Action.MOVE_DOWN) ? 1 : 0);
        const norm = vx !== 0 && vy !== 0 ? Math.SQRT1_2 : 1;
        this.player.setVelocity(vx * PLAYER_SPEED * norm, vy * PLAYER_SPEED * norm);
        if (vx !== 0 || vy !== 0) {
            const dir = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 'left' : 'right') : (vy < 0 ? 'up' : 'down');
            this.player.anims.play(`player_${dir}`, true);
        } else {
            this.player.anims.stop();
            this.player.setFrame(2); // idle facing up (boss is above)
        }

        // ── Whack poll ────────────────────────────────────────────────────
        if (InputBus.isActive(Action.WHACK)) {
            InputBus.setAction(Action.WHACK, false);
            this.tryWhack();
        }

        // ── Lure contact ──────────────────────────────────────────────────
        const now = this.time.now;
        for (const lure of [...this.lures]) {
            if (!lure.active) continue;
            const d = Phaser.Math.Distance.Between(lure.x, lure.y, this.player.x, this.player.y);
            if (d < 24 && now >= this.invincibleUntil) {
                this.destroyLure(lure, true);
                this.loseComposure(t('boss.boughtHigh'));
            }
        }
    }

    private updateMoodPresentation(): void {
        const mood = this.pendulum.mood;
        const state = this.pendulum.state;

        // meter knob position
        const mx = this.meterKnob.getData('meterX') as number;
        const mw = this.meterKnob.getData('meterW') as number;
        this.meterKnob.x = mx + ((mood + 1) / 2) * mw;

        // backdrop tint drifts with mood (green greed ↔ red panic)
        this.tintRect.setFillStyle(mood < 0 ? 0x44aa66 : 0xaa4444);
        this.tintRect.setAlpha(0.05 + Math.abs(mood) * 0.08);

        if (state !== this.prevMoodState) {
            this.prevMoodState = state;
            this.strikeText.setVisible(state === 'panic');
            // baseline scale is 2 (32×48 texture shown at 64×96)
            if (state === 'panic') {
                this.bossSprite.setTexture('boss_mr_market_panic').setTint(0xffb0b0);
                this.tweens.add({ targets: this.bossSprite, scaleX: 1.6, scaleY: 1.6, duration: 250 });
                this.showTaunt();
            } else if (state === 'greed') {
                this.bossSprite.setTexture('boss_mr_market_greed').setTint(0xb8ffc8);
                this.tweens.add({ targets: this.bossSprite, scaleX: 2.6, scaleY: 2.6, duration: 250 });
                this.showTaunt();
            } else {
                this.bossSprite.clearTint();
                this.tweens.add({ targets: this.bossSprite, scaleX: 2, scaleY: 2, duration: 250 });
            }
        }
        // nervous jitter grows with panic
        if (state === 'panic') {
            this.bossSprite.x = BOSS_X + Math.sin(this.time.now / 40) * 3;
        } else {
            this.bossSprite.x = BOSS_X;
        }
    }

    // ── Whacking ──────────────────────────────────────────────────────────

    private tryWhack(): void {
        if (this.whackCooldown) return;
        this.whackCooldown = true;
        this.time.delayedCall(WHACK_COOLDOWN, () => { this.whackCooldown = false; });

        // swing overlay toward the boss
        const angle = Math.atan2(BOSS_Y - this.player.y, BOSS_X - this.player.x);
        const swing = this.add.sprite(
            this.player.x + Math.cos(angle) * 22,
            this.player.y + Math.sin(angle) * 22,
            'newspaper_swing',
        ).setFlipX(Math.cos(angle) < 0).setDepth(5);
        swing.play('newspaper_swing_anim');
        swing.on('animationcomplete', () => swing.destroy());
        AudioService.playSfx(this, 'whack');

        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, BOSS_X, BOSS_Y + 20);
        if (dist > STRIKE_RANGE) return;   // whiff — no reach

        if (this.pendulum.canStrike()) {
            this.landHit();
        } else if (this.pendulum.state === 'greed') {
            // bought high — punished
            this.loseComposure(t('boss.boughtHigh'));
        }
        // neutral: bounces off, nothing happens
    }

    private landHit(): void {
        this.hits += 1;
        AudioService.playSfx(this, 'boss_hit');
        this.cameras.main.shake(100, 0.008);
        this.hitPips[this.hits - 1]?.setFillStyle(0x00ff88);
        this.floatLabel(BOSS_X, BOSS_Y - 60, t('boss.hitLanded'), '#00ff88');
        // white impact flash — Phaser 4 splits tint color and mode
        this.bossSprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
        this.time.delayedCall(90, () => {
            this.bossSprite.setTintMode(Phaser.TintModes.MULTIPLY);
            if (this.pendulum.state === 'panic') this.bossSprite.setTint(0xffb0b0);
            else this.bossSprite.clearTint();
        });
        this.pendulum.speedUp();
        if (this.hits >= HITS_TO_WIN) this.win();
    }

    private loseComposure(label: string): void {
        if (this.time.now < this.invincibleUntil || this.phase !== 'fight') return;
        this.invincibleUntil = this.time.now + IFRAME_MS;
        this.composure -= 1;
        AudioService.playSfx(this, 'hurt');
        this.cameras.main.shake(120, 0.006);
        this.hearts[this.composure]?.setAlpha(0.2);
        this.floatLabel(this.player.x, this.player.y - 30, label, '#ff4444');
        this.tweens.add({ targets: this.player, alpha: 0.2, duration: 90, yoyo: true, repeat: 4 });
        if (this.composure <= 0) this.shakenOut();
    }

    // ── FOMO lures ────────────────────────────────────────────────────────

    private spawnLure(): void {
        if (this.phase !== 'fight' || this.pendulum.state !== 'greed') return;
        const lure = this.physics.add.image(
            BOSS_X + (this.lures.length % 2 === 0 ? -30 : 30), BOSS_Y + 30, 'coin');
        lure.setScale(1.6).setDepth(3).setTint(0xffe28a);
        (lure.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        const angle = Math.atan2(this.player.y - lure.y, this.player.x - lure.x);
        lure.setVelocity(Math.cos(angle) * LURE_SPEED, Math.sin(angle) * LURE_SPEED);
        // shiny pulse — irresistible-looking
        this.tweens.add({ targets: lure, scaleX: 2, scaleY: 2, duration: 240, yoyo: true, repeat: -1 });
        this.lures.push(lure);
        this.time.delayedCall(LURE_LIFE_MS, () => this.destroyLure(lure, false));
    }

    private destroyLure(lure: Phaser.Physics.Arcade.Image, popped: boolean): void {
        if (!lure.active) return;
        this.lures = this.lures.filter(l => l !== lure);
        if (popped) {
            lure.destroy();
        } else {
            this.tweens.add({
                targets: lure, alpha: 0, duration: 200,
                onComplete: () => lure.destroy(),
            });
        }
    }

    private clearLures(): void {
        for (const lure of [...this.lures]) { if (lure.active) lure.destroy(); }
        this.lures = [];
    }

    // ── Outcomes ──────────────────────────────────────────────────────────

    private shakenOut(): void {
        this.phase = 'shaken';
        this.clearLures();
        this.player.setVelocity(0, 0);

        const cx = this.scale.width / 2;
        const panel = this.add.rectangle(0, 0, 480, 854, 0x1a1a2e, 0.9).setOrigin(0, 0).setDepth(10);
        const title = this.add.text(cx, 380, t('boss.shakenOut'), {
            fontSize: '24px', color: '#ff4444',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setDepth(11);
        const lesson = this.add.text(cx, 440, t('boss.shakenLesson'), {
            fontSize: '8px', color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
            align: 'center', lineSpacing: 6,
        }).setOrigin(0.5).setDepth(11);

        this.time.delayedCall(2200, () => {
            panel.destroy(); title.destroy(); lesson.destroy();
            // fresh, fair retry — no coin loss, full composure, slow pendulum
            this.hits = 0;
            this.composure = MAX_COMPOSURE;
            this.pendulum = new MoodPendulum();
            this.prevMoodState = 'neutral';
            for (const h of this.hearts) h.setAlpha(1);
            for (const p of this.hitPips) p.setFillStyle(0x16213e);
            this.player.setPosition(cx, 640);
            this.phase = 'fight';
        });
    }

    private win(): void {
        this.phase = 'done';
        this.clearLures();
        if (this.lureTimer)  { this.lureTimer.remove();  this.lureTimer = null; }
        if (this.tauntTimer) { this.tauntTimer.remove(); this.tauntTimer = null; }
        this.player.setVelocity(0, 0);
        this.strikeText.setVisible(false);

        AudioService.playSfx(this, 'win');
        this.cameras.main.shake(200, 0.006);

        // the market corrects: Mr. Market deflates
        this.bossSprite.clearTint();
        this.tweens.add({
            targets: this.bossSprite,
            scaleX: 1.2, scaleY: 1.4, y: BOSS_Y + 40, angle: 8,
            duration: 900, ease: 'Quad.easeIn',
        });

        const winFlash = this.add.text(this.scale.width / 2, 427, t('boss.win'), {
            fontSize: '24px', color: '#00ff88',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setDepth(10).setScale(0);
        this.tweens.add({ targets: winFlash, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut' });

        // Pre-generate the share card Blob NOW (iOS: navigator.share must run in
        // the tap's call stack later — the Blob has to be cached before that).
        const wisdomQuote = typeof this.dialogueData['boss_01_wisdom_quote'] === 'string'
            ? (this.dialogueData['boss_01_wisdom_quote'] as string)
            : '';
        void prepareShareCard(this.game, wisdomQuote);

        // patienceBonus = composure kept (1-3) — patience literally paid
        const patienceBonus = Math.max(1, this.composure);
        this.time.delayedCall(1400, () => {
            GameEvents.emit(Events.BOSS_DEFEATED, { patienceBonus });
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private floatLabel(x: number, y: number, text: string, color: string): void {
        const label = this.add.text(x, y, text, {
            fontSize: '10px', color,
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setDepth(8);
        this.tweens.add({
            targets: label, y: y - 30, alpha: 0, duration: 800, ease: 'Quad.easeOut',
            onComplete: () => label.destroy(),
        });
    }

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
        if (this.lureTimer)  { this.lureTimer.remove();  this.lureTimer = null; }
        if (this.tauntTimer) { this.tauntTimer.remove(); this.tauntTimer = null; }
        this.clearLures();
        this.input.keyboard?.removeAllListeners();
        this.input.off('pointerdown');
    }
}
