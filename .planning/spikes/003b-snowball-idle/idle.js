/**
 * idle.js — Spike 003b "Barren's Snowball": the phone UI around econ.js.
 *
 * Old Barren narrates his own life (age 6 → 90 in ~5 minutes): tap to hustle, buy businesses,
 * reinvest. Mr. Market interrupts with a seeded schedule of offers (same life for everyone per
 * day): crash sales, euphoric buyouts, a crypto tip and a "cheap" textile mill. The clock pauses
 * while an offer is open. Ends with a shareable net worth.
 *
 * Test hooks: ?date=YYYY-MM-DD  ?speed=N  ?bot=saver (autopilot)
 * Observability: window.__IDLE__ (state, events, LOG) + "export log" on the end screen.
 */
import * as E from './econ.js';
import { SPRITES, dataURL } from '../002-old-barren-cast/cast.js';
import { ICONS } from './icons.js';

const HANDLE = '@yourhandle';
const GAME_URL = 'https://barren-wuffett.pages.dev';
const EPOCH = Date.UTC(2026, 9, 1);
const params = new URLSearchParams(location.search);
const SPEED = Math.max(0.25, Number(params.get('speed') || 1));
const BOT = params.get('bot');
const DATE = params.get('date') || new Date().toISOString().slice(0, 10);
const DAILY_NO = Math.floor((Date.parse(`${DATE}T00:00:00Z`) - EPOCH) / 86400000) + 1;

// ── seeded RNG (same life for everyone on a given day) ──────────────────────
function hashStr(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function buildLife(dateStr) {
    // every life gets the same cast of offers, in a seeded order: it opens with a crash (teaches the
    // sale), buyouts only come once there is something worth buying out (age >= 30)
    const rnd = mulberry32(hashStr(`barren-life:${dateStr}`));
    const slots = [16, 26, 36, 46, 56, 66, 78].map(a => +(a + rnd() * 3).toFixed(1));
    const rest = ['crash', 'crash', 'bubble', 'bubble', 'tip', 'textile'];
    for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
    if (rest[0] === 'bubble') { const k = rest.findIndex(t => t !== 'bubble'); [rest[0], rest[k]] = [rest[k], rest[0]]; }
    const types = ['crash', ...rest];
    const events = slots.map((age, i) => ({ age, type: types[i], lucky: rnd() < 0.25 }));
    return { events, fingerprint: hashStr(JSON.stringify(events)).toString(16) };
}

// ── narration (old Barren looking back) ─────────────────────────────────────
const SAY = {
    start: 'I was six when I sold my first pack of gum. Tap the green button. Go on.',
    gum: 'My first business! It pays me while I sleep. That is the whole trick.',
    fizz: 'Six Cherry Fizzes for a quarter, sold one by one. Margins, kid.',
    paper: 'Five hundred papers before school. Then I bought more routes.',
    pinball: 'A machine in every barbershop. They paid in nickels. Lots of nickels.',
    farm: 'I bought dirt. Dirt does not go out of style.',
    insure: 'Insurance! People pay you now, claims come later. That money is called float.',
    candy: 'A box of chocolates people buy every Christmas. I raise the price a little each year.',
    rail: 'Nobody is building a second railroad next to mine.',
    power: 'People pay the light bill before anything else.',
    pear: 'I said I would never buy tech. Then I bought a pear.',
    '$1,000': 'A thousand dollars! I told everyone I would be a millionaire by 35.',
    '$1 MILLION': 'A million. I celebrated with a Cherry Fizz. Then I reinvested the change.',
    '$1 BILLION': 'A billion. Still live in the same house.',
    '$100 BILLION': 'Mr. Market keeps asking for my secret. It is patience. He hates that.',
    milestone10: 'Ten of them! When you own ten, each one earns double. Scale is a moat.',
    idleCash: 'Cash is piling up. Patience is fine, but money should work when the price is right.',
    end: 'Ninety. They made me chairman emeritus. I am keeping the Cherry Fizz.',
};
const HUSTLE = {
    none: 'SELL GUM', gum: 'SELL GUM', fizz: 'SELL FIZZ', paper: 'DELIVER PAPERS', pinball: 'POLISH PINBALL',
    farm: 'PLOW A FIELD', insure: 'SELL A POLICY', candy: 'BOX CHOCOLATES', rail: 'SHOVEL COAL',
    power: 'READ REPORTS', pear: 'READ REPORTS',
};

// ── state ───────────────────────────────────────────────────────────────────
const LOG = [];
const log = (cat, data = {}) => LOG.push({ iso: new Date().toISOString(), cat, ...data });
const life = buildLife(DATE);
let s, nextEvent, paused = true, result = null, saidIdle = 0;
let stats;

const $ = (id) => document.getElementById(id);
for (const el of document.querySelectorAll('.handle')) el.textContent = HANDLE;
$('n-face').src = dataURL(SPRITES.barren, 2);
$('t-face').src = dataURL(SPRITES.barren, 4);
$('t-daily').textContent = `Daily Life #${DAILY_NO} · same Mr. Market for everyone today`;

function say(text, face = 'barren') {
    $('n-text').textContent = text;
    $('n-face').src = dataURL(SPRITES[face], 2);
}

// ── business rows (built once, updated in place) ────────────────────────────
const rows = E.BUSINESSES.map((b, i) => {
    const el = document.createElement('div');
    el.className = 'row';
    el.innerHTML = `<img alt="" /><div class="info"><div class="name"></div><div class="meta"></div><div class="blurb"></div></div><button></button>`;
    el.querySelector('img').src = dataURL(ICONS[b.id], 4);
    el.querySelector('button').addEventListener('click', () => buyBiz(b.id));
    $('biz').append(el);
    return { b, i, el, name: el.querySelector('.name'), meta: el.querySelector('.meta'), blurb: el.querySelector('.blurb'), btn: el.querySelector('button') };
});

function buyBiz(id) {
    if (paused) return;
    const b = E.BUSINESSES.find(x => x.id === id);
    const before = s.owned[id];
    const p = E.price(s, b);
    if (!E.buy(s, id)) return;
    if (E.onSale(s)) { stats.saleBuys += 1; stats.crashBought.add(stats.crashes); }
    log('buy', { id, price: p, owned: s.owned[id], age: +s.age.toFixed(1) });
    const row = rows.find(r => r.b.id === id);
    row.el.classList.remove('pop'); void row.el.offsetWidth; row.el.classList.add('pop');
    if (before === 0 && SAY[id]) say(SAY[id]);
    else if (s.owned[id] === 10) say(SAY.milestone10);
    saidIdle = s.age;
    render(true);
}

function hustle(ev) {
    if (paused) return;
    const v = E.tap(s);
    const p = document.createElement('div');
    p.className = 'plus';
    p.textContent = `+${E.money(v)}`;
    const x = ev && ev.clientX ? ev.clientX : innerWidth / 2;
    const y = ev && ev.clientY ? ev.clientY : innerHeight - 90;
    Object.assign(p.style, { left: `${x - 30 + Math.random() * 30}px`, top: `${y - 40}px` });
    document.body.append(p);
    setTimeout(() => p.remove(), 800);
    render(true);
}
$('hustle').addEventListener('pointerdown', (e) => { e.preventDefault(); hustle(e); });

// ── rendering ───────────────────────────────────────────────────────────────
const chart = $('chart'); const cx = chart.getContext('2d');
function drawChart() {
    const w = chart.width, h = chart.height;
    cx.clearRect(0, 0, w, h);
    cx.strokeStyle = '#2f2b3f'; cx.lineWidth = 2;
    for (let d = 0; d <= 12; d += 3) { const y = h - 8 - (d / 12) * (h - 16); cx.beginPath(); cx.moveTo(0, y); cx.lineTo(w, y); cx.stroke(); }
    cx.fillStyle = '#6d6785'; cx.font = '16px "Pixelify Sans"';
    cx.fillText('$1', 6, h - 12); cx.fillText('$1M', 6, h - 8 - 0.5 * (h - 16) - 4); cx.fillText('$1T', 6, 22);
    const pts = s.history.concat([[s.age, E.netWorth(s)]]);
    cx.strokeStyle = '#ffd166'; cx.lineWidth = 4; cx.beginPath();
    pts.forEach(([age, nw], i) => {
        const x = 50 + ((age - E.START_AGE) / (E.END_AGE - E.START_AGE)) * (w - 60);
        const y = h - 8 - (Math.log10(Math.max(1, nw)) / 12) * (h - 16);
        if (i === 0) cx.moveTo(x, y); else cx.lineTo(x, y);
    });
    cx.stroke();
}

let lastRender = 0;
function render(force = false) {
    const now = performance.now();
    if (!force && now - lastRender < 100) return;
    lastRender = now;
    const nw = E.netWorth(s);
    $('s-age').textContent = Math.floor(s.age);
    $('s-nw').textContent = E.money(nw);
    $('s-cash').textContent = `cash ${E.money(s.cash)}`;
    $('s-inc').textContent = `+${E.money(E.incomePerYear(s))}/yr`;
    $('s-life').style.width = `${((s.age - E.START_AGE) / (E.END_AGE - E.START_AGE)) * 100}%`;
    const size = Math.max(20, Math.min(74, 18 + 5 * Math.log10(Math.max(1, nw))));
    Object.assign($('ball').style, { width: `${size}px`, height: `${size}px` });
    $('sale').style.display = E.onSale(s) ? 'block' : 'none';
    let teaser = false;
    for (const r of rows) {
        const open = E.unlocked(s, r.i);
        const show = open || (!teaser && (teaser = true));
        r.el.style.display = show ? 'flex' : 'none';
        r.el.classList.toggle('locked', !open);
        if (!show) continue;
        const own = s.owned[r.b.id];
        if (!open) {
            r.name.textContent = '???';
            r.meta.textContent = `Unlocks as your snowball grows`;
            r.blurb.textContent = '';
            r.btn.disabled = true; r.btn.textContent = 'LOCKED';
            r.el.querySelector('img').style.filter = 'brightness(0)';
            continue;
        }
        r.el.querySelector('img').style.filter = '';
        r.name.innerHTML = `${r.b.name}${own ? `<span class="own">×${own}</span>` : ''}`;
        const next = own < 10 ? `×2 at 10` : own < 25 ? `×3 at 25` : 'max';
        r.meta.textContent = `+${E.money(E.unitIncome(s, r.b))}/yr each · ${next}`;
        r.blurb.textContent = r.b.blurb;
        const p = E.price(s, r.b);
        r.btn.disabled = s.cash < p || paused;
        r.btn.innerHTML = E.onSale(s)
            ? `<span class="was">${E.money(p / E.CRASH_DISCOUNT)}</span>${E.money(p)}`
            : `BUY<br/>${E.money(p)}`;
    }
    const top = [...E.BUSINESSES].reverse().find(b => s.owned[b.id] > 0);
    $('hustle').textContent = `${HUSTLE[top ? top.id : 'none']} +${E.money(E.tapValue(s))}`;
    drawChart();
}

// ── Mr. Market's offers ─────────────────────────────────────────────────────
function openEvent(ev) {
    paused = true;
    const best = [...E.BUSINESSES].reverse().find(b => s.owned[b.id] > 0);
    let cfg;
    if (ev.type === 'crash') {
        cfg = {
            face: 'marketPanic', title: 'PANIC! THE MARKET CRASHED',
            text: 'Mr. Market is terrified. He will sell you ANY business at 40% off for the next 3 years.',
            a: 'GO SHOPPING', b: null,
            onA: () => { s.saleUntil = s.age + E.CRASH_YEARS; stats.crashes += 1; say('Everyone is panicking. Be greedy when others are fearful.'); },
        };
    } else if (ev.type === 'bubble' && best) {
        const offer = E.unitIncome(s, best) * E.EARNINGS_MULTIPLE * 5;
        cfg = {
            face: 'marketGreed', title: 'GREED! A BUYOUT OFFER',
            text: `Mr. Market is euphoric. He wants one of your ${best.name} — and offers ${E.money(offer)}, five times what it is worth.`,
            a: `SELL ONE (+${E.money(offer)})`, b: 'HOLD FOREVER',
            onA: () => { s.owned[best.id] -= 1; s.cash += offer; stats.sold += 1; say('Sometimes he pays far too much. Take it and smile.'); },
            onB: () => { stats.held += 1; say('Our favorite holding period is forever.'); },
        };
    } else if (ev.type === 'tip') {
        const stake = s.cash * 0.25;
        cfg = {
            face: 'cryptoBro', title: 'A HOT TIP',
            text: `Bro! Put a quarter of your cash (${E.money(stake)}) into FIZZCOIN. It is going to the moon!`,
            a: 'APE IN', b: 'NO THANKS',
            onA: () => {
                s.cash -= stake; stats.aped = true;
                if (ev.lucky) { s.cash += stake * 3; say('Fizzcoin tripled. Do not get used to it.'); }
                else say('Fizzcoin went to zero by lunch. The moon was a rug.');
            },
            onB: () => { stats.declinedTip = true; say('Charlie said he would sooner eat his hat. Good call.', 'charlie'); },
        };
    } else {
        const cost = Math.max(10, s.cash * 0.15);
        cfg = {
            face: 'marketNeutral', title: 'A "BARGAIN" MILL',
            text: `Mr. Market offers a textile mill for HALF its book value: just ${E.money(cost)}. Cheap!`,
            a: `BUY THE MILL`, b: 'PASS',
            onA: () => {
                s.cash -= cost; stats.mill = true;
                s.drag.push({ until: s.age + 20, perYear: Math.max(5, E.incomePerYear(s) * 0.04) });
                say('It took me twenty years to get out of that mill. A cheap bad business is still a bad business.');
            },
            onB: () => { stats.passedMill = true; say('Smart. Better a wonderful business at a fair price.'); },
        };
    }
    $('ev-face').src = dataURL(SPRITES[cfg.face], 4);
    $('ev-title').textContent = cfg.title;
    $('ev-text').textContent = cfg.text;
    $('ev-a').textContent = cfg.a;
    $('ev-b').textContent = cfg.b ?? '';
    $('ev-b').style.display = cfg.b ? 'block' : 'none';
    const close = (fn, choice) => { fn?.(); log('event', { type: ev.type, choice, age: +s.age.toFixed(1) }); $('event').classList.remove('show'); paused = false; render(true); };
    $('ev-a').onclick = () => close(cfg.onA, 'a');
    $('ev-b').onclick = () => close(cfg.onB, 'b');
    $('event').classList.add('show');
    render(true);
    if (BOT && !ev.debug) setTimeout(() => (ev.type === 'bubble' && s.age > 65 ? $('ev-a') : ev.type === 'crash' ? $('ev-a') : $('ev-b')).click(), 300 / SPEED);
}

// ── loop ────────────────────────────────────────────────────────────────────
let last = performance.now(), acc = 0, botT = 0;
function frame(now) {
    const dt = Math.min(0.25, (now - last) / 1000); last = now;
    if (!paused && s && !result) {                     // a finished life never ticks again
        acc += dt * SPEED;
        while (acc >= 0.1 && !paused) {
            acc -= 0.1;
            for (const m of E.tick(s, 0.1 / E.YEAR_SECONDS)) { say(SAY[m.label]); log('milestone', m); }
            if (BOT) runBot(0.1);
            if (nextEvent < life.events.length && s.age >= life.events[nextEvent].age) openEvent(life.events[nextEvent++]);
            if (s.cash > E.incomePerYear(s) * 6 && s.age - saidIdle > 10 && s.age > 20) { say(SAY.idleCash); saidIdle = s.age; }
            if (s.age >= E.END_AGE) { finish(); break; }
        }
        render();
    }
    requestAnimationFrame(frame);
}

function runBot(dtReal) {
    botT += dtReal;
    const tapRate = botT < 30 ? 2 : 0.3;
    if (Math.random() < tapRate * dtReal) hustle();
    if (botT % 2 < dtReal) {
        for (;;) {
            const opts = rows.filter(r => E.unlocked(s, r.i) && E.price(s, r.b) <= s.cash);
            if (!opts.length) break;
            buyBiz(opts[opts.length - 1].b.id);
        }
    }
}

function finish() {
    paused = true;
    const nw = E.netWorth(s);
    const m = (label) => s.milestones.find(x => x.label === label);
    result = {
        nw, rank: E.rankFor(nw), dollar: nw / Math.max(1, s.dollarAt10 ?? 1),
        million: m('$1 MILLION')?.age ?? null, billion: m('$1 BILLION')?.age ?? null,
        stats: { ...stats, crashBought: stats.crashBought.size },
    };
    say(SAY.end);
    log('end', { nw: Math.round(nw), rank: result.rank, stats: result.stats });
    $('e-face').src = dataURL(SPRITES.barren, 4);
    $('e-nw').textContent = E.money(nw);
    $('e-rank').textContent = result.rank;
    $('e-dollar').textContent = `Every dollar you had at age 10 became ${E.money(result.dollar)}.`;
    const bits = [];
    if (result.million) bits.push(`first million at ${result.million}`);
    if (result.billion) bits.push(`first billion at ${result.billion}`);
    bits.push(`bought into ${stats.crashBought.size} of ${stats.crashes} crashes`, `${stats.held} buyouts refused`);
    if (stats.declinedTip) bits.push('said no to Fizzcoin');
    if (stats.mill) bits.push('bought the mill (oops)');
    $('e-stats').textContent = bits.join(' · ');
    setTimeout(() => $('end').classList.add('show'), 600 / SPEED);
}

export function shareText(r) {
    const lines = [`Barren's Snowball ⛄ · Daily Life #${DAILY_NO}`, `Gum stand → ${E.money(r.nw)} by age 90 · ${r.rank}`];
    const m = [];
    if (r.million) m.push(`💵 $1M at ${r.million}`);
    if (r.billion) m.push(`🏦 $1B at ${r.billion}`);
    if (m.length) lines.push(m.join(' · '));
    const d = [`bought ${r.stats.crashBought} of ${r.stats.crashes} crashes`, `refused ${r.stats.held} buyouts`];
    if (r.stats.declinedTip) d.push('no Fizzcoin');
    lines.push(d.join(' · '), `made by ${HANDLE}`);
    return lines.join('\n');
}

function toast(msg) { const t = $('toast'); t.textContent = msg; t.style.display = 'block'; clearTimeout(toast.h); toast.h = setTimeout(() => { t.style.display = 'none'; }, 1800); }
async function share() {
    if (!result) return;
    const text = shareText(result);
    log('share', {});
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        try { await navigator.share({ text, url: GAME_URL }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(`${text}\n${GAME_URL}`); toast('Copied!'); } catch { /* ignore */ }
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(GAME_URL)}`, '_blank', 'noopener');
}

function start() {
    s = E.newLife(); nextEvent = 0; result = null; saidIdle = 0; botT = 0;
    stats = { crashes: 0, saleBuys: 0, crashBought: new Set(), held: 0, sold: 0, declinedTip: false, aped: false, mill: false, passedMill: false };
    $('title').classList.remove('show'); $('end').classList.remove('show');
    say(SAY.start);
    paused = false; last = performance.now(); acc = 0;
    log('life-start', { date: DATE, daily: DAILY_NO, fingerprint: life.fingerprint, bot: BOT || null });
    render(true);
}
$('play').addEventListener('click', start);
$('again').addEventListener('click', start);
$('share').addEventListener('click', share);
$('about-link').addEventListener('click', (e) => { e.preventDefault(); $('about').classList.add('show'); });
$('about-close').addEventListener('click', () => $('about').classList.remove('show'));
$('export').addEventListener('click', (e) => {
    e.preventDefault();
    const blob = new Blob([JSON.stringify({ date: DATE, fingerprint: life.fingerprint, result, log: LOG }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `barren-snowball-${DATE}.json`; a.click();
});

s = E.newLife(); stats = { crashes: 0, saleBuys: 0, crashBought: new Set(), held: 0, sold: 0, declinedTip: false, aped: false, mill: false, passedMill: false };
say(SAY.start);
render(true);
window.__IDLE__ = { life, LOG, DATE, start, debugEvent: (type) => openEvent({ type, lucky: false, debug: true }), get state() { return s; }, get result() { return result; }, get paused() { return paused; }, shareText: () => (result ? shareText(result) : null) };
requestAnimationFrame(frame);
