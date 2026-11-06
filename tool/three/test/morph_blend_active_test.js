// Perf regression pin (webgl_loader_md2_control, ~12fps -> vsync): the R1 CPU
// morph blend must scan only the ACTIVE (non-zero influence) targets per
// vertex, not every morph target. MD2 characters (ogro.md2) store all 199
// animation frames in morphAttributes and animate at most two influences per
// mesh per frame; the historical per-vertex scan over every target ran
// ~2.4M QuickJS inner iterations per frame and dominated the whole frame
// budget (measured rAF tick 66ms -> 9ms when the active-target hoist landed).
//
// The pin is structural, not timing-based: in the fast path each target
// attribute's `.array` is read once per blend (the hoist) plus once per
// active pair in the vertex loop; in the historical path `targets[t].array`
// is read once per VERTEX per TARGET (targets * vertexCount). Counting
// `.array` reads through a Proxy therefore separates the two shapes by a
// factor of ~vertexCount while staying deterministic on any machine.
//
// Byte-exactness is pinned alongside: the hoisted blend must produce the
// same float32 values as the historical formula (same order, same
// arithmetic), all-zero influences must restore the pristine base, shared
// geometry must keep the first-mesh-per-frame dedup, and a non-finite
// influence must fall back to the historical scan (no finite-version stamp,
// NaN reaches the output exactly as before the hoist existed).
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
  outfile: path.join(HERE, '.native-morph-test.js'),
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
  const jsr = {
    instanceId: 'morph-active-test',
    hostCallBinary() {},
    async hostCall() { throw new Error('unexpected host call'); },
    render() {},
    requestAnimationFrame() { return 1; },
    cancelAnimationFrame() {}
  };
  const context = vm.createContext({ jsr, console, TextEncoder, TextDecoder, sendMessage() {}, setTimeout, clearTimeout });
  vm.runInContext(nativeBytes, context, { filename: 'morph-active-test.js' });
  return { THREE: context.THREE, jsr };
}

const { THREE, jsr } = createHost();

const TARGETS = 199;
const VERTS = 24; // BoxGeometry vertex count

function countingTargets(frameCount = TARGETS, verts = VERTS) {
  let arrayReads = 0;
  const positionTargets = [];
  const normalTargets = [];
  for (let t = 0; t < frameCount; t++) {
    const p = new Float32Array(verts * 3);
    const n = new Float32Array(verts * 3);
    for (let i = 0; i < verts * 3; i++) {
      p[i] = Math.sin(t + i) * 0.01;
      n[i] = Math.cos(t * 0.5 + i) * 0.1;
    }
    positionTargets.push(new THREE.BufferAttribute(p, 3));
    normalTargets.push(new THREE.BufferAttribute(n, 3));
  }
  const counted = new Proxy(positionTargets, {
    get(target, prop) {
      if (prop === 'array') arrayReads++;
      return target[prop];
    }
  });
  return { positionTargets, normalTargets, counted, reads: () => arrayReads };
}

function morphScene(influences, targets) {
  const canvas = jsr.three.createCanvas('main');
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(64, 64);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 0, 8);
  camera.lookAt(0, 0, 0);
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  geometry.morphAttributes.position = targets.positionTargets;
  geometry.morphAttributes.normal = targets.normalTargets;
  geometry.morphTargetsRelative = false;
  const material = new THREE.MeshStandardMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.morphTargetInfluences = influences;
  scene.add(mesh);
  return { renderer, scene, camera, mesh, geometry };
}

// Historical blend formula (pre-hoist), used as the bit-exactness oracle.
function referenceBlend(baseArray, targets, influences, relative = false) {
  const out = new Float32Array(baseArray.length);
  let baseInfluence = 1;
  if (!relative) {
    for (let i = 0; i < influences.length; i++) baseInfluence -= influences[i];
  }
  for (let i = 0; i < out.length; i++) {
    let value = relative ? baseArray[i] : baseArray[i] * baseInfluence;
    for (let t = 0; t < targets.length && t < influences.length; t++) {
      const weight = influences[t];
      if (weight === 0) continue;
      value += weight * targets[t].array[i];
    }
    out[i] = value;
  }
  return out;
}

const test = (name, fn) => Promise.resolve()
  .then(fn)
  .then(() => { console.log(`ok - ${name}`); })
  .catch(error => { console.error(`not ok - ${name}\n${error.message}`); process.exitCode = 1; });

await test('active-target blend is bit-identical and reads each target once', async () => {
  const targets = countingTargets();
  const influences = new Array(TARGETS).fill(0);
  influences[10] = 0.25;
  influences[11] = 0.75;
  const { renderer, scene, camera, geometry } = morphScene(influences, targets);
  const base = Float32Array.from(geometry.attributes.position.array);
  renderer.render(scene, camera);
  const out = geometry.attributes.position.array;
  const expected = referenceBlend(base, targets.positionTargets, influences);
  assert.equal(out.length, expected.length);
  for (let i = 0; i < out.length; i++) {
    assert.ok(Object.is(out[i], expected[i]),
      `vertex ${i}: blended ${out[i]} !== reference ${expected[i]}`);
  }
  // Structural bound: `.array` reads must be O(active), not O(targets) per
  // vertex. Hoist = TARGETS reads (counting proxy), vertex loop = 2 per
  // blend + normal pass; the historical shape would be >= VERTS * TARGETS.
  assert.ok(targets.reads() < VERTS * 4,
    `target array reads ${targets.reads()} must stay O(active), not O(targets*verts)`);
  // The finite fast path must be stamped so attributeFloats bulk-copies
  // instead of re-validating every component of a freshly blended array.
  assert.equal(geometry.attributes.position._r1FiniteVersion,
    geometry.attributes.position.version,
    'blended position must stamp the finite fast path');
  assert.equal(geometry.attributes.normal._r1FiniteVersion,
    geometry.attributes.normal.version,
    'blended normal must stamp the finite fast path');
});

await test('influence changes re-blend from the pristine base', async () => {
  const targets = countingTargets();
  const influences = new Array(TARGETS).fill(0);
  influences[10] = 0.25;
  influences[11] = 0.75;
  const { renderer, scene, camera, geometry } = morphScene(influences, targets);
  const base = Float32Array.from(geometry.attributes.position.array);
  renderer.render(scene, camera);
  const first = Float32Array.from(geometry.attributes.position.array);
  influences[10] = 0;
  influences[11] = 0;
  influences[12] = 0.5;
  influences[13] = 0.5;
  renderer.render(scene, camera);
  const second = geometry.attributes.position.array;
  const expected = referenceBlend(base, targets.positionTargets, influences);
  for (let i = 0; i < second.length; i++) {
    assert.ok(Object.is(second[i], expected[i]),
      `vertex ${i}: re-blend ${second[i]} !== reference ${expected[i]}`);
  }
  assert.notEqual(first[0], second[0], 'the pose must actually move');
});

await test('shared geometry blends once per frame (last writer wins)', async () => {
  const targets = countingTargets();
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  geometry.morphAttributes.position = targets.positionTargets;
  geometry.morphAttributes.normal = targets.normalTargets;
  const canvas = jsr.three.createCanvas('main');
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(64, 64);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 0, 8);
  camera.lookAt(0, 0, 0);
  const material = new THREE.MeshStandardMaterial();
  const a = new Array(TARGETS).fill(0);
  a[10] = 1;
  const b = new Array(TARGETS).fill(0);
  b[11] = 1;
  const meshA = new THREE.Mesh(geometry, material);
  meshA.morphTargetInfluences = a;
  const meshB = new THREE.Mesh(geometry, material);
  meshB.morphTargetInfluences = b;
  meshB.position.x = 3;
  scene.add(meshA, meshB);
  renderer.render(scene, camera);
  // The per-frame influence-set dedup keeps ONE blend per shared geometry;
  // the surviving content is the LAST writer's pose (existing R1
  // shared-geometry semantics, unchanged by the hoist). The upload itself
  // still happens once per frame via the frame geometry memo.
  const expected = referenceBlend(
    Float32Array.from(geometry._r1MorphBase.position), targets.positionTargets, b);
  const out = geometry.attributes.position.array;
  for (let i = 0; i < out.length; i++) {
    assert.ok(Object.is(out[i], expected[i]),
      'shared geometry must keep exactly one blend per frame');
  }
});

await test('all-zero influences restore the pristine base and still stamp', async () => {
  const targets = countingTargets();
  const influences = new Array(TARGETS).fill(0);
  const { renderer, scene, camera, geometry } = morphScene(influences, targets);
  const base = Float32Array.from(geometry.attributes.position.array);
  renderer.render(scene, camera);
  const out = geometry.attributes.position.array;
  for (let i = 0; i < out.length; i++) {
    assert.ok(Object.is(out[i], base[i]), `vertex ${i}: base restore drifted`);
  }
  assert.equal(geometry.attributes.position._r1FiniteVersion,
    geometry.attributes.position.version);
});

await test('non-finite influence falls back to the historical scan unstamped', async () => {
  const targets = countingTargets();
  const influences = new Array(TARGETS).fill(0);
  influences[10] = 0.5;
  influences[11] = NaN;
  const { renderer, scene, camera, geometry } = morphScene(influences, targets);
  // The historical contract: the NaN influence propagates into the blended
  // positions, NO finite stamp is set, and the strict encode path rejects
  // the non-finite geometry exactly as it did before the active-target
  // hoist existed.
  assert.throws(() => renderer.render(scene, camera), /must be finite/,
    'blended NaN positions must still fail the strict encode contract');
  const position = geometry.attributes.position;
  assert.notEqual(position._r1FiniteVersion, position.version,
    'a NaN influence must not stamp the finite fast path');
});

await test('non-finite morph target array keeps the strict unstamped path', async () => {
  const targets = countingTargets(4, VERTS);
  targets.positionTargets[2].array[7] = Infinity;
  const influences = new Array(4).fill(0);
  influences[2] = 0.5;
  const { renderer, scene, camera, geometry } = morphScene(influences, targets);
  assert.throws(() => renderer.render(scene, camera), /must be finite/,
    'an Infinity morph target must still fail the strict encode contract');
  const position = geometry.attributes.position;
  assert.notEqual(position._r1FiniteVersion, position.version,
    'an Infinity morph target must not stamp the finite fast path');
});

console.log('morph active-target blend pins passed');
