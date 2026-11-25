import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/model/js_three_backend.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';
import 'package:jsr_three_angle/jsr_three_angle.dart';

import '../support/fake_three_host.dart';

// IT-TRANSPORT-1 (issue #7, F2 batching row): the REAL generated facade runs
// in the REAL engine (QuickJS backend, angle1b selected) against a recording
// wire. Ordinary frames batch: N void commands leave as ONE dispatch with the
// [u32 0][u32 count] framing; a data-returning call flushes the queue and its
// rc answers the batch; finish/flush flush synchronously.
//
// The real-ANGLE timing twin of this test is tool/three/bench_1b.dart
// (PERF-1/PERF-2 on the macOS host).
String _realBootstrap() => Angle1bBootstrap.compose(
  packer: File('tool/three/gen/g1_packer.js').readAsStringSync(),
  facade: File('packages/jsr_three_angle/facade/webgl2_facade.js')
      .readAsStringSync(),
);

Fake1BWireHost _wire() =>
    Fake1BWireHost()..facadeBootstrapOverride = _realBootstrap();

Future<(Fake1BWireHost, Map<String, dynamic>?)> _run(String widget) async {
  debugDefaultTargetPlatformOverride = TargetPlatform.macOS;
  final w = _wire();
  final engine = JsWidgetEngine(
    config: JsRuntimeConfig(
      onRender: (_) {},
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
      backendFactory: (cfg) => QuickjsWidgetEngineBackend(config: cfg),
      threeEnabled: true,
      threeSource: 'var THREE = {};',
      threeBackend: JsThreeBackend.angle1b,
      threeHost: w,
      allowCustomShaders: false,
    ),
  );
  try {
    await engine.run(widget);
    return (w, engine.exportedState);
  } finally {
    debugDefaultTargetPlatformOverride = null;
    await engine.dispose();
  }
}

int _u32(Uint8List b, int o) =>
    ByteData.sublistView(b).getUint32(o, Endian.little);

void main() {
  test(
    'IT-TRANSPORT-1: 500 draw calls leave as ONE batched dispatch',
    () async {
      final widget = '''
var out = { draws: 0, err: null };
try {
  var canvas = document.createElement('canvas');
  canvas.width = 8; canvas.height = 8;
  var gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) throw new Error('no webgl2 facade');
  for (var i = 0; i < 500; i++) gl.drawArrays(gl.TRIANGLES, 0, 3);
  out.draws = 500;
} catch (e) {
  out.err = String(e && e.message ? e.message : e);
}
jsr.exportState(out);
''';
      final (w, state) = await _run(widget);
      expect(state?['err'], isNull, reason: state?['err']?.toString());
      expect(state?['draws'], 500);
      expect(w.dispatches1B.length, 1, reason: 'one flush per ordinary frame');
      final batch = w.dispatches1B.single;
      expect(_u32(batch, 0), 0, reason: 'batch header opcode 0');
      expect(_u32(batch, 4), 500, reason: 'batch header count');
      expect(_u32(batch, 8), 183, reason: 'the first queued command is drawArrays');
      expect(batch.length, 8 + 500 * 16, reason: 'header + 500 x [op + 3 x i32]');
    },
  );

  test(
    'IT-TRANSPORT-1: a data-returning call flushes queue + command as one batch',
    () async {
      final widget = '''
var out = { rc: null, err: null };
try {
  var canvas = document.createElement('canvas');
  canvas.width = 8; canvas.height = 8;
  var gl = canvas.getContext('webgl2', { antialias: false });
  for (var i = 0; i < 10; i++) gl.drawArrays(gl.TRIANGLES, 0, 3);
  out.rc = gl.getError();
} catch (e) {
  out.err = String(e && e.message ? e.message : e);
}
jsr.exportState(out);
''';
      final (w, state) = await _run(widget);
      expect(state?['err'], isNull, reason: state?['err']?.toString());
      expect(state?['rc'], 0, reason: 'getError answered the whole batch');
      expect(w.dispatches1B.length, 1);
      final batch = w.dispatches1B.single;
      expect(_u32(batch, 0), 0);
      expect(_u32(batch, 4), 11, reason: 'queue + the data-returning command');
    },
  );

  test('IT-TRANSPORT-1: finish flushes synchronously', () async {
    final widget = '''
var out = { done: false, err: null };
try {
  var canvas = document.createElement('canvas');
  canvas.width = 8; canvas.height = 8;
  var gl = canvas.getContext('webgl2', { antialias: false });
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.finish();
  out.done = true;
} catch (e) {
  out.err = String(e && e.message ? e.message : e);
}
jsr.exportState(out);
''';
    final (w, state) = await _run(widget);
    expect(state?['err'], isNull, reason: state?['err']?.toString());
    expect(state?['done'], true);
    expect(w.dispatches1B.length, 1);
    expect(_u32(w.dispatches1B.single, 4), 2, reason: 'draw + finish');
  });
}
