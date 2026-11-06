// Regression test for the webgl_batch_lod_bvh dragThrottleHover prepare
// transform: the official module raycasts the BatchedMesh on EVERY
// pointermove for hover highlighting. The transform gates hover raycasts —
// skipped entirely while any pointer is down (one converge raycast on
// release when events were skipped) and coalesced to a <=33ms trailing edge
// (leading edge immediate when idle) otherwise — and registers document
// pointerdown/pointerup/pointercancel listeners so the pointer-count gate
// survives multi-touch and heals when _clearInput synthesizes pointercancel.
//
// Harness precedent: controls_gui_test.mjs (jsr stubs + widget.js in
// node:vm; input() = jsr.three._dispatchEvent('main', event); Raycaster spy
// via vm.runInContext like the in-app probe in
// test/js_three_batch_lod_interactive_fps_test.dart).
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace('/private/tmp', '/tmp'));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');

const native = await readFile(path.join(ROOT, 'assets/three/jsr_three_native.js'), 'utf8');
const widget = await readFile(path.join(ROOT, 'example/widgets/three-batch-lod-bvh/widget.js'), 'utf8');

function commands(packet) {
  const bytes = Buffer.from(packet);
  const header = bytes.readUInt16LE(6);
  const count = bytes.readUInt32LE(header + 8);
  const output = [];
  let offset = header + 12;
  for (let index = 0; index < count; index++) {
    const opcode = bytes[offset];
    const length = bytes.readUInt32LE(offset + 4);
    output.push({ opcode, body: bytes.subarray(offset + 8, offset + 8 + length) });
    offset += 8 + length;
  }
  assert.equal(offset, bytes.length);
  return output;
}

function cameraState(packets) {
  for (let packetIndex = packets.length - 1; packetIndex >= 0; packetIndex--) {
    const frames = commands(packets[packetIndex]);
    for (let index = frames.length - 1; index >= 0; index--) {
      if (frames[index].opcode !== 6) continue;
      const body = frames[index].body;
      return {
        position: [184, 188, 192].map(offset => body.readFloatLE(offset)),
        matrix: Array.from({ length: 16 }, (_, i) => body.readFloatLE(136 + i * 4))
      };
    }
  }
  throw new Error('no R1 camera command');
}

function boot(widgetSource, instanceId) {
  const states = [];
  const packets = [];
  const rafs = new Map();
  const timers = new Map();
  let nextTimer = 0;
  const jsr = {
    instanceId,
    _handler: null,
    render() {},
    exportState(state) { states.push(JSON.parse(JSON.stringify(state))); },
    onEvent(handler) { this._handler = handler; },
    requestAnimationFrame(callback) { const id = rafs.size + 1; rafs.set(id, callback); return id; },
    cancelAnimationFrame(id) { rafs.delete(id); },
    hostCallBinary(name, bytes) { if (name !== 'three.r1') throw new Error(`unexpected host binary ${name}`); packets.push(Buffer.from(bytes)); },
    hostCall(name) {
      if (name === 'three.canvas2d') return new Promise(() => {});
      if (name === 'three.asset') return null;
      throw new Error(`unexpected host call ${name}`);
    }
  };
  const context = vm.createContext({
    jsr, console, performance, sendMessage() {}, TextEncoder, TextDecoder,
    setTimeout(callback) { const id = ++nextTimer; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); }
  });
  vm.runInContext(native, context, { filename: 'jsr_three_native.js' });
  vm.runInContext('globalThis.THREE = THREE;', context);
  vm.runInContext(widgetSource, context, { filename: 'widget.js' });
  // Spy on the hover raycast lane exactly like the in-app probe does: the
  // facade binds the native Raycaster class, so prototype patching sees the
  // official module's raycaster.intersectObject( batchedMesh ) call.
  vm.runInContext(`
    globalThis.__raycasts = 0;
    const __originalIntersectObject = THREE.Raycaster.prototype.intersectObject;
    THREE.Raycaster.prototype.intersectObject = function (...args) {
      globalThis.__raycasts++;
      return __originalIntersectObject.apply(this, args);
    };
  `, context);
  return {
    context, jsr, states, packets, timers, rafs,
    raycasts: () => vm.runInContext('globalThis.__raycasts', context),
    frame(now = performance.now()) {
      const callbacks = [...rafs.values()];
      rafs.clear();
      assert.equal(callbacks.length, 1);
      callbacks[0](now);
    },
    pumpTimers() {
      const callbacks = [...timers.values()];
      timers.clear();
      for (const callback of callbacks) callback(performance.now());
      return callbacks.length;
    },
    input(event) { jsr.three._dispatchEvent('main', event); }
  };
}

const booted = boot(widget, 'batch-lod-hover-throttle-test');

// The engine reaches its animation loop within a couple of microtask turns
// (canvas/renderer setup is promise-based), so drain before the first frame.
const bootDeadline = Date.now() + 30000;
while (booted.rafs.size < 1) {
  if (Date.now() > bootDeadline) throw new Error('widget never reached the animation loop');
  await new Promise(r => setImmediate(r));
}

// The first frame establishes the initial camera state. The widget schedules
// its own baseline timer at boot (a UI sampler unrelated to the throttle), so
// every throttle-timer assertion below is relative to a freshly-read baseline.
booted.frame(0);
const baselineTimers = () => booted.timers.size;
const baseline0 = baselineTimers();
const initialCamera = cameraState(booted.packets);

// (1) Drag storm: pointer down + 60 moves must produce ZERO hover raycasts
// (the gate is down-count>0) and no pending trailing timer.
booted.input({ type: 'pointerdown', pointerId: 1, pointerType: 'mouse', button: 0, pageX: 120, pageY: 120 });
assert.equal(baselineTimers(), baseline0, 'pointerdown clears any pending trailing timer');
for (let move = 0; move < 60; move++) {
  booted.input({ type: 'pointermove', pointerId: 1, pointerType: 'mouse', buttons: 1, pageX: 120 + move, pageY: 120 + move / 2 });
}
assert.equal(baselineTimers(), baseline0, 'drag storm leaves no pending trailing timer');
assert.equal(booted.raycasts(), 0, 'drag storm raycasts are fully gated while a pointer is down');

// The map-controls pan still worked: the drag moved the camera.
booted.frame(16);
const draggedCamera = cameraState(booted.packets);
assert.notDeepEqual(draggedCamera.matrix, initialCamera.matrix, 'official MapControls pan survives the throttle');

// (2) pointerup converges exactly one raycast for the skipped drag events.
booted.input({ type: 'pointerup', pointerId: 1, pointerType: 'mouse', button: 0, pageX: 179, pageY: 149 });
assert.equal(booted.raycasts(), 1, 'pointerup converges exactly one raycast');
assert.equal(baselineTimers(), baseline0, 'converge raycast fires immediately from the idle window');

// (3) Hover storm with no pointer down: at most 1 immediate (leading edge)
// + 1 pending (trailing coalesce) across 20 moves; pumping fires the
// trailing edge exactly once (total <= 2, not 20).
await new Promise(resolve => setTimeout(resolve, 40));
const beforeStorm = booted.raycasts();
const timersBeforeStorm = baselineTimers();
for (let move = 0; move < 20; move++) {
  booted.input({ type: 'pointermove', pointerId: 2, pointerType: 'mouse', pageX: 200 + move, pageY: 160 });
}
const afterStorm = booted.raycasts() - beforeStorm;
assert.ok(afterStorm <= 1, `hover storm produced ${afterStorm} immediate raycasts (<= 1 leading edge)`);
assert.equal(baselineTimers(), timersBeforeStorm + 1, 'hover storm coalesces to exactly one pending trailing timer');
assert.ok(booted.pumpTimers() >= 1, 'pumping fires the trailing edge');
assert.ok(booted.raycasts() - beforeStorm <= 2, `hover storm totaled ${booted.raycasts() - beforeStorm} raycasts (<= 2)`);
assert.equal(baselineTimers(), 0);

// (4) An idle single move fires immediately (leading edge) with no timer.
await new Promise(resolve => setTimeout(resolve, 40));
const beforeIdle = booted.raycasts();
booted.input({ type: 'pointermove', pointerId: 3, pointerType: 'mouse', pageX: 260, pageY: 180 });
assert.equal(booted.raycasts(), beforeIdle + 1, 'idle single move raycasts immediately');
assert.equal(baselineTimers(), 0, 'idle single move leaves no trailing timer');

// (5) Stuck-gate heal: the pointer-count gate survives multi-touch (2 downs
// => still gated after 1 cancel) and a synthetic pointercancel converges
// the skipped events when the last pointer releases the gate.
await new Promise(resolve => setTimeout(resolve, 40));
booted.input({ type: 'pointerdown', pointerId: 11, pointerType: 'touch', button: 0, pageX: 300, pageY: 200 });
booted.input({ type: 'pointerdown', pointerId: 12, pointerType: 'touch', button: 0, pageX: 380, pageY: 200 });
for (let move = 0; move < 8; move++) {
  booted.input({ type: 'pointermove', pointerId: 12, pointerType: 'touch', buttons: 1, pageX: 380 + move * 4, pageY: 200 });
}
assert.equal(booted.raycasts(), beforeIdle + 1, 'multi-touch drag stays gated');
booted.input({ type: 'pointercancel', pointerId: 11, pointerType: 'touch', button: 0, pageX: 300, pageY: 200 });
assert.equal(booted.raycasts(), beforeIdle + 1, 'one surviving pointer keeps the gate closed');
booted.input({ type: 'pointercancel', pointerId: 12, pointerType: 'touch', button: 0, pageX: 412, pageY: 200 });
assert.equal(booted.raycasts(), beforeIdle + 2, 'final pointercancel heals the gate with exactly one converge raycast');
assert.equal(baselineTimers(), 0);

// The frame lane is still alive after all input lanes ran.
booted.frame(32);
assert.ok(booted.states.at(-1).renderer.calls > 0, 'frames still submit after the storm');

console.log('batch_lod hover throttle: all scenarios passed');
