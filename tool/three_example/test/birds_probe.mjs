#!/usr/bin/env node
// Throwaway probe: boot three-gpgpu-birds-gltf, dump per-frame renderer state,
// packet sizes + opcode histograms, and per-frame pump wall time.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const OUT = path.join(ROOT, 'example/widgets', process.argv[2] || 'three-gpgpu-birds-gltf');
const FRAMES = Number(process.argv[3] || 12);

const [widget, native] = await Promise.all([
  readFile(path.join(OUT, 'widget.js'), 'utf8'),
  readFile(path.join(ROOT, 'assets/three/jsr_three_native.js'), 'utf8')
]);

const packets = [];
const states = [];
const logs = [];
const rafs = new Map();
let nextRaf = 0;
const t0 = performance.now();
let lastEmitAt = 0;
const rafScheduleTrace = [];
const pumpTrace = [];
const phaseMs = [];
const jsr = {
  instanceId: 'birds-probe',
  render(tree) {},
  exportState(state) {
    const t0x = performance.now();
    JSON.stringify(state);
    states.push({ t: Math.round(performance.now() - t0x), frame: state && state.renderer ? state.renderer.frame : null });
  },
  onEvent(handler) {},
  requestAnimationFrame(callback) {
    const id = ++nextRaf;
    rafs.set(id, callback);
    rafScheduleTrace.push({ n: nextRaf, t: Math.round(performance.now() - t0) });
    return id;
  },
  cancelAnimationFrame(id) { rafs.delete(id); },
  hostCallBinary(name, bytes) {
    assert.equal(name, 'three.r1');
    packets.push({ bytes: bytes.byteLength, t: Math.round(performance.now() - t0) });
    lastEmitAt = performance.now();
    this.__emitCount = (this.__emitCount || 0) + 1;
    this.__emitBytes = (this.__emitBytes || 0) + bytes.byteLength;
  },
  hostCall(name) {
    if (name === 'three.canvas2d') return new Promise(() => {});
    if (name === 'three.asset') return null;
    throw new Error(`unexpected host call ${name}`);
  }
};
const context = vm.createContext({
  jsr, console: { log: (...p) => logs.push(p.join(' ')), warn: (...p) => logs.push('[W] ' + p.join(' ')), error: (...p) => logs.push('[E] ' + p.join(' ')), info() {}, debug() {} },
  performance, sendMessage() {}, TextEncoder, TextDecoder, atob, setTimeout, clearTimeout
});
vm.runInContext(native, context, { filename: 'jsr_three_native.js' });
vm.runInContext('globalThis.THREE = THREE;', context);
vm.runInContext(`
  globalThis.__renderMs = [];
  globalThis.__callbackMs = [];
  globalThis.__emitDuringRender = 0;
  const __r = THREE.WebGLRenderer.prototype.render;
  THREE.WebGLRenderer.prototype.render = function (...a) {
    const t0 = performance.now();
    const before = jsr.__emitCount || 0;
    const r = __r.apply(this, a);
    const dt = performance.now() - t0;
    __renderMs.push({ ms: Math.round(dt * 10) / 10, bytes: (jsr.__emitBytes || 0) - (jsr.__emitBytesAt || 0) });
    jsr.__emitBytesAt = jsr.__emitBytes || 0;
    return r;
  };
`, context);
vm.runInContext('globalThis.__flockDebug = [];', context);
vm.runInContext(widget, context, { filename: 'widget.js' });

const frameMs = [];
let lastPacketCount = 0;
let lastStateCount = 0;
while (packets.length < FRAMES) {
  const start = performance.now();
  const due = [...rafs.values()];
  rafs.clear();
  lastEmitAt = 0;
  pumpTrace.push({ iter: frameMs.length, due: due.length, packets: packets.length, pending: rafs.size });
  vm.runInContext('globalThis.__cbStart = performance.now();', context);
  for (const cb of due) {
    try { cb(performance.now()); } catch (err) { console.error('PUMP CB ERROR', err && err.stack ? err.stack.split('\n').slice(0, 4).join(' | ') : err); throw err; }
  }
  vm.runInContext('globalThis.__callbackMs.push(performance.now() - globalThis.__cbStart);', context);
  const total = performance.now() - start;
  frameMs.push(Math.round(total * 10) / 10);
  if (due.length) phaseMs.push({ total: Math.round(total * 10) / 10, preEmit: lastEmitAt ? Math.round((lastEmitAt - start) * 10) / 10 : null });
  await new Promise(r => setImmediate(r));
  if (packets.length === lastPacketCount && states.length === lastStateCount && frameMs.length > 4000) break;
  if (frameMs.length > 4000) break;
  lastPacketCount = packets.length;
  lastStateCount = states.length;
}

function commands(packetBuffer) {
  const bytes = Buffer.from(packetBuffer);
  const header = bytes.readUInt16LE(6);
  const count = bytes.readUInt32LE(header + 8);
  const output = [];
  let offset = header + 12;
  for (let index = 0; index < count; index++) {
    const opcode = bytes[offset];
    const length = bytes.readUInt32LE(offset + 4);
    output.push({ opcode, length });
    offset += 8 + length;
  }
  return output;
}

console.log(JSON.stringify({
  packets: packets.slice(0, FRAMES),
  packetBytes: packets.map(p => p.bytes),
  framePumpMs: frameMs.slice(0, 40),
  phaseMs: phaseMs.slice(0, 40),
  renderMs: vm.runInContext('globalThis.__renderMs.slice(-40)', context),
  tickMs: vm.runInContext('globalThis.__flockDebug.slice(4, 40)', context),
  callbackMs: vm.runInContext('globalThis.__callbackMs.slice(-120)', context),
  states: { count: states.length, last: states.slice(-6) },
  rafTraceHead: rafScheduleTrace.slice(0, 6),
  rafTraceTail: rafScheduleTrace.slice(-6),
  pumpTraceHead: pumpTrace.slice(0, 4),
  pumpTraceTail: pumpTrace.slice(-6),
  logs: logs.slice(0, 40)
}, null, 1));
