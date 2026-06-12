/**
 * AudioService — persistent audio toggle using localStorage
 *
 * Keys:
 *   bw_music_on — music enabled flag ('false' = disabled, anything else = enabled)
 *   bw_sfx_on   — SFX enabled flag ('false' = disabled, anything else = enabled)
 *
 * Semantics: absent or any value other than the string 'false' means ENABLED.
 *
 * All localStorage access is wrapped in try/catch to handle Safari Private Browsing
 * and storage-restricted contexts (SecurityError / DOM Exception 18). On error, reads
 * return null (defaults to enabled) and writes are silently ignored — in-memory toggle
 * state remains consistent within the session.
 */
const KEYS = {
    music: 'bw_music_on',
    sfx: 'bw_sfx_on',
} as const;

function safeGet(key: string): string | null {
    try { return localStorage.getItem(key); }
    catch { return null; }
}

function safeSet(key: string, value: string): void {
    try { localStorage.setItem(key, value); }
    catch { /* ignore — in-memory state still reflects the toggle */ }
}

export const AudioService = {
    getMusicEnabled: (): boolean => safeGet(KEYS.music) !== 'false',
    setMusicEnabled: (on: boolean): void => { safeSet(KEYS.music, String(on)); },
    getSfxEnabled:   (): boolean => safeGet(KEYS.sfx) !== 'false',
    setSfxEnabled:   (on: boolean): void => { safeSet(KEYS.sfx, String(on)); },
};
