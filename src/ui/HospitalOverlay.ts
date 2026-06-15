/**
 * HospitalOverlay — WAKE UP IN HOSPITAL splash panel (UIScene state HOSPITAL)
 *
 * A cozy, non-punitive gag panel shown after a dog bite + knockback.
 * Never shows a skull, GAME OVER, or red full-screen flash (L1E-03 acceptance).
 *
 * Pattern: UIScene.buildPauseOverlay() (backdrop + panel container)
 * Per UI-SPEC §5 + Copywriting Contract (hospital.* keys, D-18/INFR-05)
 *
 * Lifecycle:
 *   show(fee, helmetOwned) — called by UIScene.onPlayerHospitalized, scales panel in
 *   hide()                 — called by UIScene.setState() when leaving HOSPITAL state
 */
import Phaser, { Scene } from 'phaser';
import { t } from '../services/i18n';

export class HospitalOverlay {
    private readonly backdrop: Phaser.GameObjects.Rectangle;
    private readonly panel: Phaser.GameObjects.Container;
    private readonly feeText: Phaser.GameObjects.Text;
    private readonly scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;

        // Full-canvas #000 backdrop at alpha 0.6 (same as pause backdrop)
        this.backdrop = scene.add.rectangle(0, 0, 480, 854, 0x000000, 0.6)
            .setOrigin(0, 0)
            .setDepth(30)
            .setVisible(false);

        // Panel: 360×220 centered at (240, 427) — UI-SPEC §5 geometry
        const panelRect = scene.add.rectangle(240, 427, 360, 220, 0x1a1a2e)
            .setStrokeStyle(2, 0xe8e8e8);

        // Heading: "WAKE UP IN HOSPITAL!" — Display 24px, word-wrap 280px, y=349
        const headingText = scene.add.text(240, 349,
            t('hospital.heading'),
            {
                fontSize: '24px',
                color: '#e8e8e8',
                fontFamily: '"Press Start 2P", monospace',
                wordWrap: { width: 280, useAdvancedWrap: true },
                align: 'center',
            }
        ).setOrigin(0.5, 0).setDepth(32);

        // Fee line — color and content set dynamically in show() (UI-SPEC §5 fee logic)
        this.feeText = scene.add.text(240, 405,
            '',
            {
                fontSize: '8px',
                color: '#ff4444',
                fontFamily: '"Press Start 2P", monospace',
                align: 'center',
            }
        ).setOrigin(0.5).setDepth(32);

        // Dismiss hint: "TAP OR WAIT TO CONTINUE" — Label 8px, alpha 0.6
        const hintText = scene.add.text(240, 433,
            t('hospital.dismiss'),
            {
                fontSize: '8px',
                color: '#e8e8e8',
                fontFamily: '"Press Start 2P", monospace',
                align: 'center',
            }
        ).setOrigin(0.5).setAlpha(0.6).setDepth(32);

        // Panel container — depth 31 so it sits above backdrop (30) but below texts (32)
        this.panel = scene.add.container(0, 0, [panelRect])
            .setDepth(31)
            .setVisible(false);

        // Texts are separate (not in container) so their setDepth(32) is respected
        // Container holds the background panel rect; texts positioned absolutely
        void headingText;
        void hintText;

        // Store text refs on panel userData for hide/show toggling
        this.panel.setData('headingText', headingText);
        this.panel.setData('hintText', hintText);
    }

    /**
     * Show the hospital splash.
     * Fee-line logic per UI-SPEC §5 (CR-02 — explicit partial-balance branch):
     *   - helmet owned       → "HELMET BLOCKED THE FEE!" in #00ff88
     *   - fee 0 (broke)      → "HOSPITAL FEE: -0 COINS (BROKE!)" in #ff4444
     *   - 0 < fee < 5 (partial, player zeroed out) → "...(CLEANED OUT!)" in #ff4444
     *   - fee ≥ 5            → "HOSPITAL FEE: -5 COINS" in #ff4444
     *
     * `fee` is the LIVE amount actually deducted (re-clamped against the player's
     * balance in OverworldScene.completeHospital), so a 1–4 coin player shows the
     * true deduction with a "cleaned out" tag rather than a misleading bare number.
     */
    show(fee: number, helmetOwned: boolean): void {
        if (helmetOwned) {
            this.feeText.setText(t('hospital.helmetBlocked'));
            this.feeText.setColor('#00ff88');
        } else if (fee === 0) {
            this.feeText.setText(t('hospital.feeLow'));
            this.feeText.setColor('#ff4444');
        } else if (fee < 5) {
            this.feeText.setText(t('hospital.feePartial').replace('{n}', String(fee)));
            this.feeText.setColor('#ff4444');
        } else {
            this.feeText.setText(t('hospital.fee').replace('{n}', String(fee)));
            this.feeText.setColor('#ff4444');
        }

        this.backdrop.setVisible(true);
        this.feeText.setVisible(true);
        this.panel.setVisible(true);

        // Show texts
        const headingText = this.panel.getData('headingText') as Phaser.GameObjects.Text | undefined;
        const hintText = this.panel.getData('hintText') as Phaser.GameObjects.Text | undefined;
        if (headingText) headingText.setVisible(true);
        if (hintText) hintText.setVisible(true);

        // Scale-in: 0.7 → 1.0 over 200ms, Back.Out easing (UI-SPEC §5)
        this.panel.setScale(0.7);
        this.scene.tweens.add({
            targets: this.panel,
            scaleX: 1,
            scaleY: 1,
            duration: 200,
            ease: 'Back.Out',
        });
    }

    /** Hide all elements of the overlay. */
    hide(): void {
        this.backdrop.setVisible(false);
        this.feeText.setVisible(false);
        this.panel.setVisible(false);

        const headingText = this.panel.getData('headingText') as Phaser.GameObjects.Text | undefined;
        const hintText = this.panel.getData('hintText') as Phaser.GameObjects.Text | undefined;
        if (headingText) headingText.setVisible(false);
        if (hintText) hintText.setVisible(false);
    }
}
