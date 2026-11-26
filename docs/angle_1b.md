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
  `composer.renderTarget1`); a declared history window of 601/Infinity/NaN
  frames is refused named; 600 frames (the JSR history quota) reconstructs
  exactly 600 frames — bounded, no hang.
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
  clocks — named or clamped, reconstruct never exceeds 600 frames;
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
   - `CinematicHistory.declare` rejects non-finite and >600-frame windows
     (named) — `reconstruct` is provably bounded (was: Infinity frames
     hung reconstruct; huge windows built unbounded arrays).
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
  `tool/three/showcase_1b.sh` (4/4 checkpoints hash-equal: draft-frame12
  0xe34fc597, finish-direct/seek-frame20 0x3cc7f7db, export-frame9
  0x88479d2f — unchanged from F4a).
