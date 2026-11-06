// Real-wall-clock fallback for asynchronous official examples whose models
// do not finish within Chrome's virtual-time budget.
// npm install --prefix /tmp/three_visual_tools playwright-core
// NODE_PATH=/tmp/three_visual_tools/node_modules node tool/three_visual/capture_reference.cjs \
//   http://localhost:8080/examples/webgl_animation_keyframes.html /tmp/reference.png 20000
const fs = require('node:fs');
const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('console', m => console.log('CONSOLE', m.type(), m.text()));
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(process.argv[2], { waitUntil: 'load', timeout: 60000 });
  const waitMs = Number(process.argv[4] || 15000);
  await page.waitForTimeout(waitMs);
  await page.screenshot({ path: process.argv[3] });
  const performanceRecord = await page.evaluate(async () => {
    const text = document.body.innerText;
    const stats = text.match(/([\d.]+)\s+FPS(?:\s*\(([^)]+)\))?/);
    const started = performance.now();
    let frames = 0;
    await new Promise(resolve => {
      const tick = () => {
        frames++;
        const elapsed = performance.now() - started;
        if (elapsed >= 2000) resolve(); else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const elapsedMs = performance.now() - started;
    return {
      statsFps: stats ? Number(stats[1]) : null,
      statsRange: stats && stats[2] ? stats[2] : null,
      browserRafFps: frames * 1000 / elapsedMs,
      sampleMs: elapsedMs,
      frames,
    };
  });
  fs.writeFileSync(process.argv[3] + '.performance.json', JSON.stringify({
    ...performanceRecord, captureWaitMs: waitMs,
  }, null, 2) + '\n');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
