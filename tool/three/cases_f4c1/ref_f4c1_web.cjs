#!/usr/bin/env node
// ref_f4c1_web.cjs — the F4c1 web reference leg + tier compare (issue #8,
// segment F4c1: E2E-MOTION-* / IT-HISTORY-* / E2E-DOF-*).
//
// Mode `web` (default): load the committed three web bundle (unwrapped into
// plain scripts exactly like ref_1b_showcase.cjs), the committed core
// cinematic ESM (tool/three/gen/cinematic_core.mjs), the F4c1 scene and the
// SHARED widget checkpoint program (cases_f4c1/widget_f4c1.js — the same
// text the Dart engine/1B tests run) in headless Chrome WebGL2. Writes
//   <dir>/web_manifest.json   {hashes, diffs, flags, historyDepth, error}
//   <dir>/web_<cp>.rgba       the dumped checkpoints (raw RGBA bytes)
// Exit 1 when the program errored or a required flag is false.
//
// Mode `compare`: for every checkpoint with BOTH legs' dumps present, run
// the corpus tier logic (tool/three/corpus/diff_1b.cjs — identical algorithm
// and thresholds as corpus_1b.sh), print
//   F4C1_TIER <cp> <tier> hash1b=<h> hashweb=<h> matchingPct=<p>
// write <dir>/tiers.json and
//   F4C1_SUMMARY total=<n> identical=<n> tolerance=<n> fail=<n> missing=<n>
// Exit 1 on any FAIL.
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const args = process.argv.slice(2);
const mode = args[0] && !args[0].startsWith('--') ? args[0] : 'web';
const opt = (name, dflt) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : dflt; };

const kDir = path.resolve(opt('dir', '/tmp/f4c1'));
const kWebDir = path.resolve(__dirname, '../../../example/web');
const kToolDir = path.resolve(__dirname, '..');
const kChannel = process.env.JSR_WEBGL_REF_CHANNEL || 'chrome';
const W = 96, H = 64;
// The checkpoints whose dumps feed the 1B-vs-web tier measurement.
const TIER_CHECKPOINTS = ['m_sh05', 'dof_near', 'fr_on', 'ai_seq24'];

function braceList(line, open, close) {
  const a = line.indexOf(open) + open.length, b = line.lastIndexOf(close);
  if (a <= 0 || b < a) throw new Error('ESM list parse failed: ' + line.slice(0, 60));
  return line.slice(a, b).split(',').map((s) => s.trim()).filter((s) => s.length > 0);
}
function dropLines(src) {
  return src.split('\n').filter((l) => {
    const t = l.trimLeft();
    return !t.startsWith('import ') && !t.startsWith('export {');
  }).join('\n');
}
function wrapThreeCore(core) {
  const exportLine = core.split('\n').find((l) => l.trimLeft().startsWith('export {'));
  if (!exportLine) throw new Error('three.core.js: no export line');
  const exports = braceList(exportLine, 'export {', '};');
  return '(function () {\n' + dropLines(core) + '\nglobalThis.__threeCore = { ' + exports.join(', ') + ' };\n})();';
}
function wrapThreeModule(module) {
  const lines = module.split('\n');
  const importLine = lines.find((l) => l.trimLeft().startsWith('import {'));
  if (!importLine) throw new Error('jsr_three_web.js: no import line');
  const importNames = braceList(importLine, 'import {', '} from');
  const exportLines = lines.filter((l) => l.trimLeft().startsWith('export {'));
  const reExportLines = exportLines.filter((l) => l.includes('} from'));
  if (reExportLines.length !== 1 || exportLines.length !== 2) throw new Error('jsr_three_web.js export shape changed');
  const reExportNames = braceList(reExportLines[0], 'export {', '} from');
  const exportNames = braceList(exportLines[exportLines.length - 1], 'export {', '};');
  const coreBridge = reExportNames.map((n) => n + ': __threeCore["' + n + '"]').join(', ');
  return '(function () {\nconst { ' + importNames.join(', ') + ' } = globalThis.__threeCore;\n' + dropLines(module) + '\n' +
    'globalThis.THREE = Object.assign({ ' + coreBridge + ' }, { ' + exportNames.join(', ') + ' });\n})();';
}
function asModuleWithGlobal(source, globalName, names) {
  return source + '\nglobalThis.' + globalName + ' = { ' + names.join(', ') + ' };\n';
}

const JSR_SHIM = `
globalThis.jsr = {
  exportState: (r) => { globalThis.__RESULTS = r; },
  three: {
    cinematic: {
      createPipeline: globalThis.__CINE_CORE.createPipeline,
      clockState: globalThis.__CINE_CORE.clockState,
      cinematicRandom: globalThis.__CINE_CORE.cinematicRandom
    },
    createCanvas: () => document.createElement('canvas')
  }
};
`;

function b64decode(s) { return Buffer.from(s, 'base64'); }

(async () => {
  fs.mkdirSync(kDir, { recursive: true });
  if (mode === 'compare') return compare();
  return web();
})().catch((e) => { console.error('F4C1_ERROR ' + (e && e.message ? e.message : e)); process.exit(1); });

async function web() {
  const { chromium } = require(process.env.JSR_PLAYWRIGHT_PATH || '/tmp/node_modules/playwright');
  const sceneSource = fs.readFileSync(path.join(__dirname, 'scene_f4c1.js'), 'utf8');
  const widgetSource = fs.readFileSync(path.join(__dirname, 'widget_f4c1.js'), 'utf8');
  const coreSource = fs.readFileSync(path.join(kToolDir, 'gen/cinematic_core.mjs'), 'utf8');
  const threeCore = wrapThreeCore(fs.readFileSync(path.join(kWebDir, 'three.core.js'), 'utf8'));
  const threeModule = wrapThreeModule(fs.readFileSync(path.join(kWebDir, 'jsr_three_web.js'), 'utf8'));

  const browser = await chromium.launch({ channel: kChannel, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: W + 40, height: H + 40 } });
    page.on('pageerror', (e) => console.error('[pageerror] ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') console.error('[console] ' + m.text()); });
    await page.setContent('<!doctype html><html><body></body></html>');
    await page.addScriptTag({ content: threeCore });
    await page.addScriptTag({ content: threeModule });
    await page.addScriptTag({
      type: 'module',
      content: asModuleWithGlobal(coreSource, '__CINE_CORE',
        ['createPipeline', 'clockState', 'cinematicRandom']),
    });
    await page.addScriptTag({ content: sceneSource });
    await page.addScriptTag({ content: JSR_SHIM });
    await page.addScriptTag({ content: widgetSource });

    const results = await page.evaluate(() => globalThis.__RESULTS);
    if (!results) throw new Error('the widget program never exported its results');
    if (results.error) {
      console.log('F4C1_WEB_ERROR ' + results.error);
      process.exit(1);
    }
    fs.writeFileSync(path.join(kDir, 'web_manifest.json'), JSON.stringify(results, null, 1));
    for (const cp of TIER_CHECKPOINTS) {
      const dump = results.dumps && results.dumps[cp];
      if (!dump) throw new Error('web leg missing dump ' + cp);
      fs.writeFileSync(path.join(kDir, 'web_' + cp + '.rgba'), b64decode(dump));
    }
    console.log('F4C1_WEB hashes=' + Object.keys(results.hashes).length +
      ' flags=' + JSON.stringify(results.flags) +
      ' historyDepth=' + results.historyDepth);
    const bad = Object.keys(results.flags).filter((k) => results.flags[k] !== true);
    if (bad.length > 0) {
      console.log('F4C1_WEB failed flags: ' + bad.join(', '));
      process.exit(1);
    }
    console.log('F4C1_WEB_OK');
  } finally {
    await browser.close();
  }
}

function compare() {
  const rows = [];
  let identical = 0, tolerance = 0, fail = 0, missing = 0;
  for (const cp of TIER_CHECKPOINTS) {
    const oneb = path.join(kDir, 'oneb_' + cp + '.rgba');
    const web = path.join(kDir, 'web_' + cp + '.rgba');
    if (!fs.existsSync(oneb) || !fs.existsSync(web)) {
      missing++;
      console.log('F4C1_TIER ' + cp + ' MISSING (oneb=' + fs.existsSync(oneb) + ' web=' + fs.existsSync(web) + ')');
      continue;
    }
    const manifest = JSON.parse(fs.readFileSync(path.join(kDir, 'web_manifest.json'), 'utf8'));
    const hashWeb = manifest.hashes[cp] || 'unknown';
    const hash1b = readHash(oneb);
    let out;
    try {
      out = execFileSync('node', [path.join(kToolDir, 'corpus/diff_1b.cjs'), oneb, web, String(W), String(H)], { encoding: 'utf8' });
    } catch (e) {
      out = e.stdout || '';
    }
    const pct = (out.match(/matchingPct=([0-9.]+)/) || [])[1] || '0';
    const tier = hash1b === hashWeb ? 'PASS_IDENTICAL' : (Number(pct) >= 99.0 ? 'PASS_TOLERANCE' : 'FAIL');
    if (tier === 'PASS_IDENTICAL') identical++;
    else if (tier === 'PASS_TOLERANCE') tolerance++;
    else fail++;
    rows.push({ cp, tier, pct: Number(pct), hash1b, hashWeb });
    console.log('F4C1_TIER ' + cp + ' ' + tier + ' hash1b=' + hash1b + ' hashweb=' + hashWeb + ' matchingPct=' + pct + ' ' + out.trim());
  }
  fs.writeFileSync(path.join(kDir, 'tiers.json'), JSON.stringify(rows, null, 1));
  console.log('F4C1_SUMMARY total=' + rows.length + ' identical=' + identical + ' tolerance=' + tolerance + ' fail=' + fail + ' missing=' + missing);
  if (fail > 0) process.exit(1);
}

// FNV-1a over a raw rgba dump (only used when the tier line carried no hash).
function readHash(file) {
  const buf = fs.readFileSync(file);
  let h = 0x811c9dc5;
  for (let i = 0; i < buf.length; i++) { h ^= buf[i]; h = Math.imul(h, 0x01000193) >>> 0; }
  return '0x' + h.toString(16).padStart(8, '0');
}
