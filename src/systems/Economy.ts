/**
 * Economy — pure-TS shop/hospital economy math (Phase 3, L1E-03, L1E-04)
 *
 * Pure TypeScript module — NO Phaser import. Importable in the vitest node env.
 *
 * Implements:
 *   - D-11: Hospital fee floored at 0, capped at 5
 *   - D-12: Helmet waiver (upgrade_helmet flag zeroes the fee)
 *   - D-13: Shop purchase validation (reject if insufficient coins or already owned)
 *   - D-15: Snack is consumable — never flagged as owned after purchase
 *   - D-10: Knockback angle computation (away from dog)
 *
 * All functions are pure (no side effects, no Phaser, fully testable).
 * OverworldScene calls these and then emits COINS_CHANGED with the results.
 *
 * Pattern: TriggerSystem.ts (pure-TS module, no Phaser)
 */

/** Treat flags as a plain string→boolean record; missing keys are safely falsy. */
export interface EconomyFlags extends Record<string, boolean> {}

/**
 * Compute the hospital fee deducted after a dog bite.
 *
 * D-11: fee is min(5, coins) — capped and floored so the player never goes negative.
 * D-12: If flags['upgrade_helmet'] is truthy the fee is 0 (helmet waiver).
 */
export function computeHospitalFee(coins: number, flags: EconomyFlags): number {
    if (flags['upgrade_helmet']) return 0;
    return Math.max(0, Math.min(5, coins));
}

/**
 * Apply a shop purchase. Returns updated coins and flags, or null on rejection.
 *
 * Rejection cases (per D-13 / D-15):
 *   - coins < price            → insufficient funds
 *   - item already owned       → itemId !== 'snack' AND flags[itemId] is truthy
 *
 * On success:
 *   - newCoins = coins - price
 *   - newFlags = { ...flags } with itemId set to true ONLY when itemId !== 'snack'
 *     (snack is consumable — never persisted as owned)
 *
 * Returns a NEW flags object (never mutates the input).
 */
export function applyPurchase(
    coins: number,
    flags: EconomyFlags,
    itemId: string,
    price: number
): { newCoins: number; newFlags: EconomyFlags } | null {
    if (coins < price) return null;
    if (itemId !== 'snack' && flags[itemId]) return null;  // already owned

    const newFlags: EconomyFlags = { ...flags };
    if (itemId !== 'snack') newFlags[itemId] = true;

    return { newCoins: coins - price, newFlags };
}

/**
 * Compute the coins earned from a mini-game result.
 *
 * Paper-route reward formula: 2 coins per delivery + 3 bonus per perfect timing.
 * Kept here as a named helper so callers and tests can reference the formula
 * without duplicating the arithmetic.
 */
export function computeMinigameReward(score: number, perfect: number): number {
    return score * 2 + perfect * 3;
}

/**
 * Apply a mini-game coin reward and notify the caller via an injected emitter.
 *
 * The emitter (onCoinsChanged) is injected rather than imported so this function
 * stays pure TS / Phaser-free — mirroring how PrizePack.ts injects `rng`.
 *
 * Behaviour:
 *   - Computes earned = computeMinigameReward(result.score, result.perfect)
 *   - Computes newCoins = coins + earned
 *   - Calls onCoinsChanged(newCoins) UNCONDITIONALLY (even when earned === 0)
 *     so the HUD always stays authoritative after any mini-game completion.
 *   - Returns newCoins so the caller can store it.
 *
 * OverworldScene.enterMiniGame() wires onCoinsChanged to
 *   (n) => GameEvents.emit(Events.COINS_CHANGED, n)
 * so the HUD coin counter updates after every paper-route run.
 */
export function awardMinigameCoins(
    coins: number,
    result: { score: number; perfect: number },
    onCoinsChanged: (newCoins: number) => void
): number {
    const earned = computeMinigameReward(result.score, result.perfect);
    const newCoins = coins + earned;
    onCoinsChanged(newCoins);
    return newCoins;
}

/**
 * Compute the knockback angle pointing away from the dog.
 *
 * Returns Math.atan2(playerY - fromY, playerX - fromX) — the angle the player
 * should travel to move away from the bite source (D-10).
 *
 * The Slice-2 knockback tween uses Math.cos(angle) * DIST and Math.sin(angle) * DIST.
 */
export function applyKnockbackAngle(
    playerX: number,
    playerY: number,
    fromX: number,
    fromY: number
): number {
    return Math.atan2(playerY - fromY, playerX - fromX);
}
