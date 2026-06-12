/**
 * ShareCard — offscreen 1200×630 Canvas 2D card renderer
 *
 * Renders a spoiler-free quote card for sharing:
 *   - #1a1a2e background
 *   - Game snapshot in top 75% (0,0,1200,472)
 *   - #16213e quote strip bottom 25% (0,472,1200,158)
 *   - Quote text: 60px "Press Start 2P" #e8e8e8 at (48,540) maxWidth 1000
 *   - URL line: 40px "Press Start 2P" #00ff88 at (48,600)
 *   - BW monogram at (1152,598) bottom-right
 *
 * SPOILER-FREE (VIRL-01): only quote text + URL, no raw numbers or victory tallies
 *
 * Pattern: RESEARCH.md Pattern 6 (Canvas 2D render + toBlob)
 * UI-SPEC: Component 7 (Share Card 1200×630 layout)
 */

const CARD_WIDTH  = 1200;
const CARD_HEIGHT = 630;

const SNAP_HEIGHT = Math.round(CARD_HEIGHT * 0.75); // 472
const STRIP_Y     = SNAP_HEIGHT;                     // 472
const STRIP_H     = CARD_HEIGHT - SNAP_HEIGHT;       // 158

export function renderShareCard(
    snapshotImg: HTMLImageElement,
    quote: string,
    monogramImg?: HTMLImageElement | null
): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width  = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // ── Background fill ───────────────────────────────────────────────────
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    // ── Game snapshot (top 75%) ───────────────────────────────────────────
    // Only draw if image has actual dimensions (avoids blank draw on missing src)
    if (snapshotImg && (snapshotImg.naturalWidth > 0 || snapshotImg.width > 0)) {
        try {
            ctx.drawImage(snapshotImg, 0, 0, CARD_WIDTH, SNAP_HEIGHT);
        } catch {
            // If drawImage fails (e.g. CORS, broken image), leave background fill
        }
    }

    // ── Quote strip (bottom 25%): #16213e ────────────────────────────────
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, STRIP_Y, CARD_WIDTH, STRIP_H);

    // ── Quote text: 60px Press Start 2P, #e8e8e8 ────────────────────────
    ctx.font      = '60px "Press Start 2P", monospace';
    ctx.fillStyle = '#e8e8e8';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(quote, 48, 540, 1000);

    // ── Game URL: 40px Press Start 2P, #00ff88 ──────────────────────────
    ctx.font      = '40px "Press Start 2P", monospace';
    ctx.fillStyle = '#00ff88';
    ctx.fillText('barren-wuffett.pages.dev', 48, 600);

    // ── BW monogram at (1152,598): bottom-right corner ───────────────────
    if (monogramImg && (monogramImg.naturalWidth > 0 || monogramImg.width > 0)) {
        try {
            // 32×32 px drawn so the right edge is at x=1184 (1152+32) with ~16px margin
            ctx.drawImage(monogramImg, 1152, 598, 32, 32);
        } catch {
            // Monogram missing — non-fatal; card still renders
        }
    } else {
        // Fallback: draw "BW" text monogram
        ctx.font      = '24px "Press Start 2P", monospace';
        ctx.fillStyle = '#00ff88';
        ctx.fillText('BW', 1152, 622);
    }

    return canvas;
}

/**
 * Converts the offscreen canvas to a Blob (PNG).
 * Returns null if toBlob is not supported or the call fails (e.g. jsdom test env).
 */
export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
    return new Promise<Blob | null>((resolve) => {
        if (typeof canvas.toBlob !== 'function') {
            resolve(null);
            return;
        }
        try {
            // Pass a timeout-safe wrapper in case jsdom's toBlob never calls back
            let called = false;
            canvas.toBlob((blob) => {
                if (!called) {
                    called = true;
                    resolve(blob);
                }
            }, 'image/png');
            // If toBlob does not invoke the callback within 2 seconds (jsdom quirk),
            // resolve null so the caller is not left hanging forever.
            setTimeout(() => {
                if (!called) {
                    called = true;
                    resolve(null);
                }
            }, 2000);
        } catch {
            resolve(null);
        }
    });
}
