/**
 * Wave 0: InputBus wiring tests (GAME-01)
 *
 * Tests InputBus.update() binding logic — automated proxy for:
 *   GAME-01: joystick and keyboard sources OR together into activeActions
 *
 * vitest environment: node — no Phaser dependency (InputBus is plain TS).
 * Joystick param is a plain object stub (no rex import needed).
 * Cursor stub mimics Phaser CursorKeys structure.
 *
 * Pattern: PATTERNS.md input-bus.test.ts (analog: audio-persistence.test.ts)
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('InputBus — joystick input', () => {
    beforeEach(() => { vi.resetModules(); });
    afterEach(() => { vi.resetModules(); });

    it('isActive(MOVE_UP) is true after joystick.up = true', async () => {
        const { InputBus, Action } = await import('../src/input/InputBus.js');
        const joystick = { up: true, down: false, left: false, right: false };
        InputBus.update(joystick, null);
        expect(InputBus.isActive(Action.MOVE_UP)).toBe(true);
        expect(InputBus.isActive(Action.MOVE_DOWN)).toBe(false);
    });

    it('isActive(MOVE_DOWN) is true after joystick.down = true', async () => {
        const { InputBus, Action } = await import('../src/input/InputBus.js');
        InputBus.update({ up: false, down: true, left: false, right: false }, null);
        expect(InputBus.isActive(Action.MOVE_DOWN)).toBe(true);
        expect(InputBus.isActive(Action.MOVE_UP)).toBe(false);
    });

    it('isActive(MOVE_LEFT) is true after joystick.left = true', async () => {
        const { InputBus, Action } = await import('../src/input/InputBus.js');
        InputBus.update({ up: false, down: false, left: true, right: false }, null);
        expect(InputBus.isActive(Action.MOVE_LEFT)).toBe(true);
    });

    it('isActive(MOVE_RIGHT) is true after joystick.right = true', async () => {
        const { InputBus, Action } = await import('../src/input/InputBus.js');
        InputBus.update({ up: false, down: false, left: false, right: true }, null);
        expect(InputBus.isActive(Action.MOVE_RIGHT)).toBe(true);
    });
});

describe('InputBus — keyboard input', () => {
    beforeEach(() => { vi.resetModules(); });
    afterEach(() => { vi.resetModules(); });

    it('isActive(MOVE_LEFT) is true when cursors.left.isDown', async () => {
        const { InputBus, Action } = await import('../src/input/InputBus.js');
        const cursors = {
            up:    { isDown: false },
            down:  { isDown: false },
            left:  { isDown: true  },
            right: { isDown: false },
        } as unknown as Phaser.Types.Input.Keyboard.CursorKeys;
        InputBus.update(null, cursors);
        expect(InputBus.isActive(Action.MOVE_LEFT)).toBe(true);
    });

    it('keyboard and joystick sources OR together without conflict', async () => {
        const { InputBus, Action } = await import('../src/input/InputBus.js');
        // Joystick says UP, keyboard says RIGHT — both should be active
        const joystick = { up: true, down: false, left: false, right: false };
        const cursors = {
            up:    { isDown: false },
            down:  { isDown: false },
            left:  { isDown: false },
            right: { isDown: true  },
        } as unknown as Phaser.Types.Input.Keyboard.CursorKeys;
        InputBus.update(joystick, cursors);
        expect(InputBus.isActive(Action.MOVE_UP)).toBe(true);
        expect(InputBus.isActive(Action.MOVE_RIGHT)).toBe(true);
    });
});

describe('InputBus — clear semantics', () => {
    beforeEach(() => { vi.resetModules(); });
    afterEach(() => { vi.resetModules(); });

    it('update clears prior actions (all-false then isActive returns false)', async () => {
        const { InputBus, Action } = await import('../src/input/InputBus.js');
        // First, activate UP
        InputBus.update({ up: true, down: false, left: false, right: false }, null);
        expect(InputBus.isActive(Action.MOVE_UP)).toBe(true);
        // Then call with all false
        InputBus.update({ up: false, down: false, left: false, right: false }, null);
        expect(InputBus.isActive(Action.MOVE_UP)).toBe(false);
    });

    it('update(null, null) clears all actions', async () => {
        const { InputBus, Action } = await import('../src/input/InputBus.js');
        InputBus.update({ up: true, down: false, left: false, right: false }, null);
        InputBus.update(null, null);
        expect(InputBus.isActive(Action.MOVE_UP)).toBe(false);
    });
});

describe('InputBus — setAction (INTERACT / PAUSE)', () => {
    beforeEach(() => { vi.resetModules(); });
    afterEach(() => { vi.resetModules(); });

    it('setAction(INTERACT, true) makes isActive(INTERACT) true', async () => {
        const { InputBus, Action } = await import('../src/input/InputBus.js');
        InputBus.setAction(Action.INTERACT, true);
        expect(InputBus.isActive(Action.INTERACT)).toBe(true);
    });

    it('setAction(INTERACT, false) clears INTERACT', async () => {
        const { InputBus, Action } = await import('../src/input/InputBus.js');
        InputBus.setAction(Action.INTERACT, true);
        InputBus.setAction(Action.INTERACT, false);
        expect(InputBus.isActive(Action.INTERACT)).toBe(false);
    });
});

describe('InputBus — WHACK pulse (Phase 3, L1E-01)', () => {
    beforeEach(() => { vi.resetModules(); });
    afterEach(() => { vi.resetModules(); });

    it('setAction(WHACK, true) makes isActive(WHACK) true', async () => {
        const { InputBus, Action } = await import('../src/input/InputBus.js');
        InputBus.setAction(Action.WHACK, true);
        expect(InputBus.isActive(Action.WHACK)).toBe(true);
    });

    it('setAction(WHACK, false) clears WHACK', async () => {
        const { InputBus, Action } = await import('../src/input/InputBus.js');
        InputBus.setAction(Action.WHACK, true);
        InputBus.setAction(Action.WHACK, false);
        expect(InputBus.isActive(Action.WHACK)).toBe(false);
    });
});

describe('InputBus — WHACK pulse survives update() (regression guard, L1E-01)', () => {
    beforeEach(() => { vi.resetModules(); });
    afterEach(() => { vi.resetModules(); });

    it('GUARD: setAction(WHACK,true) then update(all-false,null) leaves WHACK active', async () => {
        // This is the regression guard: if update() ever reverts to activeActions.clear()
        // this case will fail, exposing the bug where J/touch does nothing.
        const { InputBus, Action } = await import('../src/input/InputBus.js');
        InputBus.setAction(Action.WHACK, true);
        InputBus.update({ up: false, down: false, left: false, right: false }, null);
        expect(InputBus.isActive(Action.WHACK)).toBe(true);
    });

    it('WHACK pulse survives update() that also processes keyboard movement', async () => {
        // update() must still do its movement job while preserving the WHACK pulse
        const { InputBus, Action } = await import('../src/input/InputBus.js');
        InputBus.setAction(Action.WHACK, true);
        const cursors = {
            up:    { isDown: false },
            down:  { isDown: false },
            left:  { isDown: true  },
            right: { isDown: false },
        } as unknown as Phaser.Types.Input.Keyboard.CursorKeys;
        InputBus.update({ up: false, down: false, left: false, right: false }, cursors);
        expect(InputBus.isActive(Action.WHACK)).toBe(true);
        expect(InputBus.isActive(Action.MOVE_LEFT)).toBe(true);
    });

    it('movement is still cleared by update() (fix does not over-preserve)', async () => {
        // Proves the fix did not break movement clearing
        const { InputBus, Action } = await import('../src/input/InputBus.js');
        InputBus.update({ up: true, down: false, left: false, right: false }, null);
        expect(InputBus.isActive(Action.MOVE_UP)).toBe(true);
        InputBus.update({ up: false, down: false, left: false, right: false }, null);
        expect(InputBus.isActive(Action.MOVE_UP)).toBe(false);
    });

    it('consume path: setAction(WHACK,false) after update() clears the pulse', async () => {
        // Proves the OverworldScene poll can consume the WHACK pulse via setAction(WHACK,false)
        const { InputBus, Action } = await import('../src/input/InputBus.js');
        InputBus.setAction(Action.WHACK, true);
        InputBus.update({ up: false, down: false, left: false, right: false }, null);
        expect(InputBus.isActive(Action.WHACK)).toBe(true);
        InputBus.setAction(Action.WHACK, false);
        expect(InputBus.isActive(Action.WHACK)).toBe(false);
    });
});
