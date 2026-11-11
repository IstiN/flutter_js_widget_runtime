// ref_1b_corpus.cjs — M4 corpus web ground truth: evaluate the SAME
// driver-wrapped scene.js (from bundle_corpus_scene.mjs) as run_1b_corpus.dart
// in real headless Chrome WebGL2 (Playwright), with the SAME corpus_dom.js
// shim. Asset reads + image decodes are served by the driver over
// exposeFunction bridges (fetch-stub equivalent of the Dart host fns).
//
// Run from the repo root:
//   node tool/three/ref_1b_corpus.cjs --id three-buffergeometry-lines \
//     --scene /tmp/a1b_corpus/three-buffergeometry-lines/scene.scene.js \
//     --widget-dir example/widgets/three-buffergeometry-lines \
//     --out /tmp/a1b_corpus/three-buffergeometry-lines
'use strict';

const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');
const { chromium } = require('/tmp/node_modules/playwright');

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : dflt; };
const kId = opt('id', null);
const kScene = path.resolve(opt('scene', ''));
const kWidgetDir = path.resolve(opt('widget-dir', ''));
const kOut = path.resolve(opt('out', ''));

if (!kId || !kScene || !kWidgetDir || !kOut) {
  console.error('usage: --id <id> --scene <scene.js> --widget-dir <dir> --out <dir>');
  process.exit(2);
}

const kCorpusDom = path.resolve(__dirname, 'corpus/corpus_dom.js');
const kCorpusXmlDom = path.resolve(__dirname, 'corpus/corpus_xmldom.js');
const kCorePath = path.resolve(__dirname, '../../example/web/three.core.js');
const kModulePath = path.resolve(__dirname, '../../example/web/jsr_three_web.js');

// ESM transform (same logic as run_1b_render.dart / ref_1b_scene.cjs).
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

// Asset registry identical to the Dart side: prepare_manifest assetDiscovery
// url -> output map + all files present in the widget dir.
const ASSET_CACHE_DIR = '/tmp/a1b_corpus/asset_cache';
const PIN_COMMIT = '9b4a2ac29c63ccb43fd51c5661f2f873ac2c39b8';
const DRACO_FLAT_PREFIX = 'file:__corpus__libs__draco__';
const flatName = (url) => url.replace(/[^A-Za-z0-9._-]+/g, '__');
const threeSrcRoot = () => {
  for (const c of [process.env.THREE_SRC, '/tmp/jsr-three-r186', '/Users/Uladzimir_Klyshevich/git/references/three.js']) {
    if (c && fs.existsSync(c) && fs.statSync(c).isDirectory()) return c;
  }
  return null;
};
const extractFromPinnedSource = (srcRoot, relInExamples) => {
  if (!srcRoot) return null;
  if (fs.existsSync(path.join(srcRoot, '.git'))) {
    try {
      return execFileSync('git', ['-C', srcRoot, 'show', `${PIN_COMMIT}:${relInExamples}`]);
    } catch { return null; }
  }
  const f = path.join(srcRoot, relInExamples);
  return fs.existsSync(f) ? fs.readFileSync(f) : null;
};
const aliasAssetPath = (p) => {
  if (p.startsWith(DRACO_FLAT_PREFIX)) {
    const rest = p.slice(DRACO_FLAT_PREFIX.length).replace(/__/g, '/');
    const f = `/tmp/three_pkg/node_modules/three/examples/jsm/libs/draco/${rest}`;
    if (fs.existsSync(f)) return f;
  }
  return null;
};
const assetMap = {};
const manifestPath = path.join(kWidgetDir, 'prepare_manifest.json');
if (fs.existsSync(manifestPath)) {
  const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (const a of m.assetDiscovery || []) if (a.url && a.output) assetMap[a.url] = a.output;
  // Renamed outputs: match input source pins to produced files by sha256.
  const outBySha = {};
  for (const [k, v] of Object.entries(m.outputs || {})) if (v && v.sha256) outBySha[v.sha256] = k;
  for (const [k, v] of Object.entries(m.inputs || {})) {
    if (!k.startsWith('source/examples/')) continue;
    const url = k.slice('source/examples/'.length);
    const out = v && v.sha256 ? outBySha[v.sha256] : null;
    if (out) {
      if (!(url in assetMap)) assetMap[url] = out;
      const fl = flatName(url);
      if (!(fl in assetMap)) assetMap[fl] = out;
    }
  }
}
const assetFiles = fs.readdirSync(kWidgetDir).filter((f) => fs.statSync(path.join(kWidgetDir, f)).isFile());

// Reference-source fallback: scan the scene bundle for asset literals the
// widget dir lacks; extract once from the pinned three.js source into the
// shared cache (the web asset read falls back to it, like the Dart side).
(function seedAssetFallback() {
  let src;
  try { src = fs.readFileSync(kScene, 'utf8'); } catch { return; }
  const srcRoot = threeSrcRoot();
  const seen = new Set();
  let m;
  const re = /['"`]((?:\.\/)?(?:textures|models|sounds|fonts|environments|json|luts|screenshots)\/[^'"`\\]+?)['"`]/g;
  while ((m = re.exec(src)) !== null) {
    let url = m[1].replace(/^\.\//, '').split('#')[0].split('?')[0];
    if (!/^(?:textures|models|sounds|fonts|environments|json|luts|screenshots)\//.test(url)) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    const flat = flatName(url);
    const base = url.split('/').pop();
    const covered = Object.prototype.hasOwnProperty.call(assetMap, url) || assetFiles.includes(flat) || assetFiles.includes(base);
    if (covered) {
      // Repair pass: the widget pipeline sometimes re-exports a text model as
      // glTF binary while keeping its original extension (e.g. stormtroper.dae
      // holding GLB bytes) — ColladaLoader then chokes on binary garbage.
      // Restore the true source bytes so both tiers parse the real document.
      if (url.endsWith('.dae') || url.endsWith('.xml')) {
        const out = assetMap[url];
        for (const cand of [
          ...(out && out !== flat && out !== base ? [path.join(kWidgetDir, out)] : []),
          path.join(kWidgetDir, flat),
          path.join(kWidgetDir, base),
          path.join(ASSET_CACHE_DIR, flat),
        ]) {
          if (!fs.existsSync(cand)) continue;
          const head = fs.readFileSync(cand);
          if (head.length > 4 && head[0] === 0x67 && head[1] === 0x6c && head[2] === 0x54 && head[3] === 0x46) {
            const bytes = extractFromPinnedSource(srcRoot, `examples/${url}`);
            if (bytes != null) fs.writeFileSync(cand, bytes);
          }
          break;
        }
      }
      continue;
    }
    fs.mkdirSync(ASSET_CACHE_DIR, { recursive: true });
    const target = path.join(ASSET_CACHE_DIR, flat);
    if (!fs.existsSync(target)) {
      const bytes = extractFromPinnedSource(srcRoot, `examples/${url}`);
      if (bytes == null) continue;
      fs.writeFileSync(target, bytes);
    }
    if (!(url in assetMap)) assetMap[url] = flat;
    if (!(flat in assetMap)) assetMap[flat] = flat;
  }
})();

// <script id="..."> blocks from original.html (shader GLSL lookup upstream).
const htmlIdText = {};
const htmlPath = path.join(kWidgetDir, 'original.html');
if (fs.existsSync(htmlPath)) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const re = /<script[^>]*?id="([^"]+)"[^>]*?>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html)) !== null) htmlIdText[m[1]] = m[2].replace(/\n\s*$/, '\n');
}

// Sniff image type for the native decoder (img elements carry no mime).
function sniffMime(bytes) {
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png';
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (bytes.length > 6 && bytes.slice(0, 6).toString('ascii') === 'GIF87a' || bytes.slice(0, 6).toString('ascii') === 'GIF89a') return 'image/gif';
  if (bytes.length > 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) return 'image/bmp';
  return 'image/png';
}

function resolveAssetPath(url) {
  url = String(url).split('#')[0].split('?')[0];
  if (url.slice(0, 5) === 'data:') return null;
  if (Object.prototype.hasOwnProperty.call(assetMap, url)) return assetMap[url];
  const flat = url.replace(/^\.\//, '').replace(/\//g, '__');
  if (assetFiles.includes(flat)) return flat;
  const base = url.split('/').pop();
  if (assetFiles.includes(base)) return base;
  return flat;
}

function fnv1a(buf) {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < buf.length; i++) h = Math.imul(h ^ buf[i], 0x01000193) >>> 0;
  return h >>> 0;
}
const hex32 = (v) => '0x' + v.toString(16).padStart(8, '0');

// Canvas-acquisition adaptations (same sanction as M3): preserveDrawingBuffer
// for spec-guaranteed readback + stash the scene canvas. No pixel semantics.
const DRIVER = `
(function () {
  window.__htmlIdText = ${JSON.stringify(htmlIdText)};
  window.__nativeCreateElementNS = document.createElementNS.bind(document);
  var origGetCtx = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, attrs) {
    if (type === 'webgl2') attrs = Object.assign({}, attrs, { preserveDrawingBuffer: true });
    var ctx = origGetCtx.call(this, type, attrs);
    if (ctx && (type === 'webgl2' || type === 'webgl') && !ctx.__drawCountWrapped) {
      // Draw-activity gate: loop-less on-demand scenes settle during drains;
      // a scene that never issued a draw is a failure, not a PASS.
      ctx.__drawCountWrapped = true;
      window.__drawCalls = 0;
      ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced'].forEach(function (m) {
        var orig = ctx[m].bind(ctx);
        ctx[m] = function () { window.__drawCalls++; return orig.apply(null, arguments); };
      });
    }
    return ctx;
  };
  var origCreateNS = document.createElementNS;
  document.createElementNS = function (ns, tag) {
    var el = origCreateNS.call(document, ns, tag);
    if (String(tag).toLowerCase() === 'canvas') window.__sceneCanvas = el;
    return el;
  };
  window.__nativeCreateImageBitmap = window.createImageBitmap.bind(window);
  // corpus_dom shadows globalThis.Blob with a plain stub; native decode
  // (decodeRawB64 below) needs the real constructible Blob.
  window.__nativeBlob = window.Blob;
  function sniffMime(bytes) {
    if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png';
    if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
    if (bytes.length > 6 && (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46)) return 'image/gif';
    if (bytes.length > 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) return 'image/bmp';
    return 'image/png';
  }
  function decodeRawB64(b64, type) {
    var bytes = window.__b64toBytes(b64);
    var mime = (type && type.length > 0) ? type : sniffMime(bytes);
    return window.__nativeCreateImageBitmap(new window.__nativeBlob([bytes], { type: mime })).then(function (bmp) {
      var canvas = new OffscreenCanvas(bmp.width, bmp.height);
      var ctx = canvas.getContext('2d');
      ctx.drawImage(bmp, 0, 0);
      var d = ctx.getImageData(0, 0, bmp.width, bmp.height);
      var out = { ok: true, width: bmp.width, height: bmp.height, b64: window.__bytesToB64(new Uint8Array(d.data.buffer)) };
      bmp.close();
      return out;
    });
  }
  // Corpus bridges (same contract as the Dart prelude). __b64toBytes etc. are
  // installed later by corpus_dom.js; all calls happen after that.
  window.__assetReadRaw = function (p) {
    if (p == null) return Promise.resolve(null);
    return window.__corpusAssetRead(String(p));
  };
  window.__decodeImageFromPath = function (p) {
    return window.__assetReadRaw(p).then(function (raw) { return raw == null ? null : decodeRawB64(raw, ''); });
  };
  window.__decodeImageFromBytes = function (b64, type) {
    return decodeRawB64(String(b64), String(type || ''));
  };
})();
`;

const READBACK = `
(function () {
  var result = globalThis.__result || { ok: false, error: 'scene did not run' };
  var info = { ok: !!result.ok, error: result.error || null, revision: result.revision, jsErrors: globalThis.__corpusErrors || [] };
  if (result.ok) {
    var canvas = window.__sceneCanvas;
    if (!canvas) {
      // Scene never created a WebGL canvas (AR posters, audio-only demos):
      // synthesize the blank frame the 1B side reads back from its surface.
      info.w = 320; info.h = 240;
      info.glError = 0;
      info.noCanvas = true;
      info.pixelsB64 = window.__bytesToB64(new Uint8Array(320 * 240 * 4));
      window.__readback = info;
      return;
    }
    var gl = canvas.getContext('webgl2');
    var w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
    var px = new Uint8Array(w * h * 4);
    gl.getError(); // drain stale scene errors; the compositor readback is unaffected by the error flag
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    info.w = w; info.h = h;
    info.glError = gl.getError(); // readPixels-specific error; recorded as a note only
    info.drawCalls = window.__drawCalls || 0;
    info.pixelsB64 = window.__bytesToB64(px);
  }
  window.__readback = info;
})();
`;

async function main() {
  const scene = fs.readFileSync(kScene, 'utf8');
  const corpusDom = fs.readFileSync(kCorpusDom, 'utf8');
  const corpusXmlDom = fs.readFileSync(kCorpusXmlDom, 'utf8');
  const coreWrapped = wrapThreeCore(fs.readFileSync(kCorePath, 'utf8'));
  const moduleWrapped = wrapThreeModule(fs.readFileSync(kModulePath, 'utf8'));
  fs.mkdirSync(kOut, { recursive: true });

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
    await page.exposeFunction('__corpusAssetRead', (p) => {
      let f = path.join(kWidgetDir, p);
      if (!fs.existsSync(f)) f = path.join(ASSET_CACHE_DIR, p);
      if (!fs.existsSync(f)) {
        const alias = aliasAssetPath(p);
        if (alias) f = alias;
      }
      if (!fs.existsSync(f)) return null;
      return fs.readFileSync(f).toString('base64');
    });
console.error('PROGRESS setContent');
    await page.setContent('<!doctype html><html><head></head><body><div id="container"></div></body></html>');
    // corpus_dom hijacks document.createElement, so Playwright's addScriptTag
    // (which appends a real <script> node) cannot be used after it loads;
    // inject every stage through indirect eval in the main world instead.
    const inject = (code) => page.evaluate((c) => { (0, eval)(c); }, code);
    await page.evaluate(({ am, af }) => { window.__assetMap = am; window.__assetFiles = af; }, { am: assetMap, af: assetFiles });
console.error('PROGRESS driver');
    await inject(DRIVER);
    await inject(corpusXmlDom);
    await inject(corpusDom);
    await inject(coreWrapped);
    await inject(moduleWrapped);
console.error('PROGRESS pre-scene');
    await inject(scene);
console.error('PROGRESS scene-injected');
    // __result is published synchronously by the scene eval; poll from Node
    // (in-page timers are virtual-clock only).
    for (let wi = 0; wi < 150; wi++) {
      if (await page.evaluate(() => !!window.__result)) break;
      await new Promise((r) => setTimeout(r, 200));
    }
    if (!(await page.evaluate(() => !!window.__result))) throw new Error('scene __result never published');
    const sceneResult = await page.evaluate(() => window.__result);
    const ticks = (sceneResult && sceneResult.ticks) || 3;
    // Drain microtasks + genuinely-async native work (image decode): wait
    // until the corpus pending-async counter settles, then drive the pinned
    // frames. (Polling runs from Node — the in-page setInterval/rAF are
    // virtual-clock only, fired inside __corpusTick.)
console.error('PROGRESS result-ok');
    for (let wi = 0; wi < 75; wi++) {
      const p = await page.evaluate(() => (window.__corpusPending ? window.__corpusPending() : 0));
      if (p === 0) break;
      await new Promise((r) => setTimeout(r, 200));
    }
console.error('PROGRESS pending-gate-done');
    await page.waitForTimeout(150);
console.error('PROGRESS pre-tick');
    const tickResult = await page.evaluate((n) => {
      const ticked = window.__corpusTick(n);
      return JSON.stringify({ ticked, errors: window.__corpusErrors, loop: window.__corpusLoopState ? window.__corpusLoopState() : null, drawCalls: window.__drawCalls });
    }, ticks);
console.error('PROGRESS post-tick');
    await inject(READBACK);
    const info = await page.evaluate(() => window.__readback);
    if (!info) throw new Error('no readback info published');
    const tick = JSON.parse(tickResult);
    if (tick.errors && tick.errors.length) info.jsErrors = tick.errors;
    info.jsErrors = (info.jsErrors || []).concat('tickdiag ' + JSON.stringify(tick.loop) + ' preTickDrawCalls=' + tick.drawCalls);
    if (!info.ok) {
      console.log('CORPUS_WEB_STATUS ' + JSON.stringify({ id: kId, ok: false, error: info.error, jsErrors: info.jsErrors }));
      process.exitCode = 1;
      return;
    }
    if (info.glError !== 0) {
      // Readback gl error is a note, not a tier failure: the pixel comparison
      // below decides (1B and web may both legitimately hit an incomplete-FBO
      // read for FBO-demo examples, producing matching frames).
      info.jsErrors = (info.jsErrors || []).concat('web readPixels gl error 0x' + info.glError.toString(16));
    }
    const settleState = await page.evaluate(() => ({ pending: window.__corpusPending ? window.__corpusPending() : -1, loop: window.__corpusLoopState ? window.__corpusLoopState() : null, draws: window.__drawCalls }));
    info.jsErrors = (info.jsErrors || []).concat('settlediag ' + JSON.stringify(settleState));
    if (!info.drawCalls && !info.noCanvas) {
      console.log('CORPUS_WEB_STATUS ' + JSON.stringify({ id: kId, ok: false, error: 'zero draw calls: scene never drew', jsErrors: info.jsErrors }));
      process.exitCode = 1;
      return;
    }
console.error('PROGRESS readback-done');
    const pixels = Buffer.from(info.pixelsB64, 'base64');
    if (pixels.length !== info.w * info.h * 4) throw new Error('pixel buffer size mismatch');
    fs.writeFileSync(path.join(kOut, 'web.rgba'), pixels);
    const hash = fnv1a(pixels);
    console.log('CORPUS_WEB_RUN id=' + kId + ' hash=' + hex32(hash) + ' (' + hash + ') file=' + path.join(kOut, 'web.rgba'));
    console.log('CORPUS_WEB_STATUS ' + JSON.stringify({ id: kId, ok: true, ticked: tick.ticked, w: info.w, h: info.h, jsErrors: info.jsErrors, revision: info.revision }));
  } finally {
console.error('PROGRESS pre-close');
    await browser.close();
  }
}

const kHardTimeoutMs = 90000;
// Hard settle guard: a scene that never settles (network wait, endless RAF)
// is a FAIL(ref-timeout), never a retry-with-longer-cap.
Promise.race([
  main().then(() => 0, (e) => {
    console.log('CORPUS_WEB_STATUS ' + JSON.stringify({ id: kId, ok: false, error: String(e && e.stack ? e.stack : e) }));
    return 1;
  }),
  new Promise((r) => setTimeout(() => {
    console.log('CORPUS_WEB_STATUS ' + JSON.stringify({ id: kId, ok: false, error: 'ref-timeout: did not settle in ' + kHardTimeoutMs + 'ms' }));
    r(1);
  }, kHardTimeoutMs)),
]).then((code) => process.exit(code));
