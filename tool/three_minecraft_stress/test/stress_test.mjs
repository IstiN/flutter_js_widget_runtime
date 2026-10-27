import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const OUT = process.env.JSR_MINECRAFT_STRESS_OUT || '/tmp/jsr-minecraft-stress';
const REQUIRE_R1 = process.env.JSR_STRESS_REQUIRE_R1 === '1';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const [widget, native, prepareBytes, manifestBytes] = await Promise.all([
  readFile(path.join(OUT, 'widget.js'), 'utf8'),
  readFile(path.join(ROOT, 'assets/three/three.native.js'), 'utf8'),
  readFile(path.join(OUT, 'prepare_manifest.json')),
  readFile(path.join(OUT, 'manifest.json'))
]);
const prepare = JSON.parse(prepareBytes.toString('utf8'));
assert.equal(JSON.parse(manifestBytes.toString('utf8')).upstream.revision, '186');
assert.equal(sha(widget), prepare.outputs['widget.js'].sha256);
const drawDistance = prepare.transform.drawDistance;
const expectedChunkCount = (2 * drawDistance + 1) ** 2;
assert.equal(prepare.assets.count, 19);

const renders = [];
const states = [];
const packets = [];
const logs = [];
const rafs = new Map();
const timers = new Map();
const storageWrites = [];
let nextRaf = 1;
let nextTimer = 1;
let eventHandler = null;
let rawHostAvailable = false;
let rawHostLocked = false;
let rawHostDx = 0;
let rawHostDy = 0;
const testConsole = {
  log: (...args) => logs.push({ level: 'log', text: args.join(' ') }),
  warn: (...args) => logs.push({ level: 'warn', text: args.join(' ') }),
  error: (...args) => logs.push({ level: 'error', text: args.join(' ') })
};
const jsr = {
  instanceId: 'stress-test',
  render(tree) { renders.push(tree); },
  exportState(state) { states.push(JSON.parse(JSON.stringify(state))); },
  onEvent(handler) { eventHandler = handler; },
  requestAnimationFrame(callback) {
    const id = nextRaf++;
    rafs.set(id, callback);
    return id;
  },
  cancelAnimationFrame(id) { rafs.delete(id); },
  hostCallBinary(name, bytes) {
    assert.equal(name, 'three.r1');
    packets.push(Buffer.from(Uint8Array.from(bytes)));
  },
  async hostCall(name, args = {}) {
    if (!rawHostAvailable) throw new Error(`unexpected host call ${name}`);
    if (name === 'three.pointerLock') {
      rawHostLocked = args.locked === true;
      if (!rawHostLocked) rawHostDx = rawHostDy = 0;
      return rawHostLocked;
    }
    if (name === 'three.pointerDelta') {
      const delta = { locked: rawHostLocked, dx: rawHostDx, dy: rawHostDy };
      rawHostDx = rawHostDy = 0;
      return delta;
    }
    throw new Error(`unexpected host call ${name}`);
  },
  storage: {
    set(key, value) { storageWrites.push([key, value]); return Promise.resolve(); }
  }
};
const context = vm.createContext({
  jsr, console: testConsole, performance, sendMessage() {},
  // QuickJS does not provide host TextEncoder/TextDecoder globals.
  setTimeout(callback) {
    const id = nextTimer++;
    timers.set(id, callback);
    return id;
  },
  clearTimeout(id) { timers.delete(id); },
  setInterval(callback) {
    const id = nextTimer++;
    timers.set(id, callback);
    return id;
  },
  clearInterval(id) { timers.delete(id); }
});
vm.runInContext(native, context, { filename: 'three.native.js' });
vm.runInContext('globalThis.THREE = THREE;', context);

const renderErrors = [];
try {
  vm.runInContext(widget, context, { filename: 'widget.js' });
} catch (error) {
  renderErrors.push(error.message || String(error));
}
const debug = context.__jsrMinecraftStress;
const documentFacade = context.document;
const mainCanvas = jsr.three.getCanvas('main');
assert.ok(debug && mainCanvas);
assert.equal(context.THREE.REVISION, '186');
assert.equal(jsr.three._runtime.canvases.size, 1);
assert.equal(jsr.three._runtime.assets.size, 19, '17 block PNGs, one toolbar PNG, and the GLB are prepared');
assert.equal(states.at(-1).canvasCount, 1);
assert.equal(states.at(-1).mounted, true);
assert.equal(states.at(-1).mountCount, 1);
assert.equal(states.at(-1).drawDistance, drawDistance);
assert.equal(states.at(-1).renderer.stressWrapper, true);
assert.equal(mainCanvas.renderer.isJsrMinecraftStressRenderer, true);
assert.ok(mainCanvas.renderer instanceof context.THREE.WebGLRenderer);
const capacityCheck = vm.runInContext(`(() => {
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial(), 65536);
  mesh.count = 2;
  mesh.setMatrixAt(0, new THREE.Matrix4());
  mesh.setMatrixAt(1, new THREE.Matrix4());
  __jsrMinecraftStress.renderer._manageInstancedCapacity(mesh);
  const compactCount = mesh.instanceMatrix.count;
  const compactBytes = mesh.instanceMatrix.array.byteLength;
  mesh.setMatrixAt(compactCount, new THREE.Matrix4());
  const grownCount = mesh.instanceMatrix.count;
  const grownBytes = mesh.instanceMatrix.array.byteLength;
  const preserved = new THREE.Matrix4();
  mesh.getMatrixAt(1, preserved);
  mesh.dispose(); mesh.geometry.dispose(); mesh.material.dispose();
  return { compactCount, compactBytes, grownCount, grownBytes, preserved: preserved.elements.every(v => Number.isFinite(v)) };
})()`, context);
assert.equal(capacityCheck.compactCount, 64);
assert.equal(capacityCheck.compactBytes, 64 * 16 * 4);
assert.equal(capacityCheck.grownCount, 128);
assert.equal(capacityCheck.grownBytes, 128 * 16 * 4);
assert.equal(capacityCheck.preserved, true);
const broadphaseCheck = vm.runInContext(`(() => {
  const world = new THREE.Group();
  const near = new THREE.Group();
  near.size = { width: 32, height: 64 };
  near.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()));
  const far = new THREE.Group();
  far.size = { width: 32, height: 64 };
  far.position.x = 100;
  far.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()));
  world.add(near, far);
  world.updateMatrixWorld(true);
  const player = {
    camera: { position: new THREE.Vector3(0, 0, 2) },
    raycaster: new THREE.Raycaster(),
    updateRaycaster(value) {
      this.raycaster.set(new THREE.Vector3(0, 0, 2), new THREE.Vector3(0, 0, -1));
      this.raycaster.far = 3;
      const visited = value.children.length;
      const hits = this.raycaster.intersectObject(value, true).map(hit => ({ uuid: hit.object.uuid, distance: hit.distance }));
      return { visited, hits };
    }
  };
  const baseline = player.updateRaycaster(world);
  __jsrMinecraftStress.renderer._installRaycastBroadphase(player);
  const wrapped = player.updateRaycaster(world);
  return { baseline, wrapped, restored: world.children.length };
})()`, context);
assert.equal(broadphaseCheck.baseline.visited, 2);
assert.equal(broadphaseCheck.wrapped.visited, 1);
assert.deepEqual(broadphaseCheck.wrapped.hits, broadphaseCheck.baseline.hits);
assert.equal(broadphaseCheck.restored, 2);
const instanceRaycastCheck = vm.runInContext(`(() => {
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial(), 100);
  const matrix = new THREE.Matrix4();
  for (let index = 0; index < 100; index++) {
    matrix.makeTranslation(index % 10 - 5, 0, Math.floor(index / 10) - 5);
    mesh.setMatrixAt(index, matrix);
  }
  mesh.updateMatrixWorld(true);
  mesh.computeBoundingSphere();
  const raycaster = new THREE.Raycaster(new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, -1, 0), 0, 20);
  const simplify = hits => hits.map(hit => ({ instanceId: hit.instanceId, distance: hit.distance, point: hit.point.toArray() }));
  const upstreamRaycast = mesh.raycast;
  const baselineHits = [];
  mesh.raycast(raycaster, baselineHits);
  const baseline = simplify(baselineHits);
  __jsrMinecraftStress.renderer._manageInstancedCapacity(mesh);
  const optimizedHits = [];
  mesh.raycast(raycaster, optimizedHits);
  const optimized = simplify(optimizedHits);
  const miss = [];
  mesh.raycast(new THREE.Raycaster(new THREE.Vector3(50, 10, 50), new THREE.Vector3(0, -1, 0), 0, 20), miss);
  matrix.makeRotationY(Math.PI / 2);
  mesh.setMatrixAt(55, matrix);
  const rotatedBaselineHits = [], rotatedHits = [];
  upstreamRaycast.call(mesh, raycaster, rotatedBaselineHits);
  mesh.raycast(raycaster, rotatedHits);
  const rotatedBaseline = simplify(rotatedBaselineHits), rotated = simplify(rotatedHits);
  mesh.dispose(); mesh.geometry.dispose(); mesh.material.dispose();
  return { baseline, optimized, miss: miss.length, rotatedBaseline, rotated };
})()`, context);
assert.ok(instanceRaycastCheck.baseline.length > 0);
assert.deepEqual(instanceRaycastCheck.optimized, instanceRaycastCheck.baseline);
assert.deepEqual(instanceRaycastCheck.rotated, instanceRaycastCheck.rotatedBaseline);
assert.equal(instanceRaycastCheck.miss, 0);
assert.ok(debug.scene, `original main must reach StressWebGLRenderer.render: ${renderErrors.join('; ')}`);
assert.equal(mainCanvas.renderer.shadowMap.enabled, true, 'requested shadow setting is restored');
assert.ok(debug.scene.fog && debug.scene.fog.isFog, 'requested fog object is restored');
assert.equal(debug.world.drawDistance, drawDistance);
assert.equal(debug.world.children.length, expectedChunkCount, 'upstream draw distance determines the initial chunk square');
assert.equal(states.at(-1).degradations[0].requested.shadows.enabled, true);
assert.deepEqual(states.at(-1).degradations[0].rendered.fog, states.at(-1).degradations[0].requested.fog);
assert.equal(states.at(-1).degradations[0].rendered.shadows.enabled, true);
assert.equal(states.at(-1).degradations[0].restored.fog, true);
assert.equal(states.at(-1).degradations[0].restored.shadows, true);
assert.equal(states.at(-1).visualParity, false);

function countThreeNodes(value, count = 0) {
  if (!value || typeof value !== 'object') return count;
  if (value.type === 'three') count++;
  for (const key of Object.keys(value)) {
    if (key !== 'renderer' && key !== 'canvas') count = countThreeNodes(value[key], count);
  }
  return count;
}
assert.ok(renders.length >= 1);
assert.equal(countThreeNodes(renders[0]), 1);
assert.equal(renders[0].type, 'stack');
assert.equal(renders[0].children[0].canvasId, 'main');
function countType(value, type) {
  if (!value || typeof value !== 'object') return 0;
  let count = value.type === type ? 1 : 0;
  for (const key of Object.keys(value)) {
    if (key !== 'renderer' && key !== 'canvas') count += countType(value[key], type);
  }
  return count;
}
assert.equal(countType(renders[0], 'image'), 9, 'original toolbar icons are visible');
assert.ok(JSON.stringify(renders[0]).includes('MINECRAFTjs'), 'original instructions are visible');
assert.equal(states.at(-1).ui.nativeHudVisual, true);

// Resolve every prepared byte against the immutable reference inputs.
for (const [url, item] of Object.entries(prepare.assets.entries)) {
  const original = await readFile(path.join(ROOT, '../references/minecraft-threejs-clone/public', url));
  const resolved = jsr.three.resolveAsset(url);
  assert.ok(resolved, url);
  assert.deepEqual(Buffer.from(resolved.bytes), original);
  assert.equal(sha(original), item.sha256);
  if (item.mime === 'image/png') {
    assert.ok(resolved.width > 0 && resolved.height > 0, `${url} dimensions`);
  }
}
assert.ok(jsr.three.resolveAsset('textures/pickaxe.png'));

async function settle(rounds = 12) {
  for (let i = 0; i < rounds; i++) await new Promise(resolve => setImmediate(resolve));
}
await settle();

// The original GLTFLoader must load its bufferView PNG through finite Blob +
// object URLs and attach the pickaxe to the original scene graph.
let embeddedTexture = null;
debug.scene.traverse(object => {
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  for (const material of materials) {
    if (material && material.map && material.map.userData.mimeType === 'image/png' && material.map.image) {
      embeddedTexture = material.map;
    }
  }
});
assert.ok(embeddedTexture, 'pickaxe embedded PNG is loaded and attached to the scene');
assert.ok(embeddedTexture.image.width > 0 && embeddedTexture.image.height > 0);
assert.ok(states.at(-1).assets.embeddedBlobs.created >= 1);
assert.equal(states.at(-1).assets.embeddedBlobs.active, 0, 'GLTF object URL is revoked after load');
assert.equal(jsr.three._runtime.assets.size, 19);

// Exercise PNG/JPEG metadata and the bounded object-URL map independently.
const blobCheck = vm.runInContext(`(() => {
  const png = jsr.three.resolveAsset('textures/grass.png').bytes;
  const urls = [];
  for (let i = 0; i < 20; i++) urls.push(URL.createObjectURL(new Blob([png], {type:'image/png'})));
  const active = __jsrMinecraftStress ? null : 0;
  const dimensions = jsr.three.resolveAsset(urls[19]);
  const jpeg = new Uint8Array([255,216,255,192,0,17,8,0,32,0,16,3,1,17,0,2,17,1,3,17,1,255,217]);
  const jpegUrl = URL.createObjectURL(new Blob([jpeg], {type:'image/jpeg'}));
  const jpegDimensions = jsr.three.resolveAsset(jpegUrl);
  URL.revokeObjectURL(jpegUrl);
  return {count:urls.length, width:dimensions.width, height:dimensions.height,
    jpegWidth:jpegDimensions.width, jpegHeight:jpegDimensions.height,
    active:jsr.three._runtime.assets.size};
})()`, context);
assert.equal(blobCheck.count, 20);
assert.ok(blobCheck.width > 0 && blobCheck.height > 0);
assert.equal(blobCheck.jpegWidth, 16);
assert.equal(blobCheck.jpegHeight, 32);
assert.ok(states.at(-1).assets.embeddedBlobs.limit === 16);

// Drain every requestIdleCallback chunk generation; never run an open-ended loop.
let timerSteps = 0;
while (timers.size && timerSteps < expectedChunkCount + 8) {
  const pending = [...timers.values()];
  timers.clear();
  for (const callback of pending) callback();
  timerSteps++;
  await settle(2);
}
assert.ok(debug.world.children.every(chunk => chunk.loaded), 'every initial chunk completed through requestIdleCallback');
assert.ok(debug.world.children.every(chunk => chunk.children.some(object => object.isInstancedMesh)));

// OrbitControls receives the original pointer sequence; the adapter adds mouse
// compatibility events without consuming or duplicating the pointer sequence.
const orbit = debug.camera;
assert.ok(orbit && orbit.isPerspectiveCamera);
const orbitBefore = orbit.position.toArray();
jsr.three._dispatchEvent('main', { type: 'pointerdown', pointerId: 7, pointerType: 'mouse', button: 0, buttons: 1, pageX: 10, clientX: 10, pageY: 10, clientY: 10 });
jsr.three._dispatchEvent('main', { type: 'pointermove', pointerId: 7, pointerType: 'mouse', button: 0, buttons: 1, pageX: 32, clientX: 32, pageY: 19, clientY: 19 });
jsr.three._dispatchEvent('main', { type: 'pointerup', pointerId: 7, pointerType: 'mouse', button: 0, buttons: 0, pageX: 32, clientX: 32, pageY: 19, clientY: 19 });
assert.notDeepEqual(orbit.position.toArray(), orbitBefore, 'orbit drag changes the original orbit camera');
assert.equal(mainCanvas.hasPointerCapture(7), false);

const lockOptions = await documentFacade.body.requestPointerLock({ unadjustedMovement: true });
assert.equal(lockOptions, undefined);
assert.equal(documentFacade.pointerLockElement, documentFacade.body);
assert.equal(states.at(-1).input.lastLockOptions.unadjustedMovement, true);
assert.equal(states.at(-1).input.locked, true);
assert.equal(documentFacade.getElementById('overlay').style.visibility, 'hidden');
const playerCamera = debug.scene.children.find(object => object.isPerspectiveCamera);
assert.ok(playerCamera);
const playerQuaternion = playerCamera.quaternion.toArray();
jsr.three._dispatchEvent('main', { type: 'pointerdown', pointerId: 8, pointerType: 'mouse', button: 0, buttons: 1, pageX: 40, clientX: 40, pageY: 40, clientY: 40 });
jsr.three._dispatchEvent('main', { type: 'pointermove', pointerId: 8, pointerType: 'mouse', button: 0, buttons: 1, pageX: 55, clientX: 55, pageY: 48, clientY: 48 });
assert.notDeepEqual(playerCamera.quaternion.toArray(), playerQuaternion, 'virtual pointer-lock mouse deltas move the original player camera');
jsr.three._dispatchEvent('main', { type: 'pointerup', pointerId: 8, pointerType: 'mouse', button: 0, buttons: 0, pageX: 55, clientX: 55, pageY: 48, clientY: 48 });

let normalized = null;
documentFacade.addEventListener('keydown', event => { normalized = { code: event.code, key: event.key }; });
jsr.three._hostEvent('key', { key: 'W', code: '', down: true });
assert.deepEqual(normalized, { code: 'KeyW', key: 'w' });
jsr.three._hostEvent('key', { key: 'w', code: 'KeyW', down: false });
jsr.three._hostEvent('key', { key: '1', code: 'Digit1', down: true });
assert.equal(documentFacade.getElementById('toolbar-1').classList.contains('selected'), true);
assert.equal(documentFacade.getElementById('toolbar-0').classList.contains('selected'), false);
context.localStorage.setItem('probe', 'value');
assert.equal(context.localStorage.getItem('probe'), 'value');
assert.equal(storageWrites.length, 0, 'default storage is explicitly memory-only');
documentFacade.exitPointerLock();
assert.equal(documentFacade.pointerLockElement, null);
assert.equal(documentFacade.getElementById('overlay').style.visibility, 'visible');
assert.ok(eventHandler);
eventHandler('three-minecraft-stress.lock', {});
assert.equal(documentFacade.pointerLockElement, documentFacade.body);
jsr.three._hostEvent('key', { key: 'escape', code: 'Escape', down: false });
assert.ok(documentFacade.pointerLockElement === documentFacade.body, 'Escape keyup keeps the lock');
jsr.three._hostEvent('key', { key: 'escape', code: 'Escape', down: true });
const escapeDefaults = [...timers.values()];
timers.clear();
assert.ok(escapeDefaults.length > 0, 'Escape schedules its browser default action');
for (const callback of escapeDefaults) callback();
assert.ok(documentFacade.pointerLockElement === null, 'Escape keydown releases virtual pointer lock');
assert.equal(documentFacade.getElementById('overlay').style.visibility, 'visible');

rawHostAvailable = true;
await documentFacade.body.requestPointerLock({ unadjustedMovement: true });
assert.equal(rawHostLocked, true, 'native host receives the pointer lock request');
assert.equal(documentFacade.pointerLockElement, documentFacade.body);
const rawQuaternion = playerCamera.quaternion.toArray();
rawHostDx = 12;
rawHostDy = -4;
await debug.pollRawPointer();
assert.notDeepEqual(playerCamera.quaternion.toArray(), rawQuaternion,
  'raw OS deltas move the original PointerLockControls camera');
assert.equal(rawHostDx, 0);
assert.equal(rawHostDy, 0);
rawHostLocked = false;
await debug.pollRawPointer();
assert.equal(documentFacade.pointerLockElement, null,
  'native focus-loss unlock restores the original controls and overlay');
assert.equal(documentFacade.getElementById('overlay').style.visibility, 'visible');
rawHostAvailable = false;

// Execute at most three already-scheduled frames. Known R1 capability failures
// are surfaced verbatim; integration mode makes any such failure fatal.
for (let frame = 0; frame < 3 && rafs.size; frame++) {
  const callbacks = [...rafs.values()];
  rafs.clear();
  for (const callback of callbacks) {
    try { callback(performance.now()); }
    catch (error) { renderErrors.push(error.message || String(error)); }
  }
  await settle(2);
}
const opcodes = [];
let fogFrames = 0;
let shadowFrames = 0;
let shadowNodes = 0;
let culledMainNodes = 0;
for (const packet of packets) {
  assert.equal(packet.toString('ascii', 0, 4), 'JSR3');
  assert.equal(packet[4], 1);
  assert.equal(packet[5], 1);
  const headerBytes = packet.readUInt16LE(6);
  assert.equal(packet.toString('ascii', headerBytes, headerBytes + 4), 'JSR1');
  const commandCount = packet.readUInt32LE(headerBytes + 8);
  let offset = headerBytes + 12;
  for (let command = 0; command < commandCount; command++) {
    const opcode = packet[offset];
    const length = packet.readUInt32LE(offset + 4);
    opcodes.push(opcode);
    if (opcode === 4) {
      assert.equal(length, 92, 'NODE carries cast/receive shadow flags');
      if ((packet.readUInt32LE(offset + 96) & 3) === 3) shadowNodes++;
    }
    if (opcode === 8) {
      assert.ok(length >= 136 && (length - 136) % 4 === 0, 'FRAME carries fog/shadow data and optional main culling');
      const culledCount = length > 136 ? packet.readUInt32LE(offset + 144) : 0;
      assert.equal(length, culledCount ? 140 + culledCount * 4 : 136);
      culledMainNodes += culledCount;
      assert.equal(packet.readUInt32LE(offset + 36), 1, 'linear fog mode');
      assert.equal(packet.readFloatLE(offset + 52), 50, 'fog near');
      assert.equal(packet.readFloatLE(offset + 56), 75, 'fog far');
      assert.equal(packet.readUInt32LE(offset + 60), 2048, 'shadow width');
      assert.equal(packet.readUInt32LE(offset + 64), 2048, 'shadow height');
      assert.ok(Math.abs(packet.readFloatLE(offset + 68) + 0.0001) < 0.000001);
      assert.equal(packet.readFloatLE(offset + 76), 1, 'PCF radius');
      for (let index = 0; index < 16; index++) {
        assert.ok(Number.isFinite(packet.readFloatLE(offset + 80 + index * 4)));
      }
      fogFrames++;
      shadowFrames++;
    }
    offset += 8 + length;
  }
  assert.equal(offset, packet.length);
}
const knownBlocker = value => /three\.unsupported: (?:wireframe|objectType|multiMaterial)/.test(value);
const unexpected = renderErrors.filter(error => !knownBlocker(error));
assert.deepEqual(unexpected, [], `unexpected native execution errors: ${unexpected.join('; ')}`);
const blockers = [...new Set(renderErrors)];
if (blockers.length) {
  assert.ok(states.at(-1).renderer.lastError, 'adapter exports the exact render blocker');
  assert.ok(blockers.includes(states.at(-1).renderer.lastError));
} else {
  assert.ok(packets.length > 0, 'successful original frames emit native binary R1');
  assert.ok(opcodes.includes(11), 'loaded InstancedMesh world emits DRAW_BATCH opcode 11');
  assert.ok(fogFrames > 0, 'native frames retain the original linear fog');
  assert.ok(shadowFrames > 0, 'native frames retain the original 2048px shadow request');
  assert.ok(shadowNodes > 0, 'instanced blocks cast and receive shadows');
  assert.ok(states.at(-1).stats.frames > 0);
  assert.ok(states.at(-1).renderer.triangles > 0);
}
if (REQUIRE_R1) {
  assert.deepEqual(blockers, [], 'R1 required but core reported blockers');
  assert.ok(opcodes.includes(11), 'R1 required but DRAW_BATCH was not emitted');
}
assert.equal(logs.filter(item => item.text.includes('requested fog=')).length, 0);
assert.equal(logs.filter(item => item.text.includes('requested shadows=')).length, 0);
const instanceMemory = vm.runInContext(`(() => {
  let meshes = 0, reservedBytes = 0, usedBytes = 0;
  __jsrMinecraftStress.scene.traverse(object => {
    if (!object.isInstancedMesh) return;
    meshes++;
    reservedBytes += object.instanceMatrix.array.byteLength;
    usedBytes += object.count * 16 * 4;
  });
  return { meshes, reservedBytes, usedBytes };
})()`, context);
assert.ok(instanceMemory.meshes > 300);
assert.ok(instanceMemory.reservedBytes >= instanceMemory.usedBytes);
assert.ok(instanceMemory.reservedBytes < 128 * 1024 * 1024,
  `instanced capacity must stay compact: ${JSON.stringify(instanceMemory)}`);

console.log(JSON.stringify({
  ok: true, integrated: blockers.length === 0,
  blockers, r1Packets: packets.length, drawBatchCommands: opcodes.filter(value => value === 11).length,
  removeBatchCommands: opcodes.filter(value => value === 12).length,
  preparedAssets: 19, embeddedPng: { width: embeddedTexture.image.width, height: embeddedTexture.image.height },
  chunksLoaded: debug.world.children.filter(chunk => chunk.loaded).length,
  orbitDrag: true, virtualPointerLock: true, rawPointerLock: true,
  rendererFrames: states.at(-1).renderer.frame,
  shadowFrames, shadowNodes, shadowMap: [2048, 2048], culledMainNodes,
  triangles: states.at(-1).renderer.triangles,
  instanceMemory,
  widgetSha256: prepare.outputs['widget.js'].sha256
}, null, 2));
