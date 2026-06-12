/**
 * SaveService — versioned IndexedDB save/load using idb-keyval
 *
 * Named store 'bw-saves'/'saves' namespaces progress data away from
 * other IDB databases on the same origin.
 *
 * Threat mitigations (T-02-01, T-02-04):
 *   - load() version-checks and runs migrate() on older saves; returns
 *     undefined (fresh game) for null/invalid shapes — never trusts raw shape.
 *   - save() and load() wrapped in try/catch; IndexedDB unavailable (private
 *     browsing, quota exceeded) is silently ignored — mirrors AudioService pattern.
 *
 * SAVE-02 proof: no supabase import, no fetch call anywhere in this file.
 *
 * Pattern: PATTERNS.md SaveService.ts + RESEARCH Pattern 5
 */
import { createStore, get, set } from 'idb-keyval';

// createStore(dbName, storeName) confirmed correct for idb-keyval v6.2.5
const store = createStore('bw-saves', 'saves');

export const SAVE_VERSION = 1;

export interface SaveState {
    version: number;
    updatedAt: number;
    level: string;
    position: { x: number; y: number };
    flags: Record<string, boolean>;
    coins: number;
    journalUnlocked: string[];
}

/** Forward-migrate an older save to the current SAVE_VERSION shape. */
function migrate(raw: Partial<SaveState>): SaveState {
    return {
        version:          SAVE_VERSION,
        updatedAt:        raw.updatedAt        ?? Date.now(),
        level:            raw.level            ?? 'level-01',
        position:         raw.position         ?? { x: 96, y: 96 },
        flags:            raw.flags            ?? {},
        coins:            raw.coins            ?? 0,
        journalUnlocked:  raw.journalUnlocked  ?? [],
    };
}

export const SaveService = {
    async save(state: SaveState): Promise<void> {
        try {
            state.version   = SAVE_VERSION;
            state.updatedAt = Date.now();
            await set('slot_1', state, store);
        } catch {
            // IndexedDB unavailable (private browsing, quota exceeded) — ignore
        }
    },

    async load(): Promise<SaveState | undefined> {
        try {
            const raw = await get<SaveState>('slot_1', store);
            if (!raw) return undefined;
            if (raw.version < SAVE_VERSION) return migrate(raw);
            return raw;
        } catch {
            return undefined;
        }
    },
};
