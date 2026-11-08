// Standalone ground-truth driver for the deterministic cinematic pipeline
// (js_widget_runtime issue #8). NO Flutter: real upstream three r186 from
// example/web/jsr_three_web.js (see ?bundle=) on a plain WebGL2 canvas.
//
// Query params:
//   frame=N          target frame index (default 24)
//   mode=direct      render straight to frame N (resetHistory(0) first)
//   mode=sequential  render frames 0..N in order (epoch/history equivalence)
//   fps=24           frame rate
//   shutter=0.5      shutter fraction (0..1]
//   samples=8        subframe samples
//   effects=bloom,dof,fxaa,smaa,colorGrade,film,vignette,motion
//   preset=production|draft|deterministic-export
//   w=480 h=320      canvas size
//   alpha=1          transparent clear
//   bundle=./jsr_three_web.js   three ESM bundle URL
//   addons=/tmp/jsr-three-r186/examples/jsm/  unused by this build (addons
//                  are pre-bundled into ./cinematic_bundle.mjs); accepted for
//                  forward compatibility
//
// Result: FNV-1a 32-bit hash over the RGBA bytes + stats go to
// document.title AND <pre id=out>. Render ms logged to console.

const out = document.getElementById('out');
const canvas = document.getElementById('c');
const params = new URLSearchParams(location.search);

const num = (key, dflt) => {
  const v = Number(params.get(key));
  return Number.isFinite(v) && v > 0 ? v : dflt;
};
const frame = Math.max(0, Math.floor(num('frame', 24)));
const fps = num('fps', 24);
const shutter = Math.min(1, num('shutter', 0.5));
const samples = Math.max(1, Math.min(64, Math.floor(num('samples', 8))));
const alpha = params.get('alpha') === '1';
const mode = params.get('mode') === 'sequential' ? 'sequential' : 'direct';
const bundleUrl = params.get('bundle') || './jsr_three_web.js';
const w = Math.floor(num('w', 480));
const h = Math.floor(num('h', 320));

function fail(err) {
  const message = String(err && err.stack || err);
  out.textContent = 'ERROR\n' + message;
  document.title = 'cinematic:error';
  console.error(err);
}

function fnv1a(bytes) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i];
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

async function main() {
  canvas.width = w;
  canvas.height = h;
  const THREE = await import(bundleUrl);
  globalThis.THREE = THREE;
  const bundle = await import('./cinematic_bundle.mjs');
  const { createShowcaseScene, updateShowcaseScene, createCinematicPipeline, clockState } = bundle;

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: alpha });
  renderer.setSize(w, h, false);
  renderer.setPixelRatio(1);

  // createShowcaseScene returns the Scene itself; its animated camera lives
  // at scene.userData.camera (exactly what src/widget.js passes to the
  // pipeline, so both lanes orbit identically).
  const scene = createShowcaseScene({ THREE: THREE, seed: 1, alpha: alpha });
  const camera = scene.userData.camera;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  const presetParam = params.get('preset');
  const effectsList = (params.get('effects') || 'bloom,dof,fxaa').split(',').map(s => s.trim()).filter(Boolean);
  const effects = {};
  for (const name of ['bloom', 'dof', 'fxaa', 'smaa', 'colorGrade', 'film', 'vignette', 'motion']) {
    effects[name] = effectsList.includes(name);
  }
  if (effects.motion && samples < 2) effects.motion = false;

  const capabilities = bundle.probeCapabilities(renderer);
  const pipeline = createCinematicPipeline({
    renderer: renderer,
    scene: scene,
    camera: camera,
    capabilities: capabilities,
    effects: effects,
    alpha: alpha
  });
  pipeline.updateScene = updateShowcaseScene;
  if (presetParam) pipeline.setPreset(presetParam);
  pipeline.setQuality({ fps: fps, shutter: shutter, samples: samples });

  const t0 = performance.now();
  if (mode === 'direct') {
    pipeline.resetHistory(0);
    pipeline.renderFrame(clockState(frame, fps, shutter, samples, 0));
  } else {
    pipeline.resetHistory(0);
    for (let f = 0; f <= frame; f++) {
      pipeline.renderFrame(clockState(f, fps, shutter, samples, 0));
    }
  }
  const elapsedMs = performance.now() - t0;
  console.log('[cinematic] render ' + mode + ' frame=' + frame + ' in ' + elapsedMs.toFixed(1) + ' ms');

  const gl = renderer.getContext();
  const px = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);

  const hash = fnv1a(px);
  let sum = 0;
  let alphaSum = 0;
  let nonBlack = 0;
  const count = w * h;
  for (let i = 0; i < count; i++) {
    const r = px[i * 4];
    const g = px[i * 4 + 1];
    const b = px[i * 4 + 2];
    const a = px[i * 4 + 3];
    sum += r + g + b;
    alphaSum += a;
    if (r + g + b > 12) nonBlack++;
  }
  const result = {
    hash: '0x' + hash.toString(16).padStart(8, '0'),
    stats: {
      mean: Number((sum / (count * 3)).toFixed(3)),
      alphaMean: Number((alphaSum / count).toFixed(3)),
      nonBlackFraction: Number((nonBlack / count).toFixed(4))
    },
    frame: frame,
    mode: mode,
    renderMs: Number(elapsedMs.toFixed(1)),
    config: {
      fps: fps,
      shutter: shutter,
      samples: samples,
      effects: effects,
      preset: presetParam || null,
      w: w,
      h: h,
      alpha: alpha
    },
    lane: pipeline.lane,
    unsupported: pipeline.unsupported
  };
  const json = JSON.stringify(result, null, 2);
  out.textContent = json;
  document.title = 'cinematic:' + result.hash + ':' + frame + ':' + mode;
  console.log('[cinematic] hash ' + result.hash + ' mean ' + result.stats.mean);
}

main().catch(fail);
