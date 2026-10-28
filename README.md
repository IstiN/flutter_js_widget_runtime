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
  resources over the binary `JSR3D-T1`/`R1-v1` protocol, and Flutter GPU
  shaders behind `JsThreeHost`. `WebGLRenderer` is an explicit R1 alias;
  `getContext()`, raw WebGL, ShaderMaterial and WebGPU report
  `three.unsupported`. No WebView is involved.
- **Web (1B):** the real upstream `WebGLRenderer` acquires WebGL2 on a
  Worker-owned OffscreenCanvas. Transferable ImageBitmap frames (bounded to
  two pending) are presented through HtmlElementView canvases; canvas/GL
  handles never cross the JSON bridge.
- Native `THREE.InstancedMesh` uses R1 `DRAW_BATCH`: real instance matrices
  are uploaded once and drawn with GPU instancing, including indexed
  multi-material parts. Transparent instancing and per-instance colors are
  outside the initial R1 profile. Diagnostics count triangles across all
  instances, not just the base geometry.
- Resources are isolated by `(engineId, surfaceId, resourceId)`. Mount,
  resize/DPR, pointer/key/cancel, capture and disposal are host-managed.
  Prepared local assets use `jsr.three.registerAsset`; host asset failures
  are named `three.assetFailure`.
- The pin is r186, peeled commit
  `9b4a2ac29c63ccb43fd51c5661f2f873ac2c39b8` (tag object
  `48dd7be01263658aad497fd72e09d1e4c6213461`). Build manifests and the MIT
  notice ship under `assets/three/`.

Rebuild and run an official example from the pinned local source:

```sh
dart run bin/jsr_three_example.dart prepare webgl_geometry_minecraft
dart run bin/jsr_three_example.dart prepare webgl_lines_colors
dart run bin/jsr_three_example.dart prepare webgl_geometry_colors
cd example
flutter run -t lib/three_example.dart
# Or select the initial module without using the dropdown:
flutter run -t lib/three_example.dart \
  --dart-define=JSR_THREE_EXAMPLE=webgl_lines_colors
```

The prepare step preserves the exact official HTML/module bytes and resolves
only each module's pinned addons/local assets. Minecraft and Line Colors run
on native R1; Geometry Colors currently requires WebGL2 pending native
CanvasTexture, Phong and wireframe support. Native runs require a Flutter
GPU/Impeller platform; the Web path requires Worker OffscreenCanvas + WebGL2
(verify on real Chrome/Edge). The example overlay reports decode/frame time,
calls, triangles and uploads.

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
