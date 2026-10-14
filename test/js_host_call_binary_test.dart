import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_bridge.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

/// Tests for the fire-and-forget binary lane: `jsr.b64encode` (bootstrap)
/// and `jsr.hostCallBinary` (bridge `__jsr_host_call_binary` channel →
/// `JsRuntimeConfig.onHostCallBinary`). This is the cheapest JS->Dart path
/// for per-frame bulk data: no JSON body parse, no promise round trip.
final bool hasQuickjsNativeLib = File(QuickjsFfi.libraryPath).existsSync();

const String widgetJs = '''
(function() {
  handleEvent = function(id, payload) {
    if (id === 'encode') {
      // Vector table: lengths around the 3-byte b64 quantum boundary.
      var cases = payload.cases || [];
      var out = [];
      for (var i = 0; i < cases.length; i++) {
        var n = cases[i];
        var u8 = new Uint8Array(n);
        for (var j = 0; j < n; j++) u8[j] = (j * 7 + n) & 255;
        out.push(jsr.b64encode(u8));
      }
      jsr.exportState({ encoded: out });
    } else if (id === 'send-bin') {
      var f = new Float32Array(payload.count * 3);
      for (var k = 0; k < f.length; k++) f[k] = k * 0.5;
      jsr.hostCallBinary(payload.name, jsr.b64encode(new Uint8Array(f.buffer)));
      jsr.exportState({ sent: payload.count });
    } else if (id === 'send-typed') {
      var f = new Float32Array(payload.count * 3);
      for (var k = 0; k < f.length; k++) f[k] = k * 0.25;
      jsr.hostCallBinary(payload.name, f);
      jsr.exportState({ sentTyped: payload.count });
    } else if (id === 'burst') {
      var u8 = new Uint8Array(64);
      for (var b = 0; b < payload.times; b++) jsr.hostCallBinary('burst.ch', jsr.b64encode(u8));
      jsr.exportState({ burst: payload.times });
    } else if (id === 'malformed') {
      // No space separator -> dropped by the bridge, must not throw.
      jsr.hostCallBinary('nospace', '');
      jsr.hostCallBinary('spaced name', jsr.b64encode(new Uint8Array([1, 2, 3])));
      jsr.exportState({ malformed: true });
    } else if (id === 'empty-payload') {
      jsr.hostCallBinary('empty', null);
      jsr.exportState({ emptyPayload: true });
    }
    return Promise.resolve();
  };
})();
''';

Future<QuickjsWidgetEngineBackend> bootEngine({
  void Function(String name, Uint8List data)? onHostCallBinary,
  Map<String, List<int>>? received,
}) async {
  final backend = QuickjsWidgetEngineBackend(
    config: JsRuntimeConfig(
      widgetId: 'binary-lane-test',
      onRender: (_) {},
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
      initialStorage: const {},
      onHostCallBinary: onHostCallBinary == null
          ? null
          : (name, data) {
              onHostCallBinary(name, data);
              received?[name] = data.toList();
            },
    ),
  );
  addTearDown(backend.dispose);
  await backend.init();
  await backend.run(widgetJs);
  return backend;
}

Future<Map<String, dynamic>?> exportedStateOf(
  QuickjsWidgetEngineBackend backend,
) async {
  for (var i = 0; i < 100 && backend.exportedState == null; i++) {
    await Future<void>.delayed(const Duration(milliseconds: 10));
  }
  return backend.exportedState;
}

void main() {
  if (!hasQuickjsNativeLib) return;

  test('jsr.b64encode matches Dart base64 across quantum boundaries',
      () async {
    final backend = await bootEngine();
    final cases = <int>[0, 1, 2, 3, 4, 5, 63, 64, 255, 1024];
    await backend.callEvent('encode', {'cases': cases});
    final state = await exportedStateOf(backend);
    final encoded = (state?['encoded'] as List?)?.cast<String>() ?? [];
    expect(encoded, hasLength(cases.length));
    for (var i = 0; i < cases.length; i++) {
      final n = cases[i];
      final expected = List<int>.generate(
        n,
        (j) => (j * 7 + n) & 255,
      );
      expect(base64.encode(expected), encoded[i], reason: 'length $n');
    }
  });

  test('hostCallBinary delivers (name, bytes) to onHostCallBinary',
      () async {
    final received = <String, List<int>>{};
    final names = <String>[];
    final backend = await bootEngine(
      onHostCallBinary: (name, data) => names.add(name),
      received: received,
    );
    await backend.callEvent('send-bin', {'name': 'scene.transforms', 'count': 8});
    final state = await exportedStateOf(backend);
    expect(state?['sent'], 8);
    expect(names, ['scene.transforms']);
    final bytes = received['scene.transforms']!;
    expect(bytes.length, 8 * 3 * 4);
    final floats = Float32List.view(
      Uint8List.fromList(bytes).buffer,
    );
    for (var k = 0; k < floats.length; k++) {
      expect(floats[k], k * 0.5);
    }
  });

  test('hostCallBinary is fire-and-forget: a 100-call burst all lands',
      () async {
    var deliveries = 0;
    final backend = await bootEngine(
      onHostCallBinary: (_, __) => deliveries++,
    );
    await backend.callEvent('burst', {'times': 100});
    await exportedStateOf(backend);
    expect(deliveries, 100);
  });

  test('empty b64 delivers empty bytes; spaced names are sanitized',
      () async {
    final received = <String, List<int>>{};
    final backend = await bootEngine(
      onHostCallBinary: (name, data) => received[name] = data.toList(),
      received: received,
    );
    await backend.callEvent('malformed', {});
    await exportedStateOf(backend);
    // 'nospace' + empty b64 is a valid empty payload; 'spaced name' lost
    // its space and its bytes still arrived.
    expect(received['nospace'], isEmpty);
    expect(received['spaced_name'], [1, 2, 3]);
  });

  test('null payload degrades to empty bytes', () async {
    final received = <String, List<int>>{};
    final backend = await bootEngine(
      onHostCallBinary: (name, data) => received[name] = data.toList(),
      received: received,
    );
    await backend.callEvent('empty-payload', {});
    await exportedStateOf(backend);
    expect(received['empty'], isEmpty);
  });

  test('native bytes lane: typed arrays cross by (pointer, length)',
      () async {
    if (!File(QuickjsFfi.libraryPath).existsSync()) return;
    final received = <String, List<int>>{};
    final backend = await bootEngine(
      onHostCallBinary: (name, data) => received[name] = data.toList(),
      received: received,
    );
    await backend.callEvent('send-typed', {'name': 'kart.f32', 'count': 6});
    final state = await exportedStateOf(backend);
    expect(state?['sentTyped'], 6);
    final bytes = received['kart.f32']!;
    expect(bytes.length, 6 * 3 * 4);
    final floats = Float32List.view(Uint8List.fromList(bytes).buffer);
    for (var k = 0; k < floats.length; k++) {
      expect(floats[k], k * 0.25);
    }
  });

  test('typed arrays fall back to b64 when the native lane is absent',
      () async {
    final received = <String, List<int>>{};
    final backend = await bootEngine(
      onHostCallBinary: (name, data) => received[name] = data.toList(),
      received: received,
    );
    // Reboot with a host bootstrap that shadows the native global: the
    // widget-side shim must degrade to the b64 string path and still
    // deliver the bytes (this is every JSC / old-native-library runtime).
    await backend.run(
      widgetJs,
      hostBootstrapJs: '__jsrSendBytes = undefined;',
    );
    await backend.callEvent('send-typed', {'name': 'fallback.ch', 'count': 2});
    await exportedStateOf(backend);
    final bytes = received['fallback.ch'];
    expect(bytes, hasLength(2 * 3 * 4));
  });

  test('bridge-level: the binary channel works without a QuickJS engine',
      () async {
    // flutter_js (JSC) and the web worker share this dispatch case — a
    // direct dispatch covers them without a JS runtime.
    final names = <String>[];
    Uint8List? data;
    final bridge = JsWidgetBridge(
      widgetId: 'bridge-only',
      onRender: (_) {},
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
      onLog: (_) {},
      isDisposed: () => false,
      resolveCallback: (_, __) {},
      fetchHandler: (_, __, ___, ____) async {},
      secretsGetHandler: (_, __) async {},
      secretsSetHandler: (_, __, ___) async {},
      loadAssetHandler: (_, __) async {},
      execHandler: (_, __) async {},
      onHostCallBinary: (name, bytes) {
        names.add(name);
        data = bytes;
      },
      intervalTickHandler: (_) {},
      rafTickHandler: (_, __) {},
      initialStorage: const {},
    );
    addTearDown(bridge.dispose);
    await bridge.dispatch(
      '__jsr_host_call_binary',
      'voxel.mesh ${base64.encode([9, 8, 7, 6])}',
    );
    expect(names, ['voxel.mesh']);
    expect(data, [9, 8, 7, 6]);
    // Genuinely malformed (no separator) drops without throwing.
    await bridge.dispatch('__jsr_host_call_binary', 'noseparator');
    await bridge.dispatch('__jsr_host_call_binary', 'bad b64!@@');
    expect(names, ['voxel.mesh']);
  });

  test('no handler configured: binary traffic is silently ignored',
      () async {
    final backend = await bootEngine();
    await backend.callEvent('burst', {'times': 5});
    final state = await exportedStateOf(backend);
    expect(state?['burst'], 5); // Widget keeps running, nothing thrown.
  });
}
