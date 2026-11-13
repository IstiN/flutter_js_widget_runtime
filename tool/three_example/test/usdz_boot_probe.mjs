#!/usr/bin/env node
// Probe: why does webgl_loader_usdz never present a first frame?
// Boots the prepared widget on the pinned native runtime in a vm, serves
// the external assets from the widget directory, and reports console logs,
// host calls and whether the animation loop ever schedules RAF.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const OUT = path.join(ROOT, 'example/widgets/three-loader-usdz');
const [widget, native] = await Promise.all([
  readFile(path.join(OUT, 'widget.js'), 'utf8'),
  readFile(path.join(ROOT, 'assets/three/jsr_three_native.js'), 'utf8')
]);

const logs = [];
const rafs = new Map();
let nextRaf = 0;
const hostCalls = [];
const jsr = {
  instanceId: 'usdz-probe',
  render() {},
  exportState() {},
  onEvent() {},
  requestAnimationFrame(callback) { const id = ++nextRaf; rafs.set(id, callback); return id; },
  cancelAnimationFrame(id) { rafs.delete(id); },
  hostCallBinary() {},
  async hostCall(name, args) {
    hostCalls.push({ name, args: JSON.stringify(args).slice(0, 160) });
    if (name === 'three.canvas2d') {
      if (args && args.action === 'decodeImage') {
        const raw = args.data;
        let signature = 'none';
        if (typeof raw === 'string') {
          signature = 'b64:' + raw.slice(0, 16) + ' len=' + raw.length;
        } else if (raw && raw.length !== undefined) {
          signature = 'bytes:' + Array.from(raw.slice(0, 12)).join(',') + ' len=' + raw.length;
        }
        hostCalls.push({ decodeSignature: signature });
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
      if (String(url).endsWith('.hdr')) {
        // The real host decodes HDR to raw RGBA8; a 1x1 white texel is
        // enough to reach the USDZ parse this probe targets.
        return { bytes: new Uint8Array([255, 255, 255, 255]), width: 1, height: 1, mime: 'image/rgba' };
      }
      const bytes = await readFile(path.join(OUT, file));
      if (process.env.USDZ_WARM === '1') {
        return { bytes: new Uint8Array(bytes), mime: 'application/octet-stream' };
      }
      return { data: bytes.toString('base64'), mime: 'application/octet-stream' };
    }
    throw new Error(`unexpected host call ${name}`);
  }
};
const context = vm.createContext({
  jsr,
  console: {
    log: (...p) => logs.push(p.join(' ')),
    warn: (...p) => logs.push('[W] ' + p.join(' ')),
    error: (...p) => logs.push('[E] ' + p.join(' ')),
    info() {}, debug() {}
  },
  performance, sendMessage() {}, TextEncoder, TextDecoder, atob, setTimeout, clearTimeout
});
vm.runInContext(native, context, { filename: 'jsr_three_native.js' });
vm.runInContext('globalThis.THREE = THREE;', context);
// Track unhandled rejections inside the realm.
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

for (let i = 0; i < 800 && rafs.size === 0; i++) {
  await new Promise(resolve => setImmediate(resolve));
}
console.log('RAF scheduled:', rafs.size > 0);
console.log('host calls:', JSON.stringify(hostCalls, null, 1));
console.log('rejections:', vm.runInContext('JSON.stringify(globalThis.__rejections.slice(0,8))', context));
console.log('logs (first 25):');
for (const line of logs.slice(0, 25)) console.log(' ', line.slice(0, 220));
