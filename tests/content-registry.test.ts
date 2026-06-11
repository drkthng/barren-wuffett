/**
 * Wave 0: ContentRegistry tests (INFR-04)
 *
 * These tests will fail RED until Task 2 creates src/services/ContentRegistry.ts.
 * A module-resolution error at runtime is the expected RED signal.
 * The file must be syntactically valid and collectable by vitest right now.
 */
import { describe, it, expect } from 'vitest';

describe('ContentRegistry (INFR-04)', () => {
    it('loads the ContentRegistry module without error', async () => {
        const mod = await import('../src/services/ContentRegistry.js');
        expect(mod.ContentRegistry).toBeDefined();
    });

    it('getAllLevels() returns an array', async () => {
        const { ContentRegistry } = await import('../src/services/ContentRegistry.js');
        const levels = ContentRegistry.getAllLevels();
        expect(Array.isArray(levels)).toBe(true);
    });

    it('getAllLevels() returns an empty array in Phase 1', async () => {
        const { ContentRegistry } = await import('../src/services/ContentRegistry.js');
        expect(ContentRegistry.getAllLevels()).toHaveLength(0);
    });

    it('getLevel(id) returns undefined for an unknown id', async () => {
        const { ContentRegistry } = await import('../src/services/ContentRegistry.js');
        expect(ContentRegistry.getLevel('nope')).toBeUndefined();
    });

    it('getLevel(id) returns undefined for any arbitrary id', async () => {
        const { ContentRegistry } = await import('../src/services/ContentRegistry.js');
        expect(ContentRegistry.getLevel('level-01')).toBeUndefined();
        expect(ContentRegistry.getLevel('')).toBeUndefined();
        expect(ContentRegistry.getLevel('anything')).toBeUndefined();
    });
});
