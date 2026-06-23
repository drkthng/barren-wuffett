/**
 * InputBus — unified input abstraction (Phase 2)
 *
 * Action enum is unchanged from Phase 1.
 * Phase 2 adds the activeActions Set and InputBus export object:
 *   - isActive(action)   — polled by entities each update tick
 *   - update(joystick, cursors) — called by OverworldScene.update()
 *   - setAction(action, active) — called from pointer/key events (INTERACT, PAUSE)
 *
 * The joystick parameter is typed structurally so tests pass plain stubs
 * (no rex plugin dependency in this module).
 *
 * Pattern: PATTERNS.md InputBus.ts (extend existing file)
 */

export enum Action {
    MOVE_UP    = 'MOVE_UP',
    MOVE_DOWN  = 'MOVE_DOWN',
    MOVE_LEFT  = 'MOVE_LEFT',
    MOVE_RIGHT = 'MOVE_RIGHT',
    INTERACT   = 'INTERACT',
    PAUSE      = 'PAUSE',
    WHACK      = 'WHACK',   // Phase 3 — pulse action (setAction driven, not joystick/cursors)
}

const activeActions = new Set<Action>();

/**
 * The four continuous movement actions rebuilt from joystick/cursors each frame.
 * Pulse actions (WHACK, INTERACT, PAUSE) are set by event handlers between frames
 * and must survive update() so the OverworldScene poll can read them; only these
 * continuous movement actions are cleared and rebuilt here.
 */
const MOVEMENT_ACTIONS = [
    Action.MOVE_UP,
    Action.MOVE_DOWN,
    Action.MOVE_LEFT,
    Action.MOVE_RIGHT,
] as const;

export const InputBus = {
    isActive: (action: Action): boolean => activeActions.has(action),

    update(
        joystick: { up: boolean; down: boolean; left: boolean; right: boolean } | null,
        cursors: Phaser.Types.Input.Keyboard.CursorKeys | null
    ): void {
        // Clear only movement actions — pulse actions (WHACK/INTERACT/PAUSE) set by
        // event handlers between frames must survive until the OverworldScene poll reads them.
        for (const mv of MOVEMENT_ACTIONS) activeActions.delete(mv);
        if (joystick) {
            if (joystick.up)    activeActions.add(Action.MOVE_UP);
            if (joystick.down)  activeActions.add(Action.MOVE_DOWN);
            if (joystick.left)  activeActions.add(Action.MOVE_LEFT);
            if (joystick.right) activeActions.add(Action.MOVE_RIGHT);
        }
        if (cursors) {
            if (cursors.up.isDown)    activeActions.add(Action.MOVE_UP);
            if (cursors.down.isDown)  activeActions.add(Action.MOVE_DOWN);
            if (cursors.left.isDown)  activeActions.add(Action.MOVE_LEFT);
            if (cursors.right.isDown) activeActions.add(Action.MOVE_RIGHT);
        }
    },

    setAction: (action: Action, active: boolean): void => {
        if (active) activeActions.add(action);
        else        activeActions.delete(action);
    },
};
