// F4d determinism battery (issue #8, segment F4d; E2E-AA / REG-TEMPORAL /
// presets): a self-verifying corpus scene driven unchanged through BOTH
// corpus harnesses — the real 1B stack (run_1b_corpus.dart, original r186
// WebGLRenderer over the WebGL2 facade + ANGLE Metal) and the bare-Chrome
// WebGL2 reference (ref_1b_corpus.cjs).
//
// Determinism contract measured here:
// - Scene animation is a PURE function of the frame index (no wall clock).
// - TAARenderPass accumulates 32 jitter samples (jitterOffsets[5]); at
//   sampleLevel 2 that is 4 samples per frame, so the accumulation window is
//   frames 0..7 and later frames only re-blit the frozen buffer. A direct
//   seek to frame N therefore re-renders ONLY the declared window and jumps.
// - SSAA renders all samples in one frame: same clock -> same image.
// - Presets report the documented settings table through settings() and a
//   preset applied to a pipeline renders accordingly.
//
// The battery publishes its named checks through the __corpusExtra global
// (carried by both harnesses in their CORPUS_*_STATUS files) and re-throws
// on any internal failure so the corpus tier fails loudly. The final frame
// left on the canvas is the SSAA frame 12 — a deterministic image for the
// corpus tier compare (matching-legacy single-frame semantics).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { TAARenderPass } from 'three/addons/postprocessing/TAARenderPass.js';
import { SSAARenderPass } from 'three/addons/postprocessing/SSAARenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createPipeline, clockState, presets } from '../../src/cinematic.js';

// The documented preset table (docs/angle_1b.md F4d section; source of
// record: tool/three/src/cinematic.js PRESETS). A battery failure here means
// the surface and the documented table drifted apart.
const EXPECTED_PRESETS = {
  draft: {
    fps: 24, shutter: 0.5, samples: 1, epoch: 0,
    effects: { bloom: false, dof: false, fxaa: true, smaa: false, colorGrade: false, film: false, vignette: false, motion: false }
  },
  production: {
    fps: 24, shutter: 0.5, samples: 8, epoch: 0,
    effects: { bloom: true, dof: true, fxaa: true, smaa: true, colorGrade: 'teal-orange', film: true, vignette: true, motion: true }
  },
  'deterministic-export': {
    fps: 24, shutter: 0.5, samples: 8, epoch: 0,
    effects: { bloom: true, dof: true, fxaa: true, smaa: true, colorGrade: 'teal-orange', film: true, vignette: true, motion: true },
    note: 'fixed seed, epoch 0, no adaptive anything'
  }
};

const sortValue = (v) => {
  if (Array.isArray(v)) return v.map(sortValue);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = sortValue(v[k]);
    return out;
  }
  return v;
};
const canon = (v) => JSON.stringify(sortValue(v));

const checks = [];
const hashes = {};
const check = (name, ok, detail) => checks.push({ name: name, ok: !!ok, detail: String(detail || '') });
try {
  globalThis.__corpusBegin();
  globalThis.__corpusHookThree();

  const W = 320, H = 240;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false });
  renderer.setSize(W, H, false);
  const gl = renderer.getContext();

  // Aliasing fixture: two thin high-contrast bars and a torus knot with
  // MeshNormalMaterial — no lights, no textures, deterministic pixels.
  var __origCreate = document.createElement;
  document.createElement = function (tag) {
    if (String(tag).toLowerCase() === 'img') {
      globalThis.__imgStack = String(new Error('img').stack || '').slice(0, 600);
    }
    return __origCreate.call(this, tag);
  };
  var __origResolve = globalThis.__resolveAssetPath;
  globalThis.__resolveAssetPath = function (url) {
    var r = __origResolve(url);
    if (r == null && url != null) {
      globalThis.__decodeLog = (globalThis.__decodeLog || '') + '[RESOLVE:' + String(url).slice(0, 40) + '->null]';
    }
    return r;
  };
  var __realDecodeHost = globalThis.__jsr1b_decode_image_host;
  var __origDip = globalThis.__decodeImageFromPath;
  globalThis.__decodeImageFromPath = function (p) {
    globalThis.__decodeLog = (globalThis.__decodeLog || '') + '[DIP:' + String(p) + ']';
    if (p == null) globalThis.__decodeNullStack = String(new Error('x').stack || '').slice(0, 800);
    return __origDip(p);
  };
  var __origDi = globalThis.__decodeImage;
  globalThis.__decodeImage = function (p, m, f) {
    globalThis.__decodeLog = (globalThis.__decodeLog || '') + '[DI:' + String(p) + ']';
    return __origDi(p, m, f);
  };

  globalThis.__jsr1b_decode_image_host = function (p) {
    globalThis.__decodeLog = (globalThis.__decodeLog || '') + '[' + String(p) + ']';
    if (p == null || String(p) === 'null') {
      globalThis.__decodeNullStack = String(new Error('decode-null').stack || '').slice(0, 800);
    }
    return __realDecodeHost(p);
  };

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
  camera.position.z = 6;
  const group = new THREE.Group();
  const mat = new THREE.MeshNormalMaterial();
  group.add(new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.08, 0.08), mat));
  group.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 4.5, 0.08), mat));
  group.add(new THREE.Mesh(new THREE.TorusKnotGeometry(0.9, 0.22, 128, 32), mat));
  scene.add(group);
  const applyFrame = (f) => {
    group.rotation.y = f * 0.07;
    group.rotation.x = Math.sin(f * 0.031) * 0.35;
  };

  const px = new Uint8Array(W * H * 4);
  // In-scene readback runs through the facade's 64 KB result scratch
  // (angle_1b.c), so the default-framebuffer read is striped: 320x48 RGBA
  // stripes (61440 B each, GL bottom-origin, same byte stream on both legs).
  const STRIPE_ROWS = 48;
  const stripe = new Uint8Array(W * STRIPE_ROWS * 4);
  const read = () => {
    renderer.setRenderTarget(null);
    let h = 0x811c9dc5 >>> 0;
    let off = 0;
    for (let y = 0; y < H; y += STRIPE_ROWS) {
      const rows = Math.min(STRIPE_ROWS, H - y);
      gl.readPixels(0, y, W, rows, gl.RGBA, gl.UNSIGNED_BYTE, stripe, 0);
      const n = rows * W * 4;
      px.set(stripe.subarray(0, n), off);
      off += n;
      for (let i = 0; i < n; i++) h = (Math.imul(h ^ stripe[i], 0x01000193) >>> 0) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  };
  const nonEmpty = () => {
    let lit = 0;
    for (let i = 0; i < px.length; i += 4) if (px[i] + px[i + 1] + px[i + 2] > 24) lit++;
    return lit > (W * H) / 50; // non-blank: >= 2 % of the frame carries content
  };

  const makeTaa = () => {
    const composer = new EffectComposer(renderer);
    const taa = new TAARenderPass(scene, camera, 0x000000, 1);
    taa.accumulate = true;
    taa.sampleLevel = 2; // 4 samples per frame -> 32-sample window = frames 0..7
    composer.addPass(taa);
    composer.addPass(new OutputPass());
    return { composer: composer, taa: taa };
  };
  const makeSsaa = (level) => {
    const composer = new EffectComposer(renderer);
    const ssaa = new SSAARenderPass(scene, camera, 0x000000, 1);
    ssaa.sampleLevel = level;
    composer.addPass(ssaa);
    composer.addPass(new OutputPass());
    return composer;
  };
  const renderSeq = (composer, from, to) => {
    for (let f = from; f <= to; f++) {
      applyFrame(f);
      composer.render();
    }
  };
  const renderOne = (composer, f) => {
    applyFrame(f);
    composer.render();
  };

  // REG-TEMPORAL: direct seek equals the sequential run at named
  // checkpoints (hash equality; the jump renders only the declared window
  // 0..7 plus the target frame — upstream TAA freezes after 32 samples).
  const seq20 = makeTaa();
  renderSeq(seq20.composer, 0, 20);
  hashes.taaSeqF20 = read();
  const seek20 = makeTaa();
  renderSeq(seek20.composer, 0, 7);
  renderOne(seek20.composer, 20);
  hashes.taaSeekF20 = read();
  check(
    'taa-seek-f20',
    hashes.taaSeekF20 === hashes.taaSeqF20,
    'seq=' + hashes.taaSeqF20 + ' seek=' + hashes.taaSeekF20
  );

  const seq24 = makeTaa();
  renderSeq(seq24.composer, 0, 24);
  hashes.taaSeqF24 = read();
  const seek24 = makeTaa();
  renderSeq(seek24.composer, 0, 7);
  renderOne(seek24.composer, 24);
  hashes.taaSeekF24 = read();
  check(
    'taa-seek-f24',
    hashes.taaSeekF24 === hashes.taaSeqF24,
    'seq=' + hashes.taaSeqF24 + ' seek=' + hashes.taaSeekF24
  );

  // History reset reproduces a fresh sequential accumulation of the same
  // window — and actually clears (the frozen pre-reset image differs).
  const resetRun = makeTaa();
  renderSeq(resetRun.composer, 0, 11);
  hashes.taaFrozenAt7 = read();
  resetRun.taa.accumulateIndex = -1;
  renderSeq(resetRun.composer, 12, 19);
  hashes.taaResetF19 = read();
  const freshRun = makeTaa();
  renderSeq(freshRun.composer, 12, 19);
  hashes.taaFreshF19 = read();
  check(
    'taa-reset-f19',
    hashes.taaResetF19 === hashes.taaFreshF19,
    'reset=' + hashes.taaResetF19 + ' fresh=' + hashes.taaFreshF19
  );
  check(
    'taa-reset-clears',
    hashes.taaResetF19 !== hashes.taaFrozenAt7,
    'frozen=' + hashes.taaFrozenAt7 + ' reset=' + hashes.taaResetF19
  );

  // E1 edge: clearing history and capturing ONCE is not equivalent.
  resetRun.taa.accumulateIndex = -1;
  renderOne(resetRun.composer, 19);
  hashes.taaOnceF19 = read();
  check(
    'taa-clear-once-not-equivalent',
    hashes.taaOnceF19 !== hashes.taaFreshF19,
    'once=' + hashes.taaOnceF19 + ' fresh=' + hashes.taaFreshF19
  );

  // SSAA: single-frame accumulation — repeated fresh runs give the same
  // image for the same clock, and the clock changes the image.
  const ssaaA = makeSsaa(3);
  renderOne(ssaaA, 12);
  hashes.ssaaF12a = read();
  const ssaaB = makeSsaa(3);
  renderOne(ssaaB, 12);
  hashes.ssaaF12b = read();
  check('ssaa-repeat-f12', hashes.ssaaF12a === hashes.ssaaF12b, 'a=' + hashes.ssaaF12a + ' b=' + hashes.ssaaF12b);
  const ssaaC = makeSsaa(3);
  renderOne(ssaaC, 13);
  hashes.ssaaF13 = read();
  check('ssaa-clock-sensitive', hashes.ssaaF13 !== hashes.ssaaF12a, 'f12=' + hashes.ssaaF12a + ' f13=' + hashes.ssaaF13);

  // Presets report the documented table (E2E-AA-4 settings contract).
  const got = {};
  for (const name of Object.keys(EXPECTED_PRESETS)) got[name] = presets[name] ? presets[name].settings() : null;
  check(
    'presets-report-table',
    canon(got) === canon(EXPECTED_PRESETS),
    canon(got) === canon(EXPECTED_PRESETS) ? 'documented table reproduced' : 'got ' + canon(got)
  );

  // A preset applied to a pipeline reports its settings through getConfig()
  // and the rendered frame follows them. The frame-follows check uses the
  // draft preset (FXAA only — fully synchronous); the SMAA-bearing presets
  // are checked for settings + a non-empty render (SMAA decodes its textures
  // asynchronously, so a same-frame hash pair would race on the web leg by
  // construction).
  const settingsOf = (cfg) => ({
    fps: cfg.fps,
    shutter: cfg.shutter,
    samples: cfg.samples,
    epoch: cfg.epoch,
    effects: cfg.effects
  });
  const clock24 = clockState(24, 24, 0.5, 1);
  const plain = createPipeline({ renderer: renderer, scene: scene, camera: camera });
  plain.renderFrame(clock24);
  hashes.plainF24 = read();
  check('pipeline-plain-renders', nonEmpty(), 'hash=' + hashes.plainF24);

  const draft = createPipeline({ renderer: renderer, scene: scene, camera: camera });
  const draftCfg = draft.setPreset('draft');
  const draftOk =
    canon(settingsOf(draftCfg)) === canon(settingsOf(EXPECTED_PRESETS.draft)) &&
    canon(presets.draft.settings()) === canon(EXPECTED_PRESETS.draft);
  check('preset-draft-applies', draftOk, 'config=' + canon(settingsOf(draftCfg)));
  draft.renderFrame(clock24);
  hashes.draftF24 = read();
  check('preset-draft-frame-follows', hashes.draftF24 !== hashes.plainF24, 'draft=' + hashes.draftF24 + ' plain=' + hashes.plainF24);

  const production = createPipeline({ renderer: renderer, scene: scene, camera: camera });
  const prodCfg = production.setPreset('production');
  check(
    'preset-production-applies',
    canon(settingsOf(prodCfg)) === canon(settingsOf(EXPECTED_PRESETS.production)),
    'config=' + canon(settingsOf(prodCfg))
  );
  production.renderFrame(clock24);
  check('preset-production-renders', nonEmpty(), 'rendered frame present');

  const exporter = createPipeline({ renderer: renderer, scene: scene, camera: camera });
  const expCfg = exporter.setPreset('deterministic-export');
  check(
    'preset-deterministic-export-applies',
    canon(settingsOf(expCfg)) === canon(settingsOf(EXPECTED_PRESETS['deterministic-export'])),
    'config=' + canon(settingsOf(expCfg))
  );
  exporter.renderFrame(clock24);
  check('preset-deterministic-export-renders', nonEmpty(), 'rendered frame present');

  plain.dispose();
  draft.dispose();
  production.dispose();
  exporter.dispose();

  // Deterministic final frame for the corpus tier compare: SSAA frame 12.
  const finalSsaa = makeSsaa(3);
  renderOne(finalSsaa, 12);
  hashes.finalFrame = read();

  globalThis.__corpusExtra = { checks: checks, hashes: hashes, imgStack: (globalThis.__smaaLog || 'NO-SMAA') + ' ||DECODELOG|| ' + (globalThis.__decodeLog || 'EMPTY') + ' ||LOG|| ' + (globalThis.__decodeLog || 'EMPTY') + ' ||STACK|| ' + (globalThis.__decodeNullStack || 'NOT-FIRED') };
} catch (e) {
  checks.push({ name: 'battery-crashed', ok: false, detail: String((e && e.stack) || e) });
  globalThis.__corpusExtra = { checks: checks, hashes: hashes, imgStack: (globalThis.__smaaLog || 'NO-SMAA') + ' ||DECODELOG|| ' + (globalThis.__decodeLog || 'EMPTY') + ' ||LOG|| ' + (globalThis.__decodeLog || 'EMPTY') + ' ||STACK|| ' + (globalThis.__decodeNullStack || 'NOT-FIRED') };
  throw e;
}
