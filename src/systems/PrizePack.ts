/**
 * PrizePack — deterministic prize-pack roll system (Phase 3, L1E-02)
 *
 * Pure TypeScript module — NO Phaser import. Importable in the vitest node env.
 *
 * Implements:
 *   - D-05: ALttP 8-slot deterministic prize-pack with ~55% drop chance
 *   - D-06: First-whack guarantee (first bush ALWAYS drops a coin)
 *
 * The rng parameter is injectable for deterministic testing.
 * State is a plain object (PrizePackState) owned by the caller — never a singleton.
 *
 * Pattern: TriggerSystem.ts (pure-TS, no Phaser, internal logic, exported types)
 */

export interface PrizePackState {
    slotIndex: number;  // 0..7, advances each whack regardless of drop
}

export type DropResult = {
    coins: number;
    item: 'snack' | null;
};

// ALttP slots — D-05 locked design (start with these, tuned by playtest)
export const PACK_SLOTS: DropResult[] = [
    { coins: 1, item: null },
    { coins: 0, item: null },   // nothing
    { coins: 1, item: null },
    { coins: 3, item: null },
    { coins: 1, item: null },
    { coins: 0, item: 'snack' },
    { coins: 1, item: null },
    { coins: 5, item: null },
];

export const DROP_CHANCE = 0.55;

/**
 * Roll the prize pack for one whack.
 *
 * - Reads the current slot from PACK_SLOTS[state.slotIndex % 8]
 * - Advances state.slotIndex UNCONDITIONALLY (even on a no-drop)
 * - Returns null when rng() > DROP_CHANCE (45% no-drop)
 * - Returns the slot's DropResult otherwise
 *
 * The caller is responsible for applying the result (coins, item) to game state.
 */
export function rollPrizePack(
    state: PrizePackState,
    rng: () => number = Math.random
): DropResult | null {
    const slot = PACK_SLOTS[state.slotIndex % 8];
    state.slotIndex = (state.slotIndex + 1) % 8;  // deterministic slot advance
    if (rng() > DROP_CHANCE) return null;          // 45% no drop
    return slot;
}

/**
 * D-06 first-whack guarantee: the first bush a player ever whacks ALWAYS drops
 * a coin regardless of rng or the current pack slot, providing instant tutorial feedback.
 *
 * - When flags['first_whack_done'] is absent/falsy: returns { coins: 1, item: null }
 *   WITHOUT advancing the slot (the override is outside the pack sequence).
 * - When flags['first_whack_done'] is truthy: delegates to rollPrizePack and
 *   coalesces a null (no-drop) to { coins: 0, item: null } so the caller always
 *   receives a concrete DropResult.
 *
 * The CALLER (OverworldScene, Slice 1) is responsible for setting
 * flags['first_whack_done'] = true after the first whack resolves.
 */
export function firstWhackOrRoll(
    flags: Record<string, boolean>,
    state: PrizePackState,
    rng: () => number = Math.random
): DropResult {
    if (!flags['first_whack_done']) {
        // First-whack guarantee — slot does NOT advance
        return { coins: 1, item: null };
    }
    return rollPrizePack(state, rng) ?? { coins: 0, item: null };
}
