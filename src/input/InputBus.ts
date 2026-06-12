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
}

const activeActions = new Set<Action>();

export const InputBus = {
    isActive: (action: Action): boolean => activeActions.has(action),

    update(
        joystick: { up: boolean; down: boolean; left: boolean; right: boolean } | null,
        cursors: Phaser.Types.Input.Keyboard.CursorKeys | null
    ): void {
        activeActions.clear();
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
