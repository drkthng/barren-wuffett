/**
 * Wave 0: Dog hazard — hospital fee floor, helmet waiver, knockback angle (L1E-03)
 *
 * Tests computeHospitalFee and applyKnockbackAngle against the pure seam
 * src/systems/Economy.ts — automated proxy for:
 *   L1E-03: hospital fee floored at 0 (never negative)
 *   L1E-03: hospital fee is 0 when upgrade_helmet set
 *   D-10:   knockback angle points away from the dog
 *   D-11:   fee is min(5, coins) (capped and floored)
 *   D-12:   helmet waiver
 *
 * vitest environment: node — no Phaser dependency (Economy is pure TS).
 *
 * Pattern: PATTERNS.md dog-hazard.test.ts (analog: input-bus.test.ts)
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ── computeHospitalFee ───────────────────────────────────────────────────────

describe('Economy — computeHospitalFee', () => {
    beforeEach(() => { vi.resetModules(); });
    afterEach(()  => { vi.resetModules(); });

    it('standard fee: computeHospitalFee(10, {}) === 5 (capped at 5)', async () => {
        const { computeHospitalFee } = await import('../src/systems/Economy.js');
        expect(computeHospitalFee(10, {})).toBe(5);
    });

    it('below cap: computeHospitalFee(3, {}) === 3 (floored to coins)', async () => {
        const { computeHospitalFee } = await import('../src/systems/Economy.js');
        expect(computeHospitalFee(3, {})).toBe(3);
    });

    it('broke: computeHospitalFee(0, {}) === 0 (never negative)', async () => {
        const { computeHospitalFee } = await import('../src/systems/Economy.js');
        expect(computeHospitalFee(0, {})).toBe(0);
    });

    it('helmet waiver: computeHospitalFee(10, { upgrade_helmet: true }) === 0', async () => {
        const { computeHospitalFee } = await import('../src/systems/Economy.js');
        expect(computeHospitalFee(10, { upgrade_helmet: true })).toBe(0);
    });
});

// ── applyKnockbackAngle ──────────────────────────────────────────────────────

describe('Economy — applyKnockbackAngle', () => {
    beforeEach(() => { vi.resetModules(); });
    afterEach(()  => { vi.resetModules(); });

    it('dog to the right (fromX > playerX): angle points left (≈ ±π)', async () => {
        const { applyKnockbackAngle } = await import('../src/systems/Economy.js');
        // Player at (100, 100), dog at (150, 100) → player should fly left
        const angle = applyKnockbackAngle(100, 100, 150, 100);
        // Math.atan2(100 - 100, 100 - 150) = Math.atan2(0, -50) = Math.PI
        expect(angle).toBeCloseTo(Math.PI, 5);
    });

    it('dog to the left (fromX < playerX): angle points right (≈ 0)', async () => {
        const { applyKnockbackAngle } = await import('../src/systems/Economy.js');
        // Player at (100, 100), dog at (50, 100) → player should fly right
        const angle = applyKnockbackAngle(100, 100, 50, 100);
        // Math.atan2(0, 50) = 0
        expect(angle).toBeCloseTo(0, 5);
    });

    it('dog below (fromY > playerY): angle points up (≈ -π/2)', async () => {
        const { applyKnockbackAngle } = await import('../src/systems/Economy.js');
        // Player at (100, 100), dog at (100, 150) → player flies up (negative Y)
        const angle = applyKnockbackAngle(100, 100, 100, 150);
        // Math.atan2(-50, 0) = -π/2
        expect(angle).toBeCloseTo(-Math.PI / 2, 5);
    });
});
