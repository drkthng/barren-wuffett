/**
 * BossScene — Mr. Market boss fight stub
 *
 * Registered stub: exists so main.ts registration is complete.
 * Full implementation in Plan 02-02 (boss fight mechanics).
 *
 * Pattern: PATTERNS.md BossScene.ts (MainMenu.ts analog)
 * plan 02 — full boss UI/mechanics wired in plan 02-02
 */
import { Scene } from 'phaser';
import { t } from '../../services/i18n';

export class BossScene extends Scene {
    constructor() {
        super('BossScene');
    }

    create(): void {
        const cx = this.scale.width / 2;

        // Background tint (greed phase default)
        const tintRect = this.add.rectangle(0, 0, 480, 854, 0xff4444)
            .setOrigin(0, 0)
            .setAlpha(0)
            .setDepth(0);
        this.tweens.add({ targets: tintRect, alpha: 0.15, duration: 500 });

        // MR. MARKET name label — plan 02 seam
        this.add.text(cx, 427, t('boss.mrMarket.name'), {
            fontSize: '24px',
            color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5);
    }
}
