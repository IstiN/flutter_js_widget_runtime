// jsr.three.cinematic — the deterministic cinematic pipeline in the core
// bundles (issue #8, ADR-0004 decisions 2-4, segment F4a).
//
// Moved verbatim from
// example/widgets/three-cinematic-showcase/src/pipeline.js (F4a): ONE
// implementation, every consumer on it. The showcase widget keeps no private
// copy — it reads the `jsr.three.cinematic` surface below (installed when the
// host loads the three bundle, i.e. when `JsRuntimeConfig.threeEnabled`).
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
// Pinned r186 postprocessing addons, imported from the pinned upstream tree
// (the resolver in build.mjs serves them; byte-identity with the pin is
// verified by `node tool/three/build.mjs --verify`).
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { LUTPass } from 'three/addons/postprocessing/LUTPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { TAARenderPass } from 'three/addons/postprocessing/TAARenderPass.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { VignetteShader } from 'three/addons/shaders/VignetteShader.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
// F4c1 (issue #8, ADR-0004 decision 5, ADR-0005): the JSR-owned shutter
// motion blur pass + the BokehShader2 fringe helper live in their own module;
// everything else on this file is wiring (chain order, gates, helpers).
import { CinematicMotionBlurPass, CinematicBokehFringeShader } from './cinematic_motion_blur.js';

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

// CinematicFrameClock — the named clock object (ADR-0004 decision 3).
// createFrameClock({fps, shutter, samples, epoch}) -> {state(frame)}; the
// pure clockState stays the one implementation behind it.
export function createFrameClock(options = {}) {
  const fps = options.fps === undefined ? 24 : options.fps;
  const shutter = options.shutter === undefined ? 0.5 : options.shutter;
  const samples = options.samples === undefined ? 1 : options.samples;
  const epoch = options.epoch === undefined ? 0 : options.epoch;
  const clock = {
    fps: fps,
    shutter: shutter,
    samples: samples,
    epoch: epoch,
    // state(frame) — the pure clockState for one frame under this clock.
    state(frame) {
      return clockState(frame, clock.fps, clock.shutter, clock.samples, clock.epoch);
    }
  };
  return clock;
}

// ── Capability probe ───────────────────────────────────────────────────────

// CinematicCapabilitySet — the type of the probeCapabilities() result
// (ADR-0004 decision 3). Own enumerable properties stay JSON-schema-clean
// (the lane is a NON-enumerable property, exactly like the pre-F4a plain
// object); supports(effect) maps a helper/effect name to its probe bit.
export class CinematicCapabilitySet {
  constructor(caps, lane) {
    for (const key of Object.keys(caps)) this[key] = caps[key];
    Object.defineProperty(this, 'lane', { value: lane, enumerable: false });
  }

  // supports('bloom' | 'dof' | 'depthOfField' | 'fxaa' | 'smaa' |
  //          'colorGrade' | 'film' | 'vignette' | 'motion' | 'multisample' |
  //          'pmrem' | 'cubeCamera') -> boolean. Unknown names are false.
  supports(effect) {
    const bit = CinematicCapabilitySet.EFFECT_BITS[effect];
    if (bit === undefined) return false;
    if (bit === null) return true; // fxaa: a basic ShaderPass, no probe bit
    return this[bit] === true;
  }
}

CinematicCapabilitySet.EFFECT_BITS = {
  bloom: 'bloom',
  dof: 'bokeh',
  depthOfField: 'bokeh',
  fxaa: null,
  smaa: 'smaa',
  colorGrade: 'lut',
  film: 'film',
  vignette: 'vignette',
  motion: 'motionBlurAccum',
  multisample: 'motionBlurAccum',
  // F4c1: afterimage needs the same float render targets as the motion
  // accumulation; fringe is a custom-GLSL ShaderPass, supported exactly where
  // the vignette shader is (isGL2 on the web lane, outside the bounded R1
  // profiles) — the vignette bit IS that probe.
  afterimage: 'motionBlurAccum',
  fringe: 'vignette',
  pmrem: 'pmrem',
  cubeCamera: 'cubeCamera'
};

// probeCapabilities(renderer) — conservative detection. Anything uncertain
// reports false.
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

  return new CinematicCapabilitySet(caps, lane);
}

// ── Generated LUTs (identity / teal-orange) ────────────────────────────────

function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }

// Checked quotas (issue #8 F4e/F4g, E9): hostile dimension descriptors and
// unbounded temporal histories must hit these limits with a NAMED error —
// never poison a target, hang a reconstruct loop or crash the context.
//
// - MAX_TARGET_PIXELS: a pipeline target budget of 4096x4096 (the 4K perf
//   matrix of F4f fits; anything beyond is refused before allocation).
// - HISTORY_MAX_FRAMES: a declared history window is bounded at 600 frames
//   (25 s at the 24 fps reference clock), so reconstruct() can never build
//   an unbounded frame list.
const MAX_TARGET_PIXELS = 4096 * 4096;
const HISTORY_MAX_FRAMES = 600;

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

// ── Presets and the named profile type ─────────────────────────────────────

const PRESETS = {
  draft: {
    fps: 24, shutter: 0.5, samples: 1, epoch: 0,
    effects: { bloom: false, dof: false, fxaa: true, smaa: false, colorGrade: false, film: false, vignette: false, motion: false, fringe: false, afterimage: false }
  },
  production: {
    fps: 24, shutter: 0.5, samples: 8, epoch: 0,
    effects: { bloom: true, dof: true, fxaa: true, smaa: true, colorGrade: 'teal-orange', film: true, vignette: true, motion: true, fringe: false, afterimage: false }
  },
  'deterministic-export': {
    fps: 24, shutter: 0.5, samples: 8, epoch: 0,
    effects: { bloom: true, dof: true, fxaa: true, smaa: true, colorGrade: 'teal-orange', film: true, vignette: true, motion: true, fringe: false, afterimage: false },
    note: 'fixed seed, epoch 0, no adaptive anything'
  }
};

const EFFECT_NAMES = ['bloom', 'dof', 'fxaa', 'smaa', 'colorGrade', 'film', 'vignette', 'motion', 'fringe', 'afterimage'];

// ThreeCinematicProfile — the named preset object (ADR-0004 decision 3).
// Each instance reports the settings it selected through settings(); a deep
// copy every time, so callers cannot mutate the shared preset.
export class ThreeCinematicProfile {
  constructor(name, options) {
    this.name = name;
    this.options = options;
  }

  // The settings this profile selects: {fps, shutter, samples, epoch,
  // effects, note?}. Deep copy — never a live reference.
  settings() {
    return deepCopy(this.options);
  }
}

const PROFILES = {};
for (const name of Object.keys(PRESETS)) PROFILES[name] = new ThreeCinematicProfile(name, PRESETS[name]);

export const DEFAULT_PRESETS = PRESETS;
export const PRESET_NAMES = Object.keys(PRESETS);
// `presets` on the jsr.three.cinematic surface: the named profile objects.
export const presets = PROFILES;

function deepCopy(value) { return JSON.parse(JSON.stringify(value)); }

// ── Effect helper descriptors (issue #8 P5) ────────────────────────────────

// The five helpers build plain descriptors: {effect, options}. They feed
// createPipeline({effectSpecs: [...]}) up front, and the same names exist as
// pipeline methods that apply the descriptor to a live pipeline
// (pipeline.bloom({threshold, strength, radius}) ...).

function spec(effect, options) {
  return { effect: effect, options: options && typeof options === 'object' ? Object.assign({}, options) : {} };
}

export function bloom(options = {}) {
  return spec('bloom', {
    threshold: options.threshold,
    strength: options.strength,
    radius: options.radius
  });
}

export function depthOfField(options = {}) {
  return spec('dof', {
    focus: options.focus,
    aperture: options.aperture,
    maxBlur: options.maxBlur
  });
}

export function colorGrade(options = {}) {
  return spec('colorGrade', {
    lut: options.lut === undefined ? 'identity' : options.lut,
    intensity: options.intensity
  });
}

export function motionBlur(options = {}) {
  return spec('motion', {
    shutter: options.shutter,
    samples: options.samples
  });
}

// F4c1: the temporal-trail and fringing helpers (ADR-0005).
export function afterimage(options = {}) {
  return spec('afterimage', { damp: options.damp });
}

export function fringe(options = {}) {
  return spec('fringe', { amount: options.amount, blur: options.blur });
}

export function antialias(options = {}) {
  const mode = options.mode === undefined ? 'fxaa' : options.mode;
  if (mode !== 'fxaa' && mode !== 'smaa') {
    throw new CinematicPipelineError('cinematic.invalid', 'antialias mode must be "fxaa" or "smaa"');
  }
  return spec('antialias', { mode: mode });
}

// applyEffectSpec(descriptor) lives INSIDE createPipeline (below): it needs
// the lazy pass construction and the named-unsupported record of the live
// pipeline. The surface-level factories above only build the descriptors.

// ── CinematicHistory (ADR-0004 decision 3) ─────────────────────────────────

// afterimageWindowFrames(damp) — the declared bounded history window of the
// stock AfterimagePass: the frame count after which the decayed tail
// damp^W drops below half-float subnormal FOR THE WORST-CASE HDR VALUE (the
// max half-float 65504), i.e. damp^W * 65504 < 2^-24. Beyond W frames the
// tail is flushed to zero by the half-float target itself, so a direct seek
// that replays exactly W frames reproduces the sequential state BIT-EXACTLY.
// Capped at 4096 (a damp so close to 1 that the cap bites is a documented
// limit, not an exactness claim — see docs/adr/0005-cinematic-motion-blur.md).
export function afterimageWindowFrames(damp) {
  const d = Math.min(Math.max(Number(damp) || 0.5, 0.001), 0.999999);
  return Math.min(4096, Math.ceil(Math.log(9.094947017729282e-13) / Math.log(d)));
}

// CinematicHistory — the bounded, explicit temporal state behind
// resetHistory. Temporal passes DECLARE their history window (frames);
// reconstruct(clock) then returns the ordered frame list a direct seek must
// re-render to rebuild that declared window (F4c wires the passes onto it).
export class CinematicHistory {
  constructor(epoch) {
    this.epoch = (epoch === undefined ? 0 : epoch) >>> 0;
    this.windows = []; // declared windows: [{pass, frames}, ...]
  }

  // New deterministic epoch: resets the epoch, keeps the declarations.
  reset(epoch) {
    this.epoch = (epoch === undefined ? 0 : epoch) >>> 0;
    return this.epoch;
  }

  // declare({pass, frames}) — a temporal pass declares its bounded window.
  // Hostile frames hit the checked history quota with a NAMED error
  // (non-finite / < 1 / beyond HISTORY_MAX_FRAMES); fractional values floor
  // (documented clamp), so reconstruct() is always bounded (E9).
  declare(window) {
    if (!window || !(window.frames >= 1) || !Number.isFinite(window.frames)) {
      throw new CinematicPipelineError('cinematic.invalid', 'cinematic.invalid: CinematicHistory.declare requires {pass, finite frames >= 1}');
    }
    if (Math.floor(window.frames) > HISTORY_MAX_FRAMES) {
      throw new CinematicPipelineError('cinematic.invalid', 'cinematic.invalid: history window exceeds the JSR quota of ' + HISTORY_MAX_FRAMES + ' frames (got ' + window.frames + ')');
    }
    const existing = this.windows.find(w => w.pass === window.pass);
    if (existing) existing.frames = Math.floor(window.frames);
    else this.windows.push({ pass: String(window.pass), frames: Math.floor(window.frames) });
    return Math.floor(window.frames);
  }

  // The widest declared window (0 when none declared).
  depth() {
    let max = 0;
    for (const w of this.windows) if (w.frames > max) max = w.frames;
    return max;
  }

  // reconstruct(clock) -> {epoch, frames} — the ordered frame indices a
  // direct seek to clock.frame must re-render (bounded by the widest
  // declared window; empty when no temporal pass declared one). Non-finite
  // frames (Infinity survives the `|| 0` NaN guard) clamp to frame 0 —
  // a raw Infinity frame index made the bounded loop spin forever.
  reconstruct(clock) {
    const raw = Math.floor(Number(clock && clock.frame) || 0);
    const frame = Number.isFinite(raw) ? Math.max(0, raw) : 0;
    const depth = this.depth();
    const frames = [];
    for (let f = Math.max(0, frame - depth + 1); f <= frame; f++) frames.push(f);
    return { epoch: this.epoch, frames: frames };
  }
}

// ── Pipeline factory ───────────────────────────────────────────────────────

// createPipeline({ renderer, scene, camera, capabilities?, effects?,
//                  effectSpecs?, alpha? }) — CinematicPipeline (the formal
// name of the returned object; marker isCinematicPipeline).
export function createPipeline(options) {
  const renderer = options.renderer;
  const scene = options.scene;
  const camera = options.camera;
  if (!renderer || !scene || !camera) throw new Error('cinematic.invalid: renderer, scene and camera are required');

  const caps = options.capabilities || probeCapabilities(renderer);
  const lane = caps.lane || 'web';

  // F4b (issue #8, UT-PIPELINE-VALIDATE / E2E-TARGET-2..3): the 1B/web lane
  // runs the stock composer with HalfFloatType ping-pong buffers on the GL2
  // render path. When the capability probe reports the float-target or MRT
  // fact missing, a build here allocates unrenderable targets and silently
  // renders black — exactly the effect-less image issue #8 bans (invariant
  // 6: unsupported capabilities produce a named error before capture/export).
  // Fail NAMED at creation; the reduced lane is the native R1 composer
  // (UnsignedByteType), which is a separate explicit selection.
  if (lane !== 'native' && (caps.halfFloatTargets !== true || caps.mrt !== true)) {
    const missing = [];
    if (caps.halfFloatTargets !== true) missing.push('float/half-float render targets (EXT_color_buffer_float)');
    if (caps.mrt !== true) missing.push('multiple render targets (MRT)');
    throw new CinematicPipelineError('cinematic.unsupported',
      'cinematic.unsupported: the cinematic composer lane requires ' + missing.join(' and ') +
      ' — the capability probe reports them missing; select the reduced native lane instead (no effect-less render)');
  }

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
    if (cfg.motion && !caps.motionBlurAccum) unsupportedPush('motion', 'lane: subframe accumulation needs float render targets');
    if (cfg.fringe && lane !== 'web') unsupportedPush('fringe', 'native R1: fringe GLSL is outside the bounded native shader profiles (web-only v1)');
    if (cfg.afterimage && (lane !== 'web' || !caps.motionBlurAccum)) unsupportedPush('afterimage', 'afterimage needs float render targets and custom GLSL (web lane only)');
    return cfg;
  }

  const state = {
    fps: 24,
    shutter: 0.5,
    samples: 1,
    epoch: 0,
    effects: resolveEffects(options.effects),
    clearAlpha: options.alpha ? 0 : 1,
    // F4c1 temporal tracking: the last rendered frame/epoch (seek
    // detection); resetHistory nulls both so the next renderFrame starts a
    // fresh sequential run.
    lastFrame: null,
    lastEpoch: 0
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
  // Fixed chain order (RenderPass FIRST — added above; OutputPass LAST —
  // added below). PASS_ORDER drives both the assembly and lazy construction
  // (ensurePass), so a pass added after creation lands at the same place it
  // would have occupied at assembly time. F4c1: motion/fringe/afterimage sit
  // after the finishing passes and BEFORE OutputPass so the shutter average
  // and the temporal trails are applied in linear HDR and tone-mapped once.
  const PASS_ORDER = ['bloom', 'dof', 'smaa', 'fxaa', 'colorGrade', 'film', 'vignette', 'motion', 'fringe', 'afterimage'];
  const passName = pass => {
    for (const n of Object.keys(passes)) if (passes[n] === pass) return n;
    return null;
  };
  const PASS_GATES = {
    bloom: { test: () => caps.bloom, reason: 'capability probe: UnrealBloomPass unavailable' },
    dof: { test: () => caps.bokeh, reason: 'capability probe: BokehPass unavailable' },
    smaa: { test: () => caps.smaa, reason: 'capability probe: SMAA unavailable' },
    fxaa: { test: () => true, reason: 'FXAA pass unavailable' },
    colorGrade: { test: () => caps.lut, reason: 'capability probe: LUT color grading unavailable' },
    film: { test: () => lane === 'web' && caps.film, reason: 'native R1: FilmPass GLSL is outside the bounded native shader profiles (web-only v1)' },
    vignette: { test: () => lane === 'web' && caps.vignette, reason: 'native R1: custom vignette GLSL is outside the bounded native shader profiles (web-only v1)' },
    motion: { test: () => caps.motionBlurAccum === true, reason: 'lane: subframe accumulation needs float render targets (EXT_color_buffer_float)' },
    fringe: { test: () => lane === 'web', reason: 'native R1: fringe GLSL is outside the bounded native shader profiles (web-only v1)' },
    afterimage: { test: () => lane === 'web' && caps.motionBlurAccum === true, reason: 'afterimage needs float render targets and custom GLSL (web lane only)' }
  };
  // constructPass(name) — the ONE construction site (assembly + ensurePass
  // share it; identical parameters keep the legacy behavior bit-identical).
  const constructPass = name => {
    switch (name) {
      case 'bloom': return new UnrealBloomPass(new Vector2(size.x, size.y), 0.55, 0.4, 0.85);
      case 'dof': return new BokehPass(scene, camera, { focus: 8.0, aperture: 0.00018, maxblur: 0.012 });
      case 'smaa': return new SMAAPass();
      case 'fxaa': return new ShaderPass(FXAAShader);
      case 'colorGrade': {
        const lut = buildLutTexture(eff.colorGrade === 'teal-orange' ? 'teal-orange' : 'identity');
        lutTextures.push(lut);
        return new LUTPass({ lut: lut, intensity: 1.0 });
      }
      case 'film': return new FilmPass(0.35, false);
      case 'vignette': {
        const pass = new ShaderPass(VignetteShader);
        // r186 VignetteShader uniforms: scalar `offset` (not `offsets`) —
        // the pre-F4a showcase copy read `.offsets.value.set(...)`, a latent
        // crash on every vignette request (the effect could never apply).
        pass.uniforms.offset.value = 0.95;
        pass.uniforms.darkness.value = 1.15;
        return pass;
      }
      // F4c1 (ADR-0005): the JSR-owned shutter motion blur; the pipeline
      // arms subframes from clockState() before every composer.render().
      case 'motion': return new CinematicMotionBlurPass({ samples: state.samples });
      case 'fringe': {
        const pass = new ShaderPass(CinematicBokehFringeShader);
        pass.uniforms.amount.value = 0.7;
        pass.uniforms.resolution.value.set(size.x || 480, size.y || 320);
        return pass;
      }
      case 'afterimage': return new AfterimagePass(0.96);
      default: return null;
    }
  };
  for (const name of PASS_ORDER) {
    if (eff[name] && PASS_GATES[name].test()) {
      const pass = constructPass(name);
      composer.addPass(pass);
      passes[name] = pass;
    }
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
    const pr = renderer.getPixelRatio ? renderer.getPixelRatio() : 1;
    const fxaa = passes.fxaa;
    if (fxaa && fxaa.material && fxaa.material.uniforms && fxaa.material.uniforms.resolution) {
      fxaa.material.uniforms.resolution.value.set(1 / (width * pr), 1 / (height * pr));
    }
    const fringe = passes.fringe;
    if (fringe && fringe.uniforms && fringe.uniforms.resolution) {
      fringe.uniforms.resolution.value.set(width * pr || 1, height * pr || 1);
    }
  }

  // resolveSize(width, height, what) — the hostile-dimension policy of
  // pipeline.setSize (issue #8 F4g, SEC-CINEMATIC / E9): non-finite or
  // negative values are the NAMED error (they would poison every composer
  // and accumulation target downstream); fractional values floor and 0
  // clamps to the 1-pixel minimum (documented clamp); values beyond the GL
  // max texture size or the MAX_TARGET_PIXELS budget hit the checked quota
  // with the NAMED error BEFORE any target is resized (E4: a rejected
  // resize leaves the previous coherent size on every target).
  function resolveSize(width, height, what) {
    const w = Number(width);
    const h = Number(height);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w < 0 || h < 0) {
      throw new CinematicPipelineError('cinematic.invalid', 'cinematic.invalid: ' + what + ' dimensions must be finite non-negative numbers (got ' + width + ' x ' + height + ')');
    }
    const maxTex = (renderer.capabilities && renderer.capabilities.maxTextureSize) || 16384;
    const cw = Math.min(Math.max(1, Math.floor(w)), maxTex);
    const ch = Math.min(Math.max(1, Math.floor(h)), maxTex);
    if (cw * ch > MAX_TARGET_PIXELS) {
      throw new CinematicPipelineError('cinematic.invalid', 'cinematic.invalid: ' + what + ' exceeds the JSR target budget of ' + MAX_TARGET_PIXELS + ' pixels (got ' + cw + ' x ' + ch + ')');
    }
    return { width: cw, height: ch };
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

    // ensurePass(name) — construct a pass AFTER pipeline creation (the
    // issue #8 P5 usage: pipeline.bloom({...}) on a pipeline built without
    // effects). One construction path with the assembly block below: same
    // parameters, and the fixed chain order is kept via insertPass before
    // the first later pass (OutputPass always stays last). Returns false
    // when the capability gate keeps the pass off the lane.
    ensurePass(name) {
      if (passes[name]) { passes[name].enabled = true; return true; }
      const gate = PASS_GATES[name];
      if (!gate) return false; // 'motion' etc. are clock settings, not passes
      if (!gate.test()) {
        // Requested but gated: NAMED, never silent (same reasons as the
        // assembly-time resolveEffects records).
        unsupportedPush(name, gate.reason);
        return false;
      }
      const pass = constructPass(name);
      if (!pass) return false;
      let index = composer.passes.indexOf(outputPass);
      for (let i = 0; i < composer.passes.length; i++) {
        const n = passName(composer.passes[i]);
        if (n && PASS_ORDER.indexOf(n) > PASS_ORDER.indexOf(name)) { index = i; break; }
      }
      composer.insertPass(pass, index);
      passes[name] = pass;
      if (name === 'fxaa') updateFxaaResolution(size.x || 480, size.y || 320);
      if (name === 'afterimage') {
        // Declare the bounded temporal window on the shared history
        // (ADR-0004 decision 3): reconstruction replays at most this many
        // frames, and the tail beyond it is provably flushed by the
        // half-float targets (afterimageWindowFrames).
        pipeline.history.declare({ pass: 'afterimage', frames: afterimageWindowFrames(pass.uniforms.damp.value) });
      }
      return true;
    },

    // applyEffectSpec(descriptor) — the live application used by the five
    // helper methods and pipeline.applyEffect. Returns true when a pass is
    // (or became) active; a gated effect is NAMED, never silent.
    applyEffectSpec(descriptor) {
      const effect = descriptor.effect;
      const options = descriptor.options || {};
      const gate = name => pipeline.ensurePass(name); // gated effects are NAMED inside ensurePass
      if (effect === 'bloom') {
        pipeline.setEffect('bloom', true);
        if (!gate('bloom')) return false;
        const pass = pipeline.passes.bloom;
        if (options.threshold !== undefined && options.threshold !== null) pass.threshold = Number(options.threshold);
        if (options.strength !== undefined && options.strength !== null) pass.strength = Number(options.strength);
        if (options.radius !== undefined && options.radius !== null) pass.radius = Number(options.radius);
        return true;
      }
      if (effect === 'dof' || effect === 'depthOfField') {
        pipeline.setEffect('dof', true);
        if (!gate('dof')) return false;
        const pass = pipeline.passes.dof;
        const uniforms = pass.uniforms || (pass.material && pass.material.uniforms);
        if (uniforms) {
          if (options.focus !== undefined && options.focus !== null && uniforms.focus) uniforms.focus.value = Number(options.focus);
          if (options.aperture !== undefined && options.aperture !== null && uniforms.aperture) uniforms.aperture.value = Number(options.aperture);
          if (options.maxBlur !== undefined && options.maxBlur !== null && uniforms.maxblur) uniforms.maxblur.value = Number(options.maxBlur);
        }
        return true;
      }
      if (effect === 'colorGrade') {
        pipeline.setEffect('colorGrade', options.lut === undefined ? true : options.lut);
        return gate('colorGrade');
      }
      if (effect === 'motion') {
        // F4c1 (ADR-0005): the motion helper selects the CinematicMotionBlurPass
        // (gated — named-unsupported on lanes without float targets), on top
        // of the clock settings it always applied.
        pipeline.setQuality({ shutter: options.shutter, samples: options.samples });
        return gate('motion');
      }
      if (effect === 'fringe') {
        pipeline.setEffect('fringe', true);
        if (!gate('fringe')) return false;
        const pass = pipeline.passes.fringe;
        if (options.amount !== undefined && options.amount !== null) pass.uniforms.amount.value = Number(options.amount);
        if (options.blur !== undefined && options.blur !== null) pass.uniforms.blur.value = Number(options.blur);
        return true;
      }
      if (effect === 'afterimage') {
        pipeline.setEffect('afterimage', true);
        if (!gate('afterimage')) return false;
        const pass = pipeline.passes.afterimage;
        if (options.damp !== undefined && options.damp !== null) {
          const damp = Number(options.damp);
          if (!(damp > 0) || damp >= 1) {
            throw new CinematicPipelineError('cinematic.invalid', 'afterimage damp must be in (0, 1)');
          }
          pass.damp = damp;
        }
        pipeline.history.declare({ pass: 'afterimage', frames: afterimageWindowFrames(pass.uniforms.damp.value) });
        return true;
      }
      if (effect === 'antialias') {
        const mode = options.mode === 'smaa' ? 'smaa' : 'fxaa';
        const other = mode === 'smaa' ? 'fxaa' : 'smaa';
        pipeline.setEffect(mode, true);
        pipeline.setEffect(other, false);
        if (mode === 'smaa') return gate('smaa');
        return gate('fxaa');
      }
      return false;
    },

    // renderFrame(clock) — explicit clock state only (see clockState). The
    // pipeline never touches a wall clock; the RAF loop converts elapsed
    // milliseconds to a frame index before calling this.
    //
    // options.present (default true): when false the final OutputPass result
    // stays in the composer's read buffer (readRenderTargetPixels can hash it)
    // and nothing is presented — the deterministic capture/hash path.
    //
    // Temporal reconstruction (F4c1): with the stock AfterimagePass enabled,
    // any discontinuity (first frame after a reset, a skipped or repeated
    // frame, an epoch change) replays the pass's DECLARED bounded history
    // (CinematicHistory.reconstruct) before the requested frame renders, so a
    // direct seek reproduces the sequential run bit-exactly (IT-HISTORY-*).
    renderFrame(clock, updateScene, options) {
      if (!clock || !Number.isFinite(clock.frame) || !Array.isArray(clock.subframes)) {
        throw new Error('cinematic.invalid: renderFrame requires a clockState clock');
      }
      const update = updateScene || pipeline.updateScene;
      const present = !(options && options.present === false);
      const afterimagePass = passes.afterimage;
      if (afterimagePass && afterimagePass.enabled !== false) {
        const expect = state.lastFrame === null ? null : state.lastFrame + 1;
        if (expect === null || clock.frame !== expect || clock.epoch !== state.lastEpoch) {
          // Direct seek (or history was cleared): rebuild the declared
          // bounded window. The clock restarts at frame 0 after resetHistory
          // (deterministic export restarts the frame clock), so the replay
          // starts at the window head clamped to 0 — exactly the frames the
          // sequential run from the reset rendered. `present: false` —
          // replay frames are never shown.
          const rec = pipeline.history.reconstruct({ frame: clock.frame });
          const frames = rec.frames;
          for (let i = 0; i < frames.length - 1; i++) {
            pipeline._renderClock(clockState(frames[i], clock.fps, clock.shutter, clock.samples, clock.epoch), update, false);
          }
        }
      }
      pipeline._renderClock(clock, update, present);
      state.lastFrame = clock.frame;
      state.lastEpoch = clock.epoch;
    },

    // _renderClock(clock, update, present) — ONE frame render through the
    // chain, no seek/history logic (the reconstruction replay loop calls it
    // directly). Paths:
    //   1. motion chain (F4c1): the motion pass is in the chain and the frame
    //      is multi-subframe — the pass accumulates each chain result and
    //      resolves on the last subframe; OutputPass tone-maps once.
    //   2. legacy inline accumulation: multi-subframe WITHOUT the motion pass
    //      (kept bit-identical to the pre-F4c1 behavior, including the
    //      post-OutputPass average; the E2E-SHOWCASE-1 legacy==core gate pins
    //      it). `present` suppresses the final manual OutputPass present.
    //   3. single subframe.
    _renderClock(clock, update, present) {
      const subframes = clock.subframes;
      if (subframes.length > 1 && caps.motionBlurAccum !== true) {
        unsupportedPush('multisample', 'lane has no float accumulation targets; only subframe 0 of ' + subframes.length + ' is presented');
        unsupportedPush('motion', 'cross-frame accumulation requires float render targets');
      }
      const motionPass = passes.motion;
      const useChainMotion = motionPass && motionPass.enabled !== false && subframes.length > 1 && caps.motionBlurAccum === true;
      const useAccum = !useChainMotion && subframes.length > 1 && caps.motionBlurAccum === true;
      // Apply the lane's clear alpha (alpha lanes export transparency).
      if (renderer.setClearAlpha) renderer.setClearAlpha(state.clearAlpha);
      const afterimagePass = passes.afterimage;

      if (useChainMotion) {
        composer.renderToScreen = false;
        for (let i = 0; i < subframes.length; i++) {
          const sub = subframes[i];
          const last = i === subframes.length - 1;
          // The stock AfterimagePass is a per-frame temporal filter: with
          // subframes it runs ONCE per frame, on the resolved frame (last
          // subframe), never per subframe.
          if (afterimagePass) afterimagePass.enabled = last;
          motionPass.armSubframe(i, subframes.length, sub.weight);
          if (update) update(scene, Object.assign({}, clock, { t: sub.t, subframe: i, subframeCount: subframes.length }));
          composer.renderToScreen = last && present;
          composer.render(0);
        }
        if (afterimagePass) afterimagePass.enabled = true;
        return;
      }

      if (useAccum) {
        const pr = renderer.getPixelRatio ? renderer.getPixelRatio() : 1;
        const sz = renderer.getSize(new Vector2());
        ensureAccum(Math.max(1, Math.floor(sz.x * pr)), Math.max(1, Math.floor(sz.y * pr)));
        composer.renderToScreen = false;
        renderer.setRenderTarget(accum.target);
        // Forced black HERE (not before the loop): three's background module
        // resets the renderer clear color to the scene background on every
        // RenderPass, so a pre-loop clear color is stale by this point — a
        // background-colored clear inflated every accumulated average.
        renderer.setClearColor(new Color(0x000000), 0);
        renderer.clear(true, false, false);
        // autoClear suppression (same as the F4c1 motion pass): the
        // FullScreenQuad draws go through renderer.render, whose autoClear
        // would clear the accumulation before every weighted draw.
        const oldAutoClear = renderer.autoClear;
        renderer.autoClear = false;
        for (let i = 0; i < subframes.length; i++) {
          const sub = subframes[i];
          if (update) update(scene, Object.assign({}, clock, { t: sub.t, subframe: i, subframeCount: subframes.length }));
          composer.render(0);
          accum.material.uniforms.tDiffuse.value = composerOutputTarget().texture;
          accum.material.uniforms.weight.value = sub.weight;
          renderer.setRenderTarget(accum.target);
          accum.quad.render(renderer);
        }
        renderer.autoClear = oldAutoClear;
        if (present) {
          outputPass.renderToScreen = true;
          outputPass.render(renderer, null, accum.target, 0, false);
        }
        renderer.setRenderTarget(null);
        return;
      }

      composer.renderToScreen = present;
      if (motionPass) motionPass.armSubframe(0, 1, 1);
      const sub = subframes[0];
      if (update) update(scene, Object.assign({}, clock, { t: sub.t, subframe: 0, subframeCount: subframes.length }));
      composer.render(0);
    },

    // updateScene is injectable (defaults to the showcase updater injected by
    // the widget / reference page to avoid a hard scene-module dependency).
    updateScene: null,

    // resetHistory(epoch) — new deterministic epoch: reseeds the scene's
    // static layout RNG, resets the CinematicHistory clock, clears the
    // temporal pass state (the stock AfterimagePass has no upstream reset
    // API, so both history targets are cleared back to their initial
    // transparent black — the exact constructor state) and forgets the
    // frame tracking so the next renderFrame starts a fresh sequential run.
    resetHistory(epoch) {
      state.epoch = pipeline.history.reset(epoch);
      if (scene.userData && typeof scene.userData.reseed === 'function') scene.userData.reseed(state.epoch);
      const afterimagePass = passes.afterimage;
      if (afterimagePass) {
        renderer.setClearColor(new Color(0x000000), 0);
        renderer.setRenderTarget(afterimagePass._textureOld);
        renderer.clear(true, false, false);
        renderer.setRenderTarget(afterimagePass._textureComp);
        renderer.clear(true, false, false);
        renderer.setRenderTarget(null);
      }
      state.lastFrame = null;
      state.lastEpoch = state.epoch;
      return state.epoch;
    },

    // CinematicHistory — the named temporal-state component behind
    // resetHistory (ADR-0004 decision 3).
    history: new CinematicHistory(0),

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
        // A preset may enable an effect the pipeline was created without
        // (P5 usage: createPipeline({renderer, scene, camera}) then
        // setPreset) — construct it through the same gated path.
        if (preset.effects[key] && !passes[key]) pipeline.ensurePass(key);
      }
      pipeline.setQuality({ samples: preset.samples });
      pipeline.resetHistory(preset.epoch);
      return pipeline.getConfig();
    },

    // capturePath() — 'barrier' (the host cinematic capture contract),
    // 'three' (jsr.three surface capture), 'widget' (jsr widget-tree
    // capture) or null. Exposed so assertCapturable can list it.
    capturePath() {
      const host = globalThis.jsr;
      if (host && typeof host.capture === 'function') return 'barrier';
      if (host && host.three && typeof host.three.capture === 'function') return 'three';
      return null;
    },

    // captureFrame(clock) -> Promise<{ dataUrl | bytes | path, width, height }>.
    //
    // WITH a clock (deterministic export, ADR-0004 decision 4): the capture
    // barrier is a HOST contract. The request crosses the existing
    // `__jsr_capture` channel with options {engineId, clock, barrier:
    // 'final-pass'}; the Dart host (JsRuntimeConfig.cinematicCaptureHost)
    // completes only after the final composer pass of the frame-driven
    // render — never from a wall-clock frame. A host without the capability
    // resolves the named error `cinematic.notCapturable`; captureFrame
    // rejects with the same named error. Never an effect-free capture.
    //
    // WITHOUT a clock (interactive widget screenshot): the legacy paths
    // (jsr.capture tree rasterization / jsr.three.capture / canvas
    // readback). Never fakes a capture: rejects with the NAMED error
    // 'cinematic.captureUnavailable' when no capture path exists.
    captureFrame(clock) {
      const dom = renderer.domElement;
      const width = dom && dom.width ? dom.width : (renderer.getSize(new Vector2()).x || 0);
      const height = dom && dom.height ? dom.height : (renderer.getSize(new Vector2()).y || 0);

      if (clock !== undefined && clock !== null) {
        // F4b (issue #8, E2E-TARGET-4): requested-but-unsupported effects
        // must fail the barrier capture NAMED — the host must never receive
        // the effect-less frame (issue #8 invariant 6 / E5: the exact
        // missing feature is reported before capture).
        if (unsupported.length > 0) {
          return Promise.reject(new CinematicPipelineError('cinematic.notCapturable',
            'cinematic.notCapturable: requested effects unsupported on the ' + lane + ' lane: ' +
            unsupported.map(u => u.effect + ' (' + u.reason + ')').join('; ')));
        }
        const host = globalThis.jsr;
        if (!host || typeof host.capture !== 'function') {
          return Promise.reject(new CinematicPipelineError('cinematic.notCapturable',
            'cinematic.notCapturable: no host capture channel (jsr.capture) — the final-pass capture barrier needs JsRuntimeConfig.cinematicCaptureHost'));
        }
        const clockRecord = {
          frame: clock.frame,
          fps: clock.fps,
          shutter: clock.shutter,
          samples: clock.samples,
          epoch: clock.epoch
        };
        return Promise.resolve(host.capture({
          engineId: typeof globalThis.__IID === 'string' ? globalThis.__IID : '',
          clock: clockRecord,
          barrier: 'final-pass'
        })).then(result => {
          if (result && result.__error) {
            throw new CinematicPipelineError('cinematic.notCapturable',
              'cinematic.notCapturable: host capture barrier failed: ' + result.__error);
          }
          return {
            path: result && result.path,
            bytes: result && result.bytes,
            dataUrl: result && result.dataUrl,
            width: (result && result.width) || width,
            height: (result && result.height) || height
          };
        }, error => {
          throw new CinematicPipelineError('cinematic.notCapturable',
            'cinematic.notCapturable: host capture barrier failed: ' + (error && error.message ? error.message : error));
        });
      }

      const path = pipeline.capturePath();
      if (path === 'barrier' || path === 'widget') {
        return globalThis.jsr.capture({ name: 'cinematic-' + pipeline._captureSeq++ }).then(result => {
          if (result && result.__error) {
            const error = new CinematicPipelineError('cinematic.captureUnavailable',
              'cinematic.captureUnavailable: jsr.capture failed: ' + result.__error);
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
      throw new CinematicPipelineError('cinematic.captureUnavailable',
        'cinematic.captureUnavailable: no PNG capture path on this lane (jsr.capture, jsr.three.capture and canvas readback are all unavailable)');
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
        problems.push('no PNG capture path (jsr.capture / jsr.three.capture / canvas toDataURL)');
      }
      if (problems.length > 0) {
        throw new CinematicPipelineError('cinematic.notCapturable', problems.join(' | '));
      }
      return true;
    },

    // The five effect helpers, live on the pipeline (issue #8 P5 usage:
    // pipeline.bloom({threshold, strength, radius})). Each applies the
    // descriptor of the surface-level factory of the same name.
    bloom(options) { return pipeline.applyEffectSpec(bloom(options)); },
    depthOfField(options) { return pipeline.applyEffectSpec(depthOfField(options)); },
    colorGrade(options) { return pipeline.applyEffectSpec(colorGrade(options)); },
    motionBlur(options) { return pipeline.applyEffectSpec(motionBlur(options)); },
    afterimage(options) { return pipeline.applyEffectSpec(afterimage(options)); },
    fringe(options) { return pipeline.applyEffectSpec(fringe(options)); },
    antialias(options) { return pipeline.applyEffectSpec(antialias(options)); },
    // applyEffect(spec) — apply a descriptor produced by the surface-level
    // factory of the same name (pipeline.applyEffect(cine.bloom({...}))).
    applyEffect(descriptor) {
      if (!descriptor || typeof descriptor.effect !== 'string') {
        throw new CinematicPipelineError('cinematic.invalid', 'applyEffect requires an effect descriptor {effect, options}');
      }
      return pipeline.applyEffectSpec(descriptor);
    },

    setSize(width, height) {
      const s = resolveSize(width, height, 'pipeline');
      composer.setSize(s.width, s.height);
      updateFxaaResolution(s.width, s.height);
      if (camera && camera.isPerspectiveCamera) {
        camera.aspect = s.width / s.height;
        camera.updateProjectionMatrix();
      }
      if (accum.target) accum.target.setSize(Math.max(1, Math.floor(s.width * (renderer.getPixelRatio ? renderer.getPixelRatio() : 1))), Math.max(1, Math.floor(s.height * (renderer.getPixelRatio ? renderer.getPixelRatio() : 1))));
    },

    dispose() {
      try { composer.dispose(); } catch (e) { /* best effort */ }
      for (const name of Object.keys(passes)) {
        try { if (passes[name] && typeof passes[name].dispose === 'function') passes[name].dispose(); } catch (e) { /* best effort */ }
        // Upstream r186 UnrealBloomPass.dispose misses its own
        // materialHighPassFilter — the material's program stays cached and
        // leaks one GL program per pipeline cycle (found by IT-LIFE-CINE-1 /
        // REG-RESOURCE-BOUNDS on the 1B lane). Dispose it here, at the one
        // place the pass lifetime is owned.
        const extra = name === 'bloom' && passes[name] && passes[name].materialHighPassFilter;
        if (extra && typeof extra.dispose === 'function') {
          try { extra.dispose(); } catch (e) { /* best effort */ }
        }
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

  // CinematicPipeline — the formal name of the pipeline object
  // (ADR-0004 decision 3). Non-enumerable marker, so config snapshots and
  // exportState stay schema-clean.
  Object.defineProperty(pipeline, 'isCinematicPipeline', { value: true, enumerable: false });

  // Assembly-time temporal declarations (F4c1): an afterimage pass built at
  // assembly declares its bounded window here (ensurePass declares for the
  // lazy path); declare() is idempotent.
  if (passes.afterimage) {
    pipeline.history.declare({ pass: 'afterimage', frames: afterimageWindowFrames(passes.afterimage.uniforms.damp.value) });
  }

  return pipeline;
}

// ADR-0004 continuity alias: the factory was named createCinematicPipeline in
// the showcase-private module (pre-F4a consumers / docs).
export const createCinematicPipeline = createPipeline;

// ── The jsr.three.cinematic surface (ADR-0004 decision 2) ──────────────────

// Installed on `jsr.three` by ThreeCompatibilityRuntime.install() whenever
// the three bundle is evaluated — i.e. exactly when the host runs with
// JsRuntimeConfig.threeEnabled.
export const cinematicSurface = Object.freeze({
  createPipeline: createPipeline,
  clockState: clockState,
  probeCapabilities: probeCapabilities,
  presets: presets,
  bloom: bloom,
  depthOfField: depthOfField,
  colorGrade: colorGrade,
  motionBlur: motionBlur,
  afterimage: afterimage,
  fringe: fringe,
  antialias: antialias,
  // Named components (decision 3).
  CinematicCapabilitySet: CinematicCapabilitySet,
  CinematicFrameClock: createFrameClock,
  createFrameClock: createFrameClock,
  CinematicHistory: CinematicHistory,
  ThreeCinematicProfile: ThreeCinematicProfile,
  // F4c1: the JSR-owned shutter motion blur pass (decision 5, ADR-0005).
  CinematicMotionBlurPass: CinematicMotionBlurPass,
  // The stock r186 temporal pass of the pin (F4e lifecycle / history rows
  // compose it into a pipeline next to bloom + OutputPass).
  TAARenderPass: TAARenderPass,
  // Support API the showcase scene factory consumes.
  cinematicRandom: cinematicRandom,
  buildLutTexture: buildLutTexture,
  CinematicPipelineError: CinematicPipelineError
});
