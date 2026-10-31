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

## Full official r186 catalog expansion

Inventory: 299 `webgl_*` + 4 `webaudio_*` = 303 official JS/WebGL/audio
examples. All 303 now have pinned definitions in `prepare.mjs` and CLI prepare
entries; no CSS/HTML-only or other official ID was silently skipped. The 191
missing definitions were generated with HTML/module SHA-256 pins. Batch prepare
attempted those 191 plus three older unprepared definitions, without rebuilding
the original 109 widgets. 173 new widgets prepared and registered (171 WebGL +
2 WebAudio), for 282/303 registered total (278/299 WebGL + 4/4 WebAudio).

Reusable tooling: `tool/three_example/generate_missing_examples.py` (inventory,
definition generation, prepared-only runner/pubspec registration) and
`tool/three_example/prepare_missing.py` (offline batch prepare + per-ID logs).
Prepare results: `/tmp/three_prepare_results.json`; logs:
`/tmp/three_prepare_logs/`.

### Prepare failures (21, all WebGL)

- **Forbidden external bare imports (12):**
  `webgl_batch_lod_bvh` (@three.ez/simplify-geometry),
  `webgl_geometry_csg` (three-bvh-csg),
  `webgl_loader_3dtiles` (3d-tiles-renderer plus postprocessing/@takram plugins),
  `webgl_loader_gltf_animation_pointer` (@needle-tools/three-animation-pointer),
  `webgl_loader_gltf_progressive_lod` (@needle-tools/gltf-progressive),
  `webgl_loader_ifc` (web-ifc),
  `webgl_materials_texture_html` (three-html-render/polyfill),
  `webgl_modifier_subdivision` (three-subdivide),
  `webgl_postprocessing_godrays` (goodrays),
  `webgl_raycaster_bvh` (three-mesh-bvh),
  `webgl_renderer_pathtracer` (three-gpu-pathtracer),
  `webgl_watch` (tween).
- **Unmapped three/webgpu or three/tsl imports (4):**
  `webgl_tsl_clearcoat`, `webgl_tsl_instancing`, `webgl_tsl_shadowmap`,
  `webgl_tsl_skinning`.
- **Remote CDN imports / module-format blockers (3):**
  `webgl_loader_texture_lottie` (lottie-web CDN),
  `webgl_loader_ttf` (opentype.js CDN),
  `webgl_morphtargets_webcam` (MediaPipe CDN plus top-level await under es2020).
- **Second core import outside finite roots (1):**
  `webgl_worker_offscreencanvas` (examples/jsm/offscreen/scene.js imports
  build/three.module.js instead of the facade).
- **Unsupported prepared asset type (1):** `webgl_loader_svg` (image/svg+xml).

### Full matrix (282 prepared examples)

`flutter test test/zz_three_matrix_test.dart --reporter expanded` completed all
282 cases in 12m44s with no test-harness failures. Render means mounted=true,
submitted>0 and draws>0. RAF-errors includes mounted scenes with submitted=0;
RAF failures are reported asynchronously in the runner log rather than thrown
into the JSONL error field.

| Result | Count |
|---|---:|
| renders | 135 |
| RAF-errors / no submitted frame | 79 |
| init-aborts (mounted=false) | 40 |
| submitted frames but draws=0 | 28 |
| **Total** | **282** |

The original 109 IDs have no status changes: all 106 baseline renders still
render, the two original WebAudio cases remain matrix-host-limited, and
`three-shader` remains the known arbitrary-GLSL gap. New-entry tally:
29 renders / 78 RAF-errors / 38 init-aborts / 28 draws=0 (173 total).

Raw results: `/tmp/three_matrix.jsonl` (282 unique IDs); summary:
`/tmp/three_matrix_summary.json`; full log: `/tmp/three_matrix_run.log`;
per-example logs: `/tmp/three_matrix_logs/`.

### Broken-list triage (147 primary blockers, each ID listed once)

Asset-first includes 44 log-confirmed `ThreeAssetError: no host asset loader is
configured` cases plus 31 silent cases with official local/remote asset
references and no completed render. Re-triage the latter after pinning because
later native gaps can be masked. Explicit-native groups below come directly
from representative per-example logs.

- **Asset pins / unavailable remote assets (asset-first) (75)**
  three-animation-keyframes, three-animation-skinning-additive-blending, three-animation-skinning-ik,
  three-animation-walk, three-custom-attributes-lines, three-gpgpu-birds-gltf, three-gpgpu-water,
  three-lightprobe, three-lightprobe-cubecamera, three-loader-3dm, three-loader-3ds, three-loader-3mf,
  three-loader-collada, three-loader-collada-kinematics, three-loader-draco, three-loader-gcode,
  three-loader-gltf, three-loader-gltf-anisotropy, three-loader-gltf-avif, three-loader-gltf-compressed,
  three-loader-gltf-dispersion, three-loader-gltf-instancing, three-loader-gltf-iridescence,
  three-loader-gltf-sheen, three-loader-gltf-transmission, three-loader-gltf-variants, three-loader-kmz,
  three-loader-ldraw, three-loader-mdd, three-loader-nrrd, three-loader-pdb, three-loader-texture-exr,
  three-loader-texture-hdr, three-loader-texture-ktx2, three-loader-texture-tiff, three-loader-usdz,
  three-loader-vox, three-loader-vrml, three-materials-car, three-materials-cubemap-dynamic,
  three-materials-cubemap-mipmaps, three-materials-cubemap-render-to-mipmaps, three-materials-envmaps-exr,
  three-materials-envmaps-fasthdr, three-materials-envmaps-groundprojected, three-materials-envmaps-hdr,
  three-materials-physical-transmission, three-materials-physical-transmission-alpha,
  three-materials-texture-manualmipmap, three-modifier-curve, three-modifier-curve-instanced,
  three-morphtargets-face, three-morphtargets-horse, three-multiple-rendertargets, three-performance,
  three-pmrem-cubemap, three-pmrem-equirectangular, three-pmrem-test, three-points-dynamic,
  three-postprocessing-3dlut, three-postprocessing-advanced, three-postprocessing-gtao,
  three-postprocessing-outline, three-postprocessing-ssr, three-postprocessing-unreal-bloom, three-random-uv,
  three-refraction, three-rendertarget-texture2darray, three-test-wide-gamut, three-texture2darray,
  three-texture2darray-compressed, three-texture2darray-layerupdate, three-texture3d, three-tonemapping,
  three-volume-instancing

- **unsupported ShaderMaterial (7)**
  three-buffergeometry-attributes-integer, three-custom-attributes, three-lightprobes-sponza,
  three-lights-sunlight, three-mirror, three-postprocessing-procedural, three-shader

- **unsupported instancedGeometry (4)**
  three-buffergeometry-instancing, three-buffergeometry-instancing-billboards,
  three-buffergeometry-instancing-interleaved, three-lines-fat-wireframe

- **unsupported RawShaderMaterial (4)**
  three-buffergeometry-rawshader, three-ubo, three-ubo-arrays, three-volume-perlin

- **RAF cascade: 'update' of undefined (4)**
  three-clipculldistance, three-effects-ascii, three-shaders-ocean, three-shadowmap-progressive

- **unsupported materialState (alphaHash/premultipliedAlpha/colorWrite/stencil) (2)**
  three-clipping-stencil, three-shadowmesh

- **renderTarget: only one 2D RGBA8 target + optional depth (3)**
  three-depth-texture, three-postprocessing-masking, three-postprocessing-pixel

- **renderTargetTexture: requires linear non-mipmapped RGBA8 (16)**
  three-interactive-cubes-gpu, three-materials-alphahash, three-portal, three-postprocessing,
  three-postprocessing-afterimage, three-postprocessing-backgrounds, three-postprocessing-dof,
  three-postprocessing-dof2, three-postprocessing-rgb-halftone, three-postprocessing-sao,
  three-postprocessing-sobel, three-postprocessing-ssaa, three-postprocessing-ssao, three-postprocessing-taa,
  three-read-float-buffer, three-shader-lava

- **compressed texture path: unsupported textureType(1009) (2)**
  three-loader-texture-dds, three-loader-texture-pvrtc

- **RAF cascade: 'material' of undefined (2)**
  three-texture3d-partialupdate, three-volume-cloud

- **Other explicit native/runtime signatures (11)**
  three-buffergeometry-glbufferattribute (GLBufferAttribute path: 'geometry' of undefined), three-gpgpu-birds
  (GPUComputationRenderer cascade: 'time' of undefined), three-gpgpu-protoplanet (GPUComputationRenderer
  cascade: 'texture' of undefined), three-lights-rectarealight (unsupported RectAreaLight),
  three-loader-texture-ktx (render requires an Object3D), three-materials-blending-custom (unsupported
  materialBlending), three-mesh-batch (unsupported BatchedMesh objectType), three-postprocessing-smaa (SMAA pass
  cascade: 'enabled' of undefined), three-shaders-sky (CubeCamera coordinateSystem is undefined),
  three-shadow-contact (unsupported scene overrideMaterial), three-shadowmap-csm (unsupported onBeforeCompile
  arbitrary shader)

- **Silent native/DOM paths (no host exception) (9)**
  three-multiple-elements, three-multiple-elements-text, three-multisampled-renderbuffers,
  three-postprocessing-fxaa, three-postprocessing-glitch, three-postprocessing-unreal-bloom-selective,
  three-reversed-depth-buffer, three-shadowmap-viewer, three-test-memory2

  - multiple-elements and multiple-elements-text require HTML layout/scissor
    integration; multisampled-renderbuffers, postprocessing-fxaa,
    postprocessing-glitch and postprocessing-unreal-bloom-selective stop during
    composer/target setup; reversed-depth-buffer needs reversed depth;
    shadowmap-viewer stops in shadow-viewer setup; test-memory2 uses arbitrary
    ShaderMaterial. These need follow-up diagnostics after the logged groups.

- **HTML video / camera media paths (4)**
  three-materials-video, three-materials-video-webcam, three-video-kinect, three-video-panorama-equirectangular

  materials-video and video-panorama-equirectangular need HTML video transport;
  materials-video-webcam needs a camera; video-kinect also needs its HTML video
  assets and custom ShaderMaterial.

- **WebAudio matrix host/gesture limitation (4)**
  three-webaudio-orientation, three-webaudio-sandbox, three-webaudio-timing, three-webaudio-visualizer

  The matrix supplies no media host or user gesture. Orientation/timing already
  pass their dedicated audio-host tests; sandbox/visualizer are prepared and
  registered but still need equivalent dedicated audio-host coverage. These four
  mounted=false matrix results are not evidence of a native draw-plan regression.
