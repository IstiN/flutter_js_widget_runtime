#!/usr/bin/env node
// Node boot harness for the prepared webgl_renderer_pathtracer widget
// (three_first_present-style): boots widget.js on the pinned native runtime in
// a vm, serves the pinned external assets through the `three.asset` host lane,
// pumps RAF and measures the first R1 frame (first-presented analog) plus the
// final draw cadence. Phase-probe markers ([jsr-pt], jsr.ldraw.*) are captured
// verbatim so V8/QuickJS splits can be compared.
//
// Usage: node tool/three_example/test/pathtracer_boot_test.mjs [--frames N] [--timeout-ms MS]
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
const OUT = path.join(ROOT, 'example/widgets/three-renderer-pathtracer');

function parseArgs(argv) {
  const options = { frames: 12, timeoutMs: 120000 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--frames') options.frames = Number(argv[++i]);
    else if (argv[i] === '--timeout-ms') options.timeoutMs = Number(argv[++i]);
    else throw new Error(`unknown argument ${argv[i]}`);
  }
  return options;
}
const options = parseArgs(process.argv.slice(2));

// sips BMP -> raw RGBA (the same decode lane prepare.mjs uses for rawRgba pins).
function bmpToRgba(bytes) {
  const pixelOffset = bytes.readUInt32LE(10);
  const width = bytes.readInt32LE(18);
  const height = bytes.readInt32LE(22);
  const bpp = bytes.readUInt16LE(28);
  assert.equal(bpp, 32, 'sips must emit a 32bpp BMP');
  const rgba = new Uint8Array(width * height * 4);
  const rowSize = width * 4;
  for (let y = 0; y < height; y++) {
    const source = pixelOffset + y * rowSize;
    const target = (height - 1 - y) * rowSize; // BMP rows are bottom-up
    for (let x = 0; x < rowSize; x += 4) {
      rgba[target + x] = bytes[source + x + 2];
      rgba[target + x + 1] = bytes[source + x + 1];
      rgba[target + x + 2] = bytes[source + x];
      rgba[target + x + 3] = bytes[source + x + 3];
    }
  }
  return { rgba, width, height };
}
async function jpegToRgba(bytes, stamp) {
  const tmpIn = path.join(os.tmpdir(), `jsr-pt-harness-${stamp}.jpg`);
  const tmpBmp = path.join(os.tmpdir(), `jsr-pt-harness-${stamp}.bmp`);
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
  if (!/\.jpe?g$/.test(entry.file)) continue;
  const bytes = await readFile(path.join(OUT, entry.file));
  const decoded = await jpegToRgba(bytes, String(decodedImages.size));
  decoded.encodedLength = bytes.length;
  decodedImages.set(url, decoded);
}

const bootT0 = performance.now();
const packets = [];
const renders = [];
const states = [];
const probeLines = [];
const rafs = new Map();
const timeMarks = new Map();
let nextRaf = 0;
let firstPacketMs = null;
const forward = line => {
  probeLines.push(line);
  console.log(line);
};
const jsr = {
  instanceId: 'pathtracer-boot-test',
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
    forward(`[harness] r1 packet #${packets.length} ${bytes.byteLength}B at ${firstPacketMs === null ? '?' : Math.round(performance.now() - bootT0)}ms`);
  },
  async hostCall(name, args) {
    if (name === 'three.asset') {
      const url = String(args.url || '').replace(/^\.\//, '').replace(/[?#].*$/, '');
      const entry = external.get(url);
      assert.ok(entry, `host asset lane miss for ${url}`);
      const bytes = await readFile(path.join(OUT, entry.file));
      const decoded = decodedImages.get(url);
      return {
        data: bytes.toString('base64'),
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
  log: (...parts) => { forward(parts.join(' ')); },
  warn: (...parts) => { forward('[W] ' + parts.join(' ')); },
  error: (...parts) => { forward('[E] ' + parts.join(' ')); },
  info: (...parts) => { forward(parts.join(' ')); },
  debug: (...parts) => { forward(parts.join(' ')); },
  time: label => { timeMarks.set(String(label), performance.now()); },
  timeEnd: label => {
    const key = String(label);
    const start = timeMarks.get(key);
    if (start === undefined) return;
    timeMarks.delete(key);
    forward(`${key}: ${Math.round(performance.now() - start)}ms`);
  }
};
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
vm.runInContext('globalThis.THREE = THREE;', context);
vm.runInContext(widget, context, { filename: 'widget.js' });

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
assert.ok(presented, `no R1 frame presented within ${options.timeoutMs}ms`);
await pumpUntil(() => packets.length >= options.frames, options.timeoutMs);

const errorTrees = renders.filter(tree => JSON.stringify(tree).includes('Widget error'));
assert.deepEqual(errorTrees, [], 'widget must not emit error cards');
assert.ok(packets.length >= options.frames, `expected >=${options.frames} R1 frames, got ${packets.length}`);
assert.equal(states.at(-1).canvasCount, 1);

console.log(JSON.stringify({
  ok: true,
  firstPacketMs,
  packets: packets.length,
  r1BytesFirst: packets[0],
  r1BytesLast: packets.at(-1),
  probeLines,
  canvasCount: states.at(-1).canvasCount
}, null, 2));
