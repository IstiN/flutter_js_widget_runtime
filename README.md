# js_widget_runtime

A Flutter package that runs JavaScript widgets and renders them as native Flutter UI.

![CRAP](badges/crap.svg)

- **VM/desktop/mobile**: uses [`flutter_js`](https://pub.dev/packages/flutter_js) (QuickJS / JavaScriptCore).
- **Web**: uses a dedicated `web.Worker` spawned from an inline Blob URL.
- **Opt-in QuickJS FFI backend** (VM only): swap `flutter_js` for the vendored QuickJS runtime to get fully synchronous host calls — build the native library with `./tool/build_quickjs.sh`, then pass `QuickjsWidgetEngineBackend` via `JsRuntimeConfig.backend`.

The JS side communicates with Flutter through a declarative JSON UI tree and a small async bridge (`render`, `fetchJson`, `exec`, `storage`, `secrets`, timers, `requestAnimationFrame`, etc.).

## Quick start

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
