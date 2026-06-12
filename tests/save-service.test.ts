/**
 * Wave 0: SaveService IndexedDB persistence tests (SAVE-01, SAVE-02)
 *
 * Tests SaveService — automated proxy for:
 *   SAVE-01: save(state) then load() returns equal object
 *   SAVE-02: no supabase import / no fetch call in SaveService source
 *
 * vitest environment: node — IndexedDB does not exist in Node.js.
 * We install fake-indexeddb into globalThis before each test group so
 * idb-keyval finds a working IDB implementation.
 *
 * vi.resetModules() is called in every beforeEach to flush the module
 * registry so each test gets a fresh SaveService import against the
 * freshly-installed IDB mock, preventing cross-test contamination.
 *
 * Pattern: PATTERNS.md save-service.test.ts (analog: audio-persistence.test.ts)
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── fake-indexeddb setup ─────────────────────────────────────────────────────
// fake-indexeddb provides IDBFactory compatible with idb-keyval in Node.
function installFakeIndexedDB(): void {
    // Dynamic require — fake-indexeddb is CJS in test context
    const { IDBFactory } = require('fake-indexeddb');
    const { IDBKeyRange } = require('fake-indexeddb');
    (globalThis as Record<string, unknown>).indexedDB = new IDBFactory();
    (globalThis as Record<string, unknown>).IDBKeyRange = IDBKeyRange;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('SaveService — fresh game (no prior save)', () => {
    beforeEach(() => {
        vi.resetModules();
        installFakeIndexedDB();
    });
    afterEach(() => vi.resetModules());

    it('load() returns undefined when no save exists', async () => {
        const { SaveService } = await import('../src/services/SaveService.js');
        expect(await SaveService.load()).toBeUndefined();
    });
});

describe('SaveService — save then load (same session)', () => {
    beforeEach(() => {
        vi.resetModules();
        installFakeIndexedDB();
    });
    afterEach(() => vi.resetModules());

    it('save(state) then load() returns equal state with version === SAVE_VERSION', async () => {
        const { SaveService, SAVE_VERSION } = await import('../src/services/SaveService.js');
        const state = {
            version:          0,   // will be overwritten by save()
            updatedAt:        0,
            level:            'level-01',
            position:         { x: 64, y: 128 },
            flags:            { npc_grandpa_met: true },
            coins:            15,
            journalUnlocked:  [],
        };
        await SaveService.save(state);
        const loaded = await SaveService.load();
        expect(loaded).toBeDefined();
        expect(loaded?.version).toBe(SAVE_VERSION);
        expect(loaded?.level).toBe('level-01');
        expect(loaded?.position).toEqual({ x: 64, y: 128 });
        expect(loaded?.coins).toBe(15);
        expect(loaded?.flags).toEqual({ npc_grandpa_met: true });
        expect(typeof loaded?.updatedAt).toBe('number');
    });
});

describe('SaveService — schema migration (v0 → v1)', () => {
    beforeEach(() => {
        vi.resetModules();
        installFakeIndexedDB();
    });
    afterEach(() => vi.resetModules());

    it('load() on a v0 save returns migrated object with version === SAVE_VERSION', async () => {
        // Write an old-format save directly via idb-keyval (bypass SaveService.save)
        const { createStore, set } = await import('idb-keyval');
        const oldStore = createStore('bw-saves', 'saves');
        await set('slot_1', {
            version:  0,
            level:    'level-01',
            position: { x: 32, y: 64 },
            coins:    5,
        }, oldStore);

        // Now load via SaveService — should migrate
        const { SaveService, SAVE_VERSION } = await import('../src/services/SaveService.js');
        const loaded = await SaveService.load();
        expect(loaded).toBeDefined();
        expect(loaded?.version).toBe(SAVE_VERSION);
        // Migrated fields should have defaults for missing properties
        expect(loaded?.flags).toBeDefined();
        expect(loaded?.journalUnlocked).toBeDefined();
    });
});

describe('SaveService — SAVE-02 static proof (no backend calls)', () => {
    it('SaveService source contains no supabase import or fetch call', () => {
        const sourcePath = resolve(__dirname, '../src/services/SaveService.ts');
        const source = readFileSync(sourcePath, 'utf-8');
        // Filter out comment lines, then check for forbidden patterns
        const nonCommentLines = source
            .split('\n')
            .filter(line => !line.trimStart().startsWith('//') && !line.trimStart().startsWith('*'));
        const nonCommentSource = nonCommentLines.join('\n');
        expect(nonCommentSource).not.toMatch(/supabase/i);
        expect(nonCommentSource).not.toMatch(/fetch\s*\(/);
    });
});
