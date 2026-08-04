/**
 * SwingTracker — one-award-per-swing guard (Phase 3.1, FEEL-05)
 *
 * Pure TS, no Phaser. Arcade overlap re-fires its callback every frame two
 * bodies keep intersecting, and the whack hitbox stays live for ~150ms — so a
 * single swing used to roll the prize pack ~5 times per bush. OverworldScene
 * calls beginSwing() when the hitbox activates and registerHit(bushId) from
 * the overlap callback: only the FIRST registration per swing per bush wins.
 *
 * (Defense in depth: BushEntity also disables its body synchronously on hit —
 * this tracker guarantees single-award even if that ordering ever regresses.)
 */
export class SwingTracker {
    private hits = new Set<string>();

    /** Start a new swing — clears the per-swing hit set. */
    beginSwing(): void {
        this.hits.clear();
    }

    /** Returns true exactly once per (swing, id) pair. */
    registerHit(id: string): boolean {
        if (this.hits.has(id)) return false;
        this.hits.add(id);
        return true;
    }
}
