// Headless verification for spike 003b: seeded life determinism, autopilot life, phone screenshots.
const { chromium } = require('D:/AiProjects/barren-wuffett/node_modules/playwright');
const path = require('path');
const BASE = 'http://localhost:5180/003b-snowball-idle/';
const shot = (name) => path.join(__dirname, `_shot_${name}.png`);

(async () => {
    const browser = await chromium.launch();
    const errors = [];
    const open = async (qs) => {
        const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
        const page = await ctx.newPage();
        page.on('pageerror', e => errors.push(`[${qs}] ${e.message}`));
        page.on('console', m => { if (m.type() === 'error') errors.push(`[${qs}] ${m.text()}`); });
        await page.goto(BASE + qs);
        await page.waitForFunction(() => window.__IDLE__, null, { timeout: 15000 });
        await page.waitForTimeout(400);
        return { ctx, page };
    };

    // determinism of the seeded life (event schedule)
    const fp = async (d) => { const { ctx, page } = await open(`?date=${d}`); const r = await page.evaluate(() => ({ fp: window.__IDLE__.life.fingerprint, ev: window.__IDLE__.life.events.map(e => `${e.type}@${e.age}`) })); await ctx.close(); return r; };
    const a = await fp('2026-10-06'), a2 = await fp('2026-10-06'), b = await fp('2026-10-07');
    console.log('LIFE same-date:', a.fp === a2.fp ? 'PASS' : 'FAIL', a.fp, a.ev.join(' '));
    console.log('LIFE next-date differs:', a.fp !== b.fp ? 'PASS' : 'FAIL', b.fp);

    // autopilot life with screenshots along the way (speed 6 → ~50 s)
    const { ctx, page } = await open('?date=2026-10-06&bot=saver&speed=6');
    await page.screenshot({ path: shot('1_title') });
    await page.evaluate(() => window.__IDLE__.start());
    const want = [[9, '2_early'], [45, '4_mid'], [74, '5_late']];
    let eventShot = false;
    const t0 = Date.now();
    while (Date.now() - t0 < 120000) {
        const st = await page.evaluate(() => ({ age: window.__IDLE__.state.age, paused: window.__IDLE__.paused, done: !!window.__IDLE__.result, ev: document.getElementById('event').classList.contains('show') }));
        if (st.done) break;
        if (!eventShot && st.age >= 40 && !st.ev) {
            eventShot = true;
            for (const t of ['tip', 'bubble']) {
                await page.evaluate((t) => window.__IDLE__.debugEvent(t), t);
                await page.waitForTimeout(250);
                await page.screenshot({ path: shot(`3_event_${t}`) });
                await page.evaluate(() => document.getElementById('ev-b').click());
            }
        }
        if (want.length && st.age >= want[0][0]) { const [, n] = want.shift(); await page.screenshot({ path: shot(n) }); console.log('shot', n, 'at age', st.age.toFixed(1)); }
        await page.waitForTimeout(60);
    }
    await page.waitForTimeout(800);
    await page.screenshot({ path: shot('6_end') });
    const r = await page.evaluate(() => ({ res: window.__IDLE__.result, share: window.__IDLE__.shareText(), events: window.__IDLE__.LOG.filter(l => l.cat === 'event').map(l => `${l.type}:${l.choice}@${l.age}`) }));
    console.log('RESULT', JSON.stringify({ nw: r.res && Math.round(r.res.nw), rank: r.res && r.res.rank, million: r.res && r.res.million, billion: r.res && r.res.billion, stats: r.res && r.res.stats }));
    console.log('EVENTS', r.events.join(' '));
    console.log('SHARE TEXT ↓\n' + r.share);
    await ctx.close();
    console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
    await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
