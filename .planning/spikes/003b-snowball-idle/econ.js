/**
 * econ.js — the pure economy for Spike 003b "Barren's Snowball" (no DOM; also run by _sim.mjs).
 *
 * One life = age 6 → 90. A year passes every YEAR_SECONDS of real time (×speed in tests).
 * Income per year = Σ units × base income × milestone multiplier (×2 at 10 owned, ×3 at 25)
 *                   × float multiplier (insurers boost everything, diminishing toward +60% — other people's money).
 * Prices grow per unit owned; a Mr. Market crash makes everything 40% off for a few years.
 * Net worth = cash + every business valued at 8× its yearly earnings.
 */

export const YEAR_SECONDS = 3.5;          // 84 years ≈ 4.9 minutes
export const START_AGE = 6;
export const END_AGE = 90;
export const EARNINGS_MULTIPLE = 8;

export const BUSINESSES = [
    { id: 'gum',     name: 'Gum Stand',           cost: 4,           income: 3.2,         growth: 1.13, blurb: 'A nickel profit a pack.' },
    { id: 'fizz',    name: 'Cherry Fizz 6-Packs', cost: 30,          income: 20,          growth: 1.13, blurb: 'Buy six for a quarter, sell for a nickel each.' },
    { id: 'paper',   name: 'Paper Route',         cost: 220,         income: 120,         growth: 1.13, blurb: '500 papers before school.' },
    { id: 'pinball', name: 'Pinball Machines',    cost: 1_600,       income: 780,         growth: 1.13, blurb: 'Every barbershop needs one.' },
    { id: 'farm',    name: 'Farmland',            cost: 12_000,      income: 5_200,       growth: 1.13, blurb: 'Dirt is a durable asset.' },
    { id: 'insure',  name: 'Insurance Co.',       cost: 95_000,      income: 34_000,      growth: 1.13, blurb: 'FLOAT: boosts ALL income (up to +60%).', float: true },
    { id: 'candy',   name: 'Candy Company',       cost: 800_000,     income: 260_000,     growth: 1.13, blurb: 'Raise prices every Christmas.' },
    { id: 'rail',    name: 'Railroad',            cost: 7_000_000,   income: 1_900_000,   growth: 1.13, blurb: 'Nobody builds a second one.' },
    { id: 'power',   name: 'Power Company',       cost: 60_000_000,  income: 13_000_000,  growth: 1.13, blurb: 'People pay the light bill first.' },
    { id: 'pear',    name: 'Pear Phones',         cost: 500_000_000, income: 90_000_000,  growth: 1.13, blurb: 'Late to tech. Right on time.' },
];

export const FLOAT_BONUS = 0.04;
export const CRASH_DISCOUNT = 0.6;
export const CRASH_YEARS = 3;

export function newLife() {
    return {
        age: START_AGE, cash: 0, owned: Object.fromEntries(BUSINESSES.map(b => [b.id, 0])),
        saleUntil: -1, drag: [], taps: 0, tapCash: 0, earned: 0,
        dollarAt10: null, milestones: [], decisions: [], history: [[START_AGE, 0]],
    };
}

export const milestoneMult = (n) => (n >= 25 ? 3 : n >= 10 ? 2 : 1);
// float has diminishing returns (approaches +100%): mass-buying insurers was a degenerate strategy
export const floatMult = (s) => 1 + 0.6 * (1 - Math.pow(1 - FLOAT_BONUS, s.owned.insure));
export const onSale = (s) => s.age < s.saleUntil;

export function unitIncome(s, b) {
    return b.income * milestoneMult(s.owned[b.id]) * floatMult(s);
}
export function incomePerYear(s) {
    let total = 0;
    for (const b of BUSINESSES) total += s.owned[b.id] * unitIncome(s, b);
    for (const d of s.drag) if (s.age < d.until) total -= d.perYear;   // e.g. the textile mill
    return total;
}
export function price(s, b) {
    return Math.ceil(b.cost * Math.pow(b.growth, s.owned[b.id]) * (onSale(s) ? CRASH_DISCOUNT : 1));
}
export function netWorth(s) {
    let v = s.cash;
    for (const b of BUSINESSES) v += s.owned[b.id] * unitIncome(s, b) * EARNINGS_MULTIPLE;
    return Math.max(0, v);
}
export const tapValue = (s) => Math.max(1, 1 + 0.004 * incomePerYear(s));
/** a business is visible once you could almost afford the first one, or own the previous tier */
export function unlocked(s, i) {
    if (i === 0) return true;
    const prev = BUSINESSES[i - 1];
    return s.owned[prev.id] > 0 || s.earned >= BUSINESSES[i].cost * 0.4;
}

export function buy(s, id) {
    const b = BUSINESSES.find(x => x.id === id);
    const p = price(s, b);
    if (s.cash < p) return false;
    s.cash -= p; s.owned[id] += 1;
    return true;
}
export function tap(s) {
    const v = tapValue(s);
    s.cash += v; s.earned += v; s.taps += 1; s.tapCash += v;
    return v;
}
/** advance by dtYears; returns milestones crossed */
export function tick(s, dtYears) {
    const inc = incomePerYear(s) * dtYears;
    s.cash = Math.max(0, s.cash + inc);
    if (inc > 0) s.earned += inc;
    const before = s.age;
    s.age = Math.min(END_AGE, s.age + dtYears);
    if (Math.floor(s.age) !== Math.floor(before)) s.history.push([Math.floor(s.age), netWorth(s)]);
    if (s.dollarAt10 === null && s.age >= 10) s.dollarAt10 = Math.max(1, netWorth(s));
    const crossed = [];
    for (const [label, v] of [['$1,000', 1e3], ['$1 MILLION', 1e6], ['$1 BILLION', 1e9], ['$100 BILLION', 1e11]]) {
        if (netWorth(s) >= v && !s.milestones.find(m => m.label === label)) {
            const m = { label, age: Math.floor(s.age) }; s.milestones.push(m); crossed.push(m);
        }
    }
    return crossed;
}

export const RANKS = [
    [1e11, 'RICHER THAN MR. MARKET'], [1e10, 'THE ORACLE OF OHAMA'], [1e8, 'CAPITAL ALLOCATOR'],
    [1e6, 'LOCAL TYCOON'], [0, 'PAPER ROUTE PRO'],
];
export const rankFor = (nw) => RANKS.find(([min]) => nw >= min)[1];

export function money(v) {
    const sign = v < 0 ? '-' : ''; v = Math.abs(v);
    for (const [s, d] of [['T', 1e12], ['B', 1e9], ['M', 1e6], ['K', 1e4]]) {
        if (v >= d) { const n = v / (s === 'K' ? 1e3 : d); return `${sign}$${n.toFixed(n >= 100 ? 0 : n >= 10 ? 1 : 2)}${s}`; }
    }
    return `${sign}$${v >= 100 ? Math.round(v).toLocaleString('en-US') : v.toFixed(v < 10 ? 2 : 0)}`;
}
