/**
 * Wave 0: i18n tests (INFR-05)
 *
 * These tests will fail RED until Task 2 creates src/services/i18n.ts.
 * A module-resolution error at runtime is the expected RED signal.
 * The file must be syntactically valid and collectable by vitest right now.
 */
import { describe, it, expect } from 'vitest';

// Dynamic import used so vitest can collect this file even when the module
// does not exist yet — the actual import error surfaces inside the test, not
// at collection time (which would be a "failed to collect" error).
let t: (key: string) => string;
let setLocale: (data: Record<string, string>) => void;

describe('i18n service', () => {
    it('loads the i18n module without error', async () => {
        const mod = await import('../src/services/i18n.js');
        t = mod.t;
        setLocale = mod.setLocale;
        expect(typeof t).toBe('function');
        expect(typeof setLocale).toBe('function');
    });

    it('resolves menu.tapToStart to TAP TO START', async () => {
        const mod = await import('../src/services/i18n.js');
        t = mod.t;
        expect(t('menu.tapToStart')).toBe('TAP TO START');
    });

    it('resolves game.title to BARREN WUFFETT', async () => {
        const mod = await import('../src/services/i18n.js');
        t = mod.t;
        expect(t('game.title')).toBe('BARREN WUFFETT');
    });

    it('resolves loading.progress to LOADING...', async () => {
        const mod = await import('../src/services/i18n.js');
        t = mod.t;
        expect(t('loading.progress')).toBe('LOADING...');
    });

    it('falls back to the key when translation is missing', async () => {
        const mod = await import('../src/services/i18n.js');
        t = mod.t;
        expect(t('unknown.key')).toBe('unknown.key');
    });

    it('setLocale swaps the active locale for subsequent t() calls', async () => {
        const mod = await import('../src/services/i18n.js');
        t = mod.t;
        setLocale = mod.setLocale;
        setLocale({ 'menu.tapToStart': 'TIPPEN ZUM STARTEN' });
        expect(t('menu.tapToStart')).toBe('TIPPEN ZUM STARTEN');
        // Restore default locale so other tests are unaffected
        const defaultLocale = await import('../public/locales/en/common.json', { assert: { type: 'json' } });
        setLocale(defaultLocale.default as Record<string, string>);
    });
});
