/**
 * Wave 0: WhackOffsets 4-facing hitbox coverage (L1E-01)
 *
 * Tests whackHitboxOffset, WHACK_OFFSETS, and WHACK_REACH against the pure seam
 * src/systems/WhackOffsets.ts — automated proxy for:
 *   L1E-01: hitbox offset correct for all 4 facings (down +Y, up -Y, left -X, right +X)
 *   D-02:   directional hitbox in front of the player at WHACK_REACH (24 pixels)
 *
 * vitest environment: node — no Phaser dependency (WhackOffsets is pure TS).
 *
 * Pattern: PATTERNS.md whack.test.ts (analog: input-bus.test.ts)
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('WhackOffsets — 4-facing hitbox offsets', () => {
    beforeEach(() => { vi.resetModules(); });
    afterEach(()  => { vi.resetModules(); });

    it('whackHitboxOffset("down") === { dx: 0, dy: 24 }', async () => {
        const { whackHitboxOffset } = await import('../src/systems/WhackOffsets.js');
        expect(whackHitboxOffset('down')).toEqual({ dx: 0, dy: 24 });
    });

    it('whackHitboxOffset("up") === { dx: 0, dy: -24 }', async () => {
        const { whackHitboxOffset } = await import('../src/systems/WhackOffsets.js');
        expect(whackHitboxOffset('up')).toEqual({ dx: 0, dy: -24 });
    });

    it('whackHitboxOffset("left") === { dx: -24, dy: 0 }', async () => {
        const { whackHitboxOffset } = await import('../src/systems/WhackOffsets.js');
        expect(whackHitboxOffset('left')).toEqual({ dx: -24, dy: 0 });
    });

    it('whackHitboxOffset("right") === { dx: 24, dy: 0 }', async () => {
        const { whackHitboxOffset } = await import('../src/systems/WhackOffsets.js');
        expect(whackHitboxOffset('right')).toEqual({ dx: 24, dy: 0 });
    });

    it('unknown facing falls back to down offset', async () => {
        const { whackHitboxOffset } = await import('../src/systems/WhackOffsets.js');
        expect(whackHitboxOffset('weird')).toEqual({ dx: 0, dy: 24 });
    });
});

describe('WhackOffsets — WHACK_REACH constant', () => {
    beforeEach(() => { vi.resetModules(); });
    afterEach(()  => { vi.resetModules(); });

    it('WHACK_REACH === 24', async () => {
        const { WHACK_REACH } = await import('../src/systems/WhackOffsets.js');
        expect(WHACK_REACH).toBe(24);
    });

    it('each WHACK_OFFSETS entry has a non-zero component equal to ±WHACK_REACH', async () => {
        const { WHACK_OFFSETS, WHACK_REACH } = await import('../src/systems/WhackOffsets.js');
        for (const [facing, offset] of Object.entries(WHACK_OFFSETS)) {
            const maxComponent = Math.max(Math.abs(offset.dx), Math.abs(offset.dy));
            expect(maxComponent, `facing "${facing}" must have non-zero component ±WHACK_REACH`).toBe(WHACK_REACH);
        }
    });
});
