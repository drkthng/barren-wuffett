/**
 * AudioService — persistent audio toggle using localStorage
 *
 * Keys:
 *   bw_music_on — music enabled flag ('false' = disabled, anything else = enabled)
 *   bw_sfx_on   — SFX enabled flag ('false' = disabled, anything else = enabled)
 *
 * Semantics: absent or any value other than the string 'false' means ENABLED.
 */
const KEYS = {
    music: 'bw_music_on',
    sfx: 'bw_sfx_on',
} as const;

export const AudioService = {
    getMusicEnabled: (): boolean => localStorage.getItem(KEYS.music) !== 'false',
    setMusicEnabled: (on: boolean): void => { localStorage.setItem(KEYS.music, String(on)); },
    getSfxEnabled:   (): boolean => localStorage.getItem(KEYS.sfx) !== 'false',
    setSfxEnabled:   (on: boolean): void => { localStorage.setItem(KEYS.sfx, String(on)); },
};
