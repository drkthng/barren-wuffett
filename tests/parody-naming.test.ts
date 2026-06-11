/**
 * Wave 0: Parody-naming test (LEGL-02)
 *
 * Reads locale JSON files and asserts that no value contains any real person/company
 * name that would violate the parody-naming convention.
 *
 * Forbidden terms (case-insensitive): warren, buffett, munger, berkshire
 *
 * This file must be syntactically valid and collectable by vitest right now.
 * It uses a direct JSON import (resolves from package.json) — available once
 * public/locales/en/common.json exists (created in Task 1 of plan 01-01... wait,
 * Task 2 creates the locale file, so this test will FAIL RED until Task 2 runs).
 */
import { describe, it, expect } from 'vitest';

const FORBIDDEN = ['warren', 'buffett', 'munger', 'berkshire'];

describe('parody-naming compliance (LEGL-02)', () => {
    it('en/common.json contains no forbidden real names in its values', async () => {
        const mod = await import('../public/locales/en/common.json', { assert: { type: 'json' } });
        const locale = mod.default as Record<string, string>;
        const values = Object.values(locale);

        for (const forbidden of FORBIDDEN) {
            for (const value of values) {
                const lower = value.toLowerCase();
                expect(lower, `Forbidden name "${forbidden}" found in value: "${value}"`).not.toContain(forbidden);
            }
        }
    });

    it('de/common.json contains no forbidden real names in its values', async () => {
        const mod = await import('../public/locales/de/common.json', { assert: { type: 'json' } });
        const locale = mod.default as Record<string, string>;
        const values = Object.values(locale);

        for (const forbidden of FORBIDDEN) {
            for (const value of values) {
                const lower = value.toLowerCase();
                expect(lower, `Forbidden name "${forbidden}" found in de locale value: "${value}"`).not.toContain(forbidden);
            }
        }
    });

    it('no forbidden names appear in either locale (combined check)', async () => {
        const enMod = await import('../public/locales/en/common.json', { assert: { type: 'json' } });
        const deMod = await import('../public/locales/de/common.json', { assert: { type: 'json' } });

        const allValues = [
            ...Object.values(enMod.default as Record<string, string>),
            ...Object.values(deMod.default as Record<string, string>)
        ];

        for (const forbidden of FORBIDDEN) {
            for (const value of allValues) {
                expect(value.toLowerCase()).not.toContain(forbidden);
            }
        }
    });
});
