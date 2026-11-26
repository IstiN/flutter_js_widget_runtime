// ref_f4b_cases.cjs — F4b web leg driver (issue #8, segment F4b): the shared
// battery (tool/three/cases_f4b/f4b_case_source.js) runs the core cinematic
// pipeline (stock UnrealBloomPass) in a BARE Playwright-driven Chrome page —
// real WebGL2 context, no ANGLE lane, no Dart runtime — and prints the
// result object plus the summary line:
//
//   F4B_RESULT <single-line JSON of the battery result object>
//   F4B_SUMMARY checks=<n> pass=<n>
//
// Exit 1 unless every battery check passes. The page loads the committed WEB
// bundle (assets/three/jsr_three_web.js — the same file the production web
// host loads; it installs globalThis.THREE and the jsr.three.cinematic
// surface), so the battery drives the IDENTICAL surface the native 1B leg
// drives. The direct-web probe mirrors the corpus E2E-WEB contract: no
// __jsr1b_gl lane, no Dart runtime, and the battery's renderer runs on the
// browser's real WebGL2 context.
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.JSR_PLAYWRIGHT_PATH || '/tmp/node_modules/playwright');

const ROOT = path.resolve(__dirname, '../../..');
const kCaseSource = path.join(__dirname, 'f4b_case_source.js');
const kBundle = path.join(ROOT, 'assets/three/jsr_three_web.js');
const kChannel = process.env.JSR_WEBGL_REF_CHANNEL || 'chrome';

const W = 320, H = 200;

const pageGlue = `
globalThis.__f4bRun = async function () {
  const cine = globalThis.jsr.three.cinematic;
  return await globalThis.__f4bBattery(globalThis.THREE, cine, {
    sleep: (ms) => new Promise((res) => setTimeout(res, ms)),
    captureFrame: async (clock, pipeline) => {
      try {
        const res = await pipeline.captureFrame(clock);
        return { ok: true, frame: clock.frame, path: (res && res.path) || null };
      } catch (e) {
        return { ok: false, error: (e && e.name) || String(e) };
      }
    }
  });
};
globalThis.__f4bBufferCounts = function (kit) {
  function hf(h){const s=(h&0x8000)>>15,e=(h&0x7C00)>>10,f=h&0x03FF;if(e===0)return(s?-1:1)*Math.pow(2,-14)*(f/1024);if(e===0x1F)return f?NaN:(s?-Infinity:Infinity);return(s?-1:1)*Math.pow(2,e-15)*(1+f/1024);}
  const composer = kit.pipeline.composer;
  const renderer = kit.renderer;
  function count(t) {
    const raw = new Uint16Array(320*180*4);
    renderer.readRenderTargetPixels(t, 0, 0, 320, 180, raw);
    let o = 0, mx = -9;
    for (let i = 3; i < raw.length; i += 4) { const v = hf(raw[i]); if (v >= 1) o++; if (v > mx) mx = v; }
    return { opaque: o, mx: Math.round(mx*100)/100 };
  }
  return { rb: count(composer.readBuffer), wb: count(composer.writeBuffer),
    size: [composer.readBuffer.width, composer.readBuffer.height] };
};
globalThis.__f4bProbe = function () {
  return {
    nativeContext: typeof (globalThis.THREE && globalThis.THREE.WebGLRenderer) === 'function',
    no1bLane: typeof globalThis.__jsr1b_gl === 'undefined',
    barePage: typeof globalThis.dartInitialized === 'undefined'
  };
};
`;

(async () => {
  const bundle = fs.readFileSync(kBundle, 'utf8');
  const caseSource = fs.readFileSync(kCaseSource, 'utf8');

  const browser = await chromium.launch({ channel: kChannel, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: W + 40, height: H + 40 } });
    page.on('pageerror', (e) => console.error('[pageerror] ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') console.error('[console] ' + m.text()); });
    await page.setContent('<!doctype html><html><body></body></html>');

    await page.addScriptTag({ content: bundle });
    await page.addScriptTag({ content: caseSource });
    await page.addScriptTag({ content: pageGlue });

    const probe = await page.evaluate(() => globalThis.__f4bProbe());
    if (!(probe.no1bLane && probe.barePage && probe.nativeContext)) {
      console.error('F4B_ERROR direct-web probe failed: ' + JSON.stringify(probe));
      process.exit(1);
    }
    const result = await page.evaluate(() => globalThis.__f4bRun());
    const checks = result.checks || [];
    const pass = checks.filter((c) => c.ok === true).length;
    console.log('F4B_DIRECT ' + JSON.stringify(probe));
    console.log('F4B_RESULT ' + JSON.stringify(result));
    console.log('F4B_SUMMARY checks=' + checks.length + ' pass=' + pass);
    if (pass !== checks.length || checks.length === 0) {
      for (const c of checks) if (!c.ok) console.error('F4B_FAIL ' + c.name + ': ' + c.detail);
      process.exit(1);
    }
    process.exit(0);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error('F4B_ERROR ' + (e && e.message ? e.message : e));
  process.exit(1);
});
