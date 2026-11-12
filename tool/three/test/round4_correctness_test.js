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
  return { THREE: context.THREE, context, packets: () => packets.flatMap(decode) };
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
    new T.MeshPhongMaterial({ color: 0xffffff, envMap: cube(T.CubeRefractionMapping), refractionRatio: 0.91 })
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
  assert.ok(Math.abs(encoded[0] + 0.91) < 1e-4, `material refractionRatio not encoded: ${encoded[0]}`);
  assert.ok(encoded[1] > 0, `reflection envMapIntensity must stay nonnegative (got ${encoded[1]})`);
  console.log('PIN OK CubeRefractionMapping sign encoding');
}
// --- pin 3: flat integer texture indices become grouped textured draws ---
{
  const { THREE: T, context, packets } = createHost();
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute([
    0, 0, 0, 1, 0, 0, 0, 1, 0,
    2, 0, 0, 3, 0, 0, 2, 1, 0,
    4, 0, 0, 5, 0, 0, 4, 1, 0,
  ], 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute([
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
  ], 2));
  // Deliberately non-contiguous: grouping must reorder triangle indices.
  geometry.setAttribute('textureIndex', new T.Int16BufferAttribute([
    2, 2, 2, 0, 0, 0, 1, 1, 1,
  ], 1));
  geometry.attributes.textureIndex.gpuType = T.IntType;
  const textures = [0, 1, 2].map(i => {
    const data = vm.runInContext(`new Uint8Array([${i * 70}, 20, 40, 255])`, context);
    const texture = new T.Texture({ data, width: 1, height: 1 });
    texture.needsUpdate = true;
    return texture;
  });
  const material = new T.ShaderMaterial({
    uniforms: { uTextures: { value: textures } },
    vertexShader: 'in int textureIndex; flat out int vIndex; void main(){vIndex=textureIndex;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'flat in int vIndex; uniform sampler2D uTextures[3]; void main(){gl_FragColor=texture(uTextures[vIndex],vUv);}',
  });
  const scene = new T.Scene();
  const mesh = new T.Mesh(geometry, material);
  scene.add(mesh);
  const camera = new T.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 5;
  const renderer = new T.WebGLRenderer();
  renderer.setSize(64, 64);
  renderer.render(scene, camera);
  await new Promise(resolve => setTimeout(resolve, 20));
  const commands = packets();
  const batches = commands.filter(c => c.opcode === 11);
  assert.equal(batches.length, 1, 'integer-index shader did not enter the grouped draw lane');
  const body = buffer(batches[0].body);
  assert.equal(body.readUInt32LE(16), 3, 'one part per texture');
  const materialIds = [0, 1, 2].map(part => body.readUInt32LE(24 + part * 16));
  const materials = commands.filter(c => c.opcode === OPCODE_MATERIAL);
  assert.equal(materials.length, 3);
  for (let i = 0; i < 3; i++) {
    const command = materials.find(c => buffer(c.body).readUInt32LE(0) === materialIds[i]);
    assert.ok(command, `missing grouped material ${i}`);
    const textureId = textures[i].id === 0 ? 0xffffffff : textures[i].id;
    assert.equal(buffer(command.body).readUInt32LE(12), textureId,
      `group ${i} must sample uTextures[${i}]`);
    assert.equal(body.readUInt32LE(32 + i * 16), 3, `group ${i} triangle count`);
  }
  console.log('PIN OK integer texture-index grouped materials');
}
// --- pin 4: literal grid-shader RGB survives bounded lowering ------------
{
  const { THREE: T, packets } = createHost();
  const material = new T.ShaderMaterial({
    vertexShader: 'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `void main() {
      if (mod(gl_FragCoord.x, 4.0001) < 1.0 || mod(gl_FragCoord.y, 4.0001) < 1.0)
        gl_FragColor = vec4(0.125, 0.5, 0.75, 1.0);
      else gl_FragColor = vec4(1.0);
    }`,
  });
  const scene = new T.Scene();
  scene.add(new T.Mesh(new T.SphereGeometry(1, 4, 4), material));
  const camera = new T.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 5;
  const renderer = new T.WebGLRenderer();
  renderer.setSize(64, 64);
  renderer.render(scene, camera);
  await new Promise(resolve => setTimeout(resolve, 20));
  const command = packets().find(c => c.opcode === OPCODE_MATERIAL);
  assert.ok(command, 'literal-color shader did not lower');
  const body = buffer(command.body);
  assert.ok(Math.abs(body.readFloatLE(24) - 0.125) < 1e-6);
  assert.ok(Math.abs(body.readFloatLE(28) - 0.5) < 1e-6);
  assert.ok(Math.abs(body.readFloatLE(32) - 0.75) < 1e-6);
  console.log('PIN OK literal grid shader color');
}
// --- pin 5: partial cube-loader faces stay unready, never a fatal capability ---
{
  const { THREE: T, context, packets } = createHost();
  const cube = new T.CubeTexture([]);
  cube.mapping = T.CubeReflectionMapping;
  const scene = new T.Scene();
  scene.add(new T.Mesh(new T.SphereGeometry(1, 4, 4),
    new T.MeshBasicMaterial({ envMap: cube })));
  const camera = new T.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 5;
  const renderer = new T.WebGLRenderer();
  renderer.setSize(64, 64);
  assert.doesNotThrow(() => renderer.render(scene, camera),
    'a partially populated CubeTextureLoader image array is a readiness state');
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(packets().filter(c => c.opcode === 2).length, 0,
    'incomplete cube must not upload');
  cube.image = Array.from({ length: 6 }, () => ({
    data: vm.runInContext('new Uint8Array([20, 40, 60, 255])', context),
    width: 1, height: 1,
  }));
  cube.needsUpdate = true;
  renderer.render(scene, camera);
  await new Promise(resolve => setTimeout(resolve, 10));
  const upload = packets().filter(c => c.opcode === 2).at(-1);
  assert.ok(upload, 'completed six-face cube uploads');
  assert.equal(buffer(upload.body).readUInt32LE(8), 1);
  assert.equal(buffer(upload.body).readUInt32LE(12), 1);
  console.log('PIN OK cube async readiness');
}
// --- pin 6: scissored views carry a raw-color far-depth clear rectangle ---
{
  const { THREE: T, packets } = createHost();
  const scene = new T.Scene();
  scene.add(new T.Mesh(new T.SphereGeometry(1, 4, 4),
    new T.MeshBasicMaterial({ color: 0xffffff })));
  const camera = new T.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 5;
  const renderer = new T.WebGLRenderer();
  renderer.setSize(64, 64);
  renderer.setScissorTest(true);
  renderer.setScissor(0, 0, 32, 64);
  renderer.setViewport(0, 0, 32, 64);
  renderer.setClearColor(0x336699, 0.75);
  renderer.render(scene, camera);
  await new Promise(resolve => setTimeout(resolve, 10));
  const clear = packets().filter(c => c.opcode === OPCODE_MATERIAL)
    .map(c => buffer(c.body)).find(body => body.readUInt32LE(8) === 13);
  assert.ok(clear, 'missing kind-13 scissored clear material');
  const expected = new T.Color(0x336699);
  assert.ok(Math.abs(clear.readFloatLE(24) - expected.r) < 1e-6);
  assert.ok(Math.abs(clear.readFloatLE(28) - expected.g) < 1e-6);
  assert.ok(Math.abs(clear.readFloatLE(32) - expected.b) < 1e-6);
  assert.ok(Math.abs(clear.readFloatLE(36) - 0.75) < 1e-6);
  const flags = clear.readUInt32LE(16);
  assert.equal(flags & 0x08, 0, 'clear rectangle uses compareAlways');
  assert.ok(flags & 0x10, 'clear rectangle writes far depth');
  const positions = renderer._scissoredClearMesh.geometry.attributes.position;
  const expectedNdc = [[-1, -1], [3, -1], [-1, 3]];
  for (let i = 0; i < 3; i++) {
    const projected = new T.Vector4(
      positions.getX(i), positions.getY(i), positions.getZ(i), 1,
    ).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);
    assert.ok(Math.abs(projected.x / projected.w - expectedNdc[i][0]) < 1e-4,
      'clear rectangle must perspective-divide the inverse-projected corner');
    assert.ok(Math.abs(projected.y / projected.w - expectedNdc[i][1]) < 1e-4);
    assert.ok(Math.abs(projected.z / projected.w - 1) < 1e-4);
  }
  console.log('PIN OK scissored clear color/depth rectangle and homogeneous corners');
}
// --- pin 7: discrete custom point sizes survive as grouped point draws ---
{
  const { THREE: T, packets } = createHost();
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute([
    0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0,
  ], 3));
  geometry.setAttribute('ca', new T.Float32BufferAttribute([
    1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1,
  ], 3));
  geometry.setAttribute('size', new T.Float32BufferAttribute([10, 40, 10, 40], 1));
  const material = new T.ShaderMaterial({
    uniforms: { color: { value: new T.Color(0xffffff) } },
    vertexShader: 'attribute float size; attribute vec3 ca; void main(){gl_PointSize=size;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'void main(){gl_FragColor=vec4(1.0);}',
  });
  const scene = new T.Scene();
  scene.add(new T.Points(geometry, material));
  const camera = new T.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 5;
  const renderer = new T.WebGLRenderer();
  renderer.setSize(64, 64);
  renderer.render(scene, camera);
  await new Promise(resolve => setTimeout(resolve, 10));
  const commands = packets();
  const batch = commands.find(c => c.opcode === 11);
  assert.ok(batch, 'discrete point sizes must enter the grouped draw lane');
  const body = buffer(batch.body);
  assert.equal(body.readUInt32LE(16), 2);
  const ids = [0, 1].map(i => body.readUInt32LE(24 + i * 16));
  const sizes = ids.map(id => {
    const material = commands.filter(c => c.opcode === OPCODE_MATERIAL)
      .map(c => buffer(c.body)).find(body => body.readUInt32LE(0) === id);
    assert.ok(material);
    assert.equal(material.readUInt32LE(8), 4, 'group remains a native points material');
    return material.readFloatLE(52);
  });
  assert.deepEqual(sizes, [10, 40]);
  assert.equal(body.readUInt32LE(32), 2);
  assert.equal(body.readUInt32LE(48), 2);
  console.log('PIN OK grouped custom point sizes');
}
// --- pin 8: continuously animated point sizes keep a bounded spatial distribution ---
{
  const { THREE: T, packets } = createHost();
  const count = 100;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (i % 10) * 0.1;
    positions[i * 3 + 1] = Math.floor(i / 10) * 0.1;
    colors.fill(1, i * 3, i * 3 + 3);
    sizes[i] = 4 + 54 * (0.5 + 0.5 * Math.sin(0.1 * i));
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.BufferAttribute(positions, 3));
  geometry.setAttribute('ca', new T.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new T.BufferAttribute(sizes, 1));
  const material = new T.ShaderMaterial({
    uniforms: { color: { value: new T.Color(0xffffff) } },
    vertexShader: 'attribute float size; attribute vec3 ca; void main(){gl_PointSize=size;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'void main(){gl_FragColor=vec4(1.0);}',
  });
  const scene = new T.Scene();
  scene.add(new T.Points(geometry, material));
  const camera = new T.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 5;
  const renderer = new T.WebGLRenderer();
  renderer.setSize(64, 64);
  renderer.render(scene, camera);
  await new Promise(resolve => setTimeout(resolve, 10));
  const commands = packets();
  const batch = commands.find(c => c.opcode === 11);
  assert.ok(batch, 'continuous sizes must use grouped point draws, not one mean point size');
  const body = buffer(batch.body);
  const groups = body.readUInt32LE(16);
  assert.ok(groups >= 4 && groups <= 8, `expected 4..8 quantized groups, got ${groups}`);
  let drawn = 0;
  const groupSizes = [];
  for (let i = 0; i < groups; i++) {
    const offset = 24 + i * 16;
    const id = body.readUInt32LE(offset);
    drawn += body.readUInt32LE(offset + 8);
    const material = commands.filter(c => c.opcode === OPCODE_MATERIAL)
      .map(c => buffer(c.body)).find(body => body.readUInt32LE(0) === id);
    assert.ok(material);
    groupSizes.push(material.readFloatLE(52));
  }
  assert.equal(drawn, count, 'quantization must preserve every source point');
  assert.ok(Math.min(...groupSizes) < 15, 'small points must remain small');
  assert.ok(Math.max(...groupSizes) > 40, 'large points must remain large');
  const geometryId = body.readUInt32LE(20);
  const firstUpload = commands.filter(c => c.opcode === 1)
    .map(c => buffer(c.body)).find(body => body.readUInt32LE(0) === geometryId);
  assert.ok(firstUpload);
  const firstVersion = firstUpload.readUInt32LE(4);
  for (let i = 0; i < count; i++) sizes[i] = 4 + 54 * (0.5 + 0.5 * Math.cos(0.1 * i));
  geometry.attributes.size.needsUpdate = true;
  renderer.render(scene, camera);
  await new Promise(resolve => setTimeout(resolve, 10));
  const uploads = packets().filter(c => c.opcode === 1)
    .map(c => buffer(c.body)).filter(body => body.readUInt32LE(0) === geometryId);
  assert.equal(uploads.length, 1, 'size animation must not upload a new grouped index buffer');
  assert.equal(uploads[0].readUInt32LE(4), firstVersion);
  console.log('PIN OK continuous custom point sizes retain an eight-group distribution without re-uploading geometry');
}
// --- pin 9: recognised ShaderPass kernels enter native kind 14 with their uniforms ---
{
  const tex = (T, context) => {
    const data = vm.runInContext('new Uint8Array([255, 255, 255, 255])', context);
    const texture = new T.DataTexture(data, 1, 1);
    texture.needsUpdate = true;
    return texture;
  };
  const cases = [
    { op: 1, uniforms: { tNew: 'texture', tOld: 'texture', damp: 0.875 }, fragment: '' },
    { op: 2, uniforms: { tDiffuse: 'texture', resolution: 'resolution' }, fragment: 'valueGx valueGy' },
    { op: 3, uniforms: { tDiffuse: 'texture', width: 64, height: 32, radius: 4, rotateR: 0.1, rotateG: 0.2, rotateB: 0.3, shape: 1, blending: 1, greyscale: false, disable: false }, fragment: '' },
    { op: 4, uniforms: { tDiffuse: 'texture', time: 2.5, intensity: 0.35, grayscale: true }, fragment: '' },
    { op: 5, uniforms: { tDiffuse: 'texture', center: 'resolution', angle: 0.5, scale: 0.8, tSize: 'resolution' }, fragment: '' },
    { op: 6, uniforms: { tDiffuse: 'texture', opacity: 0.95 }, fragment: '10.0 * ( lum - 0.45 )' },
    { op: 7, uniforms: { tDiffuse: 'texture', amount: 0.9 }, fragment: '0.393 0.769' },
    { op: 8, uniforms: { tDiffuse: 'texture', offset: 1.6, darkness: 0.95 }, fragment: 'vUv - vec2( 0.5 )' },
    { op: 9, uniforms: { tDiffuse: 'texture', color: 'color' }, fragment: 'uniform vec3 color;' },
    { op: 10, uniforms: { tDiffuse: 'texture' }, fragment: 'sRGBTransferOETF' },
    { op: 11, uniforms: { tDiffuse: 'texture', h: 0.01 }, fragment: '0.227027' },
    { op: 12, uniforms: { tDiffuse: 'texture', v: 0.01 }, fragment: '0.227027' },
  ];
  for (const item of cases) {
    const { THREE: T, context, packets } = createHost();
    const texture = tex(T, context);
    const uniforms = {};
    for (const [name, value] of Object.entries(item.uniforms)) {
      let resolved = value;
      if (value === 'texture') resolved = texture;
      else if (value === 'resolution') resolved = new T.Vector2(64, 32);
      else if (value === 'color') resolved = new T.Color(1, 0.8, 0.7);
      uniforms[name] = { value: resolved };
    }
    const material = new T.ShaderMaterial({
      uniforms,
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: item.fragment,
    });
    const scene = new T.Scene();
    scene.add(new T.Mesh(new T.PlaneGeometry(2, 2), material));
    const camera = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 2;
    const renderer = new T.WebGLRenderer();
    if (item.op === 2 || item.op === 3) renderer.setPixelRatio(2);
    renderer.setSize(64, 64);
    renderer.render(scene, camera);
    await new Promise(resolve => setTimeout(resolve, 5));
    const body = packets().filter(c => c.opcode === OPCODE_MATERIAL)
      .map(c => buffer(c.body)).find(body => body.readUInt32LE(8) === 14);
    assert.ok(body, `post op ${item.op} must encode native kind 14`);
    const tail = body.length - 112;
    assert.equal(body.readFloatLE(tail + 16), item.op, `post op ${item.op} parameter lane`);
    if (item.op === 1) {
      assert.ok(body.readUInt32LE(tail) > 0, 'afterimage history texture id');
      assert.ok(Math.abs(body.readFloatLE(tail + 20) - 0.875) < 1e-6, 'afterimage damp');
    }
    if (item.op === 2 || item.op === 3) {
      assert.equal(body.readFloatLE(tail + 20), 128, 'CSS width scaled to drawing-buffer pixels');
      assert.equal(body.readFloatLE(tail + 24), 64, 'CSS height scaled to drawing-buffer pixels');
    }
  }
  console.log('PIN OK 12 native postprocessing kernels and parameter payloads');
}
// Recognised ShaderChunk PCSS is marked by a negative shadow radius.
{
  const { THREE: T, packets } = createHost();
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 5;
  const mesh = new T.Mesh(new T.BoxGeometry(), new T.MeshLambertMaterial());
  mesh.castShadow = true;
  scene.add(mesh);
  const light = new T.DirectionalLight(0xffffff, 1);
  light.castShadow = true;
  light.shadow.radius = 2;
  scene.add(light);
  const renderer = new T.WebGLRenderer();
  renderer.setSize(64, 64);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.BasicShadowMap;
  renderer.render(scene, camera);
  await new Promise(resolve => setTimeout(resolve, 20));
  const ordinary = packets().filter(c => c.opcode === 8).at(-1);
  assert.equal(ordinary.body.readFloatLE(100), 2, 'ordinary shadow radius unchanged');
  const original = T.ShaderChunk.shadowmap_pars_fragment;
  try {
    T.ShaderChunk.shadowmap_pars_fragment = original +
      '\nfloat PCSS(sampler2D shadowMap, vec4 coords) { return 1.0; }';
    renderer.render(scene, camera);
    await new Promise(resolve => setTimeout(resolve, 20));
    const pcss = packets().filter(c => c.opcode === 8).at(-1);
    assert.equal(pcss.body.readFloatLE(100), -2, 'PCSS marker preserves radius magnitude');
  } finally {
    T.ShaderChunk.shadowmap_pars_fragment = original;
  }
  console.log('PIN OK recognised ShaderChunk PCSS shadow marker');
}
console.log('round4_correctness_test: all pins OK');
