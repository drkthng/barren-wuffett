/**
 * Wave 0: PrizePack deterministic drop + first-whack guarantee (L1E-02)
 *
 * Tests rollPrizePack and firstWhackOrRoll against the pure seam
 * src/systems/PrizePack.ts — automated proxy for:
 *   L1E-02: deterministic slot advancement, coin sums, drop-chance threshold
 *   D-05:   ALttP 8-slot table, slot advances even on no-drop
 *   D-06:   first-whack guarantee (first_whack_done absent → coin, no slot advance)
 *
 * vitest environment: node — no Phaser dependency (PrizePack is pure TS).
 * rng is injectable for deterministic tests.
 *
 * Pattern: PATTERNS.md prize-pack.test.ts (analog: input-bus.test.ts)
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ── rollPrizePack ────────────────────────────────────────────────────────────

describe('PrizePack — rollPrizePack slot advancement', () => {
    beforeEach(() => { vi.resetModules(); });
    afterEach(()  => { vi.resetModules(); });

    it('slot 0 with rng=0 returns {coins:1,item:null} and advances slotIndex to 1', async () => {
        const { rollPrizePack } = await import('../src/systems/PrizePack.js');
        const state = { slotIndex: 0 };
        const result = rollPrizePack(state, () => 0);
        expect(result).not.toBeNull();
        expect(result?.coins).toBe(1);
        expect(result?.item).toBeNull();
        expect(state.slotIndex).toBe(1);
    });

    it('full 8-roll sweep with rng=0 returns exact PACK_SLOTS sequence and wraps back to 0', async () => {
        const { rollPrizePack, PACK_SLOTS } = await import('../src/systems/PrizePack.js');
        const state = { slotIndex: 0 };
        const results = [];
        for (let i = 0; i < 8; i++) {
            results.push(rollPrizePack(state, () => 0));
        }
        expect(state.slotIndex).toBe(0);  // wrapped back
        for (let i = 0; i < 8; i++) {
            expect(results[i]).toEqual(PACK_SLOTS[i]);
        }
    });

    it('coin sum over the 8 drops equals 12', async () => {
        const { rollPrizePack } = await import('../src/systems/PrizePack.js');
        const state = { slotIndex: 0 };
        let total = 0;
        for (let i = 0; i < 8; i++) {
            const r = rollPrizePack(state, () => 0);
            total += r?.coins ?? 0;
        }
        expect(total).toBe(12);  // 1+0+1+3+1+0+1+5 = 12
    });

    it('rng=0.9 returns null (no-drop) but still advances slotIndex', async () => {
        const { rollPrizePack } = await import('../src/systems/PrizePack.js');
        const state = { slotIndex: 0 };
        const result = rollPrizePack(state, () => 0.9);
        expect(result).toBeNull();
        expect(state.slotIndex).toBe(1);  // slot advanced even on no-drop
    });
});

describe('PrizePack — drop-chance threshold', () => {
    beforeEach(() => { vi.resetModules(); });
    afterEach(()  => { vi.resetModules(); });

    it('rng=0.54 (below 0.55) drops (returns a result)', async () => {
        const { rollPrizePack } = await import('../src/systems/PrizePack.js');
        const state = { slotIndex: 0 };
        const result = rollPrizePack(state, () => 0.54);
        expect(result).not.toBeNull();
    });

    it('rng=0.56 (above 0.55) is null (no-drop)', async () => {
        const { rollPrizePack } = await import('../src/systems/PrizePack.js');
        const state = { slotIndex: 0 };
        const result = rollPrizePack(state, () => 0.56);
        expect(result).toBeNull();
    });
});

// ── firstWhackOrRoll ─────────────────────────────────────────────────────────

describe('PrizePack — firstWhackOrRoll (D-06 first-whack guarantee)', () => {
    beforeEach(() => { vi.resetModules(); });
    afterEach(()  => { vi.resetModules(); });

    it('with first_whack_done absent: returns {coins:1,item:null} regardless of rng', async () => {
        const { firstWhackOrRoll } = await import('../src/systems/PrizePack.js');
        const state = { slotIndex: 0 };
        // rng=0.9 would be a no-drop in rollPrizePack — override must ignore it
        const result = firstWhackOrRoll({}, state, () => 0.9);
        expect(result).toEqual({ coins: 1, item: null });
    });

    it('with first_whack_done absent: does NOT advance slotIndex', async () => {
        const { firstWhackOrRoll } = await import('../src/systems/PrizePack.js');
        const state = { slotIndex: 3 };
        firstWhackOrRoll({}, state, () => 0.9);
        expect(state.slotIndex).toBe(3);  // unchanged
    });

    it('with first_whack_done=true, rng=0: delegates to pack (returns current slot, advances)', async () => {
        const { firstWhackOrRoll } = await import('../src/systems/PrizePack.js');
        const state = { slotIndex: 0 };
        const result = firstWhackOrRoll({ first_whack_done: true }, state, () => 0);
        // slot 0 = { coins: 1, item: null }
        expect(result).toEqual({ coins: 1, item: null });
        expect(state.slotIndex).toBe(1);  // advanced
    });

    it('with first_whack_done=true, rng=0.9: coalesces no-drop to {coins:0,item:null}', async () => {
        const { firstWhackOrRoll } = await import('../src/systems/PrizePack.js');
        const state = { slotIndex: 0 };
        const result = firstWhackOrRoll({ first_whack_done: true }, state, () => 0.9);
        // null would be coalesced — caller always gets concrete result
        expect(result).toEqual({ coins: 0, item: null });
        expect(state.slotIndex).toBe(1);  // slot still advances
    });
});
