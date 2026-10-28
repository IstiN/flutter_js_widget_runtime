import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const source = await readFile(path.join(ROOT, 'assets/three/jsr_three_native.js'), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));
const u32 = (body, offset) => body.readUInt32LE(offset);

function packets(bytes) {
  const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const header = buffer.readUInt16LE(6);
  const payload = buffer.subarray(header);
  const count = payload.readUInt32LE(8);
  const commands = [];
  let offset = 12;
  for (let index = 0; index < count; index++) {
    const length = payload.readUInt32LE(offset + 4);
    const opcode = payload[offset];
    offset += 8;
    commands.push({ opcode, body: payload.subarray(offset, offset + length) });
    offset += length;
  }
  assert.equal(offset, payload.length);
  return commands;
}

function harness() {
  const pending = [];
  const calls = [];
  const frames = [];
  const rafs = new Map();
  let nextRaf = 0;
  const jsr = {
    instanceId: 'canvas2d-js-test',
    hostCallBinary(name, bytes) {
      assert.equal(name, 'three.r1');
      frames.push(packets(bytes));
    },
    hostCall(name, args) {
      calls.push({ name, args });
      if (args.action === 'dispose') {
        return Promise.resolve({ ...args, stale: true, data: null });
      }
      return new Promise((resolve, reject) => pending.push({ args, resolve, reject }));
    },
    requestAnimationFrame(callback) {
      const id = ++nextRaf;
      rafs.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id) { rafs.delete(id); },
    render() {},
  };
  const context = vm.createContext({ jsr, console, TextEncoder, TextDecoder, setTimeout, clearTimeout });
  vm.runInContext(source, context, { filename: 'jsr_three_native.js' });
  return {
    THREE: context.THREE, jsr, pending, calls, frames, rafs,
    step() {
      const callbacks = Array.from(rafs.values());
      rafs.clear();
      for (const callback of callbacks) callback(1);
    },
  };
}

function complete(call, rgba) {
  const args = call.args;
  const expected = args.width * args.height * 4;
  assert.equal(rgba.length, expected);
  call.resolve({
    engineId: args.engineId,
    surfaceId: args.surfaceId,
    canvasId: args.canvasId,
    generation: args.generation,
    requestId: args.requestId,
    width: args.width,
    height: args.height,
    stale: false,
    data: Buffer.from(rgba).toString('base64'),
  });
}

function gradientScene(host) {
  const T = host.THREE;
  const surface = host.jsr.three.createCanvas('main');
  const canvas = host.jsr.three.createCanvas2D('main', { width: 8, height: 8 });
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(4, 4, 0, 4, 4, 4);
  gradient.addColorStop(0.1, 'rgba(210,210,210,1)');
  gradient.addColorStop(1, 'rgba(255,255,255,1)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 8, 8);
  const texture = new T.CanvasTexture(canvas);
  const material = new T.MeshBasicMaterial({ map: texture });
  const scene = new T.Scene();
  const mesh = new T.Mesh(new T.PlaneGeometry(2, 2), material);
  scene.add(mesh);
  const camera = new T.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 3;
  const renderer = new T.WebGLRenderer({ canvas: surface });
  return { surface, canvas, context, texture, material, renderer, scene, camera, mesh };
}

const host = harness();
const scene = gradientScene(host);
const initialTextureVersion = scene.texture.version;
scene.renderer.render(scene.scene, scene.camera);
assert.equal(host.frames.length, 1);
assert.equal(host.frames[0].filter(command => command.opcode === 2).length, 0);
assert.equal(u32(host.frames[0].find(command => command.opcode === 3).body, 12), 0);
assert.equal(scene.canvas.ready, false);
await flush();
assert.equal(host.pending.length, 1);
assert.equal(host.pending[0].args.engineId, 'canvas2d-js-test');
assert.equal(host.pending[0].args.surfaceId, 'main#1');
assert.equal(host.pending[0].args.canvasId, '2d-1');
assert.equal(host.pending[0].args.generation, 1);
assert.equal(host.pending[0].args.commands.length, 1);
assert.equal(host.pending[0].args.commands[0].op, 'fillRect');
assert.equal(host.pending[0].args.commands[0].style.kind, 'radial');

const rgba = new Uint8Array(8 * 8 * 4);
for (let index = 0; index < rgba.length; index += 4) {
  rgba[index] = 210;
  rgba[index + 1] = 211;
  rgba[index + 2] = 212;
  rgba[index + 3] = 255;
}
complete(host.pending.shift(), rgba);
await flush();
assert.equal(scene.canvas.ready, true);
assert.ok(scene.texture.version > initialTextureVersion, 'completion increments CanvasTexture.version');
assert.equal(scene.texture.image.width, 8);
assert.equal(scene.texture.image.height, 8);
assert.equal(scene.texture.image.data.length, rgba.length);
assert.notEqual(scene.texture.image.data, scene.canvas._rgba, 'texture owns its pixel copy');
assert.equal(host.frames.length, 2, 'static scene receives one scheduled readiness refresh');
assert.equal(host.rafs.size, 0);
const textured = host.frames[1].find(command => command.opcode === 2);
assert.ok(textured);
assert.equal(u32(textured.body, 4), 1);
assert.equal(u32(textured.body, 8), 8);
assert.equal(u32(textured.body, 12), 8);
assert.equal(u32(textured.body, 16), 0);
assert.deepEqual(textured.body.subarray(28), Buffer.from(rgba));
const texturedId = u32(textured.body, 0);
assert.equal(u32(host.frames[1].find(command => command.opcode === 3).body, 12), texturedId);

scene.renderer.render(scene.scene, scene.camera);
assert.equal(host.frames.length, 3);
assert.equal(host.frames[2].filter(command => command.opcode === 2).length, 0, 'unchanged texture version is not re-uploaded');

scene.context.fillStyle = 'rgba(1,2,3,1)';
scene.context.fillRect(0, 0, 8, 8);
await flush();
assert.equal(host.pending.length, 1);
const updated = new Uint8Array(8 * 8 * 4);
for (let index = 0; index < updated.length; index += 4) updated.set([1, 2, 3, 255], index);
const previousTextureVersion = scene.texture.version;
complete(host.pending.shift(), updated);
await flush();
assert.equal(host.frames.length, 4);
const updatedUpload = host.frames[3].find(command => command.opcode === 2);
assert.equal(u32(updatedUpload.body, 4), 2, 'new canvas content advances the R1 texture version');
assert.deepEqual(updatedUpload.body.subarray(28), Buffer.from(updated));
assert.ok(scene.texture.version > previousTextureVersion);

scene.context.fillRect(0, 0, 8, 8);
await flush();
const stale = host.pending.shift();
scene.canvas.dispose();
complete(stale, updated);
await flush();
assert.equal(scene.canvas.ready, false);
assert.equal(host.rafs.size, 0, 'disposed canvas cannot schedule a stale refresh');
assert.ok(host.calls.some(call => call.args.action === 'dispose' && call.args.canvasId === '2d-1'));
scene.renderer.dispose();

const malformed = harness();
const second = gradientScene(malformed);
let asynchronousError = null;
second.canvas.addEventListener('error', event => { asynchronousError = event.error; });
second.renderer.render(second.scene, second.camera);
await flush();
const wrongIdentity = malformed.pending.shift();
wrongIdentity.resolve({
  ...wrongIdentity.args,
  canvasId: 'another-canvas',
  stale: false,
  data: Buffer.from(new Uint8Array(8 * 8 * 4)).toString('base64'),
});
await flush();
assert.match(asynchronousError.message, /identity or dimensions/);
assert.equal(second.canvas.ready, false);
assert.throws(
  () => second.context.clearRect(0, 0, 1, 1),
  error => error.code === 'three.unsupported' && error.feature === 'canvas2d.clearRect',
);
assert.throws(
  () => second.context.createRadialGradient(0, 0, 1, 2, 2, 3),
  error => error.code === 'three.unsupported' && error.feature === 'canvas2d.radialGradient',
);
second.surface.dispose();
assert.ok(malformed.calls.some(call => call.args.action === 'dispose'), 'surface disposal owns local canvas disposal');
second.renderer.dispose();

console.log(JSON.stringify({
  ok: true,
  firstFrameOmitsOnlyPendingTexture: true,
  readinessRefreshesStaticScene: true,
  textureVersions: [1, 2],
  staleDisposalIgnored: true,
  unsupportedOperationsRemainExplicit: true,
}, null, 2));
