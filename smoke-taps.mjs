// Regression: menu tap targets must cover the whole label, including its right half and just
// below it (phone thumbs land low/right). The old hit areas were shifted up-left by half their
// size, so TAP TO START ignored taps on its right half (confirmed on Android Chrome, 2026-10-06).
import { chromium } from 'playwright';
import { preview } from 'vite';

const server = await preview({ configFile: 'vite/config.prod.mjs', preview: { port: 4176 } });
const browser = await chromium.launch();
const results = [];

async function tapAt(path, gx, gy, setup) {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto('http://localhost:4176/');
    await page.waitForFunction(() => window.__BW_GAME__?.scene?.getScene('MainMenu')?.sys?.isActive(), null, { timeout: 15000 });
    await page.waitForTimeout(500);
    if (setup) await setup(page);
    const c = await page.evaluate(([x, y]) => {
        const r = document.querySelector('canvas').getBoundingClientRect();
        return { x: r.left + x * r.width / 480, y: r.top + y * r.height / 854 };
    }, [gx, gy]);
    await page.touchscreen.tap(c.x, c.y);
    await page.waitForTimeout(900);
    const active = await page.evaluate(() => window.__BW_GAME__.scene.getScenes(true).map(s => s.sys.settings.key));
    await ctx.close();
    return active;
}

// TAP TO START (centre 240,427): centre, left, right edge, just below
for (const [label, x, y] of [['start centre', 240, 427], ['start left', 160, 427], ['start right', 320, 427], ['start below', 240, 445]]) {
    const active = await tapAt('/', x, y);
    results.push([label, active.includes('OverworldScene')]);
}
// SETTINGS link (centre 240,480): right edge opens Settings
results.push(['settings right', (await tapAt('/', 268, 480)).includes('Settings')]);
// Settings BACK (centre 240,780): right edge returns to the menu
results.push(['back right', (await tapAt('/', 262, 780, async (page) => {
    await page.evaluate(() => window.__BW_GAME__.scene.start('Settings'));
    await page.waitForTimeout(400);
})).includes('MainMenu')]);

for (const [label, ok] of results) console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
const pass = results.every(([, ok]) => ok);
console.log(pass ? 'SMOKE-TAPS PASS' : 'SMOKE-TAPS FAIL');
await browser.close(); await server.close();
process.exit(pass ? 0 : 1);
