// ref_1b_scene.cjs — M3 Web ground truth: run the SAME three.js r186 scene
// (byte-identical scene JS from tool/three/run_1b_trace.dart, M2b) in real
// headless Chrome WebGL2 (Playwright, channel 'chrome'), 320x240, read the
// drawing buffer back with gl.readPixels, hash with FNV-1a 32-bit (Math.imul
// — exact 32-bit semantics, identical to tool/angle1b_smoke.dart) and write
// the raw RGBA to /tmp/angle1b_web.rgba for the compare script.
//
// Adaptations vs the QuickJS harness, canvas acquisition ONLY (sanctioned):
//   1. HTMLCanvasElement.prototype.getContext is wrapped to force
//      preserveDrawingBuffer:true on the webgl2 context (spec-guaranteed
//      deterministic readback; the scene renders into an unattached canvas,
//      so without it the buffer could be invalidated before we read).
//   2. document.createElementNS is wrapped to stash the scene's canvas on
//      window.__sceneCanvas so the driver can reach the context the scene
//      created (the scene keeps it inside an IIFE; this changes no pixels).
// Everything else — three boot, scene body, geometry, rotations, RT
// ping-pong — is byte-identical to the 1B side.
//
// Run from the repo root: node tool/three/ref_1b_scene.cjs
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('/tmp/node_modules/playwright');

const kRoot = path.resolve(__dirname, '..', '..');
const kCorePath = path.join(kRoot, 'example/web/three.core.js');
const kModulePath = path.join(kRoot, 'example/web/jsr_three_web.js');
const kOutRgba = '/tmp/angle1b_web.rgba';

// ---------------------------------------------------------------------------
// ESM transform (same logic as the M2b/M3 harness): the two three r186
// modules declare colliding top-level consts, so each is wrapped in its own
// IIFE; the module's import list destructures off globalThis.__threeCore and
// its export list becomes globalThis.THREE.
function braceList(line, open, close) {
  const a = line.indexOf(open) + open.length;
  const b = line.lastIndexOf(close);
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
  return '(function () {\n' + dropLines(core) + '\n' +
    'globalThis.__threeCore = { ' + exports.join(', ') + ' };\n})();';
}

function wrapThreeModule(module) {
  const lines = module.split('\n');
  const importLine = lines.find((l) => l.trimLeft().startsWith('import {'));
  if (!importLine) throw new Error('jsr_three_web.js: no import line');
  const importNames = braceList(importLine, 'import {', '} from');
  const exportLines = lines.filter((l) => l.trimLeft().startsWith('export {'));
  const reExportLines = exportLines.filter((l) => l.includes('} from'));
  if (reExportLines.length !== 1 || exportLines.length !== 2) {
    throw new Error('jsr_three_web.js: expected 1 re-export + 1 export, got ' + exportLines.length);
  }
  const reExportNames = braceList(reExportLines[0], 'export {', '} from');
  const exportNames = braceList(exportLines[exportLines.length - 1], 'export {', '};');
  const coreBridge = reExportNames.map((n) => n + ': __threeCore["' + n + '"]').join(', ');
  return '(function () {\nconst { ' + importNames.join(', ') + ' } = globalThis.__threeCore;\n' +
    dropLines(module) + '\n' +
    'globalThis.THREE = Object.assign({ ' + coreBridge + ' }, { ' + exportNames.join(', ') + ' });\n})();';
}

// ---------------------------------------------------------------------------
// Scene: byte-identical copy of sceneScript() from tool/three/run_1b_trace.dart.
const SCENE_SRC = "globalThis.__result = (function () {\n  try {\n    var canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');\n    canvas.width = 320; canvas.height = 240;\n    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });\n    renderer.setSize(320, 240, false);\n    var scene = new THREE.Scene();\n    var camera = new THREE.PerspectiveCamera(50, 320 / 240, 0.1, 100);\n    camera.position.z = 4;\n    var mesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), new THREE.MeshNormalMaterial());\n    scene.add(mesh);\n    var light = new THREE.PointLight(0xffffff, 10, 0, 2);\n    light.position.set(2, 3, 4);\n    scene.add(light);\n    var frames = 0;\n    for (var i = 0; i < 3; i++) {\n      mesh.rotation.y += 0.35; mesh.rotation.x += 0.15;\n      renderer.render(scene, camera);\n      frames++;\n    }\n    // FBO ping-pong: scene -> rtA; quad pass rtA -> rtB; quad pass rtB -> screen.\n    var rtOpts = { format: THREE.RGBAFormat, type: THREE.UnsignedByteType,\n      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true };\n    var rtA = new THREE.WebGLRenderTarget(320, 240, rtOpts);\n    var rtB = new THREE.WebGLRenderTarget(320, 240, rtOpts);\n    var quadScene = new THREE.Scene();\n    var quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);\n    var quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({\n      uniforms: { tDiffuse: { value: null }, uGain: { value: 0.9 } },\n      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',\n      fragmentShader: 'uniform sampler2D tDiffuse; uniform float uGain; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(tDiffuse, vUv).rgb * uGain, 1.0); }',\n      depthTest: false, depthWrite: false\n    }));\n    quadScene.add(quad);\n    renderer.setRenderTarget(rtA);\n    renderer.render(scene, camera);\n    quad.material.uniforms.tDiffuse.value = rtA.texture;\n    quad.material.uniforms.uGain.value = 0.85;\n    renderer.setRenderTarget(rtB);\n    renderer.render(quadScene, quadCam);\n    quad.material.uniforms.tDiffuse.value = rtB.texture;\n    quad.material.uniforms.uGain.value = 1.0;\n    renderer.setRenderTarget(null);\n    renderer.render(quadScene, quadCam);\n    var gl = renderer.getContext();\n    var stats = gl.__stats || { used: {}, missing: {}, stubThrows: 0 };\n    return { ok: true, frames: frames, revision: THREE.REVISION,\n      usedMethods: stats.used, missingMethods: stats.missing, stubThrows: stats.stubThrows };\n  } catch (e) {\n    return { ok: false, error: String(e && e.stack ? e.stack : e) };\n  }\n})();";

// Canvas-acquisition adaptations (see header). No pixel semantics change.
const DRIVER = `
(function () {
  var origGetCtx = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, attrs) {
    if (type === 'webgl2') {
      attrs = Object.assign({}, attrs, { preserveDrawingBuffer: true });
    }
    return origGetCtx.call(this, type, attrs);
  };
  var origCreateNS = document.createElementNS;
  document.createElementNS = function (ns, tag) {
    var el = origCreateNS.call(document, ns, tag);
    if (String(tag).toLowerCase() === 'canvas') window.__sceneCanvas = el;
    return el;
  };
})();
`;

// Runs AFTER the scene: read the drawing buffer, publish pixels + metadata.
const READBACK = `
(function () {
  var result = globalThis.__result || { ok: false, error: 'scene did not run' };
  var info = { ok: !!result.ok, error: result.error || null, revision: result.revision };
  if (result.ok) {
    var canvas = window.__sceneCanvas;
    var gl = canvas.getContext('webgl2');
    var w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
    var px = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    info.w = w; info.h = h;
    info.glError = gl.getError();
    var bin = '';
    for (var i = 0; i < px.length; i += 8192) {
      bin += String.fromCharCode.apply(null, px.subarray(i, Math.min(i + 8192, px.length)));
    }
    info.pixelsB64 = btoa(bin);
    var ext = gl.getExtension('WEBGL_debug_renderer_info');
    info.renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    info.vendor = ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
    var o = 0, co = ((h >> 1) * w + (w >> 1)) * 4;
    info.corner = [px[o], px[o + 1], px[o + 2], px[o + 3]];
    info.center = [px[co], px[co + 1], px[co + 2], px[co + 3]];
  }
  window.__readback = info;
})();
`;

// FNV-1a 32-bit with exact uint32 semantics (Math.imul), same as the Dart side.
function fnv1a(buf) {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < buf.length; i++) {
    h = Math.imul(h ^ buf[i], 0x01000193) >>> 0;
  }
  return h >>> 0;
}

const hex32 = (v) => '0x' + v.toString(16).padStart(8, '0');

async function main() {
  const core = fs.readFileSync(kCorePath, 'utf8');
  const module = fs.readFileSync(kModulePath, 'utf8');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
    await page.setContent('<!doctype html><html><head></head><body></body></html>');
    await page.addScriptTag({ content: DRIVER });
    await page.addScriptTag({ content: wrapThreeCore(core) });
    await page.addScriptTag({ content: wrapThreeModule(module) });
    await page.addScriptTag({ content: SCENE_SRC });
    await page.addScriptTag({ content: READBACK });
    const info = await page.evaluate(() => window.__readback);
    if (!info) throw new Error('no readback info published');
    if (!info.ok) throw new Error('scene failed: ' + info.error);
    if (info.glError !== 0) throw new Error('gl error after readback: 0x' + info.glError.toString(16));
    const pixels = Buffer.from(info.pixelsB64, 'base64');
    if (pixels.length !== info.w * info.h * 4) {
      throw new Error('pixel buffer size ' + pixels.length + ' != ' + info.w * info.h * 4);
    }
    fs.writeFileSync(kOutRgba, pixels);
    const hash = fnv1a(pixels);
    console.log('WEB hash=' + hex32(hash) + ' (' + hash + ')');
    console.log('WEB corner=(' + info.corner.join(', ') + ') center=(' + info.center.join(', ') + ')');
    console.log('WEB size=' + info.w + 'x' + info.h + ' revision=' + info.revision);
    console.log('WEB renderer=' + info.renderer + ' | ' + info.vendor);
    console.log('WEB rgba=' + kOutRgba);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error('WEB FAIL: ' + (e && e.stack ? e.stack : e));
  process.exit(1);
});
