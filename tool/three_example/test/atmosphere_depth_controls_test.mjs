import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const native = await readFile(path.join(ROOT, 'assets/three/jsr_three_native.js'), 'utf8');
const sha = value => createHash('sha256').update(value).digest('hex');

function commands(packet) {
  const bytes = Buffer.from(packet);
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
function latestPackets(harness) {
  return harness.packets.splice(0).flatMap(commands);
}
function controller(harness, name, folder) {
  const state = [...harness.states].reverse().find(value => value.gui)?.gui;
  const matches = state.values.filter(value => (value.name || value.property) === name &&
    (folder === undefined || value.folder === folder));
  assert.equal(matches.length, 1, `one official ${folder || ''}/${name} controller`);
  return matches[0];
}
function change(harness, name, value, folder) {
  const before = controller(harness, name, folder);
  harness.jsr._handler(before.action, { value });
  const after = controller(harness, name, folder);
  if (typeof value === 'number') assert.ok(Math.abs(after.value - value) < 1e-9,
    `${folder || ''}/${name} reaches its official onChange (${after.value})`);
  else assert.equal(after.value, value, `${folder || ''}/${name} reaches its official onChange`);
}
function boot(directory) {
  const renders = [];
  const states = [];
  const packets = [];
  const rafs = new Map();
  const timers = new Map();
  let nextRaf = 0;
  let nextTimer = 0;
  const jsr = {
    instanceId: `${directory}-focused-test`, _handler: null,
    render(tree) { renders.push(JSON.parse(JSON.stringify(tree))); },
    exportState(state) { states.push(JSON.parse(JSON.stringify(state))); },
    onEvent(handler) { this._handler = handler; },
    requestAnimationFrame(callback) { const id = ++nextRaf; rafs.set(id, callback); return id; },
    cancelAnimationFrame(id) { rafs.delete(id); },
    hostCallBinary(name, bytes) { assert.equal(name, 'three.r1'); packets.push(Buffer.from(bytes)); },
    async hostCall(name, args) {
      if (name === 'three.canvas2d') return new Promise(() => {});
      if (name === 'three.asset') {
        const url = String(args && (args.url || args.path || args.src));
        const bytes = await readFile(path.join(ROOT, 'example/widgets', directory, url));
        return { data: bytes.toString('base64'), mime: url.endsWith('.jpg') ? 'image/jpeg' : 'image/png' };
      }
      throw new Error(`unexpected host call ${name}`);
    },
  };
  const context = vm.createContext({
    jsr, console, performance, sendMessage() {}, TextEncoder, TextDecoder,
    setTimeout(callback) { const id = ++nextTimer; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  return readFile(path.join(ROOT, 'assets/three/jsr_three_native.js'), 'utf8')
    .then(() => readFile(path.join(ROOT, 'example/widgets', directory, 'widget.js'), 'utf8'))
    .then(widget => {
      vm.runInContext(native, context, { filename: 'jsr_three_native.js' });
      vm.runInContext('globalThis.THREE = THREE; Math.random = () => 0.375;', context);
      vm.runInContext(widget, context, { filename: `${directory}/widget.js` });
      vm.runInContext(`
        globalThis.__lastScene = null;
        globalThis.__lastRenderer = null;
        const __boundedRender = THREE.WebGLRenderer.prototype.render;
        THREE.WebGLRenderer.prototype.render = function(scene, camera) {
          globalThis.__lastScene = scene;
          globalThis.__lastRenderer = this;
          const result = __boundedRender.call(this, scene, camera);
          globalThis.__sky = null;
          globalThis.__water = null;
          globalThis.__sphere = null;
          scene.traverse(object => {
            if (object.isSky) globalThis.__sky = object;
            if (object.isWater) globalThis.__water = object;
            if (object.isMesh && object.geometry?.type === 'SphereGeometry' && !object.isSky) globalThis.__sphere = object;
          });
          return result;
        };
      `, context);
      return {
        context, jsr, renders, states, packets, timers,
        frame(now = performance.now()) {
          const callbacks = [...rafs.values()];
          rafs.clear();
          assert.equal(callbacks.length, 1, `${directory} keeps one animation callback`);
          callbacks[0](now);
        },
        evaluate(source) { return vm.runInContext(source, context); },
      };
    });
}
function textureHash(harness, expression = '__sky._nativeTexture.image.data') {
  return sha(harness.evaluate(expression));
}
function exposure(packetCommands) {
  const frames = packetCommands.filter(command => command.opcode === 8);
  return frames.at(-1).body.readFloatLE(24);
}

// Depth: the regression was the lowered Basic blit showing linear depth
// directly. Verify the actual packet now has white far/post clears, kind 12
// depth draws, and the native blend equation that performs 1-src.
{
  const harness = await boot('three-depth-texture');
  harness.frame(0);
  let packet = latestPackets(harness);
  assert.ok(packet.some(command => command.opcode === 3 && command.body.readUInt32LE(8) === 12),
    'RT instancing draws through native MeshDepthMaterial kind 12');
  assert.ok(packet.some(command => command.opcode === 3 && command.body.readUInt32LE(8) === 0 &&
    ((command.body.readUInt32LE(16) >> 7) & 7) === 3), 'post Basic lowering uses SubtractiveBlending');
  const clears = packet.filter(command => command.opcode === 8).map(command =>
    [8, 12, 16].map(offset => command.body.readFloatLE(offset)));
  assert.ok(clears.length >= 2 && clears.every(color => color.every(value => value === 1)),
    'both far-depth and post destination clears are white');
  assert.equal(harness.evaluate('__lastScene.background.getHex()'), 0xffffff);
  change(harness, 'format', harness.evaluate('THREE.DepthStencilFormat'));
  harness.frame(16);
  change(harness, 'type', harness.evaluate('THREE.FloatType'));
  harness.frame(32);
  change(harness, 'samples', 4);
  harness.frame(48);
  packet = latestPackets(harness);
  assert.equal(packet.filter(command => command.opcode === 8).length, 6,
    'all official format/type/samples controls retain both RT and post passes after target rebuilds');
  assert.equal(harness.evaluate('__lastScene.children[0].material.blending'), 3);
  console.log('depth_texture: kind12 + white/far + subtractive post; format/type/samples exercised');
}

// Ocean: every slider must reach either generated pixels, native material
// state, light/exposure state, or the bounded bloom generator.
{
  const harness = await boot('three-shaders-ocean');
  harness.frame(0);
  assert.ok(harness.evaluate('!!__sky && !!__water'));
  assert.equal(harness.evaluate('__sky.material.type'), 'MeshBasicMaterial');
  assert.equal(harness.evaluate('__water.material.type'), 'MeshStandardMaterial');
  assert.ok(harness.evaluate('__sky._nativeTexture.image.data').some(value => value > 0 && value < 255),
    'generated atmosphere has a non-neutral RGB gradient');
  const atmosphereCases = [
    ['elevation', 18, 'Sky'], ['azimuth', 45, 'Sky'],
    ['coverage', 0.85, 'Clouds'], ['density', 0.9, 'Clouds'], ['elevation', 0.9, 'Clouds'],
  ];
  const atmosphereHashes = [];
  for (const [name, value, folder] of atmosphereCases) {
    const before = textureHash(harness);
    change(harness, name, value, folder);
    harness.frame();
    const after = textureHash(harness);
    assert.notEqual(after, before, `${folder}/${name} changes generated sky pixels`);
    atmosphereHashes.push(after);
  }
  const oldExposure = exposure(latestPackets(harness));
  change(harness, 'exposure', 0.35, 'Sky');
  harness.frame();
  assert.ok(Math.abs(exposure(latestPackets(harness)) - 0.35) < 1e-6 && oldExposure !== 0.35,
    'exposure changes native frame exposure');
  const distortionBefore = harness.evaluate('__water.material.roughness');
  change(harness, 'distortionScale', 7.2, 'Water');
  harness.frame();
  assert.ok(harness.evaluate('__water.material.roughness') < distortionBefore,
    'distortionScale sharpens the bounded native water reflection');
  change(harness, 'size', 6.4, 'Water');
  harness.frame();
  assert.equal(harness.evaluate('__water.material.map.repeat.x'), 6.4,
    'size changes native water UV repetition');
  const offsetBefore = harness.evaluate('__water.material.map.offset.x');
  await new Promise(resolve => setTimeout(resolve, 20));
  harness.frame();
  assert.notEqual(harness.evaluate('__water.material.map.offset.x'), offsetBefore,
    'official time uniform animates the water UV-wave transform');
  for (const [name, value] of [['strength', 1.4], ['radius', 0.8]]) {
    const before = textureHash(harness);
    change(harness, name, value, 'Bloom');
    harness.frame();
    assert.notEqual(textureHash(harness), before, `${name} changes the bounded solar bloom`);
  }
  const packet = latestPackets(harness);
  assert.ok(packet.some(command => command.opcode === 2 && command.body.readUInt32LE(8) === 64 &&
    command.body.readUInt32LE(12) === 32), 'bounded 64x32 atmosphere upload reaches the native packet');
  assert.ok(packet.some(command => command.opcode === 3 && command.body.readUInt32LE(8) === 2),
    'water submits a Standard material, not a ShaderMaterial blit');
  console.log('shaders_ocean: all 10 official sliders exercised; sky pixels/water UV waves/exposure/bloom verified');
}

// Sky: verify all controls, the real environment reflection, and exposure.
{
  const harness = await boot('three-shaders-sky');
  harness.frame(0);
  assert.ok(harness.evaluate('!!__sky && !!__sphere'));
  assert.equal(harness.evaluate('__sphere.material.envMap === __sky._environmentTexture'), true,
    'sphere samples generated sky instead of the aliased cube RT');
  assert.ok(harness.evaluate('__sphere.material.color.r') > 1,
    'reflection restores the bounded HDR scale');
  const initialPacket = latestPackets(harness);
  assert.ok(initialPacket.some(command => command.opcode === 3 && command.body.readUInt32LE(8) === 0 &&
    command.body.readUInt32LE(72) > 0), 'sky and sphere emit native env-mapped Basic materials');
  const cases = [
    ['turbidity', 18], ['rayleigh', 0.6], ['mieCoefficient', 0.06], ['mieDirectionalG', 0.25],
    ['elevation', 22], ['azimuth', 80], ['coverage', 0.8], ['density', 0.85], ['elevation', 0.9],
  ];
  for (const [name, value] of cases) {
    const folder = ['coverage', 'density'].includes(name) || (name === 'elevation' && value < 1) ? 'Clouds' : 'Controls';
    const before = textureHash(harness);
    change(harness, name, value, folder);
    harness.frame();
    assert.notEqual(textureHash(harness), before, `${folder || 'Sky'}/${name} changes sky pixels`);
  }
  const withSun = textureHash(harness);
  change(harness, 'showSunDisc', false);
  harness.frame();
  assert.notEqual(textureHash(harness), withSun, 'showSunDisc checkbox changes generated pixels');
  change(harness, 'exposure', 0.4);
  harness.frame();
  assert.ok(Math.abs(exposure(latestPackets(harness)) - 0.4) < 1e-6);
  latestPackets(harness);
  console.log('shaders_sky: all 11 official controls exercised; live sky reflection + exposure verified');
}

console.log(JSON.stringify({ ok: true, examples: ['webgl_depth_texture', 'webgl_shaders_ocean', 'webgl_shaders_sky'] }));
