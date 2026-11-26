# ANGLE 1B backend — architecture and spike plan

Status: M0 research complete (2026-11-09). Supersedes the EGL objections in
`docs/3d-spike.md` for the opt-in 1B path (R1 remains the default host).

## Decision log (from research; full reports in session artifacts)

1. **Embed ANGLE as plain C libraries, in-process.** ANGLE is BSD-3-clause;
   `libEGL` + `libGLESv2` are the only runtime deps. GL calls from QuickJS are
   synchronous host-function calls into C — no Dart bridge, no per-frame
   command queue to Dart, no readback. This is the exact objection that killed
   flutter_gl in 3d-spike.md, resolved: the render loop never leaves the
   process or the GPU.
2. **flutter_angle (Knightro63, MIT) is the interop recipe, not a dependency.**
   Its source proves the per-platform texture paths; it exposes GL to Dart,
   which we do not want, and ships unpinned prebuilt binaries, which pub.dev
   packaging forbids us from copying. We re-implement the macOS slice
   ourselves and credit it.
3. **macOS presentation: IOSurface → CVPixelBuffer → `FlutterTexture`.**
   Zero-copy: ANGLE (Metal backend) renders into an IOSurface via
   `EGL_ANGLE_iosurface_client_buffer`; the engine wraps the IOSurface-backed
   pixel buffer through CVMetalTextureCache/Impeller. Verified against the
   Flutter engine source (`FlutterDarwinExternalTextureMetal`).
4. **Android (later): `TextureRegistry.createSurfaceProducer`** — ANGLE
   renders into the `Surface` (`ANativeWindow`); ImageReader hardware-buffer
   path feeds Impeller Vulkan zero-copy. Do not use GL-texture-name sharing.
5. **No platform views** — their content is outside the rasterized layer
   tree, which would silently break `jsr.capture()`/goldens. **No FlutterGPU**
   import — there is no public foreign-texture API.
6. **Rust/Go analogs rejected:** mozangle's `egl` feature is Windows/D3D11
   only; Servo uses CGL on macOS (deprecated by Apple); Go has no ANGLE story
   and would add a second managed runtime to the render path.
7. **ANGLE builds:** `tool/build_angle.sh` (depot_tools → gn → autoninja,
   Metal-only args) is the reproducible source; the local spike reuses
   Electron-shipped dylibs staged under `native/angle/` (gitignored, same
   pattern as `native/quickjs/*.so`). vcpkg's maintained `angle` port is a
   Windows/Linux alternative. iOS builds need a Chromium checkout; the
   flutter_angle CocoaPods binaries are the fallback recipe for packaging.

## Frame path (target)

```text
three.js r186 (QuickJS, in-process)
  │  WebGL2 facade (JS, maps IDL semantics to packed commands)
  ▼
__jsr1b_gl(bytes) — sync host call (NativeCallable, zero-copy view)
  ▼
angle_1b C shim (native/angle/): command decoder → libGLESv2
  ▼
ANGLE (Metal) → IOSurface client buffer (EGL_ANGLE_iosurface_client_buffer)
  ▼
CVPixelBuffer (IOSurface-backed) ← copyPixelBuffer (FlutterTexture)
  ▼
Impeller composites the Texture layer; RepaintBoundary capture works
```

Dart is involved exactly twice per surface: texture registration and
`textureFrameAvailable` after `swapBuffers`. Capture (`glReadPixels` on the
current FBO/IOSurface) serves `JsThreeSurface.capture()` for tests and
deterministic export.

## M1 discoveries (verified, cost debugging time)

1. **Explicit Metal platform display is mandatory.** This ANGLE build's
   `EGL_DEFAULT_DISPLAY` selects the legacy OpenGL/CGL backend (IOSurface
   client buffers always rejected). The Metal backend requires
   `eglGetPlatformDisplayEXT(EGL_PLATFORM_ANGLE, ..., EGL_PLATFORM_ANGLE_TYPE_METAL_ANGLE)`
   with type **0x3489** (flutter_angle-era 0x3451 is stale → BAD_ATTRIBUTE).
2. **IOSurface interop = pbuffer client buffer, not window surface.**
   `eglCreateWindowSurface(iosurfaceRef)` does not exist in current ANGLE
   (window surfaces must be CALayers on macOS). The path is
   `eglCreatePbufferFromClientBuffer(EGL_IOSURFACE_ANGLE, ...)` with
   `EGL_TEXTURE_FORMAT=EGL_TEXTURE_RGBA` + `EGL_TEXTURE_TARGET=EGL_TEXTURE_2D`
   and a config carrying `EGL_BIND_TO_TEXTURE_RGBA`; the IOSurface is then
   the color attachment via FBO texture binding.
3. **Resolve `gl*` via dlsym(libGLESv2) FIRST.** This Chromium-fork ANGLE's
   `eglGetProcAddress` returns internal `GL_*` stubs for some names (its
   `glPixelStorei` entry point raises GL_INVALID_ENUM; `_glPixelStorei` ≠
   `_GL_PixelStorei`). eglGetProcAddress is the fallback, not the primary.
4. **`glFinish` after `eglSwapBuffers` is required** for the Metal command
   buffer to land in the IOSurface (texture stayed black without it).
   Kept behind a flag — replace with shared-event/CVMetalTextureCache-style
   sync or triple-buffered IOSurface rotation when frame pacing matters (M4).
5. macOS plugin registration happens in `MainFlutterWindow.swift`, not
   AppDelegate (no registrar there); `Runner.xcodeproj/project.pbxproj` must
   reference the plugin Swift file or xcodebuild ignores it.

## M2 spec — binary GL dispatch (G1) + JS WebGL2 facade

Locked ABI (already exported by the M1 shim): `int a1b_gl_dispatch(const
uint8_t* buf, int len)` — one synchronous host call per GL command, consumed
in-place (the QuickJS bytes-lane view is valid for the call duration; zero
copies). Wire name: `'__jsr1b_gl'` registered next to `__jsrSendBytes`.

**Command buffer:** `[u32 opcode][u32 argc-ish length][args...]`, little-endian,
all values inline (no pointers). String args: u32 length + UTF-8 bytes. Blob
args (texels, uniform arrays, shader source): u32 length + raw bytes. One
command per call (no batching in M2 — sync-call latency measured first,
batching is an optimization, not a protocol change).

**Object identity:** WebGL object handles ARE GL names (u32) end to end —
no translation table. `createX()` in C decodes as `glGenX(1, &name)`,
`deleteX` as `glDeleteX`, null ↔ 0.

**Return path:** `a1b_gl_dispatch` returns int64: 0 or GL error code for
void calls; scalar results packed in-band (getError, checkFramebufferStatus,
getProgramParameter...). Data-returning calls (getParameter variants,
getShaderInfoLog/Parameter string, getActive*, getUniformLocation name)
write into a per-call result scratch (fixed 4 KB) fetched by a second entry
`a1b_gl_result(uint8_t* dst, int* len)` — the facade calls it immediately
after the dispatch when it knows the call is data-returning.

**JS facade responsibilities** (pure JS, `webgl2_facade.js`, no Dart):
full `WebGL2RenderingContext` IDL surface (~550 methods) as thin packers;
object wrappers (WebGLBuffer...) holding the u32 name; the constant table
(copied once from the WebGL2 spec — verify against three r186's usage);
`canvas.getContext('webgl2', attrs)` honoring `alpha/antialias/premultiplied`
by storing them (they affect only the default framebuffer setup in C);
`getExtension` returning real extension objects where ANGLE exposes them
(`EXT_color_buffer_float` — required for the bloom HalfFloat RTs, ANGLE
Metal supports it; `OES_texture_float_linear`; `KHR_parallel_shader_compile`
may be an async stub) and `null` otherwise (never fake success — three.js
feature-detects honestly).

**ES3 note:** WebGL2 shaders are `#version 300 es`; ANGLE ES3 context accepts
them verbatim — no source rewriting in the facade. `gl_FragColor` paths only
appear in WebGL1 shaders, which r186 does not emit under WebGL2.

**Verification for M2:** boot `three.module.js` r186 in QuickJS with the
existing web-lane document/canvas shims, swap only `getContext`; render
`webgl_postprocessing_unreal_bloom` offscreen; FNV-1a hash of readPixels vs
the Playwright ground truth on `example/web/cinematic_reference.html` — the
M3 exit gate.

## Integration points (repo anchors)

- Opt-in selection: `JsRuntimeConfig.threeHost` — 1B is a `JsThreeHost`
  implementation; no new JS engine backend. R1 stays default.
- Binary lane: add a `'three.1b'` route next to `'three.r1'` in
  `JsWidgetBridge.dispatchBinary` (one name check, non-breaking).
- Surface contract: implement `JsThreeHost`/`JsThreeSurface` semantics from
  `lib/src/renderer/nodes/three/js_three_host.dart` (resize, capture,
  dispose, diagnostics).
- JS bundle: the web-lane document/canvas facades in
  `tool/three/src/*.js` are reused; only `canvas.getContext('webgl2')`
  becomes the 1B facade.

## Milestones

- **M0 ✅** Research; ANGLE dylibs staged; **source build verified** — pinned
  ANGLE main @ `9c6a64c9` (2026-11-08), Metal-only static release arm64 via
  `tool/build_angle.sh` (12m55s, 3725 steps) → `libGLESv2` 17 MB / 1769
  exports + `libEGL` 115 exports. Gotchas: Xcode Metal Toolchain component
  required (`xcodebuild -downloadComponent MetalToolchain`, one-time, 839 MB
  system asset); siso prints `BUILD_DONE` even on failure — grep for
  `Build Succeeded`. Spike smoke runs against staged Electron dylibs.
- **M1 ✅** C shim + macOS `FlutterTexture` plugin + GLES triangle from pure C
  into a Flutter `Texture` widget. ANGLE 2.1.25848 Metal on Apple M5 Pro,
  IOSurface client-buffer fast path, deterministic FNV `0x08042974`, live app
  presents via Impeller. Discoveries in §M1 discoveries above.
- **M2 ✅** G1 protocol + WebGL2 facade. `tool/three/webgl2_g1_methods.json`
  (224 methods) → `tool/three/build_1b_bindings.py` → `native/angle/gen/
  g1_tables.h` + `tool/three/gen/g1_packer.js` (byte-deterministic regen).
  Decoder ≡ direct GL bit-for-bit (`0x08042974`); three.js r186 renders a
  deterministic 3-frame + RT-ping-pong scene through the facade (60 distinct
  methods, 408 commands, zero stub hits, byte-identical traces across runs).
  Facade gotchas: quickjs_runtime bytes-lane swallows callback exceptions
  (silent drops — log registration failures and guard callbacks); base64
  alphabet literals may hit secret scrubbers (build programmatically); ESM
  bundles need per-file IIFE wrapping + `globalThis` bridge (plain concat
  collides on minified names). Packer contract pitfall: `blob()` must accept
  plain JS arrays (GLenum[]) — three.js `drawBuffers([COLOR_ATTACHMENT0])`
  silently became an empty blob → zero draw buffers → all user-FBO rendering
  discarded with no GL error (found in M3, fixed 2026-11-09).
- **M3 ✅** Real-execution harness `tool/three/run_1b_render.dart` runs the
  full stack (three.js → facade → packer → FFI → C decoder → ANGLE,
  ~350 dispatch calls/frame, deterministic hashes).
  **Black-frame root cause found and fixed (2026-11-09): the packer's
  `blob()` dropped plain JS arrays — three.js `gl.drawBuffers([COLOR_ATTACHMENT0])`
  (sent on every `setRenderTarget`) went over the wire as an EMPTY blob →
  `glDrawBuffers(0, NULL)` → zero draw buffers → all user-FBO rendering
  silently discarded (FBO still COMPLETE, getError 0). Bisect chain that
  proved it: raw-G1 clear/draw/readback into a user FBO all work; wire
  bytes identical to hand-built; raw C through the shim proves ANGLE
  innocent; the three-RT wire showed `drawBuffers` with a 0-length blob.
  Fix: `Array.isArray` branch in `blob()` (tool/three/build_1b_bindings.py,
  regen `g1_packer.js`). Harness now renders: hash `0x5f1b7376`,
  deterministic ×2, center=(54,67,193,255). Exit gate: 1B hash === Chrome
  WebGL2 ground-truth hash (`tool/three/ref_1b_scene.cjs`,
  `tool/three/compare_1b_render.sh`). **ACCEPTED 2026-11-09:
  `hash trio: 1B_run1=0x5f1b7376 1B_run2=0x5f1b7376 WEB=0x5f1b7376`,
  `TIER: PASS_IDENTICAL`** — the full 1B stack renders bit-identically to
  real Chrome WebGL2 (same ANGLE Metal GPU backend), verified by two
  independent compare runs.
- **Defects fixed AT SOURCE (2026-11-09), interpositions removed:** [A]
  `wclass().wrap(0)` returned null → new `wrapValid()` used by
  getUniformLocation (GL name 0 is a valid uniform location); [B] decoder
  `g_UniformMatrix*fv` count/transpose swap → fixed in
  `webgl2_g1_methods.json` C-strings (count = a2_len/elemBytes, transpose =
  a1), `g1_tables.h` regenerated, shim rebuilt. `m3FacadePatch` deleted from
  `run_1b_render.dart` and `angle1b_three_spike.dart`; acceptance RE-RUN
  without interpositions: `hash trio 0x5f1b7376 ×3, PASS_IDENTICAL` — the
  source fixes are behaviorally exact.
- **M4-preview ✅** Live animated spike `example/lib/angle1b_three_spike.dart`
  (QuickJS three.js r186 per-frame through the 1B stack into a running
  macOS Flutter window, FPS/jsMs/wire meter, RT-fx + 64-cube + glFinish
  toggles). Measured on Apple M5 Pro (release): ~990 FPS (1 cube, 3
  wire calls/frame — three.js resends only changed state), ~860 FPS
  (1 cube + RT ping-pong), ~300 FPS (64 cubes + RT + glFinish ON) /
  ~450 FPS (glFinish OFF — the post-swap glFinish costs ~1 ms/frame).
  120 Hz budget is 8.3 ms; the stack spends 0.3–3.2 ms in JS+wire — no
  performance work needed before M4.

## Blocker fixes (phase 1+2)

Corpus harness + decoder fixes from the M4 final-report blocker list
(2026-11-09). Layer for each fix noted; no M3 scene-path semantics touched.

1. **Asset lane (multi-MB GLB/HDR) — FIXED, root cause was NOT a string
   ceiling.** A direct repro (20.6 MB base64 host return through the
   QuickJS bridge) round-trips intact; chunking was not needed. Real
   causes, all in harness glue: (a) corpus Dart host fns did
   `jsonDecode(argsJson) as List` but `qjs_dispatch` marshals a single
   string arg as a bare JSON string → every asset host call threw
   (swallowed by the bridge → `undefined` → "asset not found"); fixed with
   a both-shapes `hostArgAt` parser. (b) the 1B prelude `JSON.parse`d host
   returns that the bridge already delivers parsed → `__parseHostJson`
   handles both. (c) palette PNGs: package:image `getBytes(rgba)` returns
   the 1-byte/px index buffer → manual RGBA expansion fallback in the
   decode host. Web-ref side (same "asset lane"): bundler now emits a
   stable absolute `import_meta.url` (DRACOLoader `new URL` init),
   `__assetMap`/`__assetFiles` are actually injected into the page, and
   native decode paths (native `Blob`, native `createImageBitmap`, real
   `Image` fed by data: URL) replaced stub objects Chrome's texImage2D
   rejects. keyframes (15.5 MB GLB + 4 textures) now renders both sides.
2. **Web-ref harness — FIXED.** appendChild 'not of type Node' was the
   real `document.body` rejecting the plain-object `stats.dom`; corpus_dom
   now shadows `document.body` web-side with the same tolerant stub the 1B
   side uses. Also fixed: the readback canvas stash grabbed the first
   canvas ever created (shadowmap's 2×2 CanvasTexture canvas) — now
   stashed on first `webgl2` context creation. Shadowmap-pointlight
   reaches a rendered comparison on BOTH sides (99.94% match).
3. **AudioContext — NOT NEEDED (recorded decision).** After the asset-lane
   fixes, toon/bloom render with zero errors; no starter-corpus scene
   requires AudioContext, so no stub was added (keeps the shim surface
   minimal). Related harness gap fixed instead: on-demand scenes that
   never call setAnimationLoop (texture-rotation) now warn instead of
   error, with a draw-activity gate on both sides (1B: zero g1 dispatches
   → strictFailure; web: wrapped draw* counter) so a never-drew scene
   still fails loudly.
4. **Decoder defect found + fixed (gates for 4a/4b):** `g1_get_extension`
   matched extension names with a word-boundary check that rejected
   ES3 `GetStringi` spellings — ANGLE returns GL_-prefixed names, so
   EVERY unprefixed lookup failed (only exact "GL_…" queries hit).
   Tokenized both-spellings matcher in `angle_1b_dispatch.c`; shim
   rebuilt. `getExtension('EXT_texture_filter_anisotropic')` now returns
   the honest C-side bit (max aniso 16 queryable on ANGLE Metal). Also
   swapped the prebuilt ANGLE dylibs for the local tree build
   (9c6a64c, ad-hoc re-signed in place — the repo-path copy must be
   re-signed or syspolicyd SIGKILLs it on load).

## Corpus acceptance — F2d (2026-11-26)

The F2d acceptance run supersedes the M4-preview investigation notes above:
`three-buffergeometry-instancing` now compares **bit-identically** (the M2/M3
decoder fixes landed after the old note), and the starter corpus below is the
gated acceptance set.

### Starter corpus (issue #7 AC5 named scenes + fixtures)

Driver: `tool/three/corpus_1b.sh` (default ids = the ten AC5 named scenes +
`fixture-rawgl` + `fixture-readback`). Acceptance tiers are pinned in
`tool/three/corpus/accepted_tiers.json`; the corpus script exits non-zero when
a gated id measures outside its accepted tier or the E2E-WEB direct probe
fails. Measured 2026-11-26, Apple M4 Pro, 1B = ANGLE Metal `9c6a64c9` vs web
= Chrome 133 (Chromium 133.0.6943.16) real WebGL2, both 320x240:

| id | upstream scene | measured | accepted | note |
|---|---|---|---|---|
| three-loader-gltf | webgl_loader_gltf (DamagedHelmet + UltraHDR env) | PASS_IDENTICAL | exact | Khronos sample assets served through the flattened-name asset cache |
| three-animation-keyframes | webgl_animation_keyframes | PASS_TOLERANCE | tolerance | 99.9896 %, 8/76800 px, maxDelta 4 — texture decode LSB |
| three-animation-skinning-morph | webgl_animation_skinning_morph | PASS_TOLERANCE | tolerance | 0 differing px, maxDelta 1 |
| three-buffergeometry-instancing | webgl_buffergeometry_instancing | PASS_IDENTICAL | exact | the old M4 4a suspect is fixed |
| three-shadowmap | webgl_shadowmap | FAIL(diff) | documented-limit | animated-caster frame-phase offset (below) |
| three-shader | webgl_shader | PASS_IDENTICAL | exact | |
| three-shader-lava | webgl_shader_lava | PASS_TOLERANCE | tolerance | 99.2148 %, noise-texture decode LSB |
| three-multiple-rendertargets | webgl_multiple_rendertargets | PASS_TOLERANCE | tolerance | 99.9961 %, MRT resolve LSB |
| three-depth-texture | webgl_depth_texture | PASS_IDENTICAL | exact | |
| three-postprocessing-unreal-bloom | webgl_postprocessing_unreal_bloom | PASS_IDENTICAL | exact | the AC1/P0 named post scene is bit-identical |
| fixture-rawgl | AC2 raw-GL fixture (gl_VertexID triangle, no three.js) | PASS_IDENTICAL | exact | raw program/shader/draw state through the facade |
| fixture-readback | AC6 readback fixture (in-scene readPixels drawn back) | PASS_IDENTICAL | exact | the scratch-lane readback returns byte-identical data |

Summary: 7 exact / 4 tolerance / 1 documented limit, `E2E_WEB_DIRECT
direct_fail=0` on every web leg.

**three-shadowmap documented limit.** The five animated GLTF casters settle
their load callbacks at different interleavings against the pinned frame loop
on the two legs, so the captured frame shows them at deterministic but
phase-shifted positions (hash pair stable across runs and across harness
fixes; both sides render the scene correctly — see
`/tmp/a1b_corpus/three-shadowmap/1b.png` vs `web.png` in any run). The static
shadow scene `three-shadowmap-pointlight` compares at 99.94 %, which pins the
difference to the animated-caster phase, not to shadow-map semantics.

### Harness fixes landed with this acceptance (corpus lane only)

No `lib/` behavior change; all fixes are `tool/three/corpus` harness glue:

1. **Web `blob:` textures (root cause of the tab crashes).** GLTFLoader
   materializes embedded textures via `URL.createObjectURL` over the corpus
   Blob stub; Chrome's real `createObjectURL` rejects stub Blobs, every
   texture load rejected, the per-frame retry flooded `__corpusErrors`
   (10k+ entries with stacks) and the status `JSON.stringify` blew the V8
   heap — `Target crashed` on `three-animation-multiple`,
   `three-animation-skinning-blending`, `three-loader-gltf`. Fix: stub Blobs
   route through the corpus registry (native Blobs pass through untouched)
   and the web img stub serves `blob:` bytes as data: URLs, exactly like the
   1B branch.
2. **Web Image loads tracked in the settle gate.** The web img stub now
   tracks asset read + native decode + the load/error event via
   `__corpusTrackAsync`, so scenes render their first pinned frame with the
   same settled state as the 1B side.
3. **Error-log cap.** `__corpusErrors` truncates at 200 entries with a
   marker, keeping the failure loud without multi-GB JSON.
4. **Browser channel override** (`JSR_WEBGL_REF_CHANNEL`, default
   `chrome` for CI; `chromium` where no Chrome install exists) and
   `JSR_PLAYWRIGHT_PATH` for the Playwright module location.
5. **Khronos sample-asset seeding.** `three-loader-gltf` fetches
   `model-index.json` + `DamagedHelmet.glb` from the glTF-Sample-Assets repo
   (outside the pinned three.js tree); the corpus seeds both files into the
   flattened-name cache so both legs serve byte-identical content.
6. **E2E-WEB direct probe.** Every web leg reports
   `direct: { nativeContext, no1bLane, barePage }`; the corpus script fails a
   scene whose web leg was not a real WebGL2 context on a bare page (no
   ANGLE lane, no Dart GL proxy) — AC15 evidence per scene.

### Per-GPU tolerance table

The 1B and web legs of every corpus run execute on the SAME machine and GPU
family (both through ANGLE Metal on Apple silicon; Chrome's WebGL is itself
ANGLE Metal on macOS), so the tier comparison is same-GPU by construction:

| GPU / backend pair | exact rule | tolerance rule | observed on the starter corpus |
|---|---|---|---|
| Apple silicon (M-series) — ANGLE Metal `9c6a64c9` (1B) vs ANGLE Metal via Chrome 133 (web) | identical FNV-1a over the 320x240 RGBA readback; required for the pure-geometry, shader, depth-texture and post scenes | >= 99.0 % of px within d<=2 per RGB channel (alpha excluded); covers image-decoder LSB (package:image on Dart vs Chrome native decode) and MRT/resolve rounding | 7/12 exact, 4/12 tolerance (worst 99.2148 %), 1 phase-offset limit |
| Other Apple generations (CI macos-15 M1) | same rule; the pair is same-GPU per run, so exact tiers are expected to transfer | same; decode-LSB scenes may shift px counts but stay in band | verified on CI run of the head (see PR) |
| x86_64 + ANGLE Vulkan/GLES (not in this corpus) | not measured | documented here as out of scope for F2d | — |

A measured FAIL that is not the shadowmap phase offset is a gate failure, on
any GPU.

### Full-sweep triage (303 prepared examples, F2d)

The M4 report table was never committed; the sweep below regenerates the
triage from the CURRENT tree (shards over all 303 prepared examples,
2026-11-26, with every corpus harness fix of this segment applied):

**PASS 224 (100 exact + 124 tolerance) — 79 classified documented limits.**
Every FAIL/SKIP is triaged below as a documented limit with its reason; the
starter corpus (above) is the CI-gated subset.

Fixed since the M4 report (now passing):

- `three-buffergeometry-instancing` — **PASS_IDENTICAL** (the M4 4a suspect:
  fixed by the M2/M3 decoder lands).
- `three-buffergeometry-lines` — **PASS_IDENTICAL** (the M4 4b suspect).
- `three-loader-gltf`, `three-animation-multiple` (99.9974 %),
  `three-animation-skinning-blending` (99.9805 %) — crashed the reference tab
  before the blob:-registry / settle-gate harness fixes of this segment.

Documented limits (79 examples, grouped by class):

| Class | Count | Reason (applies to every id in the class) |
|---|---|---|
| Prepare converted `.hdr` textures to JPEG | 10 | The prepare pipeline materialized HDR environment maps as `.jpg`-suffixed JPEG; three's HDRLoader parse then rejects the bytes ("no header found"). Asset-lane work belongs to the prepare pipeline, not the corpus harness. |
| Corpus asset lane: remote/prepare-missed assets | 13 | The scene fetches assets outside the pinned three.js tree (Khronos Sponza, cdn.needle.tools, cdn.jsdelivr rhino3dm) or the prepare missed cube-face/LUT/SMAA textures (`SwedishRoyalCastle`, `Bridge2`, `pisaHDR`, `transition1.png`). Seeding is per-scene work in the asset cache. |
| Texture-container parse on converted bytes | 5 | `three-loader-texture-dds`, `-ktx2`, `-pvrtc`, `-vrml`, `three-postprocessing-3dlut`: the loaders validate magic numbers/versions against bytes the prepare pipeline stored in converted or placeholder form. |
| Unpublished/absent npm addon packages | 5 | `three-batch-lod-bvh` (@three.ez/simplify-geometry bundle error), `three-modifier-subdivision` (three-subdivide), `three-postprocessing-godrays` (`goodrays` is not published to npm), `three-renderer-pathtracer` (three-gpu-pathtracer), `three-morphtargets-webcam` (top-level await + webcam). Corpus bundling can only resolve published packages. |
| Device-dependent input | 1 | `three-materials-video-webcam`: the harness provides no camera device (`MediaDevices` absent by design — no device evidence is claimed). |
| Engine/API depth of the QuickJS harness | 7 | `three-loader-ifc` (wasm), `three-loader-3dtiles` (DOMException), `three-materials-texture-html` (URLSearchParams), `three-loader-fbx` / `three-performance` / `three-loader-gltf-progressive-lod` (DOM stub depth), `three-clipculldistance` / `three-simple-gi` (tick-time errors under investigation in the harness, not the GL path). |
| Multi-canvas / OffscreenCanvas scenes | 2 | `three-multiple-elements`, `three-worker-offscreencanvas`: the 1B harness owns ONE ANGLE surface, so scenes that fan out into several canvases cannot be captured faithfully (blank or partial capture) — a harness boundary, not a renderer defect. |
| On-demand scenes that never draw under the pinned harness | 10 | `three-gpgpu-water`, `three-lightprobe`, `three-materials-cubemap-mipmaps`, `three-materials-cubemap-render-to-mipmaps`, `three-mesh-batch`, `three-pmrem-cubemap`, `three-test-memory2`, `three-texture2darray-compressed`, `three-texture2darray-layerupdate`, `three-tsl-clearcoat`: the web leg never issues a draw without real user interaction / device pixel paths; the draw-activity gate fails them loudly. |
| Pixel divergence beyond the tolerance band | 22 | `three-camera-logarithmicdepthbuffer`, `three-geometries`, `three-geometry-nurbs`, `three-lights-physical`, `three-loader-gltf-instancing`, `three-loader-texture-ktx/-tga/-tiff`, `three-materials-bumpmap`, `three-materials-texture-anisotropy/-filters/-manualmipmap/-rotation`, `three-modifier-simplifier`, `three-postprocessing-advanced/-masking/-taa`, `three-reversed-depth-buffer`, `three-shaders-ocean`, `three-shadowmap` (phase offset, starter table), `three-test-wide-gamut`, `three-volume-perlin`: engine-depth render differences (log-depth encoding, temporal accumulation, wide-gamut color, texture-filtering LSB beyond the d<=2/99 % band, NURBS float paths). Each is a named engine-depth gap for later corpus lanes — never a silent pass. |

The classes are intentionally narrow: everything not listed compares within
the documented per-GPU tolerance (above) or bit-identically.

### E2E-WEB direct-web proof (AC15)

Every corpus web leg runs the SAME scene bundle in a bare Playwright-driven
Chrome page: `canvas.getContext('webgl2')` returns the browser's real
`WebGL2RenderingContext` (probe-verified per scene), the page has no
`__jsr1b_gl` lane and never loads a Dart runtime (probe: `barePage`), and
there is no ANGLE dylib in the process. The production web host
(`flutter test --platform chrome test/web_three_host_web_test.dart`, quality
job) covers the mount path; `REG-WEB-DIRECT-1` stays closed.

### PERF-2 gate — estimator and budget (F2d tail, 2026-11-26)

The plan fixes the assertion: flush count <= 1 and p95 <= 4 ms on the macOS
host that runs the bench (`kP95BudgetMs` stays 4.0). Three interim
estimators introduced during F2d under CI runner noise — a bounded retry
across processes (`b152930c`), the smallest single-window p95 across
attempts (`492b35de`, `BENCH_P95_MIN_WINDOW_MS`), and a thread-CPU-time
gate (`419fda17`) — were removed. The first two were best-of-N picks (a
real regression passes when one quiet attempt stays under the budget); the
third was falsified by measurement: thread CPU time excludes scheduler
preemption but NOT the speed of the core the thread runs on, and the
runner pool's instances swing between quiet and CPU-contended states.

**The gate (choice (b) of the F2d tail assignment): `flushes <= 1` and the
MEDIAN window WALL p95 <= calibrated budget**, where

```
budget = kP95BudgetMs * refHere / kRefCalibrationMs
```

- `refHere` — measured at bench start: the calibration reference is 5 runs
  x 100 frames of the no-draw workload (`__refFrame`: clear + 500 void GL
  calls through the same QuickJS -> facade -> packer -> FFI -> ANGLE path
  as a bench frame, no draw work); per run the median frame wall time; the
  reference is the MINIMUM of the 5 run medians (a minimum across
  calibration runs is legitimate — it estimates what this host instance can
  do right now; the GATE measurement itself is never repeated, no
  best-of-N).
- `kRefCalibrationMs` — the recorded anchor: the same reference measured on
  a macOS host where the budget demonstrably holds with wide margin.
  Recorded 2026-11-26: **Apple M4 Pro (local) 0.933 ms** (measured frame
  p95 0.87-0.92 ms — 4.3x under the budget). The CI macos-15 pool currently
  serves CPU-contended instances — `BENCH_REF_MS` 1.635 (run 45734063417),
  1.753 and 1.772 (two legs of run 45735839228) — and anchoring on a
  contended sample would normalize the contention (budget 4.0 on a
  contended instance fails the code for the host being slow), while
  waiting for a quiet instance to anchor would be cherry-picking the
  anchor. The anchor therefore stays at the recorded local measurement;
  the gate's sensitivity lives in the p95-to-reference ratio, which is
  host-state independent.

Everything else about the measurement is unchanged: one warm-up window
(100 frames), three 300-frame measurement windows, median estimator, one
`BENCH_WINDOW` line per window (wall AND thread-CPU percentiles, CPU kept
printed as information), dedicated bench process as the measurement of
record, `clock_gettime_nsec_np(CLOCK_THREAD_CPUTIME_ID)` = 16 per the
Darwin SDK header with a boot sanity probe.

Measured window classes (all `flushes/frame = 1`, same commit family):

| Host instance | wall p50 / p95 (median over windows) | cpu p50 / p95 | verdict under the gates tried |
|---|---|---|---|
| Local Apple M4 Pro | 0.87 / 0.90-0.92 | 0.87 / 0.90 | green under every variant (fixed 4.0, CPU gate, calibrated) |
| CI macos-15, quiet instance (run 45729567699) | 1.33 / 1.49 | 1.33 / 1.49 | green; cpu == wall within 0.02 ms per window |
| CI macos-15, contended instance (run 45731410438, PERF-2 subprocess bench) | p50 1.52-1.85 / per-window p95 3.905-5.584, median 5.215 | p50 1.52-1.74 / per-window p95 3.643-4.856, median 4.769 | CPU gate FAILED at 4.769 > 4.0 — the falsification that selected choice (b); a throttled VM core takes more CPU nanoseconds for the same instructions |
| CI macos-15, contended instance (run 45734063417, calibrated gate) | median window p95 4.321, REF 1.635, budget 7.010 | p95 cpu 3.180 | PASS (4.321 <= 7.010), flushes 1 |
| CI macos-15, contended instance (run 45735839228, calibrated gate, two bench legs) | median window p95 4.492 / 6.406, REF 1.753 / 1.772, budget 7.516 / 7.597 | p95 cpu 4.489 / 5.483 | PASS both legs (p95 <= budget), flushes 1 |

Sensitivity: with the recorded anchor, the calibrated budget equals the
plan's 4.0 ms on the host class the budget was measured against (reference
0.933 ms) and scales with every instance's own reference measurement on
the CI pool. A real draw-path regression raises the measured p95 while the
no-draw reference stays put, so the ratio — and with it the gate — still
fails. The gate never re-measures because a number came out above the
budget.

## Android and iOS hosts (F3, merged 2026-11-26)

F3 lands the 1B backend on Android and iOS: ANGLE libraries from the pin
(Android: Vulkan; iOS: Metal), the platform shims (`libangle_1b.so` /
`libangle_1b.dylib`), a texture plugin in the example app, the
`e2e_android_*` / `e2e_ios_*` device suites, the `angle-android` /
`angle-ios` CI jobs and the SIZE-ANDROID-1 / SIZE-IOS-1 reports.

### Presentation paths (decision 4)

Android — ANGLE Vulkan through an EGL window surface on the plugin's
producer surface:

```text
three.js r186 (QuickJS) -> WebGL2 facade -> G1 bytes -> a1b_gl_dispatch
  -> angle_1b_android.c (EGL window surface) -> ANGLE (Vulkan)
  -> ANativeWindow (the plugin's SurfaceTextureProducer Surface)
  -> Flutter Texture (textureId) -> Impeller composites; capture = glReadPixels
```

The ANGLE window surface needs the ANativeWindow pointer before it exists,
so the Android plugin creates the producer surface FIRST and returns
`{textureId, nativeWindow}`; Dart binds it with `a1b_set_native_window(ptr)`
and then calls `a1b_create_surface(w, h, out)`. The shim owns the window
reference (acquired in the JNI bridge via `ANativeWindow_fromSurface`,
released on destroy/shutdown).

iOS — ANGLE Metal renders into an IOSurface
(`EGL_ANGLE_iosurface_client_buffer`); the Swift plugin wraps it as a
Metal-compatible `CVPixelBuffer` and serves it through `FlutterTexture`.
No WebView, no platform view, no GL texture-name sharing on either host.

### Plugin contracts (`angle_1b` channel; both mirror `example/macos/Runner/Angle1bTexturePlugin.swift`)

Android (Kotlin, `dev.fa1.angle1b.Angle1bTexturePlugin` + `Angle1bJni`,
registered in `MainActivity.configureFlutterEngine`):

| Method | Args | Result |
|---|---|---|
| `apiLevel` | — | `int` SDK_INT (probe (d) input, ADR-0003) |
| `createSurface` | `[width, height]` | `{textureId: int64, nativeWindow: int64}` |
| `destroySurface` | `[textureId]` | nil (releases the producer; the shim already released its window ref) |
| `frameAvailable` | `[textureId]` | nil (`scheduleFrame()` after every shim swap) |

iOS (Swift, `example/ios/Runner/Angle1bTexturePlugin.swift`, registered in
`AppDelegate.didInitializeImplicitFlutterEngine`):

| Method | Args | Result |
|---|---|---|
| `createSurface` | `[iosurfaceId, width, height]` | `{textureId: int64, iosurfaceId: int64}` (wraps the IOSurface with `CVPixelBufferCreateWithIOSurface`, Metal-compatible, registers a `FlutterTexture`) |
| `destroySurface` | `[textureId]` | nil |
| `frameAvailable` | `[textureId]` | nil |
| `debugHierarchy` | — | `[String]` class names of the key window's view tree (REG-NOWEBVIEW-1 evidence; read-only, capped at 512 views) |

The iPhoneOS SDK ships no public IOSurface header/clang module (CI run
45753628959), so the plugin declares `IOSurfaceLookup` and
`CVPixelBufferCreateWithIOSurface` directly (`@_silgen_name`, ABI-stable
public API since iOS 11); everything else is line-identical to macOS.
Dart side: the `F3a Android` and `F3b iOS` blocks in
`packages/jsr_three_angle/lib/src/angle_three_backend.dart` (android
library candidate `libangle_1b.so` from the APK native lib dir;
iOS candidate `@rpath/libangle_1b.dylib` first, resolved through the
Runner's `@executable_path/Frameworks` runpath) and
`angle_three_backend_ffi.dart` (lazy android-only `setNativeWindow`).

### ANGLE library naming and staging

Android: the GN args of `tool/three/pins/angle_pin.json` carry
`angle_libs_suffix="_angle"` (staged as `libEGL_angle.so` /
`libGLESv2_angle.so`). The suffix is baked into ANGLE's
`ANGLE_GLESV2_LIBRARY_NAME` dispatch lookup, so `libEGL_angle.so` finds
`libGLESv2_angle.so` in its own module directory — and the unique sonames
avoid the bionic soname dedup that would otherwise return the `/system`
libEGL.so every Android process already has loaded. The shim dlopens the
renamed files next to itself (dladdr), then falls back to bare sonames.
GN-args amendment note: the F2 pin record did not yet contain
`angle_libs_suffix`; it was verified by the F3a Android build and added to
the three `android-*` entries of the pin (the macOS/iOS entries are
untouched).

iOS: GN's `ios_framework_bundle` emits `libEGL.framework/libEGL` for
`target_os=ios`; the `tool/build_angle.sh` iOS block stages the Mach-O
binaries as flat dylibs with `@rpath/<name>.dylib` ids and ad-hoc re-sign,
so ANGLE's libEGL resolves libGLESv2 through its own module directory (the
macOS host layout). The device-only embed build phase in
`example/ios/Runner.xcodeproj/project.pbxproj` ("Embed ANGLE 1B dylibs")
copies the three staged dylibs into the app's `Frameworks/`, re-ids them
and ad-hoc signs them; simulator builds skip the phase entirely and never
embed or load the device-slice dylibs (their 1B probe reports the absence
and the host falls back to r1, ADR-0003 — recorded by CI). The shim
`libangle_1b.dylib` is built by
`packages/jsr_three_angle/native/angle/build_ios.sh` for the arm64 device
slice (`-isysroot $(xcrun -sdk iphoneos --show-sdk-path) -arch arm64
-mios-version-min=15.0`) and appended to the staged `SHA256SUMS`
(REG-SUPPLY-1).

### Build (reproducible, pinned)

Android (Linux-only per DevSetupAndroid.md; CI is the executor):

```bash
tool/build_angle.sh --platform android-{arm64,armv7,x86_64} \
  --out packages/jsr_three_angle/native/angle/out/<id>
```

The `F3a Android` block runs the full pipeline: depot_tools bootstrap,
pinned checkout, `target_os = ['android']` + `gclient sync` (the NDK ships
from ANGLE's DEPS), gn gen with the pin args verbatim, ninja, NDK shim
build (`angle_1b_android.c` + shared dispatch + demo, `-landroid -llog`),
SHA256 of every output.

iOS (Xcode + Metal toolchain required):

```bash
bash tool/build_angle.sh --platform ios-arm64 \
  --out packages/jsr_three_angle/native/angle/out/ios-arm64
bash packages/jsr_three_angle/native/angle/build_ios.sh \
  packages/jsr_three_angle/native/angle/out/ios-arm64
```

### Device suites (exact commands)

Android:

```bash
bash tool/build_angle.sh --platform android-arm64 --out packages/jsr_three_angle/native/angle/out/android-arm64
bash tool/stage_angle_android.sh                      # stage jniLibs for the ABIs that exist
cd example && flutter pub get
flutter test ../test/angle1b/e2e_android_1b_test.dart -d <device>
```

Tests (all skipped on non-Android hosts): `E2E-ANDROID-PLUGIN` (probe (d)),
`E2E-ANDROID-PROBE` (ANGLE identity), `E2E-ANDROID-RENDER` (two-tone
reference image into the plugin texture), `E2E-ANDROID-READBACK`,
`E2E-ANDROID-RESIZE`, `E2E-ANDROID-DPR`, `E2E-ANDROID-NOWEBVIEW`
(REG-NOWEBVIEW-1). A GPU-less host records the probe failure as the skip
reason — the suite never fakes success.

iOS (`flutter test` attaches to a device only for files under
`integration_test/`; `example/integration_test/e2e_ios.dart` wraps the
canonical `test/angle1b/e2e_ios_scene_test.dart` — 3 tests: scene render +
capture non-blank, resize + DPR, REG-NOWEBVIEW-1):

```bash
# Simulator build + run (the angle-ios CI job does exactly this):
cd example && flutter pub get
flutter build ios --simulator --debug
UDID=$(xcrun simctl list devices available | grep -m1 'iPhone' \
  | sed -E 's/.*\(([A-F0-9-]{36})\).*/\1/')
xcrun simctl boot "$UDID" && xcrun simctl bootstatus "$UDID" -b
flutter test integration_test/e2e_ios.dart -d "$UDID"

# Physical device (USB, code signing identity required; outputs are NOT
# claimed in this run — plan §9):
cd example && flutter devices                       # find the device id
flutter test ../test/angle1b/e2e_ios_scene_test.dart -d <device-id>
```

A missing GPU backend on any device fails loudly with the machine-readable
marker `ANGLE_1B_UNAVAILABLE: <reason>` (the CI job greps it); it is never
a silent skip.

### CI

`angle-android` (ubuntu, matrix android-arm64/armv7/x86_64, `actions/cache`
keyed by the pin hash + ABI, artifact per ABI, shim always rebuilt from
committed sources) and `angle-android-apk` (artifact integrity check,
`tool/stage_angle_android.sh`, `flutter build apk --debug` with 1B staged,
`tool/angle_size_android.sh --verify` = SIZE-ANDROID-1, then ONE bounded
emulator attempt: API 30 x86_64, 20-minute boot bound, 20-minute suite
bound, result or the recorded reason into the step summary + artifact
`angle-android-emulator`). `angle-ios` (macos-15): cached ANGLE
ios-arm64 build, simulator compile check, `flutter build ios --release
--no-codesign` as the embed-phase proof, the SIZE-IOS-1 report, then ONE
bounded, recorded simulator attempt (15-minute bound, result or reason to
the step summary and the `angle-ios-size-and-simulator-attempt` artifact).
A bounded, recorded attempt keeps the job green; the emulator/simulator
result is host evidence, never a device claim (plan section 9).

### Size reports — the budget verdicts (CI-measured)

`tool/angle_size_android.sh` (SIZE-ANDROID-1) and the `angle-ios` report
(SIZE-IOS-1) print, per ABI and library: raw/stripped size, gzip size,
architecture, minimum load-segment alignment (arm64 requires 16 KiB —
Android 15 page size, the shim is linked with `-Wl,-z,max-page-size=16384`;
armv7/x86_64 >= 4 KiB; Mach-O `LC_SEGMENT_64` `vmaddr` and `fileoff`
multiples of 16384 with the trailing-`__LINKEDIT` vmsize exemption), no
debug sections (no debug slice), no Mach-O on Android / no simulator slice
on iOS, and no SwiftShader backend markers (the check fails on
`vk_swiftshader*` ICD/loader names — the ANGLE device-type and extension
literals are always compiled in and are not a backend). Structural checks
are hard gates; a violation fails the job — nothing is re-measured or
excluded.

| Platform / ABI | Installed (stripped) | gzip | Budget 10 / 5 MiB | Verdict |
|---|---|---|---|---|
| macos-arm64 | 11.10 MiB (11634336 B) | 4.28 MiB | — | recorded, not gated (run 45737838411) |
| android-arm64 | 5.99 MiB | 2.36 MiB | within | SIZE-ANDROID-1 PASS (16 KiB shim) |
| android-armv7 | 3.77 MiB | 2.01 MiB | within | SIZE-ANDROID-1 PASS |
| android-x86_64 | 6.21 MiB | 2.47 MiB | within | SIZE-ANDROID-1 PASS |
| ios-arm64 | 8.84 MiB | 3.37 MiB | within | SIZE-IOS-1 PASS (libEGL 94096 + libGLESv2 9029344 + libangle_1b 151120 stripped) |

macOS stays above the 10 MiB installed budget: the plan's size ids are
`SIZE-ANDROID-1` and `SIZE-IOS-1`, so the macOS number is reported, not
gated. Every number in this table is binary MiB (bytes / 1048576); earlier
F2-era notes quoting the macOS row as "11.63 MiB" used decimal megabytes
for the same 11634336 bytes. Reducing the ANGLE payload (symbol-visibility
trimming, `angle_` feature pruning) is packaging work that may follow the
merge; it is not a gate change.

### Recorded device-suite outcomes (CI, honest record)

- Android emulator attempt: boot failed within the 20-minute bound — the
  API 30 x86_64 image refuses `-accel off` without a hardware accelerator
  (GitHub runners have no KVM), so no emulator device evidence is
  obtainable there; the reason is recorded in the step summary and the
  `angle-android-emulator` artifact. The APK with staged 1B libraries
  builds (run 45767736521, all 8 jobs green).
- iOS simulator attempt: the suite did not execute — the app launch hung
  on the `macos-15` image runtime for both `flutter test` and `flutter
  drive` until the watchdog killed it (no install/launch output, no driver
  connection; log in the `angle-ios-size-and-simulator-attempt` artifact).
  The simulator and device builds themselves compile (plugin registers).
- Physical devices: outputs are not claimed (plan section 9).

### Bundle reproducibility

The pinned THREE bundles, the golden cinematic ESM and the example prepare
outputs are byte-reproducible on darwin-arm64 only (the builder of record,
asserted by the `quality-macos` job); on other host classes the verifiers
check the pins and report the rebuilt hashes informationally
(`docs/cinematic.md`).

## F4b — stock bloom determinism on 1B and web (issue #8, 2026-11-26)

Segment F4b runs the STOCK `webgl_postprocessing_unreal_bloom` unchanged
through the cinematic core on both lanes: offscreen targets, depth,
composer ping-pong, readback, resize and final presentation on native 1B;
the same pipeline on the direct web lane. Frame and capture semantics are
deterministic (sequential == direct seek), and a capability gap fails
before capture with a named error.

### Ids and results (all green, darwin-arm64, ANGLE dylib staged)

| ids | test file | result |
|---|---|---|
| E2E-BLOOM-1, E2E-BLOOM-2, REG-VISUAL-BLOOM | `test/angle1b/f4b_e2e_bloom_test.dart` | 3/3 |
| IT-TARGET-1, E2E-TARGET-1..4 | `test/angle1b/f4b_e2e_target_test.dart` | 5/5 |
| IT-CLOCK-1 | `test/angle1b/f4b_it_clock_test.dart` | 1/1 |
| E2E-SEEK-1..4, IT-CLOCK-2, REG-DETERMINISM | `test/angle1b/f4b_e2e_seek_test.dart` | 6/6 |
| E2E-ALPHA-1/2, REG-ALPHA | `test/angle1b/f4b_e2e_alpha_test.dart` | 3/3 |
| UT-PIPELINE-1..5 | `tool/three/test/f4b_ut_pipeline_test.js` (node chain) | green |

REG-EXISTING / REG-GATES are segment rules, not ids: the full existing
suite and every gate run in the CI jobs of the head.

### Commands

```bash
# native 1B battery (all six seek/clock/determinism tests)
flutter test test/angle1b/f4b_e2e_seek_test.dart
# the other native f4b files
flutter test test/angle1b/f4b_e2e_target_test.dart test/angle1b/f4b_it_clock_test.dart \
             test/angle1b/f4b_e2e_alpha_test.dart test/angle1b/f4b_e2e_bloom_test.dart
# web battery: 13 checks over the shared battery (cases_f4b/f4b_case_source.js)
# in a bare Playwright-driven Chrome page (real WebGL2, no ANGLE lane, no Dart proxy)
JSR_WEBGL_REF_CHANNEL=chromium bash tool/three/cases_f4b.sh   # -> F4B_SUMMARY checks=13 pass=13
# node chain (adapter, batching, facade, pipeline, presets, verify gate)
npm --prefix tool/three test
# corpus acceptance of the named post scene
bash tool/three/corpus_1b.sh   # id three-postprocessing-unreal-bloom
```

### Numbers and tiers

Stock `webgl_postprocessing_unreal_bloom`, 320x240, Apple M4 Pro:

- Corpus acceptance: **PASS_IDENTICAL, hash `8444f8b9`, 100.0000 % of px,
  accepted tier exact** on the macOS native 1B leg; the web leg is exact
  too (`status_web.json` `direct{barePage,no1bLane,nativeContext}` all
  true — AC15 per scene).
- The web battery (`cases_f4b.sh`, 13/13) and the native 1B battery are
  **bit-identical on every hash**: sequential, direct, reversed, repeated,
  frozen, host-delay and present9 legs produce the same hashes on both
  lanes — the strongest REG-VISUAL evidence the F4 row carries.
- Resize round trip (E2E-TARGET-1, and battery check `resizeRoundTrip`):
  smaller canvas renders differently, resizing back reproduces the frame-7
  hash exactly (surface `0xbf2c1a81`). The fix underneath: the facade
  invalidates wrapper-cache entries on GL object deletion, so ANGLE's
  reused FBO name wraps a fresh object (regression test in
  `ut_gl_1_test.js`); IT-TARGET-1 additionally pins >= 3 FBOs, >= 2
  ping-pong targets, a `DEPTH_COMPONENT24` renderbuffer and the final
  null-FBO bind.

### Determinism

| check | result |
|---|---|
| sequential frames == direct seek to the same clock (E2E-SEEK-1) | yes — `direct12 === seq[last]` |
| reversed and repeated seeks (E2E-SEEK-2) | yes — reversed lands on `seq[0]`, repeated seeks one single hash |
| frozen clock (E2E-SEEK-3) | yes — identical frames, five times over |
| host delay between frames changes no hash (IT-CLOCK-2) | yes — `hostDelayNeutral` |
| divergence control (REG-DETERMINISM) | bites — a perturbed clock produces a different hash, so the equality gates are live |
| capture after the final pass (E2E-SEEK-4) | yes — the barrier capture resolves once, `frame=9`, `engineId=<IID>`, surface hash == present9 `0xf123efe0` on both legs |

### Alpha policy

Premultiplied alpha flows through bloom and the OutputPass on both
backgrounds (dark/light) of E2E-ALPHA. The contract is
`cornerMeanAlpha < 0.1` (battery check `backgroundStaysTransparent`),
NOT `zeroPixels == 0`: the premultiplied bloom halo reaches every pixel
at half-float precision (measured `zeroPixels=0`,
`cornerMeanAlpha=0.038`). Transparent composites differ between
backgrounds (`compositesDifferWhereTransparent`); the GL-composited
frame matches the in-JS expectation within d<=2 for >= 99 % of px —
measured 100 % (`glCompositeMatchesExpectation`); an opaque scene stays
opaque (`opaqueSceneStaysOpaque`).

### Composer read path

Two read paths exist and are NOT comparable with each other:

1. **Composer render-target readback** — linear-ish half-float
   (RGBA16F). `gl.readPixels` on the facade splits reads above 64 KB into
   row strips (each fits `G1_SCRATCH_CAP`; rows stay row-tight so strips
   concatenate byte-linearly) — regression test `UT-GL-READBACK-1` in
   `tool/three/test/ut_gl_1_test.js`.
2. **Presented surface** — present-encoded RGBA8, read by
   `a1b_read_surface_cpu` (locks the presented IOSurface read-only,
   BGRA->RGBA, no GL context, safe from any thread).

E2E-SEEK-4 compares against `present9`, the in-JS RGBA8 read of the
PRESENTED frame 9 — the one equality target shared by both legs
(0xf123efe0); the composer readback is half-float and never enters that
comparison.

### Capability guard

Unsupported capabilities fail BEFORE capture with named errors:
`createPipeline` throws `cinematic.unsupported` at creation when the
probe reports missing float render targets or MRT (the features are
named in the message), and `captureFrame(clock)` rejects
`cinematic.notCapturable` when the unsupported set is non-empty, before
any host is asked (UT-PIPELINE-2/3; the named-gate tests E2E-TARGET-2/3/4
prove the same contract on the engine path).

## F4c1 — shutter motion blur, Afterimage history, Bokeh DOF (side branch `feat/9-f4c1-motion-dof-history`)

Segment F4c1 of issue #8 (ADR-0004 decision 5 + the first part of the F4c row). Design record: `docs/adr/0005-cinematic-motion-blur.md`.

### `CinematicMotionBlurPass` (JSR owned, accepted)

`tool/three/src/cinematic_motion_blur.js` — subframe accumulation over the stratified shutter samples of `clockState`; selected by the existing `motionBlur({ samples, shutter })` helper. Determinism, quality and cost numbers live in the ADR; headline: the GPU accumulation is bit-exact against the linear JS reference (max delta 0.498 byte-scale = half-float LSB), direct seek == sequential on 1B and Web, `samples: 1` is a stateless pass-through.

Two root-cause fixes landed in `tool/three/src/cinematic.js` (both forced by the exactness measurement):

1. The accumulation clear color is forced black at clear time. three's background module resets the renderer clear color to the scene background on every `RenderPass`; the pre-loop set was stale, so the average was painted with the background color (inflation law `k(n) = 2 − 1/n`, ×1.875 at 8 samples). The fix applies to the legacy inline accumulator AND the new pass.
2. The legacy inline accumulator's `autoClear = false` suppression around the weighted quad draws is restored (its loss made the accumulation last-write-wins).

Showcase checkpoints re-recorded with that reason: `finish-direct/seek-frame20` → `0x9125a1e8`, `export-frame9` → `0xa3c2834c`; `draft-frame12` unchanged (`0xe34fc597`, samples 1, temporal-free).

### Stock Afterimage + history reconstruction

`AfterimagePass` runs unchanged on 1B. `CinematicHistory` (damp 0.5 → 40-frame window) reconstructs the temporal state after `resetHistory`: reset + direct seek to frame 24 == sequential 0..24, bit-exact, on 1B and Chrome (`ai_*` checkpoints). A mid-run reset restarts the trails; the post-reset direct seek equals the post-reset sequential run; a genuine clear is asserted (34 frames of stale accumulation would be visible otherwise).

### Stock Bokeh DOF + fringe

`BokehPass` (stock r186) on 1B: focus 7 vs 14, aperture 0 vs 0.03 and maxblur 0.001 vs 0.01 each change the image (pixel-counted). The Bokeh fringe is `BokehShader2`'s chromatic-aberration formula (R/B UV offset per concentric ring) exposed as the `fringe(amount, offset)` helper on the pipeline's DOF pass; amount 3 changes the image, amount 0 and disabling the pass are exact identities. Tiers (corpus driver, diff_1b.cjs): m_sh05 / ai_seq24 / dof_near / fr_on all PASS_IDENTICAL between macOS 1B (ANGLE) and Chrome WebGL2.

### Harness

- `tool/three/cases_f4c1.sh` — `web` (Chrome reference leg, all 10 flags), `1b` (macOS ANGLE leg), `compare` (tier diff + `tiers.json`), `all`.
- Checkpoint program: `tool/three/cases_f4c1/{scene_f4c1.js,widget_f4c1.js}` (one implementation shared by both lanes; the Dart tests assemble the same sources).
- Dart: `test/angle1b/f4c1_{e2e_motion,it_history,e2e_dof}_test.dart` (12 tests); node: `tool/three/test/{f4c1_motion_blur,ut_helper_cinematic,ut_preset_cinematic}_test.js`.

## F4c2 — the nine finishing passes on 1B (issue #8 AC5, 2026-11-26)

Driver: `tool/three/cases_f4c2.sh` (slice corpus, same mechanics and tiers
as `corpus_1b.sh`; acceptance pinned in
`tool/three/cases_f4c2/accepted_tiers.json`, CI step "Finish-pass corpus
(E2E-FINISH REG-VISUAL-FINISH F4c2)" in the `quality-macos` job). Suite
proof: `test/angle1b/f4c2_finish_passes_test.dart`. Measured 2026-11-26,
Apple M4 Pro, 1B = ANGLE Metal `9c6a64c9` vs web = Chromium 133 real
WebGL2, both 320x240, `E2E_WEB_DIRECT direct_fail=0` on every leg:

| pass | stock example at the pin | stock pass/shader file | proof id | measured | accepted |
|---|---|---|---|---|---|
| SMAA | `webgl_postprocessing_smaa.html` (`three-postprocessing-smaa`) | `jsm/postprocessing/SMAAPass.js` (+ `SMAAShader.js`) | stock: FAIL(diff) 98.6667 %, maxDelta 32 (below) | FAIL(diff) | documented-limit |
| SMAA (isolation) | — | same | `cases-f4c2-lines` (wireframe only) | PASS_IDENTICAL `0xac9e1edc` | exact |
| FXAA | `webgl_postprocessing_fxaa.html` (`three-postprocessing-fxaa`) | `jsm/postprocessing/FXAAPass.js` (+ `FXAAShader.js`) | stock | PASS_IDENTICAL `0x6ddd0a67` | exact |
| MSAA | — (no stock example at the pin) | WebGL2 core (`renderbufferStorageMultisample` + `blitFramebuffer` via the composer `samples: 4` target and the `antialias: true` default framebuffer) | `cases-f4c2-msaa` | PASS_IDENTICAL `0xa5b405a6` | exact |
| LUT | `webgl_postprocessing_3dlut.html` (`three-postprocessing-3dlut`) | `jsm/postprocessing/LUTPass.js` | stock: FAIL(1b) (below); `cases-f4c2-lut` (stock LUTPass + in-scene Data3DTexture 8x8x8) | PASS_IDENTICAL `0xf8405481` | exact (pass), documented-limit (example) |
| Film | — (no stock example at the pin) | `jsm/postprocessing/FilmPass.js` (+ `FilmShader.js`) | `cases-f4c2-film` (fixed 1/24 s composer delta) | PASS_IDENTICAL `0xc8cffbc7` | exact |
| Vignette | — (no stock example at the pin) | `jsm/shaders/VignetteShader.js` via `ShaderPass` | `cases-f4c2-vignette` (offset 0.95, darkness 1.2) | PASS_IDENTICAL `0x43c423d9` | exact |
| Selective bloom | `webgl_postprocessing_unreal_bloom_selective.html` (`three-postprocessing-unreal-bloom-selective`) | `jsm/postprocessing/UnrealBloomPass.js` + layers.toggle chain | stock | PASS_IDENTICAL `0x28749596` | exact |
| SSAO | `webgl_postprocessing_ssao.html` (`three-postprocessing-ssao`) | `jsm/postprocessing/SSAOPass.js` (+ `SSAOShader.js`) | stock | PASS_IDENTICAL `0x954ee760` | exact |
| GTAO | `webgl_postprocessing_gtao.html` (`three-postprocessing-gtao`) | `jsm/postprocessing/GTAOPass.js` (+ `GTAOShader.js`) | stock (LittlestTokyo.glb) | PASS_IDENTICAL `0x2f9c49e6` | exact |

Summary: 9 exact / 0 tolerance / 2 documented limits, every leg non-empty
and read back through the C scratch lane, `F4C2_SUMMARY total=11 exact=9
tolerance=0 documented_limit=2 fail=0 skip=0 gate_fail=0 direct_fail=0`.

### Corpus harness fixes landed with this acceptance (F4c2 lane)

Both fixes are `tool/three/corpus/corpus_dom.js` stub glue; no `lib/`
behavior change:

1. **`data:`-URL image loads.** r186 `SMAAPass` embeds its area/search
   textures as base64 `data:` URLs; the img stubs resolved them through the
   asset registry (`decode miss: null`) and never fired load. The web img
   now passes `data:` URLs straight to the native element (tracked in the
   settle gate), the 1B stub decodes the payload bytes directly.
2. **`on<type>` property handlers in `dispatchEvent`.** `SMAAPass` assigns
   `image.onload` AFTER setting `src` (the three.js #15162 pattern); the
   stub only ran registered listeners, so `_areaTexture.needsUpdate` never
   fired and the pass rendered as a passthrough on 1B while Chrome smoothed
   correctly. `dispatchEvent` now also invokes the `on<type>` property
   handler (native semantics).

Consequence for the F2d full-sweep triage: `three-postprocessing-smaa` sat
in the PASS set because BOTH legs rendered the passthrough output
identically. With the stub fixes the pass actually runs and the stock
example measures its real tier (below). Any sweep row whose scene assigns
`onload`-style properties or `data:` texture URLs should be re-read in this
light.

### F4c2 documented limits

**SMAA — texture-LSB at the edge threshold (stock example only).** The
pass is bit-exact through the facade on pure geometry
(`cases-f4c2-lines`), and the inputs to the pass are bit-exact in the stock
example too: the pre-SMAA render compares identically (probe hash
`0x710a8f34`) and the area/search texture uploads compare identically
(probe `0x5dbe640b`). The brick texture leaves half-float scene-RT texel
LSBs (texture filtering) below the 8-bit output quantization; the SMAA
edge threshold (0.1) flips 136 edge texels and the pass amplifies them
into blend differences of up to 32 per channel — 1024/76800 px (1.33 %),
matching 98.6667 % against the 99 % tolerance band. The band class is the
existing "texture-filtering LSB beyond the d<=2/99 % band" engine-depth
class; the facade/host/policy layers are proven clean by the probes. The
pass-level proof stays gated `exact` via `cases-f4c2-lines`; the stock
example keeps the texture-region limit visible in the table above.

**3dlut — prepare-pipeline LUT containers (unchanged F2d triage).** The
example's LUT files are materialized as prebuilt `J3LT` binary containers
(`luts__*.jsrlut`, diagnostic `prebuiltLutBin`) for the R1 widget runtime;
the stock loaders reject the bytes (`THREE.LUTCubeLoader: Missing
LUT_3D_SIZE information`). Asset-lane work belongs to the prepare
pipeline; the LUTPass itself is gated `exact` via `cases-f4c2-lut`
(stock `LUTPass.js` + in-scene `Data3DTexture`, the `sampler3D` path
bit-identical).

### readRenderTargetPixels on a half-float target — gap resolved (F4-merge)

The diagnostic p9 of this lane (a `readRenderTargetPixels` on a
HalfFloatType render target returning all zeros on the 1B leg while the
same call works in Chrome) is explained by two layered causes, both fixed
on the merged head:

1. The all-zeros observations: `g1_read_pixels` early-returns silently
   when the read exceeds `G1_SCRATCH_CAP` (256 KB) — a 320x240 RGBA16F
   read is 600 KB — and the facade copied the empty scratch. Fixed by the
   F4b facade strip split (reads > 64 KB are read in row strips, each
   within the cap); the F4b composer readbacks prove the well-formed
   half-float read works end to end.
2. The silent behavior for a MISMATCHED typed array (`Uint8Array` passed
   for RGBA/HALF_FLOAT): real WebGL raises `INVALID_OPERATION`; the facade
   instead copied scratch bytes into the view (or zeros). Fixed in the
   facade (both copies, `tool/three/src/webgl2_facade.js` ==
   `packages/jsr_three_angle/facade/webgl2_facade.js`): the typed-array
   class must match format/type (WebGL2 readPixels table, mirrors
   `g1_pix_bytes`) and the view must be large enough for the read
   rectangle; otherwise the facade records `INVALID_OPERATION` locally
   (returned FIFO by `getError`), dispatches nothing, and leaves the view
   untouched. Regression test: `tool/three/test/ut_gl_1_test.js`
   ("readPixels validates the typed array against format/type").

No deeper limit of the native read path remains: `g1_read_pixels` fills
the scratch for every format/type pair it is given (`g1_pix_bytes` covers
RGBA/HALF_FLOAT = 8 B/px); the cap is handled facade-side by the strips.

### Commands

- Full sweep: `bash tool/three/cases_f4c2.sh` (CI `quality-macos`; locally
  `JSR_WEBGL_REF_CHANNEL=chromium`).
- Single id: `bash tool/three/cases_f4c2.sh <id>`; machine rows:
  `/tmp/a1b_corpus/<id>/report_entry.json`.
## F4d — environment and premium features on 1B (issue #8 segment F4d, 2026-11-26)

Driver: `bash tool/three/cases_f4d.sh` (CI step appended at the end of the
`quality-macos` job). Each feature runs the stock r186 example at the pin,
unchanged, through the two corpus legs: 1B = original `WebGLRenderer` over the
WebGL2 facade + ANGLE Metal (`run_1b_corpus.dart`), web = bare Chrome real
WebGL2 direct (`ref_1b_corpus.cjs`); tiers come from `diff_1b.cjs` against the
per-GPU tolerance table above. Deterministic TAA/SSAA + presets run through
the battery scene `tool/three/cases_f4d/f4d_battery/official_module.js`
(15 named checks, gated on BOTH legs).

Feature-to-example-to-tier table (measured 2026-11-26, Apple M4 Pro,
MacOSX 15.6.1 arm64, Chrome 143.0.6945.0 / ANGLE Metal 9c6a64c9, both 320x240):

| Feature | Stock example (r186 pin) | Module(s) | 1B tier | web tier |
|---|---|---|---|---|
| PMREM HDR | `webgl_materials_envmaps_hdr.html` | `HDRLoader`, PMREMGenerator | PASS_IDENTICAL (hash `ad212355`) | PASS_IDENTICAL |
| PMREM EXR | `webgl_materials_envmaps_exr.html` | `EXRLoader`, PMREMGenerator | PASS_IDENTICAL (`ac155766`) | PASS_IDENTICAL |
| CubeCamera (dynamic cube) | `webgl_materials_cubemap_dynamic.html` | `CubeCamera`, `WebGLCubeRenderTarget`, `HDRLoader` | 1B renders correctly (hash `f908b0d1`); web leg black — harness limitation, see triage below | FAIL(diff), documented-limit |
| Physical transmission | `webgl_materials_physical_transmission.html` | `MeshPhysicalMaterial` transmission | PASS_IDENTICAL (`110e7dc5`) | PASS_IDENTICAL |
| Physical transmission alpha | `webgl_materials_physical_transmission_alpha.html` | `MeshPhysicalMaterial` + alpha | PASS_TOLERANCE 99.9948 % (4/76800 px, maxΔ 5) | PASS_TOLERANCE |
| Mirror | `webgl_mirror.html` | `Reflector` | PASS_TOLERANCE (0/76800 px differ, maxΔ 1) | PASS_TOLERANCE |
| Cubemap refraction | `webgl_materials_cubemap_refraction.html` | `MeshPhongMaterial` + cube envMap | PASS_IDENTICAL (`eb2816e5`) | PASS_IDENTICAL |
| TAA | `webgl_postprocessing_taa.html` | `TAARenderPass` | battery: direct seek = sequential, reset = fresh (15/15) | battery 15/15 on web leg too |
| SSAA | `webgl_postprocessing_ssaa.html` | `SSAARenderPass` | PASS_IDENTICAL (`5f58f0bb`); repeats identical | PASS_IDENTICAL |

TAA/SSAA determinism (battery scene, hash equality within each leg):
direct seek (re-render of the declared 0..7 window + target frame) equals the
sequential run at f20 and f24; a history reset reproduces a fresh accumulation
of the same window and provably clears (frozen accumulation differs); clearing
history and capturing once is NOT equivalent (regression guard E1). SSAA:
repeated fresh runs identical for the same clock; the clock changes the image.

Presets: `draft`, `production`, `deterministic-export` each report through
`settings()` exactly the documented table (battery check
`presets-report-table`; pinned also by `test/angle1b/f4d_presets_report_test.dart`
against the committed native bundle, no GPU needed) and the rendered frame
follows the settings (`preset-*-applies`, `preset-*-renders`).

Corpus-harness fixes this segment added (both legs, no gate weakening):
`data:` URL images (SMAAPass's embedded area/search textures) now decode
natively in the corpus DOM stubs instead of missing; container assets
(`.hdr`/`.exr`) are repaired from the pinned three.js source over the
prepare manifest registry, so setPath-joined loads
(`HDRCubeTextureLoader` face URLs) reach both legs as real HDR/EXR.

Triage — `three-materials-cubemap-dynamic` web leg (documented limit):
the scene renders only from its animation loop (no on-demand render), and in
the web corpus harness every bundled scene uses its own esbuild-inlined THREE
copy — `__corpusHookThree` patches `globalThis.THREE.WebGLRenderer.prototype`,
which the scene-local class never sees, so the loop registers through the
shimmed `requestAnimationFrame` chain but the tick-driven frames issue no GL
draws (`draws` stays 147 across ticks; `tickdiag {"loop":false,"raf":true}`).
Scenes with an eval-time render (envmaps_hdr, exr, transmission, refraction,
taa, ssaa) are unaffected; this scene stays black on web only. The 1B leg is
the lane this segment gates and renders the feature correctly (non-black,
`f908b0d1`). Not an ANGLE/facade defect; evidence:
`/tmp/a1b_corpus/three-materials-cubemap-dynamic/status_web.json` (CI: the
## F4e lifecycle and F4g security of the cinematic pipeline (branch feat/9-f4eg-lifecycle-security)

Segment rows F4e (lifecycle, ids `IT-LIFE-CINE-*`, `E2E-CONTEXT-CINE-*`,
`REG-RESOURCE-BOUNDS`) and F4g (security and honest degradation, ids
`SEC-CINEMATIC-*`, `FUZZ-TARGET-*`, `E2E-FALLBACK-*`) of issue #8, on the
F4a helper API. Local vehicle: real QuickJS engine + committed bundle +
real ANGLE wire (lifecycle/context rows) and the recording wire (security
rows). CI: the existing `flutter test test/angle1b` steps of `quality`
(ubuntu: security + fuzz) and `quality-macos` (macOS: all rows incl. the
ANGLE-backed lifecycle/context). No workflow change.

### Lifecycle (F4e)

- `test/angle1b/f4eg_life_test.dart` — `IT-LIFE-CINE-1`: ONE 1B surface and
  renderer carry 100 cycles of pipeline create, render, resize (rotating
  32..64 through renderer+pipeline), history reset (new epoch + stock TAA
  accumulation restart), context loss and restore through
  `WEBGL_lose_context`, destroy; the pipeline holds bloom + the stock
  `TAARenderPass` (accumulate, sampleLevel 0, inserted before OutputPass)
  + OutputPass. The GL baseline is snapshotted after a warmup render
  (facade init resources and first-frame allocations are IN the baseline);
  after cycle 100 the facade `__stats` call accounting (createX minus
  deleteX per kind) reads ZERO delta for textures, framebuffers,
  renderbuffers, programs, buffers and shaders:
  `{Texture: 0, Framebuffer: 0, Renderbuffer: 0, Program: 0, Buffer: 0,
  Shader: 0}`. Per-cycle scene content (scene/camera/mesh) is cycle-owned,
  so `pipeline.dispose()` releases every geometry/material/program it
  created. Same test body asserts `REG-RESOURCE-BOUNDS`.
- `test/angle1b/f4eg_context_test.dart` — `E2E-CONTEXT-CINE-1` (edge E6):
  context loss while the temporal pipeline holds accumulation history;
  after the restore the history is reset (epoch 77 + TAA restart), frames
  dispatch and render again (batch dispatch counter grows, renderer.info
  frame count advances), the same wire surface serves every dispatch (no
  stale surface), and the final-pass capture barrier resolves again with
  the reset epoch.

### Security and honest degradation (F4g)

All on the real committed bundle over the recording wire; named errors or
documented clamps only.

- `SEC-CINEMATIC-1` (`f4eg_security_test.dart`): with the host policy
  default (`allowCustomShaders: false`), `new THREE.ShaderMaterial`,
  `new THREE.RawShaderMaterial`, `onBeforeCompile` assignment and a custom
  pass whose material construction feeds `composer.insertPass` all fail
  with `three.unsupported: custom shaders are disabled by host policy`
  BEFORE the renderer records any call; the composer chain is unchanged
  and the stock internal bloom pass stays applied. `SEC-CINEMATIC-1b`:
  `allowCustomShaders: true` permits the same constructions through the
  same pipeline path.
- `SEC-CINEMATIC-2` (edges E4/E9): hostile canvas dimensions — NaN,
  Infinity and negative are the named `three.invalid: canvas dimensions
  must be non-negative finite numbers`; fractional floors, 0 clamps to 0,
  999999 clamps to the 16384 GL max (documented). Hostile pipeline
  dimensions — NaN/negative/Infinity are the named `cinematic.invalid:`
  error; fractional floors (64.9x48.2 -> 64x48), zero clamps to the
  1-pixel minimum, beyond the renderer `maxTextureSize` clamps
  (99999x100 -> 16384x100); the pipeline still renders after the barrage.
- `SEC-CINEMATIC-3`: the oversized-target quota (4097x4097 >
  MAX_TARGET_PIXELS 4096x4096) is refused with the named error BEFORE any
  target is resized (the previous coherent size stays on
  `composer.renderTarget1`); a declared history window of
  4097/Infinity/NaN frames is refused named; 4096 frames (the JSR history
  quota, F4-merge value) reconstructs exactly 4096 frames — bounded, no
  hang. (The branch measured this row at 600/601; the merged quota follows
  the afterimage documented cap, see "Core changes".)
- `E2E-FALLBACK-1/2` (edge E5): a renderer without GL2 evidence probes
  `supports() === false` for smaa/colorGrade/film/vignette/multisample
  while bloom/fxaa/dof stay true; `setPreset('production')` runs the
  reduced pass set (`bloom, dof, fxaa`) and names every missing effect in
  `pipeline.unsupported`; `assertCapturable()` throws the named
  `cinematic.notCapturable` BEFORE capture; the capture still returns
  after the final pass with the reduced set.
- `SEC-CINEMATIC-4`: the runtime secret crosses the real secrets channel
  to the host, the token-tagged asset URL rides an effect descriptor, and
  the capture barrier metadata (`{engineId, frame, fps, shutter, samples,
  epoch}`) plus the capture result carry neither value.
- `FUZZ-TARGET-1..3` (`f4eg_fuzz_test.dart`): deterministic mulberry32
  fuzzing with printed seeds (0x5eed0001 history: 120 hostile windows +
  clocks — named or clamped, reconstruct never exceeds 4096 frames;
  0x5eed0002 LUT/assets: 10 hostile LUT kinds clamp to a complete 8^3
  identity table, 6 malformed .cube/.3dl/HDR/EXR/PNG-shaped byte blobs
  reject through the named error path of the real loadAsset ->
  decodeImage lane with no resolved bogus image and no hang; 0x5eed0003
  API: 200 hostile setSize/clockState/ensurePass/setPreset/applyEffect
  calls — every rejection is `cinematic.invalid`, and a valid frame still
  renders afterwards). HDR/EXR full decode is not part of this bundle (it
  lands with the F4d env lane); the fuzz drives the byte-handling surface
  that exists here.

### Core changes this segment forced (for the merge lane)

1. `tool/three/src/cinematic.js` (beyond import/export lines):
   - `pipeline.setSize` validates hostile dimensions through
     `resolveSize` (named `cinematic.invalid` for non-finite/negative,
     floor/0->1/maxTextureSize clamps, checked MAX_TARGET_PIXELS budget
     of 4096x4096) — a rejected resize leaves the previous coherent size.
   - `CinematicHistory.declare` rejects non-finite and >4096-frame windows
     (named) — `reconstruct` is provably bounded (was: Infinity frames
     hung reconstruct; huge windows built unbounded arrays). F4-merge
     amendment: the quota is 4096, not this branch's 600 — the afterimage
     documented cap (damp near 1, F4c1) declares 4096-frame windows for its
     direct-seek == sequential determinism contract, so the quota follows
     the widest built-in effect; the checked-quota behavior is unchanged.
   - `pipeline.dispose` additionally disposes
     `UnrealBloomPass.materialHighPassFilter` — upstream r186
     `UnrealBloomPass.dispose` misses it, leaking one GL program per
     pipeline cycle (found by IT-LIFE-CINE-1 on the 1B lane).
2. `tool/three/src/runtime.js`: `_setPhysicalSize` enforces the 16384 GL
   cap the constructor already applied to the boot buffer (the previous
   comment claimed the setters enforce it — they did not; canvas.width =
   999999 materialised a GL-max-exceeding backing buffer).

### Commands

- Lifecycle/context (macOS host with staged dylibs):
  `flutter test test/angle1b/f4eg_life_test.dart test/angle1b/f4eg_context_test.dart`
- Security/fuzz (any host): `flutter test test/angle1b/f4eg_security_test.dart
  test/angle1b/f4eg_fuzz_test.dart`
- After touching `tool/three/src`: `node tool/three/build.mjs --source
  /tmp/jsr-three-r186 && node tool/three/build.mjs --verify`, then
  `node example/widgets/three-cinematic-showcase/build.mjs` and
  `tool/three/showcase_1b.sh` (F4-merge measured, 4/4 checkpoints
  hash-equal: draft-frame12 0xe34fc597, finish-direct/seek-frame20
  0x9125a1e8, export-frame9 0xa3c2834c — the F4c1-recorded values
  reproduce from the union bundle bytes; this branch alone had measured
  0x3cc7f7db / 0x88479d2f on its pre-merge sources).
