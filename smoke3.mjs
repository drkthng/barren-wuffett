// Regression test: PaperThrowScene must be playable TWICE (state reset in init)
import { chromium } from 'playwright';
import { preview } from 'vite';
const server = await preview({ configFile: 'vite/config.prod.mjs', preview: { port: 4175 } });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
const errors = [];
page.on('pageerror', e => errors.push(`[pageerror] ${e.message}`));
await page.goto('http://localhost:4175/');
await page.waitForTimeout(5000);

const runRound = async (n) => await page.evaluate(async (round) => {
  const game = window.__BW_GAME__;
  const sm = game.scene;
  // stop whatever gameplay scene is active, launch the minigame directly
  ['MainMenu','OverworldScene','UIScene','BossScene'].forEach(k => { try { sm.stop(k); } catch {} });
  try { sm.stop('PaperThrowScene'); } catch {}
  await new Promise(r => setTimeout(r, 300));
  sm.start('PaperThrowScene', {});
  await new Promise(r => setTimeout(r, 500));
  const sc = sm.getScene('PaperThrowScene');
  const before = sc.phase; // private, but accessible at runtime
  // countdown: 3 ticks at 1s + buffer
  await new Promise(r => setTimeout(r, 4500));
  const after = sc.phase;
  return { round, before, after };
}, n);

const r1 = await runRound(1);
console.log('ROUND1', JSON.stringify(r1));
const r2 = await runRound(2);
console.log('ROUND2', JSON.stringify(r2));
console.log('ERRORS:', errors.length ? errors.join(' | ') : 'none');
const pass = r1.after === 'game' && r2.after === 'game' && errors.length === 0;
console.log(pass ? 'SMOKE3 PASS' : 'SMOKE3 FAIL');
await browser.close(); await server.close(); process.exit(pass ? 0 : 1);
