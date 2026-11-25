# ADR 0004 — Cinematic three.js pipeline runs on 1B (issue #8)

## Context

Issue #8 turns the 1B foundation (issue #7) into a prioritized, testable
cinematic profile: "Native JSR applications can render polished cinematic
three.js frames with upstream r186 postprocessing, advanced environment
materials and deterministic frame-by-frame video capture, without a WebView
or per-effect Dart rewrites." Its framing is fixed: **use the existing
three.js implementation** — `EffectComposer`, `UnrealBloomPass`,
`BokehPass`, `SMAAPass`, `LUTPass`, `GTAOPass`, `PMREMGenerator`,
`CubeCamera` are the primary implementation; this card does not create
independent Dart look-alikes; R1 is not retrofitted with arbitrary GLSL or
offscreen targets. "Video completion is stricter than an interactive demo":
arbitrary-frame capture must be deterministic, temporal history
reproducible, alpha valid, and an exporter never silently omits a requested
effect.

Determinism groundwork already exists in the showcase widget
(`example/widgets/three-cinematic-showcase/src/pipeline.js`): a pure
`clockState(frame, fps, shutter, samples, epoch)`, `probeCapabilities`,
`createCinematicPipeline`, `resetHistory(epoch)`, named presets — and "The
pipeline never reads `Date.now()`". Today that API is **private to the
showcase widget** (bundled by its own `build.mjs` into
`cinematic_bundle.mjs` for `example/web/cinematic_reference.html`), so no
other widget or host can use it.

## Decision

1. **The native lane of the cinematic pipeline is 1B** (F4 decision 1).
   The stock r186 addons run unchanged through the WebGL2 facade and ANGLE.
   The bounded R1 lane keeps its existing set (bloom, DOF, FXAA, SMAA, LUT,
   OutputPass) and its semantics — no retrofit, no new R1 passes.
2. **The helper API moves from the showcase widget into the core bundles**
   (F4 decision 2). `tool/three/src/cinematic.js` is built into
   `jsr_three_native.js` and `jsr_three_web.js` (hashes and
   `bundle_manifest.json` regenerated). It exports `jsr.three.cinematic`
   when `threeEnabled`: `createPipeline(options)` (the existing
   `createCinematicPipeline`), `clockState`, `probeCapabilities`,
   `presets`, the helpers `bloom`, `depthOfField`, `colorGrade`,
   `motionBlur`, `antialias`, and on a pipeline `renderFrame`,
   `captureFrame`, `dispose`. The showcase widget uses the core copy and
   keeps no private copy — one implementation, every consumer on it.
3. **Named, testable components** (F4 decision 3): `CinematicCapabilitySet`
   (the type of the `probeCapabilities()` result, with `supports(effect)`),
   `CinematicFrameClock` (`createFrameClock({fps, shutter, samples, epoch})`
   with `state(frame)`; `clockState` stays as the pure function),
   `CinematicHistory` (the history state behind `resetHistory`, with
   reconstruction for temporal passes), `ThreeCinematicProfile` (the preset
   objects `draft`, `production`, `deterministic-export`, each reporting
   the settings it selected). `CinematicPipeline` is the formal name of the
   pipeline object.
4. **Capture barrier is a host contract** (F4 decision 4).
   `JsRuntimeConfig.cinematicCaptureHost`
   (`JsCinematicCaptureHost.capture(engineId, clock)`), called by
   `captureFrame(clock)` through the existing `__jsr_capture` channel with
   options `{engineId, clock, barrier: 'final-pass'}`. The host captures
   after the final pass of the frame-driven render, never from a wall-clock
   frame. A missing capability is a named error
   (`cinematic.notCapturable`), never an effect-free capture.
5. **`CinematicMotionBlurPass` — JSR-owned shutter blur; first candidate
   selected** (F4 decision 5). Criteria it must meet: deterministic under
   `clockState` (direct seek equals sequential), works on native 1B and
   Web, history reconstruction after `resetHistory`. First candidate:
   **subframe accumulation with the stratified shutter samples of
   `clockState`** — render the scene at each stratified shutter sample
   within the frame and accumulate with the sample weights, which is
   deterministic by construction (samples derive from the clock state, not
   wall time), runs identically through the facade on 1B and real WebGL2 on
   Web, and integrates with `CinematicHistory` for temporal continuity.
   F4c records the measured result and any rejection reason; a candidate
   that fails a criterion is replaced and the record lists why.

## Alternatives

- **Per-effect Dart rewrites of the addons** (Dart bloom, Dart DOF, …):
  rejected by the issue framing — "does not create independent Dart
  look-alikes when the pinned upstream addon can run on 1B"; doubles the
  maintenance surface and drifts from r186 semantics.
- **Retrofitting GLSL passes into R1**: rejected — "R1 remains lightweight";
  R1's deliberately bounded post set stays as it is (issue #8 framing).
- **Keeping the helper API private in the showcase widget**: rejected — the
  showcase copy is unreachable for other widgets/hosts and its bundle
  duplicates the core bundles; extraction makes `UT-HELPER-*`/`IT-HELPER-*`
  test one shared implementation.
- **Wall-clock capture** (grab the presented frame whenever the exporter
  asks): rejected — "video completion is stricter than an interactive
  demo"; capture must be pinned to the frame clock (`barrier:
  'final-pass'`) so reversed, repeated and direct seeks all reproduce.
- **Silent degradation** (drop a pass the GPU can't run and still export):
  rejected — the exporter must never silently omit a requested effect;
  unsupported capabilities fail before capture (`E2E-FALLBACK-*`).
- **WebGPU/TSL motion-blur nodes**: rejected — "Classic WebGL2, not
  WebGPU/TSL"; every named example is the pinned classic `webgl_*`
  example.
- **Object-space / geometry-stretch motion blur**: deferred candidate —
  weaker determinism guarantees under skinned meshes and history
  reconstruction; only revisited if the accumulation candidate fails a
  criterion in F4c.

## Consequences

- Native cinematic rendering requires 1B (QuickJS FFI sync channel + ANGLE
  + capability truth): hosts on `flutter_js`, R1-only or unsupported GPUs
  either run a deliberately simplified R1 scene or report
  `three.unsupported` — never a cinematic success with dropped passes
  (issue #8 pinned fact).
- Core bundles grow by one source file and the manifest hashes change once
  in F4a; downstream consumers (showcase, hosts) all read the same
  `jsr.three.cinematic` surface.
- Deterministic capture gives byte-identical preview / arbitrary-frame
  screenshot / PNG-sequence output at bloom, DOF and temporal checkpoints
  (E2E-HOST-YOCLIP-*, REG-HOST-CAPTURE) — the exporter contract YoClip
  needs.
- The motion-blur design is falsifiable: F4c measures it against the three
  criteria; a failed candidate is documented, not shipped.
- Performance envelopes are pinned by measurement: PERF-CINEMATIC-* on the
  macOS host at 720p/1080p/4K, no per-frame recompilation, no re-upload of
  unchanged LUTs/textures (REG-UPLOADS) — host numbers; device numbers are
  explicitly not claimed.

## Evidence

- Repo facts: `example/widgets/three-cinematic-showcase/src/pipeline.js`
  (`clockState`, `probeCapabilities`, `createCinematicPipeline`,
  `resetHistory`, presets, no `Date.now()`), its private bundle
  (`cinematic_bundle.mjs` via the widget's own `build.mjs`),
  `assets/three/bundle_manifest.json` (`jsr_three_native.js` /
  `jsr_three_web.js` with hashes), AGENTS.md R1 section ("local-only
  EffectComposer/RenderPass render-to-screen shim"), `jsr.capture` channel
  in AGENTS.md, issue #8 body (framing quotes above, r186 pin
  `9b4a2ac29c63ccb43fd51c5661f2f873ac2c39b8`).
- Verified in segment **F4** (steps F4a–F4i): `UT-HELPER-*`, `IT-HELPER-*`,
  `E2E-SHOWCASE-1`, `UT-PRESET-*` (F4a); `E2E-BLOOM-*`, `REG-VISUAL-BLOOM`,
  `UT-PIPELINE-*`, `IT-TARGET-*`, `E2E-TARGET-*`, `IT-CLOCK-*`,
  `E2E-SEEK-*`, `REG-DETERMINISM`, `E2E-ALPHA-*`, `REG-ALPHA` (F4b);
  `E2E-FINISH-*`, `E2E-DOF-*`, `E2E-MOTION-*`, `IT-HISTORY-*` (F4c —
  includes the motion-blur candidate measurement); `E2E-ENV-*`,
  `E2E-TRANSMISSION-*`, `E2E-AA-*`, `REG-TEMPORAL` (F4d); `REG-RESOURCE-BOUNDS`
  (F4e); `PERF-CINEMATIC-*`, `REG-UPLOADS` (F4f); `SEC-CINEMATIC-*`,
  `FUZZ-TARGET-*`, `E2E-FALLBACK-*` (F4g); `DOC-1`, `REG-MATRIX` (F4h);
  `E2E-HOST-YOCLIP-*`, `REG-HOST-CAPTURE` (F4i). Physical-device and YoClip
  application outputs are not claimed (plan section 9).
