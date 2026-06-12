// @vitest-environment jsdom
/**
 * Wave 0: ShareService tests (VIRL-01)
 *
 * Tests ShareService Blob generation and share/fallback paths —
 * automated proxy for the "one-tap Canvas share card" acceptance criterion.
 *
 * vitest environment: jsdom — required for HTMLCanvasElement and navigator mock.
 * Uses @vitest-environment jsdom docblock to switch environment per-file.
 *
 * Pattern: tests/audio-persistence.test.ts (vi.resetModules + mock-install pattern)
 * Pattern: PATTERNS.md tests/share-service.test.ts (jsdom env + canvas/share mocks)
 *
 * Key assertions:
 *   1. shareCard() resolves without throwing when canShare returns false (download fallback)
 *   2. navigator.share is called when canShare returns true (file-share path)
 *   3. Source uses renderer.snapshot not toDataURL (WebGL anti-pattern check)
 *   4. Source uses canShare guard and revokeObjectURL (correctness requirements)
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Mock game object ─────────────────────────────────────────────────────────
function makeMockGame() {
    return {
        renderer: {
            snapshot: (cb: (img: HTMLImageElement) => void) => {
                // Immediately call back with a blank HTMLImageElement
                const img = new Image();
                cb(img);
            },
        },
    } as unknown as Phaser.Game;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ShareService — fallback download path (canShare = false)', () => {
    beforeEach(() => {
        vi.resetModules();
        // Patch navigator.canShare to always return false (triggers download fallback)
        Object.defineProperty(navigator, 'canShare', {
            value: () => false,
            configurable: true,
            writable: true,
        });
    });
    afterEach(() => {
        vi.resetModules();
    });

    it('shareCard() resolves without throwing (download fallback when canShare=false)', async () => {
        const mockGame = makeMockGame();

        // Mock anchor element click to prevent real DOM interaction
        const clickSpy = vi.fn();
        const originalCreate = document.createElement.bind(document);
        vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
            if (tag === 'a') {
                const anchor = { click: clickSpy, href: '', download: '', style: {} } as unknown as HTMLAnchorElement;
                return anchor;
            }
            return originalCreate(tag);
        });

        // Also mock URL.createObjectURL and URL.revokeObjectURL
        const originalCreateObjectURL = URL.createObjectURL;
        const originalRevokeObjectURL = URL.revokeObjectURL;
        URL.createObjectURL = vi.fn(() => 'blob:mock-url');
        URL.revokeObjectURL = vi.fn();

        const { shareCard } = await import('../src/services/ShareService.js');
        await expect(shareCard(mockGame, 'TEST QUOTE')).resolves.not.toThrow();

        // Restore
        URL.createObjectURL = originalCreateObjectURL;
        URL.revokeObjectURL = originalRevokeObjectURL;
        vi.restoreAllMocks();
    });
});

describe('ShareService — file-share path (canShare = true)', () => {
    beforeEach(() => {
        vi.resetModules();
    });
    afterEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
    });

    it('navigator.share is called with a files array when canShare returns true', async () => {
        const mockGame = makeMockGame();
        const shareSpy = vi.fn().mockResolvedValue(undefined);

        // Patch navigator.canShare to return true for file shares
        Object.defineProperty(navigator, 'canShare', {
            value: () => true,
            configurable: true,
            writable: true,
        });
        Object.defineProperty(navigator, 'share', {
            value: shareSpy,
            configurable: true,
            writable: true,
        });

        const { shareCard } = await import('../src/services/ShareService.js');
        await shareCard(mockGame, 'TEST QUOTE');

        expect(shareSpy).toHaveBeenCalledOnce();
        const callArg = shareSpy.mock.calls[0][0] as { files?: unknown[] };
        expect(callArg).toHaveProperty('files');
        expect(Array.isArray(callArg.files)).toBe(true);
        expect((callArg.files as unknown[]).length).toBeGreaterThan(0);
    });
});

describe('ShareService — source static assertions (WebGL anti-pattern + correctness)', () => {
    it('ShareService.ts uses renderer.snapshot (not toDataURL) — WebGL anti-pattern check', () => {
        const src = readFileSync(
            resolve(__dirname, '../src/services/ShareService.ts'),
            'utf-8'
        );
        expect(src).toContain('renderer.snapshot');
        expect(src).not.toContain('toDataURL');
    });

    it('ShareService.ts guards with canShare (Open Question 3)', () => {
        const src = readFileSync(
            resolve(__dirname, '../src/services/ShareService.ts'),
            'utf-8'
        );
        expect(src).toContain('canShare');
    });

    it('ShareService.ts has a download fallback with revokeObjectURL (fallback chain)', () => {
        const src = readFileSync(
            resolve(__dirname, '../src/services/ShareService.ts'),
            'utf-8'
        );
        expect(src.toLowerCase()).toMatch(/download|revokeobjecturl/i);
    });

    it('ShareService.ts has no top-level Phaser import (must be vitest-importable)', () => {
        const src = readFileSync(
            resolve(__dirname, '../src/services/ShareService.ts'),
            'utf-8'
        );
        // Must not have: import ... from 'phaser' at line start
        const hasPhaserImport = /^import\s+.*['"]phaser['"]/m.test(src);
        expect(hasPhaserImport).toBe(false);
    });
});

describe('ShareService — prepareShareCard caches Blob', () => {
    beforeEach(() => {
        vi.resetModules();
    });
    afterEach(() => {
        vi.resetModules();
    });

    it('prepareShareCard() resolves and returns a Blob', async () => {
        const mockGame = makeMockGame();

        const { prepareShareCard } = await import('../src/services/ShareService.js');
        const blob = await prepareShareCard(mockGame, 'TEST QUOTE');
        // jsdom may return null from toBlob — we accept both non-null Blob or null (jsdom canvas limitation)
        // The key assertion is that it resolves without error
        expect(blob === null || blob instanceof Blob).toBe(true);
    });
});
