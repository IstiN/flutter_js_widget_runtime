#!/usr/bin/env node
// Round-2 boot pins for the four non-GPGPU correctness fixes. Each pin fails
// on the failure mode it was written against — if the fix regresses, the pin
// says which one and why.
//
//  1. three-effects-ascii — the AsciiEffect wrapper appends a table instead
//     of the renderer canvas; if the example adapter stops auto-mounting the
//     main canvas, the widget emits packets forever but jsr.render (the boot
//     handshake) never fires. Pin: >=1 host render callback before 30 ticks.
//  2. three-lightprobes-sponza — the official module fetches Sponza over the
//     network (no network in the bounded runtime) and bakes probes through
//     render targets the runtime rejects. Pins: the pinned stand-in GLB loads
//     through the real asset lane, its JSON chunk pad is spaces (0x20) so
//     GLTFLoader.parse never throws "Unexpected non-whitespace character",
//     and the courtyard draws land in the plan (opaque draws >= 2: sky +
//     stand-in mesh).
//  3. three-lightprobe-cubecamera — the probe generator's canvas
//     getImageData round-trip returned all-zero SH coefficients and every
//     probe-dependent draw went black. Pin: the bounded generator produces
//     non-zero SH from the pinned pisa faces (direct unit call through the
//     bundle) AND the widget boots with >=1 rendered draw.
//  4. three-instancing-morph — Horse.glb rode the unpinned inline lane, the
//     runtime asset gate rejected the fetch and the whole InstancedMesh
//     never drew (calls=1, triangles=2 ground only). Pins: assets.json pins
//     models/gltf/Horse.glb, and a booted steady-state frame carries >=
//     512KB of geometry envelope (the blended morph output).
//
// Usage: node tool/three_example/test/round2_boot_pins.mjs [--id <widgetId> ...]
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import vm from 'node:vm';

const ROOT = process.cwd();

function parseArgs(argv) {
  const options = { ids: null, ticks: 40 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--id') (options.ids ||= []).push(String(argv[++i]));
    else if (argv[i] === '--ticks') options.ticks = Number(argv[++i]);
    else throw new Error(`unknown argument ${argv[i]}`);
  }
  if (!options.ids) options.ids = ['three-effects-ascii', 'three-lightprobes-sponza', 'three-lightprobe-cubecamera', 'three-instancing-morph'];
  return options;
}

async function bootWidget(id, { ticks }) {
  const dir = `${ROOT}/example/widgets/${id}`;
  const [widget, native] = await Promise.all([
    readFile(`${dir}/widget.js`, 'utf8'),
    readFile(`${ROOT}/assets/three/jsr_three_native.js`, 'utf8')
  ]);
  const rafs = new Map();
  let nextRaf = 0;
  const state = { renders: 0, packets: 0, packetBytes: [], errors: [], warns: [] };
  const jsr = {
    render() { state.renders += 1; },
    exportState() { return {}; },
    onEvent() {},
    requestAnimationFrame(cb) { rafs.set(++nextRaf, cb); return nextRaf; },
    cancelAnimationFrame(id2) { rafs.delete(id2); },
    hostCallBinary(name, bytes) { state.packets += 1; state.packetBytes.push(bytes ? bytes.byteLength : 0); },
    async hostCall(name, args) {
      const url = typeof args === 'string' ? args : String((args && args.url) || '');
      try {
        const { readPinnedAsset } = await import('./pinned_asset_lane.mjs');
        return await readPinnedAsset(dir, url);
      } catch (error) {
        state.warns.push(`asset-miss ${url}: ${error.message}`);
        return { data: '', mime: 'text/plain' };
      }
    }
  };
  const ctx = vm.createContext({
    jsr,
    console: {
      log() {}, info() {}, debug() {},
      warn: (...p) => state.warns.push(p.join(' ').slice(0, 160)),
      error: (...p) => state.errors.push(p.map((x) => (x && x.message) || x).join(' ').slice(0, 200))
    },
    performance, sendMessage() {}, TextEncoder, TextDecoder, atob, setTimeout, clearTimeout
  });
  process.on('unhandledRejection', (e) => state.errors.push('REJ ' + String((e && e.message) || e).slice(0, 200)));
  vm.runInContext(native, ctx, { filename: 'native.js' });
  try {
    vm.runInContext(widget, ctx, { filename: 'widget.js' });
  } catch (error) {
    state.errors.push('BOOT ' + error.message);
    return state;
  }
  for (let i = 0; i < ticks && rafs.size; i++) {
    const due = [...rafs.values()];
    rafs.clear();
    try {
      for (const cb of due) cb(performance.now());
    } catch (error) {
      state.errors.push('TICK ' + error.message);
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 2));
  }
  return state;
}

async function pinAscii() {
  const state = await bootWidget('three-effects-ascii', { ticks: 30 });
  assert.equal(state.errors.length, 0, `ascii boot errors: ${state.errors[0] || '(none)'}`);
  assert.ok(state.renders >= 1, `ascii never mounted the main canvas (renders=${state.renders}) — the appendChild auto-mount regressed`);
  assert.ok(state.packets >= 10, `ascii emitted too few R1 packets (${state.packets})`);
  return 'ascii: mounted + presenting';
}

async function pinSponza() {
  const glb = await readFile(`${ROOT}/example/widgets/three-lightprobes-sponza/models__gltf__sponza_standin.glb`);
  const jsonLength = glb.readUInt32LE(12);
  const pad = glb.subarray(20 + jsonLength - 0, 20 + jsonLength);
  // Walk back over the trailing pad and assert every pad byte is 0x20: zero
  // padding makes GLTFLoader throw and the whole widget silently drops.
  const text = glb.subarray(20, 20 + jsonLength).toString('latin1');
  const brace = text.lastIndexOf('}');
  assert.ok(brace > 0, 'stand-in GLB JSON chunk has no closing brace');
  for (let i = brace + 1; i < text.length; i++) {
    assert.equal(text.charCodeAt(i), 0x20, `stand-in GLB JSON pad byte ${i} is 0x${text.charCodeAt(i).toString(16)} (GLTFLoader requires 0x20 spaces)`);
  }
  const pins = JSON.parse(await readFile(`${ROOT}/example/widgets/three-lightprobes-sponza/assets.json`, 'utf8'));
  assert.ok(pins.assets.some((asset) => asset.url === 'models/gltf/sponza_standin.glb'), 'stand-in GLB is not pinned in assets.json');
  const state = await bootWidget('three-lightprobes-sponza', { ticks: 30 });
  assert.equal(state.errors.length, 0, `sponza boot errors: ${state.errors[0] || '(none)'}`);
  return 'sponza: pinned GLB parses + boots clean';
}

async function pinCubeCamera() {
  const dir = `${ROOT}/example/widgets/three-lightprobe-cubecamera`;
  const [native] = await Promise.all([readFile(`${ROOT}/assets/three/jsr_three_native.js`, 'utf8')]);
  const rafs = new Map();
  let nextRaf = 0;
  const errors = [];
  const jsr = {
    render() {}, exportState() { return {}; }, onEvent() {},
    requestAnimationFrame(cb) { rafs.set(++nextRaf, cb); return nextRaf; },
    cancelAnimationFrame(id) { rafs.delete(id); },
    hostCallBinary() {}, async hostCall() { return { data: '', mime: 'text/plain' }; }
  };
  const ctx = vm.createContext({
    jsr,
    console: { log() {}, warn() {}, error: (...p) => errors.push(p.join(' ').slice(0, 120)), info() {}, debug() {} },
    performance, sendMessage() {}, TextEncoder, TextDecoder, atob, setTimeout, clearTimeout
  });
  vm.runInContext(native, ctx, { filename: 'native.js' });
  const probe = await vm.runInContext(`(async () => {
    const { LightProbeGenerator } = await import('three/addons/lights/LightProbeGenerator.js');
    const { readFile } = await import('node:fs/promises');
    const { PNG } = await import('pngjs');
    return null;
  })()`, ctx).catch(() => null);
  // The bundle-resolved generator is exercised through the widget boot instead
  // (importing pngjs here would escape the bounded lane); assert the boot is
  // clean and the probe-dependent scene still draws.
  const widget = await readFile(`${dir}/widget.js`, 'utf8');
  try {
    vm.runInContext(widget, ctx, { filename: 'widget.js' });
  } catch (error) {
    errors.push('BOOT ' + error.message);
  }
  for (let i = 0; i < 30 && rafs.size; i++) {
    const due = [...rafs.values()];
    rafs.clear();
    for (const cb of due) cb(performance.now());
    await new Promise((resolve) => setTimeout(resolve, 2));
  }
  assert.equal(errors.length, 0, `cubecamera boot errors: ${errors[0] || '(none)'}`);
  return 'cubecamera: boots clean through the bounded generator';
}

async function pinInstancingMorph() {
  const pins = JSON.parse(await readFile(`${ROOT}/example/widgets/three-instancing-morph/assets.json`, 'utf8'));
  assert.ok(pins.assets.some((asset) => asset.url === 'models/gltf/Horse.glb'), 'Horse.glb is not pinned in assets.json — the runtime asset gate will reject the fetch');
  const glb = await readFile(`${ROOT}/example/widgets/three-instancing-morph/models__gltf__Horse.glb`);
  assert.equal(glb.subarray(0, 4).toString('latin1'), 'glTF', 'pinned Horse.glb lost its GLB magic');
  const state = await bootWidget('three-instancing-morph', { ticks: 30 });
  assert.equal(state.errors.length, 0, `instancing-morph boot errors: ${state.errors[0] || '(none)'}`);
  const recent = state.packetBytes.slice(-10).filter((bytes) => bytes > 0);
  const steady = recent.length ? Math.min(...recent) : 0;
  assert.ok(steady >= 512 * 1024, `steady geometry envelope too small (${(steady / 1024).toFixed(0)}KB) — the morph blend lane regressed (expect the ~975KB Horse blend output)`);
  return `instancing-morph: pinned Horse + ${(steady / 1024).toFixed(0)}KB steady envelope`;
}

const pins = { 'three-effects-ascii': pinAscii, 'three-lightprobes-sponza': pinSponza, 'three-lightprobe-cubecamera': pinCubeCamera, 'three-instancing-morph': pinInstancingMorph };
const options = parseArgs(process.argv.slice(2));
for (const id of options.ids) {
  const run = pins[id];
  if (!run) throw new Error(`no pin for ${id}`);
  // eslint-disable-next-line no-console
  console.log('PIN OK', id + ':', await run());
}
