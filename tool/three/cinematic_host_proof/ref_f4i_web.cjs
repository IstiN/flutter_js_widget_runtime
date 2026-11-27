// ref_f4i_web.cjs — F4i host proof, web leg (issue #8, segment F4i): the
// committed core cinematic module (example/web/cinematic_core.mjs), the
// committed pinned three (example/web), the staged stock AfterimagePass and
// the proof program (cinematic_host_proof/widget_f4i.js) run in ONE Chrome
// session against a jsr shim backed by the real WebGL2 canvas. The shim's
// capture host is the downstream export path: it takes the canvas PNG at
// every captureFrame(clock) barrier, hands the exact bytes to this driver
// (which writes <out>/frame_<nnnn>.png) and returns them to the page, where
// the program decodes the PNG back to RGBA and hashes it.
//
// A second session runs WITHOUT jsr.capture (REG-HOST-CAPTURE): the export
// must reject with the named error cinematic.notCapturable and no file may
// be written.
//
// Run from the repo root (cases_f4i.sh drives it):
//   node tool/three/cinematic_host_proof/ref_f4i_web.cjs \
//     --afterimage /tmp/f4i/afterimage_f4i.js --out /tmp/f4i/web
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.JSR_PLAYWRIGHT_PATH || '/tmp/node_modules/playwright');

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : dflt; };
const kAfterimage = path.resolve(opt('afterimage', '/tmp/f4i/afterimage_f4i.js'));
const kOutDir = path.resolve(opt('out', '/tmp/f4i/web'));
const kProof = path.resolve(__dirname); // tool/three/cinematic_host_proof
const kWebDir = path.resolve(__dirname, '../../..', 'example/web');
const kChannel = process.env.JSR_WEBGL_REF_CHANNEL || 'chrome';

const W = 96, H = 64;
const FRAMES = 24;
const CHECKPOINTS = [
  { id: 'bloom', frame: 8 },
  { id: 'dof', frame: 16 },
  { id: 'temporal', frame: 24 },
];

// ── ESM unwrapping: the pinned three build (jsr_three_web.js = upstream
// three.module.js + three.core.js) is wrapped into plain scripts exactly
// like ref_1b_showcase.cjs / ref_1b_corpus.cjs do.
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

// The jsr shim the page runs under (the downstream host stand-in). capture
// present/absent switches between the full proof and REG-HOST-CAPTURE.
function shimScript(withCapture) {
  return `
(function () {
  globalThis.__F4I_PNGS = [];
  globalThis.__F4I_STATE = null;
  globalThis.__F4I_DONE = false;
  var canvas = null;
  globalThis.jsr = {
    log: function () {},
    exportState: function (state) {
      globalThis.__F4I_STATE = state;
      globalThis.__F4I_DONE = true;
    },
    three: {
      createCanvas: function (id) {
        var c = document.createElement('canvas');
        c.width = ${W}; c.height = ${H};
        canvas = c;
        return c;
      }
    }${withCapture ? `,
    capture: function (opts) {
      // The downstream export path: the host reads the presented frame at
      // the captureFrame(clock) barrier, encodes the straight-alpha PNG
      // itself (never the browser's color-managed canvas export), keeps the
      // exact bytes for the driver to write, and resolves like a real
      // capture host would.
      var frame = opts && opts.clock && opts.clock.frame;
      var gl = canvas.getContext('webgl2');
      var px = new Uint8Array(${W} * ${H} * 4);
      gl.readPixels(0, 0, ${W}, ${H}, gl.RGBA, gl.UNSIGNED_BYTE, px);
      return globalThis.__F4I_PNG_ENCODE(px, ${W}, ${H}).then(function (dataUrl) {
        globalThis.__F4I_PNGS.push({ frame: frame, b64: dataUrl.slice(dataUrl.indexOf(',') + 1) });
        return { dataUrl: dataUrl, width: ${W}, height: ${H} };
      });
    }` : ''}
  };
  globalThis.__F4I_NO_CAPTURE = ${withCapture ? 'false' : 'true'};
})();
`;
}

(async () => {
  const threeCore = wrapThreeCore(fs.readFileSync(path.join(kWebDir, 'three.core.js'), 'utf8'));
  const threeModule = wrapThreeModule(fs.readFileSync(path.join(kWebDir, 'jsr_three_web.js'), 'utf8'));
  const coreSource = fs.readFileSync(path.join(kWebDir, 'cinematic_core.mjs'), 'utf8');
  const sceneSource = fs.readFileSync(path.join(kProof, 'scene_f4i.js'), 'utf8');
  const afterimageSource = fs.readFileSync(kAfterimage, 'utf8');
  const programSource = fs.readFileSync(path.join(kProof, 'widget_f4i.js'), 'utf8');

  // One proof session: the shim, the committed three, the core cinematic
  // module (installed on jsr.three.cinematic), the staged stock
  // AfterimagePass, the scene and the shared program in one page.
  async function runSession(browser, withCapture) {
    const page = await browser.newPage({ viewport: { width: W + 40, height: H + 40 } });
    page.on('pageerror', (e) => console.error('[pageerror] ' + e.message));
    page.on('console', (m) => {
      const text = m.text();
      if (m.type() === 'error') console.error('[console] ' + text);
      else if (text.startsWith('F4I_')) console.log('[page] ' + text);
    });
    await page.setContent('<!doctype html><html><body></body></html>');
    await page.addScriptTag({ content: shimScript(withCapture) });
    await page.addScriptTag({ content: threeCore });
    await page.addScriptTag({ content: threeModule });
    await page.addScriptTag({ content: afterimageSource });
    await page.addScriptTag({
      type: 'module',
      content: coreSource +
        '\nglobalThis.jsr.three = globalThis.jsr.three || {};\n' +
        'globalThis.jsr.three.cinematic = cinematicSurface;\n',
    });
    await page.addScriptTag({ type: 'module', content: sceneSource });
    await page.addScriptTag({ content: programSource });
    await page.waitForFunction('globalThis.__F4I_DONE === true', null,
      { timeout: withCapture ? 180000 : 120000 });
    const state = await page.evaluate(() => globalThis.__F4I_STATE);
    const pngs = await page.evaluate(() => globalThis.__F4I_PNGS);
    await page.close();
    return { state, pngs };
  }

  fs.mkdirSync(kOutDir, { recursive: true });
  let exitCode = 0;
  try {
    // ── Session 1: the full proof (capture host present). One browser per
    // session: the two sessions are independent proof runs, and a GPU crash
    // in one must not take the other's evidence down.
    const browser1 = await chromium.launch({ channel: kChannel, headless: true });
    const session1 = await runSession(browser1, true);
    await browser1.close();

    // ── Session 2: REG-HOST-CAPTURE — the capability is removed through the
    // host configuration (no capture host). The export must fail with the
    // named error before ANY file is written.
    const dir2 = kOutDir + '_nocap';
    fs.rmSync(dir2, { recursive: true, force: true });
    fs.mkdirSync(dir2, { recursive: true });
    const browser2 = await chromium.launch({ channel: kChannel, headless: true });
    const session2 = await runSession(browser2, false);
    await browser2.close();

    // The driver writes the PNG-sequence files, exactly what the downstream
    // host does with the barrier bytes.
    for (const p of session1.pngs) {
      const file = path.join(kOutDir, 'frame_' + String(p.frame).padStart(4, '0') + '.png');
      fs.writeFileSync(file, Buffer.from(p.b64, 'base64'));
    }
    const files = fs.readdirSync(kOutDir).filter((f) => /^frame_\d{4}\.png$/.test(f)).sort();
    console.log('F4I_FILES dir=' + kOutDir + ' count=' + files.length +
      (files.length ? ' first=' + files[0] + ' last=' + files[files.length - 1] : ''));
    if (session1.state && session1.state.error) console.log('F4I_ERROR ' + session1.state.error);
    printState(session1.state);

    const err = session2.state && session2.state.exportError;
    const named = !!(err && err.message && err.message.indexOf('cinematic.notCapturable') >= 0);
    const written2 = fs.readdirSync(dir2).filter((f) => f.endsWith('.png')).length;
    if (!named || session2.pngs.length !== 0 || written2 !== 0) exitCode = 1;
    console.log('F4I_NOCAP_RESULT named=' + named +
      ' error=' + JSON.stringify(err) +
      ' captures=' + session2.pngs.length + ' files=' + written2 +
      ' filesReported=' + (session2.state && session2.state.filesWritten));

    const ok1 = proofOk(session1.state, session1.pngs.length);
    if (!ok1.ok) { console.log('F4I_FAIL ' + ok1.reason); exitCode = 1; }
  } catch (e) {
    console.error('F4I_ERROR driver: ' + (e && e.message ? e.message : e));
    exitCode = 1;
  }
  if (exitCode === 0) console.log('F4I_WEB_PASS');
  process.exit(exitCode);
})().catch((e) => {
  console.error('F4I_ERROR driver: ' + (e && e.message ? e.message : e));
  process.exit(1);
});

function printState(state) {
  if (!state) return;
  const cpIds = ['bloom', 'dof', 'temporal'];
  let equal = 0;
  for (const id of cpIds) {
    const prev = state.hashes['prev_' + id];
    const shot = state.hashes['shot_' + id];
    const png = state.png && state.png.hashes['png_' + id];
    const eq = state.flags['shot_equals_prev_' + id] === true &&
      state.flags['png_equals_prev_' + id] === true;
    if (eq) equal++;
    console.log('F4I_CHECKPOINT ' + id + ' prev=' + prev + ' shot=' + shot + ' png=' + png + ' equal=' + eq);
  }
  console.log('F4I_SUMMARY checkpoints=3 equal=' + equal + ' files=' + (state.png && state.png.files));
  console.log('F4I_FLAGS ' + JSON.stringify({ ai: state.flags.ai_history_depth,
    recTemporal: state.flags.reconstruct_frames_temporal,
    directDiffers: state.flags.temporal_direct_without_window_differs }));
  console.log('F4I_COUNTS ' + JSON.stringify(state.counts));
  console.log('F4I_DIFFS ' + JSON.stringify(state.diffs));
  console.log('F4I_COMPOSITE ' + JSON.stringify(state.composite));
}

function proofOk(state, capturedFiles) {
  if (!state) return { ok: false, reason: 'no exported state' };
  if (state.error) return { ok: false, reason: 'program error: ' + state.error };
  if (capturedFiles !== FRAMES + 1) return { ok: false, reason: 'expected ' + (FRAMES + 1) + ' captures, got ' + capturedFiles };
  for (const cp of CHECKPOINTS) {
    const eq = state.flags['shot_equals_prev_' + cp.id] === true &&
      state.flags['png_equals_prev_' + cp.id] === true;
    if (!eq) return { ok: false, reason: 'checkpoint ' + cp.id + ' not hash-equal across the three capture paths' };
    const present = state.diffs['presence_' + cp.id];
    if (!(present > 100)) return { ok: false, reason: 'checkpoint ' + cp.id + ' effect not visible (diff ' + present + ')' };
  }
  const c = state.composite || {};
  const checks = c.checks || {};
  if (!(checks.blendDark && checks.blendLight && checks.opaqueStable && checks.backgroundLive)) {
    return { ok: false, reason: 'composite over the two backgrounds failed: ' + JSON.stringify(checks) };
  }
  if (!(c.overlayVisibleDark && c.overlayVisibleLight)) {
    return { ok: false, reason: 'overlay lost over a background: ' + JSON.stringify(c) };
  }
  if (state.flags.temporal_direct_without_window_differs !== true) {
    return { ok: false, reason: 'the temporal checkpoint is not genuinely temporal (bare direct seek equals the replayed window)' };
  }
  return { ok: true };
}
