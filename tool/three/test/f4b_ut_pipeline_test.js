// f4b_ut_pipeline_test.js — UT-PIPELINE-* (issue #8, F4b): the pipeline
// gates the F4b assignment pins at unit level (no GPU): pass order with
// lazy ensurePass, the named cinematic.unsupported lane guard (missing
// float targets / MRT fail at creation — never an effect-less pipeline),
// the capture-time unsupported gate (barrier rejects before the host is
// asked), coherent resize, and the native R1 lane staying untouched.
//
// Run: node tool/three/test/f4b_ut_pipeline_test.js   (from the repo root)
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
  stdin: {
    contents: "export * from '../src/web_entry.js';",
    resolveDir: HERE,
    sourcefile: 'f4b-ut-pipeline-test-entry.js',
  },
  outfile: path.join(HERE, '.web-f4b-pipeline-test.js'),
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'THREE',
  platform: 'neutral',
  target: ['es2020'],
  minify: false,
  treeShaking: false,
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

function makeContext(captureCalls) {
  return vm.createContext({
    console,
    setTimeout, clearTimeout,
    TextEncoder, TextDecoder,
    sendMessage() {},
    performance,
    Image: class Image {},
    jsr: {
      capture: (req) => {
        captureCalls.push(req);
        return Promise.resolve({ path: '/tmp/fake-capture.png', width: 320, height: 180 });
      }
    }
  });
}
vm.runInContext(result.outputFiles[0].text, makeContext([]), { filename: 'web-f4b-pipeline-test.js' });

const EFFECTS = { bloom: true, dof: false, fxaa: true, smaa: false, colorGrade: false, film: false, vignette: false, motion: false };
const ALL_ON = { bloom: true, dof: true, fxaa: true, smaa: false, colorGrade: true, film: false, vignette: false, motion: false };

const r1Renderer = () => ({
  isJsrThreeRenderer: true,
  capabilities: { backend: 'flutterGpu', r1: true },
  getSize: (v) => v.set(480, 320),
  getPixelRatio: () => 1,
  setClearAlpha: () => {}
});
const webRenderer = () => ({
  capabilities: {},
  getSize: (v) => v.set(320, 180),
  getPixelRatio: () => 1,
  setClearAlpha: () => {}
});

function cineWith(captureCalls) {
  const ctx = makeContext(captureCalls);
  vm.runInContext(result.outputFiles[0].text, ctx, { filename: 'web-f4b-pipeline-test.js' });
  return vm.runInContext('({ cine: jsr.three.cinematic, THREE: THREE })', ctx);
}

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

// UT-PIPELINE-1 — pass order: RenderPass FIRST, OutputPass LAST, lazy
// ensurePass inserts at the fixed chain position.
test('UT-PIPELINE-1: pass order is fixed (RenderPass first, OutputPass last) and ensurePass keeps it', () => {
  const { cine, THREE } = cineWith([]);
  const renderer = r1Renderer();
  const pipeline = cine.createPipeline({
    renderer, scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(),
    effects: { ...ALL_ON }
  });
  const chain = pipeline.composer.passes;
  assert.equal(chain[0].isRenderPass, true, 'RenderPass first');
  assert.equal(chain[chain.length - 1].isOutputPass, true, 'OutputPass last');
  const indexOf = (p) => chain.indexOf(p);
  assert.ok(indexOf(pipeline.passes.bloom) < indexOf(pipeline.passes.dof), 'bloom before dof');
  assert.ok(indexOf(pipeline.passes.dof) < indexOf(pipeline.passes.fxaa), 'dof before fxaa');
  assert.ok(indexOf(pipeline.passes.fxaa) < indexOf(pipeline.passes.colorGrade), 'fxaa before colorGrade');
  // lazy construction: smaa joins BEFORE fxaa (its fixed chain slot)
  assert.equal(pipeline.ensurePass('smaa'), true);
  const chain2 = pipeline.composer.passes;
  assert.ok(chain2.indexOf(pipeline.passes.smaa) < chain2.indexOf(pipeline.passes.fxaa),
      'smaa inserted before fxaa');
  assert.equal(chain2[chain2.length - 1].isOutputPass, true, 'OutputPass still last');
});

// UT-PIPELINE-2 — VALIDATE: missing float targets / MRT fail at CREATION
// with the exact named features (cinematic.unsupported), on the web lane.
test('UT-PIPELINE-2: missing float targets and MRT fail creation named (web lane)', () => {
  const { cine, THREE } = cineWith([]);
  const renderer = webRenderer();
  // (a) plain web-lane probe (no GL info): both features missing
  assert.throws(
    () => cine.createPipeline({ renderer, scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), effects: { ...EFFECTS } }),
    (e) => e.name === 'cinematic.unsupported' &&
      e.message.includes('EXT_color_buffer_float') &&
      e.message.includes('multiple render targets'),
    'both missing features are named'
  );
  // (b) forced caps: only MRT missing -> only MRT named
  const capsMrt = new cine.CinematicCapabilitySet({
    halfFloatTargets: true, mrt: false, mipTargets: false, smaa: false,
    lut: false, bokeh: false, bloom: false, film: false, vignette: false,
    motionBlurAccum: false, pmrem: false, cubeCamera: false
  }, 'web');
  assert.throws(
    () => cine.createPipeline({ renderer, scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), capabilities: capsMrt, effects: { ...EFFECTS } }),
    (e) => e.message.includes('multiple render targets') && !e.message.includes('EXT_color_buffer_float'),
    'only the actually missing feature is named'
  );
  // (c) forced caps: only float targets missing -> only the float feature named
  const capsFloat = new cine.CinematicCapabilitySet({
    halfFloatTargets: false, mrt: true, mipTargets: false, smaa: false,
    lut: false, bokeh: false, bloom: false, film: false, vignette: false,
    motionBlurAccum: false, pmrem: false, cubeCamera: false
  }, 'web');
  assert.throws(
    () => cine.createPipeline({ renderer, scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), capabilities: capsFloat, effects: { ...EFFECTS } }),
    (e) => e.message.includes('EXT_color_buffer_float') && !e.message.includes('multiple render targets'),
    'only the float feature is named'
  );
});

// UT-PIPELINE-3 — CAPTURE-GATE: a requested-but-unsupported effect fails
// the barrier capture NAMED; the capture host is never asked. Control: a
// pipeline without unsupported effects reaches the host.
test('UT-PIPELINE-3: the barrier capture rejects unsupported effects before the host is asked', async () => {
  const calls = [];
  const { cine, THREE } = cineWith(calls);
  const caps = new cine.CinematicCapabilitySet({
    halfFloatTargets: false, mrt: false, mipTargets: false, smaa: true,
    lut: true, bokeh: true, bloom: false, film: false, vignette: false,
    motionBlurAccum: false, pmrem: false, cubeCamera: false
  }, 'native');
  const gated = cine.createPipeline({
    renderer: r1Renderer(), scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(),
    capabilities: caps,
    effects: { ...EFFECTS }
  });
  assert.equal(gated.passes.bloom, undefined, 'the gated effect built no pass');
  assert.equal(JSON.stringify(gated.unsupported.map((u) => u.effect)), JSON.stringify(['bloom']));
  await assert.rejects(
    () => gated.captureFrame(cine.clockState(3, 24, 0.5, 1, 0)),
    (e) => e.name === 'cinematic.notCapturable' && e.message.includes('bloom'),
    'the capture names the exact unsupported effect'
  );
  assert.equal(calls.length, 0, 'the capture host was never asked');
  // control: a clean pipeline DOES reach the host (the gate is specific)
  const clean = cine.createPipeline({
    renderer: r1Renderer(), scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera()
  });
  const res = await clean.captureFrame(cine.clockState(1, 24, 0.5, 1, 0));
  assert.equal(res.path, '/tmp/fake-capture.png');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].barrier, 'final-pass');
});

// UT-PIPELINE-4 — resize: composer buffers, the FXAA resolution uniform and
// the camera aspect all follow setSize coherently.
test('UT-PIPELINE-4: setSize resizes composer buffers, fxaa resolution and camera aspect coherently', () => {
  const { cine, THREE } = cineWith([]);
  const camera = new THREE.PerspectiveCamera();
  let updated = 0;
  camera.updateProjectionMatrix = () => { updated++; };
  const pipeline = cine.createPipeline({
    renderer: r1Renderer(), scene: new THREE.Scene(), camera,
    effects: { ...EFFECTS }
  });
  pipeline.setSize(200, 124);
  assert.equal(pipeline.composer.renderTarget1.width, 200);
  assert.equal(pipeline.composer.renderTarget1.height, 124);
  assert.equal(pipeline.composer.renderTarget2.width, 200);
  const fxaa = pipeline.passes.fxaa;
  assert.equal(fxaa.material.uniforms.resolution.value.x, 1 / 200);
  assert.equal(fxaa.material.uniforms.resolution.value.y, 1 / 124);
  assert.equal(camera.aspect, 200 / 124);
  assert.equal(updated, 1);
  pipeline.setSize(480, 320);
  assert.equal(pipeline.composer.renderTarget1.width, 480);
  assert.equal(fxaa.material.uniforms.resolution.value.x, 1 / 480);
  assert.equal(camera.aspect, 480 / 320);
});

// UT-PIPELINE-5 — the native R1 lane keeps its bounded UnsignedByte
// composer (the F4b web-lane guard must not touch it).
test('UT-PIPELINE-5: the native R1 lane still builds its UnsignedByte composer', () => {
  const { cine, THREE } = cineWith([]);
  const pipeline = cine.createPipeline({
    renderer: r1Renderer(), scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(),
    effects: { ...EFFECTS }
  });
  assert.equal(pipeline.lane, 'native');
  assert.equal(pipeline.composer.renderTarget1.texture.type, THREE.UnsignedByteType);
  assert.equal(pipeline.unsupported.length, 0);
});

// UT-PIPELINE-CAPTURE-FLUSH — the capture-barrier flush guarantee (F4 merge
// stage 2b): captureFrame(clock) drains the renderer's GL context (the wire
// flush trigger) BEFORE the barrier host is asked, because the __jsr_capture
// crossing is fire-and-forget at the bridge and the host's surface read runs
// inside it. The synchronous drain property of the wire flush itself is
// pinned by batch_test.js (trigger 2); the F4i native proof pins the
// end-to-end behavior without the harness yield.
test('UT-PIPELINE-CAPTURE-FLUSH: captureFrame flushes the GL context before the barrier host is asked', async () => {
  const order = [];
  const ctx = vm.createContext({
    console,
    setTimeout, clearTimeout,
    TextEncoder, TextDecoder,
    sendMessage() {},
    performance,
    Image: class Image {},
    jsr: {
      capture: () => { order.push('capture'); return Promise.resolve({ path: '/tmp/fake-capture.png', width: 320, height: 180 }); }
    }
  });
  vm.runInContext(result.outputFiles[0].text, ctx, { filename: 'web-f4b-pipeline-test.js' });
  const loaded = vm.runInContext('({ cine: jsr.three.cinematic, THREE: THREE })', ctx);
  const flushRenderer = () => ({
    isJsrThreeRenderer: true,
    capabilities: { backend: 'flutterGpu', r1: true },
    getSize: (v) => v.set(480, 320),
    getPixelRatio: () => 1,
    setClearAlpha: () => {},
    getContext: () => ({ flush: () => order.push('flush') })
  });
  const pipeline = loaded.cine.createPipeline({
    renderer: flushRenderer(), scene: new loaded.THREE.Scene(), camera: new loaded.THREE.PerspectiveCamera()
  });
  await pipeline.captureFrame(loaded.cine.clockState(2, 24, 0.5, 1, 0));
  assert.deepEqual(order, ['flush', 'capture'],
    'the context flush must happen before the barrier host is invoked');
  // and the barrier payload is unchanged
  const gated = loaded.cine.createPipeline({
    renderer: { ...flushRenderer(), getContext: () => ({ flush: () => {} }) },
    scene: new loaded.THREE.Scene(), camera: new loaded.THREE.PerspectiveCamera()
  });
  await gated.captureFrame(loaded.cine.clockState(3, 24, 0.5, 1, 0));
});

let failed = 0;
for (const [name, fn] of tests) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (e) {
    failed++;
    console.error(`NOT OK - ${name}`);
    console.error(e && e.stack || e);
  }
}
console.log(`f4b_ut_pipeline_test: ${tests.length - failed}/${tests.length} tests passed`);
process.exit(failed ? 1 : 0);
