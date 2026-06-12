import { chromium } from 'playwright';
import { preview } from 'vite';
const server = await preview({ configFile: 'vite/config.prod.mjs', preview: { port: 4174 } });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(`[console.error] ${m.text()}`); });
page.on('pageerror', e => errors.push(`[pageerror] ${e.message}`));
await page.goto('http://localhost:4174/');
await page.waitForTimeout(5000);
const box = await page.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
const sx = box.x + box.w * (240 / 480);
const sy = box.y + box.h * (427 / 854);
console.log('CLICK AT', Math.round(sx), Math.round(sy), 'canvas:', JSON.stringify(box));
// try several times to beat the blink window
for (let i = 0; i < 6; i++) { await page.mouse.click(sx, sy); await page.waitForTimeout(400); }
await page.waitForTimeout(3000);
await page.screenshot({ path: 'smoke-result.png' });
console.log('ERRORS:', errors.length ? '\n' + errors.join('\n') : 'none');
await browser.close(); await server.close(); process.exit(0);
