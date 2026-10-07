/**
 * game.js — Spike 003a: Barren Wuffett vs. Mr. Market (one-thumb arcade).
 *
 * Mr. Market's mood swings between GREED and PANIC. He throws things; you drag Barren
 * (and the snowball he pushes) to catch bargains and dodge junk. Every catch changes the
 * snowball's growth RATE, and the snowball compounds every "year" (1 s of game time),
 * so early good catches are worth the most. A run is a 60-year career.
 *
 * The whole market — mood curve AND every throw (time, origin, landing x, speed, type) —
 * is generated up front from the date, so everyone plays the same market each day and the
 * schedule is frame-rate independent.
 *
 * Test hooks (URL params): ?date=YYYY-MM-DD  ?speed=N (game-time multiplier)  ?bot=1|idle|random
 * Observability: window.__ARCADE__ (state, market, LOG) + "export log" on the end screen.
 */
import { SPRITES, renderCanvas, dataURL } from '../002-old-barren-cast/cast.js';
import { ITEMS } from './items.js';

// ── Config ──────────────────────────────────────────────────────────────────
const HANDLE = '@Wolfhartvest';             // creator credit (share text + made-by lines)
const GAME_URL = 'https://barren-wuffett.pages.dev';
const YEARS = 60;                           // one career = 60 "years" = 60 s of game time
const START_VALUE = 10_000;
const START_RATE = 0.05;
const RATE_MIN = -0.08, RATE_MAX = 0.35;
const KNIFE_IFRAMES = 1.2;                  // game-seconds of grace after a knife hit
const EPOCH = Date.UTC(2026, 9, 1);         // Daily Market #1 = 2026-10-01 (UTC days)
const HEARTS = 3;
const MOVE_SPEED = 620;                     // px/s toward the drag target (real time)
const W = 480;
// fill a portrait phone instead of letterboxing: height follows the screen's aspect
const H = Math.round(Math.min(1040, Math.max(760, (W * innerHeight) / Math.max(1, innerWidth))));
const GROUND_Y = H - 48;                    // Barren's feet / snowball bottom
const MARKET_X = 240, MARKET_Y = 182;
const THROW_Y = 262;

const params = new URLSearchParams(location.search);
const TEST_SPEED = Math.max(0.25, Number(params.get('speed') || 1));
const BOT = params.get('bot');
const DATE = params.get('date') || new Date().toISOString().slice(0, 10);
const DAILY_NO = Math.floor((Date.parse(`${DATE}T00:00:00Z`) - EPOCH) / 86400000) + 1;

const EFFECT = {
    bill:    { kind: 'good',  dr: +0.006, dv: 1.01, label: '+0.6%/YR', note: 'BARGAIN' },
    shop:    { kind: 'good',  dr: +0.015, dv: 1.03, label: '+1.5%/YR', note: 'GREAT BUSINESS' },
    bubble:  { kind: 'bad',   dr: -0.010, dv: 0.92, label: '-1.0%/YR', note: 'BOUGHT THE TOP' },
    rocket:  { kind: 'bad',   dr: -0.015, dv: 0.88, label: '-1.5%/YR', note: 'MEME STOCK' },
    coin:    { kind: 'bad',   dr: -0.010, dv: 0.90, label: '-1.0%/YR', note: 'FIZZCOIN' },
    knife:   { kind: 'knife', dr: -0.005, dv: 0.90, label: '-1 HEART', note: 'FALLING KNIFE!' },
    fizz:    { kind: 'power', label: 'SLOW-MO', note: 'CHERRY FIZZ!' },
    charlie: { kind: 'power', label: 'SHIELD', note: 'CHARLIE HAS YOUR BACK' },
};
const TEX = {
    bill: 'it_bill', shop: 'it_shop', bubble: 'it_bubble', rocket: 'it_rocket',
    coin: 'it_coin', knife: 'it_knife', fizz: 'cherryFizz', charlie: 'it_charlie',
};
const WEIGHTS = {
    greed:   { bubble: 26, rocket: 18, coin: 18, bill: 18, shop: 5, fizz: 7, charlie: 8 },
    neutral: { bill: 30, shop: 8, bubble: 14, coin: 12, rocket: 8, knife: 8, fizz: 8, charlie: 8 },
    panic:   { bill: 44, shop: 18, knife: 22, fizz: 8, charlie: 8 },
};
const HEADLINES = {
    greed: ['EVERYONE IS A GENIUS', 'FIZZCOIN TO $1,000,000', 'THIS TIME IT IS DIFFERENT', 'MY BARBER BOUGHT ROCKETS', 'STOCKS ONLY GO UP'],
    neutral: ['MARKETS MIXED', 'ANALYSTS SHRUG', 'NOTHING TO SEE HERE', 'TRADING VOLUME: MEH'],
    panic: ['SELL EVERYTHING', 'THE END IS NIGH', 'CASH IS KING', 'NOBODY WANTS STOCKS', 'IT IS OVER (AGAIN)'],
};
const RANKS = [
    [0.20, 'THE ORACLE OF OHAMA'], [0.15, 'VALUE INVESTOR'], [0.10, 'SOLID COMPOUNDER'],
    [0.06, 'INDEX HUGGER'], [0.02, 'DAY TRADER'], [-Infinity, 'BAGHOLDER'],
];

// ── Utilities ───────────────────────────────────────────────────────────────
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function hashStr(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
}
function mulberry32(a) {
    return () => {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function pick(weights, rnd) {
    const entries = Object.entries(weights);
    let x = rnd() * entries.reduce((a, [, w]) => a + w, 0);
    for (const [k, w] of entries) { if ((x -= w) < 0) return k; }
    return entries[0][0];
}
export function money(v) {
    for (const [s, d] of [['T', 1e12], ['B', 1e9], ['M', 1e6], ['K', 1e3]]) {
        if (v >= d) { const n = v / d; return `$${n.toFixed(n >= 100 ? 0 : n >= 10 ? 1 : 2)}${s}`; }
    }
    return `$${Math.round(v)}`;
}
const stateOf = (m) => (m >= 0.35 ? 'panic' : m <= -0.35 ? 'greed' : 'neutral');
const ballRadius = (v) => clamp(16 + 9 * Math.log10(Math.max(1, v / START_VALUE)), 14, 74);
const rankFor = (cagr) => { const shown = Math.round(cagr * 1000) / 1000; return RANKS.find(([min]) => shown >= min)[1]; }; // rank matches the rounded % the player sees
const lerpColor = (a, b, k) => {
    const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
    const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
    return (Math.round(ar + (br - ar) * k) << 16) | (Math.round(ag + (bg - ag) * k) << 8) | Math.round(ab + (bb - ab) * k);
};

// ── The daily market (pure, deterministic) ──────────────────────────────────
export function buildMarket(dateStr) {
    const rnd = mulberry32(hashStr(`barren-market:${dateStr}`));
    const period = 6.5 + rnd() * 2.5;                     // base mood period (s)
    const phase = rnd() * Math.PI * 2;
    const k = 0.3 / YEARS;                                 // swings get 30% faster over a career
    const order = rnd() < 0.5 ? ['crash', 'bubble', 'crash'] : ['bubble', 'crash', 'crash'];
    const events = [[10, 20], [27, 38], [44, 54]].map(([a, b], i) => {
        const t0 = a + rnd() * (b - a - 6);
        return { kind: order[i], t0, t1: t0 + 4 + rnd() * 2 };
    });
    const inEvent = (t) => events.find(e => t >= e.t0 && t <= e.t1);
    const mood = (t) => {
        // integrated frequency so the speed-up never produces a phase jump
        const cyc = -Math.log(1 - k * t) / (period * k);
        let m = 0.8 * Math.sin(2 * Math.PI * cyc + phase) + 0.2 * Math.sin(2 * Math.PI * cyc * 2.7 + 2 * phase);
        const e = inEvent(t);
        if (e) {
            const w = Math.sin((Math.PI * (t - e.t0)) / (e.t1 - e.t0));
            m = m * (1 - w) + (e.kind === 'crash' ? 1 : -1) * w;
        }
        return clamp(m, -1, 1);
    };
    const spawns = [];
    let t = 1.4;
    while (t < YEARS - 0.6) {
        const st = stateOf(mood(t));
        const prog = t / YEARS;
        const type = pick(WEIGHTS[st], rnd);
        const speed = (150 + 120 * prog) * (st === 'panic' ? 1.2 : st === 'greed' ? 0.92 : 1) * (0.9 + rnd() * 0.25);
        spawns.push({
            id: spawns.length, t: +t.toFixed(3), type, speed: Math.round(speed),
            x0: Math.round(MARKET_X + (rnd() - 0.5) * 120), x: Math.round(40 + rnd() * 400),
        });
        let gap = (0.8 - 0.36 * prog) * (st === 'neutral' ? 1.25 : 1) * (0.7 + rnd() * 0.6);
        if (inEvent(t)) gap *= 0.7;
        t += gap;
    }
    return { dateStr, mood, events, spawns, fingerprint: hashStr(JSON.stringify(spawns)).toString(16) };
}

// ── Sound: tiny WebAudio synth (no assets) ──────────────────────────────────
let actx = null;
function audio() {
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { actx = null; } }
    return actx;
}
function blip(freqs, dur = 0.08, type = 'square', vol = 0.05) {
    const a = audio(); if (!a || a.state !== 'running') return;
    const t0 = a.currentTime;
    freqs.forEach((f, i) => {
        const o = a.createOscillator(), g = a.createGain();
        o.type = type; o.frequency.setValueAtTime(f, t0 + i * dur);
        g.gain.setValueAtTime(vol, t0 + i * dur);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + (i + 1) * dur);
        o.connect(g).connect(a.destination);
        o.start(t0 + i * dur); o.stop(t0 + (i + 1) * dur + 0.02);
    });
}
const SFX = {
    good: () => blip([660, 990], 0.06),
    great: () => blip([523, 784, 1046], 0.06),
    bad: () => blip([300, 180], 0.09, 'sawtooth', 0.05),
    knife: () => blip([150, 90], 0.14, 'sawtooth', 0.08),
    power: () => blip([523, 659, 784, 1046], 0.05, 'triangle', 0.07),
    mood: () => blip([220, 330], 0.05, 'triangle', 0.03),
    block: () => blip([880, 440], 0.07, 'square', 0.05),
    end: () => blip([392, 523, 659, 784], 0.12, 'triangle', 0.07),
};

// ── Forensic log ────────────────────────────────────────────────────────────
const LOG = [];
const log = (cat, data = {}) => LOG.push({ iso: new Date().toISOString(), cat, ...data });

// ── The game scene ──────────────────────────────────────────────────────────
const market = buildMarket(DATE);
let lastResult = null;

class Arcade extends Phaser.Scene {
    constructor() { super('arcade'); }

    create() {
        for (const [key, spr] of Object.entries(SPRITES)) this.textures.addCanvas(key, renderCanvas(spr, 1));
        for (const [key, spr] of Object.entries(ITEMS)) this.textures.addCanvas(`it_${key}`, renderCanvas(spr, 1));
        const spark = document.createElement('canvas'); spark.width = spark.height = 2;
        const sc = spark.getContext('2d'); sc.fillStyle = '#ffffff'; sc.fillRect(0, 0, 2, 2);
        this.textures.addCanvas('spark', spark);

        // sky + skyline + street
        this.sky = this.add.rectangle(0, 0, W, H, 0x8fc3e8).setOrigin(0).setDepth(0);
        const city = this.add.graphics().setDepth(1).setAlpha(0.55);
        const crnd = mulberry32(7);
        for (let x = -10; x < W; ) {
            const bw = 34 + Math.floor(crnd() * 40), bh = 70 + Math.floor(crnd() * 150);
            city.fillStyle(0x2d2a3e, 1).fillRect(x, GROUND_Y - 6 - bh, bw, bh);
            city.fillStyle(0xffe08a, 0.8);
            for (let wy = GROUND_Y - bh + 6; wy < GROUND_Y - 14; wy += 14) {
                for (let wx = x + 6; wx < x + bw - 8; wx += 12) if (crnd() < 0.35) city.fillRect(wx, wy, 5, 6);
            }
            x += bw + 4;
        }
        this.add.rectangle(0, GROUND_Y - 6, W, 8, 0x8a8698).setOrigin(0).setDepth(1);
        this.add.rectangle(0, GROUND_Y + 2, W, H - GROUND_Y, 0x3b3a46).setOrigin(0).setDepth(1);
        for (let x = 12; x < W; x += 48) this.add.rectangle(x, GROUND_Y + 26, 24, 4, 0xd9d4c3).setOrigin(0).setDepth(1);

        // HUD
        this.add.rectangle(0, 0, W, 92, 0x14121b, 0.86).setOrigin(0).setDepth(20);
        const font = (size, color = '#ffffff') => ({ fontFamily: '"Press Start 2P"', fontSize: `${size}px`, color });
        this.add.text(14, 12, 'SNOWBALL', font(8, '#a9a3bd')).setDepth(21);
        this.tVal = this.add.text(14, 28, '', font(16)).setDepth(21);
        this.tRate = this.add.text(14, 56, '', font(16, '#5fd068')).setDepth(21);
        this.add.text(W / 2 + 34, 12, 'YEAR', font(8, '#a9a3bd')).setOrigin(0.5, 0).setDepth(21);
        this.tYear = this.add.text(W / 2 + 34, 28, '', font(16)).setOrigin(0.5, 0).setDepth(21);
        this.add.text(W / 2 + 34, 60, `DAILY #${DAILY_NO}`, font(8, '#a9a3bd')).setOrigin(0.5, 0).setDepth(21);
        this.hearts = [0, 1, 2].map(i => this.add.image(W - 76 + i * 26, 34, 'it_heart').setScale(3).setDepth(21));
        this.shieldIcon = this.add.image(W - 50, 68, 'charlie').setScale(1).setDepth(21).setVisible(false);
        this.fizzIcon = this.add.image(W - 76, 68, 'cherryFizz').setScale(1.2).setDepth(21).setVisible(false);

        // Mr. Market, mood meter, ticker
        this.market = this.add.image(MARKET_X, MARKET_Y, 'marketNeutral').setScale(5).setDepth(10);
        this.add.rectangle(90, 288, 300, 14, 0x14121b).setOrigin(0, 0.5).setStrokeStyle(2, 0xf3eee2).setDepth(10);
        this.add.rectangle(92, 288, 148, 10, 0x2f7f3a).setOrigin(0, 0.5).setDepth(10);
        this.add.rectangle(240, 288, 148, 10, 0x9c2a33).setOrigin(0, 0.5).setDepth(10);
        this.add.text(90, 300, 'GREED', font(8, '#7fe08a')).setDepth(10);
        this.add.text(390, 300, 'PANIC', font(8, '#ff8a8a')).setOrigin(1, 0).setDepth(10);
        this.knob = this.add.rectangle(240, 288, 8, 22, 0xffd166).setStrokeStyle(2, 0x1c1824).setDepth(11);
        this.add.rectangle(0, 312, W, 28, 0x14121b, 0.7).setOrigin(0).setDepth(9);
        this.ticker = this.add.text(W, 318, '', font(16, '#ffd166')).setDepth(10);

        // Barren + snowball
        this.barren = this.add.image(W / 2, GROUND_Y, 'barrenIdle').setOrigin(0.5, 1).setScale(3).setDepth(4);
        this.ball = this.add.graphics().setDepth(5);
        this.sparks = this.add.particles(0, 0, 'spark', {
            speed: { min: 60, max: 200 }, angle: { min: 200, max: 340 }, lifespan: 450,
            scale: { start: 2, end: 0 }, gravityY: 300, emitting: false,
        }).setDepth(12);
        this.banner = this.add.text(W / 2, H * 0.46, '', font(24, '#ff5d5d')).setOrigin(0.5).setDepth(15).setVisible(false);
        this.slowTint = this.add.rectangle(0, 0, W, H, 0xff9db0, 0).setOrigin(0).setDepth(14);

        // input: drag anywhere moves Barren toward the finger
        this.input.on('pointerdown', (p) => { if (this.run) this.run.targetX = p.x; });
        this.input.on('pointermove', (p) => { if (this.run && p.isDown) this.run.targetX = p.x; });
        this.cursors = this.input.keyboard?.createCursorKeys() ?? null;

        this.drawIdle();
        window.__ARCADE__.ready = true;
    }

    drawIdle() {
        this.tVal.setText(money(START_VALUE));
        this.tRate.setText('+4.0%/YR');
        this.tYear.setText(`1/${YEARS}`);
        this.drawBall(W / 2, ballRadius(START_VALUE), 0);
    }

    startRun() {
        if (this.run) for (const it of this.run.items) it.img.destroy();
        this.run = {
            t: 0, V: START_VALUE, r: START_RATE, hearts: HEARTS, next: 0, items: [],
            slowmo: 0, shield: false, oops: 0, iframes: 0, flash: 0, squash: 0, walk: 0,
            px: W / 2, targetX: W / 2, rolled: 0, state: null, decadeV: [START_VALUE],
            seenEvents: new Set(), tickerIdx: 0, over: false,
            stats: { bargains: 0, businesses: 0, junk: 0, knives: 0, blocked: 0, powerups: 0, missedGood: 0 },
        };
        for (const h of this.hearts) h.setTexture('it_heart');
        this.shieldIcon.setVisible(false); this.fizzIcon.setVisible(false);
        this.banner.setVisible(false);
        this.onMood(stateOf(market.mood(0)));
        log('run-start', { date: DATE, daily: DAILY_NO, fingerprint: market.fingerprint, bot: BOT || null });
    }

    update(_time, delta) {
        const R = this.run;
        if (!R || R.over) return;
        const dtReal = Math.min(0.05, delta / 1000) * TEST_SPEED;
        const dt = dtReal * (R.slowmo > 0 ? 0.5 : 1);    // game time (= years)
        R.t += dt;
        if (R.slowmo > 0) { R.slowmo -= dt; if (R.slowmo <= 0) { this.fizzIcon.setVisible(false); } }
        R.iframes = Math.max(0, R.iframes - dt);

        // ── input ──
        if (BOT) R.targetX = botTarget(R);
        else if (this.cursors) {
            if (this.cursors.left.isDown) R.targetX = R.px - 60;
            else if (this.cursors.right.isDown) R.targetX = R.px + 60;
        }
        const step = clamp(clamp(R.targetX, 24, W - 24) - R.px, -MOVE_SPEED * dtReal, MOVE_SPEED * dtReal);
        R.px += step; R.rolled += step;
        R.walk = Math.abs(step) > 0.4 ? R.walk + dtReal : 0;

        // ── spawns from the precomputed schedule ──
        while (R.next < market.spawns.length && market.spawns[R.next].t <= R.t) this.spawn(market.spawns[R.next++]);

        // ── items: move + catch ──
        const radius = ballRadius(R.V);
        const bx = R.px, by = GROUND_Y - radius;
        const headX = this.barrenX(R.px, radius);
        for (const it of R.items) {
            if (it.done) continue;
            it.x += it.vx * dt; it.y += it.vy * dt; it.age += dt;
            it.img.setPosition(it.x, it.y);
            if (it.type === 'coin') it.img.setScale(3 * Math.cos(it.age * 9), 3);
            else if (it.type === 'bubble') it.img.setScale(3 + 0.18 * Math.sin(it.age * 7));
            else if (it.type === 'rocket') it.img.setAngle(Math.sin(it.age * 30) * 4);
            const hitBall = Math.hypot(it.x - bx, it.y - by) < radius + it.r * 0.75;
            const hitHead = Math.abs(it.x - headX) < 24 && it.y > GROUND_Y - 92 && it.y < GROUND_Y - 36;
            if (hitBall || hitHead) this.catchItem(it, radius);
            else if (it.y > H + 30) {
                it.done = true; it.img.destroy();
                if (EFFECT[it.type].kind === 'good') R.stats.missedGood += 1;
            }
        }
        R.items = R.items.filter(it => !it.done);
        if (R.over) return;

        // ── compounding: every game second is a year ──
        R.V *= Math.pow(1 + R.r, dt);
        while (R.decadeV.length <= Math.min(6, Math.floor(R.t / 10))) R.decadeV.push(R.V);

        // ── Mr. Market's mood + market events ──
        const m = market.mood(R.t);
        const st = stateOf(m);
        if (st !== R.state) this.onMood(st);
        for (const e of market.events) {
            if (R.t >= e.t0 && !R.seenEvents.has(e)) {
                R.seenEvents.add(e);
                this.showBanner(e.kind === 'crash' ? 'CRASH!' : 'BUBBLE!', e.kind === 'crash' ? '#ff5d5d' : '#ffd166');
                this.cameras.main.shake(260, 0.006);
                log('event', { kind: e.kind, t: +R.t.toFixed(2) });
            }
        }

        // ── presentation ──
        const sky = m >= 0 ? lerpColor(0x8fc3e8, 0x6b3a5c, Math.pow(m, 0.6)) : lerpColor(0x8fc3e8, 0xffc94d, Math.pow(-m, 0.6));
        this.sky.setFillStyle(sky);
        this.knob.x = 92 + ((m + 1) / 2) * 296;
        const base = st === 'greed' ? 5.4 : 5;
        R.squash = Math.max(0, R.squash - dtReal * 6);
        this.market.setScale(base * (1 + R.squash * 0.5), base * (1 - R.squash));
        this.market.x = MARKET_X + (st === 'panic' ? Math.sin(R.t * 70) * 2.5 : 0);
        this.market.y = MARKET_Y + Math.sin(R.t * 3) * 3;
        this.ticker.x -= 90 * dtReal;
        if (this.ticker.x + this.ticker.width < 0) this.nextHeadline();
        this.slowTint.setAlpha(R.slowmo > 0 ? 0.12 : 0);

        R.oops = Math.max(0, R.oops - dtReal);
        R.flash = Math.max(0, R.flash - dtReal);
        this.barren.setTexture(R.oops > 0 ? 'barrenOops' : R.walk > 0 ? (Math.floor(R.walk * 9) % 2 ? 'barrenWalkA' : 'barrenWalkB') : 'barrenIdle');
        this.barren.x = headX;
        this.barren.setAlpha(R.iframes > 0 && Math.floor(R.iframes * 12) % 2 ? 0.35 : 1);
        this.drawBall(R.px, radius, R.squash);

        this.tVal.setText(money(R.V));
        this.tRate.setText(`${R.r >= 0 ? '+' : ''}${(R.r * 100).toFixed(1)}%/YR`)
            .setColor(R.r >= 0.1 ? '#5fd068' : R.r >= 0 ? '#e8e2c8' : '#ff6b6b');
        this.tYear.setText(`${Math.min(YEARS, Math.floor(R.t) + 1)}/${YEARS}`);

        if (R.t >= YEARS) this.endRun('retire');
    }

    /** Barren stands behind the ball; once it outgrows him he shifts aside to push it */
    barrenX(px, radius) { return px - Math.max(0, radius - 30) * 0.95; }

    spawn(s) {
        const R = this.run;
        const flight = (GROUND_Y - 70 - THROW_Y) / s.speed;
        const img = this.add.image(s.x0, THROW_Y, TEX[s.type]).setScale(3).setDepth(6);
        const it = { ...s, x: s.x0, y: THROW_Y, vx: (s.x - s.x0) / flight, vy: s.speed, age: 0, done: false, img };
        it.r = Math.max(img.displayWidth, img.displayHeight) * 0.42;
        R.items.push(it);
        R.squash = 0.12;                                   // Mr. Market's throw
    }

    catchItem(it, radius) {
        const R = this.run;
        const e = EFFECT[it.type];
        if (e.kind === 'knife' && R.iframes > 0) return;   // grace: the knife falls past
        it.done = true; it.img.destroy();
        const at = { x: it.x, y: Math.min(it.y, GROUND_Y - radius * 2) };
        if (e.kind === 'power') {
            R.stats.powerups += 1; SFX.power();
            if (it.type === 'fizz') { R.slowmo = 4; this.fizzIcon.setVisible(true); }
            else { R.shield = true; this.shieldIcon.setVisible(true); }
            this.float(at.x, at.y, e.note, '#ffd1dc', e.label);
            log('catch', { type: it.type, t: +R.t.toFixed(2) });
            return;
        }
        if (e.kind !== 'good' && R.shield) {
            R.shield = false; R.stats.blocked += 1; this.shieldIcon.setVisible(false); SFX.block();
            this.float(at.x, at.y, 'CHARLIE: "NO."', '#9fd0ff');
            log('blocked', { type: it.type, t: +R.t.toFixed(2) });
            return;
        }
        R.r = clamp(R.r + e.dr, RATE_MIN, RATE_MAX);
        R.V *= e.dv;
        if (e.kind === 'good') {
            if (it.type === 'shop') { R.stats.businesses += 1; SFX.great(); } else { R.stats.bargains += 1; SFX.good(); }
            R.squash = 0.18;
            this.sparks.explode(10, R.px, GROUND_Y - radius * 2);
            this.float(at.x, at.y, e.note, '#7fe08a', e.label);
        } else if (e.kind === 'bad') {
            R.stats.junk += 1; R.flash = 0.25; SFX.bad();
            this.cameras.main.shake(120, 0.004);
            this.float(at.x, at.y, e.note, '#ff6b6b', e.label);
        } else {                                           // knife
            R.stats.knives += 1; R.hearts -= 1; R.oops = 0.6; R.flash = 0.35; R.iframes = KNIFE_IFRAMES; SFX.knife();
            this.cameras.main.shake(240, 0.01);
            this.hearts[R.hearts]?.setTexture('it_heartEmpty');
            this.float(at.x, at.y, e.note, '#ff6b6b', e.label);
        }
        log('catch', { type: it.type, t: +R.t.toFixed(2), V: Math.round(R.V), r: +R.r.toFixed(3) });
        if (R.hearts <= 0) this.endRun('shaken');
    }

    onMood(st) {
        const R = this.run;
        R.state = st;
        this.market.setTexture(st === 'greed' ? 'marketGreed' : st === 'panic' ? 'marketPanic' : 'marketNeutral');
        R.squash = 0.2;
        R.tickerIdx = 0;
        this.nextHeadline();
        SFX.mood();
        log('mood', { state: st, t: +R.t.toFixed(2) });
    }

    nextHeadline() {
        const R = this.run;
        const list = HEADLINES[R?.state ?? 'neutral'];
        this.ticker.setText(`${list[(R ? R.tickerIdx++ : 0) % list.length]}   ·   `);
        this.ticker.x = W;
    }

    showBanner(text, color) {
        this.banner.setText(text).setColor(color).setVisible(true).setScale(0.2).setAlpha(1);
        this.tweens.add({ targets: this.banner, scale: 1, duration: 260, ease: 'Back.easeOut' });
        this.tweens.add({ targets: this.banner, alpha: 0, delay: 1100, duration: 300, onComplete: () => this.banner.setVisible(false) });
    }

    float(x, y, big, color, small = '') {
        const style = (size) => ({ fontFamily: '"Press Start 2P"', fontSize: `${size}px`, color, stroke: '#1c1824', strokeThickness: 4, align: 'center' });
        const cx = clamp(x, 120, W - 120);
        const parts = [this.add.text(cx, y, big, style(16)).setOrigin(0.5).setDepth(16)];
        if (small) parts.push(this.add.text(cx, y + 18, small, style(8)).setOrigin(0.5).setDepth(16));
        this.tweens.add({ targets: parts, y: `-=46`, alpha: 0, duration: 950, ease: 'Quad.easeOut', onComplete: () => parts.forEach(p => p.destroy()) });
    }

    drawBall(cx, radius, squash) {
        const g = this.ball;
        const rw = radius * (1 + squash), rh = radius * (1 - squash * 0.8);
        const cy = GROUND_Y - rh;
        const R = this.run;
        g.clear();
        g.fillStyle(0x000000, 0.25).fillEllipse(cx, GROUND_Y + 2, rw * 2.1, 8);
        g.fillStyle(0x1c1824, 1).fillEllipse(cx, cy, rw * 2 + 6, rh * 2 + 6);
        g.fillStyle(R && R.flash > 0 ? 0xff9a9a : 0xd5e2f5, 1).fillEllipse(cx, cy, rw * 2, rh * 2);
        g.fillStyle(R && R.flash > 0 ? 0xffd0d0 : 0xffffff, 1).fillEllipse(cx - rw * 0.16, cy - rh * 0.18, rw * 1.45, rh * 1.45);
        const ang = (R ? R.rolled : 0) / Math.max(8, radius);
        g.fillStyle(0xbccde6, 1);
        for (let i = 0; i < 6; i++) {
            const a = ang + (i * Math.PI) / 3;
            g.fillCircle(cx + Math.cos(a) * rw * 0.62, cy + Math.sin(a) * rh * 0.62, Math.max(2, radius * 0.11));
        }
    }

    endRun(reason) {
        const R = this.run;
        R.over = true;
        for (const it of R.items) it.img.destroy();
        R.items = [];
        while (R.decadeV.length < 7) R.decadeV.push(R.V);    // shaken out = cash under the mattress
        const cagr = Math.pow(R.V / START_VALUE, 1 / YEARS) - 1;
        const decades = [];
        for (let i = 0; i < 6; i++) {
            const g = Math.pow(R.decadeV[i + 1] / R.decadeV[i], 1 / 10) - 1;
            decades.push(g >= 0.12 ? '🟩' : g >= 0.06 ? '🟨' : '🟥');
        }
        lastResult = { reason, V: R.V, cagr, rank: rankFor(cagr), decades, stats: { ...R.stats }, year: Math.min(YEARS, Math.floor(R.t)) };
        SFX.end();
        log('end', { reason, V: Math.round(R.V), cagr: +cagr.toFixed(4), stats: R.stats });
        setTimeout(() => showEnd(lastResult), reason === 'shaken' ? 900 : 400);
    }
}

// ── Autopilot for headless checks (?bot=1|idle|random) ──────────────────────
function botTarget(R) {
    if (BOT === 'idle') return W / 2;
    if (BOT === 'random') {
        if (!R.rt || R.t > R.rt) { R.rx = 40 + Math.random() * 400; R.rt = R.t + 1.2; }
        return R.rx;
    }
    const radius = ballRadius(R.V);
    const catchY = GROUND_Y - radius * 1.6;
    const live = R.items.filter(i => !i.done && i.y < catchY);
    for (const i of live) { i.tA = (catchY - i.y) / i.vy; i.xA = i.x + i.vx * i.tA; }
    const isGood = (i) => EFFECT[i.type].kind === 'good' || EFFECT[i.type].kind === 'power';
    const bad = live.filter(i => !isGood(i) && i.tA < 1.0);
    const good = live.filter(isGood).sort((a, b) => a.tA - b.tA);
    let target = R.px;
    for (const g of good) {
        const reachable = Math.abs(g.xA - R.px) <= MOVE_SPEED * g.tA * 0.8 + radius;
        const safe = !bad.some(b => Math.abs(b.xA - g.xA) < radius + 30 && Math.abs(b.tA - g.tA) < 0.4);
        if (reachable && safe) { target = g.xA; break; }
    }
    for (const b of bad) {
        if (Math.abs(b.xA - target) < radius + 28) target = b.xA < target ? b.xA + radius + 44 : b.xA - radius - 44;
    }
    return clamp(target, 24, W - 24);
}

// ── DOM: title / end / share ────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
for (const el of document.querySelectorAll('.handle')) el.textContent = HANDLE;
$('t-barren').src = dataURL(SPRITES.barren, 4);
$('t-market').src = dataURL(SPRITES.marketGreed, 4);
$('t-daily').textContent = `Daily Market #${DAILY_NO} · ${DATE} · same market for everyone`;
for (const [id, spr] of [['i-bill', ITEMS.bill], ['i-shop', ITEMS.shop], ['i-bubble', ITEMS.bubble], ['i-rocket', ITEMS.rocket],
    ['i-coin', ITEMS.coin], ['i-knife', ITEMS.knife], ['i-fizz', SPRITES.cherryFizz], ['i-charlie', ITEMS.charlie]]) {
    $(id).src = dataURL(spr, 2);
}

function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.style.display = 'block';
    clearTimeout(toast.h); toast.h = setTimeout(() => { t.style.display = 'none'; }, 1800);
}

export function shareText(res) {
    const caught = res.stats.bargains + res.stats.businesses;
    return [
        `Barren Wuffett vs. Mr. Market · Daily #${DAILY_NO} 📈`,
        `Snowball ${money(res.V)} · ${(res.cagr * 100).toFixed(1)}%/yr · ${res.rank}`,
        res.decades.join(''),
        `${caught} bargains · ${res.stats.junk} bubbles · ${res.stats.knives} 🔪${res.reason === 'shaken' ? ` · shaken out in year ${res.year}` : ''}`,
        `made by ${HANDLE}`,
    ].join('\n');
}

async function share() {
    if (!lastResult) return;
    const text = shareText(lastResult);
    log('share', { coarse: matchMedia('(pointer: coarse)').matches });
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        try { await navigator.share({ text, url: GAME_URL }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(`${text}\n${GAME_URL}`); toast('Copied!'); } catch { /* ignore */ }
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(GAME_URL)}`, '_blank', 'noopener');
}

function showEnd(res) {
    $('e-title').textContent = res.reason === 'shaken' ? `SHAKEN OUT IN YEAR ${res.year}!` : 'BARREN RETIRES';
    $('e-value').textContent = money(res.V);
    $('e-rank').textContent = `${(res.cagr * 100).toFixed(1)}%/YR · ${res.rank}`;
    $('e-decades').textContent = res.decades.join('');
    const caught = res.stats.bargains + res.stats.businesses;
    $('e-stats').textContent = `${caught} bargains · ${res.stats.junk} bubbles bought · ${res.stats.knives} falling knives · Charlie saved you ${res.stats.blocked}×`;
    const size = clamp(60 + 16 * Math.log10(Math.max(1, res.V / START_VALUE)), 60, 170);
    Object.assign($('e-ball').style, { width: `${size}px`, height: `${size}px` });
    $('e-barren').src = dataURL(res.reason === 'shaken' ? SPRITES.barrenOops : SPRITES.barrenIdle, 4);
    $('end').classList.add('show');
}

const scene = () => game.scene.getScene('arcade');
function play() {
    audio()?.resume?.();
    $('title').classList.remove('show');
    $('end').classList.remove('show');
    scene().startRun();
}
$('play').addEventListener('click', play);
$('again').addEventListener('click', play);
$('share').addEventListener('click', share);
$('about-link').addEventListener('click', (e) => { e.preventDefault(); $('about').classList.add('show'); });
$('about-close').addEventListener('click', () => $('about').classList.remove('show'));
$('export').addEventListener('click', (e) => {
    e.preventDefault();
    const blob = new Blob([JSON.stringify({ date: DATE, daily: DAILY_NO, fingerprint: market.fingerprint, result: lastResult, log: LOG }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `barren-arcade-${DATE}.json`; a.click();
});

// ── Boot ────────────────────────────────────────────────────────────────────
window.__ARCADE__ = {
    ready: false, market, LOG, DATE, DAILY_NO, H,
    get state() { return scene()?.run ?? null; },
    get result() { return lastResult; },
    shareText: () => (lastResult ? shareText(lastResult) : null),
    play,
};
await Promise.all([document.fonts.load('16px "Press Start 2P"'), document.fonts.load('16px "Pixelify Sans"')]).catch(() => {});
const game = new Phaser.Game({
    type: Phaser.AUTO, parent: 'game', width: W, height: H, backgroundColor: '#14121b',
    pixelArt: true, antialias: false, roundPixels: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [Arcade],
});
