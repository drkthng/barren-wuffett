// Offline balance simulation for spike 003b — plays whole lives with simple policies.
// Usage: node .planning/spikes/003b-snowball-idle/_sim.mjs
import * as E from './econ.js';

const DT = 0.1 / E.YEAR_SECONDS;            // 100 ms ticks, in years
const CRASH_AGES = [19, 33, 48, 66, 80];

function bestBuy(s) {
    // marginal income per dollar (includes milestone doubling + float on everything)
    let best = null;
    const base = E.incomePerYear(s);
    E.BUSINESSES.forEach((b, i) => {
        if (!E.unlocked(s, i)) return;
        const p = E.price(s, b);
        if (p > s.cash) return;
        s.owned[b.id] += 1;
        const gain = E.incomePerYear(s) - base;
        s.owned[b.id] -= 1;
        const score = gain / p;
        if (!best || score > best.score) best = { id: b.id, score };
    });
    return best;
}

function live(policy) {
    const s = E.newLife();
    const log = { firstBuy: null, tierAt: {} };
    let realT = 0;
    while (s.age < E.END_AGE) {
        realT += 0.1;
        if (CRASH_AGES.some(a => s.age >= a && s.age < a + DT * 1.01)) s.saleUntil = s.age + E.CRASH_YEARS;
        // tapping: 4/s for the first minute, 1/s after (an engaged human), none for 'notap'
        if (policy !== 'notap') {
            const rate = policy === 'lazy' || policy === 'saver' ? (realT < 30 ? 2 : 0.3) : realT < 60 ? 4 : 1;
            if (Math.random() < rate * 0.1) E.tap(s);
        }
        // 'lazy' = a casual human: checks the shop every 5 s, taps 2/s for 30 s then rarely
        if (policy === 'lazy' && !(realT % 5 < 0.1)) { E.tick(s, DT); continue; }
        if (policy === 'saver') {
            if (realT % 2 < 0.1) {
                for (;;) {
                    const opts = E.BUSINESSES.map((b, i) => ({ b, i, p: E.price(s, b) })).filter(o => E.unlocked(s, o.i) && o.p <= s.cash);
                    if (!opts.length) break;
                    const top = opts[opts.length - 1];
                    E.buy(s, top.b.id);
                    if (log.firstBuy === null) log.firstBuy = realT;
                    if (!(top.b.id in log.tierAt)) log.tierAt[top.b.id] = Math.round(realT);
                }
            }
            E.tick(s, DT); continue;
        }
        if (policy !== 'hoard') {
            let b;
            while ((b = bestBuy(s))) {
                E.buy(s, b.id);
                if (log.firstBuy === null) log.firstBuy = realT;
                if (!(b.id in log.tierAt)) log.tierAt[b.id] = Math.round(realT);
            }
        }
        E.tick(s, DT);
    }
    return { s, log, realT };
}

for (const policy of ['greedy', 'lazy', 'saver', 'notap']) {
    const { s, log, realT } = live(policy);
    const nw = E.netWorth(s);
    console.log(`\n${policy.toUpperCase()}  life=${realT.toFixed(0)}s  net worth at 90 = ${E.money(nw)}  rank=${E.rankFor(nw)}  income=${E.money(E.incomePerYear(s))}/yr`);
    console.log('  milestones:', s.milestones.map(m => `${m.label}@${m.age}`).join('  ') || 'none');
    console.log('  first buy at', log.firstBuy?.toFixed(1), 's · new tier at (s):', JSON.stringify(log.tierAt));
    console.log('  owned:', JSON.stringify(s.owned));
    console.log(`  taps ${s.taps} → ${E.money(s.tapCash)} from tapping; $1 at age 10 became ×${(nw / s.dollarAt10).toExponential(2)}`);
}
