// Headless verification for spike 003c: drag reveal, autopilot careers, endings grid, screenshots.
const { chromium } = require('D:/AiProjects/barren-wuffett/node_modules/playwright');
const path = require('path');
const BASE = 'http://localhost:5180/003c-swipe-satire/';
const shot = (name) => path.join(__dirname, `_shot_${name}.png`);

(async () => {
    const browser = await chromium.launch();
    const errors = [];
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

    // manual career: title → first card → half-drag reveal → swipe
    await page.goto(BASE + '?date=2026-10-06');
    await page.waitForFunction(() => window.__SWIPE__, null, { timeout: 15000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: shot('1_title') });
    await page.click('#play');
    await page.waitForTimeout(600);
    await page.screenshot({ path: shot('2_card') });
    const box = await page.locator('#card').boundingBox();
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy); await page.mouse.down();
    for (let i = 1; i <= 8; i++) { await page.mouse.move(cx - i * 9, cy + i); await page.waitForTimeout(16); }
    await page.waitForTimeout(150);
    await page.screenshot({ path: shot('3_drag_left') });
    const hint = await page.evaluate(() => [...document.querySelectorAll('.meter .dot')].map(d => d.style.opacity));
    for (let i = 9; i <= 16; i++) { await page.mouse.move(cx - i * 9, cy + i); await page.waitForTimeout(16); }
    await page.mouse.up();
    await page.waitForTimeout(500);
    const afterSwipe = await page.evaluate(() => ({ choices: window.__SWIPE__.run.choices, age: window.__SWIPE__.run.age }));
    console.log('DRAG: hint dots while dragging', JSON.stringify(hint), '→ committed swipe:', afterSwipe.choices === 1 ? 'PASS' : 'FAIL', JSON.stringify(afterSwipe));
    // play the rest with the buttons until the end (always the "balanced" side, decided in-page)
    await page.evaluate(() => {
        const C = window.__SWIPE__;
        return new Promise((resolve) => {
            const step = () => {
                if (C.result) return resolve();
                const run = C.run, card = C.card;
                const score = (s) => Math.max(...['cash', 'holders', 'calm', 'fizz'].map(k => Math.abs(Math.max(0, Math.min(100, run.meters[k] + Math.round((card[s].fx[k] || 0) * 1.3) + ({ calm: 1, fizz: -2 }[k] || 0))) - 50)));
                document.getElementById(score('left') <= score('right') ? 'bl' : 'br').click();
                setTimeout(step, 380);
            };
            step();
        });
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: shot('4_end') });
    const r1 = await page.evaluate(() => ({ res: window.__SWIPE__.result, share: window.__SWIPE__.shareText() }));
    console.log('CAREER 1 (balanced):', JSON.stringify(r1.res));
    console.log('SHARE TEXT ↓\n' + r1.share);

    // a few more careers with random swipes to collect endings
    for (let k = 0; k < 4; k++) {
        await page.click('#again');
        await page.waitForTimeout(400);
        await page.evaluate(() => new Promise((resolve) => {
            const step = () => { if (window.__SWIPE__.result) return resolve(); document.getElementById(Math.random() < 0.5 ? 'bl' : 'br').click(); setTimeout(step, 360); };
            step();
        }));
        const r = await page.evaluate(() => window.__SWIPE__.result);
        console.log(`CAREER ${k + 2} (random): ${r.title} after ${r.years} years · found ${r.found}/${r.total}`);
    }
    await page.waitForTimeout(300);
    await page.screenshot({ path: shot('5_end_collection') });
    console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
    await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
