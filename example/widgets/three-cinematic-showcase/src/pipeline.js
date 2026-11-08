// Deterministic cinematic pipeline (js_widget_runtime issue #8).
//
// Lane facts this module encodes (native R1 v6-v8 vs web WebGL2):
//   both lanes : RenderPass, UnrealBloomPass, BokehPass, FXAA, OutputPass
//   web-only   : SMAA (v1 lane split), LUT color grading, FilmPass, vignette
//                custom GLSL, half-float accumulation for subframe sampling
//   unsupported effects are NEVER skipped silently: they land in
//   pipeline.unsupported as { effect, reason } and are excluded from the pass
//   chain.
//
// Determinism contract: rendering is a pure function of the explicit clock
// state produced by clockState(). The pipeline never reads Date.now(),
// performance.now() or any wall clock; the widget RAF loop converts elapsed
// milliseconds to a frame index BEFORE calling renderFrame().

import {
  AdditiveBlending,
  Color,
  Data3DTexture,
  HalfFloatType,
  LinearFilter,
  RGBAFormat,
  ShaderMaterial,
  UnsignedByteType,
  Vector2,
  WebGLRenderTarget
} from 'three';
// Pinned r186 postprocessing addon set, pre-concatenated into ONE module by
// build.mjs (src/addons_bundle.js, generated from the byte-identical pinned
// sources under src/addons/). Single-module imports keep the bundler's file
// reads minimal and deterministic.
import {
  EffectComposer,
  RenderPass,
  ShaderPass,
  OutputPass,
  UnrealBloomPass,
  BokehPass,
  LUTPass,
  FilmPass,
  SMAAPass,
  FullScreenQuad,
  FXAAShader,
  VignetteShader
} from './addons_bundle.js';

// ── Deterministic RNG ──────────────────────────────────────────────────────

// Named pipeline error: `name`/`code` carry a stable machine-readable string
// ('cinematic.captureUnavailable', 'cinematic.notCapturable', ...) so hosts
// can branch on the code instead of matching message text.
export class CinematicPipelineError extends Error {
  constructor(code, message) {
    super(message);
    this.name = code;
    this.code = code;
  }
}

// mulberry32: tiny seeded PRNG returning floats in [0, 1). Exported as
// cinematicRandom. Pure: same seed -> same stream on every lane and engine.
export function mulberry32(seed) {
  let a = (seed === undefined ? 0 : seed) >>> 0;
  return function next() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const cinematicRandom = mulberry32;

// ── Explicit frame clock ───────────────────────────────────────────────────

// clockState(frame, fps, shutter, samples, epoch = 0) — pure object.
//
// Frame `frame` covers the wall-time window centered at frame/fps with a
// width of (shutter/fps) seconds. Subframe times use UNIFORM-STRATIFIED
// SAMPLING with a deterministic jitter: subframe i of N occupies the stratum
// [i/N, (i+1)/N) of the shutter window and is placed at
//   t_i = windowStart + window * (i + jitter_i) / N
// with jitter_i = cinematicRandom(frame * N + i)(). The jitter is a pure
// function of (frame, N, i) in a fixed evaluation order, so direct-to-frame-N
// rendering and sequential 0..N rendering produce bit-identical subframe
// times. Every subframe carries weight 1/N.
export function clockState(frame, fps, shutter, samples, epoch) {
  const f = Math.floor(Number(frame));
  if (!Number.isFinite(f) || f < 0) throw new Error('cinematic.invalid: frame must be a non-negative integer');
  const rate = Number(fps);
  if (!Number.isFinite(rate) || rate <= 0) throw new Error('cinematic.invalid: fps must be > 0');
  const sh = Number(shutter);
  if (!Number.isFinite(sh) || sh <= 0 || sh > 1) throw new Error('cinematic.invalid: shutter must be in (0, 1]');
  const n = Math.floor(Number(samples));
  if (!Number.isFinite(n) || n < 1) throw new Error('cinematic.invalid: samples must be >= 1');
  const ep = (epoch === undefined ? 0 : epoch) >>> 0;

  const frameTime = f / rate;
  const window = sh / rate;
  const start = frameTime - window / 2;
  const subframes = new Array(n);
  for (let i = 0; i < n; i++) {
    // Fixed order, fixed arithmetic — the jitter stream is indexed by the
    // absolute subframe ordinal (frame * samples + i), never by wall time.
    const jitter = cinematicRandom((((f % 2097152) * n + i) >>> 0))();
    subframes[i] = { t: start + window * (i + jitter) / n, weight: 1 / n };
  }
  return { frame: f, fps: rate, shutter: sh, samples: n, subframes: subframes, epoch: ep };
}

// ── Capability probe ───────────────────────────────────────────────────────

// probeCapabilities(renderer) — conservative detection. Anything uncertain
// reports false. The lane is attached as a NON-enumerable `lane` property so
// JSON snapshots of the capability object stay schema-clean.
export function probeCapabilities(renderer) {
  const caps = {
    halfFloatTargets: false,
    mrt: false,
    mipTargets: false,
    shaderProfiles: [],
    smaa: false,
    lut: false,
    bokeh: false,
    bloom: false,
    film: false,
    vignette: false,
    motionBlurAccum: false,
    pmrem: false,
    cubeCamera: false
  };

  let lane = 'web';
  let gl = null;
  let isGL2 = false;
  try {
    if (typeof renderer.getContext === 'function') gl = renderer.getContext();
  } catch (e) { gl = null; }

  const rc = renderer.capabilities || {};
  if (renderer.isJsrThreeRenderer === true || rc.backend === 'flutterGpu' || rc.r1 === true) {
    lane = 'native';
  }
  try {
    isGL2 = (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) ||
      rc.isWebGL2 === true || rc.webgl2 === true;
  } catch (e) { isGL2 = false; }

  if (lane === 'native') {
    // Native R1 v6-v8 facts: composer/bloom/dof run on bounded byte targets;
    // LUT works via a bounded profile; SMAA decodes through the host. No
    // half-float RTs, no MRT, no mip RT chains, no custom ShaderMaterial
    // GLSL outside bounded profiles, no PMREM/CubeCamera, no cross-frame
    // float accumulation history.
    caps.shaderProfiles = ['builtin-materials', 'bounded-lut-profile'];
    caps.smaa = true;
    caps.lut = true;
    caps.bokeh = true;
    caps.bloom = true;
  } else {
    let floatExt = null;
    try { floatExt = gl && isGL2 ? gl.getExtension('EXT_color_buffer_float') : null; } catch (e) { floatExt = null; }
    caps.halfFloatTargets = !!(isGL2 && floatExt);
    caps.mrt = !!isGL2;
    caps.mipTargets = !!isGL2;
    caps.shaderProfiles = isGL2 ? ['builtin-materials', 'custom-shader-material'] : ['builtin-materials'];
    caps.smaa = !!isGL2;
    caps.lut = !!isGL2; // LUTPass needs sampler3D (WebGL2)
    caps.bokeh = true;
    caps.bloom = true;
    caps.film = !!isGL2;
    caps.vignette = !!isGL2;
    caps.motionBlurAccum = caps.halfFloatTargets;
    caps.pmrem = !!isGL2;
    caps.cubeCamera = !!isGL2;
  }

  Object.defineProperty(caps, 'lane', { value: lane, enumerable: false });
  return caps;
}

// ── Generated LUTs (identity / teal-orange) ────────────────────────────────

function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }

// buildLutTexture(kind) — deterministic procedural 8^3 RGBA LUT as a
// Data3DTexture. `identity` maps every channel straight through; `teal-orange`
// is a fixed split-tone curve (teal in the shadows, warm orange highlights).
// Values are inline data generated from a fixed formula — same bytes on
// every run, lane and engine.
export function buildLutTexture(kind) {
  const N = 8;
  const data = new Uint8Array(N * N * N * 4);
  for (let z = 0; z < N; z++) {
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const r = x / (N - 1);
        const g = y / (N - 1);
        const b = z / (N - 1);
        let r2 = r;
        let g2 = g;
        let b2 = b;
        if (kind === 'teal-orange') {
          const shadow = 1 - r;
          r2 = clamp01(r + 0.14 * r * (1 - b) + 0.04 * shadow * g);
          g2 = clamp01(g * 0.94 + 0.05 * shadow * b + 0.02);
          b2 = clamp01(b * 0.88 + 0.16 * shadow * (1 - b));
        }
        const i = (x + y * N + z * N * N) * 4;
        data[i] = Math.round(clamp01(r2) * 255);
        data[i + 1] = Math.round(clamp01(g2) * 255);
        data[i + 2] = Math.round(clamp01(b2) * 255);
        data[i + 3] = 255;
      }
    }
  }
  const texture = new Data3DTexture(data, N, N, N);
  texture.format = RGBAFormat;
  texture.type = UnsignedByteType;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

// ── Presets ────────────────────────────────────────────────────────────────

const PRESETS = {
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

const EFFECT_NAMES = ['bloom', 'dof', 'fxaa', 'smaa', 'colorGrade', 'film', 'vignette', 'motion'];

export const DEFAULT_PRESETS = PRESETS;
export const PRESET_NAMES = Object.keys(PRESETS);

function deepCopy(value) { return JSON.parse(JSON.stringify(value)); }

// ── Pipeline factory ───────────────────────────────────────────────────────

// createCinematicPipeline({ renderer, scene, camera, capabilities?, effects? })
export function createCinematicPipeline(options) {
  const renderer = options.renderer;
  const scene = options.scene;
  const camera = options.camera;
  if (!renderer || !scene || !camera) throw new Error('cinematic.invalid: renderer, scene and camera are required');

  const caps = options.capabilities || probeCapabilities(renderer);
  const lane = caps.lane || 'web';

  const unsupported = [];
  const passes = {};   // effect name -> Pass instance (only for supported effects)
  const lutTextures = [];

  function unsupportedPush(effect, reason) {
    for (const entry of unsupported) if (entry.effect === effect) return;
    unsupported.push({ effect: effect, reason: reason });
  }

  // Resolve the effective effect config against capabilities and the lane
  // split rule. Requested-but-unsupported effects are named, never silent.
  function resolveEffects(requested) {
    const cfg = {};
    for (const name of EFFECT_NAMES) cfg[name] = requested ? requested[name] : false;

    // Lane split (repo-verified native R1 v6-v8 facts): bloom/dof/fxaa/
    // output/smaa/colorGrade work on BOTH lanes — SMAA runs via host-decoded
    // lookup textures and LUTPass runs on a bounded profile natively. film
    // and vignette stay web-only v1: their custom GLSL is outside the
    // bounded native shader profiles. Anything requested but unavailable is
    // named below, never silently skipped.
    if (cfg.smaa && !caps.smaa) unsupportedPush('smaa', 'capability probe: SMAA unavailable');
    if (cfg.colorGrade && !caps.lut) unsupportedPush('colorGrade', 'capability probe: LUT color grading unavailable');
    if (cfg.film && lane !== 'web') unsupportedPush('film', 'native R1: FilmPass GLSL is outside the bounded native shader profiles (web-only v1)');
    if (cfg.film && lane === 'web' && !caps.film) unsupportedPush('film', 'capability probe: FilmPass unavailable');
    if (cfg.vignette && lane !== 'web') unsupportedPush('vignette', 'native R1: custom vignette GLSL is outside the bounded native shader profiles (web-only v1)');
    if (cfg.vignette && lane === 'web' && !caps.vignette) unsupportedPush('vignette', 'capability probe: vignette shader unavailable');
    if (cfg.bloom && !caps.bloom) unsupportedPush('bloom', 'capability probe: UnrealBloomPass unavailable');
    if (cfg.dof && !caps.bokeh) unsupportedPush('dof', 'capability probe: BokehPass unavailable');
    return cfg;
  }

  const state = {
    fps: 24,
    shutter: 0.5,
    samples: 1,
    epoch: 0,
    effects: resolveEffects(options.effects),
    clearAlpha: options.alpha ? 0 : 1
  };

  // ── Composer assembly: RenderPass FIRST, OutputPass LAST (pinned by
  // three-postprocessing-dof in this repo — same addon set). Middle passes
  // are appended in fixed order and toggled via `enabled`.
  // Upstream r186 EffectComposer defaults to HalfFloatType internal targets;
  // native R1 has no half-float RTs, so the native lane hands the composer a
  // bounded UnsignedByteType target instead (verified R1 composer fact).
  const size = renderer.getSize ? renderer.getSize(new Vector2()) : new Vector2(480, 320);
  const composer = lane === 'native'
    ? new EffectComposer(renderer, new WebGLRenderTarget(Math.max(1, size.x | 0), Math.max(1, size.y | 0), { type: UnsignedByteType }))
    : new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const eff = state.effects;
  if (eff.bloom && caps.bloom) {
    passes.bloom = new UnrealBloomPass(new Vector2(size.x, size.y), 0.55, 0.4, 0.85);
    composer.addPass(passes.bloom);
  }
  if (eff.dof && caps.bokeh) {
    passes.dof = new BokehPass(scene, camera, { focus: 8.0, aperture: 0.00018, maxblur: 0.012 });
    composer.addPass(passes.dof);
  }
  if (eff.smaa && caps.smaa) {
    passes.smaa = new SMAAPass();
    composer.addPass(passes.smaa);
  }
  if (eff.fxaa) {
    passes.fxaa = new ShaderPass(FXAAShader);
    composer.addPass(passes.fxaa);
  }
  if (eff.colorGrade && caps.lut) {
    const lut = buildLutTexture(eff.colorGrade === 'teal-orange' ? 'teal-orange' : 'identity');
    lutTextures.push(lut);
    passes.colorGrade = new LUTPass({ lut: lut, intensity: 1.0 });
    composer.addPass(passes.colorGrade);
  }
  if (eff.film && lane === 'web' && caps.film) {
    passes.film = new FilmPass(0.35, false);
    composer.addPass(passes.film);
  }
  if (eff.vignette && lane === 'web' && caps.vignette) {
    passes.vignette = new ShaderPass(VignetteShader);
    passes.vignette.uniforms.offsets.value.set(0.95, 0.55);
    passes.vignette.uniforms.darkness.value = 1.15;
    composer.addPass(passes.vignette);
  }
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  // ── Web-lane subframe accumulation (readback-free). Each subframe is
  // composited into a half-float target with an additive weighted fullscreen
  // quad; OutputPass tone-maps the accumulated average once at the end.
  const accum = {
    target: null,
    quad: null,
    material: null
  };

  function ensureAccum(width, height) {
    if (accum.target) return;
    accum.target = new WebGLRenderTarget(width, height, { type: HalfFloatType });
    accum.material = new ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, weight: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: 'uniform sampler2D tDiffuse; uniform float weight; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(tDiffuse, vUv).rgb * weight, 1.0); }',
      blending: AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true
    });
    accum.quad = new FullScreenQuad(accum.material);
  }

  function composerOutputTarget() {
    const list = composer.passes;
    const last = list[list.length - 1];
    return last.needsSwap ? composer.readBuffer : composer.writeBuffer;
  }

  function updateFxaaResolution(width, height) {
    const fxaa = passes.fxaa;
    if (fxaa && fxaa.material && fxaa.material.uniforms && fxaa.material.uniforms.resolution) {
      const pr = renderer.getPixelRatio ? renderer.getPixelRatio() : 1;
      fxaa.material.uniforms.resolution.value.set(1 / (width * pr), 1 / (height * pr));
    }
  }

  updateFxaaResolution(size.x || 480, size.y || 320);

  const pipeline = {
    renderer: renderer,
    scene: scene,
    camera: camera,
    capabilities: caps,
    lane: lane,
    composer: composer,
    unsupported: unsupported,
    passes: passes,

    getConfig() {
      return {
        fps: state.fps,
        shutter: state.shutter,
        samples: state.samples,
        epoch: state.epoch,
        effects: deepCopy(state.effects),
        clearAlpha: state.clearAlpha
      };
    },

    // setQuality({ fps, shutter, samples }) — samples > 1 needs subframe
    // accumulation; on lanes without float accumulation targets the requested
    // multisample/motion config is named-unsupported and rendering falls back
    // to the first (deterministically jittered) subframe only.
    setQuality(quality) {
      if (!quality) return;
      if (quality.fps !== undefined) state.fps = Number(quality.fps);
      if (quality.shutter !== undefined) state.shutter = Number(quality.shutter);
      if (quality.samples !== undefined) state.samples = Math.max(1, Math.floor(Number(quality.samples)));
      if (state.samples > 1 && !caps.motionBlurAccum) {
        unsupportedPush('multisample', 'native R1: no half-float accumulation targets; samples>1 cannot be composited bit-identically (subframe 0 is rendered)');
        unsupportedPush('motion', 'native R1: cross-frame motion accumulation requires float targets which R1 lacks');
      }
    },

    setEffect(name, value) {
      if (EFFECT_NAMES.indexOf(name) < 0) return false;
      state.effects[name] = value;
      const pass = passes[name];
      if (pass) pass.enabled = !!value;
      if (name === 'smaa' && value && passes.fxaa) passes.fxaa.enabled = false;
      if (name === 'fxaa' && value && passes.smaa) passes.smaa.enabled = false;
      return !!pass;
    },

    // renderFrame(clock) — explicit clock state only (see clockState). The
    // pipeline never touches a wall clock; the RAF loop converts elapsed
    // milliseconds to a frame index before calling this.
    renderFrame(clock, updateScene) {
      if (!clock || !Number.isFinite(clock.frame) || !Array.isArray(clock.subframes)) {
        throw new Error('cinematic.invalid: renderFrame requires a clockState clock');
      }
      const subframes = clock.subframes;
      if (subframes.length > 1 && caps.motionBlurAccum !== true) {
        unsupportedPush('multisample', 'lane has no float accumulation targets; only subframe 0 of ' + subframes.length + ' is presented');
        unsupportedPush('motion', 'cross-frame accumulation requires float render targets');
      }
      const useAccum = subframes.length > 1 && caps.motionBlurAccum === true;
      const update = updateScene || pipeline.updateScene;
      // Apply the lane's clear alpha (alpha lanes export transparency).
      if (renderer.setClearAlpha) renderer.setClearAlpha(state.clearAlpha);

      if (useAccum) {
        const pr = renderer.getPixelRatio ? renderer.getPixelRatio() : 1;
        const sz = renderer.getSize(new Vector2());
        ensureAccum(Math.max(1, Math.floor(sz.x * pr)), Math.max(1, Math.floor(sz.y * pr)));
        composer.renderToScreen = false;
        renderer.setRenderTarget(accum.target);
        renderer.setClearColor(new Color(0x000000), 0);
        renderer.clear(true, false, false);
        for (let i = 0; i < subframes.length; i++) {
          const sub = subframes[i];
          if (update) update(scene, Object.assign({}, clock, { t: sub.t, subframe: i, subframeCount: subframes.length }));
          composer.render(0);
          accum.material.uniforms.tDiffuse.value = composerOutputTarget().texture;
          accum.material.uniforms.weight.value = sub.weight;
          renderer.setRenderTarget(accum.target);
          accum.quad.render(renderer);
        }
        outputPass.renderToScreen = true;
        outputPass.render(renderer, null, accum.target, 0, false);
        renderer.setRenderTarget(null);
      } else {
        composer.renderToScreen = true;
        const sub = subframes[0];
        if (update) update(scene, Object.assign({}, clock, { t: sub.t, subframe: 0, subframeCount: subframes.length }));
        composer.render(0);
      }
    },

    // updateScene is injectable (defaults to the showcase updater injected by
    // the widget / reference page to avoid a hard scene-module dependency).
    updateScene: null,

    // resetHistory(epoch) — new deterministic epoch: reseeds the scene's
    // static layout RNG and clears accumulation history.
    resetHistory(epoch) {
      state.epoch = (epoch === undefined ? 0 : epoch) >>> 0;
      if (scene.userData && typeof scene.userData.reseed === 'function') scene.userData.reseed(state.epoch);
      return state.epoch;
    },

    presets: Object.keys(PRESETS),

    getPreset(name) {
      const preset = PRESETS[name];
      if (!preset) throw new Error('cinematic.invalid: unknown preset "' + name + '"');
      return deepCopy(preset);
    },

    setPreset(name) {
      const preset = pipeline.getPreset(name);
      state.fps = preset.fps;
      state.shutter = preset.shutter;
      state.samples = preset.samples;
      for (const key of Object.keys(preset.effects)) {
        pipeline.setEffect(key, preset.effects[key]);
      }
      pipeline.setQuality({ samples: preset.samples });
      pipeline.resetHistory(preset.epoch);
      return pipeline.getConfig();
    },

    // capturePath() — 'three' (jsr.three surface capture), 'widget' (jsr
    // widget-tree capture) or null. Exposed so assertCapturable can list it.
    capturePath() {
      const host = globalThis.jsr;
      if (host && host.three && typeof host.three.capture === 'function') return 'three';
      if (host && typeof host.capture === 'function') return 'widget';
      return null;
    },

    // captureFrame() -> Promise<{ dataUrl | bytes | path, width, height }>
    // Never fakes a capture: rejects with the NAMED error
    // 'cinematic.captureUnavailable' when no capture path exists.
    captureFrame() {
      const dom = renderer.domElement;
      const width = dom && dom.width ? dom.width : (renderer.getSize(new Vector2()).x || 0);
      const height = dom && dom.height ? dom.height : (renderer.getSize(new Vector2()).y || 0);
      const path = pipeline.capturePath();
      if (path === 'widget') {
        return globalThis.jsr.capture({ name: 'cinematic-' + pipeline._captureSeq++ }).then(result => {
          if (result && result.__error) {
            const error = new Error('cinematic.captureUnavailable: jsr.capture failed: ' + result.__error);
            error.name = 'cinematic.captureUnavailable';
            throw error;
          }
          return {
            path: result && result.path,
            bytes: result && result.bytes,
            dataUrl: result && result.dataUrl,
            width: (result && result.width) || width,
            height: (result && result.height) || height
          };
        });
      }
      if (path === 'three') {
        return globalThis.jsr.three.capture('main').then(bytes => ({ bytes: bytes, width: width, height: height }));
      }
      if (dom && typeof dom.convertToBlob === 'function') {
        return dom.convertToBlob({ type: 'image/png' }).then(blob => blob.arrayBuffer()).then(buf => ({
          bytes: new Uint8Array(buf), width: width, height: height
        }));
      }
      if (dom && typeof dom.toDataURL === 'function') {
        return Promise.resolve({ dataUrl: dom.toDataURL('image/png'), width: width, height: height });
      }
      const error = new Error('cinematic.captureUnavailable: no PNG capture path on this lane (jsr.three.capture, jsr.capture and canvas readback are all unavailable)');
      error.name = 'cinematic.captureUnavailable';
      return Promise.reject(error);
    },
    _captureSeq: 0,

    // assertCapturable() — throws Error named 'cinematic.notCapturable'
    // listing unsupported effects and a missing capture path.
    assertCapturable() {
      const problems = [];
      if (unsupported.length > 0) {
        problems.push('requested effects unsupported on the ' + lane + ' lane: ' +
          unsupported.map(u => u.effect + ' (' + u.reason + ')').join('; '));
      }
      if (!pipeline.capturePath() && !(renderer.domElement && (typeof renderer.domElement.convertToBlob === 'function' || typeof renderer.domElement.toDataURL === 'function'))) {
        problems.push('no PNG capture path (jsr.three.capture / jsr.capture / canvas toDataURL)');
      }
      if (problems.length > 0) {
        const error = new Error(problems.join(' | '));
        error.name = 'cinematic.notCapturable';
        throw error;
      }
      return true;
    },

    setSize(width, height) {
      composer.setSize(width, height);
      updateFxaaResolution(width, height);
      if (camera && camera.isPerspectiveCamera) {
        camera.aspect = width / Math.max(1, height);
        camera.updateProjectionMatrix();
      }
      if (accum.target) accum.target.setSize(Math.max(1, Math.floor(width * (renderer.getPixelRatio ? renderer.getPixelRatio() : 1))), Math.max(1, Math.floor(height * (renderer.getPixelRatio ? renderer.getPixelRatio() : 1))));
    },

    dispose() {
      try { composer.dispose(); } catch (e) { /* best effort */ }
      for (const name of Object.keys(passes)) {
        try { if (passes[name] && typeof passes[name].dispose === 'function') passes[name].dispose(); } catch (e) { /* best effort */ }
      }
      try { outputPass.dispose(); } catch (e) { /* best effort */ }
      for (const texture of lutTextures) { try { texture.dispose(); } catch (e) { /* best effort */ } }
      if (accum.target) accum.target.dispose();
      if (accum.material) accum.material.dispose();
      if (scene && typeof scene.traverse === 'function') {
        scene.traverse(node => {
          if (node.geometry && typeof node.geometry.dispose === 'function') node.geometry.dispose();
          if (node.material) {
            const materials = Array.isArray(node.material) ? node.material : [node.material];
            for (const material of materials) if (material && typeof material.dispose === 'function') material.dispose();
          }
        });
      }
    }
  };

  return pipeline;
}
