/**
 * GameEvents — typed event name constants + EventEmitter singleton
 *
 * All scenes and services emit and subscribe via this shared bus.
 * Using string constants (not enum) allows tree-shaking and avoids
 * circular-import issues when scenes import each other's event names.
 *
 * Pattern: PATTERNS.md GameEvents.ts (no codebase analog — first bus)
 */
import Phaser from 'phaser';

export const Events = Object.freeze({
    DIALOGUE_START:    'DIALOGUE_START',
    DIALOGUE_COMPLETE: 'DIALOGUE_COMPLETE',
    PAUSE_REQUESTED:   'PAUSE_REQUESTED',
    RESUME_REQUESTED:  'RESUME_REQUESTED',
    MINIGAME_COMPLETE: 'MINIGAME_COMPLETE',
    BOSS_DEFEATED:     'BOSS_DEFEATED',
    PATIENCE_BONUS:    'PATIENCE_BONUS',
    // Phase 3 additions — append here:
    COINS_CHANGED:        'COINS_CHANGED',
    BUSH_WHACKED:         'BUSH_WHACKED',
    PLAYER_HOSPITALIZED:  'PLAYER_HOSPITALIZED',
    HOSPITAL_DISMISS:     'HOSPITAL_DISMISS',
    SHOP_OPEN:            'SHOP_OPEN',
    SHOP_PURCHASE:        'SHOP_PURCHASE',
    SHOP_CLOSE:           'SHOP_CLOSE',
    STREAK_BONUS:         'STREAK_BONUS',
} as const);

export type EventNames = typeof Events[keyof typeof Events];

export const GameEvents = new Phaser.Events.EventEmitter();
