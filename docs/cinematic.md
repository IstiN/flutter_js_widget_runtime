# `jsr.three.cinematic` — the core cinematic pipeline (issue #8)

The deterministic cinematic pipeline lives in the CORE three bundles since
F4a (`tool/three/src/cinematic.js`, ADR-0004 decisions 2-4). It is installed
on `jsr.three.cinematic` whenever the host evaluates the three bundle —
exactly when `JsRuntimeConfig.threeEnabled` is true. The showcase widget
(`example/widgets/three-cinematic-showcase/`) reads this surface and keeps no
private copy. Rebuild the bundles after changing the pipeline source:

```bash
node tool/three/build.mjs --source /tmp/jsr-three-r186        # bundles + manifest + gen/cinematic_core.mjs
cd example/widgets/three-cinematic-showcase && node build.mjs  # widget + scene bundles, core copy to example/web/
```

## Surface members

| Member | Signature | Notes |
|---|---|---|
| `createPipeline(options)` | `({renderer, scene, camera, capabilities?, effects?, alpha?}) -> CinematicPipeline` | the formal `CinematicPipeline` object (non-enumerable `isCinematicPipeline` marker) |
| `clockState(frame, fps, shutter, samples, epoch?)` | pure clock object `{frame, fps, shutter, samples, subframes, epoch}` | stratified jitter indexed by absolute subframe ordinal; never reads a wall clock |
| `probeCapabilities(renderer)` | `-> CinematicCapabilitySet` | conservative detection; `lane` is non-enumerable so JSON snapshots stay schema-clean |
| `presets` | `{draft, production, deterministic-export}` | `ThreeCinematicProfile` instances |
| `bloom(options)` | `{threshold?, strength?, radius?} -> {effect, options}` | descriptor factory |
| `depthOfField(options)` | `{focus?, aperture?, maxBlur?} -> {effect, options}` | descriptor factory |
| `colorGrade(options)` | `{lut?: 'identity'\|'teal-orange', intensity?} -> {effect, options}` | descriptor factory |
| `motionBlur(options)` | `{shutter?, samples?} -> {effect, options}` | descriptor factory |
| `antialias(options)` | `{mode: 'fxaa'\|'smaa'} -> {effect, options}` | descriptor factory; exclusive modes |
| `createFrameClock(options)` | `({fps?, shutter?, samples?, epoch?}) -> CinematicFrameClock` | `clock.state(frame)` delegates to the pure `clockState` |
| `CinematicCapabilitySet` | class; `supports(effect)` | the type of the `probeCapabilities()` result |
| `CinematicHistory` | class; `reset(epoch)`, `declare({pass, frames})`, `depth()`, `reconstruct(clock)` | the temporal state behind `resetHistory`; `reconstruct` returns the ordered frames a direct seek must re-render |
| `ThreeCinematicProfile` | class; `name`, `settings()` | reports a deep copy of the settings the preset selects |
| `cinematicRandom(seed)` | mulberry32 factory | the one seeded RNG (the showcase scene consumes it through `seededRandom`) |
| `buildLutTexture(kind)`, `CinematicPipelineError` | — | deterministic 8³ LUTs; named errors carry `name`/`code` |

## Pipeline object (`CinematicPipeline`)

`renderFrame(clock, updateScene?)` — explicit clock only. `captureFrame(clock?)` /
`dispose()` — idempotent disposal. `setPreset(name)` applies exactly the
profile's reported settings (constructing any pass the pipeline was created
without); `getConfig()`, `setSize(w, h)`, `resetHistory(epoch)`,
`setEffect(name, value)`, `setQuality({fps, shutter, samples})`,
`capturePath()`, `assertCapturable()`, `history` (`CinematicHistory`),
`unsupported` (`[{effect, reason}]` — requested-but-unavailable effects are
always NAMED, never silent).

The five helpers exist on the pipeline too, live:
`pipeline.bloom({threshold, strength, radius})` constructs/enables the pass
and applies the parameters (`pipeline.depthOfField`, `colorGrade`,
`motionBlur`, `antialias`, and `pipeline.applyEffect(descriptor)` for a
pre-built descriptor). The bounded R1 lane keeps its set — bloom, DOF, FXAA,
SMAA, LUT, OutputPass; film/vignette stay web-only v1 and are named
unsupported natively.

## Capture barrier (host contract, ADR-0004 decision 4)

```js
await pipeline.captureFrame(clock); // clock = clockState(...)/clock.state(f)
```

`captureFrame(clock)` crosses the existing `__jsr_capture` channel with

```json
{ "engineId": "<__IID>", "clock": {"frame", "fps", "shutter", "samples", "epoch"}, "barrier": "final-pass" }
```

The Dart host implements `JsCinematicCaptureHost` (`lib/src/runtime/js_cinematic_capture_host.dart`)
and passes it as `JsRuntimeConfig.cinematicCaptureHost`:

```dart
class MyCaptureHost extends JsCinematicCaptureHost {
  @override
  Future<Map<String, dynamic>> capture(String engineId, Map<String, dynamic> clock) async {
    // completes only after the FINAL composer pass of the frame-driven render
    return {'path': pngPath, 'width': w, 'height': h};
  }
}
```

The host captures after the final pass of the frame-driven render — never
from a wall-clock frame. A host without the capability (field unset) rejects
the JS promise with the NAMED error **`cinematic.notCapturable`** — never an
effect-free capture. `captureFrame()` WITHOUT a clock keeps the legacy
interactive paths (tree rasterization / `jsr.three.capture` / canvas
readback) and rejects with `cinematic.captureUnavailable` when none exists.

## Web reference

`example/web/cinematic_reference.html` is the standalone ground truth on
real upstream WebGL2: the page installs `globalThis.THREE` from the pinned
ESM build (`jsr_three_web.js` + `three.core.js`), then imports
`cinematic_core.mjs` (the build of the core module) and `showcase_scene.mjs`.
E2E-SHOWCASE-1 (`tool/three/showcase_1b.sh`) renders the core module and the
legacy pre-move private copy (materialized from the pinned base commit)
hash-equal at named checkpoints in the same Chrome session.

## Tests

| Ids | Where |
|---|---|
| `UT-HELPER-1..5`, `UT-PRESET-1..3` | `tool/three/test/ut_helper_cinematic_test.js`, `tool/three/test/ut_preset_cinematic_test.js` (`npm --prefix tool/three test`) |
| `IT-HELPER-1..3` | `test/angle1b/it_helper_cinematic_test.dart` (real engine + bridge routing + named error) |
| `E2E-SHOWCASE-1` | `test/angle1b/e2e_showcase_1_cinematic_test.dart` (native 1B leg) + `tool/three/showcase_1b.sh` (web leg, quality-macos) |
