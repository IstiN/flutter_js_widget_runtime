// Perf regression pin (cluster C, webgl_animation_skinning_ik): the
// skinned-aware culling bound refresh is an O(vertex) min/max scan that must
// run once per changed attribute VERSION, not once per render call. The IK
// example renders the same scene 7+ times per frame (cube-camera faces, main
// pass, shadow passes); a per-render re-scan cost ~2/3 of the frame budget
// (Release presented-fps 40.46 -> 119.94 once memoized).
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

function createHost() {
  const r1Packets = [];
  const jsr = {
    instanceId: 'skin-cull-memo-test',
    hostCallBinary(name, data) {
      if (name === 'three.r1') r1Packets.push(data.slice());
    },
    async hostCall() { throw new Error('unexpected host call'); },
    render() {},
    requestAnimationFrame() { return 1; },
    cancelAnimationFrame() {}
  };
  const context = vm.createContext({ jsr, console, TextEncoder, TextDecoder, sendMessage() {}, setTimeout, clearTimeout });
  vm.runInContext(nativeBytes, context, { filename: 'skin-cull-memo-test.js' });
  return { THREE: context.THREE, jsr, r1Packets };
}

const { THREE, jsr, r1Packets } = createHost();

function skinnedScene() {
  const canvas = jsr.three.createCanvas('main');
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(64, 64);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 0, 8);
  camera.lookAt(0, 0, 0);
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const count = geometry.attributes.position.count;
  geometry.setAttribute('skinIndex',
    new THREE.Float32BufferAttribute(new Array(count * 4).fill(0), 4));
  geometry.setAttribute('skinWeight',
    new THREE.Float32BufferAttribute(new Array(count * 4).fill(1), 4));
  const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshStandardMaterial());
  const bone = new THREE.Bone();
  const skeleton = new THREE.Skeleton([bone]);
  mesh.bind(skeleton);
  mesh.add(bone);
  scene.add(mesh);
  return { renderer, scene, camera, mesh, bone, geometry };
}

const test = (name, fn) => Promise.resolve()
  .then(fn)
  .then(() => { console.log(`ok - ${name}`); })
  .catch(error => { console.error(`not ok - ${name}\n${error.message}`); process.exitCode = 1; });

await test('cull sphere refresh is memoized per attribute version', async () => {
  const { renderer, scene, camera, mesh, bone } = skinnedScene();
  // 1) First render creates the memo and the exact bound.
  renderer.render(scene, camera);
  const memo1 = mesh._r1CullSphereMemo;
  assert.ok(memo1, 'first render must create the cull memo');
  const radius1 = mesh.boundingSphere && mesh.boundingSphere.radius;
  // 2) A pose change (attribute version bump) refreshes once.
  bone.position.set(3, 0, 0);
  renderer.render(scene, camera);
  const memo2 = mesh._r1CullSphereMemo;
  assert.notEqual(memo2, memo1, 'pose change must refresh the cull memo');
  const radius2 = mesh.boundingSphere && mesh.boundingSphere.radius;
  // 3) Frozen pose: duplicate render calls reuse the memo (same identity).
  const frozen = [];
  for (let i = 0; i < 6; i++) {
    renderer.render(scene, camera);
    frozen.push(mesh._r1CullSphereMemo);
  }
  for (const memo of frozen) {
    assert.equal(memo, memo2, 'frozen-pose render must reuse the cull memo');
  }
  assert.ok(mesh.boundingSphere && mesh.boundingSphere.radius === radius2,
    'memo hits must keep the exact skinned bound');
  // 4) A second pose change invalidates the memo again.
  bone.position.set(-2, 1, 0);
  renderer.render(scene, camera);
  assert.notEqual(mesh._r1CullSphereMemo, memo2,
    'a new pose change must refresh the cull memo again');
});

await test('multi-material skinned parts retain bind geometry and share GPU bones', async () => {
  const { renderer, scene, camera, mesh, bone } = skinnedScene();
  const vertexCount = 4098; // Above the GPU lane's large-mesh threshold; divisible into triangles.
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const indices = new Float32Array(vertexCount * 4);
  const weights = new Float32Array(vertexCount * 4);
  for (let vertex = 0; vertex < vertexCount; vertex++) {
    positions[vertex * 3] = (vertex % 100) * 0.01;
    positions[vertex * 3 + 1] = Math.floor(vertex / 100) * 0.01;
    normals[vertex * 3 + 2] = 1;
    weights[vertex * 4] = 1;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('skinIndex', new THREE.BufferAttribute(indices, 4));
  geometry.setAttribute('skinWeight', new THREE.BufferAttribute(weights, 4));
  geometry.addGroup(0, 2049, 0);
  geometry.addGroup(2049, 2049, 1);
  mesh.geometry = geometry;
  mesh.material = [new THREE.MeshStandardMaterial(), new THREE.MeshStandardMaterial()];
  const bindPose = positions.slice();

  renderer.render(scene, camera);
  await Promise.resolve(); // Flush the per-task R1 envelope.
  bone.position.set(3, 0, 0);
  renderer.render(scene, camera);
  await Promise.resolve();

  assert.equal(renderer.info.render.calls, 2, 'both material groups remain separate draw parts');
  assert.equal(mesh._r1GpuSkin.length, 16, 'the shared node must publish one bone matrix');
  assert.equal(mesh._r1GpuSkin[12], 3, 'the GPU matrix must contain the animated pose');
  assert.equal(geometry.attributes.position.version, 0, 'GPU skinning must not rewrite positions');
  assert.equal(geometry.attributes.normal.version, 0, 'GPU skinning must not rewrite normals');
  assert.deepEqual(geometry.attributes.position.array, bindPose,
    'every multi-material part must read the immutable bind pose');

  // Batch nodes have geometryId 0. Their NODE command must nevertheless carry
  // the shared skeleton tail; otherwise every material part decodes as rigid.
  const skinNodes = [];
  for (const packet of r1Packets) {
    const view = new DataView(packet.buffer, packet.byteOffset, packet.byteLength);
    const payload = view.getUint16(6, true);
    const commandCount = view.getUint32(payload + 8, true);
    let offset = payload + 12;
    for (let command = 0; command < commandCount; command++) {
      const opcode = view.getUint8(offset);
      const length = view.getUint32(offset + 4, true);
      const body = offset + 8;
      if (opcode === 4 && length > 104) {
        skinNodes.push({
          geometryId: view.getUint32(body + 8, true),
          boneCount: view.getUint32(body + 104, true),
          translationX: view.getFloat32(body + 108 + 12 * 4, true)
        });
      }
      offset = body + length;
    }
  }
  assert.deepEqual(skinNodes[skinNodes.length - 1],
    { geometryId: 0, boneCount: 1, translationX: 3 },
    'the zero-geometry batch node must publish its animated GPU bone matrix');
});
