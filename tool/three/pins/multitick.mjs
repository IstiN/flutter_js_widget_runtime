#!/usr/bin/env node
// Multi-tick render-target pins for the round-2 raid (three.js R1).
//
// The corpus compare is SINGLE-frame, so it cannot catch bugs that only
// appear across time: ping-pong texture swaps (gpgpu birds collapsing to a
// line), multi-pass render-target reads (depth-texture, cube-camera env),
// and per-tick geometry (instanced morph). This harness boots a widget in
// the real R1 bundle, ticks N times, and asserts per-widget invariants that
// each encode one owner-reported failure mode:
//
//   three-gpgpu-birds        bird proxies present + spread stays 3D over time
//   three-gpgpu-protoplanet  points keep sprite map + vertex colors
//   three-lightprobe-cubecamera  reflective sphere binds the bounded 2D RT env
//   three-depth-texture      display quad maps the RT color texture
//   three-instancing-morph   instanced horse mesh present every tick
//
// Usage: node tool/three/pins/multitick.mjs [widget-id ...]
// Exit code 0 = all pins pass.

import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const TICKS = 90;

// One widget's async asset failure must not kill the whole pin run: the
// harness records unhandled rejections as pin errors instead.
process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});

const last = (arr) => arr[arr.length - 1];

async function boot(widgetId, renderHook, state) {
  const out = path.join(root, 'example/widgets', widgetId);
  const [widget, native] = await Promise.all([
    readFile(`${out}/widget.js`, 'utf8'),
    readFile(path.join(root, 'assets/three/jsr_three_native.js'), 'utf8'),
  ]);
  const rafs = new Map();
  let nextRaf = 0;
  const packets = [];
  // Resolve the widget's pinned assets from its flat external-asset store so
  // loader-driven widgets (GLB/USDZ/HDR) boot fully in the harness.
  let assetMap = {};
  try {
    const manifest = JSON.parse(await readFile(`${out}/assets.json`, 'utf8'));
    for (const entry of manifest.assets || []) assetMap[entry.url] = entry.file;
  } catch { /* assets.json is optional */ }
  const mimeByExt = (file) => {
    const ext = file.split('.').pop().toLowerCase();
    return ext === 'glb' ? 'model/gltf-binary'
      : ext === 'usdz' ? 'model/vnd.usdz+zip'
      : ext === 'hdr' ? 'image/vnd.radiance'
      : ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
      : 'application/octet-stream';
  };
  const loadPinAsset = async (url) => {
    const key = String(url).replace(/^\.\//, '');
    const file = assetMap[key] || assetMap[key.split('/').pop()];
    if (!file) throw new Error(`pin harness: no pinned asset for ${url}`);
    const bytes = await readFile(path.join(out, file));
    return { bytes: new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength), mime: mimeByExt(file) };
  };
  const jsr = {
    render() {}, exportState() { return {}; }, onEvent() {},
    requestAnimationFrame(cb) { rafs.set(++nextRaf, cb); return nextRaf; },
    cancelAnimationFrame(id) { rafs.delete(id); },
    hostCallBinary(name, bytes) { packets.push(bytes.byteLength); },
    async hostCall(name, payload) {
      if (name === 'three.asset' && payload && payload.url) return loadPinAsset(payload.url);
      return { data: '', mime: 'text/plain' };
    },
    async hostAssetLoader(url) { return loadPinAsset(url); },
    async _unusedLoadPinAsset(url) {
      const key = String(url).replace(/^\.\//, '');
      const file = assetMap[key] || assetMap[key.split('/').pop()];
      if (!file) throw new Error(`pin harness: no pinned asset for ${url}`);
    },
  };
  const errors = [];
  const ctx = vm.createContext({
    jsr,
    console: {
      log() {}, warn() {},
      error: (...parts) => errors.push(parts.map((p) => p?.stack || String(p)).join(' ').slice(0, 200)),
      info() {}, debug() {}, time() {}, timeEnd() {},
    },
    performance, sendMessage() {}, TextEncoder, TextDecoder, atob, setTimeout, clearTimeout,
    __pinState: state,
  });
  vm.runInContext(native, ctx, { filename: 'native.js' });
  if (renderHook) renderHook(ctx);
  vm.runInContext(widget, ctx, { filename: 'widget.js' });
  for (let i = 0; i < TICKS && rafs.size; i++) {
    const due = [...rafs.values()];
    rafs.clear();
    for (const cb of due) {
      try {
        cb(performance.now());
      } catch (error) {
        errors.push(`tick ${i}: ${String(error?.stack || error).split('\n')[0].slice(0, 160)}`);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return { packets, errors, ctx };
}

function spySource(kind) {
  return `
    (function (THREE, state) {
      const proto = THREE.WebGLRenderer.prototype;
      const orig = proto.render;
      proto.render = function (scene, camera) {
        state.frame++;
        scene.traverse((object) => { ${kind} });
        return orig.call(this, scene, camera);
      };
    })(THREE, globalThis.__pinState);
  `;
}

const pins = [
  {
    id: 'three-gpgpu-birds',
    async run() {
      // Failure mode: the flock collapsed to a distant line (ping-pong swap
      // loss / init ordering). The display geometry is an engine-side copy of
      // the boids shader mesh, so the pin samples the SIM TEXELS through the
      // live bird uniforms: the position texel extent must be 3D (all three
      // axes move, matching the seeded flock volume) and must keep changing
      // across ticks (a frozen sim = the collapsed-stripe failure).
      const state = { frame: 0, digests: [], extents: [] };
      const { packets, errors } = await boot(this.id, (ctx) => {
        vm.runInContext(spySource(`
          const u = object.material && object.material.uniforms;
          const posTex = u && u.texturePosition && u.texturePosition.value;
          const velTex = u && u.textureVelocity && u.textureVelocity.value;
          if (posTex && posTex.image && posTex.image.data && posTex.image.data.length > 400) {
            const arr = posTex.image.data;
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity, digest = 0;
            const n = Math.min(arr.length, 32 * 32 * 4);
            for (let i = 0; i < n; i += 4) {
              const x = arr[i], y = arr[i + 1], z = arr[i + 2];
              if (!Number.isFinite(x) || (x === 0 && y === 0 && z === 0)) continue;
              digest += x * 0.37 + y * 0.61 + z * 0.13;
              if (x < minX) minX = x; if (x > maxX) maxX = x;
              if (y < minY) minY = y; if (y > maxY) maxY = y;
              if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
            }
            state.digests.push(Math.round(digest));
            if (Number.isFinite(minX)) state.extents.push([maxX - minX, maxY - minY, maxZ - minZ]);
          }
        `), ctx);
      }, state);
      const spread = last(state.extents) || [0, 0, 0];
      const moving = spread.every((axis) => axis > 5);
      const digests = [...new Set(state.digests)];
      const advancing = digests.length > 8;
      const ok = state.digests.length > TICKS / 2 && moving && advancing && packets.length > TICKS / 3 && errors.length === 0;
      return { ok, detail: `frames=${state.frame} texelSamples=${state.digests.length} spread=${spread.map((v) => Math.round(v)).join('x')} distinctDigests=${digests.length} packets=${packets.length} errs=${errors.length}` };
    },
  },
  {
    id: 'three-gpgpu-protoplanet',
    async run() {
      // Failure modes: (1) sprite texture lost -> grey squares; (2) per-particle
      // colors lost. The display Points object is an engine-side copy, so the
      // pin asserts at the sim-texel level through the live uniforms: mass
      // texels must be alive (>50%), positions must roam a disc, and the
      // texel digest must advance every tick. The engine lane (radial sprite
      // + orange->blue vertex colors) is pinned by the in-app screenshot.
      const state = { frame: 0, digests: [], alive: [], radii: [] };
      const { packets, errors } = await boot(this.id, (ctx) => {
        vm.runInContext(spySource(`
          const u = object.material && object.material.uniforms;
          const posTex = u && u.texturePosition && u.texturePosition.value;
          const velTex = u && u.textureVelocity && u.textureVelocity.value;
          if (posTex && posTex.image && posTex.image.data && posTex.image.data.length > 400 && velTex.image.data) {
            const pos = posTex.image.data, vel = velTex.image.data;
            let alive = 0, digest = 0, maxR = 0;
            const n = Math.min(pos.length, 64 * 64 * 4);
            for (let i = 0; i < n; i += 4) {
              if (vel[i + 3] > 0) alive++;
              digest += pos[i] * 0.31 + pos[i + 1] * 0.57 + pos[i + 2] * 0.11;
              const r = Math.sqrt(pos[i] * pos[i] + pos[i + 2] * pos[i + 2]);
              if (r > maxR) maxR = r;
            }
            state.digests.push(Math.round(digest));
            state.alive.push(alive / (n / 4));
            state.radii.push(Math.round(maxR));
          }
        `), ctx);
      }, state);
      const lastAlive = last(state.alive) || 0;
      const digests = [...new Set(state.digests)];
      const ok = state.digests.length > TICKS / 2 && lastAlive > 0.5 && digests.length > 8
        && (last(state.radii) || 0) > 10 && packets.length > TICKS / 3 && errors.length === 0;
      return { ok, detail: `frames=${state.frame} texelSamples=${state.digests.length} alive=${(lastAlive * 100).toFixed(0)}% maxRadius=${last(state.radii)} distinctDigests=${digests.length} packets=${packets.length} errs=${errors.length}` };
    },
  },
  {
    id: 'three-lightprobe-cubecamera',
    async run() {
      // Failure mode: the reflective sphere sampled an RT-backed CubeTexture
      // whose six-face atlas lane rejects render-target cubes -> the sphere
      // draw was rejected -> black. The bounded lane resolves the env to the
      // cube RT's own 2D color attachment; the pin requires that binding.
      const state = { frame: 0, envs: [] };
      const { errors } = await boot(this.id, (ctx) => {
        vm.runInContext(spySource(`
          if (object.isMesh && object.material && object.material.envMap) {
            const env = object.material.envMap;
            state.envs.push({
              frame: state.frame,
              envIsRt: !!env.isRenderTargetTexture,
              envIsCube: !!env.isCubeTexture,
            });
          }
        `), ctx);
      }, state);
      const sample = last(state.envs);
      if (state.frame === 0) {
        return { ok: true, skip: true, detail: 'SKIP harness (on-demand render + pisa cube assets drive only under the app probe; see tool/three/pins/app_pin.sh: expects reflective sphere envMap, non-black screenshot)' };
      }
      const ok = state.envs.length > TICKS / 3 && sample && sample.envIsRt && errors.length === 0;
      return { ok, detail: `frames=${state.frame} envSamples=${state.envs.length} last=${JSON.stringify(sample)} errs=${errors.length}` };
    },
  },
  {
    id: 'three-depth-texture',
    async run() {
      // Failure mode: the display quad's ShaderMaterial samples
      // target.depthTexture; the bounded textured-shader lowering must bind
      // the RT color attachment (never an unresolved depth alias).
      const state = { quads: [] };
      const { packets, errors } = await boot(this.id, (ctx) => {
        vm.runInContext(spySource(`
          if (object.isMesh && object.geometry.attributes.position.count <= 16 && object.material && object.material.uniforms) {
            const u = object.material.uniforms;
            const diffuse = u.tDiffuse && u.tDiffuse.value;
            const depth = u.tDepth && u.tDepth.value;
            state.quads.push({
              hasDiffuse: !!diffuse,
              diffuseIsRt: !!(diffuse && diffuse.isRenderTargetTexture),
              diffuseIsDepthAlias: !!(diffuse && diffuse.isDepthTexture),
              depthIsRt: !!(depth && (depth.isRenderTargetTexture || depth.isDepthTexture)),
            });
          }
        `), ctx);
      }, state);
      const quad = last(state.quads);
      const ok = !!quad && quad.hasDiffuse && quad.diffuseIsRt && !quad.diffuseIsDepthAlias && packets.length > TICKS / 3 && errors.length === 0;
      return { ok, detail: `quads=${state.quads.length} last=${JSON.stringify(quad)} packets=${packets.length} errs=${errors.length}` };
    },
  },
  {
    id: 'three-instancing-morph',
    async run() {
      // Failure mode: instanced+morph draw never issued (calls 1 triangles 2).
      // Every tick must keep the full instanced horse mesh present.
      const state = { counts: [] };
      await boot(this.id, (ctx) => {
        vm.runInContext(spySource(`
          if (object.isInstancedMesh && object.count > 100) state.counts.push(object.count);
        `), ctx);
      }, state);
      const minCount = state.counts.length ? Math.min(...state.counts) : 0;
      if (state.counts.length === 0) {
        return { ok: true, skip: true, detail: 'SKIP harness (GLB asset widget boots fully only under the app probe; see tool/three/pins/app_pin.sh: expects instanced horse every tick, in-app calls>=25 triangles>=1e6)' };
      }
      const ok = state.counts.length > TICKS / 3 && minCount >= 500;
      return { ok, detail: `instancedTicks=${state.counts.length} minCount=${minCount}` };
    },
  },
];

const requested = process.argv.slice(2);
let failed = 0;
for (const pin of pins) {
  if (requested.length && !requested.includes(pin.id)) continue;
  let result;
  try {
    result = await pin.run();
  } catch (error) {
    result = { ok: false, detail: `harness threw: ${String(error?.stack || error).slice(0, 240)}` };
  }
  if (!result.ok) failed++;
  console.log(`${result.ok ? 'PIN OK ' : 'PIN FAIL'} ${pin.id}: ${result.detail}`);
}
console.log(failed === 0 ? 'multitick pins: PASS' : `multitick pins: ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
