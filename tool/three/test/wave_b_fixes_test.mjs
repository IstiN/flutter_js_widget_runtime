// Wave B bundle-lane fixes:
//   1. room env gradient — smooth vertical profile (no adjacent-row
//      luminance jump > 0.15), >=128x64, LinearFilter;
//   2. interleaved perf — instanceMatrix NaN/±Inf scan fused into the
//      drawBatchCommand encode pass (identical rejection message, identical
//      bytes for valid input);
//   3. depth-texture viz — MeshDepthMaterial (BasicDepthPacking) encodes as
//      material kind 12; non-Basic packings and wireframe stay loud.
// Built from the pinned r186 source through esbuild (batch_test.js
// precedent), so it exercises the source lane without the asset bundle.
import assert from 'node:assert/strict';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { drawBatchCommand } from '../src/r1.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const SOURCE = path.resolve(process.env.THREE_SRC || '/tmp/jsr-three-r186');
const result = await build({
  absWorkingDir: ROOT,
  entryPoints: [path.join(ROOT, 'tool/three/src/native_entry.js')],
  outfile: path.join(HERE, '.wave-b-fixes-test.js'),
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
const id = object => object.id === 0 ? 0xffffffff : object.id;
const buffer = body => Buffer.from(body.buffer, body.byteOffset, body.byteLength);
const u32 = (body, offset) => buffer(body).readUInt32LE(offset);
const only = (packet, opcode) => packet.commands.filter(command => command.opcode === opcode);
const opcodes = packet => packet.commands.map(command => command.opcode);

function decode(packet) {
  const bytes = buffer(packet);
  assert.equal(bytes.subarray(0, 4).toString(), 'JSR3');
  const headerBytes = bytes.readUInt16LE(6);
  const engineLength = bytes.readUInt16LE(16);
  const surfaceLength = bytes.readUInt16LE(18);
  const payload = bytes.subarray(headerBytes);
  assert.equal(payload.subarray(0, 4).toString(), 'JSR1');
  const envelopeVersion = payload.readUInt16LE(4);
  assert.ok(envelopeVersion >= 3 && envelopeVersion <= 8, `unexpected R1 envelope version ${envelopeVersion}`); // v8 adds the stencil lane
  const count = payload.readUInt32LE(8);
  const commands = [];
  let offset = 12;
  for (let i = 0; i < count; i++) {
    const opcode = payload[offset];
    const length = payload.readUInt32LE(offset + 4);
    offset += 8;
    commands.push({ opcode, body: payload.subarray(offset, offset + length) });
    offset += length;
  }
  assert.equal(offset, payload.length, 'trailing R1 bytes');
  return { commands };
}

function createHost() {
  const packets = [];
  const rafs = new Map();
  const jsr = {
    instanceId: 'engine-A',
    hostCallBinary(name, bytes) {
      assert.equal(name, 'three.r1');
      packets.push(Buffer.from(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength)));
    },
    async hostCall(name, args) { throw new Error(`unexpected host call ${name}`); },
    render() {},
    requestAnimationFrame(callback) { const key = ++rafs.size; rafs.set(key, callback); return key; },
    cancelAnimationFrame(key) { rafs.delete(key); }
  };
  const context = vm.createContext({
    jsr, console, sendMessage() {}, setTimeout, clearTimeout, TextEncoder, TextDecoder,
    postMessage() {}
  });
  vm.runInContext(nativeBytes, context, { filename: 'jsr_three_native.js' });
  return { THREE: context.THREE, jsr, context, packets: () => packets.map(decode), rafs };
}

function fakeWebGL2(canvas) {
  let nextConstant = 1;
  const names = new Map();
  const values = new Map();
  const target = {
    canvas,
    drawingBufferWidth: canvas.width,
    drawingBufferHeight: canvas.height,
    getSupportedExtensions: () => [],
    getExtension: () => null,
    getContextAttributes: () => ({ alpha: true, depth: true, stencil: false, antialias: false }),
    getShaderPrecisionFormat: () => ({ rangeMin: 127, rangeMax: 127, precision: 23 }),
    getParameter: parameter => {
      const name = names.get(parameter) || '';
      if (name === 'VERSION') return 'WebGL 2.0';
      if (name === 'SHADING_LANGUAGE_VERSION') return 'WebGL GLSL ES 3.00';
      if (name === 'SAMPLES') return 0;
      if (name === 'MAX_TEXTURE_SIZE' || name === 'MAX_CUBE_MAP_TEXTURE_SIZE') return 4096;
      if (name === 'MAX_VERTEX_ATTRIBS') return 16;
      if (name === 'MAX_TEXTURE_IMAGE_UNITS' || name === 'MAX_VERTEX_TEXTURE_IMAGE_UNITS') return 16;
      if (name === 'MAX_VERTEX_UNIFORM_VECTORS' || name === 'MAX_FRAGMENT_UNIFORM_VECTORS' || name === 'MAX_VARYING_VECTORS') return 64;
      if (name === 'MAX_SAMPLES') return 4;
      return 0;
    },
    getShaderParameter: () => true,
    getProgramParameter: (program, parameter) => names.get(parameter) === 'ACTIVE_UNIFORMS' || names.get(parameter) === 'ACTIVE_ATTRIBUTES' ? 0 : true,
    getShaderInfoLog: () => '',
    getProgramInfoLog: () => '',
    getError: () => 0,
    isContextLost: () => false,
    checkFramebufferStatus: () => values.get('FRAMEBUFFER_COMPLETE'),
    getAttribLocation: () => -1,
    getUniformLocation: () => null,
    createShader: () => ({}), createProgram: () => ({}), createBuffer: () => ({}),
    createTexture: () => ({}), createFramebuffer: () => ({}), createRenderbuffer: () => ({}),
    createVertexArray: () => ({}), createQuery: () => ({}), createSampler: () => ({}),
    fenceSync: () => ({}), clientWaitSync: () => 0,
    getInternalformatParameter: () => [],
    getUniformBlockIndex: () => 0,
    getActiveUniformBlockParameter: () => 0,
    getActiveUniform: () => null,
    getActiveAttrib: () => null,
    getBufferParameter: () => 0,
    getTexParameter: () => 0,
    getFramebufferAttachmentParameter: () => 0,
    getRenderbufferParameter: () => 0,
    getIndexedParameter: () => 0,
    getUniform: () => 0
  };
  return new Proxy(target, {
    get(object, property) {
      if (property in object) return object[property];
      if (typeof property === 'string' && /^[A-Z][A-Z0-9_]*$/.test(property)) {
        if (!values.has(property)) {
          const value = nextConstant++;
          values.set(property, value);
          names.set(value, property);
        }
        return values.get(property);
      }
      return () => {};
    }
  });
}

function triangle(T) {
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
  geometry.setAttribute('normal', new T.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 0, 1], 2));
  return geometry;
}

// JsrWebGLRenderer routes context creation through the host canvas; give it a
// plausible WebGL2 stub so the constructor succeeds without a GPU.
const stubCanvas = (host, name) => {
  const canvas = host.jsr.three.createCanvas(name);
  canvas.getContext = () => fakeWebGL2(canvas);
  return canvas;
};

function test(name, fn) { tests.push({ name, fn }); }

test('room gradient equirect: >=128x64, LinearFilter, smooth rows (no jump > 0.15), bright ceiling -> dark floor, mean ~0.4', () => {
  const host = createHost();
  const T = host.THREE;
  const warns = [];
  const originalWarn = console.warn;
  console.warn = message => warns.push(String(message));
  let texture;
  try {
    const renderer = new T.WebGLRenderer({ canvas: stubCanvas(host, 'env') });
    const pmrem = new T.PMREMGenerator(renderer);
    ({ texture } = pmrem.fromScene(new T.Scene()));
  } finally {
    console.warn = originalWarn;
  }
  assert.ok(warns.some(w => w.includes('room-gradient equirect') && w.includes('smoothstep')),
    `expected the updated fromScene warn, got: ${warns.join(' | ')}`);
  const image = texture.image;
  assert.ok(image.width >= 128 && image.height >= 64, `gradient is ${image.width}x${image.height}`);
  assert.equal(texture.magFilter, T.LinearFilter);
  assert.equal(texture.minFilter, T.LinearFilter);
  assert.equal(texture.mapping, T.EquirectangularReflectionMapping);
  const data = image.data;
  const rows = [];
  for (let y = 0; y < image.height; y++) {
    let sum = 0;
    for (let x = 0; x < image.width; x++) sum += data[(y * image.width + x) * 4];
    rows.push(sum / image.width / 255);
  }
  for (let y = 1; y < rows.length; y++) {
    const jump = Math.abs(rows[y] - rows[y - 1]);
    assert.ok(jump <= 0.15, `adjacent-row luminance jump ${jump.toFixed(4)} at row ${y} exceeds 0.15`);
  }
  assert.ok(rows[0] > rows[rows.length - 1] * 4, 'layout must stay bright-ceiling -> dark-floor');
  const mean = rows.reduce((a, b) => a + b, 0) / rows.length;
  assert.ok(mean > 0.3 && mean < 0.5, `mean luminance ${mean.toFixed(3)} strays from ~0.4`);
  assert.equal(texture.image.data[3], 255, 'alpha stays opaque');
});

test('instanceMatrix finiteness rides the encode pass: same message, transactional, byte-identical for valid input', () => {
  const identity = new Float32Array(32);
  identity[0] = identity[5] = identity[10] = identity[15] = 1;
  identity[16] = identity[21] = identity[26] = identity[31] = 1;
  // Unit: the fused scan lives inside drawBatchCommand.
  const valid = new Float32Array(32);
  valid.set(identity);
  drawBatchCommand(7, 1, 2, 1, [{ geometryId: 1, materialId: 2, offset: 0, count: 3 }], valid);
  for (const bad of [NaN, Infinity, -Infinity]) {
    const corrupted = new Float32Array(32);
    corrupted.set(identity);
    corrupted[5] = bad;
    assert.throws(
      () => drawBatchCommand(7, 1, 2, 1, [{ geometryId: 1, materialId: 2, offset: 0, count: 3 }], corrupted),
      /three\.invalid: instanceMatrix must be finite/
    );
  }
  // Renderer path: rejection is transactional (no batch/envelope leaves), the
  // message text is preserved, and valid input still encodes byte-identically.
  const host = createHost();
  const T = host.THREE;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera();
  const mesh = new T.InstancedMesh(triangle(T), new T.MeshBasicMaterial(), 2);
  mesh.instanceMatrix.array.set(identity);
  scene.add(mesh);
  const renderer = new T.WebGLRenderer({ canvas: stubCanvas(host, 'a') });
  renderer.render(scene, camera);
  const first = host.packets()[0];
  assert.ok(opcodes(first).includes(11), 'instanced draws emit a DRAW_BATCH');
  const batch = only(first, 11)[0].body;
  const matricesOffset = 20 + 16; // header + one part entry
  assert.deepEqual(
    batch.subarray(matricesOffset, matricesOffset + 128),
    Buffer.from(identity.buffer, 0, 128),
    'valid instance matrices must be copied byte-for-byte'
  );

  mesh.instanceMatrix.array[4] = NaN;
  mesh.instanceMatrix.needsUpdate = true;
  assert.throws(() => renderer.render(scene, camera), /three\.invalid: instanceMatrix must be finite/);
  assert.equal(host.packets().length, 1, 'rejected frame must not emit an envelope');

  mesh.instanceMatrix.array.set(identity);
  mesh.instanceMatrix.needsUpdate = true;
  renderer.render(scene, camera);
  const second = host.packets()[1];
  assert.deepEqual(opcodes(second), [11, 8], 'a valid re-encode re-emits only the batch');
  const secondBatch = only(second, 11)[0].body;
  assert.deepEqual(
    secondBatch.subarray(matricesOffset, matricesOffset + 128),
    batch.subarray(matricesOffset, matricesOffset + 128),
    'encode output for valid input is byte-identical across the fused scan'
  );
});

test('MeshDepthMaterial encodes as material kind 12; RGBA packing, wireframe and MeshDistanceMaterial stay loud', () => {
  const host = createHost();
  const T = host.THREE;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera();
  const mesh = new T.Mesh(triangle(T), new T.MeshDepthMaterial());
  scene.add(mesh);
  const renderer = new T.WebGLRenderer({ canvas: stubCanvas(host, 'd') });
  renderer.render(scene, camera);
  const packets = host.packets();
  assert.ok(opcodes(packets[0]).includes(3), 'first render uploads a material');
  assert.ok(opcodes(packets[0]).includes(11) === false, 'plain meshes draw per node, not as a batch');
  const material = only(packets[0], 3)[0].body;
  assert.equal(u32(material, 8), 12, 'MeshDepthMaterial must encode as kind 12');
  assert.equal(u32(material, 12), 0, 'untextured depth material binds no map');

  const host2 = createHost();
  const T2 = host2.THREE;
  const scene2 = new T2.Scene();
  scene2.add(new T2.Mesh(triangle(T2), new T2.MeshDepthMaterial({ depthPacking: T2.RGBADepthPacking })));
  const renderer2 = new T2.WebGLRenderer({ canvas: stubCanvas(host2, 'b') });
  assert.throws(() => renderer2.render(scene2, new T2.PerspectiveCamera()), error =>
    error.code === 'three.unsupported' && /BasicDepthPacking only/.test(error.message));

  const host3 = createHost();
  const T3 = host3.THREE;
  const scene3 = new T3.Scene();
  scene3.add(new T3.Mesh(triangle(T3), new T3.MeshDepthMaterial({ wireframe: true })));
  const renderer3 = new T3.WebGLRenderer({ canvas: stubCanvas(host3, 'c') });
  assert.throws(() => renderer3.render(scene3, new T3.PerspectiveCamera()), error =>
    error.code === 'three.unsupported' && /wireframe requires a mesh material/.test(error.message));

  const host4 = createHost();
  const T4 = host4.THREE;
  const scene4 = new T4.Scene();
  scene4.add(new T4.Mesh(triangle(T4), new T4.MeshDistanceMaterial()));
  const renderer4 = new T4.WebGLRenderer({ canvas: stubCanvas(host4, 'e') });
  assert.throws(() => renderer4.render(scene4, new T4.PerspectiveCamera()), error =>
    error.code === 'three.unsupported' && /MeshDistanceMaterial/.test(error.message));
});

let passed = 0;
const nameFilter = process.env.WAVE_B_TEST_FILTER || '';
for (const { name, fn } of tests) {
  if (nameFilter && !name.includes(nameFilter)) continue;
  try {
    await fn();
    passed++;
    console.log(`ok ${passed} - ${name}`);
  } catch (error) {
    console.error(`not ok ${passed + 1} - ${name}`);
    throw error;
  }
}
console.log(`1..${passed}`);
console.log(`# ${passed} wave-B bundle-lane tests passed`);
