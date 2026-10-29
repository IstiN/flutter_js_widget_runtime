import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const native = await readFile(path.join(ROOT, 'assets/three/three.native.js'), 'utf8');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

async function verifyOfficial(example, directory) {
  const out = path.join(ROOT, 'example/widgets', directory);
  const [html, module, manifest] = await Promise.all([
    readFile(path.join(out, 'original.html')),
    readFile(path.join(out, 'official_module.js')),
    readFile(path.join(out, 'prepare_manifest.json'), 'utf8').then(JSON.parse)
  ]);
  const open = /<script\b[^>]*\btype="module"[^>]*>/i.exec(html.toString('latin1'));
  const start = open.index + open[0].length;
  const direct = html.subarray(start, html.indexOf('</script>', start));
  assert.deepEqual(module, direct);
  assert.equal(sha(html), manifest.outputs['original.html'].sha256);
  assert.equal(sha(direct), manifest.outputs['official_module.js'].sha256);
  assert.equal(manifest.example, example);
  assert.equal(manifest.build.offline, true);
  return { out, manifest };
}

function commands(packet) {
  const bytes = Buffer.from(packet);
  const header = bytes.readUInt16LE(6);
  const count = bytes.readUInt32LE(header + 8);
  const output = [];
  let offset = header + 12;
  for (let index = 0; index < count; index++) {
    const opcode = bytes[offset];
    const length = bytes.readUInt32LE(offset + 4);
    const body = bytes.subarray(offset + 8, offset + 8 + length);
    output.push({ opcode, body });
    offset += 8 + length;
  }
  assert.equal(offset, bytes.length);
  return output;
}

function cameraState(packets) {
  for (let packetIndex = packets.length - 1; packetIndex >= 0; packetIndex--) {
    const frames = commands(packets[packetIndex]);
    for (let index = frames.length - 1; index >= 0; index--) {
      if (frames[index].opcode !== 6) continue;
      const body = frames[index].body;
      return {
        position: [184, 188, 192].map(offset => body.readFloatLE(offset)),
        matrix: Array.from({ length: 16 }, (_, i) => body.readFloatLE(136 + i * 4))
      };
    }
  }
  throw new Error('no R1 camera command');
}

function findCheckbox(tree, label) {
  if (!tree || typeof tree !== 'object') return null;
  if (tree.type === 'checkbox' && tree.label === label) return tree;
  for (const value of Object.values(tree)) {
    if (Array.isArray(value)) {
      for (const child of value) {
        const found = findCheckbox(child, label);
        if (found) return found;
      }
    } else {
      const found = findCheckbox(value, label);
      if (found) return found;
    }
  }
  return null;
}

function boot(widget, instanceId) {
  const renders = [];
  const states = [];
  const packets = [];
  const rafs = new Map();
  const timers = new Map();
  let nextRaf = 0;
  let nextTimer = 0;
  const jsr = {
    instanceId,
    _handler: null,
    render(tree) { renders.push(JSON.parse(JSON.stringify(tree))); },
    exportState(state) { states.push(JSON.parse(JSON.stringify(state))); },
    onEvent(handler) { this._handler = handler; },
    requestAnimationFrame(callback) { const id = ++nextRaf; rafs.set(id, callback); return id; },
    cancelAnimationFrame(id) { rafs.delete(id); },
    hostCallBinary(name, bytes) { assert.equal(name, 'three.r1'); packets.push(Buffer.from(bytes)); },
    hostCall(name) {
      if (name === 'three.canvas2d') return new Promise(() => {});
      throw new Error(`unexpected host call ${name}`);
    }
  };
  const context = vm.createContext({
    jsr, console, performance, sendMessage() {}, TextEncoder, TextDecoder,
    setTimeout(callback) { const id = ++nextTimer; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); }
  });
  vm.runInContext(native, context, { filename: 'three.native.js' });
  vm.runInContext('globalThis.THREE = THREE; Math.random = () => 0.375;', context);
  vm.runInContext(widget, context, { filename: 'widget.js' });
  return {
    context, jsr, renders, states, packets, timers,
    frame(now = performance.now()) {
      const callbacks = [...rafs.values()];
      rafs.clear();
      assert.equal(callbacks.length, 1);
      callbacks[0](now);
    },
    input(event) { jsr.three._dispatchEvent('main', event); }
  };
}

const terrainInfo = await verifyOfficial(
  'webgl_geometry_terrain_raycast', 'three-geometry-terrain-raycast'
);
assert.ok(terrainInfo.manifest.inputs['source/examples/jsm/controls/OrbitControls.js']);
assert.ok(terrainInfo.manifest.inputs['source/examples/jsm/math/ImprovedNoise.js']);
assert.ok(!terrainInfo.manifest.inputs['source/examples/jsm/libs/stats.module.js']);
const terrain = boot(
  await readFile(path.join(terrainInfo.out, 'widget.js'), 'utf8'), 'terrain-node-test'
);
terrain.frame(0);
assert.equal(terrain.renders.length, 1);
assert.equal(terrain.states.at(-1).renderer.calls, 2);
assert.equal(terrain.states.at(-1).renderer.triangles, 130056);
assert.equal(terrain.states.at(-1).renderer.textures, 1);
const terrainCommands = commands(terrain.packets[0]);
assert.ok(terrainCommands.some(command => command.opcode === 3 && command.body.readUInt32LE(8) === 6),
  'terrain helper uses native MeshNormalMaterial');
assert.ok(terrainCommands.some(command => command.opcode === 2 &&
  command.body.readUInt32LE(8) === 1024 && command.body.readUInt32LE(12) === 1024 &&
  command.body.readUInt32LE(16) === 0), 'generated terrain CanvasTexture is raw 1024x1024 RGBA');
assert.ok(terrainCommands.some(command => command.opcode === 1 &&
  command.body.readUInt32LE(12) === 65536 && command.body.readUInt32LE(16) === 390150),
  'terrain PlaneGeometry topology');
const initialCamera = cameraState(terrain.packets);
terrain.input({ type: 'pointerdown', pointerId: 7, pointerType: 'mouse', button: 0, pageX: 100, pageY: 100 });
terrain.input({ type: 'pointermove', pointerId: 7, pointerType: 'mouse', buttons: 1, pageX: 150, pageY: 125 });
terrain.input({ type: 'pointerup', pointerId: 7, pointerType: 'mouse', button: 0, pageX: 150, pageY: 125 });
terrain.frame(16);
const draggedCamera = cameraState(terrain.packets);
assert.notDeepEqual(draggedCamera.matrix, initialCamera.matrix, 'official OrbitControls mouse drag changes the camera');
terrain.input({ type: 'wheel', pointerId: 0, deltaY: -120, deltaMode: 0, pageX: 150, pageY: 125 });
terrain.frame(32);
const wheelCamera = cameraState(terrain.packets);
assert.notDeepEqual(wheelCamera.position, draggedCamera.position, 'official OrbitControls wheel changes dolly');
terrain.input({ type: 'pointerdown', pointerId: 8, pointerType: 'mouse', button: 0, pageX: 100, pageY: 100 });
terrain.input({ type: 'pointercancel', pointerId: 8, pointerType: 'mouse', button: 0, pageX: 100, pageY: 100 });
terrain.frame(48);
const cancelledCamera = cameraState(terrain.packets);
terrain.input({ type: 'pointermove', pointerId: 8, pointerType: 'mouse', pageX: 220, pageY: 180 });
terrain.frame(64);
assert.deepEqual(cameraState(terrain.packets).matrix, cancelledCamera.matrix, 'cancel ends OrbitControls tracking');
terrain.input({ type: 'pointerdown', pointerId: 21, pointerType: 'touch', button: 0, pageX: 200, pageY: 200 });
terrain.input({ type: 'pointermove', pointerId: 21, pointerType: 'touch', pageX: 240, pageY: 215 });
terrain.input({ type: 'pointerup', pointerId: 21, pointerType: 'touch', button: 0, pageX: 240, pageY: 215 });
terrain.frame(80);
const oneTouchCamera = cameraState(terrain.packets);
assert.notDeepEqual(oneTouchCamera.matrix, cancelledCamera.matrix, 'one-touch orbit');
terrain.input({ type: 'pointerdown', pointerId: 31, pointerType: 'touch', button: 0, pageX: 250, pageY: 200 });
terrain.input({ type: 'pointerdown', pointerId: 32, pointerType: 'touch', button: 0, pageX: 350, pageY: 200 });
terrain.input({ type: 'pointermove', pointerId: 32, pointerType: 'touch', pageX: 390, pageY: 200 });
terrain.input({ type: 'pointercancel', pointerId: 32, pointerType: 'touch', button: 0, pageX: 390, pageY: 200 });
terrain.input({ type: 'pointercancel', pointerId: 31, pointerType: 'touch', button: 0, pageX: 250, pageY: 200 });
terrain.frame(96);
assert.notDeepEqual(cameraState(terrain.packets).matrix, oneTouchCamera.matrix, 'two-touch dolly/pan and cancellation');

const mathInfo = await verifyOfficial(
  'webgl_math_orientation_transform', 'three-math-orientation-transform'
);
assert.ok(mathInfo.manifest.inputs['source/examples/jsm/libs/lil-gui.module.min.js']);
const math = boot(
  await readFile(path.join(mathInfo.out, 'widget.js'), 'utf8'), 'orientation-node-test'
);
vm.runInContext(`
  globalThis.__meshLookAts = 0;
  const __lookAt = THREE.Object3D.prototype.lookAt;
  THREE.Object3D.prototype.lookAt = function(...args) {
    if (this.isMesh) globalThis.__meshLookAts++;
    return __lookAt.apply(this, args);
  };
`, math.context);
math.frame(0);
math.frame(16);
assert.equal(vm.runInContext('globalThis.__meshLookAts', math.context), 0,
  'default rotateTowards path does not call mesh.lookAt');
let checkbox = findCheckbox(math.renders.at(-1), 'useLookAt');
assert.ok(checkbox, 'native lil-gui emits a real JSR checkbox');
assert.equal(checkbox.value, false);
assert.equal(math.states.at(-1).gui.values[0].value, false);
math.jsr._handler(checkbox.onChanged, { value: true });
checkbox = findCheckbox(math.renders.at(-1), 'useLookAt');
assert.equal(checkbox.value, true);
assert.equal(math.states.at(-1).gui.values[0].value, true, 'GUI updates the official params object');
assert.equal(math.states.at(-1).gui.changes, 1);
assert.equal(math.states.at(-1).gui.finishes, 1);
math.frame(32);
assert.equal(vm.runInContext('globalThis.__meshLookAts', math.context), 1,
  'checkbox switches the official animation to instant lookAt');
const mathCommands = math.packets.flatMap(packet => commands(packet));
assert.ok(mathCommands.some(command => command.opcode === 3 && command.body.readUInt32LE(8) === 6),
  'orientation cone emits native MeshNormalMaterial');
assert.equal(math.timers.size, 1, 'official recurring target timer remains scheduled');

console.log(JSON.stringify({
  ok: true,
  terrain: {
    moduleSha256: terrainInfo.manifest.outputs['official_module.js'].sha256,
    calls: 2, triangles: 130056, texture: '1024x1024 RGBA',
    mouseOrbit: true, wheelDolly: true, oneTouchOrbit: true,
    twoTouchDollyPan: true, cancellation: true
  },
  orientation: {
    moduleSha256: mathInfo.manifest.outputs['official_module.js'].sha256,
    jsrCheckbox: true, paramsUpdated: true, instantLookAtObserved: true,
    normalMaterial: true
  }
}, null, 2));
