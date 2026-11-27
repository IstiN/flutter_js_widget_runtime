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

**Reproducibility (bundle of record: darwin-arm64).** The committed bundles
under `assets/three/` are the darwin-arm64 build and reproduce byte for byte
on that host class: `node tool/three/build.mjs --source /tmp/jsr-three-r186
--verify` compares bytes there and is the CI byte gate (`quality-macos`).
Other host classes produce DIFFERENT minified identifier names from the same
source and the same esbuild 0.25.5 — the identifier assignment follows the
host class (darwin-arm64 vs linux-x64 differ; native and wasm esbuild
binaries agree within a host; Node version, GOMAXPROCS and path length have
no effect). On such hosts `--verify` still checks every pin (source commit,
source tree hash, adapter input hashes, license), reports the rebuilt
bundle hashes informationally, and reports the golden ESM informationally
too (the unminified golden ESM is likewise host-rendered; its inlined
source-tree path comments are normalized to `three-source/`, but the
remaining bytes are only proven on the builder host) and exits 0 with a
final `bytes compared: no …` line (`quality` on ubuntu runs these pin
checks). `bundle_manifest.json` records the builder in
`build.builderHost`; the macOS CI job asserts it, so a bundle regenerated
on another host class fails CI instead of silently losing the byte gate.
The official-example prepare (`tool/three_example/prepare.mjs`, output
`example/widgets/<id>/prepare_manifest.json`) carries the same gate: its
`build.builderHost` decides where its byte comparison runs, and the
macOS CI job verifies it byte-for-byte as well.

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

**Frame-presented guarantee (F4 merge stage 2b, 2026-11-26).** `captureFrame`
drains the GL queue synchronously (the wire's flush trigger, `gl.flush`)
BEFORE the `__jsr_capture` barrier crosses, so the host's surface read
inside the crossing always sees the frame of the requested clock — on the
1B lane the facade otherwise dispatches its batched void commands at the
end-of-task flush, which would run after the crossing (frame N-1; the F4i
diagnosis). Host read path of record: the 1B EGL context is current on the
main thread, so the host makes the surface current, presents it and reads
via `a1b_read_pixels` (see `docs/angle_1b.md`, "Host read path"); pinned by
`UT-PIPELINE-CAPTURE-FLUSH` and the F4i proof without any harness yield.

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

## Prerequisites and reduced fallbacks (DOC-1, issue #8 AC13)

Backend prerequisites for the 1B lane (the probes run in order, before the
renderer is allocated; a failed probe selects r1 with the reason reported
through `JsRuntimeConfig.onThreeBackendSelected`): a QuickJS backend with the
sync byte lane, a loadable `libangle_1b`, a creatable ANGLE display for the
platform, and (Android) API level >= 28 — see `docs/angle_1b.md` (backend
selection) for the full contract.

| Effect / feature | Capability it needs | Behavior when the capability is missing | Proven by |
|---|---|---|---|
| `bloom` | half-float render targets + MRT | `createPipeline` throws `cinematic.unsupported` naming the missing features, before the renderer is allocated | `UT-PIPELINE-2`, `E2E-TARGET-2` |
| `dof` (BokehPass) | float ping-pong composer targets (probe `bokeh`) | named in `pipeline.unsupported`; the reduced preset renders without it | `E2E-FALLBACK-1/2` |
| `motion` (`CinematicMotionBlurPass`), `afterimage`, `multisample` | float accumulation targets (probe `motionBlurAccum`) | named in `pipeline.unsupported` ("subframe accumulation needs float render targets"); the composer target falls back to non-multisampled | `E2E-FALLBACK-1`, `UT-PIPELINE-2` |
| `smaa` | SMAA probe (lookup-texture decode) | named in `pipeline.unsupported` | `E2E-FALLBACK-1` |
| `colorGrade` (LUT) | LUT probe (`lut` bit) | named in `pipeline.unsupported` | `E2E-FALLBACK-1` |
| `film`, `vignette`, `fringe` | custom GLSL passes — web-only v1 on the bounded R1 lane | named unsupported natively ("outside the bounded native shader profiles"); probe-gated on web | `E2E-FALLBACK-1`, `UT-HELPER-4` |
| `fxaa` | none (basic ShaderPass, no probe bit) | always available | `UT-HELPER-4` |
| env (`pmrem`, `cubeCamera`) | the 1B upstream renderer (native 1B proven: HDR/EXR exact, cubemap renders) | probe bits false on a renderer without GL2; on the bounded R1 lane web-lane (documented) | `E2E-FALLBACK-1`, `tool/three/cases_f4d.sh` (`E2E-ENV`) |
| capture barrier | host capability `JsRuntimeConfig.cinematicCaptureHost` set | `captureFrame(clock)` rejects with the named `cinematic.notCapturable` BEFORE any host is asked; no clock + no legacy path rejects `cinematic.captureUnavailable` | `UT-PIPELINE-3`, `IT-HELPER-3` |
| custom shaders (`ShaderMaterial`, `RawShaderMaterial`, `onBeforeCompile`) | host policy `allowCustomShaders: true` (default `false`) | `three.unsupported: custom shaders are disabled by host policy`, before any recorded call | `SEC-CINEMATIC-1` |
| Reduced preset fallback | — | `setPreset('production')` on a renderer without GL2 runs the reduced pass set (`bloom`, `dof`, `fxaa`) and names every missing effect in `pipeline.unsupported`; presets always report exactly the settings they selected | `E2E-FALLBACK-1/2`, `UT-PRESET-1..3` |

A capability gap is always NAMED (error or `pipeline.unsupported` entry),
never a silent effect-free capture; unsupported effects fail capture with
`cinematic.notCapturable` before the host is asked. The measured 1B tiers of
the promoted examples live in `tool/three/api_matrix.json` (`oneB` rows) and
`docs/angle_1b.md`; the matrix promotion rule itself is
`tool/three/test/engine_coverage_test.mjs`.
