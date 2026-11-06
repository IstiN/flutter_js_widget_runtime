// MediaPipe web degrade tests: the worker-side CDN lane behind
// webgl_morphtargets_webcam on the web runtime. Covers the pure official
// mapping math (name table, eye-look sums, morph application), the
// web/native gating, the camera.* pull lane, CDN hydration against a MOCKED
// tasks-vision module (no network in CI), the timestamp/dedupe guards and
// the offline stub parity. The prepared bundle wiring is asserted at the
// end; the official bytes themselves stay pinned by prepare.mjs.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const DEGRADE = path.join(ROOT, 'tool/three_example/degrades/mediapipe_web.mjs');
const OFFICIAL = path.join(
  ROOT, 'example/widgets/three-morphtargets-webcam/official_module.js');
const WIDGET = path.join(
  ROOT, 'example/widgets/three-morphtargets-webcam/widget.js');

// Fresh module instance per branch: hydration is a single-flight per import.
const loadDegrade = async tag => {
  const mod = await import(`${DEGRADE}?case=${tag}`);
  const host = await import(
    path.join(ROOT, 'tool/three_example/degrades/webcam_host.mjs'));
  return { ...mod, b64decodeInto: host.b64decodeInto };
};

const b64 = bytes => Buffer.from(bytes).toString('base64');

// ── pure mapping math ───────────────────────────────────────────────────────
{
  const { BLENDSHAPES_MAP, computeEyeScores } = await loadDegrade('pure');

  // The table must match the official example's blendshapesMap byte-for-byte.
  const official = await readFile(OFFICIAL, 'utf8');
  const block = /const blendshapesMap = \{([\s\S]*?)\};/.exec(official);
  assert.ok(block, 'official blendshapesMap block found');
  const expected = {};
  for (const [, name, value] of block[1].matchAll(
      /'([\w]+)':\s*'([\w]+)'/g)) {
    expected[name] = value;
  }
  assert.equal(Object.keys(expected).length, 51,
    'official table carries its 51 mapped categories (tongueOut is commented out upstream)');
  assert.deepEqual(BLENDSHAPES_MAP, expected,
    'degrade table is the official table');
  // Comment-only rows must not leak into either table.
  assert.ok(!('_neutral' in BLENDSHAPES_MAP), '_neutral stays unmapped');

  // Official eye-look sums: two categories per axis, add one subtract the
  // other; everything else is ignored.
  const scores = computeEyeScores([
    { categoryName: 'eyeLookInLeft', score: 0.4 },
    { categoryName: 'eyeLookOutLeft', score: 0.1 },
    { categoryName: 'eyeLookInRight', score: 0.2 },
    { categoryName: 'eyeLookOutRight', score: 0.5 },
    { categoryName: 'eyeLookUpLeft', score: 0.6 },
    { categoryName: 'eyeLookDownLeft', score: 0.25 },
    { categoryName: 'eyeLookUpRight', score: 0.1 },
    { categoryName: 'eyeLookDownRight', score: 0.3 },
    { categoryName: 'jawOpen', score: 0.9 },
    { categoryName: 'eyeLookInLeft', score: 0.1 }
  ]);
  assert.ok(Math.abs(scores.leftHorizontal - 0.4) < 1e-9);
  assert.ok(Math.abs(scores.rightHorizontal - 0.3) < 1e-9);
  assert.ok(Math.abs(scores.leftVertical - -0.35) < 1e-9);
  assert.ok(Math.abs(scores.rightVertical - 0.2) < 1e-9);
  const empty = computeEyeScores([{ categoryName: 'jawOpen', score: 1 }]);
  assert.deepEqual(empty, {
    leftHorizontal: 0, rightHorizontal: 0, leftVertical: 0, rightVertical: 0
  });
  assert.deepEqual(computeEyeScores([]), empty);
  assert.deepEqual(computeEyeScores(null), empty);
  assert.deepEqual(computeEyeScores([undefined, {}]), empty,
    'malformed entries contribute nothing');
}

// ── applyFaceResult: pure mirror of the official animate() loop ─────────────
{
  const { applyFaceResult, EYE_ROTATION_LIMIT } = await loadDegrade('apply');
  assert.ok(Math.abs(EYE_ROTATION_LIMIT - Math.PI / 6) < 1e-12,
    'official eyeRotationLimit is degToRad(30)');

  const makeFace = () => ({
    morphTargetDictionary: { eyeBlink_L: 3, jawOpen: 7 },
    morphTargetInfluences: [0, 0, 0, 0, 0, 0, 0, 0]
  });
  const makeEye = () => ({ rotation: { x: 0, z: 0 } });
  const result = categories => ({
    faceBlendshapes: [{ categories }],
    facialTransformationMatrixes: []
  });

  const face = makeFace();
  const eyeL = makeEye();
  const eyeR = makeEye();
  const applied = applyFaceResult(result([
    { categoryName: 'eyeBlinkLeft', score: 0.8 },
    { categoryName: 'jawOpen', score: 0.5 },
    { categoryName: '_neutral', score: 1 },
    { categoryName: 'notInTheMap', score: 1 }
  ]), { face, eyeL, eyeR });
  assert.equal(face.morphTargetInfluences[3], 0.8, 'eyeBlink_L driven');
  assert.equal(face.morphTargetInfluences[7], 0.5, 'jawOpen driven');
  assert.deepEqual(applied.applied, ['eyeBlinkLeft', 'jawOpen'],
    'only mapped categories apply');
  assert.deepEqual(applied.eyeScore, {
    leftHorizontal: 0, rightHorizontal: 0, leftVertical: 0, rightVertical: 0
  });

  // Eye rotations: sums scaled by the official 30-degree limit.
  const eyeFace = makeFace();
  const eyeApplied = applyFaceResult(result([
    { categoryName: 'eyeLookInLeft', score: 0.5 },
    { categoryName: 'eyeLookUpRight', score: 0.4 }
  ]), { face: eyeFace, eyeL, eyeR });
  assert.ok(Math.abs(eyeL.rotation.z - 0.5 * Math.PI / 6) < 1e-12);
  assert.ok(Math.abs(eyeL.rotation.x - 0) < 1e-12);
  assert.ok(Math.abs(eyeR.rotation.z - 0) < 1e-12);
  assert.ok(Math.abs(eyeR.rotation.x - -0.4 * Math.PI / 6) < 1e-12);
  const custom = applyFaceResult(result([
    { categoryName: 'eyeLookDownLeft', score: 0.5 }
  ]), { face: eyeFace, eyeL, eyeR }, 1);
  assert.equal(eyeL.rotation.x, 0.5, 'custom limit honored');
  assert.deepEqual(custom.eyeScore.leftVertical, 0.5);

  // Official guards: no blendshapes -> zero eye writes, no morph writes.
  eyeL.rotation.z = 9;
  const noResults = applyFaceResult(
    { faceBlendshapes: [] }, { face: eyeFace, eyeL, eyeR });
  assert.equal(eyeL.rotation.z, 9, 'empty results leave the eyes untouched');
  assert.deepEqual(noResults.applied, []);
  const noFace = applyFaceResult(result([
    { categoryName: 'jawOpen', score: 1 }
  ]), { eyeL: null, eyeR: null });
  assert.deepEqual(noFace.applied, [], 'no face target applies nothing');
  assert.deepEqual(noFace.eyeScore.leftVertical, 0,
    'eye sums still computed without targets');
  applyFaceResult(null, { face: eyeFace, eyeL: null, eyeR: null });
  applyFaceResult(undefined, null);
}

// ── sanitizeCategories: bounded transport-sanity filter ─────────────────────
{
  const { sanitizeCategories } = await loadDegrade('sanitize');
  assert.deepEqual(sanitizeCategories([
    { categoryName: 'jawOpen', score: 1.5 },
    { categoryName: 'eyeBlinkLeft', score: -0.2 },
    { categoryName: 'browInnerUp', score: '0.3' },
    { categoryName: '_neutral', score: 1 },
    { categoryName: 'unknownName', score: 0.5 },
    { categoryName: 42, score: 1 },
    null,
    { score: 1 }
  ]), [
    { categoryName: 'jawOpen', score: 1 },
    { categoryName: 'eyeBlinkLeft', score: 0 },
    { categoryName: 'browInnerUp', score: 0 }
  ], 'mapped names kept, scores clamped to 0..1, junk dropped');
  assert.deepEqual(sanitizeCategories('nope'), []);
  assert.deepEqual(sanitizeCategories(undefined), []);
}

// ── shared harness: fake jsr + manual interval pump ─────────────────────────
const realWarn = console.warn;
const realSetInterval = globalThis.setInterval;
const realClearInterval = globalThis.clearInterval;

function makeEnv({ backend = 'webgl2', hostAvailable = true, rejectStart = false } = {}) {
  const warnings = [];
  console.warn = message => { warnings.push(String(message)); };
  let intervalCallback = null;
  let intervalMs = 0;
  let intervalsCleared = 0;
  globalThis.setInterval = (callback, ms) => {
    intervalCallback = callback;
    intervalMs = ms;
    return 1;
  };
  globalThis.clearInterval = () => { intervalsCleared++; intervalCallback = null; };

  const hostCalls = [];
  let frameIndex = 0;
  const frames = [];
  let startResult = hostAvailable
    ? { available: true, width: 8, height: 6 }
    : { available: false, reason: 'camera permission denied' };
  const jsr = {
    three: { getCapabilities: () => ({ backend }) },
    hostCall(name, args) {
      hostCalls.push({ name, args });
      if (name === 'camera.start') {
        if (rejectStart) return Promise.reject(new Error('unknown host call'));
        return Promise.resolve(startResult);
      }
      if (name === 'camera.frame') {
        if (frameIndex >= frames.length) {
          return Promise.resolve({ available: true, changed: false, seq: 0 });
        }
        const frame = frames[frameIndex++];
        return Promise.resolve(frame);
      }
      if (name === 'camera.stop') return Promise.resolve({ available: false });
      return Promise.reject(new Error(`unexpected ${name}`));
    }
  };
  const savedJsr = globalThis.jsr;
  globalThis.jsr = jsr;
  // The install gate requires worker scope; the node suite simulates the
  // dedicated-worker global the widget bundle really runs in on web.
  const savedImportScripts = globalThis.importScripts;
  globalThis.importScripts = savedImportScripts || function importScripts() {};
  return {
    jsr, warnings, hostCalls,
    get intervalMs() { return intervalMs; },
    get intervalActive() { return intervalCallback !== null; },
    get intervalsCleared() { return intervalsCleared; },
    pump() { if (intervalCallback) intervalCallback(); },
    pushFrame(frame) { frames.push(frame); },
    async settle(ticks = 6) {
      for (let i = 0; i < ticks; i++) await new Promise(r => setImmediate(r));
    },
    teardown() {
      console.warn = realWarn;
      globalThis.setInterval = realSetInterval;
      globalThis.clearInterval = realClearInterval;
      if (savedJsr === undefined) delete globalThis.jsr;
      else globalThis.jsr = savedJsr;
      if (savedImportScripts === undefined) delete globalThis.importScripts;
      else globalThis.importScripts = savedImportScripts;
      delete globalThis.__jsrWebcamWebVideoTexture;
      delete globalThis.__jsrMediapipeWebDiagnostics;
      delete globalThis.__jsrMediapipeWebPaintFrame;
    }
  };
}

// Worker-safe canvas shims so the frame pipeline can run its real math.
class FakeOffscreenCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }
  getContext() {
    return {
      fillRect() {},
      putImageData(imageData) { this.lastImage = imageData; },
      drawImage() {}
    };
  }
}
class FakeImageData {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }
}

// ── native gate: the flutterGpu backend keeps the static stub ───────────────
{
  const mod = await loadDegrade('native');
  const env = makeEnv({ backend: 'flutterGpu' });
  mod.installMediapipeWebCompat();
  assert.equal(globalThis.__jsrWebcamWebVideoTexture, undefined,
    'no web wrap on the native backend');
  const fileset = mod.FilesetResolver.forVisionTasks('https://wasm');
  assert.deepEqual(fileset, { boundedStaticFallback: true },
    'static stub shape preserved on native');
  assert.ok(env.warnings.some(w => w.startsWith(
    'three: MediaPipe webcam tracking is unavailable offline')),
    'the existing offline warn still fires on native');
  const landmarker = mod.FaceLandmarker.createFromOptions(fileset, {});
  assert.equal(landmarker.boundedStaticFallback, true);
  const results = landmarker.detectForVideo({}, 1);
  assert.deepEqual(results, { faceBlendshapes: [], facialTransformationMatrixes: [] });
  landmarker.close();
  env.teardown();
}

// ── offline gate: navigator.onLine === false keeps the stub + one warn ──────
{
  const mod = await loadDegrade('offline');
  const env = makeEnv({ backend: 'webgl2' });
  const savedNavigator = globalThis.navigator;
  Object.defineProperty(globalThis, 'navigator', {
    value: { onLine: false }, configurable: true
  });
  try {
    mod.installMediapipeWebCompat();
    assert.equal(typeof globalThis.__jsrWebcamWebVideoTexture, 'function',
      'web wrap registered on the web backend');
    const diag = globalThis.__jsrMediapipeWebDiagnostics();
    assert.equal(diag.webBackend, true);

    const fileset = mod.FilesetResolver.forVisionTasks('https://wasm');
    assert.deepEqual(fileset, { jsrMediapipeWeb: true });
    await env.settle();
    const diag2 = globalThis.__jsrMediapipeWebDiagnostics();
    assert.equal(diag2.hydrationFailed, true, 'offline fails hydration');
    assert.equal(env.warnings.filter(w => w.includes(
      'unavailable offline')).length, 1, 'exactly one offline warn');

    const standin = mod.FaceLandmarker.createFromOptions(fileset, {});
    assert.equal(standin.detectForVideo({}, 1), standin.detectForVideo({}, 2),
      'empty stub results are stable');
    assert.deepEqual(standin.detectForVideo({}, 3), {
      faceBlendshapes: [], facialTransformationMatrixes: []
    });
  } finally {
    if (savedNavigator === undefined) delete globalThis.navigator;
    else Object.defineProperty(globalThis, 'navigator', { value: savedNavigator, configurable: true });
    env.teardown();
  }
}

// ── CDN failure: mocked loader rejects → bounded stub + one warn ────────────
{
  const mod = await loadDegrade('cdnfail');
  const env = makeEnv({ backend: 'webgl2' });
  mod.installMediapipeWebCompat();
  mod.setLoaderForTest(async () => {
    throw new Error('net down');
  });
  const fileset = mod.FilesetResolver.forVisionTasks('https://wasm');
  await env.settle();
  assert.ok(env.warnings.some(w =>
    w.startsWith('three: MediaPipe tasks-vision could not be loaded from the CDN') &&
    w.includes('net down')), 'one bounded CDN warn with the reason');
  const standin = mod.FaceLandmarker.createFromOptions(fileset, {});
  assert.deepEqual(standin.detectForVideo({}, 1), {
    faceBlendshapes: [], facialTransformationMatrixes: []
  }, 'stays on the stub after hydration failure');
  env.teardown();
}

// ── web happy path: mocked tasks-vision drives the full pipeline ────────────
{
  const mod = await loadDegrade('web');
  const env = makeEnv({ backend: 'webgl2' });
  globalThis.OffscreenCanvas = FakeOffscreenCanvas;
  globalThis.ImageData = FakeImageData;

  // ── fake task-vision module: asserts the official creation contract ──
  let detectCalls = 0;
  let lastDetectTs = 0;
  let closedCount = 0;
  const officialCategories = () => [
    { categoryName: '_neutral', score: 1 },
    { categoryName: 'eyeBlinkLeft', score: 0.8 },
    { categoryName: 'jawOpen', score: 1.5 },
    { categoryName: 'eyeLookInLeft', score: 0.25 },
    { categoryName: 'notMapped', score: 1 }
  ];
  const fakeModule = {
    FilesetResolver: {
      async forVisionTasks(wasmBase) {
        assert.equal(wasmBase,
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm',
          'official wasm fileset base');
        return { wasm: true };
      }
    },
    FaceLandmarker: {
      async createFromOptions(fileset, options) {
        assert.deepEqual(fileset, { wasm: true });
        assert.equal(options.baseOptions.modelAssetPath,
          'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          'official model asset path');
        assert.equal(options.baseOptions.delegate, 'GPU', 'official delegate');
        assert.equal(options.outputFaceBlendshapes, true);
        assert.equal(options.outputFacialTransformationMatrixes, true);
        assert.equal(options.runningMode, 'VIDEO');
        assert.equal(options.numFaces, 1);
        return {
          detectForVideo(_source, timestamp) {
            assert.ok(timestamp > lastDetectTs,
              'delegated timestamps are strictly increasing');
            lastDetectTs = timestamp;
            detectCalls++;
            if (detectCalls === 3) {
              throw new Error('wasm reset mid-run');
            }
            return {
              faceBlendshapes: [{ categories: officialCategories() }],
              facialTransformationMatrixes: [
                { data: new Float32Array(16).fill(0.5) }
              ]
            };
          },
          close() { closedCount++; }
        };
      }
    }
  };
  mod.setLoaderForTest(async () => fakeModule);

  mod.installMediapipeWebCompat();

  // VideoTexture wrap: ownership taken at construction.
  let metadataEvents = 0;
  const shimVideo = {
    addEventListener(type, callback) {
      if (type === 'loadedmetadata') metadataListener = callback;
    },
    dispatchEvent(event) {
      if (event && event.type === 'loadedmetadata') metadataEvents++;
    },
    videoWidth: 0, videoHeight: 0, readyState: 0, srcObject: null
  };
  let metadataListener = null;
  class FakeVideoTexture {
    constructor(element) { this.image = element; this.isVideoTexture = true; }
  }
  const Wrapped = globalThis.__jsrWebcamWebVideoTexture(FakeVideoTexture);
  const texture = new Wrapped(shimVideo);
  assert.equal(texture.isVideoTexture, false,
    'ownership taken (the checker degrade never fires)');
  assert.equal(texture.userData.jsrVideoElement, shimVideo);
  assert.notEqual(texture.image, shimVideo, 'placeholder canvas swapped in');
  assert.equal(texture.needsUpdate, true);
  await env.settle(2);
  assert.equal(env.hostCalls.length, 1, 'camera.start fires at construction');
  assert.equal(env.hostCalls[0].name, 'camera.start');
  assert.equal(env.intervalMs, 66, 'bounded 66ms pull cadence');
  assert.equal(env.intervalActive, true, 'pull loop running after the grant');

  // Extra textures are tracked (up to the quota) and the loop is not
  // restarted per texture.
  const second = new Wrapped({ addEventListener() {}, dispatchEvent() {} });
  assert.equal(env.hostCalls.length, 1, 'single camera.start per widget run');

  // ── hydration against the mocked module ──
  const standin = mod.FaceLandmarker.createFromOptions(
    mod.FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'), {});
  await env.settle(4);
  const diag = globalThis.__jsrMediapipeWebDiagnostics();
  assert.equal(diag.hydrationFailed, false, 'mocked hydration succeeds');
  assert.equal(diag.delegate, 'GPU');

  // Before any frame: the official loop sees the empty stub results.
  assert.deepEqual(standin.detectForVideo(shimVideo, 1), {
    faceBlendshapes: [], facialTransformationMatrixes: []
  });
  assert.equal(detectCalls, 0, 'no real detect before the first frame');

  // Frame 1: paint → detect delegates, sanitize filters + clamps.
  const pixels = new Uint8Array(8 * 6 * 4).fill(7);
  env.pushFrame({
    available: true, changed: true, seq: 1, width: 8, height: 6,
    format: 'rgba', data: b64(pixels)
  });
  env.pump();
  await env.settle(3);
  assert.equal(metadataEvents, 1, 'loadedmetadata dispatched on frame 1');
  assert.equal(shimVideo.videoWidth, 8);
  assert.equal(shimVideo.videoHeight, 6);
  assert.equal(shimVideo.readyState, 4);
  assert.equal(texture.image.width, 8, 'backdrop texture now owns the frame canvas');
  assert.equal(texture.needsUpdate, true);

  const results1 = standin.detectForVideo(shimVideo, Date.now());
  assert.equal(detectCalls, 1);
  assert.deepEqual(results1.faceBlendshapes[0].categories, [
    { categoryName: 'eyeBlinkLeft', score: 0.8 },
    { categoryName: 'jawOpen', score: 1 },
    { categoryName: 'eyeLookInLeft', score: 0.25 }
  ], 'only mapped categories, scores clamped');
  assert.equal(results1.facialTransformationMatrixes[0].data.length, 16,
    'matrix passthrough');

  // Cached: repeated detects without a new frame return the same object.
  const results2 = standin.detectForVideo(shimVideo, Date.now());
  assert.equal(results1, results2, 'no new frame → cached results');
  assert.equal(detectCalls, 1, 'real detect runs once per frame');

  // Frame 2 → re-detect with a later timestamp.
  env.pushFrame({
    available: true, changed: true, seq: 2, width: 8, height: 6,
    format: 'rgba', data: b64(pixels)
  });
  env.pump();
  await env.settle(3);
  const results3 = standin.detectForVideo(shimVideo, Date.now());
  assert.equal(detectCalls, 2, 'new frame re-detects');
  assert.notEqual(results3, results1);

  // Frame 3 → real detect throws once → cached results + one bounded warn.
  env.pushFrame({
    available: true, changed: true, seq: 3, width: 8, height: 6,
    format: 'rgba', data: b64(pixels)
  });
  env.pump();
  await env.settle(3);
  const results4 = standin.detectForVideo(shimVideo, Date.now());
  assert.equal(results4, results3, 'failed detect keeps the last results');
  assert.ok(env.warnings.some(w => w.includes(
    'three: MediaPipe detect failed once')), 'one bounded detect warn');
  const results5 = standin.detectForVideo(shimVideo, Date.now());
  assert.equal(results4, results5);

  // changed:false short-circuit: no paint, no detect churn.
  const seqBefore = globalThis.__jsrMediapipeWebDiagnostics().frameSeq;
  env.pushFrame({ available: true, changed: false, seq: 3 });
  env.pump();
  await env.settle(2);
  assert.equal(globalThis.__jsrMediapipeWebDiagnostics().frameSeq, seqBefore);

  // Host tears the lane down → pull loop stops, camera.start is not retried.
  env.pushFrame({ available: false });
  env.pump();
  await env.settle(2);
  assert.equal(env.intervalActive, false, 'pull loop stopped');
  standin.close();
  assert.equal(closedCount, 1, 'real landmarker released');

  // applyFaceResult drives the official morph math from the stand-in's
  // results (the widget's bundled loop does the same at runtime).
  const face = {
    morphTargetDictionary: { eyeBlink_L: 0, jawOpen: 1 },
    morphTargetInfluences: [0, 0]
  };
  const applied = mod.applyFaceResult(results3, {
    face, eyeL: { rotation: {} }, eyeR: { rotation: {} }
  });
  assert.equal(face.morphTargetInfluences[0], 0.8);
  assert.equal(face.morphTargetInfluences[1], 1);
  assert.equal(applied.applied.length, 2);

  env.teardown();
  delete globalThis.OffscreenCanvas;
  delete globalThis.ImageData;
}

// ── camera lane bounds: rejects, denials, malformed frames ──────────────────
{
  globalThis.OffscreenCanvas = FakeOffscreenCanvas;
  globalThis.ImageData = FakeImageData;

  // camera.start refused: one bounded warn, no interval.
  {
    const mod = await loadDegrade('lane-denied');
    const env = makeEnv({ hostAvailable: false });
    mod.installMediapipeWebCompat();
    class FakeVideoTexture { constructor(element) { this.image = element; } }
    const Wrapped = globalThis.__jsrWebcamWebVideoTexture(FakeVideoTexture);
    new Wrapped({});
    await env.settle(2);
    assert.ok(env.warnings.some(w =>
      w.startsWith('three: web camera lane unavailable') &&
      w.includes('camera permission denied')), 'refusal warn carries the reason');
    assert.equal(env.intervalActive, false);
    env.teardown();
  }

  // camera.start unsupported (foreign host): silent, no interval.
  {
    const mod = await loadDegrade('lane-foreign');
    const env = makeEnv({ rejectStart: true });
    mod.installMediapipeWebCompat();
    class FakeVideoTexture { constructor(element) { this.image = element; } }
    const Wrapped = globalThis.__jsrWebcamWebVideoTexture(FakeVideoTexture);
    new Wrapped({});
    await env.settle(2);
    assert.equal(env.warnings.length, 0, 'foreign host stays silent');
    assert.equal(env.intervalActive, false);
    env.teardown();
  }

  // Malformed / oversized payloads are bounded and non-fatal.
  {
    const mod = await loadDegrade('lane-frames');
    const env = makeEnv();
    mod.installMediapipeWebCompat();
    class FakeVideoTexture { constructor(element) { this.image = element; } }
    const Wrapped = globalThis.__jsrWebcamWebVideoTexture(FakeVideoTexture);
    new Wrapped({});
    await env.settle(2);

    env.pushFrame({
      available: true, changed: true, seq: 1, width: 8, height: 6,
      format: 'rgba', data: b64(new Uint8Array(10)) // wrong byte count
    });
    env.pump();
    await env.settle(2);
    assert.ok(env.warnings.some(w => w.includes('payload does not match')),
      'malformed payload warns once');
    assert.equal(env.intervalActive, true, 'lane survives malformed frames');

    env.pushFrame({
      available: true, changed: true, seq: 2, width: 4096, height: 4096,
      format: 'rgba', data: b64(new Uint8Array(4))
    });
    env.pump();
    await env.settle(2);
    assert.ok(env.warnings.some(w => w.includes('outside the bounded lane')),
      'oversized dimensions warn once');
    assert.equal(env.intervalActive, true);

    // Quota: 30 consecutive host failures stop the loop with one warn.
    env.jsr.hostCall = () => Promise.reject(new Error('lane died'));
    for (let i = 0; i < 31; i++) {
      env.pump();
      await env.settle(1);
    }
    assert.equal(env.intervalActive, false, 'lane stops after the failure quota');
    assert.ok(env.warnings.some(w => w.includes(
      'web camera frame lane kept failing')), 'stop warn is bounded');

    // Malformed base64 is rejected by the shared decoder contract.
    assert.equal(mod.b64decodeInto('A@B=', new Uint8Array(4)), -1);

    env.teardown();
  }
  delete globalThis.OffscreenCanvas;
  delete globalThis.ImageData;
}

// ── idempotent install ──────────────────────────────────────────────────────
{
  const mod = await loadDegrade('quota');
  const env = makeEnv();
  mod.installMediapipeWebCompat();
  mod.installMediapipeWebCompat();
  const wrap = globalThis.__jsrWebcamWebVideoTexture;
  assert.equal(typeof wrap, 'function');
  assert.equal(globalThis.__jsrWebcamWebVideoTexture, wrap,
    'install is idempotent');
  assert.equal(globalThis.__jsrMediapipeWebDiagnostics().entries, 0);
  env.teardown();
}

// ── prepared bundle wiring ──────────────────────────────────────────────────
{
  const widget = await readFile(WIDGET, 'utf8');
  assert.ok(widget.includes('__jsrWebcamWebVideoTexture'),
    'web wrap wired into the prepared bundle');
  assert.ok(widget.includes('__jsrWebcamHostVideoTexture'),
    'native wrap still wired (native lane untouched)');
  assert.ok(widget.includes('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35'),
    'official CDN specifier retained');
  assert.ok(widget.includes('jsrMediapipeWeb'),
    'CDN import resolves to the online stand-in module');
  assert.ok(widget.includes(
    'three: MediaPipe webcam tracking is unavailable offline'),
    'offline stub warn retained');
  assert.ok(widget.includes('camera.frame'), 'camera pull lane present');
  // The official mapping loop itself stays in the bundle (byte-pinned by
  // prepare.mjs) — the pure table mirrors it, it does not replace it.
  assert.ok(widget.includes('eyeLookDownRight'), 'official loop bundled');
}

console.log(JSON.stringify({ ok: true, suite: 'mediapipe_web_test.mjs' }));
