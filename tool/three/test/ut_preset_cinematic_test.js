// ut_preset_cinematic_test.js — UT-PRESET-* (issue #8, F4a, ADR-0004
// decision 3): the ThreeCinematicProfile presets report the settings they
// selected, setPreset applies exactly those settings, and the pure clock
// keeps direct seek equal to sequential playback.
//
// Run: node tool/three/test/ut_preset_cinematic_test.js   (from the repo root)
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
    sourcefile: 'ut-preset-cinematic-test-entry.js',
  },
  outfile: path.join(HERE, '.web-preset-test.js'),
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
  console, setTimeout, clearTimeout, TextEncoder, TextDecoder,
  sendMessage() {}, performance,
  Image: class Image {}, // SMAAPass constructor
});
vm.runInContext(result.outputFiles[0].text, context, { filename: 'web-preset-test.js' });
const T = context.THREE;
const cine = context.jsr.three.cinematic;

const json = value => JSON.parse(JSON.stringify(value));

// ── UT-PRESET-1: the surface `presets` are ThreeCinematicProfile instances
// named draft / production / deterministic-export, each REPORTING the
// settings it selected (deep copy every call).
{
  assert.deepEqual(Object.keys(cine.presets).sort(), ['deterministic-export', 'draft', 'production']);
  for (const name of Object.keys(cine.presets)) {
    const profile = cine.presets[name];
    assert.ok(profile instanceof cine.ThreeCinematicProfile, `${name} is a ThreeCinematicProfile`);
    assert.equal(profile.name, name);
    const settings = profile.settings();
    assert.equal(settings.fps, 24);
    assert.equal(settings.shutter, 0.5);
    assert.ok(settings.samples >= 1);
    assert.equal(settings.epoch, 0);
    assert.ok(settings.effects && typeof settings.effects === 'object', `${name} reports its effects`);
    // Reporting is a copy: mutating it cannot touch the shared preset.
    settings.effects.bloom = 'mutated';
    settings.fps = 999;
    const again = profile.settings();
    assert.notEqual(again.fps, 999);
    assert.notEqual(again.effects.bloom, 'mutated');
  }
  // draft: fxaa only. production and deterministic-export: the full set,
  // with the export profile carrying its fixed-seed note.
  assert.deepEqual(json(cine.presets.draft.settings().effects), {
    bloom: false, dof: false, fxaa: true, smaa: false, colorGrade: false, film: false, vignette: false, motion: false
  });
  assert.equal(cine.presets.draft.settings().samples, 1);
  for (const full of ['production', 'deterministic-export']) {
    assert.equal(cine.presets[full].settings().samples, 8);
    assert.equal(cine.presets[full].settings().effects.bloom, true);
  }
  assert.ok(/fixed seed/.test(cine.presets['deterministic-export'].settings().note || ''),
    'deterministic-export reports its fixed-seed policy');
  console.log('UT-PRESET-1: OK (profiles report deep-copied settings)');
}

// ── UT-PRESET-2: pipeline.setPreset applies exactly the reported settings
// (mock native-R1 renderer — the web-only effects stay NAMED unsupported).
{
  const renderer = {
    isJsrThreeRenderer: true,
    capabilities: { backend: 'flutterGpu', r1: true },
    getSize(v2) { return v2.set(320, 240); },
    getPixelRatio() { return 1; },
    setClearAlpha() {},
    domElement: null
  };
  const pipeline = cine.createPipeline({ renderer, scene: new T.Scene(), camera: new T.PerspectiveCamera() });
  const applied = pipeline.setPreset('production');
  const reported = cine.presets.production.settings();
  assert.equal(applied.fps, reported.fps);
  assert.equal(applied.shutter, reported.shutter);
  assert.equal(applied.samples, reported.samples);
  assert.equal(applied.epoch, reported.epoch);
  assert.deepEqual(json(applied.effects), json(reported.effects));
  // The pass chain matches the reported effects (bounded R1 set).
  assert.ok(pipeline.passes.bloom && pipeline.passes.dof && pipeline.passes.smaa &&
    pipeline.passes.fxaa && pipeline.passes.colorGrade, 'R1 bounded passes constructed');
  assert.equal(pipeline.passes.film, undefined, 'film stays off the native lane');
  const named = pipeline.unsupported.map(u => u.effect);
  assert.ok(named.includes('film') && named.includes('vignette'),
    'web-only effects are named-unsupported, never silent');
  assert.ok(named.includes('multisample') && named.includes('motion'),
    'samples=8 without float accumulation is named-unsupported');

  const draft = pipeline.setPreset('draft');
  assert.deepEqual(json(draft.effects), json(cine.presets.draft.settings().effects));
  assert.equal(draft.samples, 1);
  assert.equal(pipeline.passes.bloom.enabled, false, 'bloom disabled by the draft preset');
  assert.throws(() => pipeline.getPreset('cinema'), /unknown preset/);
  console.log('UT-PRESET-2: OK (setPreset applies the reported settings)');
}

// ── UT-PRESET-3: the pure clock — direct seek equals sequential playback
// under every preset's clock, and the frame clock object agrees with the
// pure function.
{
  for (const name of Object.keys(cine.presets)) {
    const s = cine.presets[name].settings();
    const clock = cine.createFrameClock({ fps: s.fps, shutter: s.shutter, samples: s.samples, epoch: s.epoch });
    let sequential = null;
    for (let f = 0; f <= 12; f++) sequential = clock.state(f);
    const direct = cine.clockState(12, s.fps, s.shutter, s.samples, s.epoch);
    assert.deepEqual(json(sequential.subframes), json(direct.subframes), `${name}: direct seek == sequential`);
    assert.deepEqual(json(clock.state(12)), json(direct), `${name}: clock.state == clockState`);
  }
  console.log('UT-PRESET-3: OK (deterministic clocks under every preset)');
}

console.log('ut_preset_cinematic_test.js: OK');
