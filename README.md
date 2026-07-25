# js_widget_runtime

A Flutter package that runs JavaScript widgets and renders them as native Flutter UI.

- **VM/desktop/mobile**: uses [`flutter_js`](https://pub.dev/packages/flutter_js) (QuickJS / JavaScriptCore).
- **Web**: uses a dedicated `web.Worker` spawned from an inline Blob URL.

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
