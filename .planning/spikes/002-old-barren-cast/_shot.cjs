// Headless render check for spike 002: screenshots the cast gallery, reports console errors.
const { chromium } = require('D:/AiProjects/barren-wuffett/node_modules/playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5180/002-old-barren-cast/');
  await p.waitForFunction(() => window.__CAST_READY__ === true, null, { timeout: 10000 });
  await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(__dirname, '_shot_gallery.png'), fullPage: true });
  console.log('errors:', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
