// Balance simulation for spike 003c: how long do runs last, which endings happen?
// Usage: node .planning/spikes/003c-swipe-satire/_sim.mjs
import * as C from './cards.js';

function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const policies = {
    random: (run, card, r) => (r() < 0.5 ? 'left' : 'right'),
    // a thoughtful player: keep every meter as close to the middle as possible
    balanced: (run, card) => {
        const score = (side) => Math.max(...C.METERS.map(m => Math.abs(C.clamp(run.meters[m.id] + Math.round((card[side].fx[m.id] || 0) * C.FX_SCALE) + (C.DRIFT[m.id] || 0)) - 50)));
        return score('left') <= score('right') ? 'left' : 'right';
    },
    // a "value purist": always the patient/no option (left), shows one-note play fails
    alwaysLeft: () => 'left',
    alwaysRight: () => 'right',
};

for (const [name, pick] of Object.entries(policies)) {
    const endings = {}; let cards = 0; const N = 2000;
    for (let i = 0; i < N; i++) {
        const r = rng(i + 1); const run = C.newRun();
        while (!run.ending) { const card = C.nextCard(run, r); C.choose(run, card, pick(run, card, r)); }
        endings[run.ending] = (endings[run.ending] || 0) + 1; cards += run.choices;
    }
    const top = Object.entries(endings).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(100 * v / N).toFixed(0)}%`).join(', ');
    console.log(`${name.padEnd(11)} avg ${(cards / N).toFixed(1)} cards (${(30 + 2 * cards / N).toFixed(0)} y.o.) · ${top}`);
}
