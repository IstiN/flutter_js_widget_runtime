# Skill: Maintaining the js_widget_runtime Engine

Use this skill when modifying the JS runtime, bridge, engine handlers, or adding new `jsr.*` API surface.

## Engine Layers

```
JS widget code
      ↓
kJsWidgetBootstrap (lib/src/runtime/js_widget_bootstrap.dart)
      ↓
sendMessage(channel, jsonString)
      ↓
JsWidgetBridge.dispatch(channel, payload)  (lib/src/runtime/js_widget_bridge.dart)
      ↓
Platform engine:
  VM: JsWidgetEngine → flutter_js runtime  (lib/src/runtime/js_widget_engine_vm.dart)
  Web: JsWidgetEngine → web.Worker         (lib/src/runtime/js_widget_engine_web.dart)
```

## Adding a New jsr.* API

Follow these steps in order:

1. **Add the JS API in `kJsWidgetBootstrap`** (`lib/src/runtime/js_widget_bootstrap.dart`).
   - Use `sendMessage('__jsr_<name>', JSON.stringify(args))`.
   - If async, store a callback in `__cbs[id]` and resolve later.

2. **Bridge channels are self-describing**: `JsWidgetBridge.handledChannels`
   is the union of the sync and async handler maps. Engines that need
   per-channel registration (flutter_js `setupBridge`) derive their list
   from it — never keep a hand-maintained copy (a stale list silently drops
   messages: the `__jsr_host_call`/`__jsr_capture` omission hung every
   `jsr.hostCall` promise on JSC).

3. **Handle the channel in `JsWidgetBridge.dispatch`** (`lib/src/runtime/js_widget_bridge.dart`).
   - Add a `_handle<Name>` private method.
   - Inject the platform behavior via `JsRuntimeConfig` if it needs host-specific I/O.

4. **Wire the VM engine** (`lib/src/runtime/js_widget_engine_vm.dart`).
   - Most channels route through `_bridge.dispatch` automatically via `rt.setupBridge`.
   - If the API is async, make sure the resolve path calls `_resolveCallback`.

5. **Wire the Web engine** (`lib/src/runtime/js_widget_engine_web.dart`).
   - Add a worker-side handler inside `_buildWorkerScript`.
   - Post messages back to the worker using `_postToWorker`.

6. **Add default handlers** if the API has sensible VM/Web defaults:
   - VM: `lib/src/defaults/vm_default_handlers.dart`
   - Web: `lib/src/defaults/web_default_handlers.dart`

7. **Add tests**:
   - Unit-test `JsWidgetBridge` dispatch behavior with fake handlers.
   - If the API is renderer-related, add a widget test through `JsonWidgetRenderer`.

## Adding a New Renderer Type

1. Add the type alias to `UiViewTreeNormalizer` if it has alternative names or props.
2. Implement the widget branch in `JsonWidgetRenderer._buildWidget`.
3. Add a widget test in `test/json_widget_renderer_test.dart`.
4. Document the new type in `.agents/skills/js-widget-authoring/SKILL.md`.

## Core-Capability hostCall Names (`voxel.*`)

Most `jsr.hostCall` names route to the host's `onHostCall`. The `voxel.*`
namespace is different: `JsWidgetBridge._handleHostCall` intercepts it
BEFORE the host handler and serves it from the bridge-owned `voxelWorld`
(a `JsVoxelWorld`), which also backs the `voxel` renderer node. This makes
voxel a core capability: no host wiring, and hosts without the
interceptor (older runtimes) reject `voxel.*` so widgets can probe with
`voxel.attach` and degrade. When adding a renderer node that needs JS-side
state without a host object, follow this pattern instead of a new channel
— it reuses `__jsr_host_call` and needs no bootstrap or engine changes.

The binary lane extends the same interception: `dispatchBinary` routes
`voxel.*` binary names into `JsVoxelWorld.handleHostCallBinary` (not the
host's `onHostCallBinary`), and `voxel.attach` advertises `bin: true`
when the QuickJS backend wired `__jsrSendBytes`. Two capabilities share
the `'JVXM'` envelope (magic + version + u32 header length + NUL-padded
header JSON + raw body): `voxel.mesh.bin` (f32 positions/colors + u32
indices) and `voxel.blocks.bin` (raw block bytes, no base64). Malformed
binary payloads drop silently — the lane has no promise to reject
through. When adding a heavy per-chunk/per-frame payload, prefer a
packed binary capability over a JSON `hostCall`: see
`JsVoxelChunk.parseBinaryEnvelope` and `example/widgets/fa-craft`.

Voxel painter ordering starts with exact far-to-near average view depth and
emission order for exact ties; never quantize depths into buckets. It then
builds a stable topological order from shared-edge and arbitrary real
screen-overlap relations (`js_voxel_shared_edges.dart` and
`js_voxel_overlap.dart`). Preserve every nonzero overlap relation, even when
it agrees with average depth: an unconstrained pair can be reversed later by
the topological pass. Screen-disjoint pairs can be rejected with SAT, but
bbox/depth shortcuts must not discard a real average-correct overlap. Cached
orders are reusable only with an identical camera, viewport and visible-chunk
set; moving cameras rebuild, and dynamic meshes merge independently.
`test/js_voxel_node_test.dart` has pixel/graph regressions for bucket
collisions, shared edges and average-correct overlaps. Frustum plane normals
are `tan * forward ± axis`; keep all eight AABB corners inside every plane.

For live voxel artifacts, use the preview's opt-in `?voxelDebug=1`: it emits
batched per-frame camera/chunk signatures, clip/cull counts, sort validation,
buffer/page/stream hashes and the largest triangle. `?voxelDebug=copy` also
uses immutable per-frame vertex buffers as a raster-lifetime A/B probe,
`=mob` traces partially visible mob chunks, `=probe&px=<x>&py=<y>` lists
triangles covering one pixel with their final order and interpolated depth,
and `=audit` samples final-order depth inversions (`=fullAudit` additionally
forces the full overlap pass instead of using the order cache). Keep these
disabled by default, and do not call a probe a fix until the original scene
confirms which mechanism is responsible. Add `&voxelAuditDynamic=1` to include
dynamic meshes in the audit samples.

The global world-space BSP in `js_voxel_bsp.dart` is the default voxel depth
order, not a per-chunk ordering shortcut; preview `?voxelBsp=0` selects the
legacy topological renderer for comparison or emergency fallback. Static
terrain must split every plane-straddling triangle (with world-linear RGB)
and leave no unresolved multi-triangle leaves. Static chunk identity changes
use batched incremental insertion and an indexed chunk→nodes prune; do not
reintroduce a full terrain rebuild for each streaming upload. Camera movement
only traverses the tree. Conservative static subtree AABBs and per-frame
dynamic bounds cull offscreen work before per-triangle projection. Dynamic
and overlay meshes are split into that tree each frame, and co-located
dynamic fragments receive an exact local shared/overlap topological order.
No static root, excessive fragment growth, excessive depth, or dynamic
insertion failure must fall back to the unchanged whole-frame topological
path. Keep regressions for both the default BSP and explicitly disabled
legacy path, including cross-chunk, split attributes, dynamic/overlay,
cache-invalidation, near-clip, texture and moving-camera audits.

## Upstream THREE (`jsr.three`, r186)

This is an independent host hierarchy, NOT an extension of `Js3dHost` or
`scene3d`. The public factories are `createFlutterGpuThreeHost()` (native) and
`createWebThreeHost()` (Web, conditional export). Loading the large upstream
bundle is opt-in with `JsRuntimeConfig.threeEnabled`; `threeSource` is a
test/host override and `threeHost` supplies surfaces/assets. The pinned
identity lives in `ThreeUpstreamBundle`, `tool/three/source-pin.json` and
`assets/three/bundle_manifest.json` (r186, peeled commit `9b4a2ac…`).

- Native evaluates upstream core on QuickJS/JSC. Its `THREE.WebGLRenderer`
  export is the explicit `JsrWebGLRenderer` alias. It emits versioned
  `JSR3D-T1` / `R1-v2` packets over `jsr.hostCallBinary('three.r1', bytes)`;
  strict Dart decode also accepts legacy R1-v1 streams. `rawWebGL == false`,
  `getContext()` and ShaderMaterial fail with
  `three.unsupported`. It is NOT WebGL in a WebView.
- `JsWidgetBridge` binds each packet to its generated/preserved engine id,
  copies call-scoped native byte views, and `FlutterGpuThreeHost` verifies
  the envelope id before applying it. Every resource key is
  `(engineId, surfaceId, resourceId)`. Strict decode is atomic and complete
  before state mutation; malformed/stale/cross-surface input is rejected.
  On `flutter_js`/JSC the bootstrap wrapper may arrive already json-decoded
  as `{iid,id}`; read `iid` before unwrapping BOTH Map and String forms, or
  the base64 R1 lane is dropped/misrouted (`js_three_flutter_js_test.dart`).
- Native surfaces render through `GpuImageSurface` and present a `ui.Image`.
  Geometry/texture versions, not camera frames, drive uploads. Presentation
  coalesces to two frames without dropping resource commands. Resize/DPR,
  PNG capture, disposal and async-init generation checks belong to the host.
  `InstancedMesh` emits `DRAW_BATCH` with real matrices and one GPU draw per
  material part; copy typed-array matrix payloads as bulk little-endian bytes,
  not one JS `f32` write per element. Transparent instancing/per-instance
  colors are not in the initial profile. `ThreeDrawPlan.triangleCount`
  includes every instance.
  Linear `THREE.Fog` is serialized in `FRAME`. The first shadow-casting
  directional light uses a separate shadow command buffer, an R32 depth-color
  target, instanced cast/receive flags and 3×3 PCF; keep its target/pipeline
  optional on unsupported formats and do not leave two Metal render encoders
  open in one command buffer. This is not exact PCFSoft or multi-light shadow
  parity. `VertexInfo` is 320 bytes including Impeller's trailing padding;
  validate future ABI edits against impellerc reflection and a real GPU probe.
  Track the cumulative HostBuffer uniform offset. Before each aligned
  emplacement, insert a computed filler when the payload would straddle
  Flutter's 1,024,000-byte block; aligning the payload alone still lets the
  final partial block overflow its DeviceBuffer. The reflected size check
  uses the unpadded ABI size. Keep the straddling-payload regression and a
  long presentation soak. The optional R1 FRAME trailer is `u32 count` plus
  nonzero node ids culled by the main camera; skip only those main draws.
  Cache the first directional shadow map by content revision, dimensions,
  bias/normalBias and all matrix values; a cache hit still binds the map.
  Default `shadowMap.autoUpdate=true` follows scene content revisions. With
  `autoUpdate=false`, FRAME carries a manual content revision advanced only by
  `shadowMap.needsUpdate=true`; streaming/uploads then reuse the static map,
  while light-matrix changes still invalidate it. The optional trailer keeps
  both culling sets before this revision, and legacy frames remain valid.
- R1 Phong uses the real specular/shininess material fields and Blinn-Phong
  shader path; it is not a Lambert alias. Mesh wireframes upload deduplicated
  line indices alongside the owned source geometry for indexed/non-indexed
  triangles. The bounded native Canvas2D proxy records radial-gradient and
  `fillRect` commands, then `three.canvas2d` routes them to Flutter
  `dart:ui.Canvas` and returns owned raw RGBA. Readiness adopts a new texture
  version and schedules a transactional render even for static scenes;
  stale/disposed completions carry no pixels. Web remains on OffscreenCanvas.
- HemisphereLight is an independent R1-v2 light kind with sky/ground colors,
  intensity and normalized world-position direction. It contributes diffuse
  irradiance to Lambert/Standard/Phong, never Basic/Normal or shadow maps;
  four hemisphere slots are independent of directional/point quotas and
  overflow is diagnosed deterministically.
- Native large indexed single-material meshes accelerate `Raycaster` with a
  cached BVH (`native_raycast_bvh.js`). It only filters candidates; upstream
  `_computeIntersections` still performs final triangle/UV/normal/material
  work and receives restored face ids. Position/index object, array and
  version changes invalidate the cache. Skinned/morph/non-indexed/material-
  array/bounded-draw-range meshes must use the stock path. Keep the QuickJS
  face-id/invalidation regression and a real Terrain pointermove FPS smoke.
- Web uses the REAL upstream `WebGLRenderer` on a Worker-owned
  `OffscreenCanvas`. Canvas/WebGL2 creation is synchronous in the Worker;
  no proxy GL and no main-canvas reservation. A separate structured-clone
  lane transfers ImageBitmap frames (at most two pending) to
  `WebThreeHost`/HtmlElementView, which draws, closes and acknowledges them.
  Never serialize bitmaps/canvas handles through `JsWidgetMessage` JSON.
- `three.asset` is the request/response hostCall name; failures use the
  named `three.assetFailure` error. Prefer prepared `jsr.three.registerAsset`
  bytes. Otherwise the host-approved loader runs, with HTTP additionally
  gated by the `fetch` permission. Never evaluate assets or log their bytes,
  URL credentials, or secrets.
- `JsThreeNode` owns per-surface layout and DOM-shaped Listener input.
  Pointer payloads carry `movementX/Y` from Flutter `localDelta`; adapters
  should consume those relative deltas and only reconstruct from absolute
  positions for older hosts. This is not raw unadjusted OS pointer input.
  The macOS stress target's host-specific `jsr.three.pointer` channel uses
  `CGAssociateMouseAndMouseCursorPosition`, cursor hide/unhide and NSEvent
  deltas, restores input on focus loss, and falls back to `localDelta` when
  native locking is unavailable; do not put this host policy in core JSR.
  `JsKeyboardCapture` preserves editable-text priority and sends global
  `three.blur`; runtime input clears held keys/buttons on blur, visibility,
  cancel and disposal. `_prepareTree` stamps internal engine/surface ids on
  every `three` node automatically.

Build/verify the runtime bundles with the local pinned source and locked
esbuild (`node tool/three/build.mjs --source /tmp/jsr-three-r186`, add
`--verify` for a clean hash comparison). `tool/build_three_shaders.dart`
builds the Impeller shaderbundle reproducibly. Official example preparation
uses `dart run bin/jsr_three_example.dart prepare <example-id>`; supported
ids include `webgl_geometry_minecraft`, `webgl_lines_colors`,
`webgl_geometry_colors`, `webgl_buffergeometry_uint`,
`webgl_buffergeometry_indexed`, `webgl_buffergeometry_lines_indexed`,
`webgl_buffergeometry_points`, `webgl_geometry_terrain_raycast` and
`webgl_math_orientation_transform`. It preserves exact original/module bytes
and resolves only the pinned addons/local assets.
`webgl_buffergeometry_lines` (morph targets) stays excluded until R1 supports
that feature. The runner accepts
`--dart-define=JSR_THREE_EXAMPLE=<example-id>` for automated native/Web
smokes; native compatibility still has to pass the actual R1 gates.

For nonblocking native startup, opt in with
`backendFactory: createQuickjsIsolateWidgetEngineBackend`. The persistent
isolate owns QuickJS and JS-side R1 encoding; the main isolate retains the
bridge, scheduler, Promise resolvers and hosts. Binary payloads cross as
owned `TransferableTypedData`, never as a retained native pointer. Use the
factory (not a preconstructed `backend`) so `JsWidgetRuntimeWidget`'s final
`onRender` wrapper reaches the backend. Keep direct-backend timing tests
unchanged and use `tester.runAsync` for real isolate startup/disposal in
widget tests. quickjs_runtime 0.4.8+ re-anchors QuickJS's stack top when the
VM migrates an isolate between OS threads.

Tests are layered: strict protocol quotas/malformed input, per-surface state,
pure draw planning, real QuickJS JS↔Dart R1 (including 300 camera frames
without reupload), Web VM lifecycle + real Chrome bitmap/ack tests, then an
actual native Impeller app and real Chrome/Edge upstream WebGL screenshot.
A Canvas2D bitmap test alone is not proof of upstream WebGL rendering. The
heavy local reference profile is documented in
`tool/three_minecraft_stress/README.md`; its macOS runner must show attached
nonzero surfaces, increasing presented frames and zero upload/presentation
failures, not merely R1 packets or a live JavaScript RAF loop.

## Engine Lifecycle

- `JsWidgetEngine.run(widgetJs)` starts the runtime, evaluates bootstrap + optional host bootstrap + widget JS.
- `JsWidgetEngine.callEvent(actionId, payload)` invokes the widget's `handleEvent`.
- `JsWidgetEngine.updateTheme(colors)` pushes new theme values into `jsr.theme`.
- `JsWidgetEngine.dispose()` cancels timers, terminates the worker / JS runtime.

## Host-Specific Extensions

Do not add host-specific APIs (e.g., YoLoIT panels, boards, CLI commands) into the core bootstrap. Instead, use `JsRuntimeConfig.hostBootstrapJs` to inject them before the widget runs.

Example for a YoLoIT host:

```dart
JsRuntimeConfig(
  hostBootstrapJs: r'''
jsr.yoloit = {
  panel: {
    setTitle: function(t) { jsr.setTitle(t); },
  },
  board: {
    getPanels: function() { return jsr.exec('yoloit board:list'); },
  },
};
''',
  // ... other handlers
)
```

Widgets that depend on the host extension can then call `jsr.yoloit.panel.setTitle('...')` or `jsr.yoloit.board.getPanels()`.

### Async host capabilities: `jsr.hostCall`

For capabilities that need a Dart implementation (microphone, platform
services), the core ships a generic channel instead of per-host ones:

- Bootstrap: `jsr.hostCall(name, args)` → Promise (`__jsr_host_call` +
  the standard `__jsr_resolve` round trip — no engine-specific wiring).
- `JsRuntimeConfig.onHostCall(name, args)` — the host's async handler;
  resolve with any JSON-encodable value, throw to reject. Null handler →
  'hostCall is not supported by this host'.
- `JsWidgetBridge` gets it as a constructor param; all three engines
  (flutter_js, quickjs, web worker) thread `config.onHostCall` through.

Example: the web preview's `jsr.fa.asr` — `hostBootstrapJs` maps
`record/stop/transcribe` to `jsr.hostCall('asr.*')`, and
`example/lib/web_asr_handler.dart` implements the mic on the main thread
(widget JS runs in a Worker without mic access).

## Important Notes

- Keep `JsWidgetBridge` platform-agnostic. Never import `dart:io` or `dart:html` there.
- The VM engine runs on `quickjs_runtime ^0.3.3`: every successful `eval`
  auto-drains the microtask queue (promise reactions settle without manual
  pumping). The explicit `rt.executePendingJobs()` calls after evals are
  retained as defense for *failed* evals (auto-drain only runs on success).
- Do not pin `quickjs_runtime` with a 0.x caret below the current minor —
  `^0.1.0` silently held the engine on 0.1.x (no loader fix, no auto-drain,
  no conformance-verified core). Bump deliberately and read the CHANGELOG.
- Web engine uses prefixed string messages (`__jsr__`) via `postMessage`.
- The bootstrap is shared verbatim between VM and Web; do not use platform-specific globals inside it other than `sendMessage`, which both engines provide.
- Web conditional exports use `if (dart.library.js_interop)` — NOT
  `dart.library.html` (0.4.124+): `dart:html` availability was dropped
  from current web platform libraries, so `dart.library.html`
  conditionals stopped selecting web variants and web builds compiled
  the `dart:ffi` branches instead. `js_interop` holds across dart2js and
  dart2wasm. If you add a web-variant file, wire it with the
  `js_interop` condition (see `json_widget_renderer.dart` for the
  pattern) — and hosts writing their own conditional imports must do
  the same.
- Permission capabilities are: `fetch`, `storage`, `secrets`, `exec`. Reuse these before adding new ones.

## Testing the Engine

- Bridge tests: use `JsWidgetBridge` with stubbed callbacks (see `test/js_widget_bridge_test.dart`).
- VM engine integration requires a real `flutter_js` runtime; keep platform-specific engine files excluded from coverage if they cannot be run headlessly.
- Web engine requires a browser environment; test via `flutter test --platform chrome` or integration tests.
