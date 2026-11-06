// Webcam host degrade tests: the native `camera.*` pull lane behind the two
// official webcam examples. Covers the probe/fallback branches, the bounded
// base64 decoder, and the frame→texture math (dimensions, RGBA stride,
// version bumps, resize). The prepared bundles are asserted separately in
// prepare_test (facade wrap + compat wiring).
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const degrade = await import(path.join(ROOT, 'tool/three_example/degrades/webcam_host.mjs'));
const { installWebcamHostCompat, b64decodeInto } = degrade;

const b64 = bytes => Buffer.from(bytes).toString('base64');

// ── base64 decoder unit contract ────────────────────────────────────────────
{
  const target = new Uint8Array(16);
  for (let n = 0; n <= 16; n++) {
    const bytes = new Uint8Array(n);
    for (let i = 0; i < n; i++) bytes[i] = (i * 37 + 11) & 255;
    const decoded = new Uint8Array(n);
    assert.equal(b64decodeInto(b64(bytes), decoded), n, `round trip length ${n}`);
    assert.deepEqual(decoded, bytes, `round trip bytes ${n}`);
    // Padded alphabets decode into a bounded target without touching tail bytes.
    const padded = new Uint8Array(n + 3).fill(9);
    assert.equal(b64decodeInto(b64(bytes), padded), n);
    assert.equal(padded[n], 9, 'decoder writes no byte beyond the payload');
  }
  assert.equal(b64decodeInto('', new Uint8Array(4)), 0, 'empty payload decodes to zero bytes');
  assert.equal(b64decodeInto(b64(new Uint8Array(4)) + 'AA', new Uint8Array(8)), -1, 'length % 4 enforced');
  assert.equal(b64decodeInto('A===', new Uint8Array(4)), -1, 'triple padding rejected');
  assert.equal(b64decodeInto('A@B=', new Uint8Array(4)), -1, 'non-alphabet byte rejected');
  assert.equal(b64decodeInto('A=B=', new Uint8Array(4)), -1, 'padding before tail rejected');
  assert.equal(b64decodeInto(b64(new Uint8Array(8)), new Uint8Array(4)), -1, 'oversized target rejected');
}

// ── driver harness: fake jsr with captured hostCalls + manual timer pump ────
function makeHarness({ hostAvailable = true, rejectHostCall = false, startWidth = 3, startHeight = 2, trackUnavailable = false } = {}) {
  const warnings = [];
  const realWarn = console.warn;
  console.warn = message => { warnings.push(String(message)); };
  const realSetInterval = globalThis.setInterval;
  const realClearInterval = globalThis.clearInterval;
  let intervalCallback = null;
  let intervalCleared = 0;
  globalThis.setInterval = (callback, ms) => {
    assert.equal(ms, 40, 'pull cadence is the bounded 40ms');
    intervalCallback = callback;
    return 1;
  };
  globalThis.clearInterval = () => { intervalCleared++; intervalCallback = null; };

  const hostCalls = [];
  const frames = [];
  let frameIndex = 0;
  const jsr = {
    three: { getCapabilities: () => ({ backend: 'flutterGpu' }) },
    hostCall(name, args) {
      hostCalls.push({ name, args });
      if (rejectHostCall) return Promise.reject(new Error('hostCall is not supported'));
      if (name === 'camera.start') {
        return Promise.resolve(hostAvailable
          ? { available: true, width: startWidth, height: startHeight }
          : { available: false, reason: 'camera permission denied' });
      }
      if (name === 'camera.frame') {
        if (frameIndex >= frames.length) return Promise.resolve({ available: true, changed: false, seq: frameIndex - 1 });
        const frame = frames[frameIndex++];
        if (frame.available === false) return Promise.resolve(frame);
        return Promise.resolve(frame.response);
      }
      if (name === 'camera.stop') return Promise.resolve({ available: false });
      if (name === 'camera.track') {
        return Promise.resolve(trackUnavailable
          ? { available: true, tracking: false, reason: 'camera not started' }
          : { available: true, tracking: args && args.enable === true });
      }
      return Promise.reject(new Error(`unexpected ${name}`));
    }
  };

  const savedJsr = globalThis.jsr;
  const savedWrap = globalThis.__jsrWebcamHostVideoTexture;
  globalThis.jsr = jsr;
  installWebcamHostCompat();
  const wrap = globalThis.__jsrWebcamHostVideoTexture;

  const teardown = () => {
    console.warn = realWarn;
    globalThis.setInterval = realSetInterval;
    globalThis.clearInterval = realClearInterval;
    if (savedJsr === undefined) delete globalThis.jsr; else globalThis.jsr = savedJsr;
    if (savedWrap === undefined) delete globalThis.__jsrWebcamHostVideoTexture; else globalThis.__jsrWebcamHostVideoTexture = savedWrap;
    delete globalThis.__jsrWebcamHostApplyFrame;
    delete globalThis.__jsrWebcamHostApplySignals;
    delete globalThis.__jsrWebcamHostFaceState;
    delete globalThis.__jsrWebcamHostMorphMesh;
    delete globalThis.__jsrWebcamHostTextures;
    delete globalThis.__jsrWebcamHostCheckerImage;
  };

  return {
    jsr, hostCalls, warnings, teardown, wrap,
    get intervalActive() { return intervalCallback !== null; },
    pump() { if (intervalCallback) intervalCallback(); },
    pushFrame(width, height, seed = 0, extra = {}) {
      const bytes = new Uint8Array(width * height * 4);
      for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 7 + seed) & 255;
      const response = {
        available: true, changed: true, seq: frameIndex, width, height,
        format: 'rgba', data: b64(bytes), ...extra
      };
      frames.push({ response, available: true });
      return response;
    },
    pushStopped() {
      frames.push({ available: false, response: { available: false, seq: frameIndex } });
    }
  };
}

// A minimal stand-in for the shim VideoTexture: super() stores the image.
class FakeVideoTexture {
  constructor(element) {
    this.isVideoTexture = true;
    this.image = element;
    this.version = 0;
    this.needsUpdate = false;
  }
  set needsUpdate(value) { if (value) this.version++; this._needsUpdate = value; }
  get needsUpdate() { return this._needsUpdate; }
}

function fakeVideoElement(width = 16, height = 16) {
  const listeners = new Map();
  return {
    tagName: 'VIDEO', videoWidth: width, videoHeight: height, readyState: 4,
    srcObject: null,
    addEventListener(type, callback) { listeners.set(type, callback); },
    dispatchEvent(event) {
      const callback = listeners.get(event.type);
      if (callback) callback(event);
      return true;
    },
    listenerCount: type => listeners.has(type)
  };
}

// ── probe → live camera path: frame lands in the tracked texture ────────────
{
  const harness = makeHarness();
  try {
    assert.equal(typeof harness.wrap, 'function', 'facade wrap installed for flutterGpu');

    const video = fakeVideoElement();
    const texture = new (harness.wrap(FakeVideoTexture))(video);
    assert.ok(harness.jsr.hostCall === harness.jsr.hostCall);
    // The grant primes + dispatches loadedmetadata BEFORE the first pull,
    // so the listener must be attached before the probe resolves.
    let loadedMetadata = 0;
    video.addEventListener('loadedmetadata', () => { loadedMetadata++; });
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(harness.hostCalls[0], { name: 'camera.start', args: { fps: 24 } }, 'camera.start probe');
    assert.ok(harness.intervalActive, 'pull interval starts after an available probe');
    assert.equal(harness.warnings.length, 0, 'no warn on a granted camera');

    // First pull: 3x2 frame (odd width exercises the RGBA stride), metadata
    // event mirrors the official loadedmetadata listener.
    harness.pushFrame(3, 2, 5);
    await new Promise(resolve => setImmediate(resolve));
    harness.pump();
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));

    const image = texture.image;
    assert.equal(image.width, 3);
    assert.equal(image.height, 2);
    assert.equal(image.data.length, 24, 'RGBA8 stride is width*height*4');
    for (let i = 0; i < 24; i++) assert.equal(image.data[i], (i * 7 + 5) & 255, `pixel byte ${i}`);
    assert.equal(image.encoding, 0, 'raw RGBA encoding for the R1 texture lane');
    const versionAfterFirstFrame = texture.version;
    assert.ok(versionAfterFirstFrame > 0, 'needsUpdate bumped the R1 upload version');
    assert.equal(loadedMetadata, 1, 'one loadedmetadata dispatch (at grant, before the first frame)');
    assert.equal(video.videoWidth, 3);
    assert.equal(video.videoHeight, 2);
    assert.equal(texture.isVideoTexture, false, 'the webcam host owns the texture at grant (degrade skipped)');

    // changed:false short-circuit: no texture write, no version bump.
    await new Promise(resolve => setImmediate(resolve));
    harness.pump();
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(texture.version, versionAfterFirstFrame, 'unchanged seq skips the texture write');
    const dataBefore = Uint8Array.from(image.data);

    // Next frame with the SAME dimensions writes in place (no image swap).
    harness.pushFrame(3, 2, 200);
    await new Promise(resolve => setImmediate(resolve));
    harness.pump();
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(texture.image, image, 'same-dimension frames reuse the image object');
    assert.ok(texture.image.data.some((byte, i) => byte !== dataBefore[i]), 'pixels updated in place');
    assert.ok(texture.version > versionAfterFirstFrame, 'version bumps again for the R1 re-upload');

    // Dimension change: image object swapped, exact resize math holds.
    harness.pushFrame(4, 3, 42);
    await new Promise(resolve => setImmediate(resolve));
    harness.pump();
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));
    assert.notEqual(texture.image, image, 'dimension change swaps the image object');
    assert.equal(texture.image.width, 4);
    assert.equal(texture.image.height, 3);
    assert.equal(texture.image.data.length, 48);
    assert.equal(loadedMetadata, 1, 'loadedmetadata dispatches once per texture');

    // Host tears the session down: the pull loop stops without a warn.
    harness.pushStopped();
    await new Promise(resolve => setImmediate(resolve));
    harness.pump();
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(harness.intervalActive, false, 'available:false stops the pull loop');
    assert.equal(harness.warnings.length, 0, 'teardown stop is silent');
  } finally {
    harness.teardown();
  }
}

// ── resize-at-start: grant primes camera dims BEFORE any GPU submission ─────
{
  const harness = makeHarness({ startWidth: 32, startHeight: 18 });
  try {
    const video = fakeVideoElement();
    const texture = new (harness.wrap(FakeVideoTexture))(video);
    let loadedMetadata = 0;
    video.addEventListener('loadedmetadata', () => { loadedMetadata++; });
    await new Promise(resolve => setImmediate(resolve));

    // Grant primed the texture: camera-sized image installed BEFORE frame 0,
    // ownership taken (the example adapter's checker degrade must skip), and
    // NO needsUpdate bump — the zeroed prime is never submitted on its own,
    // so the texture's first GPU upload is camera frame 0 at camera dims.
    const primedImage = texture.image;
    assert.equal(texture.isVideoTexture, false, 'ownership taken at grant');
    assert.ok(texture.userData && texture.userData.jsrVideoElement === video,
      'the element moved to userData exactly like the adapter degrade does');
    assert.equal(primedImage.width, 32);
    assert.equal(primedImage.height, 18);
    assert.equal(primedImage.data.length, 32 * 18 * 4);
    assert.equal(texture.version, 0, 'the primed image is not GPU-submitted on its own');
    assert.equal(loadedMetadata, 1, 'metadata dispatched once, at prime');
    assert.equal(video.videoWidth, 32);
    assert.equal(video.videoHeight, 18);

    // Frame 0 lands at exactly the camera dims: the primed image is reused
    // in place — no image swap, no dimension-changing upsert in the stream.
    harness.pushFrame(32, 18, 7);
    await new Promise(resolve => setImmediate(resolve));
    harness.pump();
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(texture.image, primedImage, 'frame 0 writes into the primed image (same-size upsert)');
    assert.equal(texture.image.data[0], (0 * 7 + 7) & 255, 'frame 0 pixels landed');
    assert.equal(texture.version, 1, 'frame 0 is the first GPU submission for this texture');
    assert.equal(loadedMetadata, 1, 'no duplicate metadata dispatch at frame time');

    // Every subsequent camera frame stays same-size: same image object.
    harness.pushFrame(32, 18, 99);
    await new Promise(resolve => setImmediate(resolve));
    harness.pump();
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(texture.image, primedImage, 'no dimension-changing upsert afterwards');
    assert.ok(texture.version > 1, 'same-size re-upload still bumps the R1 version');
  } finally {
    harness.teardown();
  }
}

// ── late texture after the grant: primed immediately, degrade never fires ───
{
  const harness = makeHarness({ startWidth: 32, startHeight: 18 });
  try {
    const first = new (harness.wrap(FakeVideoTexture))(fakeVideoElement());
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(first.isVideoTexture, false, 'grant primed the first texture');

    // A texture constructed while the camera lane already runs is primed in
    // its constructor — the adapter degrade (16x16 checker) never sees it.
    const late = new (harness.wrap(FakeVideoTexture))(fakeVideoElement());
    assert.equal(late.isVideoTexture, false, 'late texture takes ownership immediately');
    assert.equal(late.image.width, 32);
    assert.equal(late.image.height, 18);
    assert.equal(late.version, 0, 'late prime is not GPU-submitted on its own');

    // A late frame reaches BOTH textures same-size.
    harness.pushFrame(32, 18, 3);
    await new Promise(resolve => setImmediate(resolve));
    harness.pump();
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(first.image.data[0], (0 * 7 + 3) & 255);
    assert.equal(late.image.data[0], (0 * 7 + 3) & 255, 'late texture received frame 0');
  } finally {
    harness.teardown();
  }
}

// ── probe denied: bounded fallback with a single warn, no interval ──────────
{
  const harness = makeHarness({ hostAvailable: false });
  try {
    new (harness.wrap(FakeVideoTexture))(fakeVideoElement());
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(harness.intervalActive, false, 'no pull loop without a camera');
    assert.equal(harness.warnings.length, 1, 'one bounded warn');
    assert.ok(harness.warnings[0].includes('webcam host unavailable'), 'warn names the degrade');
    assert.ok(harness.warnings[0].includes('camera permission denied'), 'warn carries the host reason');
    const checker = globalThis.__jsrWebcamHostCheckerImage();
    assert.equal(checker.width, 16);
    assert.equal(checker.height, 16);
    assert.equal(checker.encoding, 0);
    assert.equal(checker.encoded, false);
    assert.ok(checker.data instanceof Uint8Array, 'checker image contract matches the adapter fallback shape');
  } finally {
    harness.teardown();
  }
}

// ── no host handler: silent fallback (widget run outside the example app) ───
{
  const harness = makeHarness({ rejectHostCall: true });
  try {
    new (harness.wrap(FakeVideoTexture))(fakeVideoElement());
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(harness.intervalActive, false, 'no pull loop when camera.start rejects');
    assert.equal(harness.warnings.length, 0, 'unsupported host stays silent');
  } finally {
    harness.teardown();
  }
}

// ── malformed frames: dropped with one bounded warn, last frame retained ────
{
  const harness = makeHarness();
  try {
    const texture = new (harness.wrap(FakeVideoTexture))(fakeVideoElement());
    await new Promise(resolve => setImmediate(resolve));
    harness.pushFrame(3, 2, 5);
    await new Promise(resolve => setImmediate(resolve));
    harness.pump();
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));
    const goodData = Uint8Array.from(texture.image.data);

    // Dimension/payload mismatch: frame rejected, no texture clobber.
    harness.pushFrame(3, 2, 9, { width: 4, height: 4 });
    await new Promise(resolve => setImmediate(resolve));
    harness.pump();
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(texture.image.data, goodData, 'mismatched frame leaves the texture alone');
    assert.equal(harness.warnings.length, 1, 'one bounded warn for malformed frames');
    assert.ok(harness.warnings[0].includes('declared RGBA8 dimensions'));

    // Extreme dimensions are rejected by the bounded lane; the warn stays
    // bounded (one per category) while the frame is still dropped.
    harness.pushFrame(3, 2, 9, { width: 8192, height: 8192 });
    await new Promise(resolve => setImmediate(resolve));
    harness.pump();
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(harness.warnings.length, 1, 'warn stays bounded across rejects');
    assert.deepEqual(texture.image.data, goodData, 'out-of-range dims leave the texture alone');

    // Tracked-texture registry stays bounded.
    assert.ok(globalThis.__jsrWebcamHostTextures.length <= 8);
    assert.equal(texture.disposed === true, false);
  } finally {
    harness.teardown();
  }
}

// ── degrade race repair: a checker clobber after a camera frame is undone ───
{
  const harness = makeHarness();
  try {
    const texture = new (harness.wrap(FakeVideoTexture))(fakeVideoElement());
    await new Promise(resolve => setImmediate(resolve));
    harness.pushFrame(3, 2, 5);
    await new Promise(resolve => setImmediate(resolve));
    harness.pump();
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(texture.image.width, 3, 'camera image applied');

    // Simulate the adapter's first-render VideoTexture degrade landing AFTER
    // the first camera frame: checker image swap + fallback counter.
    const versionAfterFrame = texture.version;
    const checker = globalThis.__jsrWebcamHostCheckerImage();
    texture.image = checker;

    // Next pull reports nothing new, but the repair pass restores the frame.
    await new Promise(resolve => setImmediate(resolve));
    harness.pump();
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));
    assert.notEqual(texture.image, checker, 'clobbered checker image replaced');
    assert.equal(texture.image.width, 3);
    assert.equal(texture.image.height, 2);
    assert.equal(texture.image.data[0], (0 * 7 + 5) & 255, 'restored pixels come from the retained frame');
    assert.ok(texture.version > versionAfterFrame, 'repair bumps the upload version');
    assert.ok(
      harness.warnings.some(message => message.includes('restored the camera image')),
      'repair carries its own bounded warn'
    );

    // Quiet pulls keep the repaired image untouched (identity, no rewrites).
    await new Promise(resolve => setImmediate(resolve));
    harness.pump();
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(harness.warnings.filter(message => message.includes('restored')).length, 1, 'repair warn stays bounded');
  } finally {
    harness.teardown();
  }
}

// ── native face signals: camera.track handshake + approximate apply path ────
{
  const harness = makeHarness({ startWidth: 8, startHeight: 6 });
  try {
    const faceMesh = {
      name: 'mesh_2',
      morphTargetDictionary: { jawOpen: 0, mouthSmile_L: 1, mouthFrown_L: 2 },
      morphTargetInfluences: [0, 0, 0]
    };
    const eyeLeftMesh = { name: 'eyeLeft', rotation: {} };
    const eyeRightMesh = { name: 'eyeRight', rotation: {} };
    const capture = globalThis.__jsrWebcamHostMorphMesh;
    assert.equal(typeof capture, 'function', 'morph-mesh registry seam installed for flutterGpu');
    capture(faceMesh);
    capture(eyeLeftMesh);
    capture(eyeRightMesh);
    capture(faceMesh); // duplicate registration is a no-op
    assert.equal(globalThis.__jsrWebcamHostFaceState().meshCount, 3, 'registry stays bounded and deduped');

    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(
      harness.hostCalls.find(call => call.name === 'camera.track'),
      { name: 'camera.track', args: { enable: true } },
      'the first mesh registration asks the host for camera.track'
    );

    const video = fakeVideoElement();
    const texture = new (harness.wrap(FakeVideoTexture))(video);
    const drain = async check => {
      for (let i = 0; i < 500; i++) {
        await new Promise(resolve => setTimeout(resolve, 0));
        if (check()) return true;
      }
      return false;
    };
    const faceState = () => globalThis.__jsrWebcamHostFaceState();

    // Pull-lane application: shapes ride the camera.frame response, values
    // clamp to 0..1, non-finite scores are skipped, and the first apply
    // lerp-approaches from neutral (0.3 toward the target).
    harness.pushFrame(8, 6, 3, {
      shapes: { jawOpen: 0.8, mouthSmile_L: 1.5, mouthFrown_L: Number.NaN },
      lookX: 0.5,
      lookY: -0.25
    });
    await new Promise(resolve => setImmediate(resolve));
    harness.pump();
    assert.ok(await drain(() => faceState().appliedShapes !== null), 'signals applied after the decode settles');
    assert.ok(await drain(() => Math.abs(faceMesh.morphTargetInfluences[0] - 0.24) < 1e-9),
      'jawOpen = 0 + (0.8 − 0) · 0.3 after the first apply');
    assert.equal(faceMesh.morphTargetInfluences[1], 0.3, 'mouthSmile_L clamps to 1 before smoothing');
    assert.equal(faceMesh.morphTargetInfluences[2], 0, 'non-finite scores are skipped');
    const limit = Math.PI / 6;
    assert.ok(Math.abs(eyeLeftMesh.rotation.z - 0.15 * limit) < 1e-9, 'eyeL.rotation.z = smoothed lookX · 30°');
    assert.ok(Math.abs(eyeLeftMesh.rotation.x - (-0.075) * limit) < 1e-9, 'eyeL.rotation.x = smoothed lookY · 30°');
    assert.ok(Math.abs(eyeRightMesh.rotation.z - 0.15 * limit) < 1e-9, 'eyeR mirrors the same look sums');

    // Second apply continues the approach exactly (0.7 persistence).
    harness.pushFrame(8, 6, 9, {
      shapes: { jawOpen: 0.8, mouthSmile_L: 1, lookX: 0.5 }
    });
    await new Promise(resolve => setImmediate(resolve));
    harness.pump();
    assert.ok(await drain(() => Math.abs(faceMesh.morphTargetInfluences[0] - 0.408) < 1e-9),
      'second apply: 0.24 + (0.8 − 0.24) · 0.3');

    // Smoothing converges monotonically without overshoot (seam-driven).
    for (let i = 0; i < 12; i++) globalThis.__jsrWebcamHostApplySignals({ jawOpen: 0.8 }, 0, 0);
    const converged = faceMesh.morphTargetInfluences[0];
    assert.ok(converged > 0.78 && converged <= 0.8, `12 more applies land within 0.02 of the target (${converged})`);
    const eyeRest = Math.abs(eyeLeftMesh.rotation.z);
    assert.ok(eyeRest > 0 && eyeRest < 0.003, `look sums lerp back toward neutral (${eyeRest})`);
  } finally {
    harness.teardown();
  }
}

// ── face-signal bounds: quota, invalid values, late dictionary fill ─────────
{
  const harness = makeHarness({ startWidth: 8, startHeight: 6 });
  try {
    const dictionary = {};
    for (let i = 0; i < 30; i++) dictionary[`shape_${i}`] = i;
    const faceMesh = { name: 'mesh_2', morphTargetInfluences: new Array(30).fill(0) };
    globalThis.__jsrWebcamHostMorphMesh(faceMesh); // dictionary not yet filled (loader race)
    const shapes = {};
    for (let i = 0; i < 25; i++) shapes[`shape_${i}`] = 1;
    globalThis.__jsrWebcamHostApplySignals(shapes, 2, -3);
    assert.equal(faceMesh.morphTargetInfluences.filter(v => v === 0).length, 30,
      'no application before the loader fills the morph dictionary');
    assert.equal(globalThis.__jsrWebcamHostFaceState().faceMesh, null, 'face stays unresolved without a dictionary');

    faceMesh.morphTargetDictionary = dictionary; // loader catch-up
    globalThis.__jsrWebcamHostApplySignals(shapes, 2, -3);
    const state = globalThis.__jsrWebcamHostFaceState();
    assert.equal(state.faceMesh, faceMesh, 'face resolves once the dictionary exists');
    assert.equal(Object.keys(state.appliedShapes).length, 20, 'payload capped at the bounded 20-shape quota');
    assert.ok(harness.warnings.some(message => message.includes('20-shape quota')), 'quota overrun warns once');
    for (let i = 0; i < 20; i++) assert.equal(faceMesh.morphTargetInfluences[i], 0.51,
      `shape_${i} applied (two 0.3-lerp steps: 0.3 → 0.51; influences wrote only after the dictionary resolved)`);
    for (let i = 20; i < 30; i++) assert.equal(faceMesh.morphTargetInfluences[i], 0, `shape_${i} beyond quota untouched`);
    assert.equal(state.lookX, 0.51, 'look target clamps to -1..1 then lerps (two 0.3 steps)');
    assert.equal(state.lookY, -0.51, 'lookY mirrors the clamp-then-lerp');

    globalThis.__jsrWebcamHostApplySignals(null, 0, 0);
    globalThis.__jsrWebcamHostApplySignals('nope', undefined, undefined);
    assert.ok(true, 'null/non-object shapes are a no-op');
  } finally {
    harness.teardown();
  }
}

// ── tracking handshake failures stay bounded and quiet ──────────────────────
{
  const harness = makeHarness({ trackUnavailable: true, startWidth: 8, startHeight: 6 });
  try {
    new (harness.wrap(FakeVideoTexture))(fakeVideoElement());
    const faceMesh = { name: 'mesh_2', morphTargetDictionary: { jawOpen: 0 }, morphTargetInfluences: [0] };
    globalThis.__jsrWebcamHostMorphMesh(faceMesh);
    globalThis.__jsrWebcamHostMorphMesh({ name: 'eyeLeft', rotation: {} });
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));
    const trackCalls = harness.hostCalls.filter(call => call.name === 'camera.track');
    assert.equal(trackCalls.length, 1, 'one camera.track attempt');
    assert.ok(
      harness.warnings.some(message => message.includes('face tracking unavailable')),
      'refused tracking warns once'
    );
    globalThis.__jsrWebcamHostMorphMesh({ name: 'eyeRight', rotation: {} });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(
      harness.hostCalls.filter(call => call.name === 'camera.track').length, 1,
      'no retry after a refusal'
    );
    assert.equal(globalThis.__jsrWebcamHostFaceState().trackingSupported, false, 'tracking marked unsupported');

    // Shapes keep flowing but nothing crashes; the pose rests.
    harness.pushFrame(8, 6, 5, { shapes: { jawOpen: 1 }, lookX: 1 });
    await new Promise(resolve => setImmediate(resolve));
    harness.pump();
    for (let i = 0; i < 100; i++) await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(faceMesh.morphTargetInfluences[0], 0.3, 'signals still apply (static-face pose is a host policy, not a crash)');
  } finally {
    harness.teardown();
  }
}

// ── teardown: camera.stop stops tracking with a single disable call ─────────
{
  const harness = makeHarness({ startWidth: 8, startHeight: 6 });
  try {
    const texture = new (harness.wrap(FakeVideoTexture))(fakeVideoElement());
    globalThis.__jsrWebcamHostMorphMesh({
      name: 'mesh_2', morphTargetDictionary: { jawOpen: 0 }, morphTargetInfluences: [0]
    });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(
      harness.hostCalls.filter(call => call.name === 'camera.track').length, 1,
      'tracking requested'
    );
    harness.pushStopped();
    await new Promise(resolve => setImmediate(resolve));
    harness.pump();
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(harness.intervalActive, false, 'pull loop stopped');
    const disables = harness.hostCalls.filter(
      call => call.name === 'camera.track' && call.args && call.args.enable === false
    );
    assert.equal(disables.length, 1, 'exactly one camera.track disable on teardown');
    assert.equal(texture.disposed === true, false);
  } finally {
    harness.teardown();
  }
}

// ── web backend: the compat is a no-op, real getUserMedia path untouched ────
{
  const savedJsr = globalThis.jsr;
  globalThis.jsr = { three: { getCapabilities: () => ({ backend: 'webgl2' }) } };
  const savedWarn = console.warn;
  const warnings = [];
  console.warn = message => { warnings.push(String(message)); };
  try {
    installWebcamHostCompat();
    assert.equal(globalThis.__jsrWebcamHostVideoTexture, undefined, 'web keeps the browser VideoTexture');
    assert.equal(warnings.length, 0);
  } finally {
    console.warn = savedWarn;
    if (savedJsr === undefined) delete globalThis.jsr; else globalThis.jsr = savedJsr;
  }
}

// ── ranged base64 decoder: chunked decode equals monolithic decode ──────────
{
  const payload = new Uint8Array(300000);
  for (let i = 0; i < payload.length; i++) payload[i] = (i * 31 + 7) & 255;
  const text = b64(payload);
  const whole = new Uint8Array(payload.length);
  assert.equal(b64decodeInto(text, whole), payload.length, 'monolithic decode');
  const chunked = new Uint8Array(payload.length);
  let offset = 0;
  while (offset < text.length) {
    const end = Math.min(offset + 49152, text.length);
    const written = b64decodeInto(text, chunked, offset, end, offset / 4 * 3);
    assert.ok(written >= 0, `chunk decode lands at char ${offset}`);
    offset = end;
  }
  assert.deepEqual(chunked, whole, 'chunked decode matches the monolithic bytes');
  assert.equal(
    b64decodeInto(text, new Uint8Array(8), 0, 16, payload.length - 4), -1,
    'ranged decode respects the target tail bound'
  );
  assert.equal(b64decodeInto(text, new Uint8Array(16), 2, 17), -1, 'range not a multiple of 4 rejected');
  assert.equal(b64decodeInto(text, new Uint8Array(8), 0, 8, 0), 6, 'small in-bound range decodes its span');
}

// ── chunked decode + the official loadedmetadata 16:9 contract ──────────────
{
  const harness = makeHarness({ startWidth: 320, startHeight: 180 });
  try {
    const video = fakeVideoElement();
    const texture = new (harness.wrap(FakeVideoTexture))(video);
    // Mirror of the official example's loadedmetadata listener: aspect from
    // videoWidth/videoHeight, plane scaled from the MediaPipe fov/distance.
    let cameraAspect = 1.6;
    let planeScale = [1, 1, 1];
    let metadataCount = 0;
    const MP_FOV = 63;
    const VIDEO_DISTANCE = 100;
    video.addEventListener('loadedmetadata', () => {
      metadataCount++;
      const aspect = video.videoWidth / video.videoHeight;
      cameraAspect = aspect;
      const planeHeight = 2 * VIDEO_DISTANCE * Math.tan(MP_FOV / 2 * Math.PI / 180);
      planeScale = [planeHeight * aspect, planeHeight, 1];
    });
    await new Promise(resolve => setImmediate(resolve));
    // Grant-time prime: dims + dispatch happen BEFORE the first frame.
    assert.equal(video.videoWidth, 320, 'prime mirrors the granted width');
    assert.equal(video.videoHeight, 180, 'prime mirrors the granted height');
    assert.equal(metadataCount, 1, 'grant dispatches loadedmetadata once');
    assert.ok(Math.abs(cameraAspect - 320 / 180) < 1e-9, 'the official listener sees the 16:9 aspect');
    const expectedPlaneHeight = 2 * VIDEO_DISTANCE * Math.tan(MP_FOV / 2 * Math.PI / 180);
    assert.ok(
      Math.abs(planeScale[1] - expectedPlaneHeight) < 1e-9 &&
      Math.abs(planeScale[0] - expectedPlaneHeight * (320 / 180)) < 1e-9,
      'the official listener scales the backdrop plane to 16:9 (≈218.9 × 122.6 at fov 63 / dist 100)'
    );
    assert.equal(texture.isVideoTexture, false, 'grant takes ownership before frame 0');
    assert.equal(texture.image.width, 320, 'primed image carries camera dims');
    assert.equal(texture.image.height, 180);

    // A full 320x180 frame decodes across macrotask yields and lands as ONE
    // same-size write (version bumps exactly once, no image swap).
    const drainDecode = async check => {
      for (let i = 0; i < 500; i++) {
        await new Promise(resolve => setTimeout(resolve, 0));
        if (check()) return true;
      }
      return false;
    };
    const versionBefore = texture.version;
    harness.pushFrame(320, 180, 11);
    await new Promise(resolve => setImmediate(resolve));
    harness.pump();
    assert.ok(
      await drainDecode(() => texture.version > versionBefore),
      'chunked 320x180 decode settles across setTimeout yields'
    );
    assert.equal(texture.version, versionBefore + 1, 'one atomic texture write per frame');
    assert.equal(texture.image.width, 320);
    assert.equal(texture.image.height, 180);
    assert.equal(texture.image.data.length, 320 * 180 * 4);
    assert.equal(texture.image.data[0], (0 * 7 + 11) & 255, 'chunk boundary pixels decoded');
    assert.equal(texture.image.data[320 * 180 * 4 - 1], ((320 * 180 * 4 - 1) * 7 + 11) & 255, 'final pixel decoded');
    assert.equal(metadataCount, 1, 'metadata stays a grant-time event (not per frame)');

    // In-flight gate: a second pump during decode does not queue a pull
    // (the first pump's hostCall lands on the next microtask turn; the
    // second pump sees `pulling` still held and coalesces).
    const pullsBefore = harness.hostCalls.filter(call => call.name === 'camera.frame').length;
    harness.pushFrame(320, 180, 200);
    harness.pump();
    harness.pump();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(
      harness.hostCalls.filter(call => call.name === 'camera.frame').length, pullsBefore + 1,
      'a decode in flight coalesces the interval pulls'
    );
    assert.ok(await drainDecode(() => texture.version > versionBefore + 1), 'second frame lands after the gate');
    assert.equal(texture.version, versionBefore + 2);
  } finally {
    harness.teardown();
  }
}

// ── prepared bundles carry the webcam host wiring ───────────────────────────
for (const id of ['three-materials-video-webcam', 'three-morphtargets-webcam']) {
  const widget = await readFile(path.join(ROOT, `example/widgets/${id}/widget.js`), 'utf8');
  assert.ok(widget.includes('__jsrWebcamHostVideoTexture'), `${id}: facade wrap present`);
  assert.ok(widget.includes('camera.start'), `${id}: camera.start probe present`);
  assert.ok(widget.includes('webcam host unavailable'), `${id}: bounded fallback warn present`);
  const manifest = JSON.parse(
    (await readFile(path.join(ROOT, `example/widgets/${id}/prepare_manifest.json`))).toString('utf8')
  );
  assert.ok(
    manifest.facade && manifest.facade.exports.includes('VideoTexture'),
    `${id}: VideoTexture is a facade export (the webcam wrap rides that binding)`
  );
  const morphMeshRefs = widget.split('__jsrWebcamHostMorphMesh').length - 1;
  if (id === 'three-morphtargets-webcam') {
    assert.equal(morphMeshRefs, 2, `${id}: registry def + Mesh facade wrap present`);
    assert.ok(widget.includes('camera.track'), `${id}: tracking handshake embedded`);
    assert.ok(
      manifest.facade.exports.includes('Mesh'),
      `${id}: Mesh is a facade export (the morph-mesh capture rides that binding)`
    );
  } else {
    assert.equal(morphMeshRefs, 1, `${id}: registry def only — no Mesh wrap, payloads unchanged`);
  }
}

// ── morphtargets-webcam: the GUI rides the folder-grouping wrapper ──────────
{
  const widget = await readFile(
    path.join(ROOT, 'example/widgets/three-morphtargets-webcam/widget.js'), 'utf8'
  );
  const manifest = JSON.parse(
    (await readFile(path.join(ROOT, 'example/widgets/three-morphtargets-webcam/prepare_manifest.json'))).toString('utf8')
  );
  assert.ok(
    Object.keys(manifest.inputs).some(key => String(key).endsWith('webcam_gui_folders.mjs')),
    'prepare pins the folder-grouping wrapper as a widget input'
  );
  for (const title of ['Brow', 'Cheek', 'Eyes', 'Jaw', 'Mouth', 'Nose', 'Other']) {
    assert.ok(widget.includes(`"${title}"`), `folder title ${title} compiled into the widget`);
  }
  const flat = await readFile(
    path.join(ROOT, 'example/widgets/three-materials-video-webcam/widget.js'), 'utf8'
  );
  assert.ok(!flat.includes('"Cheek"'), 'materials-video-webcam keeps the shared lil-gui facade (no grouping)');
}

console.log(JSON.stringify({ ok: true, suite: 'webcam_host_test' }));
