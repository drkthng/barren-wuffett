/**
 * PaperThrowScene — paper-route mini-game stub
 *
 * Registered stub: exists so main.ts registration is complete.
 * Full implementation in Plan 02-02.
 *
 * Pattern: PATTERNS.md PaperThrowScene.ts (MainMenu.ts analog)
 * plan 02 — full mini-game mechanics wired in plan 02-02
 */
import { Scene } from 'phaser';
import { t } from '../../../services/i18n';

export class PaperThrowScene extends Scene {
    constructor() {
        super('PaperThrowScene');
    }

    create(): void {
        const cx = this.scale.width / 2;

        // PAPER ROUTE! title — plan 02 seam
        this.add.text(cx, 427, t('minigame.paperThrow.title'), {
            fontSize: '24px',
            color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5);
    }
}
