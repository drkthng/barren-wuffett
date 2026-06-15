/**
 * Wave 0: Shop economy — purchase validation + snack no-persist (L1E-04)
 *
 * Tests applyPurchase against the pure seam src/systems/Economy.ts — automated proxy for:
 *   L1E-04: SHOP_PURCHASE rejected when coins < price
 *   L1E-04: permanent upgrade flags persist (newFlags contains itemId=true)
 *   L1E-04: already-owned item rejected
 *   D-13:   purchase validation
 *   D-15:   snack is consumable — never flagged as owned
 *
 * vitest environment: node — no Phaser dependency (Economy is pure TS).
 *
 * Pattern: PATTERNS.md shop-economy.test.ts (analog: input-bus.test.ts)
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Economy — applyPurchase', () => {
    beforeEach(() => { vi.resetModules(); });
    afterEach(()  => { vi.resetModules(); });

    it('returns null when coins < price (insufficient funds)', async () => {
        const { applyPurchase } = await import('../src/systems/Economy.js');
        expect(applyPurchase(10, {}, 'upgrade_newspaper', 20)).toBeNull();
    });

    it('returns {newCoins, newFlags} with flag set when coins >= price', async () => {
        const { applyPurchase } = await import('../src/systems/Economy.js');
        expect(applyPurchase(25, {}, 'upgrade_newspaper', 20)).toEqual({
            newCoins: 5,
            newFlags: { upgrade_newspaper: true },
        });
    });

    it('returns null when upgrade already owned (no double-buy)', async () => {
        const { applyPurchase } = await import('../src/systems/Economy.js');
        expect(
            applyPurchase(25, { upgrade_newspaper: true }, 'upgrade_newspaper', 20)
        ).toBeNull();
    });

    it('snack purchase: returns newFlags={} (snack never sets a flag)', async () => {
        const { applyPurchase } = await import('../src/systems/Economy.js');
        expect(applyPurchase(10, {}, 'snack', 5)).toEqual({
            newCoins: 5,
            newFlags: {},
        });
    });

    it('snack can be bought repeatedly (not blocked by already-owned check)', async () => {
        const { applyPurchase } = await import('../src/systems/Economy.js');
        // First snack purchase
        const r1 = applyPurchase(10, {}, 'snack', 5);
        expect(r1).not.toBeNull();
        // Second snack purchase from the resulting flags (still empty)
        const r2 = applyPurchase(r1!.newCoins, r1!.newFlags, 'snack', 5);
        expect(r2).not.toBeNull();
        expect(r2!.newCoins).toBe(0);
    });

    it('returned newFlags is a new object (does not mutate input flags)', async () => {
        const { applyPurchase } = await import('../src/systems/Economy.js');
        const inputFlags = {};
        const result = applyPurchase(25, inputFlags, 'upgrade_newspaper', 20);
        expect(result).not.toBeNull();
        expect(result!.newFlags).not.toBe(inputFlags);  // different reference
        expect(inputFlags).toEqual({});                  // original untouched
    });
});
