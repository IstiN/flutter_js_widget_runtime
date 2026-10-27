# THREE r186 Minecraft native stress target

This is an **external, reproducible stress profile**, not a published widget and
not a rewrite of the reference game. It runs the real
`minecraft-threejs-clone` application graph on the pinned THREE r186 native
adapter and emits `three.r1` packets to the Flutter GPU host.

## Inputs and guarantees

- THREE source: the r186 checkout pinned by `tool/three/source-pin.json`
  (default `/tmp/jsr-three-r186`, override with `--source`).
- Reference application: `../references/minecraft-threejs-clone` (override
  with `--ref`). The reference has no LICENSE file. It and generated outputs
  must stay local; never publish or redistribute them.
- Output: `/tmp/jsr-minecraft-stress` by default. `--out` must be outside this
  package and outside the reference checkout.
- Preparation is always offline. No Vite server, `node_modules/three`
  fallback, remote import, or modification of the reference is used.
- The generated `prepare_manifest.json` records the source pin, graph inputs,
  asset digests and output hashes. The upstream THREE MIT license is copied to
  `THREE_LICENSE`.

## Prepare and test

```bash
npm --prefix tool/three ci
node tool/three/build.mjs --source /tmp/jsr-three-r186
node tool/three_minecraft_stress/prepare.mjs --offline
node tool/three_minecraft_stress/prepare.mjs --offline --verify
node tool/three_minecraft_stress/test/stress_test.mjs
```

The default profile preserves the reference `world.drawDistance = 3`, so a
run owns the original 49-chunk square and starts the bounded worker queue.
`--draw-distance 0..5` is available for deliberate load comparisons; only a
non-default value injects the exact source-anchor override. Real
`THREE.InstancedMesh` matrices go through `DRAW_BATCH`; blocks are not expanded
into one JS `Mesh` per block. `--storage-write-through` opts out of the default
bounded, coalesced `StorageWrite` mirror.

The Node test also runs without host `TextEncoder`/`TextDecoder` globals, like
QuickJS. It checks the prepared digests, native R1 packets, instanced batches,
embedded textures/model assets, all 49 loaded chunks, source-map presence,
linear-fog and 2048² shadow-frame fields, cast/receive flags, the native HUD,
movement, virtual and native-raw pointer lock, focus-loss unlock and orbit-drag
input.

## Real macOS Flutter GPU probe

```bash
cd example
JSR_MINECRAFT_STRESS_PROBE_MS=120000 \
  flutter run -d macos -t lib/three_minecraft_stress.dart --debug
```

`JSR_MINECRAFT_STRESS_DIR` overrides the generated directory. The probe timer
is optional (`0` means no timeout, maximum `300000` ms). The default engine
factory selects QuickJS FFI when its native library is available; the startup
log explicitly names the backend. This target does not create a WebView or use
the browser/software renderer.

The overlay and periodic `[three-stress:r1]` log expose surface attach/size,
backend readiness, presented frames, draw calls, instanced triangle count,
resource uploads/failures and presentation failures. A successful probe must
show `attached: 1`, a nonzero surface, `backendReady: 1`, increasing
`presentedFrames`, and zero geometry/batch/texture/presentation failures. When
the shadow profile is active, `renderedShadowDraws` must be nonzero and the
reported shadow target must be 2048×2048; the bounded probe exits nonzero
otherwise. `shadowCacheHits` confirms reuse after the initial shadow render,
and main draw/triangle counts exclude camera-culled nodes while shadow draws
retain every caster. Screenshot verification should inspect the actual Flutter
window as well as these counters. After editing `tool/three/src`, rerun
`node tool/three/build.mjs --source /tmp/jsr-three-r186` **before** the Flutter
build: the native renderer is a separate bundled asset, not part of widget.js.

Controls: **Click to lock**, then **WASD / Space**. On macOS the example host
uses a dedicated `jsr.three.pointer` channel for relative NSEvent deltas,
cursor disassociation and hide/unhide; other hosts fall back to Flutter's
relative `localDelta`. **Esc** releases pointer lock after the original keydown
handlers (matching browser default action), and application focus loss
restores the cursor immediately. A native close button stays above JS input
capture for a guaranteed one-click exit. The first mobile/touch iteration is deliberately limited to the
existing virtual joystick and look input; it is not a claim of complete touch
UI parity.

Scope of this profile: the original linear fog is rendered with the same
50/75 range and sky color. The first directional light gets a native 2048²
R32 depth target, instanced cast/receive flags, bias/normal-bias and 3×3 PCF;
this is close to, but not byte-identical with, THREE's PCFSoft sampling. The
original toolbar, instructions, selection and position/status text are native
JSR widgets. The Minecraft font, `lil-gui`, wheel input and full
persistent-storage hydration remain outside this profile.
