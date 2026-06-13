import { chromium } from 'playwright';

const URL = 'http://localhost:5180/';
const DIR = '.planning/spikes/001-cozy-art-pipeline/';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 720, height: 480 }, deviceScaleFactor: 2 });

const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

await page.goto(URL, { waitUntil: 'load' });
await page.waitForSelector('canvas', { timeout: 10000 });
await page.waitForTimeout(2600); // let assets load + first anims settle
await page.screenshot({ path: DIR + '_shot_1_idle.png' });

// walk right for a moment (profile anim + camera scroll)
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(1300);
await page.screenshot({ path: DIR + '_shot_2_right.png' });
await page.keyboard.up('ArrowRight');

// walk down
await page.keyboard.down('ArrowDown');
await page.waitForTimeout(1100);
await page.screenshot({ path: DIR + '_shot_3_down.png' });
await page.keyboard.up('ArrowDown');

console.log('SHOTS_DONE errors=' + JSON.stringify(errors));
await browser.close();
