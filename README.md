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
