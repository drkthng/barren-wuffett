/**
 * InputBus — action enum stub (Phase 1)
 *
 * Defines the canonical set of game actions. Bindings (keyboard + VirtualJoystick)
 * are wired in Phase 2 when the first playable scene ships.
 */

export enum Action {
    MOVE_UP    = 'MOVE_UP',
    MOVE_DOWN  = 'MOVE_DOWN',
    MOVE_LEFT  = 'MOVE_LEFT',
    MOVE_RIGHT = 'MOVE_RIGHT',
    INTERACT   = 'INTERACT',
    PAUSE      = 'PAUSE',
}
