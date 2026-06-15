/**
 * ShopOverlay — UIScene SHOP panel (Phase 3, L1E-04 / D-13, D-14, D-15)
 *
 * A plain-TS class owned by UIScene (same ownership pattern as HUD and DialogueBox).
 * Renders a 320×380 panel with 4 item rows and a CLOSE button.
 *
 * Key contracts:
 *   - show(coins, flags, items): renders rows with affordability/ownership states.
 *     Safe to call repeatedly — re-renders rows in place (post-purchase refresh).
 *   - hide(): hides backdrop + panel.
 *   - BUY tap emits SHOP_PURCHASE; if not affordable, flashes "NOT ENOUGH COINS" + shakes row.
 *   - CLOSE tap emits SHOP_CLOSE.
 *   - The overlay NEVER stores coin state — it reads from the show() payload only (Pitfall 3).
 *
 * Pattern: buildPauseOverlay() analog (UIScene.ts lines 135-232)
 * UI-SPEC: §4 SHOP overlay layout
 */
import Phaser, { Scene } from 'phaser';
import { t } from '../services/i18n';
import { GameEvents, Events } from '../events/GameEvents';
import type { ShopItem } from '../data/levels/level-01-economy';

// Panel geometry (UI-SPEC §4)
const PANEL_CX = 240;
const PANEL_CY = 427;
const PANEL_W  = 320;
const PANEL_H  = 380;
const PANEL_TOP = PANEL_CY - PANEL_H / 2;  // 237

// Row Y positions (UI-SPEC §4 panel layout)
const ROW_YS = [325, 373, 421, 469];
// Action/price X reference (world pixel coords)
const TEXT_X   = 192;  // icon (at 168) right + 8px gap
const ACTION_X = 384;  // panel right (240+160) - 16px padding

export class ShopOverlay {
    private readonly scene: Scene;
    private readonly backdrop: Phaser.GameObjects.Rectangle;
    private readonly panel: Phaser.GameObjects.Container;
    private readonly notEnoughText: Phaser.GameObjects.Text;
    // Per-row containers — rebuilt on each show() call
    private rowContainers: Phaser.GameObjects.Container[] = [];
    // Rows reference (for shake tween) — index matches item row
    private rowRects: Phaser.GameObjects.Rectangle[] = [];

    constructor(scene: Scene) {
        this.scene = scene;

        // ── Full-canvas backdrop (#000, alpha 0.6, depth 30) ────────────────
        this.backdrop = scene.add.rectangle(0, 0, 480, 854, 0x000000, 0.6)
            .setOrigin(0, 0)
            .setDepth(30)
            .setVisible(false);

        // ── Panel: 320×380 at (240,427), fill #1a1a2e, stroke #e8e8e8 2px ──
        const panelRect = scene.add.rectangle(PANEL_CX, PANEL_CY, PANEL_W, PANEL_H, 0x1a1a2e)
            .setStrokeStyle(2, 0xe8e8e8);

        // ── SHOP title ───────────────────────────────────────────────────────
        const titleText = scene.add.text(PANEL_CX, PANEL_TOP + 24, t('shop.title'), {
            fontSize: '24px', color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5, 0);

        // ── Top divider ──────────────────────────────────────────────────────
        const dividerTop = scene.add.rectangle(PANEL_CX, PANEL_TOP + 72, 280, 1, 0x16213e);

        // ── Bottom divider ───────────────────────────────────────────────────
        const dividerBottom = scene.add.rectangle(PANEL_CX, PANEL_TOP + 288, 280, 1, 0x16213e);

        // ── CLOSE button ─────────────────────────────────────────────────────
        // y = PANEL_TOP + 288 + 32 = 557 (UI-SPEC §4)
        const closeY = PANEL_TOP + 320;
        const closeText = scene.add.text(PANEL_CX, closeY, t('shop.close'), {
            fontSize: '16px', color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setInteractive(
            new Phaser.Geom.Rectangle(-140, -22, 280, 44),
            Phaser.Geom.Rectangle.Contains,
        );
        closeText.on('pointerdown', () => {
            closeText.setAlpha(0.7);
            scene.time.delayedCall(100, () => closeText.setAlpha(1));
            GameEvents.emit(Events.SHOP_CLOSE);
        });

        // ── "Not enough coins" flash text ─────────────────────────────────────
        // y=625 (UI-SPEC §4: below the panel at y=617+8)
        this.notEnoughText = scene.add.text(PANEL_CX, 625, t('shop.notEnoughCoins'), {
            fontSize: '8px', color: '#ff4444',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setVisible(false).setDepth(33);

        // ── Panel container (depth 31) ────────────────────────────────────────
        this.panel = scene.add.container(0, 0, [
            panelRect, titleText, dividerTop, dividerBottom, closeText,
        ]).setDepth(31).setVisible(false);
    }

    /**
     * Show (or refresh) the shop panel with current coins/flags/items.
     * Safe to call repeatedly — destroys and re-creates item rows each call
     * so the post-purchase refresh path works without rebuilding the whole panel.
     */
    show(coins: number, flags: Record<string, boolean>, items: ShopItem[]): void {
        // Destroy old row containers (so we can re-render with fresh state)
        for (const rc of this.rowContainers) {
            rc.destroy();
        }
        this.rowContainers = [];
        this.rowRects = [];

        // Build item rows
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const rowY = ROW_YS[i] ?? (ROW_YS[ROW_YS.length - 1]! + (i - (ROW_YS.length - 1)) * 48);

            const isOwned       = !item.consumable && !!flags[item.itemId];
            const isAffordable  = coins >= item.price;

            // Row background (transparent, for shake animation anchor)
            const rowBg = this.scene.add.rectangle(PANEL_CX, rowY, 280, 44, 0x000000, 0)
                .setDepth(32);
            this.rowRects.push(rowBg);

            // Icon (16×16)
            let iconObj: Phaser.GameObjects.Image;
            try {
                iconObj = this.scene.add.image(168, rowY, item.iconKey)
                    .setDisplaySize(16, 16)
                    .setDepth(32);
            } catch {
                // Icon texture not loaded — create a colored rect placeholder
                iconObj = this.scene.add.image(168, rowY, '__DEFAULT')
                    .setDisplaySize(16, 16)
                    .setDepth(32);
            }

            // Item name (Heading 16px, #e8e8e8)
            const nameText = this.scene.add.text(TEXT_X, rowY, t(item.nameKey), {
                fontSize: '8px', color: '#e8e8e8',
                fontFamily: '"Press Start 2P", monospace',
            }).setOrigin(0, 0.5).setDepth(32);

            // Description (tiny, below name)
            const descText = this.scene.add.text(TEXT_X, rowY + 10, t(item.descKey), {
                fontSize: '6px', color: '#888888',
                fontFamily: '"Press Start 2P", monospace',
            }).setOrigin(0, 0.5).setDepth(32);

            const rowObjects: Phaser.GameObjects.GameObject[] = [rowBg, iconObj, nameText, descText];

            if (isOwned) {
                // Owned permanent — show OWNED badge, no price
                const ownedText = this.scene.add.text(ACTION_X, rowY, t('shop.owned'), {
                    fontSize: '8px', color: '#e8e8e8',
                    fontFamily: '"Press Start 2P", monospace',
                }).setOrigin(1, 0.5).setDepth(32).setAlpha(0.9);
                rowObjects.push(ownedText);
            } else {
                // Price (coin icon + number)
                const priceColor = isAffordable ? '#f5c842' : '#ff4444';
                const priceText = this.scene.add.text(ACTION_X - 56, rowY, `${item.price}`, {
                    fontSize: '8px', color: priceColor,
                    fontFamily: '"Press Start 2P", monospace',
                }).setOrigin(0, 0.5).setDepth(32);

                // Coin icon (tiny — use coin texture if loaded, else placeholder char)
                const coinIcon = this.scene.add.text(ACTION_X - 70, rowY, '¢', {
                    fontSize: '8px', color: priceColor,
                    fontFamily: '"Press Start 2P", monospace',
                }).setOrigin(0, 0.5).setDepth(32);

                // BUY button
                const buyColor  = isAffordable ? '#00ff88' : '#e8e8e8';
                const buyAlpha  = isAffordable ? 1.0 : 0.5;
                const buyText = this.scene.add.text(ACTION_X, rowY, t('shop.buy'), {
                    fontSize: '8px', color: buyColor,
                    fontFamily: '"Press Start 2P", monospace',
                }).setOrigin(1, 0.5).setDepth(32).setAlpha(buyAlpha);

                // Row alpha for unaffordable state (UI-SPEC)
                const rowAlpha = isAffordable ? 1.0 : 0.7;
                rowBg.setAlpha(rowAlpha);
                iconObj.setAlpha(rowAlpha);
                nameText.setAlpha(rowAlpha);
                descText.setAlpha(rowAlpha);
                priceText.setAlpha(rowAlpha);
                coinIcon.setAlpha(rowAlpha);

                // Make BUY interactive — hit zone covers the right ~100px of the row
                buyText.setInteractive(
                    new Phaser.Geom.Rectangle(-60, -22, 120, 44),
                    Phaser.Geom.Rectangle.Contains,
                );
                const capturedItem = item;
                const capturedIndex = i;
                buyText.on('pointerdown', () => {
                    buyText.setAlpha(0.7);
                    this.scene.time.delayedCall(100, () => buyText.setAlpha(buyAlpha));

                    if (!isAffordable) {
                        // Not enough coins — show feedback, shake row (UI-SPEC §4)
                        this.flashNotEnoughCoins(capturedIndex);
                        return;
                    }
                    GameEvents.emit(Events.SHOP_PURCHASE, {
                        itemId: capturedItem.itemId,
                        price: capturedItem.price,
                    });
                });

                rowObjects.push(priceText, coinIcon, buyText);
            }

            const rowContainer = this.scene.add.container(0, 0, rowObjects).setDepth(32);
            this.rowContainers.push(rowContainer);
        }

        this.backdrop.setVisible(true);
        this.panel.setVisible(true);
    }

    /** Hide the shop panel. */
    hide(): void {
        this.backdrop.setVisible(false);
        this.panel.setVisible(false);
        this.notEnoughText.setVisible(false);
        // Destroy row containers when hiding (cleanup)
        for (const rc of this.rowContainers) {
            rc.destroy();
        }
        this.rowContainers = [];
        this.rowRects = [];
    }

    /** Flash "NOT ENOUGH COINS" below panel + shake the affected row (UI-SPEC §4). */
    private flashNotEnoughCoins(rowIndex: number): void {
        // Flash the text for 800ms
        this.notEnoughText.setVisible(true).setAlpha(1);
        this.scene.tweens.add({
            targets: this.notEnoughText,
            alpha: 0,
            delay: 600,
            duration: 200,
            onComplete: () => { this.notEnoughText.setVisible(false).setAlpha(1); },
        });

        // Shake the row (±4px, 3 cycles, ~80ms per cycle)
        const rowBg = this.rowRects[rowIndex];
        if (rowBg) {
            const origX = rowBg.x;
            this.scene.tweens.add({
                targets: rowBg,
                x: { from: origX - 4, to: origX + 4 },
                duration: 80,
                yoyo: true,
                repeat: 2,
                onComplete: () => { rowBg.setX(origX); },
            });
        }
    }
}
