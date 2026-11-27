// ref_1b_showcase.cjs — E2E-SHOWCASE-1 web leg (issue #8, F4a): the CORE
// cinematic pipeline (example/web/cinematic_core.mjs — the build of
// tool/three/src/cinematic.js) and the LEGACY private showcase copy
// (materialized from the pinned base commit by showcase_1b.sh) render the
// SAME checkpoints in the SAME Chrome session; every checkpoint must be
// hash-equal (FNV-1a over the RGBA readback, same algorithm as
// cinematic_reference.mjs).
//
// The checkpoints pin the bloom/DOF/FXAA/colorGrade/film chain and the
// subframe-accumulation path. SMAA and vignette are deliberately off:
// SMAA's lookup textures decode asynchronously through Image onload, which
// would race the two variants on timing rather than math (SMAA parity is
// the corpus lanes' concern, F4b+); vignette carries a FIXED defect in the
// legacy copy (it read the wrong uniform name and crashed on every request)
// that the core module repairs — a legacy checkpoint with vignette enabled
// cannot exist, so vignette parity is F4b's E2E-FINISH-* scope.
//
// Run from the repo root (showcase_1b.sh drives it):
//   node tool/three/ref_1b_showcase.cjs \
//     --legacy /tmp/a1b_showcase/legacy/cinematic_bundle.mjs
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.JSR_PLAYWRIGHT_PATH || '/tmp/node_modules/playwright');

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : dflt; };
const kLegacy = path.resolve(opt('legacy', '/tmp/a1b_showcase/legacy/cinematic_bundle.mjs'));
const kWebDir = path.resolve(__dirname, '../../example/web');
const kChannel = process.env.JSR_WEBGL_REF_CHANNEL || 'chrome';

const W = 320, H = 180;

// The named checkpoints (id -> clock + effect config). All share fps 24 and
// shutter 0.5; since F4c1 they all run samples 1.
//
// F4c1 changes, two reasons:
// 1. motion stays FALSE in every checkpoint: since F4c1 the motion effect
//    selects the JSR-owned CinematicMotionBlurPass (ADR-0005), which the
//    legacy base-commit copy has no equivalent of — a motion:true checkpoint
//    would compare the core chain pass against the legacy inline accumulator
//    and can never be hash-equal. The motion pass itself is covered by the
//    F4c1 legs (tool/three/cases_f4c1.sh, E2E-MOTION-*) where both sides run
//    the core module.
// 2. samples 8 -> 1: the F4c1 root-cause fix suppresses renderer autoClear
//    inside the subframe accumulators (both the chain pass and the legacy
//    inline accumulator). Before the fix every accumulated frame came out
//    darkened by the subframe count (the clear-before-every-draw
//    last-write-wins bug) — the base-commit legacy copy still carries that
//    bug, so samples>1 checkpoints cannot stay hash-equal across the two
//    variants. The legacy==core gate pins the SHARED pass chain at samples 1;
//    the fixed accumulation is proven 1B-vs-web in cases_f4c1 (E2E-MOTION-*).
const CHECKPOINTS = [
  { id: 'draft-frame12', frame: 12, mode: 'direct', samples: 1,
    effects: { bloom: false, dof: false, fxaa: true, smaa: false, colorGrade: false, film: false, vignette: false, motion: false } },
  { id: 'finish-direct-frame20', frame: 20, mode: 'direct', samples: 1,
    effects: { bloom: true, dof: true, fxaa: true, smaa: false, colorGrade: 'teal-orange', film: true, vignette: false, motion: false } },
  { id: 'finish-seek-frame20', frame: 20, mode: 'sequential', samples: 1,
    effects: { bloom: true, dof: true, fxaa: true, smaa: false, colorGrade: 'teal-orange', film: true, vignette: false, motion: false } },
  { id: 'export-frame9', frame: 9, mode: 'direct', samples: 1,
    effects: { bloom: true, dof: true, fxaa: true, smaa: false, colorGrade: 'teal-orange', film: true, vignette: false, motion: false } },
];

// ── ESM unwrapping: the pinned three build (jsr_three_web.js = upstream
// three.module.js + three.core.js) is wrapped into plain scripts exactly
// like ref_1b_corpus.cjs does for the corpus legs.
function braceList(line, open, close) {
  const a = line.indexOf(open) + open.length, b = line.lastIndexOf(close);
  if (a <= 0 || b < a) throw new Error('ESM list parse failed: ' + line.slice(0, 60));
  return line.slice(a, b).split(',').map((s) => s.trim()).filter((s) => s.length > 0);
}
function dropLines(src) {
  return src.split('\n').filter((l) => {
    const t = l.trimLeft();
    return !t.startsWith('import ') && !t.startsWith('export {');
  }).join('\n');
}
function wrapThreeCore(core) {
  const exportLine = core.split('\n').find((l) => l.trimLeft().startsWith('export {'));
  if (!exportLine) throw new Error('three.core.js: no export line');
  const exports = braceList(exportLine, 'export {', '};');
  return '(function () {\n' + dropLines(core) + '\nglobalThis.__threeCore = { ' + exports.join(', ') + ' };\n})();';
}
function wrapThreeModule(module) {
  const lines = module.split('\n');
  const importLine = lines.find((l) => l.trimLeft().startsWith('import {'));
  if (!importLine) throw new Error('jsr_three_web.js: no import line');
  const importNames = braceList(importLine, 'import {', '} from');
  const exportLines = lines.filter((l) => l.trimLeft().startsWith('export {'));
  const reExportLines = exportLines.filter((l) => l.includes('} from'));
  if (reExportLines.length !== 1 || exportLines.length !== 2) throw new Error('jsr_three_web.js export shape changed');
  const reExportNames = braceList(reExportLines[0], 'export {', '} from');
  const exportNames = braceList(exportLines[exportLines.length - 1], 'export {', '};');
  const coreBridge = reExportNames.map((n) => n + ': __threeCore["' + n + '"]').join(', ');
  return '(function () {\nconst { ' + importNames.join(', ') + ' } = globalThis.__threeCore;\n' + dropLines(module) + '\n' +
    'globalThis.THREE = Object.assign({ ' + coreBridge + ' }, { ' + exportNames.join(', ') + ' });\n})();';
}

// The core cinematic ESM and the scene bundle are self-contained modules
// (the 'three' global shim is inlined by the bundler). Expose their exports
// on globalThis so plain page code can drive them.
function asModuleWithGlobal(source, globalName, names) {
  return source + '\nglobalThis.' + globalName + ' = { ' + names.join(', ') + ' };\n';
}

// The in-page renderer: one checkpoint, one pipeline variant. Everything is
// rebuilt per variant so the two implementations never share state.
const pageMain = `
async function runCheckpoint(variant, cp) {
  const THREE = globalThis.THREE;
  const canvas = document.createElement('canvas');
  canvas.width = ${W}; canvas.height = ${H};
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false });
  renderer.setSize(${W}, ${H}, false);
  renderer.setPixelRatio(1);
  const scene = variant.createScene();
  const camera = scene.userData.camera;
  camera.aspect = ${W} / ${H};
  camera.updateProjectionMatrix();
  const create = variant.createPipeline;
  const pipeline = create({
    renderer: renderer, scene: scene, camera: camera,
    effects: cp.effects, alpha: false
  });
  pipeline.updateScene = variant.updateScene;
  pipeline.resetHistory(0);
  const cs = variant.clockState;
  if (cp.mode === 'direct') {
    pipeline.renderFrame(cs(cp.frame, 24, 0.5, cp.samples, 0));
  } else {
    for (let f = 0; f <= cp.frame; f++) pipeline.renderFrame(cs(f, 24, 0.5, cp.samples, 0));
  }
  const gl = renderer.getContext();
  const px = new Uint8Array(${W} * ${H} * 4);
  gl.readPixels(0, 0, ${W}, ${H}, gl.RGBA, gl.UNSIGNED_BYTE, px);
  let uniform = true; // every pixel identical = nothing rendered (black-composer class)
  for (let i = 4; i < px.length; i += 4) {
    if (px[i] !== px[0] || px[i + 1] !== px[1] || px[i + 2] !== px[2] || px[i + 3] !== px[3]) { uniform = false; break; }
  }
  let hash = 0x811c9dc5;
  for (let i = 0; i < px.length; i++) {
    hash ^= px[i];
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  pipeline.dispose();
  renderer.dispose();
  const lose = gl.getExtension('WEBGL_lose_context');
  if (lose) lose.loseContext();
  return { hash: '0x' + (hash >>> 0).toString(16).padStart(8, '0'), uniform: uniform, unsupported: pipeline.unsupported };
}
globalThis.__runCheckpoint = runCheckpoint;
globalThis.__VARIANTS = {
  core: {
    createPipeline: (o) => globalThis.__CINE_CORE.createPipeline(o),
    clockState: (...a) => globalThis.__CINE_CORE.clockState(...a),
    createScene: () => globalThis.__SHOWCASE_SCENE.createShowcaseScene({
      seed: 1,
      seededRandom: globalThis.__CINE_CORE.cinematicRandom
    }),
    updateScene: (s, c) => globalThis.__SHOWCASE_SCENE.updateShowcaseScene(s, c)
  },
  legacy: {
    createPipeline: (o) => globalThis.__CINE_LEGACY.createCinematicPipeline(o),
    clockState: (...a) => globalThis.__CINE_LEGACY.clockState(...a),
    createScene: () => globalThis.__CINE_LEGACY.createShowcaseScene({ seed: 1 }),
    updateScene: (s, c) => globalThis.__CINE_LEGACY.updateShowcaseScene(s, c)
  }
};
`;

(async () => {
  const legacySource = fs.readFileSync(kLegacy, 'utf8');
  const coreSource = fs.readFileSync(path.join(kWebDir, 'cinematic_core.mjs'), 'utf8');
  const sceneSource = fs.readFileSync(path.join(kWebDir, 'showcase_scene.mjs'), 'utf8');
  const threeCore = wrapThreeCore(fs.readFileSync(path.join(kWebDir, 'three.core.js'), 'utf8'));
  const threeModule = wrapThreeModule(fs.readFileSync(path.join(kWebDir, 'jsr_three_web.js'), 'utf8'));

  const browser = await chromium.launch({ channel: kChannel, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: W + 40, height: H + 40 } });
    page.on('pageerror', (e) => console.error('[pageerror] ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') console.error('[console] ' + m.text()); });
    await page.setContent('<!doctype html><html><body></body></html>');

    // 1) the pinned three (plain scripts, then globalThis.THREE)
    await page.addScriptTag({ content: threeCore });
    await page.addScriptTag({ content: threeModule });
    // 2) the pipeline variants as module scripts exposing their exports
    await page.addScriptTag({
      type: 'module',
      content: asModuleWithGlobal(coreSource, '__CINE_CORE',
        ['createPipeline', 'clockState', 'probeCapabilities', 'cinematicRandom']),
    });
    await page.addScriptTag({
      type: 'module',
      content: asModuleWithGlobal(sceneSource, '__SHOWCASE_SCENE',
        ['createShowcaseScene', 'updateShowcaseScene']),
    });
    await page.addScriptTag({
      type: 'module',
      content: asModuleWithGlobal(legacySource, '__CINE_LEGACY',
        ['createCinematicPipeline', 'clockState', 'createShowcaseScene', 'updateShowcaseScene', 'probeCapabilities']),
    });
    await page.addScriptTag({ content: pageMain });

    const variants = await page.evaluate(() => ({
      core: {
        createPipeline: (o) => globalThis.__CINE_CORE.createPipeline(o),
        clockState: (...a) => globalThis.__CINE_CORE.clockState(...a),
        createScene: () => globalThis.__SHOWCASE_SCENE.createShowcaseScene({
          seed: 1,
          seededRandom: globalThis.__CINE_CORE.cinematicRandom
        }),
        updateScene: (s, c) => globalThis.__SHOWCASE_SCENE.updateShowcaseScene(s, c)
      },
      legacy: {
        createPipeline: (o) => globalThis.__CINE_LEGACY.createCinematicPipeline(o),
        clockState: (...a) => globalThis.__CINE_LEGACY.clockState(...a),
        createScene: () => globalThis.__CINE_LEGACY.createShowcaseScene({ seed: 1 }),
        updateScene: (s, c) => globalThis.__CINE_LEGACY.updateShowcaseScene(s, c)
      }
    }));

    let match = 0;
    let uniformFail = false;
    for (const cp of CHECKPOINTS) {
      const result = await page.evaluate(async ({ cp }) => {
        const legacy = await globalThis.__runCheckpoint(globalThis.__VARIANTS.legacy, cp);
        const core = await globalThis.__runCheckpoint(globalThis.__VARIANTS.core, cp);
        return { legacy: legacy, core: core };
      }, { cp });
      const ok = result.legacy.hash === result.core.hash;
      const uniformLeg = result.legacy.uniform || result.core.uniform;
      if (uniformLeg) {
        uniformFail = true;
        console.log('SHOWCASE_UNIFORM_FRAME ' + cp.id +
          ' legacy=' + result.legacy.hash + ' core=' + result.core.hash +
          ' — checkpoint frame is uniform (every pixel identical): nothing rendered; failing the leg');
      }
      if (ok) match++;
      console.log(
        'SHOWCASE_CHECKPOINT ' + cp.id +
        ' legacy=' + result.legacy.hash +
        ' core=' + result.core.hash +
        ' match=' + ok
      );
      if (!ok) {
        console.log('  legacy.unsupported=' + JSON.stringify(result.legacy.unsupported));
        console.log('  core.unsupported=' + JSON.stringify(result.core.unsupported));
      }
    }
    console.log('SHOWCASE_SUMMARY checkpoints=' + CHECKPOINTS.length + ' match=' + match);
    if (match !== CHECKPOINTS.length || uniformFail) process.exit(1);
    process.exit(0);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error('SHOWCASE_ERROR ' + (e && e.message ? e.message : e));
  process.exit(1);
});
