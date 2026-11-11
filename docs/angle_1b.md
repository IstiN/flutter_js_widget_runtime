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
4a/4b see the M4 report table: instancing/lines pixel divergences remain
   under investigation (facade `getParameter(ALIASED_LINE_WIDTH_RANGE)`
   returning an empty vector is the prime 4b suspect; instancing divisor
   decode the 4a suspect).
