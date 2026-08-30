# js_widget_runtime

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
| ![video player](doc/widgets/video-player.png) | |

yolo-hello (animated gradient + bounce) · calculator (full keyboard logic in JS) · weather (wttr.in fetch) · stocks (live quotes) · crypto (price tickers) · map (OpenStreetMap landmarks) · animation-showcase (menu + per-scene captures from the interactive golden: fade / morph / bounce / cards / drag / pulse / colors) · 3d-showcase (procedural primitives, flutter_cube — shape variants under doc/widgets/3d-showcase-*.png) · 3d-game-dodge (dodge-the-blocks game) · 3d-glb-showcase (GLB model with PBR) · fitness-trainer (skeletal-coach workout, flame_3d) · m3-showcase (Material 3 nodes: drawer, appBar, banner, searchBar, segmentedButton, radio, navigationRail, carousel, bottomAppBar, tabBar, fab, popupMenu, navigationBar + overlays: bottomSheet, dialog, snackBar, datePicker, timePicker — extra state frames under doc/widgets/m3-*.png) · charts-showcase (fl_chart via the `flChart` node: line, bar, pie, radar, scatter) · pomodoro (25/5 focus/break cycles, donut ring via `flChart` pie, completed counter persisted in `jsr.storage`) · audio-player (playlist transport via the zero-size `audio_player` node + host `JsMediaHost`) · video-player (`video` node, source/BoxFit switcher)

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
| 3D | `scene3d` — host-provided 3D engine. Props: `id`, `width`, `height`, `camera`, `lights`. GLB/GLTF models, cameras and lights are controlled from JS via `jsr.scene3d.*` |
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
