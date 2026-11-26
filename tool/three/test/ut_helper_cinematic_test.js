// ut_helper_cinematic_test.js — UT-HELPER-* (issue #8, F4a, ADR-0004
// decisions 2-4): the `jsr.three.cinematic` surface of the core bundle.
// Builds the web bundle IN MEMORY (never replaces assets/three) and drives
// the surface exports, the named components, the five effect helpers, and
// the `barrier: 'final-pass'` capture contract.
//
// Run: node tool/three/test/ut_helper_cinematic_test.js   (from the repo root)
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
    sourcefile: 'ut-helper-cinematic-test-entry.js',
  },
  outfile: path.join(HERE, '.web-helper-test.js'),
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

const context = vm.createContext({
  console,
  setTimeout, clearTimeout,
  TextEncoder, TextDecoder,
  sendMessage() {},
  performance,
  // SMAAPass constructs its lookup-texture loaders with `new Image()` at
  // construction time (the onload chain only fires in a real browser).
  Image: class Image {},
});
vm.runInContext(result.outputFiles[0].text, context, { filename: 'web-helper-test.js' });
const T = context.THREE;
const cine = context.jsr.three.cinematic;

const drain = () => new Promise(resolve => setImmediate(resolve));

// ── UT-HELPER-1: the surface exists on the core bundle (installed at bundle
// evaluation, i.e. exactly when the host runs with threeEnabled).
{
  const expected = ['CinematicCapabilitySet', 'CinematicFrameClock', 'CinematicHistory',
    'CinematicPipelineError', 'ThreeCinematicProfile', 'antialias', 'bloom', 'buildLutTexture',
    'cinematicRandom', 'clockState', 'colorGrade', 'createFrameClock', 'createPipeline',
    'depthOfField', 'motionBlur', 'presets', 'probeCapabilities'];
  assert.deepEqual(Object.keys(cine).sort(), expected, 'jsr.three.cinematic surface members');
  assert.equal(typeof cine.createPipeline, 'function');
  assert.equal(typeof cine.clockState, 'function');
  assert.equal(typeof cine.probeCapabilities, 'function');
  console.log('UT-HELPER-1: OK (surface exports on jsr.three.cinematic)');
}

// ── UT-HELPER-2: the named components (ADR-0004 decision 3).
{
  // CinematicCapabilitySet — supports() maps helpers to probe bits; the lane
  // stays non-enumerable so capability JSON snapshots stay schema-clean.
  const caps = cine.probeCapabilities({ capabilities: {} }); // web, no GL2 info
  assert.ok(caps instanceof cine.CinematicCapabilitySet);
  assert.equal(caps.lane, 'web');
  assert.equal(JSON.stringify(JSON.parse(JSON.stringify(caps))).includes('lane'), false,
    'lane must stay non-enumerable (schema-clean snapshots)');
  assert.equal(caps.supports('bloom'), true);       // unconditional on the web lane
  assert.equal(caps.supports('fxaa'), true);        // basic ShaderPass, no probe bit
  assert.equal(caps.supports('film'), false);       // needs isWebGL2 evidence
  assert.equal(caps.supports('nonsense'), false);
  const gl2 = cine.probeCapabilities({ capabilities: { isWebGL2: true }, getContext: () => ({ getExtension: () => ({}) }) });
  assert.equal(gl2.supports('film'), true);
  assert.equal(gl2.supports('depthOfField'), true);
  assert.equal(gl2.supports('multisample'), true);  // half-float accumulation

  // CinematicFrameClock — state(frame) is the pure clockState.
  const clock = cine.createFrameClock({ fps: 30, shutter: 0.25, samples: 4, epoch: 7 });
  assert.deepEqual(clock.state(11), cine.clockState(11, 30, 0.25, 4, 7));
  assert.throws(() => cine.createFrameClock({ fps: 30 }).state(-1), /frame must be a non-negative integer/);

  // Direct seek equals sequential: the clock is a pure function of frame.
  let last = null;
  for (let f = 0; f <= 9; f++) last = clock.state(f);
  assert.deepEqual(last.subframes, clock.state(9).subframes, 'direct seek == sequential');

  // CinematicHistory — bounded declared windows, reconstruction on seek.
  const history = new cine.CinematicHistory(3);
  assert.equal(history.epoch, 3);
  history.declare({ pass: 'afterimage', frames: 4 });
  assert.equal(history.depth(), 4);
  const rec = history.reconstruct({ frame: 6 });
  assert.deepEqual([...rec.frames], [3, 4, 5, 6]);
  assert.deepEqual([...history.reconstruct({ frame: 2 }).frames], [0, 1, 2], 'window clamps at 0');
  assert.throws(() => history.declare({ pass: 'x', frames: 0 }), /cinematic.invalid/);
  assert.equal(history.reset(9), 9);
  assert.equal(history.depth(), 4, 'reset keeps declarations');

  console.log('UT-HELPER-2: OK (CinematicCapabilitySet / CinematicFrameClock / CinematicHistory)');
}

// ── The mock native-R1 renderer used by the pipeline tests below: lane
// detection reads isJsrThreeRenderer; getSize feeds composer targets.
function mockNativeRenderer() {
  return {
    isJsrThreeRenderer: true,
    capabilities: { backend: 'flutterGpu', r1: true },
    getSize(v2) { return v2.set(320, 240); },
    getPixelRatio() { return 1; },
    setClearAlpha() {},
    domElement: null
  };
}

// ── UT-HELPER-3: the five effect helpers — descriptor factories + live
// application on a pipeline (issue #8 P5 usage).
{
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera();
  const renderer = mockNativeRenderer();

  const pipeline = cine.createPipeline({ renderer, scene, camera });

  // Descriptor factories produce plain {effect, options} records.
  assert.deepEqual(JSON.parse(JSON.stringify(cine.bloom({ threshold: 1.1, strength: 0.7 }))), { effect: 'bloom', options: { threshold: 1.1, strength: 0.7 } });
  assert.deepEqual(JSON.parse(JSON.stringify(cine.depthOfField({ focus: 15 }))), { effect: 'dof', options: { focus: 15 } });
  assert.deepEqual(JSON.parse(JSON.stringify(cine.colorGrade({ lut: 'teal-orange' }))), { effect: 'colorGrade', options: { lut: 'teal-orange' } });
  assert.deepEqual(JSON.parse(JSON.stringify(cine.motionBlur({ shutter: 0.35, samples: 8 }))), { effect: 'motion', options: { shutter: 0.35, samples: 8 } });
  assert.deepEqual(JSON.parse(JSON.stringify(cine.antialias({ mode: 'smaa' }))), { effect: 'antialias', options: { mode: 'smaa' } });
  assert.throws(() => cine.antialias({ mode: 'taa' }), e => e.name === 'cinematic.invalid');

  // Descriptors apply through pipeline.applyEffect.
  assert.equal(pipeline.applyEffect(cine.bloom({ threshold: 1.1, strength: 0.7, radius: 0.35 })), true);
  assert.ok(pipeline.passes.bloom, 'bloom pass constructed');
  assert.equal(pipeline.passes.bloom.threshold, 1.1);
  assert.equal(pipeline.passes.bloom.strength, 0.7);
  assert.equal(pipeline.passes.bloom.radius, 0.35);

  // Live helper methods (the P5 ergonomics).
  assert.equal(pipeline.depthOfField({ focus: 15, aperture: 0.002, maxBlur: 0.01 }), true);
  assert.equal(pipeline.passes.dof.uniforms.focus.value, 15);
  assert.equal(pipeline.passes.dof.uniforms.aperture.value, 0.002);
  assert.equal(pipeline.passes.dof.uniforms.maxblur.value, 0.01);

  // antialias is exclusive: smaa disables fxaa and vice versa (fxaa is not
  // constructed yet here — setEffect only records the toggle).
  assert.equal(pipeline.antialias({ mode: 'smaa' }), true);
  assert.ok(pipeline.passes.smaa.enabled);
  assert.ok(!pipeline.passes.fxaa || pipeline.passes.fxaa.enabled === false);
  assert.equal(pipeline.antialias({ mode: 'fxaa' }), true);
  assert.equal(pipeline.passes.fxaa.enabled, true);
  assert.equal(pipeline.passes.smaa.enabled, false);

  // colorGrade routes through the LUT pass; motionBlur sets the clock.
  assert.equal(pipeline.colorGrade({ lut: 'identity' }), true);
  assert.ok(pipeline.passes.colorGrade);
  pipeline.motionBlur({ shutter: 0.35, samples: 8 });
  assert.equal(pipeline.getConfig().shutter, 0.35);
  assert.equal(pipeline.getConfig().samples, 8);
  // Native R1 has no float accumulation targets: the requested multisample
  // config is NAMED, never silent.
  const named = pipeline.unsupported.map(u => u.effect);
  assert.ok(named.includes('multisample'), 'multisample named-unsupported on R1');
  assert.ok(named.includes('motion'), 'motion named-unsupported on R1');

  assert.throws(() => pipeline.applyEffect({}), /cinematic.invalid/);
  assert.equal(pipeline.isCinematicPipeline, true, 'CinematicPipeline formal marker');
  console.log('UT-HELPER-3: OK (effect helpers, descriptors, live application)');
}

// ── UT-HELPER-4: web-only effects stay named-unsupported on the native lane
// (the bounded R1 set keeps its semantics — decision 2 boundary).
{
  const pipeline = cine.createPipeline({
    renderer: mockNativeRenderer(),
    scene: new T.Scene(),
    camera: new T.PerspectiveCamera(),
    effects: { bloom: true, dof: true, fxaa: true, smaa: true, colorGrade: 'teal-orange', film: true, vignette: true, motion: false }
  });
  const reasons = Object.fromEntries(pipeline.unsupported.map(u => [u.effect, u.reason]));
  assert.ok(/web-only v1/.test(reasons.film), 'film named web-only');
  assert.ok(/web-only v1/.test(reasons.vignette), 'vignette named web-only');
  assert.equal(pipeline.passes.film, undefined);
  assert.equal(pipeline.passes.vignette, undefined);
  assert.ok(pipeline.passes.bloom && pipeline.passes.dof && pipeline.passes.fxaa && pipeline.passes.smaa && pipeline.passes.colorGrade,
    'the R1 bounded set constructs');
  console.log('UT-HELPER-4: OK (R1 bounded set keeps its semantics)');
}

// ── UT-HELPER-5: the capture barrier is a host contract (decision 4) —
// captureFrame(clock) crosses __jsr_capture with
// {engineId, clock, barrier: 'final-pass'}; a missing capability rejects
// with the NAMED error cinematic.notCapturable, never an effect-free capture.
{
  const requests = [];
  const boot = iid => {
    context.__IID = iid;
    context.jsr.capture = opts => {
      requests.push(opts);
      if (context.jsr.__failNext) return Promise.resolve({ __error: context.jsr.__failNext });
      return Promise.resolve({ path: '/tmp/capture.png', width: 320, height: 240 });
    };
  };

  const run = (async () => {
    boot('engine-ut5');
    const pipeline = cine.createPipeline({
      renderer: mockNativeRenderer(), scene: new T.Scene(), camera: new T.PerspectiveCamera()
    });
    const clock = cine.clockState(20, 24, 0.5, 8, 0);
    const captured = await pipeline.captureFrame(clock);
    await drain();
    assert.equal(requests.length, 1, 'exactly one barrier request');
    assert.deepEqual(JSON.parse(JSON.stringify(requests[0])), {
      engineId: 'engine-ut5',
      clock: { frame: 20, fps: 24, shutter: 0.5, samples: 8, epoch: 0 },
      barrier: 'final-pass'
    });
    assert.deepEqual(JSON.parse(JSON.stringify(captured)), { path: '/tmp/capture.png', width: 320, height: 240 });

    // Host refuses (e.g. no barrier backing): NAMED error, never a fake.
    context.jsr.__failNext = 'capture is not supported by this host';
    await assert.rejects(pipeline.captureFrame(clock), e => e.name === 'cinematic.notCapturable');
    context.jsr.__failNext = undefined;

    // No capture channel at all: NAMED error before anything is sent.
    delete context.jsr.capture;
    requests.length = 0;
    await assert.rejects(pipeline.captureFrame(clock), e => e.name === 'cinematic.notCapturable');
    assert.equal(requests.length, 0, 'no effect-free fallback request');
  })();
  await run;
  delete context.jsr.capture;
  delete context.jsr.__failNext;
  console.log('UT-HELPER-5: OK (final-pass barrier options + named notCapturable)');
}

console.log('ut_helper_cinematic_test.js: OK');
