# Native THREE example issues (user-reported, intermediate build)

Recorded during interactive run of `example/lib/three_example.dart` after the
physical-degrade/font/background increments. Status: OPEN unless noted.

| # | Example | Symptom | Area | Status |
|---|---------|---------|------|--------|
| 1 | memory | White screen | assets/module | FIXED — synchronous local-RGBA CanvasTexture adoption before same-tick disposal; mapped 256×256 wireframe verified |
| 2 | decals | Not moving after interaction | input/interaction | FIXED — pointer input verified; polygonOffset now degrades to base depth bias with a once-per-material warning instead of aborting every RAF |
| 3 | nurbs | Not interactive (verify if it should be) | input/interaction | FIXED — official custom container/document drag (not OrbitControls) now receives complete pointer fan-out; group rotation regression verified |
| 4 | physical clearcoat | Black screen + white ball flying | assets/materials | FIXED (e40756f) — FlakesTexture shim (fillRect-only canvas2d), float CSS rgb() parser, HDR->RGBA faces, scene.environment fallback; 4 spheres + skybox + 6 textures verified |
| 5 | normal map object space | Gray statue without forms | materials/normal maps | FIXED — externalized Nefertiti's bufferView images to registered URIs (QuickJS has no Blob); color + normal maps verified |
| 6 | points sprites | Black screen | points/sprites | FIXED — predecoded all five grayscale+alpha sprites to pinned raw RGBA8; 5 additive textured point clouds verified |
| 7 | panorama cube | White screen | cube render target | FIXED — ImageLoader now host-decodes raw RGBA and bounded canvas drawImage slices all six atlas faces; six textured draws and flat upload counters verified |
| 8 | geometry text | Not interactive | input/interaction | FIXED — official custom container/document drag (not OrbitControls) now receives complete pointer fan-out; group rotation regression verified |
| 9 | draw range | Really slow FPS | performance | FIXED — rendered range-window count respects the official cap; dynamic positions are invalidated per frame instead of hashed during planning, eliminating repeat geometry uploads |
| 10 | geometries | Gray figures (verify expected look) | materials | FIXED — registered the pinned uv_grid_opengl.jpg asset; one sRGB repeat map shared by all 16 meshes verified |
| 11 | skinning morph | Big hands detached from body | skinning/morph | CLOSED (upstream parity) — RobotExpressive hand pose matches official r186; all 1,108 hand vertices match THREE.getVertexPosition within 3.7e-9 and native/official captures match |
| 12 | skinning blending | Only ~20 FPS | performance | FIXED — native skin weights/indices are precomputed per geometry instead of every frame; paused animation retains skin and command caches with flat texture/geometry counters |
| 13 | shadow map performance | 0–5 FPS | performance | FIXED — morph normals and 1,600-equivalent draw state use native caches/dedup; shadow content signatures retain unaffected maps, and SunLight renders its single visible cascade |

## Notes

- #4 root so far: HDRCubeTextureLoader shim now loads 6 RGBE faces (transcoded
  to raw RGBA at prepare); official onLoad callback throws
  `TypeError: not a function` before scene.background/environment are set.
- Interaction issues (#2/#3/#8) may be per-example event wiring (pointer vs
  document listeners) — check `example_adapter.js` event fan-out.
- Performance issues (#9/#12/#13) need per-frame diagnostics (triangles,
  uploads, plan cost) before optimizing.

## Matrix baseline (2026-10-31, after 13-issue fixes)

79/107 examples render (73.8%). Goal: >=80% (86/107). 28 broken:

- init aborts (mounted=false): camera-logarithmicdepthbuffer, geometry-colors-lookuptable, geometry-terrain, materials-blending, multiple-scenes-comparison, morphtargets
- RAF throws every frame (sub=0): effects-anaglyph, effects-stereo, lights-hemisphere, materials-displacementmap, materials-envmaps, materials-modified, materials-wireframe, modifier-edgesplit, modifier-simplifier, raycaster-texture, rtt, shader
- draws=0: instancing-performance (sub=18), loader-pcd (sub=1)

Workstreams: A=example-side (runtime/prepare/adapter), B=native_renderer+lib,
C=diagnosis for effects/rtt/shader/raycaster-texture (specs for orchestrator).
Raw results: /tmp/three_matrix.jsonl; generator: tool/three_example/generate_matrix_test.py.

### Workstream A resolution (2026-10-31)

All ten assigned baseline failures now mount and submit non-empty R1 draw
plans with no init/RAF error cards (baseline-only arithmetic: 89/107, 83.2%;
orchestrator matrix rerun still required):

- Init fixes: materials-blending (five pinned textures, bounded local label
  text, straight-alpha degrade), geometry-colors-lookuptable and
  materials-wireframe (offline Request/Response/fetch lane for core
  BufferGeometryLoader), geometry-terrain (`window.Math`), and
  multiple-scenes-comparison (`querySelector` container/slider facade).
- camera-logarithmicdepthbuffer now mounts the missing DOM view containers
  and shares one standard-depth renderer across the official two-view
  comparison. The logarithmic-depth flag is explicitly not emulated.
- RAF fixes: materials-envmaps (six pinned Bridge2 faces; one cube-atlas
  upload), materials-displacementmap (six pinned castle faces; normalMap and
  envMap retained, aoMap/displacementMap peeled with a warning),
  materials-modified (two static MeshNormalMaterial heads; twist callback
  dropped with a warning), lights-hemisphere (solid-color sky dome fallback),
  and materials-wireframe (both heads use real one-pixel R1 wire draws).

Regression coverage: `js_three_example_side_render_test.dart` plus the four
dedicated camera/hemisphere/displacement/modified example tests. These are
example-side compatibility/degrade fixes; no native_renderer.js or lib/**
change is required for the recovered render paths. Full-fidelity logarithmic
depth, AO/displacement, arbitrary onBeforeCompile GLSL, and the sky gradient
remain separate native feature work rather than silent claims of support.

### Raycaster texture + effects stereo resolution (2026-10-31)

Two additional baseline RAF failures now mount and submit non-empty R1 draw
plans without init/RAF error cards (baseline-only arithmetic: 91/107, 85.0%;
orchestrator matrix rerun still required):

- raycaster-texture: the primary init abort was `drawImage source is not
  local RGBA`; the recurring undefined-`offset` RAF error was only its
  incomplete-init cascade. Native `<img>` assets now decode through the host
  RGBA lane with natural dimensions, and the bounded software canvas supports
  source-rect `drawImage` plus local path fill/stroke. All three meshes share
  the real 1024×1024 decoded UV grid with the yellow cross rasterized into
  their raw texture uploads; byte-level regression coverage checks both.
- effects-stereo: the six pinned Park3Med faces produce exactly two raw
  six-face cube atlases (background + sphere environment), and the official
  500-sphere scene renders with its skybox and no RAF `textureType` errors.
  Cube refraction retains the existing explicit reflection degrade warning.
  Side-by-side eye rectangles are now serialized, applied and asserted by the
  bounded render-target/viewport phase below.

Regression coverage: `js_three_raycaster_texture_example_test.dart` and
`js_three_effects_stereo_example_test.dart`. Both fixes are example-side; no
native_renderer.js or lib/** change was required.

### Bounded native shader/line resolution (2026-10-31)

Eight assigned baseline RAF failures now submit real, non-empty R1 draw plans
without RAF errors or planner warnings:

- buffergeometry-attributes-none: the bounded gl_VertexID hash shader is
  evaluated once into position/color attributes (one meshBasic triangle draw,
  30,000 vertices).
- buffergeometry-selective-draw: visible/vertColor shader inputs are baked to
  filtered native line segments every update (one vertex-colored line draw).
- instancing-dynamic: an optional PMREM scene environment now degrades
  explicitly to direct lighting instead of aborting init before Timer creation
  (one 36-vertex instanced meshStandard cube draw, one texture).
- interactive-points and points-waves: the fixed point-shader profiles become
  native textured/vertex-colored PointsMaterial draws (1,538 and 2,500 points;
  one texture each). Per-point sizes are explicitly represented by their mean.
- lines-dashed: dash/gap intervals are tessellated to two real lineBasic draws;
  geometry/texture counters remain flat while static.
- lines-fat: Line2 instanceStart/instanceEnd/color data becomes one native
  1,534-vertex line-segment draw. Linewidth/alphaToCoverage loss is warned.
- modifier-tessellation: amplitude/displacement and the bounded directional
  color calculation are evaluated on the CPU (one vertex-colored meshBasic
  triangle draw, 32,442 vertices).

Regression coverage: `js_three_bounded_shader_render_test.dart` and
`js_three_lines_instancing_render_test.dart`. Adapted geometry/material
resources are disposed when replaced; unrecognized ShaderMaterial profiles
still fail loudly rather than masquerading as supported GLSL.

The other five assigned examples are blocked outside native_renderer.js, with
these verified handoff requirements:

- morphtargets: native rendering is already healthy (one meshPhong draw,
  36,864 vertices, no warnings). Its prepared widget predates the current
  appendMainCanvas GUI/mount fix; re-prepare it with the current adapter.
- modifier-edgesplit: register pinned Cerberus.obj and Cerberus_A.jpg. With
  only those bytes injected, the unmodified native path renders one
  meshStandard triangle draw with 100,623 vertices.
- instancing-performance: register suzanne_buffergeometry.json and provide
  bounded local-div `classList` plus NativeFolder `$children` DOM sinks. Init
  currently stops at `j.classList.add('gui-stats')` before the model load.
  With bytes and those two DOM operations injected, one instanced meshNormal
  draw renders 2,901 vertices / 967,000 triangles at the official count 1,000.
- loader-pcd: register binary/Zaghetto.pcd and extend addColor to bounded
  THREE.Color objects (getHex/setHex), not only number/string properties. The
  binary PCD lane itself renders one pointsBasic draw with 59,750 points when
  the asset is injected and render is forced before the GUI exception.
- modifier-simplifier: the mesh renders (two 53,052-vertex meshStandard draws
  when render is forced before the await), but SimplifyModifier awaits the
  bundled WASM MeshoptSimplifier and never reaches its first render. Add an
  addonShims entry for three/addons/modifiers/SimplifyModifier.js implementing
  an async, deterministic CPU triangle-reduction profile (sample complete
  source triangles, preserve standard attributes, warn about reduced quality)
  without importing meshopt_simplifier.module.js.

## NEW GOAL (2026-10-31, user directive)

FULL coverage of official three.js examples that use JS/WebGL (exclude
CSS/HTML-only examples: css3d_*, svg, DOM-only). The 80% target is superseded.
Also: three.js audio (THREE.AudioListener/Audio/PositionalAudio/AudioLoader)
must be supported upstream-style. Remaining bounded gaps to eliminate with
real features (not silence): render targets (rtt, anaglyph), arbitrary GLSL
(shader), then expand prepare/registration beyond the current 107 examples.

### Native WebAudio resolution (2026-10-31)

THREE.AudioListener, Audio and PositionalAudio now retain the real upstream
r186 classes and run over bounded native WebAudio nodes. AudioLoader keeps the
upstream callback/error contract and passes encoded bytes (with bounded MIME
and duration inspection, not PCM decoding) to the media host. The `three.audio`
host lane enforces engine/source/byte quotas and routes play, pause, stop,
volume, loop, rate, balance, delay and disposal through JsMediaHost. The
example host uses audioplayers BytesSource, including source preparation before
seek, playback-rate and stereo-balance transport. Pointer input starts the
official overlay buttons and resumes AudioContext, so sound remains gated by a
user gesture.

PositionalAudio updates come from upstream world matrices. Inverse, linear and
exponential rolloff, directional cones and listener-relative stereo pan are
covered against the WebAudio formulas. AnalyserNode explicitly warns and
returns zero-filled data instead of claiming FFT support. Media-element audio
is supported for the orientation example; media-stream audio remains an
explicit capability error.

Official `webaudio_timing` and `webaudio_orientation` are prepared, registered
and covered by real-QuickJS render/gesture/audio regression tests. Orientation
also externalizes BoomBox's embedded WebP images as PNG, retains its base PBR
and normal detail, and loudly peels only unsupported ao/emissive maps and line
material groups. Regression files: `js_three_audio_host_test.dart`,
`js_three_audio_quickjs_test.dart`, `js_three_webaudio_examples_test.dart`, and
`tool/three/test/native_audio_test.js`.

### Bounded R1 render-target and eye-rectangle resolution (2026-10-31)

R1 v6 adds bounded 2D RGBA8 render targets (optional depth, at most 16 live
targets / 16 Mpixels per target), target upsert/disposal opcode 14, and a
versioned 60-byte frame trailer carrying target ID/size, viewport, scissor and
clear flags. `setRenderTarget`, `setViewport`, `setScissor`, scissor testing,
explicit/auto clear and target resize/disposal now retain upstream state. The
GPU host allocates target attachments, records offscreen passes before their
dependent surface passes, rejects active-target feedback, binds target color
as a texture, converts bottom-left Y and applies DPR exactly once. Legacy v5
streams retain their old default-framebuffer behavior.

The two required fullscreen ShaderMaterial profiles have bounded native
implementations: RTT's animated procedural quad is evaluated into native
vertex colors and its tDiffuse screen pass uses the existing textured pipeline;
AnaglyphEffect's exact Dubois 3x3 matrices and left/right target samplers use a
dedicated fragment branch. Adaptations are cached and bounded. Arbitrary GLSL
still fails loudly. Empty asynchronously-loading cube arrays are treated as
not-ready rather than throwing, and upstream FullScreenQuad's Object3D render
root is accepted.

Regression coverage: `js_three_render_target_effects_test.dart` (RTT and
anaglyph real draws, target order and bounded resources),
`js_three_effects_stereo_example_test.dart` (distinct left/right viewport and
scissor rectangles), target/protocol/state/atomic-quota cases, and GPU DPR/Y
conversion tests. The R1 shader bundle compiles. Within the current 107-example
matrix this closes two native gaps: expected 106/107 with only `three-shader`
(arbitrary GLSL) remaining as the documented gap.

## Phase 2 results (audio + render targets)

Matrix: 106/109 (97%). three-rtt and three-effects-anaglyph now render via
bounded R1 v6 render targets (opcode 14, frame trailer, anaglyph kind 11,
Dubois GPU composite) + per-pass viewport/scissor. Only three-shader
(arbitrary GLSL) remains a documented gap.
The two webaudio examples show mounted=false in the MATRIX harness only
(the matrix does not inject a media host); their dedicated QuickJS tests
with the audio host pass (js_three_webaudio_examples_test.dart).
Audio: real upstream AudioListener/Audio/PositionalAudio over bounded native
AudioContext + JsThreeAudioHost -> JsMediaHost (audioplayers), autoplay
gesture unlock, upstream rolloff/cone/pan math. CRAP follow-up: 4 RT GPU
functions being split to CC<=3 (rendertargets).
