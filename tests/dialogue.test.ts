/**
 * Wave 0: Level-01 dialogue JSON structure tests (GAME-05)
 *
 * Tests dialogue JSON — automated proxy for:
 *   GAME-05: NPC dialogue triggers via data-driven JSON with required keys
 *
 * vitest environment: node — static JSON, no Phaser dependency.
 *
 * Pattern: PATTERNS.md dialogue.test.ts (analog: content-registry.test.ts)
 */
import { describe, it, expect } from 'vitest';

describe('Level-01 dialogue JSON structure (GAME-05)', () => {
    it('loads level-01 dialogue without error', async () => {
        const mod = await import('../src/data/dialogue/en/level-01.json', {
            assert: { type: 'json' }
        });
        expect(mod.default).toBeDefined();
    });

    it('contains required NPC keys', async () => {
        const mod = await import('../src/data/dialogue/en/level-01.json', {
            assert: { type: 'json' }
        });
        const dialogue = mod.default as Record<string, unknown>;
        expect(dialogue).toHaveProperty('npc_grandpa');
        expect(dialogue).toHaveProperty('npc_store_clerk');
        expect(dialogue).toHaveProperty('npc_rival');
    });

    it('contains required boss keys', async () => {
        const mod = await import('../src/data/dialogue/en/level-01.json', {
            assert: { type: 'json' }
        });
        const dialogue = mod.default as Record<string, unknown>;
        expect(dialogue).toHaveProperty('boss_greed_01');
        expect(dialogue).toHaveProperty('boss_panic_01');
        expect(dialogue).toHaveProperty('boss_01_wisdom_quote');
    });

    it('NPC entries are non-empty arrays with portrait and text fields', async () => {
        const mod = await import('../src/data/dialogue/en/level-01.json', {
            assert: { type: 'json' }
        });
        const dialogue = mod.default as Record<string, unknown>;
        const grandpa = dialogue['npc_grandpa'] as Array<{ portrait: string; text: string }>;
        expect(Array.isArray(grandpa)).toBe(true);
        expect(grandpa.length).toBeGreaterThan(0);
        expect(typeof grandpa[0].portrait).toBe('string');
        expect(typeof grandpa[0].text).toBe('string');
    });

    it('boss_01_wisdom_quote is a non-empty string', async () => {
        const mod = await import('../src/data/dialogue/en/level-01.json', {
            assert: { type: 'json' }
        });
        const dialogue = mod.default as Record<string, unknown>;
        expect(typeof dialogue['boss_01_wisdom_quote']).toBe('string');
        expect((dialogue['boss_01_wisdom_quote'] as string).length).toBeGreaterThan(0);
    });
});
