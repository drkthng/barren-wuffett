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
 * INPUT NOTE (UAT fix): interactive hit targets are transparent Rectangle zones added
 * DIRECTLY to the scene (NOT nested inside a Container) — Phaser 4 does not reliably
 * deliver pointer events to container-nested Text with a custom hitArea. The visible
 * label Text stays purely cosmetic; a sibling Rectangle zone owns the click. This mirrors
 * the OverworldScene NPC tap-zone pattern, which works.
 *
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
const BUY_ZONE_CX = ACTION_X - 28;  // center of the BUY hit zone (covers the BUY label)

export class ShopOverlay {
    private readonly scene: Scene;
    private readonly backdrop: Phaser.GameObjects.Rectangle;
    private readonly panel: Phaser.GameObjects.Container;
    private readonly closeText: Phaser.GameObjects.Text;
    private readonly closeZone: Phaser.GameObjects.Rectangle;
    private readonly notEnoughText: Phaser.GameObjects.Text;
    // All dynamic per-row objects (visuals + interactive zones) — destroyed on each show()/hide().
    // Flat tracking (NOT a container) so interactive zones stay direct scene children.
    private rowObjects: Phaser.GameObjects.GameObject[] = [];
    // Row backgrounds (for shake tween) — index matches item row
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

        // ── Dividers ─────────────────────────────────────────────────────────
        const dividerTop = scene.add.rectangle(PANEL_CX, PANEL_TOP + 72, 280, 1, 0x16213e);
        const dividerBottom = scene.add.rectangle(PANEL_CX, PANEL_TOP + 288, 280, 1, 0x16213e);

        // ── CLOSE label (cosmetic) — input is owned by closeZone below ────────
        const closeY = PANEL_TOP + 320;
        this.closeText = scene.add.text(PANEL_CX, closeY, t('shop.close'), {
            fontSize: '16px', color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5);

        // Panel container holds the STATIC, NON-interactive visuals only (depth 31).
        this.panel = scene.add.container(0, 0, [
            panelRect, titleText, dividerTop, dividerBottom, this.closeText,
        ]).setDepth(31).setVisible(false);

        // ── CLOSE interactive zone — direct scene child (depth 31), transparent ──
        this.closeZone = scene.add.rectangle(PANEL_CX, closeY, 280, 44, 0x000000, 0)
            .setDepth(31)
            .setVisible(false);
        this.closeZone.on('pointerdown', () => {
            this.closeText.setAlpha(0.7);
            scene.time.delayedCall(100, () => this.closeText.setAlpha(1));
            GameEvents.emit(Events.SHOP_CLOSE);
        });

        // ── "Not enough coins" flash text ─────────────────────────────────────
        this.notEnoughText = scene.add.text(PANEL_CX, 625, t('shop.notEnoughCoins'), {
            fontSize: '8px', color: '#ff4444',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setVisible(false).setDepth(33);
    }

    /**
     * Show (or refresh) the shop panel with current coins/flags/items.
     * Safe to call repeatedly — destroys and re-creates item rows each call
     * so the post-purchase refresh path works without rebuilding the whole panel.
     */
    show(coins: number, flags: Record<string, boolean>, items: ShopItem[]): void {
        this.destroyRows();

        const add = this.scene.add;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const rowY = ROW_YS[i] ?? (ROW_YS[ROW_YS.length - 1]! + (i - (ROW_YS.length - 1)) * 48);

            const isOwned      = !item.consumable && !!flags[item.itemId];
            const isAffordable = coins >= item.price;

            // Row background (transparent, shake anchor)
            const rowBg = add.rectangle(PANEL_CX, rowY, 280, 44, 0x000000, 0).setDepth(32);
            this.rowRects.push(rowBg);
            this.rowObjects.push(rowBg);

            // Icon (16×16) — placeholder-safe
            let iconObj: Phaser.GameObjects.Image;
            try {
                iconObj = add.image(168, rowY, item.iconKey).setDisplaySize(16, 16).setDepth(32);
            } catch {
                iconObj = add.image(168, rowY, '__DEFAULT').setDisplaySize(16, 16).setDepth(32);
            }
            this.rowObjects.push(iconObj);

            const nameText = add.text(TEXT_X, rowY, t(item.nameKey), {
                fontSize: '8px', color: '#e8e8e8',
                fontFamily: '"Press Start 2P", monospace',
            }).setOrigin(0, 0.5).setDepth(32);
            const descText = add.text(TEXT_X, rowY + 10, t(item.descKey), {
                fontSize: '6px', color: '#888888',
                fontFamily: '"Press Start 2P", monospace',
            }).setOrigin(0, 0.5).setDepth(32);
            this.rowObjects.push(nameText, descText);

            if (isOwned) {
                const ownedText = add.text(ACTION_X, rowY, t('shop.owned'), {
                    fontSize: '8px', color: '#e8e8e8',
                    fontFamily: '"Press Start 2P", monospace',
                }).setOrigin(1, 0.5).setDepth(32).setAlpha(0.9);
                this.rowObjects.push(ownedText);
                continue;
            }

            // Price + coin glyph
            const priceColor = isAffordable ? '#f5c842' : '#ff4444';
            const priceText = add.text(ACTION_X - 56, rowY, `${item.price}`, {
                fontSize: '8px', color: priceColor,
                fontFamily: '"Press Start 2P", monospace',
            }).setOrigin(0, 0.5).setDepth(32);
            const coinIcon = add.text(ACTION_X - 70, rowY, '¢', {
                fontSize: '8px', color: priceColor,
                fontFamily: '"Press Start 2P", monospace',
            }).setOrigin(0, 0.5).setDepth(32);

            // BUY label (cosmetic)
            const buyColor = isAffordable ? '#00ff88' : '#e8e8e8';
            const buyAlpha = isAffordable ? 1.0 : 0.5;
            const buyText = add.text(ACTION_X, rowY, t('shop.buy'), {
                fontSize: '8px', color: buyColor,
                fontFamily: '"Press Start 2P", monospace',
            }).setOrigin(1, 0.5).setDepth(32).setAlpha(buyAlpha);

            // Unaffordable row dimming (UI-SPEC)
            const rowAlpha = isAffordable ? 1.0 : 0.7;
            for (const o of [rowBg, iconObj, nameText, descText, priceText, coinIcon]) o.setAlpha(rowAlpha);

            this.rowObjects.push(priceText, coinIcon, buyText);

            // BUY interactive zone — a TRANSPARENT Rectangle added directly to the scene
            // (NOT in a container). A Rectangle's own geometry is its hit area, so this is
            // reliable in Phaser 4 where container-nested Text hitAreas are not.
            const buyZone = add.rectangle(BUY_ZONE_CX, rowY, 96, 40, 0x000000, 0)
                .setDepth(33)
                .setInteractive({ useHandCursor: true });
            const capturedItem = item;
            const capturedIndex = i;
            buyZone.on('pointerdown', () => {
                buyText.setAlpha(0.7);
                this.scene.time.delayedCall(100, () => buyText.setAlpha(buyAlpha));
                if (coins < capturedItem.price) {
                    this.flashNotEnoughCoins(capturedIndex);
                    return;
                }
                GameEvents.emit(Events.SHOP_PURCHASE, {
                    itemId: capturedItem.itemId,
                    price: capturedItem.price,
                });
            });
            this.rowObjects.push(buyZone);
        }

        this.backdrop.setVisible(true);
        this.panel.setVisible(true);
        this.closeText.setAlpha(1);
        this.closeZone.setVisible(true).setInteractive({ useHandCursor: true });
    }

    /** Hide the shop panel. */
    hide(): void {
        this.backdrop.setVisible(false);
        this.panel.setVisible(false);
        this.notEnoughText.setVisible(false);
        this.closeZone.setVisible(false).disableInteractive();
        this.destroyRows();
    }

    /** Destroy all dynamic per-row objects (visuals + interactive zones). */
    private destroyRows(): void {
        for (const o of this.rowObjects) o.destroy();
        this.rowObjects = [];
        this.rowRects = [];
    }

    /** Flash "NOT ENOUGH COINS" below panel + shake the affected row (UI-SPEC §4). */
    private flashNotEnoughCoins(rowIndex: number): void {
        this.notEnoughText.setVisible(true).setAlpha(1);
        this.scene.tweens.add({
            targets: this.notEnoughText,
            alpha: 0, delay: 600, duration: 200,
            onComplete: () => { this.notEnoughText.setVisible(false).setAlpha(1); },
        });

        const rowBg = this.rowRects[rowIndex];
        if (rowBg) {
            const origX = rowBg.x;
            this.scene.tweens.add({
                targets: rowBg,
                x: { from: origX - 4, to: origX + 4 },
                duration: 80, yoyo: true, repeat: 2,
                onComplete: () => { rowBg.setX(origX); },
            });
        }
    }
}
