import assert from 'node:assert/strict';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { drawBatchCommand, removeBatchCommand } from '../src/r1.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const SOURCE = path.resolve(process.env.THREE_SRC || '/tmp/jsr-three-r186');
const result = await build({
  absWorkingDir: ROOT,
  entryPoints: [path.join(ROOT, 'tool/three/src/native_entry.js')],
  outfile: path.join(HERE, '.native-test.js'),
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'THREE',
  platform: 'neutral',
  target: ['es2020'],
  minify: false,
  treeShaking: true,
  define: { __THREE_DEVTOOLS__: 'undefined' },
  plugins: [{
    name: 'pinned-three-source-test',
    setup(build) {
      build.onResolve({ filter: /^three$/ }, args => ({
        path: args.importer.startsWith(path.join(SOURCE, 'examples/'))
          ? path.join(ROOT, 'tool/three/src/native_three_shim.js')
          : path.join(SOURCE, 'src/Three.js')
      }));
      build.onResolve({ filter: /^three\/addons\/(.+)$/ }, args => ({
        path: path.join(SOURCE, 'examples/jsm', args.path.slice('three/addons/'.length))
      }));
    }
  }]
});
const nativeBytes = result.outputFiles[0].text;
const tests = [];
const decoder = new TextDecoder();
const id = object => object.id === 0 ? 0xffffffff : object.id;
const buffer = body => Buffer.from(body.buffer, body.byteOffset, body.byteLength);
const u32 = (body, offset) => buffer(body).readUInt32LE(offset);
const f32 = (body, offset) => buffer(body).readFloatLE(offset);
const only = (packet, opcode) => packet.commands.filter(command => command.opcode === opcode);
const opcodes = packet => packet.commands.map(command => command.opcode);
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-5, `${actual} != ${expected}`);

function decode(packet) {
  const bytes = buffer(packet);
  assert.equal(bytes.subarray(0, 4).toString(), 'JSR3');
  const headerBytes = bytes.readUInt16LE(6);
  const engineLength = bytes.readUInt16LE(16);
  const surfaceLength = bytes.readUInt16LE(18);
  const payload = bytes.subarray(headerBytes);
  assert.equal(payload.subarray(0, 4).toString(), 'JSR1');
  assert.equal(payload.readUInt16LE(4), 1);
  const commands = [];
  let offset = 12;
  for (let i = 0; i < payload.readUInt32LE(8); i++) {
    const opcode = payload[offset];
    const length = payload.readUInt32LE(offset + 4);
    offset += 8;
    commands.push({ opcode, body: payload.subarray(offset, offset + length) });
    offset += length;
  }
  assert.equal(offset, payload.length);
  return {
    engineId: decoder.decode(bytes.subarray(32, 32 + engineLength)),
    surfaceId: decoder.decode(bytes.subarray(32 + engineLength, headerBytes)),
    sequence: bytes.readUInt32LE(8), commands
  };
}

function createHost() {
  const packets = [];
  const jsr = {
    instanceId: 'batch-test',
    hostCallBinary(name, bytes) {
      assert.equal(name, 'three.r1');
      packets.push(Buffer.from(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength)));
    },
    async hostCall(name) { throw new Error(`unexpected host call ${name}`); },
    render() {},
    requestAnimationFrame() { return 1; },
    cancelAnimationFrame() {}
  };
  const context = vm.createContext({ jsr, console, TextEncoder, TextDecoder, sendMessage() {}, setTimeout, clearTimeout });
  vm.runInContext(nativeBytes, context, { filename: 'native-source-test.js' });
  return { THREE: context.THREE, jsr, packets: () => packets.map(decode), rawPackets: packets };
}

function pairGeometry(T) {
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute([
    0, 0, 0, 1, 0, 0, 0, 1, 0,
    2, 0, 0, 3, 0, 0, 2, 1, 0
  ], 3));
  geometry.setIndex([0, 1, 2, 3, 4, 5]);
  return geometry;
}

function triangleGeometry(T) {
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
  return geometry;
}

function groupedPair(T) {
  const geometry = pairGeometry(T);
  geometry.addGroup(0, 3, 0);
  geometry.addGroup(3, 3, 1);
  return geometry;
}

function renderer(host) {
  const T = host.THREE;
  const canvas = host.jsr.three.createCanvas('main');
  const value = new T.WebGLRenderer({ canvas });
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera();
  return { renderer: value, scene, camera, canvas };
}

function test(name, fn) { tests.push({ name, fn }); }
function invalid(fn, contains) {
  assert.throws(fn, error => error && error.message.startsWith('three.invalid:') && (!contains || error.message.includes(contains)));
}
function unsupported(fn, feature) {
  assert.throws(fn, error => error && error.code === 'three.unsupported' && error.feature === feature);
}

test('DRAW_BATCH and REMOVE_BATCH encode exact little-endian bodies and enforce the wire envelope', () => {
  const matrices = new Float32Array(32);
  for (let i = 0; i < matrices.length; i++) matrices[i] = i + 0.25;
  const parts = [{ geometryId: 7, materialId: 9, offset: 6, count: 12 }];
  const instanced = drawBatchCommand(3, 4, 2, 1, parts, matrices);
  assert.equal(instanced.opcode, 11);
  assert.equal(instanced.body.length, 20 + 16 + 2 * 64);
  assert.equal(u32(instanced.body, 0), 3);
  assert.equal(u32(instanced.body, 4), 4);
  assert.equal(u32(instanced.body, 8), 2);
  assert.equal(u32(instanced.body, 12), 1);
  assert.equal(u32(instanced.body, 16), 1);
  assert.equal(u32(instanced.body, 20), 7);
  assert.equal(u32(instanced.body, 24), 9);
  assert.equal(u32(instanced.body, 28), 6);
  assert.equal(u32(instanced.body, 32), 12);
  near(f32(instanced.body, 36), 0.25);
  near(f32(instanced.body, 36 + 31 * 4), 31.25);
  const grouped = drawBatchCommand(3, 5, 1, 0, parts);
  assert.equal(grouped.body.length, 36);
  assert.equal(u32(grouped.body, 12), 0);
  const removed = removeBatchCommand(3);
  assert.equal(removed.opcode, 12);
  assert.equal(removed.body.length, 4);
  assert.equal(u32(removed.body, 0), 3);
  invalid(() => drawBatchCommand(3, 1, 0, 0, parts), 'instanceCount');
  invalid(() => drawBatchCommand(3, 1, 2, 1, parts, new Float32Array(31)), 'payload');
  invalid(() => drawBatchCommand(3, 1, 1, 2, parts), 'flags');
  invalid(() => drawBatchCommand(3, 1, 0xffffffff, 1, [], { length: 0xffffffff * 16 }), '64 MiB');
});

test('single-material InstancedMesh sends real matrices, suppresses unchanged uploads, and handles edits and zero count', () => {
  const host = createHost();
  const T = host.THREE;
  const { renderer, scene, camera } = rendererHost(host);
  const mesh = new T.InstancedMesh(pairGeometry(T), new T.MeshBasicMaterial(), 2);
  mesh.setMatrixAt(0, new T.Matrix4());
  mesh.setMatrixAt(1, new T.Matrix4().makeTranslation(4, 5, 6));
  scene.add(mesh);
  renderer.render(scene, camera);
  let packets = host.packets();
  assert.deepEqual(opcodes(packets[0]), [4, 1, 4, 3, 11, 6, 8]);
  const node = only(packets[0], 4).find(command => u32(command.body, 0) === id(mesh)).body;
  assert.equal(u32(node, 8), 0);
  assert.equal(u32(node, 12), 0);
  assert.equal(u32(node, 20), 1);
  let batch = only(packets[0], 11)[0].body;
  assert.equal(batch.length, 164);
  assert.equal(u32(batch, 0), id(mesh));
  assert.equal(u32(batch, 4), 1);
  assert.equal(u32(batch, 8), 2);
  assert.equal(u32(batch, 12), 1);
  assert.equal(u32(batch, 16), 1);
  assert.equal(u32(batch, 20), id(mesh.geometry));
  assert.equal(u32(batch, 24), id(mesh.material));
  assert.equal(u32(batch, 28), 0);
  assert.equal(u32(batch, 32), 6);
  near(f32(batch, 36), 1);
  near(f32(batch, 148), 4);
  near(f32(batch, 152), 5);
  near(f32(batch, 156), 6);
  assert.equal(renderer.info.render.calls, 1);
  assert.equal(renderer.info.render.triangles, 4);

  renderer.render(scene, camera);
  assert.deepEqual(opcodes(host.packets()[1]), [8]);
  mesh.setMatrixAt(1, new T.Matrix4().makeTranslation(7, 8, 9));
  renderer.render(scene, camera);
  assert.deepEqual(opcodes(host.packets()[2]), [8], 'unversioned matrix edits must not upload');
  mesh.instanceMatrix.needsUpdate = true;
  renderer.render(scene, camera);
  packets = host.packets();
  assert.deepEqual(opcodes(packets[3]), [11, 8]);
  batch = only(packets[3], 11)[0].body;
  assert.equal(u32(batch, 4), 2);
  near(f32(batch, 148), 7);
  mesh.count = 1;
  renderer.render(scene, camera);
  packets = host.packets();
  batch = only(packets[4], 11)[0].body;
  assert.equal(u32(batch, 4), 3);
  assert.equal(batch.length, 100);
  assert.equal(renderer.info.render.calls, 1);
  assert.equal(renderer.info.render.triangles, 2);
  mesh.count = 0;
  renderer.render(scene, camera);
  packets = host.packets();
  assert.deepEqual(opcodes(packets[5]), [11, 8]);
  batch = only(packets[5], 11)[0].body;
  assert.equal(batch.length, 36);
  assert.equal(u32(batch, 8), 0);
  assert.equal(renderer.info.render.calls, 0);
  assert.equal(renderer.info.render.triangles, 0);
});

test('indexed material arrays emit bounded parts, reject malformed edits transactionally, and transition to ordinary nodes', () => {
  const host = createHost();
  const T = host.THREE;
  const { renderer, scene, camera } = rendererHost(host);
  const materials = [new T.MeshBasicMaterial({ color: 0xff0000 }), new T.MeshBasicMaterial({ color: 0x00ff00 })];
  const mesh = new T.Mesh(groupedPair(T), materials);
  scene.add(mesh);
  renderer.render(scene, camera);
  let packets = host.packets();
  let batch = only(packets[0], 11)[0].body;
  assert.equal(batch.length, 52);
  assert.equal(u32(batch, 8), 1);
  assert.equal(u32(batch, 12), 0);
  assert.equal(u32(batch, 16), 2);
  assert.equal(u32(batch, 20), id(mesh.geometry));
  assert.equal(u32(batch, 24), id(materials[0]));
  assert.equal(u32(batch, 28), 0);
  assert.equal(u32(batch, 32), 3);
  assert.equal(u32(batch, 36), id(mesh.geometry));
  assert.equal(u32(batch, 40), id(materials[1]));
  assert.equal(u32(batch, 44), 3);
  assert.equal(u32(batch, 48), 3);
  assert.equal(renderer.info.render.calls, 2);
  assert.equal(renderer.info.render.triangles, 2);
  renderer.render(scene, camera);
  assert.deepEqual(opcodes(host.packets()[1]), [8]);

  mesh.geometry.groups[1].count = 7;
  invalid(() => renderer.render(scene, camera), 'outside geometry bounds');
  mesh.geometry.groups[1].count = 3;
  mesh.geometry.groups[1].materialIndex = 8;
  invalid(() => renderer.render(scene, camera), 'materialIndex');
  mesh.geometry.groups[1].materialIndex = 1;
  mesh.geometry.groups[0].count = 1;
  invalid(() => renderer.render(scene, camera), 'not aligned');
  mesh.geometry.groups[0].count = 3;
  assert.equal(host.rawPackets.length, 2, 'failed part edits emit no packet');

  mesh.geometry.groups[1].materialIndex = 0;
  renderer.render(scene, camera);
  packets = host.packets();
  assert.deepEqual(opcodes(packets[2]), [11, 8]);
  assert.equal(u32(only(packets[2], 11)[0].body, 4), 2);
  mesh.material = materials[0];
  renderer.render(scene, camera);
  packets = host.packets();
  assert.deepEqual(opcodes(packets[3]), [12, 4, 8]);
  const ordinary = only(packets[3], 4)[0].body;
  assert.equal(u32(ordinary, 8), id(mesh.geometry));
  assert.equal(u32(ordinary, 12), id(materials[0]));
  assert.equal(renderer.info.render.calls, 1);
  mesh.geometry.groups[1].materialIndex = 1;
  mesh.material = materials;
  renderer.render(scene, camera);
  packets = host.packets();
  assert.deepEqual(opcodes(packets[4]), [4, 11, 8]);
  assert.equal(u32(only(packets[4], 11)[0].body, 4), 1);
  scene.remove(mesh);
  renderer.render(scene, camera);
  packets = host.packets();
  assert.deepEqual(opcodes(packets[5]), [12, 5, 8]);
  assert.equal(u32(only(packets[5], 12)[0].body, 0), id(mesh));
  assert.equal(renderer._resources.has(mesh), false, 'removed nodes must not stay strongly retained by their dispose listener');
});

test('multi-material BoxGeometry instancing produces six draws without expanding upstream Mesh objects', () => {
  const host = createHost();
  const T = host.THREE;
  const { renderer, scene, camera } = rendererHost(host);
  const materials = Array.from({ length: 6 }, () => new T.MeshBasicMaterial());
  const mesh = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), materials, 3);
  for (let i = 0; i < 3; i++) mesh.setMatrixAt(i, new T.Matrix4().makeTranslation(i * 2, 0, 0));
  scene.add(mesh);
  renderer.render(scene, camera);
  const packet = host.packets()[0];
  const batch = only(packet, 11)[0].body;
  assert.equal(scene.children.length, 1);
  assert.equal(scene.children[0], mesh);
  assert.equal(u32(batch, 8), 3);
  assert.equal(u32(batch, 12), 1);
  assert.equal(u32(batch, 16), 6);
  assert.equal(batch.length, 20 + 6 * 16 + 3 * 64);
  for (let i = 0; i < 6; i++) {
    const offset = 20 + i * 16;
    assert.equal(u32(batch, offset), id(mesh.geometry));
    assert.equal(u32(batch, offset + 4), id(materials[i]));
    assert.equal(u32(batch, offset + 8), i * 6);
    assert.equal(u32(batch, offset + 12), 6);
  }
  assert.equal(renderer.info.render.calls, 6);
  assert.equal(renderer.info.render.triangles, 36);
});

test('non-indexed multi-material support is limited to one whole-geometry part and part count is bounded', () => {
  const host = createHost();
  const T = host.THREE;
  const { renderer, scene, camera } = rendererHost(host);
  const geometry = triangleGeometry(T);
  geometry.addGroup(0, 3, 0);
  const mesh = new T.Mesh(geometry, [new T.MeshBasicMaterial(), new T.MeshBasicMaterial()]);
  scene.add(mesh);
  renderer.render(scene, camera);
  let packet = host.packets()[0];
  const batch = only(packet, 11)[0].body;
  assert.equal(u32(batch, 16), 1);
  assert.equal(u32(batch, 28), 0);
  assert.equal(u32(batch, 32), 3);
  assert.equal(renderer.info.render.calls, 1);
  assert.equal(renderer.info.render.triangles, 1);
  geometry.groups[0].start = 3;
  geometry.groups[0].count = 0;
  unsupported(() => renderer.render(scene, camera), 'nonIndexedGroups');
  geometry.groups[0].start = 0;
  geometry.groups[0].count = 3;
  geometry.addGroup(0, 0, 1);
  unsupported(() => renderer.render(scene, camera), 'nonIndexedGroups');
  geometry.clearGroups();
  unsupported(() => renderer.render(scene, camera), 'multiMaterialGroups');
  geometry.groups = Array.from({ length: 1025 }, () => ({ start: 0, count: 0, materialIndex: 0 }));
  invalid(() => renderer.render(scene, camera), 'partCount exceeds 1024');
  assert.equal(host.rawPackets.length, 1);
});

test('invalid matrices, counts, instanceColor and transparent instancing reject without poisoning batch versions', () => {
  const host = createHost();
  const T = host.THREE;
  const { renderer, scene, camera } = rendererHost(host);
  const mesh = new T.InstancedMesh(pairGeometry(T), new T.MeshBasicMaterial(), 2);
  mesh.setMatrixAt(0, new T.Matrix4());
  mesh.setMatrixAt(1, new T.Matrix4());
  scene.add(mesh);
  renderer.render(scene, camera);
  mesh.instanceMatrix.array[0] = NaN;
  mesh.instanceMatrix.needsUpdate = true;
  invalid(() => renderer.render(scene, camera), 'instanceMatrix');
  assert.equal(host.rawPackets.length, 1);
  mesh.instanceMatrix.array[0] = 1;
  mesh.instanceMatrix.needsUpdate = true;
  renderer.render(scene, camera);
  assert.equal(u32(only(host.packets()[1], 11)[0].body, 4), 2, 'failed render must roll back the next batch version');

  mesh.instanceColor = new T.InstancedBufferAttribute(new Float32Array(6), 3);
  unsupported(() => renderer.render(scene, camera), 'instanceColor');
  mesh.instanceColor = null;
  mesh.material.transparent = true;
  unsupported(() => renderer.render(scene, camera), 'transparentInstancedMesh');
  mesh.material.transparent = false;
  for (const count of [-1, 1.5, 3, 1000001]) {
    mesh.count = count;
    invalid(() => renderer.render(scene, camera), count === 3 ? 'capacity' : 'count');
  }
  mesh.count = 2;
  assert.equal(host.rawPackets.length, 2);
  renderer.render(scene, camera);
  assert.deepEqual(opcodes(host.packets()[2]), [8]);
});

test('node disposal removes and recreates batches with rollback-safe per-surface state', () => {
  const host = createHost();
  const T = host.THREE;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera();
  const mesh = new T.InstancedMesh(pairGeometry(T), new T.MeshBasicMaterial(), 1);
  mesh.setMatrixAt(0, new T.Matrix4());
  scene.add(mesh);
  const rendererA = new T.WebGLRenderer({ canvas: host.jsr.three.createCanvas('a') });
  const rendererB = new T.WebGLRenderer({ canvas: host.jsr.three.createCanvas('b') });
  rendererA.render(scene, camera);
  rendererB.render(scene, camera);
  rendererA.render(scene, camera);
  rendererB.render(scene, camera);
  let packets = host.packets();
  assert.deepEqual(opcodes(packets[2]), [8]);
  assert.deepEqual(opcodes(packets[3]), [8]);
  mesh.dispose();
  assert.equal(rendererA._resources.has(mesh), false, 'surface A must not retain a disposed InstancedMesh or its instanceMatrix');
  assert.equal(rendererB._resources.has(mesh), false, 'surface B must not retain a disposed InstancedMesh or its instanceMatrix');
  rendererA.render(scene, camera);
  rendererB.render(scene, camera);
  packets = host.packets();
  assert.deepEqual(opcodes(packets[4]), [12, 9, 4, 11, 8]);
  assert.deepEqual(opcodes(packets[5]), [12, 9, 4, 11, 8]);
  assert.equal(u32(only(packets[4], 9)[0].body, 4), 4);
  rendererA.dispose();
  packets = host.packets();
  assert.equal(only(packets[6], 12).length, 1);
  assert.equal(opcodes(packets[6]).at(-1), 10);
  rendererB.render(scene, camera);
  assert.deepEqual(opcodes(host.packets()[7]), [8], 'surface A disposal must not affect surface B');
});

test('invisible subtrees defer unsupported wireframe resources until they become visible', () => {
  const host = createHost();
  const T = host.THREE;
  const { renderer, scene, camera } = rendererHost(host);
  const group = new T.Group();
  group.visible = false;
  const material = new T.MeshBasicMaterial({ wireframe: true });
  const mesh = new T.Mesh(triangleGeometry(T), material);
  group.add(mesh);
  scene.add(group);
  renderer.render(scene, camera);
  let packets = host.packets();
  assert.deepEqual(opcodes(packets[0]), [4, 4, 4, 6, 8]);
  assert.equal(only(packets[0], 1).length, 0);
  assert.equal(only(packets[0], 3).length, 0);
  assert.equal(renderer.info.render.calls, 0);
  assert.equal(renderer.info.memory.geometries, 0);
  const hiddenNode = only(packets[0], 4).find(command => u32(command.body, 0) === id(mesh)).body;
  assert.equal(u32(hiddenNode, 8), 0);
  assert.equal(u32(hiddenNode, 12), 0);
  group.visible = true;
  unsupported(() => renderer.render(scene, camera), 'wireframe');
  assert.equal(host.rawPackets.length, 1);
  material.wireframe = false;
  renderer.render(scene, camera);
  packets = host.packets();
  assert.deepEqual(opcodes(packets[1]), [4, 1, 3, 4, 8]);
  assert.equal(renderer.info.render.calls, 1);
  material.wireframe = true;
  unsupported(() => renderer.render(scene, camera), 'wireframe');
  assert.equal(host.rawPackets.length, 2, 'visible wireframe remains an explicit unsupported feature');
});

function rendererHost(host) {
  return renderer(host);
}

let passed = 0;
for (const { name, fn } of tests) {
  try {
    await fn();
    passed++;
    console.log(`ok ${passed} - ${name}`);
  } catch (error) {
    console.error(`not ok ${passed + 1} - ${name}`);
    throw error;
  }
}
console.log(`1..${tests.length}`);
console.log(`# ${passed} deterministic R1 batch tests passed`);
