/**
 * Wave 1: Audio persistence tests (GAME-07)
 *
 * Tests AudioService localStorage persistence — automated proxy for the
 * "toggle music off, reload, still off" acceptance criterion.
 *
 * AudioService reads/writes plain booleans to localStorage using the
 * absent-or-not-'false' === enabled pattern.
 *
 * vitest environment: node — localStorage does not exist in Node.js.
 * We set up a minimal localStorage mock before each test group and
 * restore globals afterward.
 */
import { describe, it, expect, beforeEach } from 'vitest';

// ── localStorage mock ───────────────────────────────────────────────────────
// Node has no localStorage. Provide a minimal synchronous mock that the
// AudioService module can use.
function makeLocalStorageMock(): Storage {
    const store: Record<string, string> = {};
    return {
        getItem: (key: string) => (key in store ? store[key] : null),
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { Object.keys(store).forEach(k => delete store[k]); },
        get length() { return Object.keys(store).length; },
        key: (index: number) => Object.keys(store)[index] ?? null,
    } as unknown as Storage;
}

// Install mock into globalThis so AudioService finds it when imported
function installLocalStorage(): Storage {
    const mock = makeLocalStorageMock();
    (globalThis as Record<string, unknown>).localStorage = mock;
    return mock;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('AudioService — default state (no prior localStorage)', () => {
    beforeEach(() => {
        installLocalStorage();
    });

    it('getMusicEnabled() returns true when nothing is stored', async () => {
        // Fresh localStorage — no key set
        const { AudioService } = await import('../src/services/AudioService.js');
        expect(AudioService.getMusicEnabled()).toBe(true);
    });

    it('getSfxEnabled() returns true when nothing is stored', async () => {
        const { AudioService } = await import('../src/services/AudioService.js');
        expect(AudioService.getSfxEnabled()).toBe(true);
    });
});

describe('AudioService — persist off and read back (same session)', () => {
    beforeEach(() => {
        installLocalStorage();
    });

    it('setMusicEnabled(false) then getMusicEnabled() returns false', async () => {
        const { AudioService } = await import('../src/services/AudioService.js');
        AudioService.setMusicEnabled(false);
        expect(AudioService.getMusicEnabled()).toBe(false);
    });

    it('setSfxEnabled(false) then getSfxEnabled() returns false', async () => {
        const { AudioService } = await import('../src/services/AudioService.js');
        AudioService.setSfxEnabled(false);
        expect(AudioService.getSfxEnabled()).toBe(false);
    });
});

describe('AudioService — survives simulated reload (fresh read from same store)', () => {
    let storage: Storage;

    beforeEach(() => {
        storage = installLocalStorage();
    });

    it('music state persists: set false in session 1, read false in session 2', async () => {
        const { AudioService } = await import('../src/services/AudioService.js');
        // Session 1: turn music off
        AudioService.setMusicEnabled(false);
        expect(storage.getItem('bw_music_on')).toBe('false');

        // Session 2: same store, re-read (simulates page reload — the key is still there)
        // AudioService reads from localStorage on every call, so a re-read IS a reload simulation
        expect(AudioService.getMusicEnabled()).toBe(false);
    });

    it('music re-enabled: set true restores enabled state', async () => {
        const { AudioService } = await import('../src/services/AudioService.js');
        AudioService.setMusicEnabled(false);
        expect(AudioService.getMusicEnabled()).toBe(false);
        AudioService.setMusicEnabled(true);
        expect(AudioService.getMusicEnabled()).toBe(true);
    });
});

describe('AudioService — SFX independence from Music', () => {
    beforeEach(() => {
        installLocalStorage();
    });

    it('disabling music does not disable SFX', async () => {
        const { AudioService } = await import('../src/services/AudioService.js');
        AudioService.setMusicEnabled(false);
        expect(AudioService.getSfxEnabled()).toBe(true);
    });

    it('disabling SFX does not disable music', async () => {
        const { AudioService } = await import('../src/services/AudioService.js');
        AudioService.setSfxEnabled(false);
        expect(AudioService.getMusicEnabled()).toBe(true);
    });

    it('music and SFX can both be disabled independently', async () => {
        const { AudioService } = await import('../src/services/AudioService.js');
        AudioService.setMusicEnabled(false);
        AudioService.setSfxEnabled(false);
        expect(AudioService.getMusicEnabled()).toBe(false);
        expect(AudioService.getSfxEnabled()).toBe(false);
    });
});
