// Native webcam backdrop lane for the two official webcam examples
// (webgl_materials_video_webcam, webgl_morphtargets_webcam).
//
// The host (example app) owns the camera through AVFoundation and serves the
// newest RGBA frame through the generic `jsr.hostCall` lane
// (`camera.start` / `camera.frame` / `camera.stop`). `camera.start` resolves
// with the selected format's dimensions, so at grant time every tracked
// VideoTexture is resized in place to exactly those dimensions (and takes
// ownership, skipping the example adapter's 16x16 checker degrade). Every
// camera frame is therefore a same-size texture upsert: the dimension-
// changing placeholder→frame upsert never reaches the GPU. A frame with
// unexpected dimensions still resizes through the bounded per-frame path.
//
// No camera or no host handler => the bounded 16x16 checker fallback keeps
// rendering exactly as before, with the same warn.
//
// Native face tracking (opt-in): the morph-targets widget additionally
// registers its meshes (`__jsrWebcamHostMorphMesh`, riding a Mesh facade
// wrap), which asks the host for `camera.track`. While the host tracks,
// camera.frame responses carry `{shapes: {name: 0..1}, lookX, lookY}` —
// APPROXIMATE Apple Vision landmark signals computed Dart-side. The apply
// path mirrors the official morphtargets_webcam module: shape names index
// the loaded Face Cap morphTargetDictionary (the official blendshapesMap
// target names), and the look sums drive the eye rotations at the official
// 30° limit. This is rough mimicry — NOT MediaPipe-grade tracking.
//
// `jsr.hostCallBinary` is a JS->Dart lane only, so frames cannot be pushed
// into JS through it; the pull here is the cheapest existing Dart->JS bulk
// path (the same hostCall resolve already carries multi-MB GLB assets).
//
// Web (webgl2 backend) is a no-op: the real getUserMedia + VideoTexture
// transport stays untouched.

const PULL_INTERVAL_MS = 40;
const MAX_TRACKED_TEXTURES = 8;
const MAX_FRAME_BYTES = 16 * 1024 * 1024;
const MAX_TEXTURE_EDGE = 4096;
const MAX_CONSECUTIVE_FAILURES = 30;
const CAMERA_FPS = 24;

// Face-signal lane bounds. The Dart mapper emits ~16 shape names; the quota
// is a defensive cap so a future host cannot bloat the apply pass.
const FACE_SHAPE_QUOTA = 20;
const FACE_LERP = 0.3;
const EYE_ROTATION_LIMIT = Math.PI / 6; // official MathUtils.degToRad(30)
const MAX_TRACKED_MORPH_MESHES = 8;
// The pull adapter runs on the same QuickJS thread as the render loop, so a
// full-frame base64 decode (~14ms at 320x180) parked inside one microtask
// stalls every pending RAF tick and drops the presented cadence. Decode in
// bounded slices separated by macrotask yields (setTimeout 0) instead: the
// render loop runs between slices, and the texture write stays one atomic
// same-size upsert at the end. 49152 b64 chars ≈ 36 KiB decoded ≈ 1-3ms.
const DECODE_CHUNK_CHARS = 49152;

// Bounded base64 decoder (alphabet table built once). Returns decoded bytes
// written into `target`, or -1 when the payload is malformed/too large.
const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const b64Table = new Int16Array(128).fill(-1);
for (let i = 0; i < B64_ALPHABET.length; i++) b64Table[B64_ALPHABET.charCodeAt(i)] = i;

export function b64decodeInto(text, target, from = 0, to = -1, outStart = 0) {
  const clean = String(text);
  const length = to < 0 ? clean.length : Math.min(to, clean.length);
  const start = Math.max(0, Math.min(from, length));
  const span = length - start;
  if (span === 0) return 0;
  if (span % 4 !== 0) return -1;
  let padding = 0;
  if (clean.charCodeAt(length - 1) === 61) padding++;
  if (span > 1 && clean.charCodeAt(length - 2) === 61) padding++;
  if (padding > 0 && clean.charCodeAt(length - 1 - padding) === 61) return -1;
  const groups = (span / 4) | 0;
  const bytes = groups * 3 - padding;
  if (bytes < 0 || outStart < 0 || outStart + bytes > target.length) return -1;
  const outEnd = outStart + bytes;
  let out = outStart;
  for (let g = 0; g < groups; g++) {
    const base = start + g * 4;
    const isLast = g === groups - 1;
    let n = 0;
    for (let k = 0; k < 4; k++) {
      if (isLast && k >= 4 - padding) {
        if (clean.charCodeAt(base + k) !== 61) return -1;
        continue; // '=' padding contributes zero bits.
      }
      const code = clean.charCodeAt(base + k);
      const value = code < 128 ? b64Table[code] : -1;
      if (value < 0) return -1;
      n |= value << (18 - k * 6);
    }
    target[out++] = (n >> 16) & 255;
    if (out < outEnd) target[out++] = (n >> 8) & 255;
    if (out < outEnd) target[out++] = n & 255;
  }
  return bytes;
}

function checkerImage() {
  const data = new Uint8Array(16 * 16 * 4);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const offset = (y * 16 + x) * 4;
      const alternate = ((x >> 2) + (y >> 2)) % 2 === 0;
      data[offset] = alternate ? 224 : 32;
      data[offset + 1] = alternate ? 160 : 64;
      data[offset + 2] = alternate ? 64 : 128;
      data[offset + 3] = 255;
    }
  }
  return { data, width: 16, height: 16, encoding: 0, encoded: false };
}

export function installWebcamHostCompat() {
  const jsr = globalThis.jsr;
  const host = jsr && jsr.three;
  if (!host || typeof host.getCapabilities !== 'function') return;
  if (host.getCapabilities().backend === 'webgl2') return;

  const entries = [];
  let started = false;
  let active = false;
  let intervalId = null;
  let pulling = false;
  let lastSeq = -1;
  let failures = 0;
  const warnedKeys = new Set();
  let lastFrameBytes = null;
  let lastFrameWidth = 0;
  let lastFrameHeight = 0;
  let primedWidth = 0;
  let primedHeight = 0;

  // Face-signal state (native lane only; see the header note). The meshes
  // arrive through the Mesh facade wrap before GLTFLoader fills their
  // morphTargetDictionary, so the face/eye resolution is retried per apply
  // until the loader catches up.
  const morphMeshes = [];
  let faceMesh = null;
  let eyeLeftMesh = null;
  let eyeRightMesh = null;
  let trackRequested = false;
  let trackingSupported = true;
  let appliedShapes = null;
  let appliedLookX = 0;
  let appliedLookY = 0;

  function warnOnce(key, message) {
    if (warnedKeys.has(key)) return;
    warnedKeys.add(key);
    console.warn(message);
  }

  function stopPull(message) {
    if (intervalId !== null && typeof clearInterval === 'function') {
      clearInterval(intervalId);
    }
    intervalId = null;
    active = false;
    // camera.stop stops tracking too: the host clears its Vision lane, but
    // an explicit disable keeps an app-side teardown symmetric.
    if (trackRequested && trackingSupported && typeof jsr.hostCall === 'function') {
      trackRequested = false;
      Promise.resolve()
        .then(() => jsr.hostCall('camera.track', { enable: false }))
        .catch(() => {});
    }
    if (message) warnOnce('camera.frames', message);
  }

  // Validates one RGBA frame payload without decoding: dimensions inside the
  // bounded lane, base64 length/padding consistent with width*height*4.
  function validateFrame(frame) {
    const width = frame.width | 0;
    const height = frame.height | 0;
    if (width <= 0 || height <= 0 || width > MAX_TEXTURE_EDGE || height > MAX_TEXTURE_EDGE) {
      warnOnce('camera.frames', 'three: webcam host frame dimensions are outside the bounded 0..4096 lane; keeping the checker fallback.');
      return null;
    }
    const expected = width * height * 4;
    if (expected > MAX_FRAME_BYTES) {
      warnOnce('camera.frames', 'three: webcam host frame exceeds the bounded 16 MiB lane; keeping the checker fallback.');
      return null;
    }
    const payload = String(frame.data || '');
    const total = payload.length;
    let padding = 0;
    if (total >= 1 && payload.charCodeAt(total - 1) === 61) padding++;
    if (total >= 2 && payload.charCodeAt(total - 2) === 61) padding++;
    if (total === 0 || total % 4 !== 0 || total / 4 * 3 - padding !== expected) {
      warnOnce('camera.frames', 'three: webcam host frame payload does not match its declared RGBA8 dimensions; frame dropped.');
      return null;
    }
    return { width, height, expected, payload, total };
  }

  // Writes one decoded RGBA frame into every tracked texture. Primed
  // textures already carry a camera-sized image, so this is an in-place
  // same-size write; a frame with unexpected dimensions still resizes here.
  // Runs in ONE tick after the chunked decode completes (atomic upsert).
  function writeFrameIntoTextures(width, height, expected) {
    lastFrameWidth = width;
    lastFrameHeight = height;
    for (const entry of entries) {
      const texture = entry.texture;
      if (!texture || texture.disposed === true) continue;
      let image = texture.image;
      if (!image || image.width !== width || image.height !== height ||
          !(image.data instanceof Uint8Array) || image.data.length !== expected) {
        image = { data: new Uint8Array(expected), width, height, encoding: 0, encoded: false };
        texture.image = image;
      }
      image.data.set(lastFrameBytes);
      texture.needsUpdate = true;
      entry.appliedImage = image;
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
          // The official metadata listener adjusts camera/plane aspect; a
          // shim element that refuses the update keeps the square fallback.
        }
      }
    }
  }

  // Chunked decode: slices the base64 payload into bounded pieces separated
  // by macrotask yields so the render loop's RAF callbacks run between them
  // (a monolithic 14ms decode parked on the pull microtask stalled every
  // pending frame tick). One in-flight decode at a time — `pulling` stays
  // true until this settles, so the interval never queues a second one.
  async function decodeFrameAsync(frame) {
    const valid = validateFrame(frame);
    if (!valid) return;
    const { width, height, expected, payload, total } = valid;
    if (!lastFrameBytes || lastFrameBytes.length !== expected) {
      lastFrameBytes = new Uint8Array(expected);
    }
    for (let offset = 0; offset < total; offset += DECODE_CHUNK_CHARS) {
      if (!active) return;
      const end = Math.min(offset + DECODE_CHUNK_CHARS, total);
      const written = b64decodeInto(payload, lastFrameBytes, offset, end, offset / 4 * 3);
      if (written < 0) {
        warnOnce('camera.frames', 'three: webcam host frame payload does not match its declared RGBA8 dimensions; frame dropped.');
        return;
      }
      if (end < total) await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (!active) return;
    writeFrameIntoTextures(width, height, expected);
    // Face signals ride valid frames only: a malformed/oversized payload
    // leaves the applied face pose untouched, exactly like the texture.
    applyFaceSignals(frame.shapes, frame.lookX, frame.lookY);
    failures = 0;
  }

  // Safety net: since the grant primes ownership, the example adapter's
  // first-render degrade no longer fires for tracked textures — but any
  // OTHER external image swap (or a degrade on a not-yet-tracked texture)
  // is undone here: re-apply the retained frame whenever a tracked
  // texture's image is no longer the one we last wrote (identity check —
  // no pixel scans).
  function repairClobberedTextures() {
    if (!lastFrameBytes) return;
    let repaired = false;
    for (const entry of entries) {
      const texture = entry.texture;
      if (!texture || texture.disposed === true) continue;
      if (texture.image === entry.appliedImage) continue;
      const expected = lastFrameWidth * lastFrameHeight * 4;
      let image = texture.image;
      if (!image || image.width !== lastFrameWidth || image.height !== lastFrameHeight ||
          !(image.data instanceof Uint8Array) || image.data.length !== expected) {
        image = {
          data: new Uint8Array(expected), width: lastFrameWidth,
          height: lastFrameHeight, encoding: 0, encoded: false
        };
        texture.image = image;
      }
      image.data.set(lastFrameBytes);
      texture.needsUpdate = true;
      entry.appliedImage = image;
      repaired = true;
    }
    if (repaired) {
      // One bounded note: this is the construction/degrade ordering race,
      // not a recurring transport failure.
      warnOnce('camera.repair', 'three: webcam host restored the camera image after the first-frame VideoTexture degrade.');
    }
  }

  function pull() {
    if (!active || pulling || typeof jsr.hostCall !== 'function') return;
    pulling = true;
    Promise.resolve()
      .then(() => jsr.hostCall('camera.frame', { seq: lastSeq }))
      .then(frame => {
        if (!active) {
          pulling = false;
          return;
        }
        if (!frame) {
          pulling = false;
          failures = 0;
          return;
        }
        // Host tore the session down (widget teardown/no device): stop the
        // pull loop instead of spinning against a dead camera lane.
        if (frame.available === false) {
          pulling = false;
          stopPull();
          return;
        }
        // {changed:false,seq} short-circuit: nothing new since the last
        // pull — skip the decode/texture write, but still repair any
        // texture whose image the adapter degrade clobbered back to the
        // 16x16 checker (identity check only, no decode).
        if (frame.changed === false) {
          pulling = false;
          failures = 0;
          repairClobberedTextures();
          applyFaceSignals(frame.shapes, frame.lookX, frame.lookY);
          return;
        }
        if (typeof frame.seq === 'number') lastSeq = frame.seq;
        // The chunked decode holds `pulling` until it settles, so a slow
        // decode can never queue overlapping pulls (rendered-cadence
        // coalescing: the newest frame is simply fetched by the next pull).
        decodeFrameAsync(frame)
          .catch(error => {
            if (++failures > MAX_CONSECUTIVE_FAILURES) {
              stopPull('three: webcam host frame lane kept failing; stopping camera pulls at the checker fallback.');
            } else {
              warnOnce('camera.frames', `three: webcam host frame rejected (${error && error.message || error}); keeping the last frame.`);
            }
          })
          .then(() => {
            pulling = false;
          });
      })
      .catch(() => {
        pulling = false;
        if (++failures > MAX_CONSECUTIVE_FAILURES) {
          stopPull('three: webcam host frame lane kept failing; stopping camera pulls at the checker fallback.');
        }
      });
  }

  // Called when the host grants camera.start: the selected format's
  // dimensions are known BEFORE the first frame is pulled, so every tracked
  // texture is resized in place to exactly those dimensions now. The first
  // camera frame (and every one after it) is therefore a same-size upsert —
  // the dimension-changing placeholder→frame upsert never reaches the GPU.
  //
  // Taking ownership here (isVideoTexture = false + the element moved to
  // userData, exactly what the example adapter's degrade does) also stops
  // the first-render degrade from clobbering the primed image back to the
  // 16x16 checker: degradeVideoTexture() returns early on isVideoTexture.
  // The zeroed prime itself is never submitted (no needsUpdate); the first
  // GPU upload for this texture is camera frame 0 at camera dimensions.
  function primeCameraDimensions(width, height) {
    if (!(width > 0) || !(height > 0) ||
        width > MAX_TEXTURE_EDGE || height > MAX_TEXTURE_EDGE) return false;
    primedWidth = width;
    primedHeight = height;
    const expected = width * height * 4;
    for (const entry of entries) {
      const texture = entry.texture;
      if (!texture || texture.disposed === true) continue;
      if (texture.isVideoTexture === true) {
        texture.userData = texture.userData || {};
        texture.userData.jsrVideoElement = texture.image || entry.video || null;
        texture.isVideoTexture = false;
      }
      if (entry.primedWidth === width && entry.primedHeight === height) continue;
      texture.image = { data: new Uint8Array(expected), width, height, encoding: 0, encoded: false };
      entry.primedWidth = width;
      entry.primedHeight = height;
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
          // The official metadata listener adjusts camera/plane aspect; a
          // shim element that refuses the update keeps the square fallback.
        }
      }
    }
    return true;
  }

  function startDriver() {
    if (started || typeof jsr.hostCall !== 'function') return;
    started = true;
    Promise.resolve()
      .then(() => jsr.hostCall('camera.start', { fps: CAMERA_FPS }))
      .then(granted => {
        if (granted && granted.available === true) {
          active = true;
          intervalId = setInterval(pull, PULL_INTERVAL_MS);
          primeCameraDimensions(granted.width | 0, granted.height | 0);
        } else {
          // No host camera lane or permission denied: today's bounded
          // checker fallback keeps rendering; say so once, without noise.
          const reason = granted && granted.reason ? ` (${granted.reason})` : '';
          warnOnce('camera.start', `three: webcam host unavailable${reason}; rendering the Face Cap backdrop at its bounded 16x16 fallback.`);
        }
      })
      .catch(() => {
        // camera.start unsupported by this host (widget run outside the
        // example app) — silently keep the checker fallback.
      });
  }

  globalThis.__jsrWebcamHostVideoTexture = Base => class JsrWebcamHostVideoTexture extends Base {
    constructor(element) {
      super(element);
      if (entries.length >= MAX_TRACKED_TEXTURES ||
          entries.some(entry => entry.texture === this)) return;
      entries.push({ texture: this, video: element || null });
      startDriver();
      // A texture constructed after the camera grant is primed immediately
      // (same ownership + camera-sized image), so the first-render degrade
      // never swaps the 16x16 checker under an already-running camera lane.
      if (primedWidth > 0) primeCameraDimensions(primedWidth, primedHeight);
    }
  };

  // Morph-mesh registry seam: the morph-targets widget wraps the facade's
  // Mesh export so every loader-built mesh registers here (bounded). The
  // FIRST registration flips on `camera.track`; meshes without the Face Cap
  // morph dictionary (the backdrop plane) are harmless registrations. The
  // web lane never wraps Mesh, so materials-video keeps today's payloads.
  globalThis.__jsrWebcamHostMorphMesh = mesh => {
    if (!mesh || typeof mesh !== 'object' || mesh.disposed === true) return;
    if (morphMeshes.length >= MAX_TRACKED_MORPH_MESHES ||
        morphMeshes.includes(mesh)) return;
    morphMeshes.push(mesh);
    resolveFaceMeshes();
    requestTracking();
  };

  function resolveFaceMeshes() {
    if (!faceMesh || !eyeLeftMesh || !eyeRightMesh) {
      for (const mesh of morphMeshes) {
        if (!faceMesh && mesh.name === 'mesh_2' && mesh.morphTargetDictionary) {
          faceMesh = mesh;
        }
        if (!eyeLeftMesh && mesh.name === 'eyeLeft') eyeLeftMesh = mesh;
        if (!eyeRightMesh && mesh.name === 'eyeRight') eyeRightMesh = mesh;
      }
    }
  }

  function requestTracking() {
    if (trackRequested || !trackingSupported ||
        typeof jsr.hostCall !== 'function') return;
    trackRequested = true;
    Promise.resolve()
      .then(() => jsr.hostCall('camera.track', { enable: true }))
      .then(reply => {
        if (!reply || reply.available === false || reply.tracking !== true) {
          // Host granted the camera but refused tracking: say so once and
          // keep today's static-face behavior.
          trackingSupported = false;
          const reason = reply && reply.reason ? ` (${reply.reason})` : '';
          warnOnce('camera.track',
            `three: webcam host face tracking unavailable${reason}; the Face Cap model rests at its last pose.`);
        }
      })
      .catch(() => {
        // Host without camera.track (older example build): keep the static
        // face, never retry.
        trackingSupported = false;
        trackRequested = false;
      });
  }

  // Lerp-smooths the payload signals (0.3 toward the target per pull — the
  // official module applies MediaPipe's raw scores, but Vision landmarks
  // are noisier) and applies them exactly like the official animate()
  // loop: dictionary name → influence, then the look sums through the
  // official 30° eye-rotation limit.
  function applyFaceSignals(shapes, lookX, lookY) {
    if (!shapes || typeof shapes !== 'object') return;
    resolveFaceMeshes();
    if (appliedShapes === null) appliedShapes = Object.create(null);
    let accepted = 0;
    for (const name of Object.keys(shapes)) {
      const raw = shapes[name];
      if (typeof raw !== 'number' || !Number.isFinite(raw)) continue;
      if (accepted >= FACE_SHAPE_QUOTA) {
        warnOnce('camera.shapes',
          'three: webcam host face payload exceeded the bounded 20-shape quota; extra shapes are ignored.');
        break;
      }
      accepted++;
      const target = raw < 0 ? 0 : raw > 1 ? 1 : raw;
      const current = typeof appliedShapes[name] === 'number'
        ? appliedShapes[name] : 0;
      appliedShapes[name] = current + (target - current) * FACE_LERP;
    }
    if (typeof lookX === 'number' && Number.isFinite(lookX)) {
      const bounded = lookX < -1 ? -1 : lookX > 1 ? 1 : lookX;
      appliedLookX += (bounded - appliedLookX) * FACE_LERP;
    }
    if (typeof lookY === 'number' && Number.isFinite(lookY)) {
      const bounded = lookY < -1 ? -1 : lookY > 1 ? 1 : lookY;
      appliedLookY += (bounded - appliedLookY) * FACE_LERP;
    }
    if (faceMesh && faceMesh.morphTargetDictionary &&
        faceMesh.morphTargetInfluences) {
      const dictionary = faceMesh.morphTargetDictionary;
      const influences = faceMesh.morphTargetInfluences;
      for (const name of Object.keys(appliedShapes)) {
        const index = dictionary[name];
        if (typeof index === 'number' &&
            index >= 0 && index < influences.length) {
          influences[index] = appliedShapes[name];
        }
      }
    }
    if (eyeLeftMesh) {
      eyeLeftMesh.rotation.z = appliedLookX * EYE_ROTATION_LIMIT;
      eyeLeftMesh.rotation.x = appliedLookY * EYE_ROTATION_LIMIT;
    }
    if (eyeRightMesh) {
      eyeRightMesh.rotation.z = appliedLookX * EYE_ROTATION_LIMIT;
      eyeRightMesh.rotation.x = appliedLookY * EYE_ROTATION_LIMIT;
    }
  }

  // Test seam: expose the frame writer so the node suite can drive
  // frame->texture math without a host camera. Resolves once the chunked
  // decode + texture write settled (drain with macrotask turns).
  globalThis.__jsrWebcamHostApplyFrame = frame => decodeFrameAsync({
    width: frame.width,
    height: frame.height,
    data: frame.data
  });
  globalThis.__jsrWebcamHostApplySignals = (shapes, lookX, lookY) =>
    applyFaceSignals(shapes, lookX, lookY);
  globalThis.__jsrWebcamHostFaceState = () => ({
    meshCount: morphMeshes.length,
    faceMesh,
    eyeLeftMesh,
    eyeRightMesh,
    trackRequested,
    trackingSupported,
    appliedShapes: appliedShapes === null ? null : { ...appliedShapes },
    lookX: appliedLookX,
    lookY: appliedLookY
  });
  globalThis.__jsrWebcamHostTextures = entries;
  globalThis.__jsrWebcamHostCheckerImage = checkerImage;
}

