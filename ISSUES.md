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
| 14 | animation keyframes | Empty sky; city absent | decoded GLB / transient skin bounds / PMREM lighting | FIXED (native visual verified) — `/tmp/three_visual/three-animation-keyframes/ours.png` shows the full Tokyo city at 106.39 presented FPS. The decoded GLB retains all 214 nodes / 71 meshes / 141,802 model triangles and official camera + 0.01 scale. The adapter avoids incompatible transient skin frustum bounds, supplies native hemisphere/directional lighting after the explicit PMREM omission, and bounds the fallback Sky inside the far plane; 72 draws / 141,814 triangles submit |
| 15 | morph targets webcam | Distorted face, black eye holes, off-center tiny head | meshopt interleaving / morph storage / mirrored PBR eyes | PARTIAL / DOCUMENTED DEGRADE — morph base/targets are deinterleaved and converted to normalized Float32; all 52 morphs match upstream position/normal parity. Native capture `/tmp/three_visual/three-morphtargets-webcam/ours.png` is centered with no black holes at 119.88 presented FPS, and 8,044 triangles submit. Mirrored Standard eyes now retain their real atlas on Lambert, but render as white cartoon balls and are not visual parity with the official normal-shaded face; MediaPipe/video degrades and this remaining material/face-silhouette gap are explicit |
| 16 | batch LOD BVH | Black scene despite planned triangles | bounded BatchedMesh / omitted PMREM | FIXED AS DOCUMENTED DEGRADE — centered sampling retains 128 visible instances with real matrices/colors; environment-only scenes receive a warned neutral environment and split diffuse/specular IBL. Native capture has 10 instanced calls / 2,097,152 triangles at 119.82 presented FPS. This is not 500k/full LOD/BVH parity |
| 17 | geometry CSG | Low FPS from repeat CSG work | bounded CSG caching | IMPROVED, NOT FULL PARITY — exact-input cache hits and four-evaluation transform refresh avoid per-frame structural recompute. Native stable window: 27.96 presented FPS vs browser RAF 60.4; QuickJS work improved from roughly 166 to 57 ms/frame. Evaluation spikes remain |
| 18 | points billboards | Completely black particle scene | Points fragment UV | FIXED (native visual verified) — mapped Points now sample per-fragment `gl_PointCoord`, not the absent mesh `uv` attribute (which selected the transparent sprite corner and discarded every particle). Native capture shows the particle field at 119.88 presented FPS |
| 19 | geometry shapes | Most Phong solids black | PointLight attenuation | FIXED (native visual verified) — point-light `decay` rides the light uniform; official `decay=0` now disables inverse-square attenuation while decay 2 retains it. Native capture shows the colored solid shape zoo at 120.32 presented FPS |
| 20 | morph targets / PLY / STL / displacement | Saturated or wrong material colors | PointLight attenuation | FIXED (native visual verified) — R1 v7 carries PointLight `decay` and cutoff distance instead of silently reducing decay to zero. Morphtargets, morphtargets-sphere (modulo animation phase), loader-ply, loader-stl and materials-displacementmap were manually reclassified as similar; morphtargets-face, marchingcubes and shadowmap-pointlight remain open |
| 21 | loader SVG | Black tiger / incorrect transparent fill ordering | SVG inline style + renderOrder | FIXED (native visual verified) — the bounded XML DOM exposes inline `style` to SVGLoader, and R1 v7 preserves upstream `Object3D.renderOrder` through opaque/transparent sorting. Regression: 305 calls, 304 ordered transparent nodes and nonblack materials; native pair shows the colored tiger |
| 22 | animation multiple / skinning blending | White, untextured shared models | bundled QuickJS Blob binding | FIXED (native visual verified) — the adapter's bundle-local `Blob` binding lets GLTFLoader load both embedded JPEGs. Regression verifies decoded textures and nonzero maps on every Standard-material Soldier draw; both native pairs now show textured models and were reclassified as similar |
| 23 | animation walk | White metallic Soldier despite decoded maps | PMREM / metallic shading | OPEN — the official example intentionally sets metalness 1 and uses the base map as metalnessMap; embedded-image loading is fixed, but the native direct-light-only fallback still lacks the reference environment response. Do not reclassify this as a Blob fix |
| 24 | multiple views / camera array | Only one view; ArrayCamera ignored subcameras; DPR-doubled viewports | animation batching / ArrayCamera / resize | FIXED (native visual verified) — each animation callback now sends one R1 envelope with one transport sequence, ArrayCamera expands to bounded scissored subcamera passes, and host resize synchronizes renderer/canvas DPR. The 64-pass composite retains the official 6×6 grid; both pairs are similar (multiple-views MAE 0.0183, camera-array modulo animation phase) |
| 25 | loader collada skinning | Missing DAE/JPEG assets; production-isolate capture remains blocked | asset discovery / startup | PARTIAL — prepare now discovers and registers both Stormtrooper assets; the QuickJS draw-plan regression and a direct-engine native capture show the textured skinned mesh. The production-isolate capture still submitted no R1 frames within its 30-second first-frame window, so it is not reclassified as native production parity |
| 26 | postprocessing godrays | Terminal point-shadow pump failure repeated until host teardown | point shadows / Metal encoding / pump lifecycle | FIXED (native visual verified) — point shadows use integer light-type selection, a 64-byte material ABI, explicit shader varying locations, a non-shadow fallback texture and separate front/back command buffers. Surface errors stop further pumps and retain their stack. Native steady window: 120 FPS with no pump errors. Real-GPU RGBA regressions cover both the official direct pass (red backdrop remains visible) and a cached 1024² point-shadow/basic-material scene. The direct scene is intentionally dark; `GodraysPass` and volumetric-light parity remain omitted |
| 27 | loader glTF progressive LOD | Oversized/cropped local stand-ins | offline replacement framing | FIXED AS DOCUMENTED DEGRADE — the city and Horse now compose the official extra scales to final 0.01. Native capture shows the complete framed scene; remote Needle progressive content remains replaced |
| 28 | loader glTF animation pointer | White and oversized Horse | environment-only IBL / offline replacement framing | FIXED AS DOCUMENTED DEGRADE — split diffuse/specular environment lighting preserves albedo at roughness 1, and the Horse stand-in composes to final 0.01. Native capture is centered, lit and fully framed |
| 29 | materials texture HTML | Black/untextured cube | HTML texture placeholder / environment-only IBL | FIXED AS DOCUMENTED DEGRADE — the 256×256 checker RGBA placeholder is uploaded and visible after split diffuse/specular IBL. Browser HTML layout/rasterization remains unavailable |
| 30 | loader texture lottie | Only 12–16 FPS despite cheap GPU frames | Canvas2D host readback | FIXED (native visual verified) — the bounded 12-rectangle animation uses a 192×192 canvas instead of 512×512, avoiding a 1 MiB RGBA host round trip 25 times/sec. Native capture shows 120 presented FPS; real Lottie vector playback remains a degrade |
| 31 | animation skinning IK | `renderOrder=Infinity` rejected by the float32 protocol | native object traversal | FIXED — non-finite render order maps to finite 1e30 before encoding. Regression observes the f32 value above 9e29 and healthy consecutive frames; native 20-second run has no protocol errors |

## Visual + presented-FPS matrix (2026-11-01)

The corrected full-size native harness completed all 303 registered examples
serially. Official references: 303 OK / 0 black-or-empty. Native captures:
280 OK / 23 timeouts / 16 black-or-empty; no mass `-9` parallel-run failures.
Every available pair was visually reviewed, rather than accepting normalized
MAE as parity. Final accounting in `doc/three_visual/summary.json`:

- **96 similar** (allowing animation phase / stochastic layouts);
- **5 documented degrades**;
- **163 materially different** (these remain rendering/presentation work, not
  claimed fixes);
- **39 blocked** by timeout, black/empty output, or unavailable pixels.

The screenshot harness records a separate two-second steady-state window in
`ours.json.performance`: `presentedFps`, `sampleMs`, and
`presentedFramesDelta`. There are 236 native FPS measurements, median 119.88.
Multi-canvas examples can aggregate presentations (the 942 FPS maximum is not
single-scene vsync FPS), so compare per-example windows rather than treating
the aggregate maximum as a renderer benchmark. Durable pairs and verdicts are
in `doc/three_visual/`; `index.html` displays each native FPS beside its pair.

## Notes

- #4 root so far: HDRCubeTextureLoader shim now loads 6 RGBE faces (transcoded
  to raw RGBA at prepare); official onLoad callback throws
  `TypeError: not a function` before scene.background/environment are set.
- Interaction issues (#2/#3/#8) may be per-example event wiring (pointer vs
  document listeners) — check `example_adapter.js` event fan-out.
- Performance issues (#9/#12/#13) need per-frame diagnostics (triangles,
  uploads, plan cost) before optimizing.
- #14/#15 A/B regression evidence: the original pinned widgets fail the new
  probes (`frustumCulledMeshes=72`, interleaved morph attributes=true), while
  `/tmp/keyframes-regression-after.log` and
  `/tmp/webcam-regression-after.log` pass. Final two-case matrix:
  `/tmp/three_matrix_models_after.jsonl` (72 and 5 draws, zero planner
  warnings). Native AFTER evidence is `/tmp/three_models_fixed.jpg`: #14 is
  visually resolved; #15 remains the explicitly documented non-parity degrade
  above rather than a fixed-pending claim.

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

### Prepare failures (21, all WebGL) — RESOLVED

All 21 now prepare offline, are registered in the 303-entry catalog, and render
through the native R1 path. The final focused matrix is in
`/tmp/three_gap_matrix.jsonl`: 21/21 mounted, 21/21 submitted at least one real
frame, 21/21 produced draws, with no JS errors or planner warnings. The durable
regression suite is `test/three_example_gap_render_test.dart` and reuses
`test/support/three_example_render_contract.dart`; its 21/21 cases pass. Every
example also passes a second `prepare --offline --verify` reproducibility check
(`/tmp/three_gap_verify.log`).

| Official example | Result |
|---|---|
| `webgl_batch_lod_bvh` | **Warned bounded degrade:** 128 centered, colored instances render as per-geometry native instanced draws; a warned neutral environment preserves Standard-material illumination without PMREM prefiltering. Source geometry is reused across LODs and radix/BVH acceleration is omitted. |
| `webgl_geometry_csg` | Prepared/rendering; vendored `three-bvh-csg` uses a bounded single-entry evaluation cache with immediate structural invalidation. |
| `webgl_loader_3dtiles` | **Warned bounded degrade:** surrounding scene renders with pinned local geometry; remote ion/tile traversal and the large renderer/plugin/WASM stack are not attempted. |
| `webgl_loader_gltf_animation_pointer` | **Warned bounded degrade:** vendored Needle entry API, fully framed/lit pinned local glTF stand-ins, native raycast/pointer fan-out; remote Needle payloads are not fetched. |
| `webgl_loader_gltf_progressive_lod` | **Warned bounded degrade:** vendored Needle entry API and fully framed pinned local glTF stand-ins; remote progressive LOD payloads are not fetched. |
| `webgl_loader_ifc` | **Warned bounded degrade:** surrounding native mesh renders; web-ifc WASM parsing/execution is intentionally not bundled. |
| `webgl_materials_texture_html` | **Warned bounded degrade:** a 256×256 checker RGBA placeholder uploads through the native texture path; browser HTML layout/rasterization is unavailable. |
| `webgl_modifier_subdivision` | Prepared/rendering; vendored `three-subdivide`. |
| `webgl_postprocessing_godrays` | **Warned bounded degrade:** native point shadows and the official `RenderPass` render; `GodraysPass` is deliberately omitted (no native godrays-effect parity). |
| `webgl_raycaster_bvh` | Prepared/rendering; vendored `three-mesh-bvh`, with native static indexed-mesh raycast acceleration. |
| `webgl_renderer_pathtracer` | **Warned bounded degrade:** direct native scene rendering remains active; GPU path tracing and its large runtime are not attempted. |
| `webgl_watch` | Prepared/rendering; vendored `@tweenjs/tween.js`. |
| `webgl_tsl_clearcoat` | **Warned WebGL2 fallback:** equivalent clearcoat scene; the official module is WebGPU/TSL-only and has no official WebGL fallback. |
| `webgl_tsl_instancing` | **Warned WebGL2 fallback:** equivalent instanced scene; no official WebGL fallback exists. |
| `webgl_tsl_shadowmap` | **Warned WebGL2 fallback:** equivalent shadow scene; no official WebGL fallback exists. |
| `webgl_tsl_skinning` | **Warned WebGL2 fallback:** equivalent skinned scene using the pinned official glTF; no official WebGL fallback exists. |
| `webgl_loader_texture_lottie` | **Warned bounded degrade:** vendored `lottie-web` light HTML player API; browser vector rendering is replaced by a 192×192 native-canvas animation while retaining frame/transport behavior. The cap avoids starving THREE RAF with 512×512 host RGBA readbacks. |
| `webgl_loader_ttf` | Prepared/rendering; vendored `opentype.js`. |
| `webgl_morphtargets_webcam` | **Warned bounded degrade:** pinned official face glTF and native morph animation render; MediaPipe/camera inference is not bundled. |
| `webgl_worker_offscreencanvas` | Prepared/rendering; the second `build/three.module.js` import maps to the single-core facade and the Worker lane is bounded to one native canvas. |
| `webgl_loader_svg` | Prepared/rendering; all pinned SVG assets are transcoded to PNG at prepare with `qlmanage`, with source/output SHA-256 pins. |

### Visual correctness follow-up: batch LOD BVH and CSG (2026-11-01)

The earlier matrix counted planned draws, which hid an empty presented batch
scene. The 128-instance cap retained the first row of the official 500,000-item
grid around z=-1940, so its aggregate bounding sphere was outside the camera;
the native path also collapsed `BatchedMesh` to one ordinary shared-geometry
mesh. Centered bounded sampling now retains 128 instances around the camera
target, and native per-geometry `InstancedMesh` proxies preserve their matrices,
colors, visibility and instance-aware culling. Before: renderer calls=0 and
main triangles=0 (one planned draw, all culled). After: 10 presented instanced
calls, 128 instances and 2,097,152 main triangles; geometry/batch uploads stay
flat at 10/10 over 12 frames.

A subsequent real-GPU capture exposed a second black-screen cause despite those
valid draw counts. Camera-space diagnostics put sampled instances inside NDC
with valid view Z and nonzero colors, but the submitted scene had black ambient,
zero lights, and fully metallic `MeshStandardMaterial` with no environment map
or emissive contribution. The official RoomEnvironment was its only illumination,
so omitting PMREM produced black metal on a black clear. The bounded BatchedMesh
path initially used an unlit fallback. The general native `fromScene` degrade
now supplies a warned 1×1 neutral environment instead, and split diffuse /
specular IBL retains the source Standard materials and their maps. The draw-plan
regression pins meshStandard + nonzero environment ids with identical instance
transforms, colors and triangle counts; this is not PMREM prefiltering parity.

CSG was recomputing and uploading on every animation tick (12 frames produced
11 additional geometry and batch uploads; about 166 ms/frame in the QuickJS
harness). A bounded single-entry evaluator cache now returns identical results
for unchanged inputs and refreshes animated transforms every four calls;
operation, geometry, material, target and evaluator-option changes invalidate
immediately. The official 12-frame run reports 3 evaluations + 8 transform
skips, only 3 additional geometry/batch uploads, and about 57 ms/frame over the
measured post-first-frame interval. Skipped frames have identical draw content
and no geometry/batch upload. This remains a warned degrade: animated CSG
refreshes at a bounded cadence and evaluation frames still have a CPU spike;
neither full 500,000-instance LOD/BVH parity nor stock per-tick CSG is claimed.

Focused evidence: `/tmp/three_batch_csg_before.jsonl`,
`/tmp/three_batch_csg_after.jsonl`, `/tmp/three_batch_csg_after.log`.
Regression coverage: `js_three_batch_csg_regression_test.dart` (4/4), including
presented draw-plan triangles, instance colors/counts, stable static uploads,
official CSG no-upload intervals and evaluator cache/invalidation counters.

Vendored package versions, entry/license paths, and entry SHA-256 digests live in
`tool/three_example/vendor/lock.json`; prepare import rewrites resolve only those
pins. The four WebGPU-only examples are explicit prepared WebGL fallbacks rather
than silent platform-unsupported failures.

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

- **Asset pins / unavailable remote assets — discovery completed (75; 26 rendering, 49 re-triaged)**
  `prepare.mjs` now auto-discovers official local URLs and loader `setPath` / array
  references, recursively expands glTF/bin/image and embedded-GLB dependencies, and
  emits deterministic sha256 pins. All 75 manifests contain discovered pins (295
  entries, including raw JPEG/PNG lanes, HDR RGBA, GIF-to-PNG and exact `/./`
  aliases). LUTs and UltraHDR JPEG are included. Regression:
  `node tool/three_example/test/asset_discovery_test.mjs`; all 75 also pass
  `discover_assets.mjs <webgl_id> --verify`. Batch entry point:
  `prepare_asset_group.mjs --ids-file <file>`.

  Final matrix: 74 completed cases plus the reproducible collada-kinematics boot
  hang; 26 render with mounted=true, submitted>0 and draws>0. Results:
  `/tmp/three_asset_matrix_final_combined.jsonl`; logs:
  `/tmp/three_asset_matrix_logs_final/` (the last single-case 3dlut check is in
  `/tmp/three_asset_matrix_3dlut_run.log`). Rendering IDs:
  three-animation-walk, three-gpgpu-birds-gltf, three-loader-3ds, three-loader-gcode,
  three-loader-gltf, three-loader-gltf-dispersion, three-loader-gltf-instancing,
  three-loader-gltf-variants, three-loader-mdd, three-loader-nrrd, three-loader-pdb,
  three-loader-texture-exr, three-loader-texture-hdr, three-loader-texture-tiff,
  three-loader-vox, three-materials-physical-transmission,
  three-materials-physical-transmission-alpha, three-morphtargets-horse,
  three-points-dynamic, three-postprocessing-advanced, three-postprocessing-outline,
  three-postprocessing-unreal-bloom, three-refraction, three-texture2darray,
  three-texture3d, three-volume-instancing.

  The remaining 49 are asset-complete except for the two explicitly unavailable
  externals below; they are re-triaged rather than left in the silent asset bucket:

  - **Draco / Basis / KTX2 decoder-transcoder paths (18; all 18 render)**:
    three-animation-keyframes, three-animation-skinning-ik, three-gpgpu-water,
    three-loader-draco, three-loader-gltf-avif, three-loader-gltf-compressed,
    three-loader-gltf-transmission, three-loader-texture-ktx2, three-materials-car,
    three-materials-envmaps-fasthdr, three-materials-envmaps-groundprojected,
    three-morphtargets-face, three-postprocessing-gtao, three-postprocessing-ssr,
    three-random-uv, three-texture2darray-compressed,
    three-texture2darray-layerupdate, three-tonemapping. Prepare now uses the
    pinned official Draco asm.js, Basis transcoder and meshopt decoder to emit
    deterministic uncompressed GLB/geometry or bounded RGBA textures. Runtime
    loader facades consume those bytes without workers/WASM fetches; source and
    generated outputs remain sha256-pinned. SSR's later unqualified `innerWidth`
    facade gap is also fixed and its warned beauty-pass fallback renders.
  - **XML / model parser paths (5; all 5 render)**: three-loader-3mf,
    three-loader-collada, three-loader-collada-kinematics, three-loader-kmz and
    three-loader-vrml. A bounded vendored DOMParser covers the loaders' XML
    selector/attribute/text profile. VRML is parsed by the pinned official
    Chevrotain loader at prepare and reconstructed from bounded Object3D JSON;
    collada-kinematics uses an explicitly warned prepare-exported static robot
    (joint tweening omitted) to bound the former boot hang.
  - **R1 material / target / PMREM capabilities (17; all 17 render in the R1 capability resolution below)**:
    three-custom-attributes-lines (incompatible node object/geometry/material),
    three-loader-gltf-iridescence and three-loader-gltf-sheen (unsupported aoMap),
    three-materials-cubemap-dynamic (undefined CubeCamera coordinateSystem),
    three-materials-cubemap-mipmaps and three-materials-texture-manualmipmap
    (unsupported custom mipmaps), three-materials-cubemap-render-to-mipmaps,
    three-materials-envmaps-exr (`begin` of undefined RAF cascade),
    three-materials-envmaps-hdr, three-modifier-curve,
    three-modifier-curve-instanced (unsupported LineLoop),
    three-multiple-rendertargets, three-pmrem-cubemap,
    three-pmrem-equirectangular, three-pmrem-test, three-postprocessing-3dlut
    (raw-LUT canvas ingestion plus unsupported aoMap),
    three-rendertarget-texture2darray (one-2D-target-per-pass limit).
  - **Silent native / DOM / planner paths after pins (7; all 7 render)**:
    three-animation-skinning-additive-blending, three-lightprobe,
    three-lightprobe-cubecamera, three-loader-gltf-anisotropy, three-loader-usdz,
    three-performance and three-test-wide-gamut. The GUI `$children`/classList,
    bounded Blob/object-URL image and sequential loader-lifetime/matchMedia
    handoffs are resolved; the other four are covered by the R1 resolution below.
  - **Formerly unavailable external inputs (2; resolved/degraded explicitly)**:
    three-loader-ldraw now pins and renders the official packed
    `models/ldraw/officialLibrary/models/car.ldr_Packed.mpd` (186 draws). The
    r186 tree has no rhino3dm runtime, so three-loader-3dm renders a bounded
    placeholder with an explicit `rhino3dm decoder unavailable` warning; it is
    not counted as parsed Rhino content.

  Decoder/parser verification: all 26 targeted examples mount and produce draw
  plans (25 official-content scenes plus the warned 3DM placeholder). Including
  the additive-blending, USDZ Blob/object-URL and wide-gamut handoffs, the final
  29-case subset has 29/29 mounted with real draws (743 draws total).
  Consolidated structured evidence: `/tmp/decoder_final_29_matrix.jsonl`;
  provenance: `/tmp/decoder_final_matrix.jsonl`, the final SSR/wide-gamut rerun in
  `/tmp/decoder_remaining_final_matrix.jsonl`, and the post-canonicalization
  VRML/kinematics rerun in `/tmp/decoder_determinism_final_matrix.jsonl`.
  Repeated VRML and Collada-kinematics prepares are byte-identical (including
  canonicalized Object3D UUID references). Representative counts include
  VRML 218 draws, LDraw 186, animation-keyframes 72 and Draco 2.
  `node tool/three_example/test/asset_discovery_test.mjs` passes with
  deterministic pins plus XML selector/namespace/entity checks. Bounded warned
  degrades remain for VRML elevationGrid1 (serialized scene over 2,000,000
  bytes), alternate raw BC/ASTC/ETC KTX2 variants without a prepare decoder,
  SSR/reflector shader math, collada-kinematics joint tweening and the 3DM
  placeholder; none is a silent empty-scene fallback.

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

- **Silent native/DOM paths (no host exception) (9; 8 now render, 1 native spec open)**
  three-multiple-elements, three-multiple-elements-text, three-multisampled-renderbuffers,
  three-postprocessing-fxaa, three-postprocessing-glitch, three-postprocessing-unreal-bloom-selective,
  three-reversed-depth-buffer, three-shadowmap-viewer, three-test-memory2

  - FIXED in the example adapter: multiple-elements mounts the official `#c`
    canvas and provides bounded DOM rect/scissor clipping; multiple-elements-text
    restores six static `.view` elements, dispatches `window.onload`, and provides
    bounded Canvas2D arcs; shadowmap-viewer renders the main scene while explicitly
    omitting its ShaderMaterial HUD; test-memory2 retains all 100 sphere draws and
    material disposal with a warned static-color native material instead of
    arbitrary GLSL. The multi-scene global light-cap warnings remain explicit.
  - VERIFIED on the current native build: multisampled-renderbuffers,
    postprocessing-fxaa and postprocessing-unreal-bloom-selective submit native
    degraded draws. postprocessing-glitch also renders after its required
    `#startButton` pointer gesture; mounted=false in the gesture-less matrix is a
    host limitation, not a scene failure.
  - OPEN native spec for reversed-depth-buffer: `native_renderer.js:1117` rejects
    the second of three official WebGLRenderer instances on the shared `main`
    canvas. Add a supported shared-renderer reuse/factory path that preserves
    sequential viewport/scissor/target commands (do not merely clear private
    `_disposed` state). The constructor flags `logarithmicDepthBuffer` and
    `reversedDepthBuffer` currently have no native implementation; after shared
    renderer setup, either implement their projection/depth-range semantics with
    suitable DepthTexture precision or emit a once-per-renderer standard-depth
    degrade warning. No silent claim of reversed/logarithmic depth is acceptable.

- **HTML video / camera media paths (4; all render with explicit bounded degrades)**
  three-materials-video, three-materials-video-webcam, three-video-kinect, three-video-panorama-equirectangular

  The adapter now supplies local video/camera facades and converts VideoTexture
  to a warned 16x16 RGBA checker before native upload, so no case silently becomes
  a black frame. materials-video renders its 200-cell grid with postprocessing
  explicitly dropped; webcam renders 128 cells from a fake getUserMedia stream;
  panorama renders its sphere; kinect renders a warned static-color point cloud.
  Real frame/stream transport through JsMediaHost remains future feature work;
  these are deliberately bounded degrades, not claims of VideoTexture support.

- **WebAudio matrix host/gesture limitation (4; dedicated coverage complete)**
  three-webaudio-orientation, three-webaudio-sandbox, three-webaudio-timing, three-webaudio-visualizer

  All four now pass `js_three_webaudio_examples_test.dart` with QuickJS and an
  audio host. Sandbox proves gesture resume plus three media-source plays and one
  oscillator play; visualizer proves gesture resume/play and its warned native
  mesh/camera fallback with zero-filled analyser data. The matrix still supplies
  no media host or user gesture, so mounted=false sandbox/visualizer matrix
  results are not evidence of a native draw-plan regression.

Focused evidence: `js_three_media_dom_examples_test.dart` and
`js_three_webaudio_examples_test.dart`; matrix subset output
`/tmp/media_dom_matrix_final.jsonl`.

### Native restriction resolution (2026-10-31)

All 56 assigned native-restriction cases now submit non-empty native draw plans:
ShaderMaterial 7/7, instancedGeometry 4/4, RawShaderMaterial 4/4, undefined-update
RAF cascades 4/4, materialState 2/2, render-target restrictions 3/3,
render-target-texture restrictions 16/16, compressed texture types 2/2,
undefined-material cascades 2/2, other individual signatures 11/11, plus the
shared-renderer reversed-depth case. The final single matrix run is
`/tmp/native_final_all.jsonl` with log `/tmp/native_final_all.log`: 56/56 have
submitted>0 and draws>0 (2,503 submitted frames, 710 planned draws), with zero
RAF tick errors. effects-ascii still reports mounted=false after its ASCII
surface replaces the canvas, but it submits 18 frames with two native draws;
this is not an empty-scene result.

The bounded implementation keeps the existing R1 v6 wire protocol. Render-target
color/depth/cube textures can be sampled through native materials, with warned
RGBA8/target-pass approximations and active-target feedback unbinding. DDS and
PVRTC decode to bounded RGBA8 pixels. Instanced shader profiles CPU-expand a
bounded instance count; RawShaderMaterial and ShaderMaterial recognizers retain
only their identified geometry/color/texture behavior. alphaHash,
premultipliedAlpha, colorWrite/stencil, RectAreaLight, onBeforeCompile and
scene.overrideMaterial paths degrade explicitly instead of aborting. Native
Canvas2D/DataTexture paths remove the volume/material cascades; a bounded global
Image facade uses the host decoder for SMAA's embedded lookup textures. Multiple
WebGLRenderer instances now reuse the shared canvas renderer while preserving
sequential passes, and logarithmic/reversed depth emits explicit standard-depth
warnings. Empty source geometry is emitted as a no-draw node, not an invalid
geometry/material-zero draw.

Regression coverage: `js_three_bounded_shader_render_test.dart`,
`js_three_lines_instancing_render_test.dart`,
`js_three_render_target_effects_test.dart`, and
`js_three_camera_logarithmicdepthbuffer_example_test.dart` (28 tests, all pass).
Analyzer is clean for the changed tests. No protocol fixtures required changes.

Resolved asset handoff: three-shadowmap-progressive now pins
`models/gltf/ShadowmappableMesh.glb` and completes the decoder matrix with 18
submitted frames and three native draws. Its remaining directional-light-cap
message is an explicit native planner warning, not a missing-asset failure.

### R1 capability and silent-path resolution (2026-10-31)

The 24-case R1/silent subset now has 24 examples submitting real native draws,
with zero RAF tick errors and zero JS error lines in
`/tmp/r1_wave_final_native.log` (structured results:
`/tmp/r1_wave_final_native.jsonl`):

- PMREM/cube environment (6): materials-cubemap-dynamic, materials-envmaps-exr,
  materials-envmaps-hdr, pmrem-cubemap, pmrem-equirectangular and pmrem-test.
- Mip levels and render-to-mip targets (3): materials-cubemap-mipmaps,
  materials-cubemap-render-to-mipmaps and materials-texture-manualmipmap.
- Geometry/material peels (5): custom-attributes-lines, modifier-curve,
  modifier-curve-instanced, loader-gltf-iridescence and loader-gltf-sheen.
- Targets/postprocessing (3): multiple-rendertargets, postprocessing-3dlut and
  rendertarget-texture2darray.
- Recovered silent paths (4): lightprobe, lightprobe-cubecamera,
  loader-gltf-anisotropy and performance.
- Cross-file handoffs confirmed (3): animation-skinning-additive-blending now
  renders three draws after the GUI classList facade fix; loader-usdz renders
  two draws after its embedded Blob/object-URL image lane was supplied;
  test-wide-gamut renders a textured background with two texture uploads after
  the loader-lifetime and matchMedia facade fixes.

These are bounded R1 paths, not claims of full upstream parity. PMREM samples
source equirect/cube pixels without CubeUV prefiltering; custom mipmaps retain
level 0; cube targets use warned 2D passes; MRT retains attachment 0; array
targets retain one layer. Decoded RGBA TextureLoader images now expose the
local canvas pixel association, so 3DLUT strip conversion completes without
callback errors; its postprocess still uses the existing explicitly warned
bounded texture pass. Iridescence/sheen/anisotropy retain standard PBR with named
physical-only lobes dropped. LightProbe evaluates its SH helper on the CPU and
uses band-0 ambient lighting. LineLoop, custom line displacement and dynamic
line attributes use real native line draws.

Resolved cross-file blocker:

- test-wide-gamut: each loader now retains its original pre-canvas association
  across sequential `loadAsync` calls instead of acquiring a later main-canvas
  generation; explicit `setCanvas()` still starts a new guarded association.
  The adapter also supplies bounded viewport aliases and a no-op matchMedia
  listener facade. Final matrix: 34 submitted frames, one background draw and
  two texture uploads (`/tmp/decoder_remaining_final_matrix.jsonl`).
Regression coverage: `js_three_r1_capability_examples_test.dart` (21/21 pass;
`/tmp/r1_contract5.log`), using the shared three_example_render_contract health
assertions plus explicit zero-RAF and degradation-warning checks. Analyzer is
clean; no protocol or production Dart changes were needed.

## FINAL: full official JS/WebGL catalog coverage (three.js r186)

303/303 official webgl_*/webaudio_* examples prepared offline + registered.
Matrix: 297 rendering + 6 host-harness cases covered by dedicated tests
(effects-ascii submits frames after canvas replacement; postprocessing-glitch
needs its #startButton gesture; 4 webaudio use the audio-host dedicated
suites). Arbitrary-GLSL three-shader remains a bounded recognizer-based
degrade. All quality gates green.

## Visual artifact coverage (interrupted capture baseline)

`doc/three_visual/` contains all 303 pairs and verdicts, but this is not a
claim of 303 successful visual comparisons. Current reviewed accounting:
6 similar, 35 different, 262 blocked, 0 degraded-documented; 43 verdicts have
numeric normalized-MAE evidence. Raw captures under `/tmp/three_visual` were
partially lost to a reboot. Preserve the surviving pairs/verdicts and rebuild
only `summary.json`/`index.html` with `python3
tool/three_visual/compose.py --accounting-only`.
`test/three_visual_coverage_test.dart` checks registry coverage, documented
differences, regeneration scripts, and exact summary/verdict count agreement.
