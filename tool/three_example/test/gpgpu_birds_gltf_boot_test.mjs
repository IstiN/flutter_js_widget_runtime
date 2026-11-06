#!/usr/bin/env node
// Boot harness for webgl_gpgpu_birds_gltf (three-gpgpu-birds-gltf), the
// controls_gui / loader_prebuild_boot_test pattern: boots the prepared
// widget.js on the pinned native runtime in a vm, pumps RAF and asserts the
// cpu-flock degrade (degrades/gpgpu_birds_gltf_cpu_flock.mjs):
//
//   (a) the GPGPU sim passes are gone — GPUComputationRenderer.compute() is
//       no-op'd after detection (the JSR degrade warning fires once), the
//       per-tick RGBA8/lowered-GPU-computation warning churn stops after
//       init, and no per-tick RT blit materials appear;
//   (b) the flock is a live InstancedMesh (R1 DRAW_BATCH lane): one draw
//       call, 1024 default instances (GUI count slider drives mesh.count),
//       641024 triangles = Parot 626 tris × 1024 instances (Math.random is
//       stubbed so the module deterministically picks Parrot.glb), instance
//       matrices actually CHANGE between ticks (decoded payload comparison —
//       the frozen-blob bug), every matrix packet stays ~64KB (vs the
//       56.5MB one-time merged-mesh upload the stock build produced), and
//       matrix packets arrive on the ~30Hz every-3rd-frame cadence;
//   plus the encode-time proxy numbers (per-frame pump ms) that went with
//   the before/after measurement (before: one 56.5MB geometry packet whose
//   encode pump cost ~1100ms and a frozen scene; after: ~81KB one-time
//   geometry+instance upload and 2.2ms tick frames / 0.04ms other frames).
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const PINNED_MODULE_SHA = '372a4c0a61ee4edf3fd4fda45fb584812ae698268a11ddba0d627e4adc5a8bb6';
const PINNED_HTML_SHA = 'f3196d89cb4b6e0cd4a237d94caa8d5462c4dba9673501cd8e5a1e3db60e8dbc';
const FRAMES = 30;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

const OUT = path.join(ROOT, 'example/widgets/three-gpgpu-birds-gltf');
const [html, module, manifestJson, widget, native] = await Promise.all([
  readFile(path.join(OUT, 'original.html')),
  readFile(path.join(OUT, 'official_module.js')),
  readFile(path.join(OUT, 'prepare_manifest.json'), 'utf8').then(JSON.parse),
  readFile(path.join(OUT, 'widget.js'), 'utf8'),
  readFile(path.join(ROOT, 'assets/three/jsr_three_native.js'), 'utf8')
]);
assert.equal(sha(module), PINNED_MODULE_SHA, 'official_module.js must keep the pinned upstream bytes');
assert.equal(sha(html), PINNED_HTML_SHA, 'original.html must keep the pinned upstream bytes');
assert.equal(sha(module), manifestJson.outputs['official_module.js'].sha256);
assert.ok((manifestJson.extraction.buildTransform || '').includes('gpgpu_birds_gltf_cpu_flock.mjs'),
  'prepare manifest must record the cpu-flock anchored patch');
assert.equal(manifestJson.extraction.officialModule.sha256, PINNED_MODULE_SHA);

function commands(packetBuffer) {
  const bytes = Buffer.from(packetBuffer);
  const header = bytes.readUInt16LE(6);
  const count = bytes.readUInt32LE(header + 8);
  const output = [];
  let offset = header + 12;
  for (let index = 0; index < count; index++) {
    const opcode = bytes[offset];
    const length = bytes.readUInt32LE(offset + 4);
    output.push({ opcode, body: bytes.subarray(offset + 8, offset + 8 + length) });
    offset += 8 + length;
  }
  assert.equal(offset, bytes.length);
  return output;
}

const packets = [];
const states = [];
const renders = [];
const logs = [];
const rafs = new Map();
let nextRaf = 0;
const jsr = {
  instanceId: 'birds-cpu-flock-boot-test',
  render(tree) { renders.push(tree); },
  exportState(state) { states.push(state); },
  onEvent(handler) { this._handler = handler; },
  requestAnimationFrame(callback) { const id = ++nextRaf; rafs.set(id, callback); return id; },
  cancelAnimationFrame(id) { rafs.delete(id); },
  hostCallBinary(name, bytes) { assert.equal(name, 'three.r1'); packets.push(Buffer.from(bytes)); },
  hostCall(name) {
    // Every asset the module needs (Parrot.glb / Flamingo.glb) is inlined in
    // widget.js; a host request would mean an externalized asset lane.
    if (name === 'three.canvas2d') return new Promise(() => {});
    if (name === 'three.asset') throw new Error('unexpected external asset request — Parrot.glb must be inlined');
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
vm.runInContext('globalThis.THREE = THREE; Math.random = () => 0.375;', context);
vm.runInContext(widget, context, { filename: 'widget.js' });

let now = 1000;
const pumpMs = [];
const pump = () => {
  const due = [...rafs.values()];
  rafs.clear();
  assert.equal(due.length, 1, 'one animation-loop RAF per frame');
  const t0 = performance.now();
  const packetCountBefore = packets.length;
  due[0](now);
  now += 16.6;
  // A pump that emitted a large matrix packet is a flock tick frame; GUI-only
  // frames re-render text without a DRAW_BATCH.
  pumpMs.push({ ms: Math.round((performance.now() - t0) * 100) / 100, tick: packets.length > packetCountBefore && packets.at(-1).byteLength > 60000 });
};
// The GLTFLoader parse (inline Parrot.glb) is async: settle the microtask
// queue until the module's animation loop schedules its first RAF.
for (let i = 0; i < 500 && rafs.size === 0; i++) await new Promise(resolve => setImmediate(resolve));
assert.ok(rafs.size > 0, 'the animation loop must start after the inline GLB parse');
for (let i = 0; i < FRAMES; i++) pump();

// ---- (a) sim-pass no-op evidence ----
const degradeWarnings = logs.filter(l => l.includes('GPUComputationRenderer.compute() no-op'));
assert.equal(degradeWarnings.length, 1, 'the degrade must no-op compute() exactly once');
const initWarnings = logs.filter(l => l.includes('R1 stores this render target as RGBA8'));
assert.ok(initWarnings.length >= 2, 'init() still bakes the initial position/velocity textures');
const churnWarnings = logs.filter(l => l.includes('R1 lowers GPU computation passes'));
assert.ok(churnWarnings.length >= 1, 'init() RT bake is still a lowered blit');
assert.equal(logs.filter(l => l.startsWith('[E]')).length, 0, 'no runtime errors');

// ---- (b) live InstancedMesh flock evidence ----
function collectBatches() {
  const out = [];
  for (const packet of packets) {
    for (const cmd of commands(packet)) {
    if (cmd.opcode !== 11) continue; // OPCODE.DRAW_BATCH
    const body = cmd.body;
    out.push({
      id: body.readUInt32LE(0),
      version: body.readUInt32LE(4),
      instances: body.readUInt32LE(8),
      flags: body.readUInt32LE(12),
      parts: body.readUInt32LE(16),
      matrices: body.subarray(20 + body.readUInt32LE(16) * 16)
    });
  }
  }
  return out;
}
let batches = collectBatches();
assert.ok(batches.length >= 8, `expected matrix updates on ~every 3rd frame, got ${batches.length} DRAW_BATCH commands in ${FRAMES} frames`);
assert.equal(Math.round(batches.length / FRAMES * 3), 1, 'matrix packets arrive every ~3rd frame (30Hz cadence)');
const first = batches[0];
assert.equal(first.instances, 1024, 'GUI default count = BIRDS/4 instances');
assert.equal(first.flags & 1, 1, 'DRAW_BATCH carries the instanceMatrix payload');
assert.ok(first.matrices.length >= first.instances * 64, 'full instance matrices ride the command');
assert.equal(first.parts, 1, 'one batch part: one bird geometry, one material');
const maxState = states.reduce((best, s) => (s?.renderer?.triangles || 0) > (best?.renderer?.triangles || 0) ? s : best, states[0]);
assert.equal(maxState.renderer.calls, 1, 'the whole flock is ONE draw call');
assert.equal(maxState.renderer.triangles, 641024, 'Parot 626 tris × 1024 instances');
assert.equal(maxState.renderer.geometries, 2, 'bird geometry + one sim RT geometry lane');
// motion: consecutive matrix payloads must differ (the frozen-blob bug sent
// 56.5MB of identical vertices once and never moved again)
let motion = 0;
for (let i = 1; i < batches.length; i++) {
  if (!batches[i].matrices.equals(batches[i - 1].matrices)) motion++;
}
assert.ok(motion >= batches.length - 1, 'every matrix update changes the payload — the flock moves');
// packet sizes: no 56MB static mesh, updates stay small
const maxPacket = Math.max(...packets.map(p => p.byteLength));
assert.ok(maxPacket < 200000, `largest packet must stay ~100KB, got ${maxPacket}B (stock build: 56.5MB)`);
const steady = packets.filter(p => p.byteLength > 60000);
assert.equal(steady.length, batches.length, 'steady-state matrix packets are the only large ones');
// GUI count slider drives mesh.count (native lil-gui render tree)
pump();
// The official module ships gui.close(): the facade renders a collapsed
// panel whose sliders are reachable only through the title tap-toggle
// (the postprocessing_dof pattern in controls_gui_test).
const findToggles = tree => {
  const actions = [];
  const walk = node => {
    if (!node || typeof node !== 'object') return;
    if (typeof node.onTap === 'string' && node.onTap.startsWith('three.gui.toggle.')) actions.push(node.onTap);
    for (const value of Object.values(node)) if (value && typeof value === 'object') walk(value);
  };
  walk(tree);
  return actions;
};
const toggles = findToggles(renders.at(-1));
assert.equal(toggles.length, 1, 'collapsed official panel renders one title tap-toggle');
jsr._handler(toggles[0], {});
pump();
pump(); // the facade re-renders the expanded panel on the next frame
function findSlider(tree, label) {
  if (!tree || typeof tree !== 'object') return null;
  if (tree.type === 'slider' && tree.label === label) return tree;
  for (const value of Object.values(tree)) {
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        for (const child of value) {
          const found = findSlider(child, label);
          if (found) return found;
        }
      } else {
        const found = findSlider(value, label);
        if (found) return found;
      }
    }
  }
  return null;
}
const slider = findSlider(renders.at(-1), 'count');
assert.ok(slider, 'expanded official panel exposes a real JSR slider for count');
batches = collectBatches();
const versionBefore = batches.at(-1).version;
jsr._handler(slider.onChanged, { value: 512 });
for (let i = 0; i < 6; i++) pump();
batches = collectBatches();
const resized = batches.filter(b => b.instances === 512);
assert.ok(resized.length >= 1, 'count slider resizes the InstancedMesh');
assert.ok(resized.at(-1).matrices.length >= 512 * 64 && resized.at(-1).matrices.length < 40000,
  'matrix payload shrinks with the instance count');
assert.ok(batches.at(-1).version > versionBefore, 'batch version advanced after the resize');

const tickMs = [];
const tickMsList = [];
const calmMs = [];
for (const entry of pumpMs) (entry.tick ? tickMsList : calmMs).push(entry.ms);
console.log(JSON.stringify({
  ok: true,
  widget: 'three-gpgpu-birds-gltf',
  officialModuleSha256: PINNED_MODULE_SHA,
  drawBatch: { commands: batches.length, instances: first.instances, flags: first.flags, triangles: 641024, calls: 1 },
  motion: { changedPayloads: motion, of: batches.length - 1 },
  packets: { total: packets.length, maxBytes: maxPacket, matrixUpdateBytes: steady[steady.length - 1] },
  cadence: { matrixPacketsPer3Frames: Math.round(batches.length / FRAMES * 3 * 100) / 100 },
  encodeProxy: {
    perFramePumpMs: { tickAvg: Math.round(tickMsList.reduce((a, b) => a + b, 0) / tickMsList.length * 100) / 100, calmAvg: Math.round(calmMs.reduce((a, b) => a + b, 0) / calmMs.length * 1000) / 1000 },
    beforeStock: { geometryPacketBytes: 56520005, encodeMs: 1103, steadyFrameBytes: 1697, drawCalls: 1, triangles: 1, verdict: 'frozen blob' }
  },
  simNop: { degradeWarning: degradeWarnings.length, initRtWarnings: initWarnings.length, churnWarnings: churnWarnings.length }
}, null, 2));
