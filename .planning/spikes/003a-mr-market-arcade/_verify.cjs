// Headless verification for spike 003a: determinism, strategy baselines, phone screenshots.
// Requires the spikes server: npx vite .planning/spikes --port 5180 --strictPort --host
const { chromium } = require('D:/AiProjects/barren-wuffett/node_modules/playwright');
const path = require('path');
const BASE = 'http://localhost:5180/003a-mr-market-arcade/';
const shot = (name) => path.join(__dirname, `_shot_${name}.png`);
const mode = process.argv[2] || 'all';

(async () => {
    const browser = await chromium.launch();
    const errors = [];
    const open = async (qs, viewport = { width: 412, height: 915 }, dsf = 2) => {
        const ctx = await browser.newContext({ viewport, deviceScaleFactor: dsf, isMobile: true, hasTouch: true });
        const page = await ctx.newPage();
        page.on('pageerror', e => errors.push(`[${qs}] ${e.message}`));
        page.on('console', m => { if (m.type() === 'error') errors.push(`[${qs}] ${m.text()}`); });
        await page.goto(BASE + qs);
        await page.waitForFunction(() => window.__ARCADE__ && window.__ARCADE__.ready === true, null, { timeout: 15000 });
        return { ctx, page };
    };

    if (mode === 'all' || mode === 'det') {
        const fp = async (date) => {
            const { ctx, page } = await open(`?date=${date}`);
            const r = await page.evaluate(() => ({ fp: window.__ARCADE__.market.fingerprint, n: window.__ARCADE__.market.spawns.length, ev: window.__ARCADE__.market.events.map(e => `${e.kind}@${e.t0.toFixed(1)}`) }));
            await ctx.close(); return r;
        };
        const a1 = await fp('2026-10-06'), a2 = await fp('2026-10-06'), b = await fp('2026-10-07');
        console.log('DETERMINISM same-date:', a1.fp === a2.fp ? 'PASS' : 'FAIL', a1.fp, `${a1.n} throws`, a1.ev.join(' '));
        console.log('DETERMINISM next-date differs:', a1.fp !== b.fp ? 'PASS' : 'FAIL', b.fp, `${b.n} throws`, b.ev.join(' '));
    }

    if (mode === 'all' || mode === 'bots') {
        const runBot = async (bot, date) => {
            const { ctx, page } = await open(`?date=${date}&bot=${bot}&speed=4`);
            await page.evaluate(() => window.__ARCADE__.play());
            await page.waitForFunction(() => window.__ARCADE__.result, null, { timeout: 40000 });
            const r = await page.evaluate(() => ({ ...window.__ARCADE__.result, share: window.__ARCADE__.shareText() }));
            await ctx.close(); return r;
        };
        for (const date of ['2026-10-06', '2026-10-07', '2026-10-08']) {
            for (const bot of ['1', 'idle', 'random']) {
                const r = await runBot(bot, date);
                const s = r.stats;
                console.log(`BOT ${date} ${bot.padEnd(6)} → ${r.reason.padEnd(7)} V=${Math.round(r.V).toLocaleString('en-US').padStart(15)} cagr=${(r.cagr * 100).toFixed(1).padStart(5)}% ${r.rank.padEnd(20)} ${r.decades.join('')} good=${s.bargains + s.businesses} junk=${s.junk} knives=${s.knives} blocked=${s.blocked} pow=${s.powerups} missedGood=${s.missedGood}`);
                if (bot === '1' && date === '2026-10-06') console.log('SHARE TEXT ↓\n' + r.share);
            }
        }
    }

    if (mode === 'all' || mode === 'shots') {
        const { ctx, page } = await open('?date=2026-10-06&bot=1');
        await page.waitForTimeout(600);
        await page.screenshot({ path: shot('1_title') });
        await page.evaluate(() => window.__ARCADE__.play());
        const want = { greed: false, panic: false };
        const t0 = Date.now();
        while (Date.now() - t0 < 70000 && (!want.greed || !want.panic)) {
            const st = await page.evaluate(() => { const s = window.__ARCADE__.state; return s && { state: s.state, t: s.t, items: s.items.length }; });
            if (st && st.t > 4 && st.items >= 3 && !want[st.state] && st.state !== 'neutral') {
                await page.screenshot({ path: shot(`2_${st.state}`) });
                want[st.state] = true;
                console.log(`shot ${st.state} at t=${st.t.toFixed(1)}`);
            }
            await page.waitForTimeout(150);
        }
        await page.waitForFunction(() => window.__ARCADE__.result, null, { timeout: 80000 });
        await page.waitForTimeout(800);
        await page.screenshot({ path: shot('3_end') });
        await ctx.close();
        // desktop look
        const d = await open('?date=2026-10-06', { width: 1440, height: 900 }, 1);
        await d.page.waitForTimeout(500);
        await d.page.screenshot({ path: shot('4_desktop') });
        await d.ctx.close();
    }

    console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
    await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
