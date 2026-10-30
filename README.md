# js_widget_runtime

<p align="center">
  <img src="doc/icon.svg" width="128" alt="js_widget_runtime icon — a JavaScript tile driving a stack of Flutter widget bars">
</p>

[![CI](https://github.com/IstiN/flutter_js_widget_runtime/actions/workflows/pr.yml/badge.svg)](https://github.com/IstiN/flutter_js_widget_runtime/actions/workflows/pr.yml)
[![pub package](https://img.shields.io/pub/v/js_widget_runtime.svg)](https://pub.dev/packages/js_widget_runtime)
[![pub points](https://img.shields.io/pub/points/js_widget_runtime)](https://pub.dev/packages/js_widget_runtime/score)
[![platforms](https://img.shields.io/badge/platforms-android%20%7C%20ios%20%7C%20macos%20%7C%20web-brightgreen)](https://pub.dev/packages/js_widget_runtime)
[![coverage ≥ 85%](https://img.shields.io/badge/coverage-%E2%89%A5%2085%25-brightgreen)](scripts/compute_coverage.py)
![CRAP](badges/crap.svg)

A Flutter package that runs JavaScript widgets and renders them as native Flutter UI.

- **VM/desktop/mobile**: uses [`flutter_js`](https://pub.dev/packages/flutter_js) (QuickJS / JavaScriptCore).
- **Web**: uses a dedicated `web.Worker` spawned from an inline Blob URL.
- **Opt-in QuickJS FFI backend** (VM only): swap `flutter_js` for the [quickjs_runtime](https://pub.dev/packages/quickjs_runtime) package to get fully synchronous host calls — build the native library with `bash <quickjs_runtime>/tool/build_quickjs.sh`, then pass `QuickjsWidgetEngineBackend` via `JsRuntimeConfig.backend`.

The JS side communicates with Flutter through a declarative JSON UI tree and a small async bridge (`render`, `fetchJson`, `exec`, `storage`, `secrets`, timers, `requestAnimationFrame`, etc.).

**[▶ Live demos](https://istin.github.io/flutter_js_widget_runtime/)** — click through the widget gallery in your browser: each demo runs in the real engine (Web Worker backend) on GitHub Pages.

## Example widgets

Real JavaScript, rendered by this package and captured by [golden tests](test/golden/js_widget_golden_test.dart) — the images below are generated straight from those test runs. Live, interactive versions ship in the [example app](example/) and run in the browser on the [live demos page](https://istin.github.io/flutter_js_widget_runtime/).

| | |
|---|---|
| ![yolo-hello](doc/widgets/yolo-hello.png) | ![calculator](doc/widgets/calculator.png) |
| ![weather](doc/widgets/weather.png) | ![stocks](doc/widgets/stocks.png) |
| ![crypto](doc/widgets/crypto.png) | ![animation-showcase](doc/widgets/animation-showcase.png) |
| ![map](doc/widgets/map.png) | ![showcase: bounce](doc/widgets/showcase-bounce.png) |
| ![showcase: card stack](doc/widgets/showcase-cards.png) | ![showcase: colors](doc/widgets/showcase-colors.png) |
| ![3D showcase](doc/widgets/3d-showcase.png) | ![3D game: dodge](doc/widgets/3d-game-dodge.png) |
| ![GLB showcase](doc/widgets/3d-glb-showcase.png) | ![fitness trainer](doc/widgets/fitness-trainer.png) |
| ![M3 showcase](doc/widgets/m3-showcase.png) | ![M3 showcase: controls](doc/widgets/m3-controls.png) |
| ![M3: bottom sheet](doc/widgets/m3-sheet.png) | ![M3: dialog](doc/widgets/m3-dialog.png) |
| ![charts showcase](doc/widgets/charts-showcase.png) | ![M3: date picker](doc/widgets/m3-date.png) |
| ![pomodoro](doc/widgets/pomodoro.png) | ![audio player](doc/widgets/audio-player.png) |
| ![video player](doc/widgets/video-player.png) | ![webview](doc/widgets/webview-showcase.png) |
| ![adaptive dashboard](doc/widgets/adaptive-dashboard.png) | ![3D model viewer](doc/widgets/3d-viewer.png) |
| ![THREE Minecraft](doc/widgets/three-minecraft.png) | |

yolo-hello (animated gradient + bounce) · calculator (full keyboard logic in JS) · weather (wttr.in fetch) · stocks (live quotes) · crypto (price tickers) · map (OpenStreetMap landmarks) · animation-showcase (menu + per-scene captures from the interactive golden: fade / morph / bounce / cards / drag / pulse / colors) · 3d-showcase (procedural primitives, flutter_cube — shape variants under doc/widgets/3d-showcase-*.png) · 3d-game-dodge (dodge-the-blocks game) · 3d-glb-showcase (GLB model with PBR) · fitness-trainer (skeletal-coach workout, flame_3d) · m3-showcase (Material 3 nodes: drawer, appBar, banner, searchBar, segmentedButton, radio, navigationRail, carousel, bottomAppBar, tabBar, fab, popupMenu, navigationBar + overlays: bottomSheet, dialog, snackBar, datePicker, timePicker — extra state frames under doc/widgets/m3-*.png) · charts-showcase (fl_chart via the `flChart` node: line, bar, pie, radar, scatter) · pomodoro (25/5 focus/break cycles, donut ring via `flChart` pie, completed counter persisted in `jsr.storage`) · audio-player (playlist transport via the zero-size `audio_player` node + host `JsMediaHost`) · video-player (`video` node, cinematic hero card + SVG source/BoxFit switcher) · 3d-viewer (GLB viewer with control-room UI, SVG control bar) · webview-showcase (`webView` node, host `JsWebViewHost`, page-to-widget message bridge) · adaptive-dashboard (adaptive node + `gridView.maxCrossAxisExtent` + `jsr.breakpoint`/`jsr.adaptive`/`jsr.onViewport`) · three-minecraft (official upstream r186 module on the opt-in THREE host; dedicated `three_example.dart` runner)

## Web preview runner

`example/lib/preview.dart` is a web-only entry point that renders a single widget full-bleed through the real engine (Web Worker backend) — built for hosting live widget previews behind an iframe:

```sh
cd example && flutter build web -t lib/preview.dart --base-href /widgets/preview/
```

URL contract: `?widget=<id>&theme=dark|light`, with widget files fetched over HTTP (`?base=<url>` to override the source). `fetch` is enabled only for widgets whose manifest opts into `"network": true`. CI (`.github/workflows/preview-web.yml`) publishes the build as the `jsr-preview-web` artifact.

The runner also powers the **live demo site on GitHub Pages** —
<https://istin.github.io/flutter_js_widget_runtime/> — deployed by
`.github/workflows/pages.yml`: a landing page (`site/index.html`, widget
cards built from the fa_widgets catalog) at the root plus the runner under
`/preview/` (base-href `/flutter_js_widget_runtime/preview/`).

## Quick start

```sh
flutter pub add js_widget_runtime
```

```dart
import 'package:flutter/material.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

class DemoPage extends StatelessWidget {
  const DemoPage({super.key});

  @override
  Widget build(BuildContext context) {
    return JsWidgetRuntime(
      jsSource: r'''
(function() {
  jsr.render({
    type: 'center',
    child: {
      type: 'column',
      mainAxisSize: 'min',
      children: [
        {type: 'text', data: 'Hello from JS!', style: {fontSize: 24}},
        {type: 'sizedBox', height: 12},
        {
          type: 'textButton',
          text: 'Tap me',
          onTap: 'tap',
        },
      ],
    },
  });
  jsr.onEvent(function(actionId, payload) {
    if (actionId === 'tap') {
      jsr.setTitle('Tapped!');
    }
  });
})();
''',
      runtimeConfig: JsRuntimeConfig(
        onRender: (tree) => print('render: $tree'),
        onSetTitle: (title) => print('title: $title'),
        onStorageUpdate: (storage) => print('storage: $storage'),
      ),
    );
  }
}
```

See the `example/` folder for a runnable menu of sample JS apps.

## 3D scenes and GLB models

`js_widget_runtime` does not bundle a 3D engine. Instead it exposes a `Js3dHost`
interface so the host app can plug in any engine (Flame 3D, three_dart,
`flutter_3d_controller`, etc.).

```dart
JsRuntimeConfig(
  js3dHost: const My3dHost(),
  // ... other handlers
);
```

From JS, create a scene and manipulate it:

```javascript
jsr.scene3d.create('main', {
  camera: { position: [0, 2, 5], target: [0, 0, 0] },
  lights: [{ type: 'ambient', color: '#ffffff', intensity: 0.5 }]
});

jsr.render({
  type: 'scene3d',
  id: 'main',
  width: 320,
  height: 320
});

jsr.scene3d.addModel('main', {
  id: 'player',
  src: 'assets/player.glb'
});

jsr.scene3d.playAnimation('main', 'player', 'run');

jsr.scene3d.setTransform('main', 'player', {
  position: [1, 0, 0],
  rotation: [0, 45, 0],
  scale: [1.5, 1.5, 1.5]
});
```

The `example/` app includes a `3d-viewer` widget powered by
`flutter_3d_controller`.

## Upstream three.js r186 (opt-in)

Upstream `THREE` is independent of the older `scene3d` API. Enable its pinned
bundle explicitly and inject the platform host; ordinary widgets do not load
or evaluate three.js:

```dart
final threeHost = kIsWeb
    ? createWebThreeHost()
    : createFlutterGpuThreeHost();

final config = JsRuntimeConfig(
  threeEnabled: true,
  threeHost: threeHost,
  // ... required render/title/storage callbacks
);
```

```javascript
const canvas = jsr.three.createCanvas('main');
const renderer = new THREE.WebGLRenderer({canvas: canvas});
// Use the real upstream scene/geometry/material objects, then mount it:
jsr.render({type: 'three', canvasId: 'main', width: 640, height: 360});
```

- **Native (1A):** upstream JS object model on QuickJS/JSC, dirty versioned
  resources over the binary `JSR3D-T1`/`R1-v2` protocol (the decoder also
  accepts legacy R1-v1), and Flutter GPU shaders behind `JsThreeHost`.
  `WebGLRenderer` is an explicit R1 alias;
  `getContext()`, raw WebGL, ShaderMaterial and WebGPU report
  `three.unsupported`. No WebView is involved.
- **Web (1B):** the real upstream `WebGLRenderer` acquires WebGL2 on a
  Worker-owned OffscreenCanvas. Transferable ImageBitmap frames (bounded to
  two pending) are presented through HtmlElementView canvases; canvas/GL
  handles never cross the JSON bridge.
- Native `THREE.InstancedMesh` uses R1 `DRAW_BATCH`: real instance matrices
  are uploaded once and drawn with GPU instancing, including indexed
  multi-material parts. Per-instance colors via `setColorAt`/`instanceColor`
  multiply the material color in the shader (RGB instance attribute;
  instances without colors keep the plain material color, byte-identical to
  non-instanced draws). Transparent instanced meshes blend in ONE draw per
  material part, sorted among the transparent bucket at the node level —
  the same approximation upstream WebGLRenderer uses (it never sorts
  instances either); scenes needing exact per-instance order split
  instances across meshes. Diagnostics count triangles
  across all instances, not just the base geometry.
- Large indexed single-material meshes use a cached BVH for native raycasts;
  upstream THREE still performs the final triangle/UV/normal/material tests.
  Attribute/array identity and versions invalidate the cache, while morph,
  skinned, non-indexed and bounded-draw-range cases retain the stock path.
- Native R1 includes Blinn-Phong materials and unique-edge mesh wireframes.
  Its bounded Flutter Canvas2D path rasterizes concentric radial gradients
  and `fillRect` into versioned `CanvasTexture` RGBA uploads; unsupported
  canvas operations remain explicit `three.unsupported` failures. Web keeps
  using the real OffscreenCanvas implementation.
- Lighting includes ambient, directional, point and real hemisphere diffuse
  irradiance (independent sky/ground colors); Normal and emissive materials
  have their own native GPU paths rather than Lambert aliases.
- Resources are isolated by `(engineId, surfaceId, resourceId)`. Mount,
  resize/DPR, pointer/key/cancel, capture and disposal are host-managed.
  Prepared local assets use `jsr.three.registerAsset`; host asset failures
  are named `three.assetFailure`.
- The pin is r186, peeled commit
  `9b4a2ac29c63ccb43fd51c5661f2f873ac2c39b8` (tag object
  `48dd7be01263658aad497fd72e09d1e4c6213461`). Build manifests and the MIT
  notice ship under `assets/three/`.

### API matrix and engine coverage (honest lanes)

Two committed snapshots track what each lane really supports. Regenerate
with `node tool/three/api_matrix.mjs --write` and
`node tool/three/engine_coverage.mjs --write`; both are pinned by snapshot
tests (`tool/three/test/`), so every capability change fails CI until the
snapshot is consciously refreshed.

- **Example matrix** (`tool/three/api_matrix.json`, 607 official examples):
  `supported` 72, `prepared` 60, `web-lane` 78, `blocked` 438,
  `unknown-api` 19 (down from 79 — every remaining row cites an explicitly
  `unverified` decode/input lane with the probe it needs, never a silently
  promoted one).
- **Engine coverage** (`tool/three/engine_coverage.json`, all 454 exports of
  `three.core.js ∪ three.module.js`): r1Ok 157, r1Bounded 16, r1No 65
  (17 of them deliberate web-lane, see below), upstreamCpu 41,
  constants 170, nativeAbsent 5, **unclassified 0**
  (was 15). render-honored 173/454 = **38.1%**, QuickJS-usable 384/454 =
  **84.6%**; the web lane (real upstream renderer on a Worker
  OffscreenCanvas) serves 100% of the API.

**Deliberate web-lane verdicts.** The native R1 lane will not implement
GLSL passes or offscreen render targets — it renders exactly one surface
per canvas. Capabilities that fundamentally need them are finalized as
`web-lane` entries (status `no` with a documented reason, examples whose
only blockers are web-lane get verdict `web-lane`, not plain `blocked`):

| family | entries | reason |
|---|---|---|
| arbitrary shaders | `ShaderMaterial`, `RawShaderMaterial`, `ShaderChunk`, `ShaderLib`, `Uniform`, `UniformsLib`, GLSL3 variant | GLSL passes — upstream renderer on the web build |
| render targets | `WebGLRenderTarget`, `WebGLCubeRenderTarget`, `WebGL3DRenderTarget`, `WebGLArrayRenderTarget`, `FramebufferTexture` | offscreen render targets — R1 presents one surface |
| postprocessing | all `postprocessing/*` passes (EffectComposer, RenderPass, OutputPass, ShaderPass, bloom/SSAO/SMAA/…, npm `postprocessing`/`goodrays`) | multi-pass GLSL over render targets |
| env prefilter | `PMREMGenerator`, `LightProbeGenerator`, LightProbeGridWebGL | prefiltered-IBL render passes |
| cube capture | `CubeCamera` | renders the scene into a cube render target |
| VSM shadows | `VSMShadowMap` | separable blur passes into render targets |
| mirror/refract objects | `Reflector`, `Refractor`, Anaglyph/ParallaxBarrier effects | render-target re-injection (Outline effects stock-boot via the R1 v5 ton kind; the exact GLSL displacement outline stays web-lane) |
| fat lines | `Line2` family (`LineMaterial` GLSL) | instanced GLSL dashes/resolution |
| cascaded shadows | `csm/CSM.js` | cascaded shadow render targets |

Three prepared modules are deliberately kept as documented web-lane gap
demos (`webgl_lights_hemisphere` and `webgl_interactive_points`: their
ShaderMaterial parts stay upstream; `webgl_materials_cubemap_refraction`:
the cube faces arrive as OffscreenCanvas-decoded jpgs that stay
unregistered assets on native — regression tests pin the exact
`three.unsupported` card), and the Web (1B) lane serves all of the above
unmodified.

Rebuild and run an official example from the pinned local source:

```sh
dart run bin/jsr_three_example.dart prepare webgl_geometry_minecraft
dart run bin/jsr_three_example.dart prepare webgl_lines_colors
dart run bin/jsr_three_example.dart prepare webgl_geometry_colors
dart run bin/jsr_three_example.dart prepare webgl_buffergeometry_uint
dart run bin/jsr_three_example.dart prepare webgl_buffergeometry_indexed
dart run bin/jsr_three_example.dart prepare webgl_buffergeometry_lines_indexed
dart run bin/jsr_three_example.dart prepare webgl_buffergeometry_points
dart run bin/jsr_three_example.dart prepare webgl_geometry_terrain_raycast
dart run bin/jsr_three_example.dart prepare webgl_math_orientation_transform
dart run bin/jsr_three_example.dart prepare webgl_interactive_raycasting_points
dart run bin/jsr_three_example.dart prepare webgl_interactive_cubes
dart run bin/jsr_three_example.dart prepare webgl_interactive_cubes_ortho
dart run bin/jsr_three_example.dart prepare webgl_math_obb
dart run bin/jsr_three_example.dart prepare webgl_buffergeometry_points_interleaved
dart run bin/jsr_three_example.dart prepare webgl_interactive_voxelpainter
dart run bin/jsr_three_example.dart prepare webgl_panorama_equirectangular
dart run bin/jsr_three_example.dart prepare webgl_clipping
dart run bin/jsr_three_example.dart prepare webgl_clipping_intersection
dart run bin/jsr_three_example.dart prepare webgl_lights_spotlights
dart run bin/jsr_three_example.dart prepare webgl_helpers
dart run bin/jsr_three_example.dart prepare webgl_geometry_spline_editor
dart run bin/jsr_three_example.dart prepare webgl_lights_hemisphere
dart run bin/jsr_three_example.dart prepare webgl_interactive_points
dart run bin/jsr_three_example.dart prepare webgl_buffergeometry
dart run bin/jsr_three_example.dart prepare webgl_camera
dart run bin/jsr_three_example.dart prepare webgl_buffergeometry_lines
dart run bin/jsr_three_example.dart prepare webgl_clipping_advanced
dart run bin/jsr_three_example.dart prepare webgl_geometry_teapot
dart run bin/jsr_three_example.dart prepare webgl_geometry_extrude_splines
dart run bin/jsr_three_example.dart prepare webgl_lights_physical
dart run bin/jsr_three_example.dart prepare webgl_lights_spotlight
dart run bin/jsr_three_example.dart prepare webgl_loader_ply
dart run bin/jsr_three_example.dart prepare webgl_loader_stl
dart run bin/jsr_three_example.dart prepare webgl_materials_bumpmap
dart run bin/jsr_three_example.dart prepare webgl_materials_modified
dart run bin/jsr_three_example.dart prepare webgl_materials_displacementmap
dart run bin/jsr_three_example.dart prepare webgl_materials_texture_canvas
dart run bin/jsr_three_example.dart prepare webgl_materials_texture_partialupdate
dart run bin/jsr_three_example.dart prepare webgl_materials_texture_rotation
dart run bin/jsr_three_example.dart prepare webgl_points_billboards
dart run bin/jsr_three_example.dart prepare webgl_loader_xyz
dart run bin/jsr_three_example.dart prepare webgl_geometry_text_shapes
dart run bin/jsr_three_example.dart prepare webgl_geometry_shapes
dart run bin/jsr_three_example.dart prepare webgl_sprites
dart run bin/jsr_three_example.dart prepare webgl_raycaster_sprite
dart run bin/jsr_three_example.dart prepare webgl_geometry_convex
dart run bin/jsr_three_example.dart prepare webgl_materials_texture_filters
dart run bin/jsr_three_example.dart prepare webgl_geometry_cube
dart run bin/jsr_three_example.dart prepare webgl_materials_texture_anisotropy
dart run bin/jsr_three_example.dart prepare webgl_shadowmap_pointlight
dart run bin/jsr_three_example.dart prepare webgl_camera_logarithmicdepthbuffer
dart run bin/jsr_three_example.dart prepare webgl_materials_cubemap_refraction
dart run bin/jsr_three_example.dart prepare webgl_raycaster_texture
dart run bin/jsr_three_example.dart prepare webgl_instancing_performance
cd example
flutter run -d macos -t lib/three_example.dart
# Or select the initial module before using the sample sidebar:
flutter run -t lib/three_example.dart \
  --dart-define=JSR_THREE_EXAMPLE=webgl_lines_colors
```

For meaningful FPS numbers, use the standalone release build:

```sh
cd example
flutter build macos --release -t lib/three_example.dart
open build/macos/Build/Products/Release/js_widget_runtime_example.app
```

The native sample runner opts into
`createQuickjsIsolateWidgetEngineBackend` through
`JsRuntimeConfig.backendFactory`: QuickJS and JS-side R1 encoding run in a
persistent background isolate, while the bridge, RAF/timers, assets and
Flutter GPU hosts stay on the main isolate. The factory receives the final
wrapped config (unlike a preconstructed `backend`, which can capture an old
`onRender`). The direct QuickJS backend remains available for synchronous
host timing. `quickjs_runtime >=0.4.8` is required for isolate OS-thread
migration safety.

The prepare step preserves the exact official HTML/module bytes and resolves
only each module's pinned addons/local assets. Minecraft, Line Colors,
Geometry Colors, Integer BufferGeometry, Indexed BufferGeometry, Indexed
BufferGeometry Lines, BufferGeometry Points, Terrain Raycast, Orientation
Transform, Raycasting Points, Interactive Cubes (perspective and
orthographic), Interactive Lines, Extrude Shapes, Oriented Bounding Boxes,
Interleaved BufferGeometry Points, Voxel Painter, Equirectangular Panorama,
Instancing Raycast, Interactive BufferGeometry, Clipping, Clipping
Intersection, Spot Lights, Helpers and the Spline Editor
run on native R1. XYZ Loader, Text Shapes, Convex Geometry and Geometry
Cube (wave 2) also run stock. The two
texture-backed additions use pinned PNG/JPEG assets with byte, hash and
dimension validation. Indexed BufferGeometry uses real hemisphere
lighting and a functional wireframe checkbox through the bounded JSR lil-gui
facade. Terrain uses the pinned OrbitControls addon with host pointer, wheel,
capture and cancellation events plus the bounded generated-texture Canvas2D
adapter. Orientation Transform uses a bounded native lil-gui boolean facade
backed by a real JSR checkbox; a real browser document keeps the official
lil-gui addon, while the Web Worker uses the functional JSR facade. Instancing
Raycast uses a bounded number slider for `mesh.count` and per-instance colors
via `setColorAt`. Spot Lights exercises the R1 v3 spot-light path with six
tweened movers and a live PCF shadow map; Helpers renders the Lee Perry Smith
head with normal/tangent/grid/box helpers and a moving point light; the Spline
Editor motivated the dedicated ShadowMaterial wire kind (shadow-factor-as-
alpha under a castShadow spot) plus lil-gui function buttons. Late RAF/promise callback failures surface as widget error cards instead
of vanishing silently. The bounded lil-gui facade supports boolean, number,
function and options (dropdown) controllers, chained `.step()/.min()/.max()`,
`listen()` pass-through and `new GUI({width})`. Prepared-but-documented 1B
gap modules (each pinned by a regression test that asserts the exact
`three.unsupported` card and proves the single root cause via an
instrumented probe): `webgl_lights_hemisphere` and `webgl_interactive_points`
(ShaderMaterial), `webgl_buffergeometry_lines` (morph targets),
`webgl_geometry_teapot` (CubeTextureLoader→OffscreenCanvas, envMap slot),
`webgl_lights_physical` (bump/roughness/metalness map slots — the wave-3
tone-mapping lane carries its ReinhardToneMapping + GUI exposure
end-to-end), `webgl_materials_bumpmap` and `webgl_materials_displacementmap`
(materialTexture slots beyond `map`/`alphaMap`/`envMap`), `webgl_materials_modified`
(onBeforeCompile), `webgl_materials_texture_canvas` (HTML-only canvas
element).

Wave-3 (R1 protocol v4) shipped four capability families natively: frame
tone mapping (Linear/Reinhard/Cineon/ACES/AgX/Neutral + toneExposure, the
three.js tonemapping_fragment math in `three_r1.frag`), FogExp2
(`1 - exp(-d²·depth²)` mixing; linear fog unchanged), per-map UV transforms
(offset/repeat/rotation/center → mat3 per map slot, applied to the map and
alphaMap UV paths) with a real `capabilities.getMaxAnisotropy()` (clamped
to the native sampler maximum of 1), and material texture slots beyond
`map`: `alphaMap` (alpha multiply + alphaTest) and `envMap`
(equirect reflection via reflect(viewDir, normal), `envMapIntensity`).
Graduated to the app sidebar + expanded suite: `webgl_geometry_shapes`,
`webgl_materials_texture_rotation`, `webgl_points_billboards`,
`webgl_shadowmap_pointlight`.
Wave-3 batch 1-2 (R1 protocol v5) shipped four more capability families
natively: sprite billboards (`Sprite`/`SpriteMaterial` kind, rotation, fog,
tone mapping — `webgl_sprites` and `webgl_raycaster_sprite` run stock with
dedicated regression tests replacing their wave-2 gap pins), point-light
shadows (dual-paraboloid map per light, `webgl_shadowmap_pointlight`),
ton/matcap materials (`MeshToonMaterial` + gradientMap steps,
`MeshMatcapMaterial` + matcap texture slot — the EXR decode lane is pure
JS and feeds R1 data textures; `webgl_materials_matcap` and
`webgl_materials_toon` run stock, with the toon OutlineEffect degraded to
the bounded lane), and data + cube textures (`DataTexture` uploads,
`CubeTexture` bounded to `CubeReflectionMapping`; `CubeRefractionMapping`
stays a documented web-lane entry).
Wave-4 (R1 protocol v6) adds the normal/bump-map fragment lane: stock
`MeshPhongMaterial.bumpMap`/`normalMap` and `MeshStandardMaterial.normalMap`
upload through dedicated v6 map slots and shade through the three.js
tangent-less `perturbNormalArb` dFdx/dFdy math (normalScale sign flip
included), so `webgl_materials_normalmap` runs stock — its
EffectComposer/RenderPass chain resolves to a local-only render-to-screen
composer shim (no intermediate render targets). `MeshPhongMaterial.specularMap`
is deliberately dropped with a console warning (normal mapping kept).
`MeshStandardMaterial` also gained roughness/metalness map slots, so the
stock `webgl_lights_physical` floor now renders with all seven embedded
textures attached (the wave-3 tone lane stays intact).
Wave-2 gap modules, each pinned by a dedicated regression test (the
sprite pair graduated with R1 v5 — their tests now pin the working sprite
lane instead of the gap): `webgl_materials_texture_filters` (`Texture.clone()`
canvas2d source — the wave-3 UV-transform lane removed the floor-repeat
blocker), `webgl_materials_texture_anisotropy` (`#val_left` DOM overlay
write + the wave-2 GIF lane; `capabilities.getMaxAnisotropy()` is real
since wave-3), `webgl_camera_logarithmicdepthbuffer` (official
init derefs a facade-absent `#renderer_border` DOM node; with a stub the
`logarithmicDepthBuffer` flag is silently ignored and the second renderer
hits the one-active-renderer-per-canvas guard), `webgl_materials_cubemap_refraction`
(OffscreenCanvas img guard + envMap slot; only Lucy100k.ply is embedded —
the six Park3Med jpgs are not registered assets), `webgl_raycaster_texture`
(OffscreenCanvas img decode + canvas2d `clearRect`/path ops outside the
bounded profile — the paint loop is never reached stock),
`webgl_instancing_performance` (stock init dies on a lil-gui object-map
options add — the console.time lane is native since wave-3; with probe
shims the module renders
one InstancedMesh draw whose `instanceCount` live-switches 1000→10000 via
the GUI dropdown, NAIVE mode fans out to per-instance draws, at ~40 fps
test-pump pacing; `webgl_instancing_scatter` boots stock with 2000
per-instance-colored blossoms). Silent-ignore audits: `webgl_camera_logarithmicdepthbuffer`'s
`logarithmicDepthBuffer` flag and `webgl_clipping`'s `alphaToCoverage`
checkbox have no R1/flutter_gpu counterpart (alpha-to-coverage pipeline
state is not exposed by flutter_gpu) — the controls live but render no
difference; clipShadows IS honored end-to-end (overlay checkbox → material
upsert → shadow-pass discard gate, pinned by the live-switch test).
`webgl_materials_texture_partialupdate` renders the checkerboard plane but
pins the missing `copyTextureToTexture` API. Unsupported
GUI controls and general DOM/CSS remain explicit failures. None is
approximated or rewritten. Native runs require
a Flutter GPU/Impeller platform; the Web path requires Worker
OffscreenCanvas + WebGL2 (verify on real Chrome/Edge). The sample browser
sidebar switches all forty-one integrated modules without restarting; its
overlay reports presented-frame
FPS, decode/frame time, calls, triangles and uploads.

![Official three.js Minecraft example on Flutter GPU](doc/widgets/three-minecraft.png)

*Actual macOS Impeller capture of the unmodified official module; not a
browser/WebView screenshot.*

### Local Minecraft stress profile

`tool/three_minecraft_stress/` prepares a separate heavy local target from the
unmodified `minecraft-threejs-clone` application graph. Its default
`drawDistance = 0` profile keeps one chunk, batches the real blocks with
`InstancedMesh`, and exercises QuickJS FFI → native R1 → Flutter GPU without
Vite or a WebView:

```sh
node tool/three_minecraft_stress/prepare.mjs --offline
node tool/three_minecraft_stress/test/stress_test.mjs
cd example && flutter run -d macos -t lib/three_minecraft_stress.dart
```

See [the stress-target README](tool/three_minecraft_stress/README.md) for source
pins, verification, diagnostics and bounded controls. Generated output stays
under `/tmp`; the reference has no license and must not be redistributed.

## Renderer nodes

The JSON tree supports these node types:

| Category | Nodes |
| --- | --- |
| Layout | `column`, `row`, `stack`, `center`, `padding`, `sizedBox`, `expanded`, `flexible`, `wrap`, `align`, `absoluteFill` |
| Display | `text`, `icon`, `markdown`, `divider`, `spacer`, `image`, `svg`, `avatar`, `chip`, `badge`, `path`, progress indicators |
| Container | `container`, `card`, `inkWell`, `safeArea`, `scroll`, `blur` |
| List | `listView`, `gridView`, `listTile`. Scrolling is configurable: `shrinkWrap` (default `true`) and `physics` (`'never'` / `'always'` / `'platform'`; default `'always'` for `listView`, `'never'` for `gridView`). Use `shrinkWrap: false` in a bounded parent to let the view scroll |
| Input | `button`, `textButton`, `outlinedButton`, `iconButton`, `textField`, `textArea` (multiline input: `value`, `hint`, `minLines` default 3, `maxLines` default 8, `onChange` per keystroke, optional `onSubmit` done action), `switch`, `checkbox`, `slider`, `dropdown` |
| Animation | `animatedContainer`, `animatedOpacity`, `animatedPositioned` (implicit change animations); `entrance` — one-shot mount animation (`animation`: `fade`/`slideUp`/`slideDown`/`slideLeft`/`slideRight`/`scale`/`fadeScale`, `delay` ms for staggered lists, `duration`, `curve`); `animatedSwitcher` — view transition when `switchKey` changes (`animation`: `fade`/`slideLeft`/`slideRight`/`slideUp`/`scale`/`fadeScale`) |
| Map | `map` — OpenStreetMap via [flutter_map](https://pub.dev/packages/flutter_map) (no API key). Props: `center {lat, lng}`, `zoom`, `markers [{id, lat, lng, label?, color?}]`, `polylines [{points, color?, width?}]`, `fitBounds`; events: `onTap` (`{lat, lng}`), `onMarkerTap` (`{id}`) |
| Chart | `chart` — sparkline or bar chart. Props: `data` (list of numbers; `points` accepted as alias), `chartType` (`line` default, `bar`), `color`, `fillColor` (hex with alpha, e.g. `#22c55e33`), `strokeWidth`, `height` |
| 3D | `scene3d` — host-provided 3D engine. Props: `id`, `width`, `height`, `camera`, `lights`; controlled via `jsr.scene3d.*`. `three` — upstream r186 canvas (`canvasId`, `width`, `height`) via opt-in `jsr.three`; independent of `scene3d` |
| Media | `video`, `audio` (host-provided via `JsMediaHost`) |
| Gestures | `gestureDetector` |

## Features

- Cross-platform JS execution (VM + web).
- Declarative JSON-to-Flutter renderer with layout, input, animation and gesture nodes.
- Effects ported from YoClip: radial gradients, box shadows, blur, 3D transforms, clip, text shadows.
- `manifest.json` based app registry with example widgets.
- Injected I/O handlers so the host controls permissions (network, CLI, secure storage).
- Host-specific JS APIs via `JsRuntimeConfig.hostBootstrapJs` (e.g., `jsr.yoloit = {...}`).
- Default in-memory handlers for demo/development use.

## License

MIT
