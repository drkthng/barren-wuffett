/**
 * TriggerSystem regression tests — boss-on-load + defeated-boss + normal walk-in
 *
 * Covers:
 *   - Basic overlap: checkZones returns correct hits and nulls
 *   - REGRESSION boss-on-load: armLoadPosition suppresses a zone the player loads
 *     inside of; stepping out re-arms it; walking back in triggers normally
 *   - REGRESSION defeated-boss-never-refires: permanent consume + armLoadPosition;
 *     stepping out and back in keeps the zone suppressed forever
 *   - Load outside does not arm: armLoadPosition(96,96) leaves boss zone triggerable
 *
 * vitest environment: node — TriggerSystem is pure TS (no Phaser import).
 * Pattern: prize-pack.test.ts (vi.resetModules, dynamic import, .js extension)
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Zone facts from LEVEL_01_ZONES in TriggerSystem.ts:
//   boss     rect {x:192, y:672, w:128, h:96}  — inside: (224,720), outside: (96,96)
//   minigame rect {x:288, y:256, w:128, h:128} — inside: (352,320)

// ── Basic overlap ─────────────────────────────────────────────────────────────

describe('TriggerSystem — basic zone overlap', () => {
    beforeEach(() => { vi.resetModules(); });
    afterEach(()  => { vi.resetModules(); });

    it('checkZones(224,720) returns boss_trigger / BossScene', async () => {
        const { TriggerSystem } = await import('../src/systems/TriggerSystem.js');
        const ts = new TriggerSystem();
        const hit = ts.checkZones(224, 720);
        expect(hit).not.toBeNull();
        expect(hit?.zone).toBe('boss_trigger');
        expect(hit?.target).toBe('BossScene');
    });

    it('checkZones(96,96) returns null (outside all zones)', async () => {
        const { TriggerSystem } = await import('../src/systems/TriggerSystem.js');
        const ts = new TriggerSystem();
        expect(ts.checkZones(96, 96)).toBeNull();
    });

    it('checkZones(352,320) returns minigame_trigger / PaperThrowScene', async () => {
        const { TriggerSystem } = await import('../src/systems/TriggerSystem.js');
        const ts = new TriggerSystem();
        const hit = ts.checkZones(352, 320);
        expect(hit).not.toBeNull();
        expect(hit?.zone).toBe('minigame_trigger');
        expect(hit?.target).toBe('PaperThrowScene');
    });
});

// ── REGRESSION: boss-on-load ──────────────────────────────────────────────────

describe('TriggerSystem — REGRESSION boss-on-load (armLoadPosition)', () => {
    beforeEach(() => { vi.resetModules(); });
    afterEach(()  => { vi.resetModules(); });

    it('after armLoadPosition(224,720), checkZones(224,720) returns null — does NOT auto-fire on load', async () => {
        const { TriggerSystem } = await import('../src/systems/TriggerSystem.js');
        const ts = new TriggerSystem();
        ts.armLoadPosition(224, 720);
        expect(ts.checkZones(224, 720)).toBeNull();
    });

    it('stepping OUT after armLoadPosition re-arms the zone', async () => {
        const { TriggerSystem } = await import('../src/systems/TriggerSystem.js');
        const ts = new TriggerSystem();
        ts.armLoadPosition(224, 720);
        // Still inside — still null
        expect(ts.checkZones(224, 720)).toBeNull();
        // Step outside — clears pendingExit, re-arms zone
        const outHit = ts.checkZones(96, 96);
        expect(outHit).toBeNull();  // outside zone, no hit
    });

    it('walking back IN after stepping out triggers the boss normally (load-arm cleared)', async () => {
        const { TriggerSystem } = await import('../src/systems/TriggerSystem.js');
        const ts = new TriggerSystem();
        ts.armLoadPosition(224, 720);
        ts.checkZones(224, 720);  // still inside — suppressed
        ts.checkZones(96, 96);    // step out — re-arms
        // Walk back in — should trigger
        const hit = ts.checkZones(224, 720);
        expect(hit).not.toBeNull();
        expect(hit?.zone).toBe('boss_trigger');
        expect(hit?.target).toBe('BossScene');
    });
});

// ── REGRESSION: defeated boss never re-fires ──────────────────────────────────

describe('TriggerSystem — REGRESSION defeated boss never re-fires', () => {
    beforeEach(() => { vi.resetModules(); });
    afterEach(()  => { vi.resetModules(); });

    it('after consume(boss_trigger) + armLoadPosition, checkZones inside returns null', async () => {
        const { TriggerSystem } = await import('../src/systems/TriggerSystem.js');
        const ts = new TriggerSystem();
        ts.consume('boss_trigger');          // permanent defeat consume
        ts.armLoadPosition(224, 720);        // skips boss (already consumed)
        expect(ts.checkZones(224, 720)).toBeNull();
    });

    it('stepping out of defeated-boss zone does NOT re-arm it', async () => {
        const { TriggerSystem } = await import('../src/systems/TriggerSystem.js');
        const ts = new TriggerSystem();
        ts.consume('boss_trigger');
        ts.armLoadPosition(224, 720);
        ts.checkZones(224, 720);  // inside — null
        // Step out — would normally re-arm via pendingExit, but boss was permanently consumed
        expect(ts.checkZones(96, 96)).toBeNull();
    });

    it('walking back into defeated-boss zone is STILL null — permanent suppress, never re-armed', async () => {
        const { TriggerSystem } = await import('../src/systems/TriggerSystem.js');
        const ts = new TriggerSystem();
        ts.consume('boss_trigger');
        ts.armLoadPosition(224, 720);
        ts.checkZones(224, 720);  // inside — null
        ts.checkZones(96, 96);    // step out — pendingExit NOT set (was skipped in armLoadPosition)
        // Walk back in — still null
        expect(ts.checkZones(224, 720)).toBeNull();
    });
});

// ── armLoadPosition does NOT arm zones the player loads outside of ─────────────

describe('TriggerSystem — armLoadPosition only affects zones the player loads INTO', () => {
    beforeEach(() => { vi.resetModules(); });
    afterEach(()  => { vi.resetModules(); });

    it('armLoadPosition(96,96) does not arm boss zone — normal walk-in still triggers', async () => {
        const { TriggerSystem } = await import('../src/systems/TriggerSystem.js');
        const ts = new TriggerSystem();
        ts.armLoadPosition(96, 96);          // loaded outside both zones
        const hit = ts.checkZones(224, 720); // walk into boss zone
        expect(hit).not.toBeNull();
        expect(hit?.zone).toBe('boss_trigger');
    });
});
