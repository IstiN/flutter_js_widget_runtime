import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';

import '../support/three_1b_engine.dart';

// IT-TRANSPORT-1 (issue #7, F2 batching row): the REAL generated facade runs
// in the REAL engine (QuickJS backend, angle1b selected) against a recording
// wire. Ordinary frames batch: N void commands leave as ONE dispatch with the
// [u32 0][u32 count] framing; a data-returning call flushes the queue and its
// rc answers the batch; finish/flush flush synchronously.
//
// The real-ANGLE timing twin of this test is tool/three/bench_1b.dart
// (PERF-1/PERF-2 on the macOS host).
int _u32(Uint8List b, int o) =>
    ByteData.sublistView(b).getUint32(o, Endian.little);

String _widget(String body, {Map<String, Object?> out = const {}}) => '''
var out = ${jsonEncode(out)};
try {
  var canvas = document.createElement('canvas');
  canvas.width = 8; canvas.height = 8;
  var gl = canvas.getContext('webgl2', { antialias: false });
  $body
} catch (e) {
  out.err = String(e && e.message ? e.message : e);
}
jsr.exportState(out);
''';

void main() {
  test(
    'IT-TRANSPORT-1: 500 draw calls leave as ONE batched dispatch',
    () async {
      final (w, _, state) = await run1bWidgetEngine(
        _widget(
          'for (var i = 0; i < 500; i++) gl.drawArrays(gl.TRIANGLES, 0, 3);'
          ' out.draws = 500;',
          out: {'draws': 0},
        ),
        realFacade: true,
      );
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
      final (w, _, state) = await run1bWidgetEngine(
        _widget(
          'for (var i = 0; i < 10; i++) gl.drawArrays(gl.TRIANGLES, 0, 3);'
          ' out.rc = gl.getError();',
          out: {'rc': null},
        ),
        realFacade: true,
      );
      expect(state?['err'], isNull, reason: state?['err']?.toString());
      expect(state?['rc'], 0, reason: 'getError answered the whole batch');
      expect(w.dispatches1B.length, 1);
      final batch = w.dispatches1B.single;
      expect(_u32(batch, 0), 0);
      expect(_u32(batch, 4), 11, reason: 'queue + the data-returning command');
    },
  );

  test('IT-TRANSPORT-1: finish flushes synchronously', () async {
    final (w, _, state) = await run1bWidgetEngine(
      _widget(
        'gl.drawArrays(gl.TRIANGLES, 0, 3); gl.finish(); out.done = true;',
        out: {'done': false},
      ),
      realFacade: true,
    );
    expect(state?['err'], isNull, reason: state?['err']?.toString());
    expect(state?['done'], true);
    expect(w.dispatches1B.length, 1);
    expect(_u32(w.dispatches1B.single, 4), 2, reason: 'draw + finish');
  });
}
