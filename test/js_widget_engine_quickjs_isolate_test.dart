import 'dart:async';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

final bool _hasNativeLib = QuickjsFfi.isAvailable;
final List<JsWidgetEngineBackend> _backends = [];

JsWidgetEngineBackend _backend({
  void Function(Map<String, dynamic> tree)? onRender,
  void Function(String message)? onLog,
  void Function(String name, Uint8List data)? onBinary,
}) {
  final backend = createQuickjsIsolateWidgetEngineBackend(
    JsRuntimeConfig(
      widgetId: 'isolate-test',
      onRender: onRender ?? (_) {},
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
      onLog: onLog,
      onHostCallBinary: onBinary,
    ),
  );
  _backends.add(backend);
  return backend;
}

void main() {
  if (!_hasNativeLib) {
    test(
      'QuickJS isolate suite',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  tearDown(() async {
    for (final backend in _backends) {
      await backend.dispose();
    }
    _backends.clear();
    await pumpEventQueue();
  });

  test('startup, events, logs and binary messages cross the isolate', () async {
    final renders = <Map<String, dynamic>>[];
    final logs = <String>[];
    final binaries = <Uint8List>[];
    final backend = _backend(
      onRender: renders.add,
      onLog: logs.add,
      onBinary: (_, data) => binaries.add(data),
    );
    await backend.init();
    await backend.run('''
console.log('worker-ready');
jsr.onEvent(function(action, payload) {
  jsr.exportState({action: action, value: payload.value});
});
jsr.hostCallBinary('test.bytes', new Uint8Array([1, 2, 3, 255]));
jsr.render({type: 'text', text: 'isolated'});
''');
    await pumpEventQueue();

    expect(renders.single['text'], 'isolated');
    expect(backend.exportedState, isNull);
    expect(logs, contains('worker-ready'));
    expect(binaries.single, orderedEquals(<int>[1, 2, 3, 255]));

    await backend.callEvent('select', {'value': 42});
    await pumpEventQueue();
    expect(backend.exportedState, {'action': 'select', 'value': 42});
  });

  test('synchronous JS startup does not block main-isolate timers', () async {
    final backend = _backend();
    var ticks = 0;
    final timer = Timer.periodic(const Duration(milliseconds: 20), (_) {
      ticks++;
    });
    try {
      await backend.run('''
var end = Date.now() + 300;
while (Date.now() < end) {}
jsr.render({type: 'text', text: 'done'});
''');
    } finally {
      timer.cancel();
    }
    expect(ticks, greaterThanOrEqualTo(5));
  });

  test('promise results, theme and host events return to the worker', () async {
    late void Function(String id, dynamic value) resolve;
    final backend = createQuickjsIsolateWidgetEngineBackend(
      JsRuntimeConfig(
        widgetId: 'isolate-async-test',
        onRender: (_) {},
        onSetTitle: (_) {},
        onStorageUpdate: (_) {},
        onResolveReady: (callback) => resolve = callback,
        loadAssetHandler: (id, path) async {
          await Future<void>.delayed(const Duration(milliseconds: 20));
          resolve(id, 'asset:$path');
        },
      ),
    );
    _backends.add(backend);
    await backend.run('''
jsr.onKey(function(event) {
  jsr.exportState({key: event.key, accent: jsr.theme.accent});
});
jsr.loadAsset('demo.txt').then(function(value) {
  jsr.exportState({asset: value});
});
''');
    for (var attempt = 0; attempt < 20; attempt++) {
      await Future<void>.delayed(const Duration(milliseconds: 10));
      if (backend.exportedState?['asset'] == 'asset:demo.txt') break;
    }
    expect(backend.exportedState, {'asset': 'asset:demo.txt'});

    backend.updateTheme({'accent': '#123456'});
    backend.dispatchHostEvent('key', {'key': 'a', 'down': true});
    for (var attempt = 0; attempt < 20; attempt++) {
      await Future<void>.delayed(const Duration(milliseconds: 10));
      if (backend.exportedState?['key'] == 'a') break;
    }
    expect(backend.exportedState, {'key': 'a', 'accent': '#123456'});
  });

  test('dispose during worker startup allows a clean restart', () async {
    final renders = <Map<String, dynamic>>[];
    final backend = _backend(onRender: renders.add);
    final starting = backend.run('''
var end = Date.now() + 300;
while (Date.now() < end) {}
jsr.render({type: 'text', text: 'stale'});
''');
    await Future<void>.delayed(const Duration(milliseconds: 10));
    await backend.dispose();
    try {
      await starting.timeout(const Duration(seconds: 2));
    } on StateError {
      // Disposal may reject startup, depending on where it intersects spawn.
    }

    await backend.run("jsr.render({type: 'text', text: 'restarted'});");
    await pumpEventQueue();
    expect(renders.single['text'], 'restarted');
  });

  test('backendFactory receives the effective render callback', () async {
    final renders = <Map<String, dynamic>>[];
    JsRuntimeConfig? received;
    final engine = JsWidgetEngine(
      config: JsRuntimeConfig(
        widgetId: 'factory-test',
        onRender: (_) {},
        onSetTitle: (_) {},
        onStorageUpdate: (_) {},
        backendFactory: (effective) {
          received = effective;
          final backend = createQuickjsIsolateWidgetEngineBackend(effective);
          _backends.add(backend);
          return backend;
        },
      ).copyWith(onRender: renders.add),
    );
    await engine.run("jsr.render({type: 'text', text: 'factory'});");
    await pumpEventQueue();

    expect(received!.instanceId, engine.instanceId);
    expect(renders.single['text'], 'factory');
    await engine.dispose();
  });
}
