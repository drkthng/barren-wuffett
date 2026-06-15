/**
 * Wave 0: Coins HUD — coin-delta math (L1E-02)
 *
 * Tests the pure coin-delta math that the COINS_CHANGED event will carry.
 * No Phaser, no GameEvents import — purely the arithmetic behind the snowball counter.
 *
 * The live GameEvents.emit(Events.COINS_CHANGED, coins) wiring is integration-verified
 * in Slice 1 (Plan 02) once OverworldScene wires the economy seams.
 *
 * Automated proxy for:
 *   L1E-02: COINS_CHANGED emitted whenever OverworldScene.coins changes; value matches
 *   D-08:   coin counter (snowball) increments by the earned amount; fee deduction
 *           produces Math.max(0, coins - fee) (never negative)
 *
 * vitest environment: node — no Phaser dependency.
 *
 * Pattern: PATTERNS.md coins-hud.test.ts (analog: input-bus.test.ts)
 */
import { describe, it, expect } from 'vitest';

// Inline pure helpers mirroring what OverworldScene.update() will compute
// before emitting COINS_CHANGED. These are not imported from a module because
// the OverworldScene inline expressions are trivial — the test pins the contract.

/** Snowball accumulation: add earned coins to the running total. */
function addCoins(current: number, earned: number): number {
    return current + earned;
}

/** Hospital fee deduction: clamp to 0 so coins never go negative. */
function deductFee(current: number, fee: number): number {
    return Math.max(0, current - fee);
}

/** Delta for the "+N" float UI (only shown when positive). */
function coinDelta(next: number, prev: number): number {
    return next - prev;
}

describe('Coins HUD — snowball accumulation math', () => {
    it('earning 3 coins on top of 5 gives 8 (+3 delta)', () => {
        const prev = 5;
        const next = addCoins(prev, 3);
        expect(next).toBe(8);
        expect(coinDelta(next, prev)).toBe(3);
    });

    it('earning 0 coins produces no delta (no +N float emitted)', () => {
        const prev = 5;
        const next = addCoins(prev, 0);
        expect(next).toBe(5);
        expect(coinDelta(next, prev)).toBe(0);
    });

    it('consecutive pickups compound correctly (snowball test)', () => {
        let coins = 0;
        coins = addCoins(coins, 1);  // slot 0
        coins = addCoins(coins, 0);  // slot 1 (nothing)
        coins = addCoins(coins, 1);  // slot 2
        coins = addCoins(coins, 3);  // slot 3
        coins = addCoins(coins, 1);  // slot 4
        // (slot 5 = snack, coins=0)
        coins = addCoins(coins, 1);  // slot 6
        coins = addCoins(coins, 5);  // slot 7
        expect(coins).toBe(12);  // matches the PACK_SLOTS sum
    });
});

describe('Coins HUD — fee deduction math', () => {
    it('standard fee deduction: 15 coins - 5 fee = 10', () => {
        expect(deductFee(15, 5)).toBe(10);
    });

    it('fee larger than coins clamps to 0 (never negative)', () => {
        expect(deductFee(3, 5)).toBe(0);
    });

    it('fee=0 (helmet waiver) leaves coins unchanged', () => {
        expect(deductFee(12, 0)).toBe(12);
    });

    it('deduction produces negative delta (for streak reset UI logic)', () => {
        const prev = 15;
        const next = deductFee(prev, 5);
        expect(coinDelta(next, prev)).toBe(-5);
    });
});
