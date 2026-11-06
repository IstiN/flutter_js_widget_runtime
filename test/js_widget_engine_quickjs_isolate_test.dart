import 'dart:async';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'support/quickjs_isolate_backend_factory.dart';

void main() {
  const widgetId = 'isolate-test';
  if (!isolateNativeLibAvailable) {
    test(
      'QuickJS isolate suite',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  teardownIsolateBackends();

  test('startup, events, logs and binary messages cross the isolate', () async {
    final renders = <Map<String, dynamic>>[];
    final logs = <String>[];
    final binaries = <Uint8List>[];
    final backend = buildIsolateBackend(
      widgetId,
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

  test('worker copy lane owns subviews and skips the JS encoder', () async {
    final binaries = <Uint8List>[];
    final backend = buildIsolateBackend(
      widgetId,
      onBinary: (_, data) => binaries.add(data),
    );
    await backend.run('''
jsr.b64encode = function() { throw new Error('JS fallback called'); };
var source = new Uint8Array([9, 0, 1, 2, 253, 254, 255, 9]);
jsr.hostCallBinary('test.bytes', source.subarray(1, 7));
source.fill(0);
''');
    await pumpEventQueue();
    expect(binaries.single, orderedEquals(<int>[0, 1, 2, 253, 254, 255]));
  });

  test('synchronous JS startup does not block main-isolate timers', () async {
    final backend = buildIsolateBackend(widgetId);
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
    trackIsolateBackend(backend);
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
    final backend = buildIsolateBackend(widgetId, onRender: renders.add);
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
          trackIsolateBackend(backend);
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
