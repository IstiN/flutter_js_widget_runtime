// Round-4 correctness pins (regression guards for the visual-audit fixes):
//
// 1. instanced-morph relative blend (webgl_instancing_morph): GLTFLoader sets
//    geometry.morphTargetsRelative = true, so the per-instance phase-bucket
//    proxy blend must keep the base position at weight 1 (targets are DELTAS).
//    The historical lane assumed absolute targets (base * (1 - sum)), which
//    collapsed every glTF herd into near-origin slivers. The pin renders an
//    InstancedMesh with a relative morphTexture and asserts the proxy bucket
//    geometry keeps near-base magnitude, while an absolute-target mesh keeps
//    the (1 - sum) contract.
//
// 2. CubeRefractionMapping envMap encoding (webgl_materials_cubemap_refraction):
//    the material command must carry envMapTextureId != 0 and a NEGATIVE
//    envMapIntensity whose magnitude is material.refractionRatio (the Dart
//    decoder accepts [-1, inf) for exactly this contract); a plain
//    CubeReflectionMapping Phong envMap must keep a NONNEGATIVE intensity.
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
  outfile: path.join(HERE, '.native-round4-test.js'),
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
const buffer = body => Buffer.from(body.buffer, body.byteOffset, body.byteLength);
const OPCODE_MATERIAL = 3;

function decode(bytes) {
  const headerBytes = bytes.readUInt16LE(6);
  const payload = bytes.subarray(headerBytes);
  const commands = [];
  let offset = 12;
  for (let i = 0; i < payload.readUInt32LE(8); i++) {
    const opcode = payload[offset];
    const length = payload.readUInt32LE(offset + 4);
    offset += 8;
    commands.push({ opcode, body: payload.subarray(offset, offset + length) });
    offset += length;
  }
  return commands;
}

function createHost() {
  const packets = [];
  const jsr = {
    instanceId: 'round4-test',
    hostCallBinary(name, bytes) {
      assert.equal(name, 'three.r1');
      packets.push(Buffer.from(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength)));
    },
    async hostCall() { throw new Error('unexpected host call'); },
    render() {}, requestAnimationFrame() { return 1; }, cancelAnimationFrame() {}
  };
  const context = vm.createContext({ jsr, console, TextEncoder, TextDecoder, sendMessage() {}, setTimeout, clearTimeout });
  vm.runInContext(nativeBytes, context, { filename: 'native-round4-test.js' });
  return { THREE: context.THREE, packets: () => packets.flatMap(decode) };
}

// --- pin 1: relative morph proxy keeps base magnitude -------------------
{
  const { THREE: T, packets } = createHost();

  function horseScene(relative) {
    const base = new Float32Array([
      0, 0, 0, 1, 0, 0, 0, 1, 0,   // 3 verts, unit scale
    ]);
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(base.slice(), 3));
    // Relative targets are DELTAS (glTF/GLTFLoader shape); absolute targets
    // are full replacement positions.
    const delta = relative ? 0.5 : 2.0;
    geometry.morphAttributes.position = [
      new T.Float32BufferAttribute([delta, 0, 0, delta + 1, 0, 0, delta, 1, 0], 3),
    ];
    geometry.morphTargetsRelative = relative;
    geometry.setIndex([0, 1, 2]);
    return { geometry, base, delta };
  }

  for (const relative of [true, false]) {
    const { THREE: T2, packets: packets2 } = createHost();
    const { geometry, base, delta } = horseScene(relative);
    const scene = new T2.Scene();
    const camera = new T2.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 5;
    const mesh = new T2.InstancedMesh(geometry, new T2.MeshLambertMaterial({ color: 0xffffff }), 4);
    // setMorphAt layout: per instance [baseInfluence, w0..wN]; every instance
    // carries weight 0.5 on the single target.
    mesh.morphTexture = new T2.DataTexture(
      new Float32Array(4 * 2), 2, 4, T2.RedFormat, T2.FloatType);
    const array = mesh.morphTexture.source.data.data;
    for (let i = 0; i < 4; i++) {
      array[i * 2] = relative ? 1 : 0.5;
      array[i * 2 + 1] = 0.5;
    }
    mesh.morphTexture.needsUpdate = true;
    for (let i = 0; i < 4; i++) {
      mesh.setMatrixAt(i, new T2.Matrix4().makeTranslation(i * 0.5, 0, 0));
    }
    scene.add(mesh);
    const renderer = new T2.WebGLRenderer();
    renderer.setSize(64, 64);
    renderer.render(scene, camera);
    await new Promise(resolve => setTimeout(resolve, 20));

    // The proxy blend lives on `mesh.children[*].geometry` — read it through
    // the same objects the walk sees, without packet decoding.
    const proxies = mesh.children.filter(child => child.userData.jsrInstancedMorphProxy);
    assert.ok(proxies.length, 'no instanced-morph proxies created');
    const active = proxies.filter(p => p.count > 0);
    assert.equal(active.length, 1, 'all instances share one phase bucket');
    const out = active[0].geometry.attributes.position.array;
    const target = geometry.morphAttributes.position[0].array;
    const expected = new Float32Array(base.length);
    for (let v = 0; v < base.length; v++) {
      expected[v] = relative
        ? base[v] + 0.5 * target[v]
        : base[v] * 0.5 + target[v] * 0.5;
    }
    let maxError = 0;
    for (let v = 0; v < base.length; v++) {
      maxError = Math.max(maxError, Math.abs(out[v] - expected[v]));
    }
    assert.ok(maxError < 1e-4,
      `${relative ? 'relative' : 'absolute'} morph proxy blend drifted (max err ${maxError})`);
    // A collapsed herd (the pre-fix bug: base*(1-sum) on relative targets)
    // zeroes the base contribution; guard the base term explicitly.
    assert.ok(Math.abs(out[1] - expected[1]) < 1e-4,
      `base position collapsed (out[1]=${out[1]}, expected ${expected[1]})`);
    assert.ok(packets2().length, 'no packets');
  }
  console.log('PIN OK instanced-morph relative blend');
}

// --- pin 2: CubeRefractionMapping sign encoding -------------------------
{
  const { THREE: T, packets } = createHost();
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(50, 1, 1, 1000);
  camera.position.z = 5;

  function cube(mapping) {
    const faces = [];
    for (let i = 0; i < 6; i++) {
      faces.push({ data: new Uint8Array([i * 40, 80, 160, 255]), width: 1, height: 1 });
    }
    const cube = new T.CubeTexture(faces);
    cube.mapping = mapping;
    cube.needsUpdate = true;
    return cube;
  }

  const refraction = new T.Mesh(
    new T.SphereGeometry(1, 8, 8),
    new T.MeshPhongMaterial({ color: 0xffffff, envMap: cube(T.CubeRefractionMapping), refractionRatio: 0.98 })
  );
  refraction.position.x = -2;
  const reflection = new T.Mesh(
    new T.SphereGeometry(1, 8, 8),
    new T.MeshPhongMaterial({ color: 0xffffff, envMap: cube(T.CubeReflectionMapping) })
  );
  reflection.position.x = 2;
  scene.add(refraction, reflection);
  const renderer = new T.WebGLRenderer();
  renderer.setSize(64, 64);
  renderer.render(scene, camera);
  await new Promise(resolve => setTimeout(resolve, 20));

  const mats = packets().filter(c => c.opcode === OPCODE_MATERIAL);
  assert.equal(mats.length, 2, `expected 2 material commands, got ${mats.length}`);
  const encoded = mats.map(m => buffer(m.body).readFloatLE(72)); // v4 tail intensity slot
  encoded.sort((a, b) => a - b);
  assert.ok(encoded[0] < 0, `refraction envMapIntensity must be negative (got ${encoded[0]})`);
  assert.ok(Math.abs(encoded[0] + 0.98) < 1e-4, `refraction ratio not encoded: ${encoded[0]}`);
  assert.ok(encoded[1] > 0, `reflection envMapIntensity must stay nonnegative (got ${encoded[1]})`);
  console.log('PIN OK CubeRefractionMapping sign encoding');
}
console.log('round4_correctness_test: all pins OK');
