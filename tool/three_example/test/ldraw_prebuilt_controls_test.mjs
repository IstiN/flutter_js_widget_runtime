#!/usr/bin/env node
// Node boot harness for the loader-family widgets (collada / 3mf), the
// pathtracer_boot_test analog: boots widget.js on the pinned native runtime in
// a vm, serves external assets through the `three.asset` host lane and the
// canvas2d image decoder, pumps RAF and measures the first R1 frame plus the
// final draw cadence. Used to MEASURE the loader-prebuild before/after split
// (QuickJS never finishes the stock XML lanes; V8 gives the honest offline
// split) and as the regression boot test for the prebuilt lanes.
//
// Usage: node tool/three_example/test/loader_prebuild_boot_test.mjs --widget three-loader-3mf [--frames N] [--timeout-ms MS]
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');

function parseArgs(argv) {
  const options = { widget: null, frames: 1, timeoutMs: 120000 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--widget') options.widget = String(argv[++i]);
    else if (argv[i] === '--frames') options.frames = Number(argv[++i]);
    else if (argv[i] === '--timeout-ms') options.timeoutMs = Number(argv[++i]);
    else throw new Error(`unknown argument ${argv[i]}`);
  }
  if (!options.widget) throw new Error('--widget <dir> is required');
  return options;
}
const options = parseArgs(process.argv.slice(2));
const OUT = path.join(ROOT, 'example/widgets', options.widget);

// sips BMP -> raw RGBA (the same decode lane prepare.mjs uses for image pins).
function bmpToRgba(bytes) {
  const pixelOffset = bytes.readUInt32LE(10);
  const width = bytes.readInt32LE(18);
  const signedHeight = bytes.readInt32LE(22);
  const height = Math.abs(signedHeight);
  const bpp = bytes.readUInt16LE(28);
  assert.ok(bpp === 24 || bpp === 32, 'sips must emit a 24/32bpp BMP');
  const rgba = new Uint8Array(width * height * 4);
  const rowSize = width * 4;
  const sourcePixelSize = bpp / 8;
  const sourceRowSize = (width * sourcePixelSize + 3) & ~3;
  for (let y = 0; y < height; y++) {
    const source = pixelOffset + y * sourceRowSize;
    const target = (signedHeight > 0 ? height - 1 - y : y) * rowSize;
    for (let x = 0; x < width; x++) {
      const input = source + x * sourcePixelSize;
      const output = target + x * 4;
      rgba[output] = bytes[input + 2];
      rgba[output + 1] = bytes[input + 1];
      rgba[output + 2] = bytes[input];
      rgba[output + 3] = bpp === 32 ? bytes[input + 3] : 255;
    }
  }
  return { rgba, width, height };
}
async function decodeImage(bytes, stamp) {
  const ext = bytes[0] === 0x89 ? 'png' : 'jpg';
  const tmpIn = path.join(os.tmpdir(), `jsr-loader-boot-${stamp}.${ext}`);
  const tmpBmp = path.join(os.tmpdir(), `jsr-loader-boot-${stamp}.bmp`);
  await writeFile(tmpIn, bytes);
  execFileSync('sips', ['-s', 'format', 'bmp', tmpIn, '--out', tmpBmp], { stdio: 'pipe' });
  return bmpToRgba(await readFile(tmpBmp));
}

const [widget, native, assetsJson] = await Promise.all([
  readFile(path.join(OUT, 'widget.js'), 'utf8'),
  readFile(path.join(ROOT, 'assets/three/jsr_three_native.js'), 'utf8'),
  readFile(path.join(OUT, 'assets.json'), 'utf8').catch(() => null)
]);
const external = new Map();
if (assetsJson) {
  for (const entry of JSON.parse(assetsJson).assets || []) external.set(entry.url, entry);
}
// Pre-decode every external image payload once (host decoder analog); the
// canvas2d decodeImage mock matches requests by encoded byte length.
const decodedImages = new Map();
for (const [url, entry] of external) {
  if (!/\.(jpe?g|png)$/.test(entry.file)) continue;
  const bytes = await readFile(path.join(OUT, entry.file));
  const decoded = await decodeImage(bytes, String(decodedImages.size));
  decoded.encodedLength = bytes.length;
  decodedImages.set(url, decoded);
}

const bootT0 = performance.now();
const packets = [];
const renders = [];
const states = [];
const errorLogs = [];
const rafs = new Map();
const timeMarks = new Map();
let nextRaf = 0;
let firstPacketMs = null;
const forward = line => console.log(line);
const jsr = {
  instanceId: 'loader-boot-test',
  render(tree) { renders.push(tree); },
  exportState(state) { states.push(state); },
  onEvent(handler) { this._onEventHandler = handler; },
  requestAnimationFrame(callback) {
    const id = ++nextRaf;
    rafs.set(id, callback);
    return id;
  },
  cancelAnimationFrame(id) { rafs.delete(id); },
  hostCallBinary(name, bytes) {
    assert.equal(name, 'three.r1');
    if (firstPacketMs === null) firstPacketMs = Math.round(performance.now() - bootT0);
    packets.push(bytes.byteLength);
    forward(`[harness] r1 packet #${packets.length} ${bytes.byteLength}B at ${Math.round(performance.now() - bootT0)}ms`);
  },
  async hostCall(name, args) {
    if (name === 'three.asset') {
      const url = String(args.url || '').replace(/^\.\//, '').replace(/[?#].*$/, '');
      const entry = external.get(url);
      assert.ok(entry, `host asset lane miss for ${url}`);
      const bytes = await readFile(path.join(OUT, entry.file));
      const decoded = decodedImages.get(url);
      return {
        data: decoded ? Buffer.from(decoded.rgba).toString('base64') : bytes.toString('base64'),
        mime: decoded ? 'application/x-rgba' : entry.mime,
        width: decoded ? decoded.width : entry.width,
        height: decoded ? decoded.height : entry.height
      };
    }
    if (name === 'three.canvas2d' && args.action === 'decodeImage') {
      const size = Buffer.from(args.data, 'base64').length;
      let decoded = null;
      for (const image of decodedImages.values()) {
        if (image.encodedLength === size) decoded = image;
      }
      assert.ok(decoded, `canvas2d decodeImage miss (${size} encoded bytes)`);
      return { ...args, width: decoded.width, height: decoded.height, data: Buffer.from(decoded.rgba).toString('base64') };
    }
    throw new Error(`unexpected host call ${name}`);
  }
};
const shimConsole = {
  log: (...parts) => forward(parts.join(' ')),
  warn: (...parts) => forward('[W] ' + parts.join(' ')),
  error: (...parts) => {
    const text = parts.map(p => {
      if (p && p.message) {
        const stackLine = typeof p.stack === 'string' ? p.stack.split('\n').find(line => line.includes('widget.js')) || '' : '';
        return stackLine ? `${p.message}\n    at ${stackLine.trim()}` : p.message;
      }
      return String(p);
    }).join(' ');
    errorLogs.push(text);
    forward('[E] ' + text);
  },
  info: (...parts) => forward(parts.join(' ')),
  debug: (...parts) => forward(parts.join(' ')),
  time: label => { timeMarks.set(String(label), performance.now()); },
  timeEnd: label => {
    const key = String(label);
    const start = timeMarks.get(key);
    if (start === undefined) return;
    timeMarks.delete(key);
    forward(`${key}: ${Math.round(performance.now() - start)}ms`);
  }
};
const evalNativeStart = performance.now();
const context = vm.createContext({
  jsr,
  console: shimConsole,
  performance,
  sendMessage() {},
  TextEncoder,
  TextDecoder,
  atob,
  setTimeout,
  clearTimeout
});
vm.runInContext(native, context, { filename: 'jsr_three_native.js' });
const evalNativeMs = Math.round(performance.now() - evalNativeStart);
vm.runInContext('globalThis.THREE = THREE;', context);
vm.runInContext(`
globalThis.__ldrawScene = null;
const sceneAdd = THREE.Scene.prototype.add;
THREE.Scene.prototype.add = function(...objects) {
  if (this.background?.isColor && this.background.getHex() === 0xdeebed) globalThis.__ldrawScene = this;
  return sceneAdd.apply(this, objects);
};
globalThis.__ldrawSnapshot = () => {
  const scene = globalThis.__ldrawScene;
  const root = scene?.children.find(object => object.userData.prebuiltModel);
  const result = { model: root?.userData.prebuiltModel || null, smooth: root?.userData.prebuiltSmoothNormals,
    merged: root?.userData.prebuiltMerged === true,
    steps: root?.userData.numBuildingSteps, visibleSteps: root?.children.filter(object => object.visible).length,
    standard: 0, basic: 0, lines: 0, conditional: 0, placedMeshes: 0, geometries: [], normalSignature: '' };
  if (!root) return result;
  const geometries = new Set();
  let normalHash = 0;
  function visit(object, parentVisible) {
    const visible = parentVisible && object.visible;
    if (visible && object.isMesh) {
      const transform = object.matrixWorld.elements;
      if (Math.abs(transform[12]) + Math.abs(transform[13]) + Math.abs(transform[14]) > 1e-6) result.placedMeshes++;
      if (object.material?.isMeshStandardMaterial) result.standard++;
      if (object.material?.isMeshBasicMaterial) result.basic++;
    }
    if (visible && object.isLineSegments) {
      if (object.isConditionalLine) result.conditional++; else result.lines++;
    }
    if (object.geometry) {
      geometries.add(object.geometry.uuid);
      const normals = object.geometry.attributes.normal?.array;
      if (normals) for (let i = 0; i < normals.length; i += 97) normalHash = (normalHash * 31 + Math.round(normals[i] * 100000)) | 0;
    }
    for (const child of object.children) visit(child, visible);
  }
  visit(root, true);
  result.geometries = [...geometries].sort();
  result.normalSignature = String(normalHash);
  return result;
};
`, context);
const evalWidgetStart = performance.now();
vm.runInContext(widget, context, { filename: 'widget.js' });
const evalWidgetMs = Math.round(performance.now() - evalWidgetStart);

async function pumpUntil(predicate, timeoutMs) {
  const start = performance.now();
  let pumps = 0;
  while (!predicate()) {
    if (performance.now() - start > timeoutMs) return false;
    if (++pumps % 32 === 0) forward(`[harness] pump ${pumps} at ${Math.round(performance.now() - start)}ms rssMB=${Math.round(process.memoryUsage.rss() / 1048576)} heapMB=${Math.round(process.memoryUsage().heapUsed / 1048576)}`);
    const due = [...rafs.values()];
    rafs.clear();
    for (const callback of due) callback(performance.now());
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setTimeout(resolve, 8));
  }
  return true;
}

const presented = await pumpUntil(() => packets.length > 0, options.timeoutMs);
if (!presented) {
  console.log(JSON.stringify({
    ok: false,
    widget: options.widget,
    evalNativeMs,
    evalWidgetMs,
    firstPacketMs,
    packets: packets.length,
    errorLogs
  }, null, 2));
  throw new Error(`${options.widget}: no R1 frame presented within ${options.timeoutMs}ms`);
}
await pumpUntil(() => packets.length >= options.frames, options.timeoutMs);

const errorTrees = renders.filter(tree => JSON.stringify(tree).includes('Widget error'));
assert.deepEqual(errorTrees, [], 'widget must not emit error cards');
assert.ok(packets.length >= options.frames, `expected >=${options.frames} R1 frames, got ${packets.length}`);
const geometryPacket = packets.some(size => size > 100000);
const maxTriangles = Math.max(0, ...states.map(state => state?.renderer?.triangles || 0));
const maxState = states.reduce((best, state) => ((state?.renderer?.triangles || 0) > (best?.renderer?.triangles || 0) ? state : best), states[0]);
// One-shot modules (3mf renders only from manager.onLoad) export states after
// renderer.info resets, so their draw evidence is the geometry-bearing R1
// packet; RAF-loop modules additionally report triangles in exported states.
assert.ok(maxTriangles > 0 || geometryPacket,
  'expected rendered triangles or a geometry-bearing R1 packet (draws > 0)');
assert.ok(geometryPacket,
  `expected a geometry-bearing R1 packet, got sizes ${JSON.stringify(packets)}`);

assert.equal(options.widget, 'three-loader-ldraw');
const snapshot = () => vm.runInContext('globalThis.__ldrawSnapshot()', context);
const initial = snapshot();
assert.ok(initial.model?.includes('car.ldr'));
assert.equal(initial.smooth, true);
assert.ok(initial.steps > 1 && initial.visibleSteps > 1);
assert.ok(initial.standard > 0 && initial.lines > 0 && initial.conditional > 0);
assert.ok(initial.placedMeshes > 20, `car parts must retain their world placement, got ${initial.placedMeshes}`);

async function control(property, value, predicate, timeoutMs = 3000) {
  const state = [...states].reverse().find(candidate => candidate?.gui?.values?.some(item => item.property === property));
  const item = state?.gui.values.find(candidate => candidate.property === property);
  assert.ok(item?.action, `missing native GUI action for ${property}`);
  const packetCount = packets.length;
  assert.equal(typeof jsr._onEventHandler, 'function');
  jsr._onEventHandler(item.action, { value });
  const settled = await pumpUntil(() => predicate ? predicate(snapshot()) : packets.length >= packetCount + 2, timeoutMs);
  assert.ok(settled, `${property}=${value} did not settle: ${JSON.stringify(snapshot())}`);
  return snapshot();
}

let current = await control('buildingStep', 0, state => state.visibleSteps < initial.visibleSteps);
assert.equal(current.model, initial.model, 'step selection must not reload or merge the model');
await control('buildingStep', initial.steps - 1, state => state.visibleSteps === initial.visibleSteps);

current = await control('displayLines', false, state => state.lines === 0);
assert.ok(current.conditional > 0, 'displayLines must not hide conditional lines');
await control('displayLines', true, state => state.lines > 0);
current = await control('conditionalLines', false, state => state.conditional === 0);
assert.ok(current.lines > 0, 'conditionalLines must not hide ordinary lines');
await control('conditionalLines', true, state => state.conditional > 0);

current = await control('flatColors', true, state => state.basic > 0);
assert.equal(current.standard, 0);
await control('flatColors', false, state => state.standard > 0 && state.basic === 0);
current = await control('mergeModel', true, state => state.steps === 1 && state.merged, 5000);
assert.ok(current.visibleSteps > 0 && current.standard > 0, 'merged model must remain visible');
await control('mergeModel', false, state => state.steps === initial.steps);
current = await control('smoothNormals', false, state => state.smooth === false);
assert.notEqual(current.normalSignature, initial.normalSignature, 'flat/smooth variants must not share normals');
current = await control('smoothNormals', true, state => state.smooth === true);
assert.deepEqual(current.geometries, initial.geometries, 'returning to a cached variant must reuse prepared geometry');
assert.equal(current.normalSignature, initial.normalSignature);
current = await control('modelFileName', 'models/6156-1-WindowBrick.mpd_Packed.mpd', state => state.model?.includes('WindowBrick'));
assert.ok(current.geometries.length > 0, 'alternate prepared model must render');

console.log(JSON.stringify({
  ok: true,
  widget: options.widget,
  evalNativeMs,
  evalWidgetMs,
  firstPacketMs,
  packets: packets.length,
  r1BytesFirst: packets[0],
  r1BytesLast: packets.at(-1),
  exercisedControls: ['buildingStep', 'displayLines', 'conditionalLines', 'flatColors', 'mergeModel', 'smoothNormals', 'modelFileName'],
  initial: { steps: initial.steps, visibleSteps: initial.visibleSteps, meshes: initial.standard, lines: initial.lines, conditional: initial.conditional },
  alternateModel: current.model,
  errorLogs
}, null, 2));
