import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

/// Webcam pull-lane microbenchmark: what does one `camera.frame` JS pull
/// (hostCall JSON resolve carrying a base64 RGBA frame + JS-side decode)
/// cost through the REAL QuickJS backend, at the capture sizes the example
/// camera host serves?
///
/// Run explicitly (not part of the default suite):
///   flutter test tool/perf/js_webcam_pull_bench_test.dart
final bool hasQuickjsNativeLib = QuickjsFfi.isAvailable;

Future<QuickjsWidgetEngineBackend> boot(int width, int height) async {
  final frameBytes = width * height * 4;
  var pulls = 0;
  final backend = QuickjsWidgetEngineBackend(
    config: JsRuntimeConfig(
      widgetId: 'webcam-pull-bench',
      onRender: (_) {},
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
      initialStorage: const {},
      onHostCall: (name, args) {
        if (name != 'camera.frame') return Future<Object?>.value();
        pulls++;
        // The real host serves a retained RGBA frame that must be freshly
        // base64-encoded every pull — dart:convert over ~1MB is the dominant
        // Dart-side cost, so measure it here.
        final payload = base64Encode(
          Uint8List.fromList(List.generate(frameBytes, (i) => (i * 7) & 0xFF)),
        );
        return Future<Object?>.value({
          'available': true,
          'changed': true,
          'seq': pulls,
          'width': width,
          'height': height,
          'format': 'rgba',
          'data': payload,
        });
      },
    ),
  );
  addTearDown(backend.dispose);
  await backend.init();
  return backend;
}

const String widgetJs = '''
(function () {
  // Same routine shape the prepared widget uses: bounded table-driven
  // base64 -> Uint8Array (kept local so the bench mirrors the widget's work).
  function decode(b64, out) {
    var table = decode.table;
    if (!table) {
      table = new Uint8Array(128);
      var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      for (var i = 0; i < 64; i++) table[chars.charCodeAt(i)] = i;
      decode.table = table;
    }
    var len = b64.length;
    var pad = 0;
    if (len > 0 && b64.charCodeAt(len - 1) === '=') pad++;
    if (len > 1 && b64.charCodeAt(len - 2) === '=') pad++;
    var bytes = (len * 3 >> 2) - pad;
    var p = 0;
    for (var i = 0; i + 3 < len; i += 4) {
      var a = table[b64.charCodeAt(i)];
      var b = table[b64.charCodeAt(i + 1)];
      var c = table[b64.charCodeAt(i + 2)];
      var d = table[b64.charCodeAt(i + 3)];
      out[p++] = (a << 2) | (b >> 4);
      if (p < bytes) out[p++] = ((b & 15) << 4) | (c >> 2);
      if (p < bytes) out[p++] = ((c & 3) << 6) | d;
    }
    return bytes;
  }
  handleEvent = function (id, payload) {
    if (id !== 'run') return Promise.resolve();
    var p = payload || {};
    var w = p.width, h = p.height;
    var rounds = p.rounds || 20;
    var out = new Uint8Array(w * h * 4);
    var perPull = [], perDecode = [], checksum = 0;
    var chain = Promise.resolve();
    for (var i = 0; i < rounds; i++) {
      chain = chain.then(function () {
        var t0 = Date.now();
        return jsr.hostCall('camera.frame', { seq: -1 }).then(function (f) {
          var t1 = Date.now();
          checksum += decode(f.data, out);
          var t2 = Date.now();
          if (i > 2) { perPull.push(t1 - t0); perDecode.push(t2 - t1); }
        });
      });
    }
    return chain.then(function () {
      function avg(list) {
        var s = 0;
        for (var k = 0; k < list.length; k++) s += list[k];
        return list.length ? s / list.length : 0;
      }
      jsr.exportState({
        pulls: perPull.length,
        avgPullMs: avg(perPull),
        maxPullMs: Math.max.apply(null, perPull.concat([0])),
        avgDecodeMs: avg(perDecode),
        checksum: checksum,
      });
    });
  };
})();
''';

void main() {
  test('camera.frame pull round-trip at candidate capture sizes', () async {
    if (!hasQuickjsNativeLib) return;
    final sw = Stopwatch();
    for (final size in const [(320, 180), (640, 360)]) {
      final backend = await boot(size.$1, size.$2);
      await backend.run(widgetJs);
      sw
        ..reset()
        ..start();
      await backend.callEvent('run', {
        'width': size.$1,
        'height': size.$2,
        'rounds': 20,
      });
      Map<String, dynamic>? state;
      for (var i = 0; i < 100 && backend.exportedState == null; i++) {
        await Future<void>.delayed(const Duration(milliseconds: 10));
        state = backend.exportedState;
      }
      final wallMs = sw.elapsedMilliseconds / 20;
      File('/tmp/webcam_pull_bench.txt').writeAsStringSync(
        'webcam-pull ${size.$1}x${size.$2} '
        'jsPerPullMs=${state?['avgPullMs']} '
        'jsMaxPullMs=${state?['maxPullMs']} '
        'jsDecodeMs=${state?['avgDecodeMs']} '
        'wallPerRoundMs=$wallMs '
        'frameKB=${(size.$1 * size.$2 * 4 / 1024).round()}\n',
        mode: FileMode.append,
      );
      await backend.dispose();
    }
  }, timeout: const Timeout(Duration(minutes: 5)));
}
