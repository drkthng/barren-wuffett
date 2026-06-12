/**
 * Wave 0: og:meta tags tests (VIRL-02)
 *
 * Tests that index.html contains og:image, og:title, og:description meta tags —
 * automated proxy for the "URL renders rich preview on messaging apps" acceptance criterion.
 *
 * vitest environment: node — uses readFileSync to read index.html as a string.
 * Pattern: tests/i18n.test.ts (readFileSync static-file pattern)
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const html = readFileSync(resolve(__dirname, '../index.html'), 'utf-8');

describe('og:meta tags (VIRL-02)', () => {
    it('index.html contains og:image meta tag', () => {
        expect(html).toContain('og:image');
    });

    it('index.html contains og:title meta tag', () => {
        expect(html).toContain('og:title');
    });

    it('index.html contains og:description meta tag', () => {
        expect(html).toContain('og:description');
    });

    it('og:image points to og-image.png', () => {
        expect(html).toContain('og-image.png');
    });

    it('og:image content is a root-relative or absolute path', () => {
        // Must contain content="/og-image.png" or content="https://..."
        expect(html).toMatch(/content=["']\/og-image\.png/);
    });
});
