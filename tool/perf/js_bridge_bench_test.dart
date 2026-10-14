import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

/// Bridge microbenchmark: what does a 60 Hz JS->Dart command stream cost
/// through the REAL QuickJS backend, JSON graph vs base64-packed Float32.
///
/// Run explicitly (not part of the default suite):
///   flutter test tool/perf/js_bridge_bench_test.dart
final bool hasQuickjsNativeLib = File(QuickjsFfi.libraryPath).existsSync();

Future<QuickjsWidgetEngineBackend> boot() async {
  var hostCalls = 0;
  var binaryCalls = 0;
  var jsonFloats = 0.0;
  var b64Floats = 0.0;
  final backend = QuickjsWidgetEngineBackend(
    config: JsRuntimeConfig(
      widgetId: 'bridge-bench',
      onRender: (_) {},
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
      initialStorage: const {},
      onHostCallBinary: (name, data) {
        binaryCalls++;
        final bd = ByteData.view(
          data.buffer,
          data.offsetInBytes,
          data.lengthInBytes,
        );
        for (var i = 0; i + 4 <= data.lengthInBytes; i += 4) {
          b64Floats += bd.getFloat32(i, Endian.little);
        }
      },
      onHostCall: (name, args) {
        hostCalls++;
        switch (name) {
          case 'bench.json':
            // Consume like a real transform consumer: walk every item.
            final items = args['items'];
            if (items is List) {
              for (final it in items) {
                if (it is Map) {
                  final p = it['position'];
                  if (p is List && p.isNotEmpty) {
                    jsonFloats += (p[0] as num).toDouble();
                  }
                }
              }
            }
          case 'bench.b64':
            // One string -> bytes -> Float32List, then a flat walk.
            final b64 = args['b64'];
            if (b64 is String) {
              final bytes = base64Decode(b64);
              final f = ByteData.view(
                bytes.buffer,
                bytes.offsetInBytes,
                bytes.lengthInBytes,
              );
              for (var i = 0; i < bytes.lengthInBytes; i += 4) {
                b64Floats += f.getFloat32(i, Endian.little);
              }
            }
          case 'bench.empty':
            break;
        }
        // Resolve immediately: measures the promise plumbing, not the
        // handler's own async work.
        return Future<Object?>.value();
      },
    ),
  );
  addTearDown(backend.dispose);
  await backend.init();
  return backend;
}

const String widgetJs = '''
(function() {
  // b64encode comes from the real bootstrap (jsr.b64encode) — a local
  // copy here would count as duplication against it in jscpd.
  function buildItems(n) {
    var items = new Array(n);
    for (var i = 0; i < n; i++) {
      var x = i * 0.1;
      items[i] = { modelId: 'm' + i, position: [x, x * 2, x * 3], rotation: [0.1, 0.2, 0.3], scale: 1 };
    }
    return items;
  }
  function packF32(n) {
    var f = new Float32Array(n * 10);
    for (var i = 0; i < n; i++) {
      var o = i * 10, x = i * 0.1;
      f[o] = i; f[o+1] = x; f[o+2] = x * 2; f[o+3] = x * 3;
      f[o+4] = 0.1; f[o+5] = 0.2; f[o+6] = 0.3; f[o+7] = 1; f[o+8] = 1; f[o+9] = 1;
    }
    return f;
  }
  var R = {};

  async function runScenario(name, frames, items, mode) {
    var t0 = Date.now();
    var sentBytes = 0;
    if (mode === 'build') {
      for (var f = 0; f < frames; f++) { buildItems(items); }
      R[name] = { frames: frames, items: items, jsMs: Date.now() - t0 };
      return;
    }
    if (mode === 'stringify') {
      var s;
      for (var f2 = 0; f2 < frames; f2++) { s = JSON.stringify(buildItems(items)); }
      sentBytes = s.length;
      R[name] = { frames: frames, items: items, jsMs: Date.now() - t0, bytes: sentBytes };
      return;
    }
    if (mode === 'pack') {
      var b;
      for (var f3 = 0; f3 < frames; f3++) { b = jsr.b64encode(packF32(items)); }
      sentBytes = b.length;
      R[name] = { frames: frames, items: items, jsMs: Date.now() - t0, bytes: sentBytes };
      return;
    }
    var perCall = [];
    var pending = [];
    for (var f4 = 0; f4 < frames; f4++) {
      if (mode === 'json-await') {
        var payload = { items: buildItems(items) };
        var c0 = Date.now();
        await jsr.hostCall('bench.json', payload);
        perCall.push(Date.now() - c0);
      } else if (mode === 'b64-await') {
        var b64 = jsr.b64encode(packF32(items));
        sentBytes = b64.length;
        var c1 = Date.now();
        await jsr.hostCall('bench.b64', { b64: b64 });
        perCall.push(Date.now() - c1);
      } else if (mode === 'json-fire') {
        var payload2 = { items: buildItems(items) };
        var c2 = Date.now();
        pending.push(jsr.hostCall('bench.json', payload2).then(function() { perCall.push(Date.now() - c2); }));
      } else if (mode === 'b64-fire') {
        var b642 = jsr.b64encode(packF32(items));
        sentBytes = b642.length;
        var c3 = Date.now();
        pending.push(jsr.hostCall('bench.b64', { b64: b642 }).then(function() { perCall.push(Date.now() - c3); }));
      } else if (mode === 'typed-fire') {
        var f4 = packF32(items);
        var c6 = Date.now();
        jsr.hostCallBinary('bench.bin', f4);
        perCall.push(Date.now() - c6);
      } else if (mode === 'bin-fire') {
        var f2 = packF32(items);
        var b3 = jsr.b64encode(new Uint8Array(f2.buffer));
        sentBytes = b3.length;
        var c5 = Date.now();
        jsr.hostCallBinary('bench.bin', b3);
        perCall.push(Date.now() - c5);
      } else if (mode === 'empty-await') {
        var c4 = Date.now();
        await jsr.hostCall('bench.empty', {});
        perCall.push(Date.now() - c4);
      }
    }
    await Promise.all(pending);
    var total = Date.now() - t0;
    var sum = 0, mx = 0;
    for (var k = 0; k < perCall.length; k++) { sum += perCall[k]; if (perCall[k] > mx) mx = perCall[k]; }
    R[name] = {
      frames: frames, items: items, totalMs: total, avgMs: sum / perCall.length,
      maxMs: mx, bytes: sentBytes
    };
  }

  handleEvent = function(id, payload) {
    if (id !== 'run') return Promise.resolve();
    var p = payload || {};
    var chain = Promise.resolve();
    var scenarios = p.scenarios || [];
    for (var i = 0; i < scenarios.length; i++) {
      (function(s) {
        chain = chain.then(function() {
          return runScenario(s.name, s.frames, s.items, s.mode);
        });
      })(scenarios[i]);
    }
    return chain.then(function() { jsr.exportState(R); });
  };
})();
''';

Future<Map<String, dynamic>?> exportedStateOf(
  QuickjsWidgetEngineBackend backend,
) async {
  for (var i = 0; i < 600 && backend.exportedState == null; i++) {
    await Future<void>.delayed(const Duration(milliseconds: 10));
  }
  return backend.exportedState;
}

void main() {
  if (!hasQuickjsNativeLib) {
    // Keep `flutter test` green on machines without the bridge .so.
    return;
  }

  test('bridge bench: JSON graph vs b64 Float32 over hostCall', () async {
    final backend = await boot();
    await backend.run(widgetJs);

    final scenarios = <Map<String, dynamic>>[
      // JS-side costs, no bridge.
      {'name': 'build100', 'frames': 600, 'items': 100, 'mode': 'build'},
      {'name': 'stringify100', 'frames': 600, 'items': 100, 'mode': 'stringify'},
      {'name': 'pack100', 'frames': 600, 'items': 100, 'mode': 'pack'},
      // Full round trips, sequential (one transform batch per frame).
      {'name': 'emptyAwait', 'frames': 200, 'items': 0, 'mode': 'empty-await'},
      {'name': 'jsonAwait100', 'frames': 200, 'items': 100, 'mode': 'json-await'},
      {'name': 'b64Await100', 'frames': 200, 'items': 100, 'mode': 'b64-await'},
      {'name': 'jsonAwait300', 'frames': 100, 'items': 300, 'mode': 'json-await'},
      {'name': 'b64Await300', 'frames': 100, 'items': 300, 'mode': 'b64-await'},
      // Pipelined bursts (no await between frames).
      {'name': 'jsonFire100', 'frames': 200, 'items': 100, 'mode': 'json-fire'},
      {'name': 'b64Fire100', 'frames': 200, 'items': 100, 'mode': 'b64-fire'},
      // Particle-storm scale: where does the curve bend.
      {'name': 'jsonAwait1000', 'frames': 40, 'items': 1000, 'mode': 'json-await'},
      {'name': 'b64Await1000', 'frames': 40, 'items': 1000, 'mode': 'b64-await'},
      // The new binary lane: fire-and-forget, no JSON, no promise.
      {'name': 'binFire100', 'frames': 200, 'items': 100, 'mode': 'bin-fire'},
      {'name': 'binFire300', 'frames': 100, 'items': 300, 'mode': 'bin-fire'},
      {'name': 'binFire1000', 'frames': 40, 'items': 1000, 'mode': 'bin-fire'},
      // Native bytes lane: typed array crosses by (pointer, length) —
      // no b64 encode at all.
      {'name': 'typedFire100', 'frames': 200, 'items': 100, 'mode': 'typed-fire'},
      {'name': 'typedFire300', 'frames': 100, 'items': 300, 'mode': 'typed-fire'},
      {'name': 'typedFire1000', 'frames': 40, 'items': 1000, 'mode': 'typed-fire'},
    ];

    final sw = Stopwatch()..start();
    await backend.callEvent('run', {'scenarios': scenarios});
    await exportedStateOf(backend);
    sw.stop();

    final state = backend.exportedState ?? const {};
    final rows = StringBuffer()
      ..writeln('| scenario | frames | bytes/frame | total ms | avg ms/call | max ms | per-frame @60Hz |')
      ..writeln('|---|---|---|---|---|---|---|');
    for (final s in scenarios) {
      final r = state[s['name']] as Map?;
      if (r == null) {
        rows.writeln('| ${s['name']} | MISSING | | | | | |');
        continue;
      }
      final total = (r['totalMs'] as num?) ?? (r['jsMs'] as num?) ?? 0;
      final avg = (r['avgMs'] as num?) ?? 0;
      final mx = (r['maxMs'] as num?) ?? 0;
      final bytes = (r['bytes'] as num?) ?? 0;
      final frames = (r['frames'] as num?) ?? 1;
      rows.writeln(
        '| ${s['name']} | $frames | $bytes | ${total.toStringAsFixed(0)} '
        '| ${avg.toStringAsFixed(2)} | ${mx.toStringAsFixed(0)} '
        '| ${(total / frames * 1000 / 1e3).toStringAsFixed(2)} ms |',
      );
    }
    // ignore: avoid_print
    print('\n=== QuickJS bridge bench (host=${Platform.operatingSystem}, '
        'wall=${sw.elapsedMilliseconds}ms, hostCalls consumed silently) ===');
    // ignore: avoid_print
    print(rows);
    expect(state, isNotEmpty);
  }, timeout: const Timeout(Duration(minutes: 5)));
}
