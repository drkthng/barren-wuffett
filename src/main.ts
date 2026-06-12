import { StartGame } from './game/main';

declare global {
    // Exposed for headless smoke tests (smoke.mjs / smoke2.mjs) — not used by game code.
    interface Window { __BW_GAME__?: unknown; }
}

document.addEventListener('DOMContentLoaded', () => {
    window.__BW_GAME__ = StartGame('game-container');
});
