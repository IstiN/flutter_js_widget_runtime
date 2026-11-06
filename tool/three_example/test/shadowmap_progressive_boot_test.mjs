import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

// Flicker regression for webgl_shadowmap_progressive on R1: the official
// module re-jitters its eight DirectionalLights EVERY frame (after the
// accumulation update, before renderer.render) and marks all eight
// castShadow. Upstream hides that behind a converging lightMap; R1 drops
// material.lightMap + onBeforeCompile, so the visible scene was pure shimmer
// (per-frame light positions + a per-frame shadow-scan winner). The
// degrades/progressive_lightmap_static.mjs override (importOverrides on the
// module's ProgressiveLightMap import) freezes every light position
// structurally, keeps castShadow on light 0 only, and stops the dead RT
// pass after its first effective frame.
//
// This boot drives the REAL reprepared widget through 30 captured frames
// with a VARYING deterministic Math.random (so pre-fix jitter inputs keep
// changing) and asserts the R1 stream goes hash-stable after warmup:
// byte-identical frame packets, a byte-identical FRAME shadow block with a
// real 512x512 shadow map, zero steady-state RT/texture churn, and frozen
// light positions in the LIGHT commands.

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const OUT = path.join(ROOT, 'example/widgets/three-shadowmap-progressive');
const native = await readFile(path.join(ROOT, 'assets/three/jsr_three_native.js'), 'utf8');
const [html, module, widgetJs] = await Promise.all([
  readFile(path.join(OUT, 'original.html')),
  readFile(path.join(OUT, 'official_module.js')),
  readFile(path.join(OUT, 'widget.js'), 'utf8')
]);

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
{
  const open = /<script\b[^>]*\btype="module"[^>]*>/i.exec(html.toString('latin1'));
  const start = open.index + open[0].length;
  const direct = html.subarray(start, html.indexOf('</script>', start));
  assert.deepEqual(module, direct, 'saved module is the exact original byte span');
  const manifest = await readFile(path.join(OUT, 'prepare_manifest.json'), 'utf8').then(JSON.parse);
  assert.equal(sha(direct), manifest.outputs['official_module.js'].sha256);
  assert.equal(manifest.example, 'webgl_shadowmap_progressive');
  assert.ok(manifest.build && sha(Buffer.from(widgetJs, 'utf8')) === manifest.outputs['widget.js'].sha256,
    'booted widget is the current prepared output');
}

// Varying deterministic PRNG: the official jitter consumes Math.random() per
// light per frame. Pre-fix, these ever-changing inputs move lights (and the
// shadow scan winner) every frame; post-fix they are ignored entirely.
let seed = 0x1a2b3c4d;
const mulberry32 = () => {
  seed |= 0; seed = seed + 0x6d2b79f5 | 0;
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};

const states = [];
const rafs = new Map();
let nextRaf = 0;
let now = 1000;
const framePackets = [];
let currentFramePackets = [];
const bootPackets = []; // every R1 packet of the whole boot, warmup included
const jsr = {
  instanceId: 'shadowmap-progressive-boot-test',
  _handler: null,
  render() {},
  exportState(state) { states.push(JSON.parse(JSON.stringify(state))); },
  onEvent(handler) { this._handler = handler; },
  requestAnimationFrame(callback) { const id = ++nextRaf; rafs.set(id, callback); return id; },
  cancelAnimationFrame(id) { rafs.delete(id); },
  hostCallBinary(name, bytes) {
    assert.equal(name, 'three.r1');
    const packet = Buffer.from(bytes);
    currentFramePackets.push(packet);
    bootPackets.push(packet);
  },
  async hostCall(name) {
    if (name === 'three.canvas2d') return new Promise(() => {});
    if (name === 'three.asset') return null;
    throw new Error(`unexpected host call ${name}`);
  }
};
const context = vm.createContext({
  jsr, console, performance, sendMessage() {}, TextEncoder, TextDecoder,
  Math: Object.assign(Object.create(Math), { random: mulberry32 }),
  setTimeout() { return 0; },
  clearTimeout() {}
});
vm.runInContext(native, context, { filename: 'jsr_three_native.js' });
vm.runInContext('globalThis.THREE = THREE;', context);
vm.runInContext(widgetJs, context, { filename: 'widget.js' });

const tick = () => new Promise(resolve => setImmediate(resolve));
const frame = async () => {
  now += 16;
  await tick();
  currentFramePackets = [];
  const callbacks = [...rafs.values()];
  rafs.clear();
  assert.equal(callbacks.length, 1, 'official animation loop stays singular');
  callbacks[0](now);
  await tick();
  return currentFramePackets;
};

const frameDigest = packets => {
  // The R1 envelope header carries a per-packet sequence number, so raw
  // packet bytes never repeat; digest the parsed command stream instead.
  const hash = createHash('sha256');
  for (const packet of packets) {
    const header = packet.readUInt16LE(6);
    const count = packet.readUInt32LE(header + 8);
    let offset = header + 12;
    for (let index = 0; index < count; index++) {
      hash.update(packet.subarray(offset, offset + 8));
      const length = packet.readUInt32LE(offset + 4);
      hash.update(packet.subarray(offset + 8, offset + 8 + length));
      offset += 8 + length;
    }
  }
  return hash.digest('hex');
};

await tick();
await tick();
// Warm up until the GLTF loaded, the lightmap objects registered and the
// stream settles: the mesh GLB parses through the async loader chain, then
// OrbitControls damping decays to float32-invisible. Capture warm digests
// until the stream repeats byte-identically.
let loaded = -1;
for (let index = 0; index < 120; index++) {
  const packets = await frame();
  const joined = Buffer.concat(packets);
  // The loaded mesh + ground draw: a DRAW_BATCH or mesh geometry upload.
  if (joined.length > 4096) { loaded = index; break; }
}
assert.ok(loaded >= 0, 'loaded scene reaches the R1 stream');
let stableRun = 0;
let lastDigest = '';
let warmFrames = 0;
for (let index = 0; index < 600; index++) {
  const packets = await frame();
  warmFrames++;
  const digest = frameDigest(packets);
  stableRun = digest === lastDigest ? stableRun + 1 : 0;
  lastDigest = digest;
  if (stableRun >= 12) break;
}
assert.equal(stableRun >= 12, true,
  `frame stream converges to byte-identical output (stableRun=${stableRun} after ${warmFrames} warm frames)`);

function commands(packet) {
  // Only R1 envelopes carry command streams; other hostCallBinary lanes
  // (canvas2d captures, control syncs) have their own framing.
  const header = packet.readUInt16LE(6);
  if (packet.length < header + 12 ||
      packet[header] !== 0x4a || packet[header + 1] !== 0x53 ||
      packet[header + 2] !== 0x52 || packet[header + 3] !== 0x31) return [];
  const count = packet.readUInt32LE(header + 8);
  const output = [];
  let offset = header + 12;
  for (let index = 0; index < count; index++) {
    const opcode = packet[offset];
    const length = packet.readUInt32LE(offset + 4);
    output.push({ opcode, body: packet.subarray(offset + 8, offset + 8 + length) });
    offset += 8 + length;
  }
  assert.equal(offset, packet.length, 'packet framing is exact');
  return output;
}


// Capture 30 frames: digest + parsed facts per frame.
const digests = [];
const shadowBlocks = [];
const lightPositions = [];
const rtCommandFrames = [];
const captureFrames = [];
for (let index = 0; index < 30; index++) {
  const packets = await frame();
  captureFrames.push(packets);
  digests.push(frameDigest(packets));
  const all = packets.flatMap(packet => commands(packet));
  rtCommandFrames.push(all.filter(command => command.opcode === 14).length);
  const frameCommand = all.find(command => command.opcode === 8);
  if (frameCommand) {
    // FRAME body layout (see r1.js frameCommand): sceneId u32 @0, cameraId
    // u32 @4, background rgba f32 @8..24, exposure f32 @24, fog mode u32
    // @28 + 4 f32, toneMapping u32 @52, fogDensity f32 @56, point-shadow
    // block u32+u32+4 f32 @60..84, shadow width u32 @84, height u32 @88,
    // bias/normalBias/radius f32 @92..104, matrix f32x16 @104..168,
    // shadowLightType u32 @168.
    const body = frameCommand.body;
    const width = body.readUInt32LE(84);
    const height = body.readUInt32LE(88);
    const matrix = body.subarray(104, 168);
    const shadowLightType = body.readUInt32LE(168);
    shadowBlocks.push({ width, height, matrix: sha(matrix), shadowLightType });
  }
  const dirLight = all.find(command => command.opcode === 7);
  if (dirLight) lightPositions.push(sha(dirLight.body.subarray(24, 36)));
}

assert.ok(shadowBlocks.length >= 28, 'FRAME commands ride the captured frames');
assert.ok(new Set(digests).size === 1,
  `all 30 captured frame packet streams are byte-identical (got ${new Set(digests).size} distinct digests)`);
assert.ok(new Set(shadowBlocks.map(block => block.matrix)).size === 1,
  'the FRAME shadow matrix is byte-stable across all 30 frames');
const shadow = shadowBlocks[0];
assert.equal(shadow.width, 512, 'a real 512-wide shadow map is active');
assert.equal(shadow.height, 512, 'a real 512-high shadow map is active');
assert.equal(shadow.shadowLightType, 1, 'the single shadow light is directional');
assert.ok(shadow.matrix !== sha(Buffer.alloc(64)), 'shadow matrix is non-identity (a real anchored shadow)');
assert.ok(rtCommandFrames.slice(1).every(count => count === 0),
  'no render-target passes run after the first captured frame (dead RT lane stopped)');
if (lightPositions.length) {
  assert.ok(new Set(lightPositions).size === 1, 'directional light positions are frozen across frames');
}

// The frozen light 0 anchor: the module authors dirLights at (200,200,200)
// before its first jitter; the freeze keeps that position. R1 upserts lights
// only when their state changes, so the steady-state stream usually carries
// NO light command — the anchor must appear (once) across the whole capture
// with the authored position, never a resampled jitter position.
const anchorLight = bootPackets.flatMap(packet => commands(packet))
  .filter(command => command.opcode === 7)
  .map(command => ({
    x: command.body.readFloatLE(24),
    y: command.body.readFloatLE(28),
    z: command.body.readFloatLE(32)
  }));
assert.ok(anchorLight.length >= 1, 'capture carries the anchored light upsert');
for (const light of anchorLight) {
  assert.deepEqual([light.x, light.y, light.z], [200, 200, 200],
    'directional lights stay at their authored (200,200,200) origin');
}

console.log(JSON.stringify({
  ok: true,
  widgetSha256: sha(Buffer.from(widgetJs, 'utf8')),
  loadedAtFrame: loaded,
  capturedFrames: captureFrames.length,
  distinctDigests: new Set(digests).size,
  shadow: { width: shadow.width, height: shadow.height, shadowLightType: shadow.shadowLightType, matrixStable: true },
  steadyStateRenderTargetCommands: rtCommandFrames.slice(1).reduce((a, b) => a + b, 0),
  frozenLightPosition: anchorLight[0]
}, null, 2));
