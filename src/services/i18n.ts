/**
 * i18n — thin key-based text lookup
 *
 * Phase 1 approach: lightweight custom t(key) wrapper over a JSON import.
 * No external i18n package. Calling convention is migration-compatible with
 * i18next if German localization ships in a future phase.
 *
 * Usage:
 *   import { t, setLocale } from './i18n';
 *   t('menu.tapToStart')  // → 'TAP TO START'
 *   t('unknown.key')      // → 'unknown.key'  (key fallback — never throws)
 */
import en from '../../public/locales/en/common.json';

type LocaleData = typeof en;

let locale: LocaleData = en;

/**
 * Look up a translation by key.
 * Falls back to the raw key string if the key is not in the active locale.
 */
export function t(key: string): string {
    return (locale as Record<string, string>)[key] ?? key;
}

/**
 * Swap the active locale used by subsequent t() calls.
 * Pass a full locale object (e.g. the result of importing a de/common.json).
 */
export function setLocale(data: Record<string, string>): void {
    locale = data as LocaleData;
}
