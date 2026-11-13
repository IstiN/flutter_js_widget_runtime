#!/usr/bin/env node
// Generic R1 boot + RAF-cost probe. Boots a prepared widget on the pinned
// native runtime in a vm, serves assets from the widget directory, drives
// FRAMES animation ticks and reports per-tick milliseconds. Run with
// `node --cpu-prof --cpu-prof-dir=<dir>` to attribute the JS hotspots.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const widgetDir = process.argv[2];
if (!widgetDir) throw new Error('usage: r1_boot_probe.mjs <example/widgets/three-*> [frames]');
const OUT = path.isAbsolute(widgetDir) ? widgetDir : path.join(ROOT, 'example/widgets', widgetDir);
const FRAMES = Number(process.argv[3] || 30);
const [widget, native] = await Promise.all([
  readFile(path.join(OUT, 'widget.js'), 'utf8'),
  readFile(path.join(ROOT, 'assets/three/jsr_three_native.js'), 'utf8')
]);

const logs = [];
const rafs = new Map();
let nextRaf = 0;
const jsr = {
  instanceId: 'r1-probe',
  render() {},
  exportState() {},
  onEvent() {},
  requestAnimationFrame(callback) { const id = ++nextRaf; rafs.set(id, callback); return id; },
  cancelAnimationFrame(id) { rafs.delete(id); },
  hostCallBinary() {},
  async hostCall(name, args) {
    if (name === 'three.canvas2d') {
      if (args && args.action === 'decodeImage') {
        return {
          engineId: args.engineId, surfaceId: args.surfaceId, canvasId: args.canvasId,
          generation: args.generation, requestId: args.requestId,
          bytes: new Uint8Array([255, 255, 255, 255]), width: 1, height: 1
        };
      }
      return new Promise(() => {});
    }
    if (name === 'three.asset') {
      const url = args && (args.url || args.path || args.src);
      const file = String(url).replaceAll('/', '__');
      const bytes = await readFile(path.join(OUT, file));
      return { data: bytes.toString('base64'), mime: 'application/octet-stream' };
    }
    if (name === 'three.r1') { globalThis.__r1Submits = (globalThis.__r1Submits || 0) + 1; return {}; }
    return {};
  }
};
const context = vm.createContext({
  jsr,
  console: {
    log: (...p) => logs.push(p.join(' ')),
    warn: (...p) => logs.push('[W] ' + p.join(' ')),
    error: (...p) => logs.push('[E] ' + p.join(' ')),
    info() {}, debug() {},
    time() {}, timeEnd() {}
  },
  performance, sendMessage() {}, TextEncoder, TextDecoder, atob, setTimeout, clearTimeout
});
vm.runInContext(native, context, { filename: 'jsr_three_native.js' });
vm.runInContext('globalThis.THREE = THREE;', context);
if (process.env.R1_TEXDEBUG === '1') vm.runInContext('globalThis.__R1_TEXDEBUG = true;', context);
vm.runInContext(`
globalThis.__rejections = [];
const origThen = Promise.prototype.then;
Promise.prototype.then = function(onFulfilled, onRejected) {
  return origThen.call(this, onFulfilled, function(error) {
    globalThis.__rejections.push(String(error && error.message ? error.message : error));
    if (onRejected) return onRejected(error);
    throw error;
  });
};
`, context);
vm.runInContext(widget, context, { filename: 'widget.js' });

for (let i = 0; i < 2000 && rafs.size === 0; i++) {
  await new Promise(resolve => setImmediate(resolve));
}
console.log('RAF scheduled:', rafs.size > 0);
let elapsed = 0;
for (let frame = 0; frame < FRAMES && rafs.size > 0; frame++) {
  const pending = [...rafs.values()];
  rafs.clear();
  await new Promise(resolve => setImmediate(resolve));
  const t0 = performance.now();
  for (const callback of pending) {
    try { callback(elapsed); } catch (error) { logs.push('[RAF-ERR] ' + error.message); }
  }
  const ms = performance.now() - t0;
  if (frame < 6 || frame === FRAMES - 1) console.log(`tick ${frame}: ${ms.toFixed(1)}ms`);
  elapsed += 16;
  // Let asset promises resolve between ticks.
  for (let i = 0; i < 4; i++) await new Promise(resolve => setImmediate(resolve));
}
console.log('r1 submits:', globalThis.__r1Submits || 0);
console.log('rejections:', vm.runInContext('JSON.stringify(globalThis.__rejections.slice(0,6))', context));
console.log('logs (last 12):');
for (const line of logs.filter(l=>l.includes('RAF-ERR')).slice(0,4)) console.log(' ', line.slice(0,200));
for (const line of logs.slice(-12)) console.log(' ', line.slice(0, 200));
