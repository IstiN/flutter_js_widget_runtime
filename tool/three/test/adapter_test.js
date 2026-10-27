import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const nativeBytes = await readFile(path.join(ROOT, 'assets/three/jsr_three_native.js'), 'utf8');
const webBytes = await readFile(path.join(ROOT, 'assets/three/jsr_three_web.js'), 'utf8');
const decoder = new TextDecoder();
const tests = [];
const id = object => object.id === 0 ? 0xffffffff : object.id;
const opcodes = packet => packet.commands.map(command => command.opcode);
const only = (packet, opcode) => packet.commands.filter(command => command.opcode === opcode);
const f32 = (body, offset) => body.readFloatLE(offset);
const u32 = (body, offset) => body.readUInt32LE(offset);
const near = (actual, expected, epsilon = 1e-5) => assert.ok(Math.abs(actual - expected) < epsilon, `${actual} != ${expected}`);

function decode(packet) {
  const bytes = Buffer.from(packet.buffer, packet.byteOffset, packet.byteLength);
  assert.equal(bytes.subarray(0, 4).toString(), 'JSR3');
  assert.equal(bytes[4], 1);
  assert.equal(bytes[5], 1);
  const headerBytes = bytes.readUInt16LE(6);
  const engineLength = bytes.readUInt16LE(16);
  const surfaceLength = bytes.readUInt16LE(18);
  assert.equal(headerBytes, 32 + engineLength + surfaceLength);
  assert.equal(bytes.readUInt32LE(20), 0);
  assert.equal(bytes.readUInt32LE(28), 0);
  assert.equal(bytes.readUInt32LE(24), bytes.length);
  const payloadLength = bytes.readUInt32LE(12);
  assert.equal(headerBytes + payloadLength, bytes.length);
  const engineId = decoder.decode(bytes.subarray(32, 32 + engineLength));
  const surfaceId = decoder.decode(bytes.subarray(32 + engineLength, headerBytes));
  const payload = bytes.subarray(headerBytes);
  assert.equal(payload.subarray(0, 4).toString(), 'JSR1');
  assert.equal(payload.readUInt16LE(4), 1);
  assert.equal(payload.readUInt16LE(6), 0);
  const count = payload.readUInt32LE(8);
  const commands = [];
  let offset = 12;
  for (let i = 0; i < count; i++) {
    assert.ok(offset + 8 <= payload.length, 'truncated command header');
    const opcode = payload[offset];
    assert.equal(payload[offset + 1], 0);
    assert.equal(payload.readUInt16LE(offset + 2), 0);
    const length = payload.readUInt32LE(offset + 4);
    offset += 8;
    assert.ok(offset + length <= payload.length, 'truncated command body');
    commands.push({ opcode, body: payload.subarray(offset, offset + length) });
    offset += length;
  }
  assert.equal(offset, payload.length, 'trailing R1 bytes');
  return { engineId, surfaceId, sequence: bytes.readUInt32LE(8), commands };
}

function geometry(body) {
  const result = { id: u32(body, 0), version: u32(body, 4), mask: u32(body, 8), vertexCount: u32(body, 12), indexCount: u32(body, 16), primitive: u32(body, 20), attributes: {}, indices: [] };
  let offset = 28;
  for (const name of ['position', 'normal', 'uv', 'color']) {
    if (!result.mask || !(result.mask & ({ position: 1, normal: 2, uv: 4, color: 8 }[name]))) continue;
    const length = u32(body, offset);
    offset += 4;
    result.attributes[name] = new Float32Array(body.buffer.slice(body.byteOffset + offset, body.byteOffset + offset + length));
    offset += length;
  }
  for (let i = 0; i < result.indexCount; i++, offset += 4) result.indices.push(u32(body, offset));
  assert.equal(offset, body.length);
  return result;
}

function createHost(web = false, options = {}) {
  const packets = [];
  const renders = [];
  const hostCalls = [];
  const structured = [];
  const rafs = new Map();
  let rafId = 0;
  const jsr = {
    instanceId: 'engine-A',
    hostCallBinary(name, bytes) {
      assert.equal(name, 'three.r1');
      packets.push(Buffer.from(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength)));
    },
    async hostCall(name, args) { hostCalls.push({ name, args }); throw new Error(`unexpected host call ${name}`); },
    render(tree) { renders.push(tree); },
    requestAnimationFrame(callback) { const key = ++rafId; rafs.set(key, callback); return key; },
    cancelAnimationFrame(key) { rafs.delete(key); }
  };
  const sandbox = {
    jsr, console, sendMessage() {}, setTimeout, clearTimeout,
    postMessage(message, transfer) { structured.push({ message, transfer: transfer || [] }); }
  };
  if (!options.noTextCodecs) Object.assign(sandbox, { TextEncoder, TextDecoder });
  const context = vm.createContext(sandbox);
  vm.runInContext(web ? webBytes : nativeBytes, context, { filename: web ? 'jsr_three_web.js' : 'jsr_three_native.js' });
  return { THREE: context.THREE, jsr, context, packets: () => packets.map(decode), rawPackets: packets, renders, hostCalls, structured, rafs,
    step(time) { const callbacks = Array.from(rafs.values()); rafs.clear(); for (const callback of callbacks) callback(time); } };
}

function triangle(T) {
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
  geometry.setAttribute('normal', new T.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 0, 1], 2));
  return geometry;
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

function rendererScene(host, material) {
  const T = host.THREE;
  const canvas = host.jsr.three.createCanvas('main');
  const renderer = new T.WebGLRenderer({ canvas });
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(50, 16 / 9, 0.1, 100);
  camera.position.z = 3;
  const mesh = new T.Mesh(triangle(T), material || new T.MeshBasicMaterial({ color: 0xff0000 }));
  scene.add(mesh);
  return { canvas, renderer, scene, camera, mesh };
}

function capability(fn, contains) {
  assert.throws(fn, error => error && error.code === 'three.unsupported' && error.message.includes('1B') && (!contains || error.message.includes(contains)));
}

function test(name, fn) { tests.push({ name, fn }); }

test('upstream revision, math, scene and object identity remain real r186', () => {
  const host = createHost();
  const T = host.THREE;
  assert.equal(T.REVISION, '186');
  const vector = new T.Vector3(1, 2, 3).applyMatrix4(new T.Matrix4().makeTranslation(4, 5, 6));
  assert.deepEqual([vector.x, vector.y, vector.z], [5, 7, 9]);
  const quaternion = new T.Quaternion().setFromEuler(new T.Euler(Math.PI / 2, 0, 0));
  near(new T.Vector3(0, 1, 0).applyQuaternion(quaternion).z, 1);
  const scene = new T.Scene();
  const geometry = triangle(T);
  const material = new T.MeshBasicMaterial();
  const mesh = new T.Mesh(geometry, material);
  scene.add(mesh);
  assert.equal(mesh.geometry, geometry);
  assert.equal(mesh.material, material);
  assert.equal(mesh.parent, scene);
  assert.equal(scene.children[0], mesh);
  assert.ok(ArrayBuffer.isView(geometry.attributes.position.array));
  assert.equal(host.renders.length, 0);
});

test('install wraps jsr.render once and prepares nested three mounts automatically', () => {
  const host = createHost();
  const wrapped = host.jsr.render;
  assert.equal(wrapped.__jsrThreeRenderWrapper, true);
  vm.runInContext(nativeBytes, host.context, { filename: 'jsr_three_native.js' });
  assert.equal(host.jsr.render, wrapped, 'second bundle installation must not double-wrap');
  const tree = { type: 'stack', children: [{ type: 'three', canvasId: 'nested' }] };
  host.jsr.render(tree);
  assert.equal(host.renders.length, 1);
  assert.equal(host.renders[0], tree);
  assert.equal(tree.children[0].engineId, 'engine-A');
  assert.equal(tree.children[0].surfaceId, 'nested#1');
  assert.equal(tree.children[0].generation, 1);
});

test('canonical mount, T1/R1 bytes, resize and dirty/no-reupload diffing', () => {
  const host = createHost();
  const { canvas, renderer, scene, camera, mesh } = rendererScene(host);
  const tree = { type: 'three', canvasId: 'main', width: 640, height: 360 };
  host.jsr.render(tree);
  assert.equal(tree.engineId, 'engine-A');
  assert.equal(tree.surfaceId, 'main#1');
  assert.equal(tree.generation, 1);
  renderer.setPixelRatio(2);
  renderer.setSize(320, 180);
  assert.equal(canvas.width, 640);
  assert.equal(canvas.height, 360);
  assert.equal(canvas.style.width, '320px');
  assert.equal(canvas.clientWidth, 320);
  renderer.setClearColor(0x010203, 0.75);
  renderer.render(scene, camera);
  let packets = host.packets();
  assert.equal(packets.length, 1);
  assert.equal(packets[0].engineId, 'engine-A');
  assert.equal(packets[0].surfaceId, 'main#1');
  assert.equal(packets[0].sequence, 1);
  assert.deepEqual(opcodes(packets[0]), [4, 1, 3, 4, 6, 8]);
  const frame = only(packets[0], 8)[0].body;
  assert.equal(frame.length, 136);
  assert.equal(u32(frame, 0), id(scene));
  assert.equal(u32(frame, 4), id(camera));
  near(f32(frame, 24), 1);
  const nodes = only(packets[0], 4);
  const meshNode = nodes.find(node => u32(node.body, 0) === id(mesh)).body;
  assert.equal(meshNode.length, 92);
  assert.equal(u32(meshNode, 4), id(scene));
  assert.equal(u32(meshNode, 8), id(mesh.geometry));
  assert.equal(u32(meshNode, 12), id(mesh.material));
  renderer.render(scene, camera);
  packets = host.packets();
  assert.deepEqual(opcodes(packets[1]), [8]);
  assert.equal(packets[1].sequence, 2);
  mesh.position.x = 2;
  renderer.render(scene, camera);
  packets = host.packets();
  assert.deepEqual(opcodes(packets[2]), [4, 8]);
  near(f32(only(packets[2], 4)[0].body, 24 + 12 * 4), 2);
  const oldVersion = geometry(only(packets[0], 1)[0].body).version;
  mesh.geometry.attributes.position.setX(0, -1);
  mesh.geometry.attributes.position.needsUpdate = true;
  renderer.render(scene, camera);
  packets = host.packets();
  assert.deepEqual(opcodes(packets[3]), [1, 8]);
  const changedGeometry = geometry(only(packets[3], 1)[0].body);
  assert.equal(changedGeometry.version, oldVersion + 1);
  near(changedGeometry.attributes.position[0], -1);
  mesh.material.color.set(0x00ff00);
  renderer.render(scene, camera);
  packets = host.packets();
  assert.deepEqual(opcodes(packets[4]), [3, 8]);
  scene.remove(mesh);
  renderer.render(scene, camera);
  packets = host.packets();
  assert.deepEqual(opcodes(packets[5]), [5, 8]);
  assert.equal(u32(only(packets[5], 5)[0].body, 0), id(mesh));
  scene.add(mesh);
  renderer.render(scene, camera);
  packets = host.packets();
  assert.deepEqual(opcodes(packets[6]), [4, 8]);
  mesh.geometry.dispose();
  renderer.render(scene, camera);
  packets = host.packets();
  assert.deepEqual(opcodes(packets[7]), [9, 1, 8]);
  assert.equal(u32(only(packets[7], 9)[0].body, 4), 1);
  assert.equal(geometry(only(packets[7], 1)[0].body).version, 1);
  assert.equal(host.renders.length, 1, 'render() must not serialize a scene through jsr.render');
  assert.equal(host.hostCalls.length, 0);
});

test('main-camera frustum culling is explicit and respects opt-out', () => {
  const host = createHost();
  const { renderer, scene, camera, mesh } = rendererScene(host);
  mesh.position.z = 100;
  renderer.render(scene, camera);
  let packet = host.packets()[0];
  let frame = only(packet, 8)[0].body;
  assert.equal(frame.length, 144);
  assert.equal(u32(frame, 136), 1);
  assert.equal(u32(frame, 140), id(mesh));
  assert.equal(renderer.info.render.calls, 0);
  assert.equal(renderer.info.render.triangles, 0);

  mesh.frustumCulled = false;
  renderer.render(scene, camera);
  packet = host.packets()[1];
  frame = only(packet, 8)[0].body;
  assert.equal(frame.length, 136);
  assert.equal(renderer.info.render.calls, 1);
});

test('resource versions and disposal are isolated per surface', () => {
  const host = createHost();
  const T = host.THREE;
  const scene = new T.Scene();
  const mesh = new T.Mesh(triangle(T), new T.MeshBasicMaterial());
  scene.add(mesh);
  const camera = new T.PerspectiveCamera();
  const rendererA = new T.WebGLRenderer({ canvas: host.jsr.three.createCanvas('a') });
  const rendererB = new T.WebGLRenderer({ canvas: host.jsr.three.createCanvas('b') });
  rendererA.render(scene, camera);
  rendererB.render(scene, camera);
  rendererA.render(scene, camera);
  rendererB.render(scene, camera);
  let packets = host.packets();
  assert.equal(packets[0].surfaceId, 'a#1');
  assert.equal(packets[1].surfaceId, 'b#1');
  assert.deepEqual(opcodes(packets[2]), [8]);
  assert.deepEqual(opcodes(packets[3]), [8]);
  rendererA.dispose();
  rendererB.render(scene, camera);
  packets = host.packets();
  assert.deepEqual(opcodes(packets[5]), [8], 'disposing surface A must not dispose B resources');
  assert.equal(rendererB._geometryModes.has(mesh.geometry.id), true);
  mesh.geometry.dispose();
  assert.equal(rendererB._geometryModes.has(mesh.geometry.id), false, 'disposed geometry modes must not accumulate across streamed chunks');
  rendererB.render(scene, camera);
  packets = host.packets();
  assert.deepEqual(opcodes(packets[6]), [9, 1, 8]);
});

test('native execution needs no DOM and supplies UTF-8 codecs when host globals are absent', async () => {
  const host = createHost(false, { noTextCodecs: true });
  const T = host.THREE;
  assert.equal(typeof host.context.TextEncoder, 'function');
  assert.equal(typeof host.context.TextDecoder, 'function');
  assert.equal(new host.context.TextDecoder().decode(new host.context.TextEncoder().encode('Zażółć 😀')), 'Zażółć 😀');
  assert.equal(typeof host.context.document, 'undefined');
  assert.equal(typeof host.context.Image, 'undefined');
  const canvas = host.jsr.three.createCanvas('μ😀');
  const renderer = new T.WebGLRenderer({ canvas });
  renderer.render(new T.Scene(), new T.PerspectiveCamera());
  assert.equal(host.packets()[0].surfaceId, 'μ😀#1');
  const json = JSON.stringify({ text: 'Zażółć 😀' });
  host.jsr.three.registerAsset('unicode.json', { data: Buffer.from(json).toString('base64') });
  assert.equal((await new T.FileLoader().setResponseType('json').loadAsync('unicode.json')).text, 'Zażółć 😀');
});

test('materials, cameras and ambient/directional/point lights have exact bodies and dirty updates', () => {
  const host = createHost();
  const T = host.THREE;
  const canvas = host.jsr.three.createCanvas('main');
  const renderer = new T.WebGLRenderer({ canvas });
  const scene = new T.Scene();
  const basic = new T.MeshBasicMaterial({ color: 0x336699, side: T.DoubleSide, transparent: true, opacity: 0.5, alphaTest: 0.2, depthWrite: false });
  const lambert = new T.MeshLambertMaterial({ color: 0x123456, flatShading: true });
  const standard = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.75 });
  for (const material of [basic, lambert, standard]) scene.add(new T.Mesh(triangle(T), material));
  const ambient = new T.AmbientLight(0x404040, 0.25);
  const directional = new T.DirectionalLight(0xffffff, 2);
  const point = new T.PointLight(0xff0000, 3);
  point.position.set(1, 2, 3);
  scene.add(ambient, directional, point);
  const perspective = new T.PerspectiveCamera(60, 1, 0.1, 10);
  renderer.render(scene, perspective);
  let packet = host.packets()[0];
  const materials = only(packet, 3).map(command => command.body);
  assert.deepEqual(materials.map(body => u32(body, 8)), [0, 1, 2]);
  assert.equal(materials[0].length, 56);
  assert.equal(u32(materials[0], 20), 2);
  near(f32(materials[0], 36), 0.5);
  near(f32(materials[0], 48), 0.2);
  near(f32(materials[2], 40), 0.25);
  near(f32(materials[2], 44), 0.75);
  assert.equal(u32(materials[1], 16) & 2, 2);
  const lights = only(packet, 7).map(command => command.body);
  assert.deepEqual(lights.map(body => u32(body, 4)), [0, 1, 2]);
  assert.equal(lights[0].length, 48);
  near(f32(lights[0], 20), 0.25);
  near(f32(lights[1], 40), 1);
  near(f32(lights[2], 24), 1);
  near(f32(lights[2], 28), 2);
  near(f32(lights[2], 32), 3);
  const orthographic = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  renderer.render(scene, orthographic);
  packet = host.packets()[1];
  assert.deepEqual(opcodes(packet), [6, 8]);
  assert.equal(u32(only(packet, 6)[0].body, 4), 1);
  directional.position.x = 1;
  renderer.render(scene, orthographic);
  packet = host.packets()[2];
  assert.deepEqual(opcodes(packet), [7, 8]);
  assert.equal(u32(only(packet, 7)[0].body, 0), id(directional));
  directional.visible = false;
  renderer.render(scene, orthographic);
  packet = host.packets()[3];
  assert.deepEqual(opcodes(packet), [9, 8]);
  assert.equal(u32(only(packet, 9)[0].body, 4), 5);
});

test('Line, LineSegments and Points preserve primitive semantics and material kinds', () => {
  const host = createHost();
  const T = host.THREE;
  const renderer = new T.WebGLRenderer({ canvas: host.jsr.three.createCanvas('main') });
  const scene = new T.Scene();
  const lineGeometry = new T.BufferGeometry().setFromPoints([new T.Vector3(0, 0, 0), new T.Vector3(1, 0, 0), new T.Vector3(2, 0, 0)]);
  const segmentsGeometry = new T.BufferGeometry().setFromPoints([new T.Vector3(0, 1, 0), new T.Vector3(1, 1, 0)]);
  const pointsGeometry = new T.BufferGeometry().setFromPoints([new T.Vector3(0, 2, 0), new T.Vector3(1, 2, 0)]);
  const line = new T.Line(lineGeometry, new T.LineBasicMaterial());
  const segments = new T.LineSegments(segmentsGeometry, new T.LineBasicMaterial());
  const points = new T.Points(pointsGeometry, new T.PointsMaterial({ size: 3 }));
  scene.add(line, segments, points);
  renderer.render(scene, new T.PerspectiveCamera());
  const packet = host.packets()[0];
  const geometries = new Map(only(packet, 1).map(command => { const value = geometry(command.body); return [value.id, value]; }));
  assert.equal(geometries.get(id(lineGeometry)).primitive, 1);
  assert.deepEqual(geometries.get(id(lineGeometry)).indices, [0, 1, 1, 2]);
  assert.equal(geometries.get(id(segmentsGeometry)).indexCount, 0);
  assert.equal(geometries.get(id(pointsGeometry)).primitive, 2);
  const materials = only(packet, 3).map(command => command.body);
  assert.deepEqual(materials.map(body => u32(body, 8)), [3, 3, 4]);
  near(f32(materials[2], 52), 3);
});

test('upstream animation and raycasting mutate JS objects without scene JSON', () => {
  const host = createHost();
  const T = host.THREE;
  const { renderer, scene, camera, mesh } = rendererScene(host);
  mesh.geometry.dispose();
  mesh.geometry = new T.BoxGeometry(1, 1, 1);
  scene.updateMatrixWorld(true);
  const raycaster = new T.Raycaster(new T.Vector3(0, 0, 3), new T.Vector3(0, 0, -1));
  const hits = raycaster.intersectObject(mesh);
  assert.ok(hits.length > 0);
  assert.equal(hits[0].object, mesh);
  const mixer = new T.AnimationMixer(mesh);
  const clip = new T.AnimationClip('move', 1, [new T.NumberKeyframeTrack('.position[x]', [0, 1], [0, 2])]);
  mixer.clipAction(clip).play();
  mixer.update(0.5);
  near(mesh.position.x, 1);
  renderer.render(scene, camera);
  const node = only(host.packets()[0], 4).find(command => u32(command.body, 0) === id(mesh)).body;
  near(f32(node, 24 + 12 * 4), 1);
  assert.equal(host.renders.length, 0);
  assert.equal(host.hostCalls.length, 0);
});

test('TextureLoader/FileLoader/GLTFLoader use registered bytes and DataTexture uploads raw RGBA8', async () => {
  const host = createHost();
  const T = host.THREE;
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAABCAQAAC1HAwCAAAC0lEQVR42mP8/x8AAusB9Y9ZrX8AAAASUVORK5CYII=';
  host.jsr.three.registerAsset('atlas.png', { data: png, mime: 'image/png', width: 1, height: 1 });
  const texture = await new T.TextureLoader().loadAsync('atlas.png');
  assert.ok(texture.isTexture);
  assert.equal(texture.image.width, 1);
  assert.equal(texture.image.encoding, 1);
  texture.magFilter = T.NearestFilter;
  const { renderer, scene, camera, mesh } = rendererScene(host, new T.MeshBasicMaterial({ map: texture }));
  renderer.render(scene, camera);
  let packet = host.packets()[0];
  let upload = only(packet, 2)[0].body;
  assert.equal(upload.length, 28 + Buffer.from(png, 'base64').length);
  assert.equal(u32(upload, 16), 1);
  assert.equal(u32(upload, 8), 1);
  assert.ok(u32(upload, 20) & 4);
  renderer.render(scene, camera);
  assert.deepEqual(opcodes(host.packets()[1]), [8]);
  texture.needsUpdate = true;
  renderer.render(scene, camera);
  packet = host.packets()[2];
  assert.deepEqual(opcodes(packet), [2, 3, 8]);
  assert.equal(u32(only(packet, 2)[0].body, 4), 2);
  const raw = new T.DataTexture(new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]), 2, 1);
  raw.colorSpace = T.SRGBColorSpace;
  raw.needsUpdate = true;
  mesh.material.map = raw;
  renderer.render(scene, camera);
  packet = host.packets()[3];
  upload = only(packet, 2)[0].body;
  assert.equal(u32(upload, 16), 0);
  assert.equal(u32(upload, 8), 2);
  assert.equal(u32(upload, 12), 1);
  assert.equal(u32(upload, 24), 8);
  assert.deepEqual(Array.from(upload.subarray(28)), [255, 0, 0, 255, 0, 255, 0, 255]);
  raw.image.data[0] = 9;
  renderer.render(scene, camera);
  assert.deepEqual(opcodes(host.packets()[4]), [8], 'unversioned mutation must not upload');
  raw.needsUpdate = true;
  renderer.render(scene, camera);
  assert.equal(only(host.packets()[5], 2)[0].body[28], 9);
  const json = JSON.stringify({ hello: 'world' });
  host.jsr.three.registerAsset('config.json', { data: Buffer.from(json).toString('base64'), mime: 'application/json' });
  assert.equal((await new T.FileLoader().setResponseType('json').loadAsync('config.json')).hello, 'world');
  const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  const bufferUri = `data:application/octet-stream;base64,${Buffer.from(positions.buffer).toString('base64')}`;
  const gltf = { asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }], meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }], buffers: [{ byteLength: 36, uri: bufferUri }], bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }], accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [0, 0, 0], max: [1, 1, 0] }] };
  host.jsr.three.registerAsset('model.gltf', { data: Buffer.from(JSON.stringify(gltf)).toString('base64'), mime: 'model/gltf+json' });
  const loaded = await new T.GLTFLoader().loadAsync('model.gltf');
  let loadedMesh = null;
  loaded.scene.traverse(object => { if (object.isMesh) loadedMesh = object; });
  assert.ok(loadedMesh && loadedMesh.geometry.isBufferGeometry);
  scene.add(loaded.scene);
  renderer.render(scene, camera);
  assert.ok(host.packets().length >= 7);
  assert.equal(host.hostCalls.length, 0);
});

test('missing asset rejection uses three.assetFailure without renaming the host channel', async () => {
  const host = createHost();
  await assert.rejects(host.jsr.three.loadAsset('missing.png'), error => error && error.code === 'three.assetFailure' && error.message.includes('missing.png'));
  assert.equal(host.hostCalls.length, 1);
  assert.equal(host.hostCalls[0].name, 'three.asset');
  assert.equal(host.hostCalls[0].args.url, 'missing.png');
  assert.throws(() => host.jsr.three.registerAsset('bad', { data: '!' }), error => error && error.code === 'three.assetFailure');
});

test('surface disposal rejects in-flight texture loads before bytes enter a new generation', async () => {
  const host = createHost();
  const T = host.THREE;
  const { renderer } = rendererScene(host);
  let complete;
  host.jsr.hostCall = () => new Promise(resolve => { complete = resolve; });
  const pending = new T.TextureLoader().loadAsync('slow.png');
  renderer.dispose();
  complete({ data: 'iVBORw0KGgo=', mime: 'image/png' });
  await assert.rejects(pending, error => error && error.code === 'three.assetFailure' && error.message.includes('disposed'));
  assert.equal(host.jsr.three.resolveAsset('slow.png'), null);
  const replacement = host.jsr.three.createCanvas('main');
  assert.equal(replacement.generation, 2);
  assert.equal(host.jsr.three.resolveAsset('slow.png'), null);
});

test('global key events reach document and active canvas with shared cancelable state', () => {
  const host = createHost();
  const canvas = host.jsr.three.createCanvas('keyboard');
  const document = canvas.ownerDocument;
  let active = false;
  Object.defineProperty(document, 'hasFocus', { value: () => active });
  let canvasEvent;
  canvas.addEventListener('keydown', event => { canvasEvent = event; });
  const types = [];
  document.addEventListener('keydown', event => {
    types.push(event.type);
    event.preventDefault();
  });
  canvas.focus();
  host.jsr.three._hostEvent('key', { key: 'a', code: 'KeyA', down: true, repeat: false });
  assert.deepEqual(types, ['keydown']);
  assert.equal(canvasEvent.type, 'keydown');
  assert.equal(canvasEvent.code, 'KeyA');
  assert.equal(canvasEvent.defaultPrevented, true);
  canvas.focus();
  document.activeElement = null;
  active = true;
  canvasEvent = null;
  host.jsr.three._hostEvent('key', { key: 'a', code: 'KeyA', down: false, repeat: false });
  assert.equal(canvasEvent, null, 'document-only focus must not duplicate events on canvas');
  active = false;
  canvas.focus();
  let blurred = 0;
  canvas.addEventListener('blur', () => blurred++);
  host.jsr.three._hostEvent('blur', {});
  assert.equal(blurred, 1);
});

test('capability failures are loud, transactional and name 1B', () => {
  const host = createHost();
  const T = host.THREE;
  const canvas = host.jsr.three.createCanvas('main');
  const renderer = new T.WebGLRenderer({ canvas });
  assert.equal(renderer.capabilities.rawWebGL, false);
  capability(() => renderer.getContext(), 'rawWebGL');
  capability(() => new T.WebGLRenderer({ context: {} }), 'rawWebGL');
  assert.throws(() => new T.WebGPURenderer(), error => error && error.code === 'three.unsupported' && error.message.includes('WebGPU'));
  capability(() => canvas.getContext('webgl2'), 'rawWebGL');
  capability(() => renderer.setRenderTarget({}), 'renderTarget');
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera();
  scene.add(new T.Mesh(triangle(T), new T.ShaderMaterial()));
  capability(() => renderer.render(scene, camera), 'material');
  assert.equal(host.rawPackets.length, 0);
  scene.children[0].material = new T.MeshBasicMaterial();
  renderer.render(scene, camera);
  assert.equal(host.rawPackets.length, 1, 'failed render must not poison sent caches');
  renderer.toneMapping = T.ACESFilmicToneMapping;
  capability(() => renderer.render(scene, camera), 'toneMapping');
  assert.equal(host.rawPackets.length, 1);
});

test('dispose is idempotent, cancels RAF, releases resources/surface and advances generation', () => {
  const host = createHost();
  const { canvas, renderer, scene, camera } = rendererScene(host);
  renderer.render(scene, camera);
  renderer.setAnimationLoop(() => {});
  assert.equal(host.rafs.size, 1);
  renderer.dispose();
  assert.equal(host.rafs.size, 0);
  assert.equal(canvas.disposed, true);
  const packets = host.packets();
  const disposal = packets[1];
  assert.equal(opcodes(disposal).at(-1), 10);
  const kinds = only(disposal, 9).map(command => u32(command.body, 4));
  assert.ok(kinds.includes(1) && kinds.includes(3) && kinds.includes(4) && kinds.includes(6));
  assert.equal(disposal.sequence, 2);
  const count = host.rawPackets.length;
  renderer.dispose();
  assert.equal(host.rawPackets.length, count);
  const replacement = host.jsr.three.createCanvas('main');
  assert.equal(replacement.generation, 2);
  assert.equal(replacement.surfaceId, 'main#2');
});

test('host key/pointer/blur/visibility events release held input through real events', () => {
  const host = createHost();
  const canvas = host.jsr.three.createCanvas('main');
  const events = [];
  for (const type of ['keydown', 'keyup']) canvas.ownerDocument.addEventListener(type, event => events.push(`${type}:${event.code}`));
  for (const type of ['pointerdown', 'pointercancel', 'pointerup', 'lostpointercapture', 'blur']) canvas.addEventListener(type, event => events.push(type));
  for (const type of ['pointermove', 'pointercancel', 'pointerup']) canvas.ownerDocument.addEventListener(type, event => events.push(`document:${type}`));
  host.jsr.three._hostEvent('key', { key: 'w', code: 'KeyW', down: true, repeat: false });
  host.jsr.three._hostEvent('input:main', { type: 'pointerdown', pointerId: 7, pointerType: 'touch', button: 0, pageX: 4, pageY: 5 });
  canvas.setPointerCapture(7);
  host.jsr.three._hostEvent('input:main', { type: 'pointermove', pointerId: 7, pointerType: 'touch', pageX: 8, pageY: 9 });
  host.jsr.three._hostEvent('input:main', { type: 'blur' });
  assert.ok(events.includes('keydown:KeyW'));
  assert.ok(events.includes('keyup:KeyW'));
  assert.ok(events.includes('pointercancel'));
  assert.ok(events.includes('pointerup'));
  assert.ok(events.includes('document:pointermove'));
  assert.ok(events.includes('document:pointercancel'));
  assert.ok(events.includes('document:pointerup'));
  assert.ok(events.includes('lostpointercapture'));
  assert.ok(events.includes('blur'));
  host.jsr.three._hostEvent('key', { key: 'a', code: 'KeyA', down: true });
  host.jsr.three._hostEvent('input:main', { type: 'visibilitychange', hidden: true });
  assert.equal(canvas.ownerDocument.hidden, true);
  assert.equal(events.filter(value => value === 'keyup:KeyA').length, 1);
  host.jsr.three._hostEvent('key', { key: 'Shift', code: 'ShiftLeft', down: true });
  host.jsr.three._hostEvent('blur', {});
  assert.equal(events.filter(value => value === 'keyup:ShiftLeft').length, 1);
  host.jsr.three._hostEvent('viewport', { width: 800, height: 450 });
  assert.equal(canvas.ownerDocument.defaultView.innerWidth, 800);
  assert.equal(canvas.ownerDocument.defaultView.innerHeight, 450);
});

test('web renderer composes r186 own render and presents the default framebuffer', () => {
  let bitmapId = 0;
  class FakeCanvas {
    constructor(width, height) { this.width = width; this.height = height; this.style = {}; }
    addEventListener() {}
    removeEventListener() {}
    getContext() { return this.gl || (this.gl = fakeWebGL2(this)); }
    transferToImageBitmap() { return { id: ++bitmapId, close() {} }; }
  }
  const host = createHost(true);
  host.context.OffscreenCanvas = FakeCanvas;
  const T = host.THREE;
  assert.throws(() => new T.WebGPURenderer(), error => error && error.code === 'three.unsupported');
  const canvas = host.jsr.three.createCanvas('render');
  const renderer = new T.WebGLRenderer({ canvas });
  assert.notEqual(renderer.render, T.WebGLRenderer.prototype.render);
  renderer.render(new T.Scene(), new T.PerspectiveCamera());
  assert.equal(host.structured.length, 1, 'render must present without a manual canvas.present');
  assert.equal(host.structured[0].message.type, 'jsr.three.frame');
  assert.equal(host.structured[0].message.width, canvas.width);
  assert.equal(host.structured[0].message.height, canvas.height);
  renderer.dispose();
  assert.equal(host.structured.at(-1).message.type, 'jsr.three.release');
});

test('web export retains upstream renderer and frame lane coalesces/acks/releases ImageBitmaps', () => {
  let bitmapId = 0;
  class FakeOffscreenCanvas {
    constructor(width, height) { this.width = width; this.height = height; this.style = {}; }
    addEventListener() {}
    removeEventListener() {}
    transferToImageBitmap() { return { id: ++bitmapId, closed: false, close() { this.closed = true; } }; }
  }
  const host = createHost(true);
  host.context.OffscreenCanvas = FakeOffscreenCanvas;
  const T = host.THREE;
  assert.equal(host.context.__JSR_THREE_WEB__, true);
  assert.ok(T.WebGLRenderer.prototype instanceof T.OriginalWebGLRenderer);
  const canvas = host.jsr.three.createCanvas('main');
  canvas.present();
  canvas.present();
  canvas.present();
  assert.equal(host.structured.length, 2, 'third frame waits behind two unacked frames');
  assert.deepEqual(host.structured.map(item => item.message.type), ['jsr.three.frame', 'jsr.three.frame']);
  const first = host.structured[0];
  assert.equal(first.message.engineId, 'engine-A');
  assert.equal(first.message.surfaceId, 'main#1');
  assert.equal(first.message.canvasId, 'main');
  assert.equal(first.message.generation, 1);
  assert.equal(first.message.frameId, 1);
  assert.equal(first.message.width, canvas.width);
  assert.equal(first.message.height, canvas.height);
  assert.equal(first.transfer[0], first.message.bitmap);
  host.jsr.three._frameControl({ type: 'jsr.three.frameAck', engineId: 'engine-A', surfaceId: 'main#1', canvasId: 'main', generation: 1, frameId: 1, accepted: true });
  assert.equal(host.structured.length, 3);
  assert.equal(host.structured[2].message.frameId, 3);
  host.jsr.three._hostEvent('release', { type: 'jsr.three.release', engineId: 'engine-A', surfaceId: 'main#1', canvasId: 'main', generation: 1 });
  canvas.present();
  assert.equal(host.structured.length, 3);
  host.jsr.three._prepareTree({ type: 'three', canvasId: 'main' });
  canvas.present();
  assert.equal(host.structured.length, 4);
  canvas.dispose();
  assert.equal(host.structured.at(-1).message.type, 'jsr.three.release');
});

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
console.log(`# ${passed} deterministic adapter tests passed`);
