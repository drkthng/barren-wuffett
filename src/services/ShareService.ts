/**
 * ShareService — pre-cached share card via renderer.snapshot + Web Share API L2
 *
 * Two-function API:
 *   prepareShareCard(game, quote) → Promise<Blob | null>
 *     Called at BOSS_DEFEATED (before the share button appears).
 *     Takes a WebGL-safe snapshot via game.renderer.snapshot (not the black-image
 *     anti-pattern), renders the
 *     1200×630 offscreen canvas via ShareCard, converts to Blob, caches it.
 *     iOS REQUIREMENT (Pitfall 4): the Blob MUST be cached before the tap
 *     so shareCard() can call navigator.share() in the direct gesture call stack.
 *
 *   shareCard(game, quote) → Promise<void>
 *     Called directly from the SHARE WISDOM pointerdown handler (no await before share()).
 *     Uses cached Blob if available (else generates on-demand).
 *     Guards with navigator.canShare({files:[...]}) per Open Question 3.
 *     Fallback: anchor[download] with revokeObjectURL.
 *
 * Anti-pattern avoided: does NOT call the canvas DataURL method (returns black in WebGL).
 * Uses game.renderer.snapshot() which uses readPixels() on the correct frame.
 *
 * Pattern: RESEARCH.md Pattern 6, Pitfall 4, Open Question 3
 * Pattern: PATTERNS.md ShareService.ts (AudioService structure, no Phaser import)
 */

import { renderShareCard, canvasToBlob } from '../ui/ShareCard';

// Phaser.Game type reference — Phaser is NOT imported at module level so this
// module stays importable in vitest node/jsdom environment without a real Phaser.
// The type is used only in function signatures (erased at runtime).
// We use a minimal structural type that is assignment-compatible with Phaser.Game:
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PhaserGame = { renderer: { snapshot: (callback: (img: any) => void, type?: string) => void } };

// ── Module-level Blob cache (survives the time between boss defeat and share tap) ──
let _cachedBlob: Blob | null = null;
let _cachedQuote: string | null = null;

// ── Snapshot helper ──────────────────────────────────────────────────────────

function takeSnapshot(game: PhaserGame): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>((resolve) => {
        game.renderer.snapshot((img) => {
            // Phaser's snapshot callback can return HTMLImageElement or Color.
            // We cast to HTMLImageElement — in WebGL mode with type='image/png' it is always an image.
            resolve(img as HTMLImageElement);
        }, 'image/png');
    });
}

// ── prepareShareCard ─────────────────────────────────────────────────────────

/**
 * Pre-generate and cache the share card Blob at BOSS_DEFEATED time.
 * Call this before the level-complete screen appears so the share button
 * tap can call navigator.share() without any preceding await (iOS Pitfall 4).
 */
export async function prepareShareCard(game: PhaserGame, quote: string): Promise<Blob | null> {
    // Take WebGL-safe snapshot via renderer.snapshot (black-image anti-pattern avoided)
    const img = await takeSnapshot(game);

    // Render 1200×630 offscreen card
    const canvas = renderShareCard(img, quote, null);

    // Convert to Blob
    const blob = await canvasToBlob(canvas);

    // Cache for use in shareCard()
    _cachedBlob  = blob;
    _cachedQuote = quote;

    return blob;
}

// ── shareCard ────────────────────────────────────────────────────────────────

/**
 * Share the pre-cached 1200×630 quote card via Web Share API Level 2 or
 * fall back to an anchor[download] click.
 *
 * MUST be called directly in a pointerdown handler — no awaits before this
 * function when using the cached Blob path (iOS user-gesture requirement, Pitfall 4).
 */
export async function shareCard(game: PhaserGame, quote: string): Promise<void> {
    // Use cached Blob if available and for the same quote, else generate
    let blob: Blob | null;
    if (_cachedBlob !== null && _cachedQuote === quote) {
        blob = _cachedBlob;
    } else {
        // Fallback generation (e.g. if called without prior prepareShareCard)
        const img    = await takeSnapshot(game);
        const canvas = renderShareCard(img, quote, null);
        blob         = await canvasToBlob(canvas);
    }

    if (!blob) {
        // Canvas Blob generation failed (unsupported env) — nothing to share
        return;
    }

    const file     = new File([blob], 'barren-wuffett-victory.png', { type: 'image/png' });
    const shareData = {
        files: [file],
        title: 'Barren Wuffett',
        text:  quote,
    };

    // Web Share API Level 2 (iOS ≥ 15.1, Android Chrome) — always guard with canShare
    if (
        typeof navigator.canShare === 'function' &&
        navigator.canShare(shareData)
    ) {
        await navigator.share(shareData);
    } else {
        // Fallback: anchor[download] click + revokeObjectURL cleanup
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a') as HTMLAnchorElement;
        a.href     = url;
        a.download = 'barren-wuffett-victory.png';
        a.click();
        URL.revokeObjectURL(url);
    }
}

// ── Cache reset (for testing / new game sessions) ────────────────────────────

/** Clear the cached Blob (call between game sessions if needed). */
export function resetShareCache(): void {
    _cachedBlob  = null;
    _cachedQuote = null;
}
