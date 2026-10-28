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
embedded textures/model assets, all 49 loaded chunks, exact incremental versus
reference-chunk streaming (including repeatable saved edits), source-map presence,
linear-fog and reference-resolution 2048² shadow-frame fields, cast/receive flags, the native HUD,
movement, virtual and native-raw pointer lock, focus-loss unlock and orbit-drag
input.

Streaming uses one FIFO generation queue with a shared 4 ms budget. Chunk
finalization publishes at most two instanced meshes per step. Stable 3×3-chunk
regional batches retain their mesh/native IDs. Incomplete incoming groups stay
hidden behind the linear-fog edge; a complete group appears through one pooled
regional overlay. Only instanced source meshes are hidden: ordinary chunk
meshes such as the water plane remain visible. A previously unseen region
promotes those same meshes and native IDs to stable storage without another
upload. Appends to an existing
region go directly into stable storage at most two mesh buffers per frame,
including during movement, without a second temporary overlay upload; incoming
groups remain behind the fog edge until their buffers are ready. Physical pool
cleanup pauses during movement
and for 500 ms afterward. Empty pooled/region batches retain their native
buffers until that bounded idle cleanup.

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
retain every caster inside the independent shadow frustum
(`lastCulledShadowNodes` reports its exclusions). The stress renderer uses
`shadowMap.autoUpdate=false`: ordinary streaming does not invalidate terrain
shadows; player-following sun movement snapped in light space to one shadow
texel, completed regional publication/merge or block edit requests one manual
revision (never a partially staged overlay). This preserves the sun direction
and world-anchored shadows without fractional-texel swimming or coarse camera
jumps. The orthographic shadow half extent tracks fog visibility plus five
blocks (minimum 40, therefore ±80 for the 50–75 fog), putting the shadow-map
boundary beyond fully fogged geometry instead of revealing it during movement.
The original linear fog stays intact, so timely chunks emerge through fog
instead of forcing a full shadow redraw per frame.
Screenshot verification
should inspect the actual Flutter
window as well as these counters. After editing `tool/three/src`, rerun
`node tool/three/build.mjs --source /tmp/jsr-three-r186` **before** the Flutter
build: the native renderer is a separate bundled asset, not part of widget.js.

A deterministic real-GPU golden covers ordinary/instanced draws, the warm
batch path, independent main/shadow culling and a cached shadow map. From the
repository root on macOS:

```bash
flutter test --enable-impeller --enable-flutter-gpu \
  --dart-define=JSR_THREE_GPU_GOLDEN=true \
  test/golden/js_three_r1_golden_test.dart
```

Add `--update-goldens` only when deliberately replacing
`test/golden/goldens/three-r1-instancing-shadows-macos.png`. Without the
define the test reports an explicit skip, so portable test runs do not wait
for an unavailable Flutter GPU context.

For release-like timing and memory measurements, use a profile build and the
built binary rather than debug-mode overhead:

```bash
cd example
flutter build macos --profile -t lib/three_minecraft_stress.dart
JSR_MINECRAFT_STRESS_PROBE_MS=90000 \
  build/macos/Build/Products/Profile/js_widget_runtime_example.app/Contents/MacOS/js_widget_runtime_example
```

Sample process RSS during the run (`ps -o rss= -p <pid>`) and capture
`footprint -p <pid>` / `vmmap -summary <pid>` near the beginning and end.
Compare steady-state samples only after chunk generation and shader warmup;
the Node suite separately asserts compact instance capacity. A stationary
run must not substitute for a movement soak.

For timed performance comparisons on macOS, disable App Nap for the example
bundle (`defaults write com.example.jsWidgetRuntimeExample NSAppSleepDisabled
-bool true`) and keep the display awake during automated input (for example,
launch the built binary through `caffeinate -dims`). Otherwise macOS may
throttle an apparently idle probe after a few tens of seconds even though its
window is visible; that host scheduling transition is not a renderer or
QuickJS slowdown. Use `defaults delete com.example.jsWidgetRuntimeExample
NSAppSleepDisabled` to restore the default power policy after benchmarking.

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
R32 depth target, instanced cast/receive flags, bias/normal-bias and 3×3 PCF.
The main pass flips V in the WebGL-style shadow matrix for Impeller's top-left
render-target UVs; shadow clip rendering keeps the original matrix, so moving
the sun cannot turn the depth lookup into a mirrored, drifting shadow. This
is close to, but not byte-identical with, THREE's PCFSoft sampling. The
original toolbar, instructions, selection and position/status text are native
JSR widgets. The Minecraft font, `lil-gui`, wheel input and full
persistent-storage hydration remain outside this profile.
