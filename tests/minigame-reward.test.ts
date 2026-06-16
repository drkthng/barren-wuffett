/**
 * Regression guard: paper-route COINS_CHANGED emit (Phase 3, L1-PAPERROUTE-COINS)
 *
 * Tests computeMinigameReward and awardMinigameCoins against the pure seam
 * src/systems/Economy.ts — automated proxy for:
 *   L1-PAPERROUTE-COINS: completing PaperThrowScene emits COINS_CHANGED so HUD updates
 *   computeMinigameReward: reward formula is score*2 + perfect*3
 *   awardMinigameCoins: injected emitter is called EXACTLY ONCE with the new total
 *
 * REGRESSION GUARD: if someone drops the onCoinsChanged call again, the spy assertions
 * in this file will fail immediately — no manual playtesting required to catch it.
 *
 * vitest environment: node — no Phaser dependency (Economy is pure TS).
 *
 * Pattern: tests/shop-economy.test.ts (analog: same module, same import convention)
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Economy — computeMinigameReward', () => {
    beforeEach(() => { vi.resetModules(); });
    afterEach(()  => { vi.resetModules(); });

    it('(5, 0) → 10 (5 deliveries, no perfect)', async () => {
        const { computeMinigameReward } = await import('../src/systems/Economy.js');
        expect(computeMinigameReward(5, 0)).toBe(10);
    });

    it('(5, 5) → 25 (5 deliveries + 5 perfect)', async () => {
        const { computeMinigameReward } = await import('../src/systems/Economy.js');
        expect(computeMinigameReward(5, 5)).toBe(25);
    });

    it('(3, 1) → 9 (3*2 + 1*3)', async () => {
        const { computeMinigameReward } = await import('../src/systems/Economy.js');
        expect(computeMinigameReward(3, 1)).toBe(9);
    });

    it('(0, 0) → 0 (no deliveries, no perfect)', async () => {
        const { computeMinigameReward } = await import('../src/systems/Economy.js');
        expect(computeMinigameReward(0, 0)).toBe(0);
    });
});

describe('Economy — awardMinigameCoins', () => {
    beforeEach(() => { vi.resetModules(); });
    afterEach(()  => { vi.resetModules(); });

    it('returns the correct new total (coins + earned)', async () => {
        const { awardMinigameCoins } = await import('../src/systems/Economy.js');
        // 5 existing + (3*2 + 1*3 = 9) earned = 14
        expect(awardMinigameCoins(5, { score: 3, perfect: 1 }, () => {})).toBe(14);
    });

    it('REGRESSION GUARD: calls injected emitter EXACTLY ONCE with the new total', async () => {
        const { awardMinigameCoins } = await import('../src/systems/Economy.js');
        const spy = vi.fn();
        awardMinigameCoins(5, { score: 3, perfect: 1 }, spy);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(14);
    });

    it('REGRESSION GUARD (zero-earn): still calls emitter when earned === 0', async () => {
        const { awardMinigameCoins } = await import('../src/systems/Economy.js');
        const spy = vi.fn();
        const result = awardMinigameCoins(7, { score: 0, perfect: 0 }, spy);
        // coins unchanged but HUD must still be told the current value
        expect(result).toBe(7);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(7);
    });
});
