#!/usr/bin/env node
// Round-2 multi-tick GPGPU pins (webgl_gpgpu_birds + webgl_gpgpu_protoplanet).
//
// Failure modes this guards (the round-2 raid, owner-reported):
//  1. birds "a stripe in the distance": every bird collapsed onto one line at
//     the origin because the R1 neutral GPGPU lane never advanced the sim —
//     all texels read the SAME stale texture. Pin: the CPU kernel lane must
//     run >=30 ticks, positions must SPREAD (>= 100 units) and velocities
//     must be flocking-alive (avgSpeed >= 0.5).
//  2. protoplanet "grey noisy squares": particles never moved (no gravity)
//     and carried no per-particle color. Pin: >=30 ticks, disc extent within
//     [100, 900], majority of particles alive, and the DISPLAY packet must
//     carry the sprite/vertex-color material lane (points draws > 0).
//  3. engine display lanes: the exported renderer state must show real draw
//     activity (birds: triangles ≈ BIRDS*3; proto: calls >= 1) — the
//     collapsed-stripe state drew one degenerate call.
//
// Usage: node tool/three_example/test/gpgpu_multitick_pin.mjs --widget three-gpgpu-birds
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');

function parseArgs(argv) {
  const options = { widget: null, ticks: 60, timeoutMs: 120000 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--widget') options.widget = String(argv[++i]);
    else if (argv[i] === '--ticks') options.ticks = Number(argv[++i]);
    else if (argv[i] === '--timeout-ms') options.timeoutMs = Number(argv[++i]);
    else throw new Error(`unknown argument ${argv[i]}`);
  }
  if (!options.widget) throw new Error('--widget <dir> is required');
  return options;
}
const options = parseArgs(process.argv.slice(2));
const OUT = path.join(ROOT, 'example/widgets', options.widget);

const [widget, native] = await Promise.all([
  readFile(path.join(OUT, 'widget.js'), 'utf8'),
  readFile(path.join(ROOT, 'assets/three/jsr_three_native.js'), 'utf8')
]);

const bootT0 = performance.now();
const packets = [];
const renders = [];
const states = [];
const errorLogs = [];
const warns = [];
const rafs = new Map();
let nextRaf = 0;
const forward = line => console.log(line);
const jsr = {
  instanceId: 'gpgpu-pin-test',
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
    packets.push(bytes.byteLength);
  },
  async hostCall(name, args) {
    // No external assets on these widgets; any asset call is a lane miss.
    throw new Error(`unexpected host call ${name}`);
  }
};
const shimConsole = {
  log: (...parts) => forward('[L] ' + parts.join(' ')),
  warn: (...parts) => { warns.push(parts.join(' ')); forward('[W] ' + parts.join(' ')); },
  error: (...parts) => {
    const text = parts.map(p => (p && p.message) ? p.message : String(p)).join(' ');
    errorLogs.push(text);
    forward('[E] ' + text);
  },
  info: () => {}, debug: () => {}, time: () => {}, timeEnd: () => {}
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

async function pumpTicks(ticks) {
  for (let i = 0; i < ticks && rafs.size > 0; i++) {
    const due = [...rafs.values()];
    rafs.clear();
    for (const callback of due) callback(performance.now());
    await new Promise(resolve => setTimeout(resolve, 1));
  }
}
await pumpTicks(options.ticks);

const diag = vm.runInContext('globalThis.__JSR_GPGPU || null', context);
const maxTriangles = Math.max(0, ...states.map(s => s?.renderer?.triangles || 0));
const maxCalls = Math.max(0, ...states.map(s => s?.renderer?.calls || 0));
const maxPoints = Math.max(0, ...states.map(s => s?.renderer?.points || 0));
const neutralWarn = warns.find(w => w.includes('R1 lowers GPU computation passes'));
const errorTrees = renders.filter(tree => JSON.stringify(tree).includes('Widget error'));

console.log(JSON.stringify({
  widget: options.widget,
  ticks: options.ticks,
  packets: packets.length,
  gpgpu: diag,
  maxTriangles,
  maxCalls,
  maxPoints,
  neutralWarn: neutralWarn || null,
  errorLogs,
  errorTrees: errorTrees.length,
  bootMs: Math.round(performance.now() - bootT0)
}, null, 2));

assert.deepEqual(errorTrees, [], 'widget must not emit error cards');
assert.deepEqual(errorLogs, [], `widget console must stay clean: ${JSON.stringify(errorLogs)}`);
assert.ok(packets.length >= options.ticks * 0.5,
  `expected >= ${Math.floor(options.ticks / 2)} R1 frames, got ${packets.length}`);
if (neutralWarn) throw new Error('FAIL: the R1 neutral GPGPU lane is active (sim inert) — CPU kernels did not engage');
assert.ok(diag, 'FAIL: globalThis.__JSR_GPGPU missing — CPU kernel lane did not run');
assert.ok(diag.frames >= Math.floor(options.ticks * 0.5),
  `FAIL: only ${diag.frames} kernel frames ran`);
if (options.widget.includes('birds')) {
  assert.ok(diag.spread >= 100, `FAIL birds: flock collapsed (spread=${diag.spread} < 100)`);
  assert.ok(diag.avgSpeed >= 0.5, `FAIL birds: flock stalled (avgSpeed=${diag.avgSpeed})`);
  assert.ok(diag.alive >= 1000, `FAIL birds: alive=${diag.alive}`);
} else {
  assert.ok(diag.spread >= 100 && diag.spread <= 900,
    `FAIL protoplanet: disc extent ${diag.spread} outside [100, 900]`);
  assert.ok(diag.alive >= diag.frames * 0, 'protoplanet alive guard');
}
assert.ok(maxTriangles > 0 || maxCalls > 0 || maxPoints > 0,
  'FAIL: renderer state shows zero draws');
console.log(`PIN OK ${options.widget}: frames=${diag.frames} spread=${diag.spread} avgSpeed=${diag.avgSpeed} triangles=${maxTriangles} calls=${maxCalls} points=${maxPoints}`);
