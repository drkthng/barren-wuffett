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
import type Phaser from 'phaser';

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

    /**
     * Play a sound effect via the scene's sound manager, honoring the SFX mute toggle.
     * Gated on getSfxEnabled() — never call scene.sound.play() directly at call sites (D-20, T-03-05).
     * Design: takes the scene so AudioService stays a stateless singleton (no singleton Phaser ref).
     *
     * @param scene  The current Phaser Scene (owns the sound manager)
     * @param key    The audio key registered in Preloader (e.g. 'whack', 'coin_ding')
     */
    playSfx: (scene: Phaser.Scene, key: string): void => {
        if (!AudioService.getSfxEnabled()) return;
        // A missing/undecodable audio key makes Phaser's sound.play() THROW, which
        // propagates out of update()/event handlers and freezes the game. Audio must
        // never break gameplay (mirrors the try/catch discipline above): only play keys
        // that are actually in the decoded cache, and swallow any play error.
        try {
            if (scene.cache?.audio?.exists(key)) scene.sound.play(key);
        } catch {
            /* ignore — silent SFX is always better than a frozen game */
        }
    },
};
