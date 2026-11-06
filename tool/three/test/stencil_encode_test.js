// R1 v8 stencil-lane encode tests: material stencil tail, colorWrite flag
// bit, OPCODE.STENCIL_CLEAR markers, the FRAME_TARGET_FLAGS.clearStencil bit
// and the byte-stability guard proving stenciless scenes encode exactly like
// the pre-v8 bundle (the only delta is the R1 envelope version field).
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const nativeBytes = await readFile(path.join(ROOT, 'assets/three/jsr_three_native.js'), 'utf8');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

const STENCIL_FUNC = { never: 0x200, less: 0x201, equal: 0x202, lessEqual: 0x203, greater: 0x204, notEqual: 0x205, greaterEqual: 0x206, always: 0x207 };
const STENCIL_OP = { zero: 0, keep: 0x1e00, replace: 0x1e01, increment: 0x1e02, decrement: 0x1e03, invert: 0x150a, incrementWrap: 0x8507, decrementWrap: 0x8508 };
const MATERIAL_FLAG_COLOR_WRITE_OFF = 0x400;
const MATERIAL_FLAG_STENCIL = 0x800;
const OPCODE = { GEOMETRY: 1, MATERIAL: 3, NODE: 4, FRAME: 8, STENCIL_CLEAR: 15 };

const buffer = body => Buffer.from(body.buffer, body.byteOffset, body.byteLength);
const u32 = (body, offset) => buffer(body).readUInt32LE(offset);
const f32 = (body, offset) => buffer(body).readFloatLE(offset);
const only = (commands, opcode) => commands.filter(command => command.opcode === opcode);
const id = object => object.id === 0 ? 0xffffffff : object.id;
const near = (a, b, e = 1e-5) => assert.ok(Math.abs(a - b) < e, `${a} != ${b}`);

function decode(packet) {
  const bytes = Buffer.from(packet.buffer, packet.byteOffset, packet.byteLength);
  assert.equal(bytes.subarray(0, 4).toString(), 'JSR3');
  const headerBytes = bytes.readUInt16LE(6);
  const payload = bytes.subarray(headerBytes);
  assert.equal(payload.subarray(0, 4).toString(), 'JSR1');
  assert.equal(payload.readUInt16LE(4), 8, 'R1 envelope version');
  const count = payload.readUInt32LE(8);
  const commands = [];
  let offset = 12;
  for (let i = 0; i < count; i++) {
    const opcode = payload[offset];
    const length = payload.readUInt32LE(offset + 4);
    commands.push({ opcode, body: payload.subarray(offset + 8, offset + 8 + length) });
    offset += 8 + length;
  }
  assert.equal(offset, payload.length, 'trailing R1 bytes');
  return commands;
}

function createHost() {
  const rawPackets = [];
  const jsr = {
    instanceId: 'engine-A',
    hostCallBinary(name, bytes) {
      assert.equal(name, 'three.r1');
      rawPackets.push(Buffer.from(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength)));
    },
    async hostCall(name) { throw new Error(`unexpected host call ${name}`); },
    render() {},
    requestAnimationFrame() { return 0; },
    cancelAnimationFrame() {}
  };
  const context = vm.createContext({ jsr, console, sendMessage() {}, setTimeout, clearTimeout, TextEncoder, TextDecoder, postMessage() {} });
  vm.runInContext(nativeBytes, context, { filename: 'jsr_three_native.js' });
  return { THREE: context.THREE, jsr, rawPackets, frames: () => rawPackets.map(decode) };
}

function triangle(T) {
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
  geometry.setAttribute('normal', new T.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 0, 1], 2));
  return geometry;
}

// The v8 stencil tail is the LAST 32 bytes of the body when bit 11 is set.
function stencilTail(body) {
  const fields = ['stencilWrite', 'stencilFunc', 'stencilRef', 'stencilFuncMask', 'stencilWriteMask', 'stencilFailOp', 'stencilZFailOp', 'stencilZPassOp'];
  const tail = {};
  fields.forEach((name, index) => { tail[name] = u32(body, body.length - 32 + index * 4); });
  return tail;
}

function maskedDigest(rawPacket) {
  const bytes = Buffer.from(rawPacket.buffer, rawPacket.byteOffset, rawPacket.byteLength);
  const masked = Buffer.from(bytes);
  const headerBytes = masked.readUInt16LE(6);
  assert.equal(masked.subarray(headerBytes, headerBytes + 4).toString(), 'JSR1');
  assert.equal(masked.readUInt16LE(headerBytes + 4), 8, 'envelope version bumped to 8');
  masked[headerBytes + 4] = 0;
  masked[headerBytes + 5] = 0;
  return sha(masked);
}

// Golden digests captured from the committed PRE-v8 bundle (native lane,
// commit 3279f30): five deterministic frames over the adapter-test scene
// family. The mask zeroes the R1 payload version field because session 1
// bumps 7 -> 8 by the file's versioning convention; every other byte must
// stay identical, which proves the new fields are conditionally encoded and
// the material ABI (offsets/widths, 304/320/336-byte bodies) is unchanged.
const GOLDEN = [
  '5bf6f7ebc57555ffdd2448dc421f48495260bfee171b8ce13d92549165b26473',
  '1a9be4e685dd83e1fd0838ab0b8b5dba8ca8bdefbf3492191ae98789513b356e',
  'a52850cbe25a6111d5ba204099f5094dbb8d6453feb6326c0535dd1369ad67ab',
  'e2213b0716796629d43e88c202ced266c44ca5106f1191cbd18a8fcd1e30dc5c',
  '84744df07feb0ccb0e102f0d091e592c85a0469240f6e5ceeefab0b88f51209f'
];

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('stenciless scenes stay byte-identical to the pre-v8 bundle (golden digests)', () => {
  const host = createHost();
  const T = host.THREE;
  const canvas = host.jsr.three.createCanvas('main');
  const renderer = new T.WebGLRenderer({ canvas });
  const scene = new T.Scene();
  const basic = new T.MeshBasicMaterial({ color: 0x336699, side: T.DoubleSide, transparent: true, opacity: 0.5, alphaTest: 0.2, depthWrite: false });
  const lambert = new T.MeshLambertMaterial({ color: 0x123456, flatShading: true });
  const standard = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.75 });
  const phong = new T.MeshPhongMaterial({ color: 0xffffff, specular: 0x804020, shininess: 64, flatShading: true, vertexColors: true });
  for (const material of [basic, lambert, standard, phong]) scene.add(new T.Mesh(triangle(T), material));
  scene.add(new T.AmbientLight(0x404040, 0.25));
  const directional = new T.DirectionalLight(0xffffff, 2);
  const point = new T.PointLight(0xff0000, 3);
  point.position.set(1, 2, 3);
  scene.add(directional, point);
  const perspective = new T.PerspectiveCamera(60, 1, 0.1, 10);
  const orthographic = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  renderer.render(scene, perspective);                       // frame 1: scene creation
  phong.specular.setRGB(0.25, 0.5, 0.75); phong.shininess = 12;
  renderer.render(scene, orthographic);                      // frame 2: phong dirty
  directional.position.x = 1;
  renderer.render(scene, orthographic);                      // frame 3: light dirty
  renderer.render(scene, orthographic);                      // frame 4: camera-only
  const instanced = new T.InstancedMesh(triangle(T), new T.MeshStandardMaterial({ color: 0x112233 }), 2);
  instanced.setMatrixAt(0, new T.Matrix4().makeTranslation(1, 0, 0));
  instanced.setMatrixAt(1, new T.Matrix4().makeTranslation(0, 1, 0));
  instanced.instanceMatrix.needsUpdate = true;
  scene.add(instanced);
  renderer.render(scene, perspective);                       // frame 5: instanced batch
  assert.equal(host.rawPackets.length, GOLDEN.length);
  for (const [index, packet] of host.rawPackets.entries()) {
    assert.equal(maskedDigest(packet), GOLDEN[index], `frame ${index + 1} byte drift`);
  }
});

test('stencil materials encode the v8 tail, flags bits and clearStencil markers at upstream positions', () => {
  const host = createHost();
  const T = host.THREE;
  const canvas = host.jsr.three.createCanvas('main');
  const renderer = new T.WebGLRenderer({ canvas });
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(36, 1, 1, 100);
  camera.position.set(4, 2, 6);
  const knotGeometry = new T.TorusKnotGeometry(0.5, 0.15, 32, 8);
  const group = new T.Group();
  const stencilMaterials = [];
  const capMaterials = [];
  for (let i = 0; i < 3; i++) {
    const plane = new T.Plane(new T.Vector3(...[[1, 0, 0], [0, 1, 0], [0, 0, 1]][i]), 0);
    const base = new T.MeshBasicMaterial();
    base.depthWrite = false;
    base.depthTest = false;
    base.colorWrite = false;
    base.stencilWrite = true;
    base.stencilFunc = T.AlwaysStencilFunc;
    const back = base.clone();
    back.side = T.BackSide;
    back.clippingPlanes = [plane];
    back.stencilFail = T.IncrementWrapStencilOp;
    back.stencilZFail = T.IncrementWrapStencilOp;
    back.stencilZPass = T.IncrementWrapStencilOp;
    const front = base.clone();
    front.side = T.FrontSide;
    front.clippingPlanes = [plane];
    front.stencilFail = T.DecrementWrapStencilOp;
    front.stencilZFail = T.DecrementWrapStencilOp;
    front.stencilZPass = T.DecrementWrapStencilOp;
    stencilMaterials.push(back, front);
    group.add(new T.Mesh(knotGeometry, back), new T.Mesh(knotGeometry, front));
    const capMat = new T.MeshBasicMaterial({
      color: 0xE91E63, stencilWrite: true, stencilRef: 0, stencilFunc: T.NotEqualStencilFunc,
      stencilFail: T.ReplaceStencilOp, stencilZFail: T.ReplaceStencilOp, stencilZPass: T.ReplaceStencilOp
    });
    const cap = new T.Mesh(new T.PlaneGeometry(4, 4), capMat);
    cap.onAfterRender = function (rendererInstance) { rendererInstance.clearStencil(); };
    cap.renderOrder = i + 1.1;
    group.add(cap);
    capMaterials.push(capMat);
  }
  const knotMaterial = new T.MeshStandardMaterial({ color: 0xff88c2, metalness: 0.1, roughness: 0.75 });
  const knot = new T.Mesh(knotGeometry, knotMaterial);
  knot.renderOrder = 6;
  group.add(knot);
  scene.add(group);
  renderer.render(scene, camera);
  const commands = host.frames()[0];
  const materials = only(commands, OPCODE.MATERIAL);
  const materialById = new Map(materials.map(entry => [u32(entry.body, 0), entry.body]));
  assert.equal(materialById.size, 10, '6 cloned mask materials + 3 cap materials + 1 knot');
  // Knot: untouched upstream material -> no tail, no new flag bits, v7 length.
  const knotBody = materialById.get(id(knotMaterial));
  assert.equal(knotBody.length, 320);
  assert.equal(u32(knotBody, 16) & (MATERIAL_FLAG_STENCIL | MATERIAL_FLAG_COLOR_WRITE_OFF), 0);
  // Stencil mask materials: colorWrite=false + tail (Always + Inc/DecWrap).
  for (const material of stencilMaterials) {
    const body = materialById.get(id(material));
    assert.equal(body.length, 336, 'basic body 304 + 32-byte v8 stencil tail');
    assert.equal(u32(body, 16) & MATERIAL_FLAG_COLOR_WRITE_OFF, MATERIAL_FLAG_COLOR_WRITE_OFF);
    assert.equal(u32(body, 16) & MATERIAL_FLAG_STENCIL, MATERIAL_FLAG_STENCIL);
    assert.deepEqual(stencilTail(body), {
      stencilWrite: 1, stencilFunc: STENCIL_FUNC.always, stencilRef: 0,
      stencilFuncMask: 255, stencilWriteMask: 255,
      stencilFailOp: material.stencilFail, stencilZFailOp: material.stencilZFail,
      stencilZPassOp: material.stencilZPass
    });
  }
  // Caps: stencil tail with NotEqual + Replace, color stays writable.
  for (const material of capMaterials) {
    const body = materialById.get(id(material));
    assert.equal(body.length, 336);
    assert.equal(u32(body, 16) & MATERIAL_FLAG_COLOR_WRITE_OFF, 0, 'caps keep colorWrite');
    assert.equal(u32(body, 16) & MATERIAL_FLAG_STENCIL, MATERIAL_FLAG_STENCIL);
    assert.deepEqual(stencilTail(body), {
      stencilWrite: 1, stencilFunc: STENCIL_FUNC.notEqual, stencilRef: 0,
      stencilFuncMask: 255, stencilWriteMask: 255,
      stencilFailOp: STENCIL_OP.replace, stencilZFailOp: STENCIL_OP.replace, stencilZPassOp: STENCIL_OP.replace
    });
  }
  // Clear markers: one per cap, bound to the cap node id, value 0, emitted
  // directly after the cap's NODE command (upstream clears in the cap's
  // onAfterRender, right after its draw).
  const clears = only(commands, OPCODE.STENCIL_CLEAR);
  assert.equal(clears.length, 3);
  assert.deepEqual(new Set(clears.map(entry => u32(entry.body, 0))).size, 3, 'three distinct cap nodes');
  const nodeIds = new Set(only(commands, OPCODE.NODE).map(entry => u32(entry.body, 0)));
  for (const [index, clear] of clears.entries()) {
    assert.equal(u32(clear.body, 4), 0, 'clear value 0');
    assert.equal(nodeIds.has(u32(clear.body, 0)), true, 'marker node exists');
    const position = commands.indexOf(clear);
    const previous = commands[position - 1];
    assert.equal(previous.opcode, OPCODE.NODE, 'marker trails a NODE command');
    assert.equal(u32(previous.body, 0), u32(clear.body, 0), 'marker follows its own cap node');
    near(f32(previous.body, 100) % 1, 0.1, 1e-4); // cap renderOrder i+1.1
  }
  // Frame-start stencil clear bit rides the FRAME frame-target flags.
  const frameBody = only(commands, OPCODE.FRAME)[0].body;
  assert.equal(u32(frameBody, frameBody.length - 8) & 16, 16, 'autoClearStencil + stencil activity sets bit 16');
});

test('stencil toggles re-encode materials and drop the tail; culling skips onAfterRender', () => {
  const host = createHost();
  const T = host.THREE;
  const canvas = host.jsr.three.createCanvas('main');
  const renderer = new T.WebGLRenderer({ canvas });
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(50, 1, 0.1, 10);
  camera.position.z = 3;
  const material = new T.MeshBasicMaterial({ color: 0x4488cc, stencilWrite: true, stencilRef: 3, stencilFunc: T.EqualStencilFunc, stencilFuncMask: 0x0f });
  const mesh = new T.Mesh(triangle(T), material);
  let cleared = 0;
  mesh.onAfterRender = function (rendererInstance) { cleared++; rendererInstance.clearStencil(7); };
  scene.add(mesh);
  renderer.render(scene, camera);
  let commands = host.frames()[0];
  let body = only(commands, OPCODE.MATERIAL)[0].body;
  assert.equal(body.length, 336);
  assert.deepEqual(stencilTail(body), {
    stencilWrite: 1, stencilFunc: STENCIL_FUNC.equal, stencilRef: 3,
    stencilFuncMask: 15, stencilWriteMask: 255,
    stencilFailOp: STENCIL_OP.keep, stencilZFailOp: STENCIL_OP.keep, stencilZPassOp: STENCIL_OP.keep
  });
  const clear = only(commands, OPCODE.STENCIL_CLEAR)[0];
  assert.ok(clear, 'onAfterRender marker emitted');
  assert.equal(u32(clear.body, 4), 7, 'non-zero clear value rides the marker');
  assert.equal(cleared, 1);
  // Second frame: signature cache holds (no material re-encode) but the
  // marker re-fires — upstream invokes onAfterRender on EVERY draw, so the
  // clear is re-emitted per frame exactly where upstream would clear.
  renderer.render(scene, camera);
  commands = host.frames()[1];
  assert.equal(only(commands, OPCODE.MATERIAL).length, 0);
  const repeat = only(commands, OPCODE.STENCIL_CLEAR);
  assert.equal(repeat.length, 1, 'onAfterRender markers re-fire on every drawn frame');
  assert.equal(u32(repeat[0].body, 0), u32(clear.body, 0));
  // Resetting every stencil field to upstream defaults drops the tail and
  // the flag bit (dirty update); a lone stencilWrite=false with func=Equal
  // keeps the tail (honest encode: the properties are still set).
  material.stencilWrite = false;
  renderer.render(scene, camera);
  assert.equal(only(host.frames()[2], OPCODE.MATERIAL)[0].body.length, 336,
    'non-default stencilFunc keeps the tail even with stencilWrite=false');
  material.stencilFunc = T.AlwaysStencilFunc;
  material.stencilFuncMask = 255;
  material.stencilRef = 0;
  renderer.render(scene, camera);
  commands = host.frames()[3];
  const updated = only(commands, OPCODE.MATERIAL)[0].body;
  assert.equal(u32(updated, 4), 3, 'material version bump');
  assert.equal(updated.length, 304, 'tail removed');
  assert.equal(u32(updated, 16) & MATERIAL_FLAG_STENCIL, 0);
  // Frustum-culled draw: callback never invoked this frame, like upstream.
  const clearedBefore = cleared;
  mesh.frustumCulled = true;
  mesh.geometry.boundingSphere = new T.Sphere(new T.Vector3(1000, 0, 0), 0.01);
  renderer.render(scene, camera);
  assert.equal(cleared, clearedBefore, 'culled draws skip onAfterRender');
  assert.equal(only(host.frames()[4], OPCODE.STENCIL_CLEAR).length, 0);
});

test('clear(color, depth, stencil) sets the frame-start bit; outside-walk clearStencil routes by value', () => {
  const host = createHost();
  const T = host.THREE;
  const canvas = host.jsr.three.createCanvas('main');
  const renderer = new T.WebGLRenderer({ canvas });
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(50, 1, 0.1, 10);
  camera.position.z = 3;
  scene.add(new T.Mesh(triangle(T), new T.MeshBasicMaterial({ color: 0xffaa00 })));
  const frameFlags = frame => {
    const body = only(frame, OPCODE.FRAME)[0].body;
    return u32(body, body.length - 8);
  };
  renderer.clear(false, false, true);
  renderer.render(scene, camera);
  const stencilFrameFlags = frameFlags(host.frames()[0]);
  assert.equal(stencilFrameFlags & 16, 16, 'explicit stencil clear rides FRAME_TARGET_FLAGS');
  // Frame without stencil intent: bit absent even though autoClearStencil defaults true.
  renderer.render(scene, camera);
  const baselineFlags = frameFlags(host.frames()[1]);
  assert.equal(baselineFlags & 16, 0, 'stenciless frame keeps the flags word byte-stable');
  assert.equal(stencilFrameFlags, baselineFlags | 16, 'only the stencil bit differs');
  // Outside a walk, clearStencil(0) targets the next frame start...
  renderer.clearStencil();
  renderer.render(scene, camera);
  assert.equal(frameFlags(host.frames()[2]) & 16, 16);
  // ...and non-zero values emit a standalone marker envelope (nodeId 0).
  renderer.clearStencil(5);
  const markerCommands = host.frames()[3];
  assert.deepEqual(markerCommands.map(entry => entry.opcode), [OPCODE.STENCIL_CLEAR]);
  assert.equal(u32(markerCommands[0].body, 0), 0, 'immediate marker has no owning node');
  assert.equal(u32(markerCommands[0].body, 4), 5);
  assert.throws(() => renderer.clearStencil(-1), /stencil clear value/);
  assert.throws(() => renderer.clearStencil(1.5), /stencil clear value/);
});

test('materialCommand guards: stencil tail without its flag bit and unknown enums are rejected', async () => {
  const r1 = await import('../src/r1.js');
  const color = { r: 1, g: 1, b: 1 };
  const tail = { stencilWrite: true, stencilFunc: r1.STENCIL_FUNC.always, stencilRef: 0, stencilFuncMask: 255, stencilWriteMask: 255, stencilFailOp: r1.STENCIL_OP.keep, stencilZFailOp: r1.STENCIL_OP.keep, stencilZPassOp: r1.STENCIL_OP.keep };
  assert.throws(() => r1.materialCommand(1, 1, 0, 0, 0, 0, color, 1, 0, 0, 0, 1, null, 0, null, 1, 0, 0, null, null, null, null, tail), /MATERIAL_FLAG_STENCIL/);
  assert.throws(() => r1.materialCommand(1, 1, 0, 0, r1.MATERIAL_FLAG_STENCIL, 0, color, 1, 0, 0, 0, 1, null, 0, null, 1, 0, 0, null, null, null, null, { ...tail, stencilFunc: 1234 }), /stencilFunc/);
  assert.throws(() => r1.materialCommand(1, 1, 0, 0, r1.MATERIAL_FLAG_STENCIL, 0, color, 1, 0, 0, 0, 1, null, 0, null, 1, 0, 0, null, null, null, null, { ...tail, stencilZPassOp: 999 }), /stencilZPass/);
  assert.throws(() => r1.materialCommand(1, 1, 0, 0, r1.MATERIAL_FLAG_STENCIL, 0, color, 1, 0, 0, 0, 1, null, 0, null, 1, 0, 0, null, null, null, null, { ...tail, stencilRef: -1 }), /stencilRef/);
  const clear = r1.stencilClearCommand(9, 2);
  assert.equal(clear.opcode, r1.OPCODE.STENCIL_CLEAR);
  assert.equal(clear.body.length, 8);
  assert.equal(u32(clear.body, 0), 9);
  assert.equal(u32(clear.body, 4), 2);
});

// --- Real module boot: degrade-neutralized copy of the prepared widget ------

function bootWidget(widgetSource, instanceId) {
  const packets = [];
  const renders = [];
  const rafs = new Map();
  const jsr = {
    instanceId,
    _handler: null,
    render(tree) { renders.push(tree); },
    exportState() {},
    onEvent(handler) { this._handler = handler; },
    requestAnimationFrame(callback) { const key = rafs.size + 1; rafs.set(key, callback); return key; },
    cancelAnimationFrame() {},
    hostCallBinary(name, bytes) { assert.equal(name, 'three.r1'); packets.push(Buffer.from(bytes)); },
    hostCall(name) {
      if (name === 'three.canvas2d') return new Promise(() => {});
      if (name === 'three.asset') return null;
      throw new Error(`unexpected host call ${name}`);
    }
  };
  const context = vm.createContext({ jsr, console, performance, sendMessage() {}, TextEncoder, TextDecoder, setTimeout() {}, clearTimeout() {} });
  vm.runInContext(nativeBytes, context, { filename: 'jsr_three_native.js' });
  vm.runInContext('globalThis.THREE = THREE;', context);
  vm.runInContext(widgetSource, context, { filename: 'widget.js' });
  return {
    jsr, renders, packets,
    frame(now = 16) {
      const callbacks = [...rafs.values()];
      rafs.clear();
      for (const callback of callbacks) callback(now);
    }
  };
}

test('webgl_clipping_stencil module boot (unmodified widget): 6 mask tails, 3 caps, 3 markers, stable frame 2', async () => {
  const widgetPath = path.join(ROOT, 'example/widgets/three-clipping-stencil/widget.js');
  const source = await readFile(widgetPath, 'utf8');
  // Session 3 removed the interim degrade for real: the widget must carry no
  // Object3D.add patch hiding the 9 stencil meshes — the boot below runs the
  // prepared widget byte-for-byte and still sees all 11 draws encode.
  assert.ok(!source.includes('stencil lane'), 'interim degrade warn gone from widget.js');
  assert.ok(!/[a-zA-Z$_]+.__jsrStencilInterim/.test(source), 'interim add-patch gone from widget.js');
  const boot = bootWidget(source, 'stencil-encode-test');
  boot.frame(0);
  assert.ok(boot.renders.length >= 1, 'widget presents a render tree');
  const commands = decode(boot.packets[0]);
  const materials = only(commands, OPCODE.MATERIAL);
  const materialById = new Map(materials.map(entry => [u32(entry.body, 0), entry.body]));
  const stencil = [...materialById.values()].filter(body => u32(body, 16) & MATERIAL_FLAG_STENCIL);
  assert.equal(stencil.length, 9, '6 cloned mask materials + 3 cap materials carry the tail');
  const colorWriteOff = stencil.filter(body => u32(body, 16) & MATERIAL_FLAG_COLOR_WRITE_OFF);
  assert.equal(colorWriteOff.length, 6, 'every mask material disables colorWrite');
  assert.equal(colorWriteOff.every(body => body.length === 336), true);
  const ops = stencil.map(body => stencilTail(body).stencilFailOp).sort((a, b) => a - b);
  assert.deepEqual(ops, [STENCIL_OP.replace, STENCIL_OP.replace, STENCIL_OP.replace,
    STENCIL_OP.incrementWrap, STENCIL_OP.incrementWrap, STENCIL_OP.incrementWrap,
    STENCIL_OP.decrementWrap, STENCIL_OP.decrementWrap, STENCIL_OP.decrementWrap],
    '3× IncWrap (back faces) + 3× DecWrap (front faces) masks and 3× Replace caps');
  const clears = only(commands, OPCODE.STENCIL_CLEAR);
  assert.equal(clears.length, 3, 'one clearStencil marker per cap plane');
  assert.deepEqual(new Set(clears.map(entry => u32(entry.body, 0))).size, 3, 'markers bind to the 3 distinct cap nodes');
  for (const clear of clears) assert.equal(u32(clear.body, 4), 0);
  const capNodes = only(commands, OPCODE.NODE)
    .map(entry => entry.body)
    .filter(body => body.length === 104 && (f32(body, 100) % 1) !== 0)
    .sort((a, b) => f32(a, 100) - f32(b, 100));
  assert.equal(capNodes.length, 3, 'cap nodes carry fractional renderOrder 1.1/2.1/3.1');
  for (const [index, body] of capNodes.entries()) near(f32(body, 100), index + 1.1, 1e-4);
  // Knot renders as plain PBR: no tail, no colorWrite bit, full body.
  const knotMaterials = [...materialById.values()].filter(body => u32(body, 8) === 2 && body.length === 320);
  assert.equal(knotMaterials.length, 1, 'one MeshStandardMaterial knot without stencil state');
  assert.equal(u32(knotMaterials[0], 16) & MATERIAL_FLAG_COLOR_WRITE_OFF, 0);
  // Second frame: no material re-encodes (signature cache holds with the new
  // fields) but the three markers re-fire — upstream invokes onAfterRender on
  // every drawn frame, so the clears re-emit at the same positions.
  boot.frame(32);
  const second = decode(boot.packets[1]);
  assert.equal(only(second, OPCODE.MATERIAL).length, 0, 'signature cache holds across frames with the new fields');
  const repeated = only(second, OPCODE.STENCIL_CLEAR);
  assert.equal(repeated.length, 3, 'markers re-fire on every drawn frame');
  assert.deepEqual(repeated.map(entry => u32(entry.body, 0)).sort(), clears.map(entry => u32(entry.body, 0)).sort());
});

for (const { name, fn } of tests) {
  await fn();
  console.log(`ok - ${name}`);
}
console.log(`stencil encode ok: ${tests.length} tests`);
