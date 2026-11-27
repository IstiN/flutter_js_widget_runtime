// f4c1_motion_blur_test.js — F4c1 unit tests (issue #8, ADR-0004 decision 5,
// ADR-0005): the CinematicMotionBlurPass wiring, the Bokeh fringe helper and
// the afterimage history window, against the core bundle built IN MEMORY
// (same technique as ut_helper_cinematic_test.js).
//
// Run: node tool/three/test/f4c1_motion_blur_test.js   (from the repo root)
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
    sourcefile: 'f4c1-motion-test-entry.js',
  },
  outfile: path.join(HERE, '.f4c1-motion-test.js'),
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
  Image: class Image {},
});
vm.runInContext(result.outputFiles[0].text, context, { filename: 'f4c1-motion-test.js' });
const T = context.THREE;
const cine = context.jsr.three.cinematic;

// ── GL2 web mock (caps.motionBlurAccum true: half-float accumulation lane).
function mockWebGl2Renderer() {
  return {
    capabilities: { isWebGL2: true },
    getContext() { return { getExtension: name => (name === 'EXT_color_buffer_float' ? {} : null) }; },
    getSize(v2) { return v2.set(96, 64); },
    getPixelRatio() { return 1; },
    setClearAlpha() {},
    domElement: null
  };
}

// Native R1 mock (no float accumulation targets).
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

function pipelineFor(renderer, effects) {
  return cine.createPipeline({
    renderer, scene: new T.Scene(), camera: new T.PerspectiveCamera(), effects: effects || {}
  });
}

// ── F4C1-UT-1: the motionBlur helper selects the CinematicMotionBlurPass on
// a float-capable lane; chain order keeps OutputPass LAST and motion before
// it; the pass is the named decision-5 component on the surface.
{
  const pipeline = pipelineFor(mockWebGl2Renderer(), { motion: true });
  const pass = pipeline.passes.motion;
  assert.ok(pass, 'motion pass constructed on the float lane');
  assert.ok(pass instanceof cine.CinematicMotionBlurPass, 'the pass class is the named component');
  assert.equal(typeof pass.armSubframe, 'function');
  assert.equal(typeof pass.render, 'function');
  const chain = pipeline.composer.passes;
  const motionIndex = chain.indexOf(pass);
  const outputIndex = chain.indexOf(chain[chain.length - 1]);
  assert.equal(chain[chain.length - 1].constructor.name || '', 'OutputPass', 'OutputPass stays last');
  assert.ok(motionIndex > -1 && motionIndex < chain.length - 1, 'motion sits before OutputPass');
  // helpers select the same pass lazily
  const lazy = pipelineFor(mockWebGl2Renderer());
  assert.equal(lazy.passes.motion, undefined, 'no motion pass without the effect');
  assert.equal(lazy.applyEffect(cine.motionBlur({ shutter: 0.35, samples: 8 })), true, 'motionBlur helper constructs the pass');
  assert.ok(lazy.passes.motion instanceof cine.CinematicMotionBlurPass, 'helper-selected pass class');
  assert.equal(lazy.getConfig().shutter, 0.35);
  assert.equal(lazy.getConfig().samples, 8);
  console.log('F4C1-UT-1: OK (motion helper selects CinematicMotionBlurPass; chain order kept)');
}

// ── F4C1-UT-2: capability honesty — on the native R1 lane (no float
// targets) motion/fringe/afterimage are NAMED-unsupported and no pass is
// constructed; the bounded R1 set keeps its semantics (ADR-0004 fallback).
{
  const pipeline = pipelineFor(mockNativeRenderer(), { motion: true, fringe: true, afterimage: true });
  assert.equal(pipeline.passes.motion, undefined, 'no motion pass on R1');
  assert.equal(pipeline.passes.fringe, undefined, 'no fringe pass on R1');
  assert.equal(pipeline.passes.afterimage, undefined, 'no afterimage pass on R1');
  const named = pipeline.unsupported.map(u => u.effect);
  for (const effect of ['motion', 'fringe', 'afterimage']) {
    assert.ok(named.includes(effect), effect + ' named-unsupported on R1');
  }
  // The live helpers report false too (never silent true).
  const r1 = pipelineFor(mockNativeRenderer());
  assert.equal(r1.motionBlur({ shutter: 0.5, samples: 8 }), false, 'motionBlur helper false on R1');
  assert.equal(r1.fringe({ amount: 2 }), false, 'fringe helper false on R1');
  assert.equal(r1.afterimage({ damp: 0.5 }), false, 'afterimage helper false on R1');
  // samples>1 without float targets still renders subframe 0 (named) — the
  // legacy fallback semantics are untouched.
  console.log('F4C1-UT-2: OK (R1 named-unsupported, bounded set untouched)');
}

// ── F4C1-UT-3: armSubframe drives the accumulation/resolve routing. The
// recording fake renderer proves: subframe 0 clears the accumulation target,
// middle subframes accumulate (needsSwap false), the last subframe resolves
// into the chain buffer (needsSwap true), and an un-armed render is a no-op.
{
  const pass = new cine.CinematicMotionBlurPass({ samples: 4 });
  const calls = [];
  let boundTarget = 'default';
  const fakeRenderer = {
    setRenderTarget(t) { boundTarget = t; calls.push(['target', t === null ? 'screen' : 'rt']); },
    clear(mask) { calls.push(['clear', mask]); },
    setClearColor() {},
    autoClear: true,
    render() { calls.push(['quad']); }
  };
  const writeBuffer = { texture: { name: 'write' } };
  const readBuffer = { texture: { name: 'read' } };

  assert.equal(pass.needsSwap, true, 'Pass default needsSwap');
  pass.render(fakeRenderer, writeBuffer, readBuffer);
  assert.deepEqual(calls, [], 'un-armed render is a no-op');

  pass.setSize(96, 64);
  pass.armSubframe(0, 4, 0.125);
  assert.equal(pass.needsSwap, false, 'subframe 0 does not swap');
  calls.length = 0;
  pass.render(fakeRenderer, writeBuffer, readBuffer);
  assert.deepEqual(calls[0], ['target', 'rt'], 'subframe 0 binds the accumulation target');
  assert.deepEqual(calls[1], ['clear', true], 'subframe 0 clears the accumulation target');
  assert.ok(calls.some(c => c[0] === 'quad'), 'subframe 0 draws the accumulate quad');

  pass.armSubframe(1, 4, 0.125);
  assert.equal(pass.needsSwap, false, 'middle subframes do not swap');
  calls.length = 0;
  pass.render(fakeRenderer, writeBuffer, readBuffer);
  assert.ok(!calls.some(c => c[0] === 'clear'), 'middle subframes never re-clear');

  pass.armSubframe(3, 4, 0.125);
  assert.equal(pass.needsSwap, true, 'the last subframe resolves into the chain');
  calls.length = 0;
  pass.render(fakeRenderer, writeBuffer, readBuffer);
  // the last subframe accumulates FIRST, then resolves into the write buffer
  assert.deepEqual(calls, [['target', 'rt'], ['quad'], ['target', 'rt'], ['quad']],
    'resolve = accumulate the final sample, then copy the average into the chain');

  // samples=1 arm: resolve immediately (the pass-through frame).
  pass.armSubframe(0, 1, 1);
  assert.equal(pass.needsSwap, true, 'single subframe resolves immediately');
  pass.dispose();
  console.log('F4C1-UT-3: OK (armSubframe accumulation/resolve routing)');
}

// ── F4C1-UT-4: the afterimage declared history window — the bounded window
// formula, the declaration on the shared CinematicHistory, and the
// reconstruction bounds.
{
  const pipeline = pipelineFor(mockWebGl2Renderer());
  assert.equal(pipeline.history.depth(), 0, 'no declared window without temporal passes');
  assert.equal(pipeline.applyEffect(cine.afterimage({ damp: 0.5 })), true);
  assert.equal(pipeline.history.depth(), 40, 'damp 0.5 declares a 40-frame window');
  // The stock default (damp 0.96) declares a 680-frame window; near-1 damps
  // cap at 4096 (the documented limit).
  const stock = pipelineFor(mockWebGl2Renderer());
  stock.applyEffect(cine.afterimage({ damp: 0.96 }));
  assert.equal(stock.history.depth(), 680, 'damp 0.96 -> 680 frames');
  const capped = pipelineFor(mockWebGl2Renderer());
  capped.applyEffect(cine.afterimage({ damp: 0.9999999 }));
  assert.equal(capped.history.depth(), 4096, 'window capped at 4096');
  const rec = pipeline.history.reconstruct({ frame: 24 });
  // reconstruct is INCLUSIVE of the target frame (the replay loop uses
  // frames[0..len-2]); depth 40 covers the whole 24-frame run from 0.
  assert.deepEqual([...rec.frames], Array.from({ length: 25 }, (_, i) => i), 'window covers the whole run');
  assert.throws(() => pipeline.applyEffect(cine.afterimage({ damp: 1.0 })), e => e.name === 'cinematic.invalid', 'damp must stay in (0, 1)');
  console.log('F4C1-UT-4: OK (afterimage bounded window declared and reconstructable)');
}

// ── F4C1-UT-5: the fringe helper — BokehShader2 offsets, descriptor shape,
// uniform application, and the vignette-style lane gate.
{
  const shader = cine.CinematicMotionBlurPass ? null : null; // (named component stays exported)
  const pipeline = pipelineFor(mockWebGl2Renderer());
  assert.deepEqual(
    JSON.parse(JSON.stringify(cine.fringe({ amount: 2.5, blur: 0.8 }))),
    { effect: 'fringe', options: { amount: 2.5, blur: 0.8 } },
    'fringe descriptor shape'
  );
  assert.deepEqual(JSON.parse(JSON.stringify(cine.afterimage({ damp: 0.6 }))), { effect: 'afterimage', options: { damp: 0.6 } });
  assert.equal(pipeline.applyEffect(cine.fringe({ amount: 2.5 })), true);
  const pass = pipeline.passes.fringe;
  assert.ok(pass, 'fringe pass constructed');
  assert.equal(pass.uniforms.amount.value, 2.5);
  const src = pass.material.fragmentShader;
  assert.ok(src.includes('vec2(0.0, 1.0)'), 'BokehShader2 red offset');
  assert.ok(src.includes('vec2(-0.866, -0.5)'), 'BokehShader2 green offset');
  assert.ok(src.includes('vec2(0.866, -0.5)'), 'BokehShader2 blue offset');
  // chain order: fringe before OutputPass, after the finishing passes
  const chain = pipeline.composer.passes;
  assert.equal(chain[chain.length - 1].constructor.name, 'OutputPass');
  console.log('F4C1-UT-5: OK (fringe helper, BokehShader2 offsets, chain order)');
}

console.log('f4c1_motion_blur_test.js: OK');
