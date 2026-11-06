// Web (browser worker) MediaPipe lane for webgl_morphtargets_webcam.
//
// The widget JS runs on web in a dedicated classic Worker built from a blob
// URL (js_widget_engine_web_worker.dart). Probed reality in that scope
// (Chrome for Testing 153):
// - dynamic `import()` of the CDN tasks-vision ESM bundle WORKS (the same
//   specifier the official example imports), and tasks-vision itself loads
//   its wasm through importScripts — a classic-worker feature;
// - `navigator.mediaDevices` / MediaStreamTrackProcessor do NOT exist in a
//   dedicated worker, so the worker cannot open a camera itself.
//
// The lane therefore splits in two, mirroring the native split:
// - WORKER (this module): loads tasks-vision from the CDN at runtime, pulls
//   bounded camera frames through the generic `jsr.hostCall('camera.*')`
//   resolve lane (the same contract the native webcam_host.mjs pull loop
//   uses — answered on web by example/lib/web_camera_host.dart), detects on
//   an OffscreenCanvas and returns official-shaped results. The bundled
//   official animate() loop applies the blendshapes with its own pinned
//   mapping; this module also exposes the same mapping as pure, offline-
//   tested functions and runs them as the bounded transport-sanity filter.
// - MAIN THREAD (Dart): getUserMedia + canvas downscale (web_camera_host).
//
// Gating: installed only on the web backend (`webgl2`) inside a worker;
// offline / CDN failure / missing host lane keep the existing bounded
// static-stub behavior (neutral Face Cap pose, one warn per failure kind).
//
// The imported-CDN contract is pinned to the official example:
// import { FaceLandmarker, FilesetResolver } from
//   'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35'

// The bounded base64 RGBA decoder is shared with the native lane (single
// source of truth; webcam_host.mjs owns it and its node suite).
import { b64decodeInto } from './webcam_host.mjs';

const TASKS_VISION_CDN =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35';
const WASM_CDN = `${TASKS_VISION_CDN}/wasm`;

// Byte-identical to the static stub's offline warn (the widget's offline
// behavior must not change).
const OFFLINE_WARN =
  'three: MediaPipe webcam tracking is unavailable offline; rendering the Face Cap model at its neutral pose with the existing video fallback.';
const CDN_WARN =
  'three: MediaPipe tasks-vision could not be loaded from the CDN; rendering the Face Cap model at its neutral pose with the existing video fallback.';
const CAMERA_WARN_PREFIX =
  'three: web camera lane unavailable';
const CAMERA_WARN_SUFFIX =
  '; rendering the Face Cap backdrop at its bounded placeholder.';
const PULL_FAIL_WARN =
  'three: web camera frame lane kept failing; keeping the placeholder backdrop.';

export const PULL_INTERVAL_MS = 66;
export const MAX_TRACKED_TEXTURES = 8;
export const MAX_FRAME_EDGE = 512;
export const MAX_FRAME_BYTES = 4 * 1024 * 1024;
export const MAX_CONSECUTIVE_FAILURES = 30;
export const EYE_ROTATION_LIMIT = Math.PI / 6; // official: degToRad(30)

// The official blendshapesMap, pinned from webgl_morphtargets_webcam
// (three.js r186). Keyed by MediaPipe categoryName, valued by the Face Cap
// morphTargetDictionary name.
export const BLENDSHAPES_MAP = {
  browDownLeft: 'browDown_L',
  browDownRight: 'browDown_R',
  browInnerUp: 'browInnerUp',
  browOuterUpLeft: 'browOuterUp_L',
  browOuterUpRight: 'browOuterUp_R',
  cheekPuff: 'cheekPuff',
  cheekSquintLeft: 'cheekSquint_L',
  cheekSquintRight: 'cheekSquint_R',
  eyeBlinkLeft: 'eyeBlink_L',
  eyeBlinkRight: 'eyeBlink_R',
  eyeLookDownLeft: 'eyeLookDown_L',
  eyeLookDownRight: 'eyeLookDown_R',
  eyeLookInLeft: 'eyeLookIn_L',
  eyeLookInRight: 'eyeLookIn_R',
  eyeLookOutLeft: 'eyeLookOut_L',
  eyeLookOutRight: 'eyeLookOut_R',
  eyeLookUpLeft: 'eyeLookUp_L',
  eyeLookUpRight: 'eyeLookUp_R',
  eyeSquintLeft: 'eyeSquint_L',
  eyeSquintRight: 'eyeSquint_R',
  eyeWideLeft: 'eyeWide_L',
  eyeWideRight: 'eyeWide_R',
  jawForward: 'jawForward',
  jawLeft: 'jawLeft',
  jawOpen: 'jawOpen',
  jawRight: 'jawRight',
  mouthClose: 'mouthClose',
  mouthDimpleLeft: 'mouthDimple_L',
  mouthDimpleRight: 'mouthDimple_R',
  mouthFrownLeft: 'mouthFrown_L',
  mouthFrownRight: 'mouthFrown_R',
  mouthFunnel: 'mouthFunnel',
  mouthLeft: 'mouthLeft',
  mouthLowerDownLeft: 'mouthLowerDown_L',
  mouthLowerDownRight: 'mouthLowerDown_R',
  mouthPressLeft: 'mouthPress_L',
  mouthPressRight: 'mouthPress_R',
  mouthPucker: 'mouthPucker',
  mouthRight: 'mouthRight',
  mouthRollLower: 'mouthRollLower',
  mouthRollUpper: 'mouthRollUpper',
  mouthShrugLower: 'mouthShrugLower',
  mouthShrugUpper: 'mouthShrugUpper',
  mouthSmileLeft: 'mouthSmile_L',
  mouthSmileRight: 'mouthSmile_R',
  mouthStretchLeft: 'mouthStretch_L',
  mouthStretchRight: 'mouthStretch_R',
  mouthUpperUpLeft: 'mouthUpperUp_L',
  mouthUpperUpRight: 'mouthUpperUp_R',
  noseSneerLeft: 'noseSneer_L',
  noseSneerRight: 'noseSneer_R'
};

// Official eye-look sums: two blendshapes per axis are added/subtracted to a
// -1..1 score, later scaled by the eye rotation limit.
export function computeEyeScores(categories) {
  const eyeScore = {
    leftHorizontal: 0,
    rightHorizontal: 0,
    leftVertical: 0,
    rightVertical: 0
  };
  for (const blendshape of categories || []) {
    switch (blendshape && blendshape.categoryName) {
      case 'eyeLookInLeft': eyeScore.leftHorizontal += blendshape.score; break;
      case 'eyeLookOutLeft': eyeScore.leftHorizontal -= blendshape.score; break;
      case 'eyeLookInRight': eyeScore.rightHorizontal -= blendshape.score; break;
      case 'eyeLookOutRight': eyeScore.rightHorizontal += blendshape.score; break;
      case 'eyeLookUpLeft': eyeScore.leftVertical -= blendshape.score; break;
      case 'eyeLookDownLeft': eyeScore.leftVertical += blendshape.score; break;
      case 'eyeLookUpRight': eyeScore.rightVertical -= blendshape.score; break;
      case 'eyeLookDownRight': eyeScore.rightVertical += blendshape.score; break;
      default: break;
    }
  }
  return eyeScore;
}

// Bounded transport-sanity filter for CDN results: keep exactly the official
// mapped categories (the widget loop skips everything else anyway) with
// finite 0..1 scores. Mirrors what the official loop would act on, so a
// drifted or hostile CDN payload cannot smuggle state past the 51-entry map.
export function sanitizeCategories(categories) {
  const clean = [];
  for (const blendshape of Array.isArray(categories) ? categories : []) {
    if (!blendshape || typeof blendshape.categoryName !== 'string') continue;
    if (!(blendshape.categoryName in BLENDSHAPES_MAP)) continue;
    const score = blendshape.score;
    clean.push({
      categoryName: blendshape.categoryName,
      score: typeof score === 'number' && Number.isFinite(score)
        ? Math.min(1, Math.max(0, score))
        : 0
    });
  }
  return clean;
}

// Pure mirror of the official animate() application loop: writes every
// mapped morph influence and applies the eye-look sums as eye rotations.
// `targets` is {face, eyeL, eyeR}; all three optional, mirroring the
// official guards (morph writes need the dictionary, rotations need eyes).
export function applyFaceResult(result, targets, eyeRotationLimit = EYE_ROTATION_LIMIT) {
  const applied = [];
  const face = targets && targets.face;
  let eyeScore = { leftHorizontal: 0, rightHorizontal: 0, leftVertical: 0, rightVertical: 0 };
  if (result && Array.isArray(result.faceBlendshapes) &&
      result.faceBlendshapes.length > 0) {
    const categories = result.faceBlendshapes[0].categories || [];
    if (face && face.morphTargetDictionary && face.morphTargetInfluences) {
      for (const blendshape of categories) {
        const index =
          face.morphTargetDictionary[BLENDSHAPES_MAP[blendshape.categoryName]];
        if (index !== undefined) {
          face.morphTargetInfluences[index] = blendshape.score;
          applied.push(blendshape.categoryName);
        }
      }
    }
    eyeScore = computeEyeScores(categories);
    const eyeL = targets && targets.eyeL;
    const eyeR = targets && targets.eyeR;
    if (eyeL) {
      eyeL.rotation.z = eyeScore.leftHorizontal * eyeRotationLimit;
      eyeL.rotation.x = eyeScore.leftVertical * eyeRotationLimit;
    }
    if (eyeR) {
      eyeR.rotation.z = eyeScore.rightHorizontal * eyeRotationLimit;
      eyeR.rotation.x = eyeScore.rightVertical * eyeRotationLimit;
    }
  }
  return { applied, eyeScore };
}

// ── runtime state ───────────────────────────────────────────────────────────

const EMPTY_RESULTS = { faceBlendshapes: [], facialTransformationMatrixes: [] };

const state = {
  entries: [], // {texture, video, metadataSent}
  vision: null, // the real CDN module once dynamic import() resolves
  landmarker: null, // the real FaceLandmarker once createFromOptions resolves
  hydrationStarted: false,
  hydrationFailed: false,
  delegate: null,
  canvas: null,
  ctx: null,
  imageData: null,
  frameWidth: 0,
  frameHeight: 0,
  frameSeq: 0, // frames painted since boot
  detectedSeq: -1, // last frameSeq fed to the real landmarker
  lastDetectTs: 0,
  lastResults: EMPTY_RESULTS,
  lastDetectErrorWarned: false,
  warned: new Set(),
  pull: { started: false, active: false, intervalId: null, inflight: false, failures: 0, lastSeq: -1 },
  testLoader: null // test seam: async () => real module shape
};

function warnOnce(key, message) {
  if (state.warned.has(key)) return;
  state.warned.add(key);
  console.warn(message);
}

// The official loop drives detection from the shim video element; the real
// landmarker detects on the canvas painted from the camera pull lane.
function ensureCanvas(width, height) {
  if (typeof OffscreenCanvas !== 'function') return null;
  if (!state.canvas) {
    state.canvas = new OffscreenCanvas(width, height);
    state.ctx = state.canvas.getContext('2d');
  }
  if (state.canvas.width !== width || state.canvas.height !== height) {
    state.canvas.width = width;
    state.canvas.height = height;
    state.imageData = null;
  }
  if (!state.imageData || state.imageData.width !== width ||
      state.imageData.height !== height) {
    state.imageData = new ImageData(width, height);
  }
  return state.canvas;
}

function paintFrame(bytes, width, height) {
  const canvas = ensureCanvas(width, height);
  if (!canvas || !state.ctx) return false;
  state.imageData.data.set(bytes);
  state.ctx.putImageData(state.imageData, 0, 0);
  state.frameSeq++;
  for (const entry of state.entries) {
    const texture = entry.texture;
    if (!texture || texture.disposed === true) continue;
    texture.image = canvas;
    texture.needsUpdate = true;
    if (entry.video && entry.metadataSent !== true) {
      entry.metadataSent = true;
      const video = entry.video;
      try {
        video.videoWidth = width;
        video.videoHeight = height;
        video.readyState = 4;
        if (typeof video.dispatchEvent === 'function') {
          video.dispatchEvent({ type: 'loadedmetadata' });
        }
      } catch (_) {
        // A shim element that refuses metadata keeps the square placeholder.
      }
    }
  }
  return true;
}

// ── CDN hydration (worker, online) ──────────────────────────────────────────

async function hydrate(wasmBase) {
  if (state.hydrationStarted) return state;
  state.hydrationStarted = true;
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      warnOnce('offline', OFFLINE_WARN);
      state.hydrationFailed = true;
      return state;
    }
    const mod = state.testLoader
      ? await state.testLoader(wasmBase)
      : await import(TASKS_VISION_CDN);
    state.vision = mod;
    const fileset = await mod.FilesetResolver.forVisionTasks(wasmBase);
    const options = {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU'
      },
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
      runningMode: 'VIDEO',
      numFaces: 1
    };
    try {
      state.landmarker = await mod.FaceLandmarker.createFromOptions(
        fileset, options);
      state.delegate = 'GPU';
    } catch (_) {
      // Bounded CPU fallback: same task, same options, software delegate.
      state.landmarker = await mod.FaceLandmarker.createFromOptions(fileset, {
        ...options,
        baseOptions: { ...options.baseOptions, delegate: 'CPU' }
      });
      state.delegate = 'CPU';
    }
  } catch (error) {
    state.hydrationFailed = true;
    warnOnce('cdn', `${CDN_WARN} (${error && error.message || error})`);
  }
  return state;
}

// ── camera pull lane (the native camera.* contract, web host answers) ───────

function stopPull(message) {
  if (state.pull.intervalId !== null && typeof clearInterval === 'function') {
    clearInterval(state.pull.intervalId);
  }
  state.pull.intervalId = null;
  state.pull.active = false;
  if (message) warnOnce('camera.frames', message);
}

const frameBuffer = { bytes: null, expected: 0 };

function applyFrame(frame) {
  const width = frame.width | 0;
  const height = frame.height | 0;
  if (width <= 0 || height <= 0 || width > MAX_FRAME_EDGE || height > MAX_FRAME_EDGE) {
    warnOnce('camera.frames.dim',
      'three: web camera frame dimensions are outside the bounded lane; keeping the placeholder backdrop.');
    return;
  }
  const expected = width * height * 4;
  if (expected > MAX_FRAME_BYTES) {
    warnOnce('camera.frames.bytes',
      'three: web camera frame exceeds the bounded lane bytes; keeping the placeholder backdrop.');
    return;
  }
  if (!frameBuffer.bytes || frameBuffer.expected !== expected) {
    frameBuffer.bytes = new Uint8Array(expected);
    frameBuffer.expected = expected;
  }
  const decoded = b64decodeInto(frame.data || '', frameBuffer.bytes);
  if (decoded !== expected) {
    warnOnce('camera.frames.payload',
      'three: web camera frame payload does not match its declared RGBA8 dimensions; frame dropped.');
    return;
  }
  paintFrame(frameBuffer.bytes, width, height);
}

function pull() {
  const jsr = globalThis.jsr;
  if (!state.pull.active || state.pull.inflight ||
      !jsr || typeof jsr.hostCall !== 'function') return;
  state.pull.inflight = true;
  Promise.resolve()
    .then(() => jsr.hostCall('camera.frame', { seq: state.pull.lastSeq }))
    .then(frame => {
      state.pull.inflight = false;
      if (!state.pull.active) return;
      if (!frame) {
        state.pull.failures = 0;
        return;
      }
      if (frame.available === false) {
        stopPull();
        return;
      }
      if (frame.changed === false) {
        state.pull.failures = 0;
        return;
      }
      if (typeof frame.seq === 'number') state.pull.lastSeq = frame.seq;
      try {
        applyFrame(frame);
        state.pull.failures = 0;
      } catch (error) {
        if (++state.pull.failures > MAX_CONSECUTIVE_FAILURES) {
          stopPull(PULL_FAIL_WARN);
        } else {
          warnOnce('camera.frames.reject',
            `three: web camera frame rejected (${error && error.message || error}); keeping the last frame.`);
        }
      }
    })
    .catch(() => {
      state.pull.inflight = false;
      if (++state.pull.failures > MAX_CONSECUTIVE_FAILURES) stopPull(PULL_FAIL_WARN);
    });
}

function startCameraPull() {
  if (state.pull.started) return;
  const jsr = globalThis.jsr;
  if (!jsr || typeof jsr.hostCall !== 'function') return;
  state.pull.started = true;
  Promise.resolve()
    .then(() => jsr.hostCall('camera.start', { fps: 15 }))
    .then(granted => {
      if (granted && granted.available === true) {
        state.pull.active = true;
        if (typeof setInterval === 'function') {
          state.pull.intervalId = setInterval(pull, PULL_INTERVAL_MS);
        }
      } else {
        const reason = granted && granted.reason ? ` (${granted.reason})` : '';
        warnOnce('camera.start',
          `${CAMERA_WARN_PREFIX}${reason}${CAMERA_WARN_SUFFIX}`);
      }
    })
    .catch(() => {
      // Host without a camera.* lane (plain widget embed) — silently keep the
      // placeholder, exactly like the native lane does for foreign hosts.
    });
}

// ── stand-ins (the stripped official awaits call these synchronously) ───────

export const FilesetResolver = {
  // The static stub resolved instantly and this bundle stripped the awaits;
  // hydration therefore continues in the background and detectForVideo keeps
  // returning the empty stub results until the real landmarker is ready.
  forVisionTasks(wasmBase) {
    if (state.webBackend !== true && !isWebBackend()) {
      // Native (flutterGpu) bundle: keep today's static-stub behavior.
      warnOnce('offline', OFFLINE_WARN);
      return { boundedStaticFallback: true };
    }
    state.webBackend = true;
    hydrate(String(wasmBase || WASM_CDN));
    return { jsrMediapipeWeb: true };
  }
};

function makeLandmarkerStandIn() {
  return {
    jsrMediapipeWebStandIn: true,
    detectForVideo(_source, _timestamp) {
      const landmarker = state.landmarker;
      if (!landmarker || state.frameSeq === 0 ||
          state.detectedSeq === state.frameSeq) {
        return state.lastResults;
      }
      try {
        // MediaPipe VIDEO mode requires strictly increasing timestamps; the
        // official loop passes Date.now(), which can repeat inside one
        // millisecond, so the delegated detect carries a monotonic stamp.
        const now = Date.now();
        const timestamp = now > state.lastDetectTs ? now : state.lastDetectTs + 1;
        state.lastDetectTs = timestamp;
        const raw = landmarker.detectForVideo(state.canvas, timestamp);
        const results = {
          faceBlendshapes: Array.isArray(raw.faceBlendshapes)
            ? raw.faceBlendshapes.map(face => ({
              categories: sanitizeCategories(face.categories)
            }))
            : [],
          facialTransformationMatrixes: Array.isArray(
            raw.facialTransformationMatrixes)
            ? raw.facialTransformationMatrixes
            : []
        };
        state.lastResults = results;
        state.detectedSeq = state.frameSeq;
        state.lastDetectErrorWarned = false;
        return results;
      } catch (error) {
        // Consume the frame even on failure: the retry waits for the next
        // new frame instead of hammering a broken landmarker every RAF tick.
        state.detectedSeq = state.frameSeq;
        if (!state.lastDetectErrorWarned) {
          state.lastDetectErrorWarned = true;
          console.warn(`three: MediaPipe detect failed once (${error && error.message || error}); keeping the last results.`);
        }
        return state.lastResults;
      }
    },
    close() {
      try {
        if (state.landmarker && typeof state.landmarker.close === 'function') {
          state.landmarker.close();
        }
      } catch (_) { /* teardown best effort */ }
      stopPull();
      state.landmarker = null;
    }
  };
}

export const FaceLandmarker = {
  createFromOptions(_fileset, _options) {
    if (state.webBackend !== true && !isWebBackend()) {
      return makeStaticLandmarker();
    }
    state.webBackend = true;
    // The bundled official loop keeps calling detectForVideo on this stand-in
    // every frame; hydration swaps the delegation underneath when ready.
    return makeLandmarkerStandIn();
  }
};

function makeStaticLandmarker() {
  return {
    boundedStaticFallback: true,
    detectForVideo() {
      return { faceBlendshapes: [], facialTransformationMatrixes: [] };
    },
    close() {}
  };
}

// ── compat installer (web backend + worker scope only) ──────────────────────

function isWebBackend() {
  const host = globalThis.jsr && globalThis.jsr.three;
  return !!(host && typeof host.getCapabilities === 'function' &&
    host.getCapabilities().backend === 'webgl2');
}

export function installMediapipeWebCompat() {
  state.webBackend = isWebBackend();
  if (!state.webBackend) return;
  // Worker scope only: the page side has no jsr.three facade canvas and no
  // importScripts; the widget bundle only runs there in a Worker.
  if (typeof importScripts !== 'function') return;
  if (globalThis.__jsrWebcamWebVideoTexture) return; // idempotent

  // Ownership wrap for the widget's VideoTexture: swaps the shim element for
  // a bounded placeholder canvas immediately (isVideoTexture=false, so the
  // example adapter's first-render 16x16 checker degrade never clobbers it),
  // then repaints it from the camera pull lane. Mirrors the native wrap in
  // webcam_host.mjs minus the native texture format.
  globalThis.__jsrWebcamWebVideoTexture = Base => class JsrWebcamWebVideoTexture
    extends Base {
    constructor(element) {
      super(element);
      if (state.entries.length >= MAX_TRACKED_TEXTURES ||
          state.entries.some(entry => entry.texture === this)) return;
      const texture = this;
      texture.userData = texture.userData || {};
      texture.userData.jsrVideoElement = texture.image || element || null;
      texture.isVideoTexture = false;
      const placeholder = typeof OffscreenCanvas === 'function'
        ? new OffscreenCanvas(16, 16)
        : null;
      if (placeholder) {
        const ctx = placeholder.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(0, 0, 16, 16);
        }
        texture.image = placeholder;
        texture.needsUpdate = true;
      }
      state.entries.push({ texture, video: element || null, metadataSent: false });
      startCameraPull();
    }
  };

  // Test/debug seam (webcam_host.mjs precedent): pull-lane and hydration
  // state for the node suite and capture triage.
  globalThis.__jsrMediapipeWebDiagnostics = () => ({
    webBackend: state.webBackend,
    online: typeof navigator !== 'undefined' ? navigator.onLine : null,
    hydrationStarted: state.hydrationStarted,
    hydrationFailed: state.hydrationFailed,
    delegate: state.delegate,
    frameSeq: state.frameSeq,
    detectedSeq: state.detectedSeq,
    entries: state.entries.length,
    pullActive: state.pull.active,
    warns: Array.from(state.warned)
  });
  globalThis.__jsrMediapipeWebPaintFrame = paintFrame;
}

// Node-suite seam: inject a fake tasks-vision module factory so hydration
// runs fully offline (same shape: FilesetResolver.forVisionTasks /
// FaceLandmarker.createFromOptions). MUST be set before forVisionTasks.
export function setLoaderForTest(loader) {
  state.testLoader = loader;
}
export const __jsrMediapipeWebSetLoaderForTest = setLoaderForTest;
