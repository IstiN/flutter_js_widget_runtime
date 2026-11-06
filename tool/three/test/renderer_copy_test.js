// Cluster D focused regression tests: the bounded copyTextureToTexture /
// copyFramebufferToTexture lanes and the degenerate-normal guard.
import assert from 'node:assert/strict';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

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
const bufferOf = body => Buffer.from(body.buffer, body.byteOffset, body.byteLength);
const u32 = (body, offset) => bufferOf(body).readUInt32LE(offset);
const only = (packet, opcode) => packet.commands.filter(command => command.opcode === opcode);
const opcodes = packet => packet.commands.map(command => command.opcode);
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-5, `${actual} != ${expected}`);

function decode(packet) {
  const bytes = bufferOf(packet);
  const headerBytes = bytes.readUInt16LE(6);
  const payload = bytes.subarray(headerBytes);
  assert.equal(payload.subarray(0, 4).toString(), 'JSR1');
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
  return { commands };
}

// Geometry body decoder per r1.js geometryCommand layout.
function geometryAttributes(body) {
  const buffer = bufferOf(body);
  const result = { id: u32(body, 0), mask: u32(body, 8), vertexCount: u32(body, 12), attributes: {} };
  let offset = 28;
  for (const name of ['position', 'normal', 'uv', 'color']) {
    if (!(result.mask & { position: 1, normal: 2, uv: 4, color: 8 }[name])) continue;
    const length = buffer.readUInt32LE(offset);
    offset += 4;
    result.attributes[name] = new Float32Array(
      buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length)
    );
    offset += length;
  }
  return result;
}

function texturePayload(body) {
  const buffer = bufferOf(body);
  const id = u32(body, 0);
  const version = u32(body, 4);
  const width = u32(body, 8);
  const height = u32(body, 12);
  const encoding = u32(body, 16);
  const flags = u32(body, 20);
  // TEXTURE body: id, version, width, height, encoding, flags, length, bytes.
  const dataLength = u32(body, 24);
  const data = buffer.subarray(28, 28 + Math.min(dataLength, 4096));
  return { id, version, width, height, encoding, flags, dataLength, data };
}

function createHost() {
  const packets = [];
  const warnings = [];
  const jsr = {
    instanceId: 'copy-test',
    hostCallBinary(name, bytes) {
      assert.equal(name, 'three.r1');
      packets.push(Buffer.from(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength)));
    },
    async hostCall(name) { throw new Error(`unexpected host call ${name}`); },
    render() {},
    requestAnimationFrame() { return 1; },
    cancelAnimationFrame() {}
  };
  const sandboxConsole = {
    log() {}, error() {},
    warn(...args) { warnings.push(args.join(' ')); }
  };
  const context = vm.createContext({ jsr, console: sandboxConsole, TextEncoder, TextDecoder, sendMessage() {}, setTimeout, clearTimeout });
  vm.runInContext(nativeBytes, context, { filename: 'native-source-test.js' });
  // The bundle checks `data instanceof Uint8Array` inside its own realm, so
  // test fixtures allocate typed arrays through the bundle realm exactly the
  // way the single-realm QuickJS widget runtime does.
  const inRealm = expression => vm.runInContext(expression, context);
  return { THREE: context.THREE, jsr, warnings, inRealm, packets: () => packets.map(decode) };
}

function rendererHost(host) {
  const T = host.THREE;
  const canvas = host.jsr.three.createCanvas('main');
  const value = new T.WebGLRenderer({ canvas });
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera();
  camera.position.z = 4;
  return { renderer: value, scene, camera };
}

function test(name, fn) { tests.push({ name, fn }); }
function invalid(fn, contains) {
  assert.throws(fn, error => error && error.message.startsWith('three.invalid:') && (!contains || error.message.includes(contains)));
}
function unsupported(fn, feature) {
  assert.throws(fn, error => error && error.code === 'three.unsupported' && error.feature === feature);
}

test('copyTextureToTexture lowers a Data3DTexture partial update to CPU bytes plus a full re-upload', () => {
  const host = createHost();
  const T = host.THREE;
  const { renderer, scene, camera } = rendererHost(host);
  const size = 8;
  const destination = new T.Data3DTexture(host.inRealm(`new Uint8Array(${size * size * size})`), size, size, size);
  destination.format = T.RedFormat;
  destination.minFilter = T.LinearFilter;
  destination.magFilter = T.LinearFilter;
  destination.unpackAlignment = 1;
  destination.needsUpdate = true;
  const geometry = new T.PlaneGeometry(1, 1);
  const mesh = new T.Mesh(geometry, new T.MeshBasicMaterial({ map: destination }));
  scene.add(mesh);
  renderer.render(scene, camera);
  const firstTextures = only(host.packets()[0], 2);
  assert.equal(firstTextures.length, 1, 'destination volume uploads once');
  const versionBefore = u32(firstTextures[0].body, 4);

  const sourceSize = 4;
  const source = new T.Data3DTexture(host.inRealm(`new Uint8Array(${sourceSize * sourceSize * sourceSize}).fill(7)`), sourceSize, sourceSize, sourceSize);
  source.format = T.RedFormat;
  renderer.copyTextureToTexture(
    source, destination,
    new T.Box3(new T.Vector3(0, 0, 0), new T.Vector3(3, 3, 3)),
    new T.Vector3(2, 2, 2)
  );
  assert.equal(host.warnings.filter(message => message.includes('copyTextureToTexture')).length, 1,
    'the bounded copy lane warns exactly once');
  for (let z = 0; z < 3; z++) {
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        assert.equal(destination.image.data[(2 + z) * 64 + (2 + y) * 8 + (2 + x)], 7, `copied voxel (${x},${y},${z})`);
      }
    }
  }
  assert.equal(destination.image.data[0], 0, 'voxels outside the region stay untouched');
  assert.ok(destination.version > 0, 'needsUpdate bumps the texture version for the re-upload');

  renderer.render(scene, camera);
  const packets = host.packets();
  const laterTextures = only(packets[packets.length - 1], 2);
  assert.equal(laterTextures.length, 1, 'the changed volume re-uploads');
  assert.ok(u32(laterTextures[0].body, 4) !== versionBefore || packets.length === 1,
    'the re-upload carries a fresh version');
  // Upstream semantics: a null region copies the whole source image.
  const second = new T.Data3DTexture(host.inRealm(`new Uint8Array(${sourceSize * sourceSize * sourceSize * 2})`), 4, 4, 8);
  second.format = T.RedFormat;
  renderer.copyTextureToTexture(source, second);
  assert.equal(second.image.data[sourceSize * sourceSize + 5], 7, 'full-image copy fills slice 0');
  assert.equal(second.image.data[sourceSize * sourceSize * 3 + 5], 7, 'full-image copy crosses slices');
  assert.equal(second.image.data[sourceSize * sourceSize * 4 + 5], 0, 'slices beyond the source stay untouched');
});

test('copyTextureToTexture rejects GPU-side sources, mismatched formats, and out-of-bounds regions', () => {
  const host = createHost();
  const T = host.THREE;
  const { renderer } = rendererHost(host);
  const bytes = new T.Data3DTexture(host.inRealm('new Uint8Array(64).fill(3)'), 4, 4, 4);
  bytes.format = T.RedFormat;
  const floats = new T.DataTexture(host.inRealm('new Float32Array(16)'), 4, 4, T.RedFormat, T.FloatType);
  unsupported(() => renderer.copyTextureToTexture(floats, bytes), 'copyTextureToTexture');
  const otherFormat = new T.DataTexture(host.inRealm('new Uint8Array(64)'), 4, 4, T.RGBAFormat, T.UnsignedByteType);
  unsupported(() => renderer.copyTextureToTexture(otherFormat, bytes), 'copyTextureToTexture');
  invalid(() => renderer.copyTextureToTexture(
    bytes, bytes,
    new T.Box3(new T.Vector3(0, 0, 0), new T.Vector3(5, 5, 5)), new T.Vector3(0, 0, 0)
  ), 'outside');
  invalid(() => renderer.copyTextureToTexture(
    bytes, bytes,
    new T.Box3(new T.Vector3(0, 0, 0), new T.Vector3(2, 2, 2)), new T.Vector3(3, 0, 0)
  ), 'outside');
  invalid(() => renderer.copyTextureToTexture(null, bytes), 'requires source and destination');
});

test('copyTextureToTexture tolerates the r186 Data3DTexture default-format quirk for R8 volumes', () => {
  // r186 Data3DTexture never sets a format, so generated R8 volumes carry the
  // RGBAFormat default exactly as webgl_texture3d_partialupdate produces them.
  const host = createHost();
  const T = host.THREE;
  const { renderer } = rendererHost(host);
  const volume = new T.Data3DTexture(host.inRealm('new Uint8Array(27000).fill(9)'), 30, 30, 30);
  const cloud = new T.Data3DTexture(host.inRealm('new Uint8Array(128 * 128 * 128).fill(0)'), 128, 128, 128);
  cloud.format = T.RedFormat;
  renderer.copyTextureToTexture(
    volume, cloud,
    new T.Box3(new T.Vector3(0, 0, 0), new T.Vector3(29, 29, 29)), new T.Vector3(0, 0, 0)
  );
  const data = cloud.image.data;
  assert.equal(data[0], 9);
  assert.equal(data[28], 9, 'the [0,29) region copy writes through the last texel');
  assert.equal(data[29], 0, 'texels past the region stay untouched');
  assert.equal(data[128], 9, 'region row 1 is copied');
  assert.equal(data[29 * 128], 0, 'row 29 stays untouched');
  assert.equal(data[29 * 128 * 128], 0, 'slice 29 stays untouched');
});

test('copyFramebufferToTexture fabricates the bounded neutral copy and the sprite samples it', () => {
  const host = createHost();
  const T = host.THREE;
  const { renderer, scene, camera } = rendererHost(host);
  const texture = new T.FramebufferTexture(4, 4);
  assert.ok(!texture.image.data, 'upstream FramebufferTexture starts with no CPU data');
  renderer.copyFramebufferToTexture(texture, new T.Vector2(0, 0));
  assert.equal(texture.image.data.length, 64, 'the neutral copy is fabricated');
  assert.equal(texture.image.data.constructor.name, 'Uint8Array', 'realm-safe typed-array check');
  assert.equal(host.warnings.filter(message => message.includes('copyFramebufferToTexture')).length, 1,
    'the neutral-copy degrade warns exactly once');
  const versionAfterCopy = texture.version;

  const sprite = new T.Sprite(new T.SpriteMaterial({ map: texture }));
  sprite.scale.set(1, 1, 1);
  scene.add(sprite);
  renderer.render(scene, camera);
  const packet = host.packets()[0];
  const textures = only(packet, 2);
  assert.equal(textures.length, 1, 'the fabricated copy uploads as a plain 2D texture');
  const payload = texturePayload(textures[0].body);
  assert.equal(payload.dataLength, 64, 'the fabricated RGBA copy uploads byte-exact');
  assert.equal(payload.width, 4);
  assert.equal(payload.height, 4);
  assert.equal(payload.encoding, 0, 'the fabricated copy is linear data');
  assert.ok(payload.data.every(byte => byte === 0), 'neutral copy is transparent black');

  const beforeSecond = texture.version;
  renderer.copyFramebufferToTexture(texture, new T.Vector2(64, 64));
  assert.equal(texture.version, beforeSecond, 'a repeated copy is a bounded no-op');
  assert.equal(host.warnings.filter(message => message.includes('copyFramebufferToTexture')).length, 1);
  assert.ok(versionAfterCopy > 0);

  invalid(() => renderer.copyFramebufferToTexture(new T.Texture()), 'FramebufferTexture');
  unsupported(() => renderer.copyFramebufferToTexture(texture, null, 1), 'textureMipmap');
  invalid(() => renderer.copyFramebufferToTexture(texture, { x: NaN, y: 0 }), 'finite');
});

test('degenerate non-finite normals are bounded to zero while the strict finite contract holds elsewhere', () => {
  const host = createHost();
  const T = host.THREE;
  const { renderer, scene, camera } = rendererHost(host);
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(
    host.inRealm('[0, 0, 0, 1, 0, 0, 0, 1, 0]'), 3));
  geometry.setAttribute('normal', new T.Float32BufferAttribute(
    host.inRealm('[0, 0, 1, NaN, Infinity, NaN, 0, 0, 1]'), 3));
  const mesh = new T.Mesh(geometry, new T.MeshNormalMaterial());
  scene.add(mesh);
  renderer.render(scene, camera);
  const packet = host.packets()[0];
  const geometries = only(packet, 1);
  assert.equal(geometries.length, 1, 'the degenerate frame still uploads geometry');
  const attributes = geometryAttributes(geometries[0].body);
  assert.deepEqual([...attributes.attributes.normal], [0, 0, 1, 0, 0, 0, 0, 0, 1],
    'non-finite normal components become the zero vector');
  assert.deepEqual([...attributes.attributes.position], [0, 0, 0, 1, 0, 0, 0, 1, 0]);
  assert.equal(host.warnings.filter(message => message.includes('zeroes non-finite normal')).length, 1,
    'the degenerate-normal lane warns exactly once');
  renderer.render(scene, camera);
  assert.equal(host.warnings.filter(message => message.includes('zeroes non-finite normal')).length, 1,
    'the warning stays per-attribute across frames');

  // The strict finite contract is unchanged for position and uv. Fixtures
  // allocate through the bundle realm so the fast Float32Array paths run
  // exactly as they do in the single-realm widget runtime.
  const strictHost = createHost();
  const strict = new strictHost.THREE.BufferGeometry();
  strict.setAttribute('position', new strictHost.THREE.Float32BufferAttribute(
    strictHost.inRealm('[0, 0, 0, 1, 0, 0, NaN, 1, 0]'), 3));
  invalid(() => {
    const { renderer: r2, scene: s2, camera: c2 } = rendererHost(strictHost);
    s2.add(new strictHost.THREE.Mesh(strict, new strictHost.THREE.MeshBasicMaterial()));
    r2.render(s2, c2);
  }, 'position attribute must be finite');
  const uvHost = createHost();
  const strictNormals = new uvHost.THREE.BufferGeometry();
  strictNormals.setAttribute('position', new uvHost.THREE.Float32BufferAttribute(
    uvHost.inRealm('[0, 0, 0, 1, 0, 0, 0, 1, 0]'), 3));
  strictNormals.setAttribute('normal', new uvHost.THREE.Float32BufferAttribute(
    uvHost.inRealm('[0, 0, 1, 0, 0, 1, 0, 0, 1]'), 3));
  strictNormals.setAttribute('uv', new uvHost.THREE.Float32BufferAttribute(
    uvHost.inRealm('[Infinity, 0, 1, 0, 0, 1]'), 2));
  invalid(() => {
    const { renderer: r3, scene: s3, camera: c3 } = rendererHost(uvHost);
    s3.add(new uvHost.THREE.Mesh(strictNormals, new uvHost.THREE.MeshNormalMaterial()));
    r3.render(s3, c3);
  }, 'uv attribute must be finite');
});

test('an asset-authored degenerate normal tail (ShadowmappableMesh line primitive shape) survives submission', () => {
  const host = createHost();
  const T = host.THREE;
  const { renderer, scene, camera } = rendererHost(host);
  const vertexCount = 1922;
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.BufferAttribute(
    host.inRealm(`new Float32Array(${vertexCount * 3})`), 3));
  geometry.setAttribute('normal', new T.BufferAttribute(
    host.inRealm(`(() => { const a = new Float32Array(${vertexCount * 3}).fill(1); for (let i = ${vertexCount * 3 - 6}; i < a.length; i++) a[i] = NaN; return a; })()`), 3));
  const lines = new T.LineSegments(geometry, new T.LineBasicMaterial());
  scene.add(lines);
  renderer.render(scene, camera);
  const packet = host.packets()[0];
  assert.ok(only(packet, 1).length >= 1, 'the whole GLB-shaped line primitive submits');
  const attributes = geometryAttributes(only(packet, 1)[0].body);
  const tail = [...attributes.attributes.normal.slice(-6)];
  assert.deepEqual(tail, [0, 0, 0, 0, 0, 0], 'the NaN tail is zeroed in the R1 upload');
  assert.equal(host.warnings.filter(message => message.includes('zeroes non-finite normal')).length, 1);
});

let passed = 0;
for (const { name, fn } of tests) {
  try {
    await fn();
    passed++;
    console.log(`ok ${passed} - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    console.error(error);
    process.exit(1);
  }
}
console.log(`# ${tests.length} deterministic renderer-copy/degenerate-normal tests passed`);
