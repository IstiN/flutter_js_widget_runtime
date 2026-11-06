import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart' show hasQuickjsNativeLib;

/// Fuzz pin for the fused `jsr.b64encode` fast path (js_widget_bootstrap).
///
/// The per-frame R1 geometry envelopes cross the QuickJS worker's b64 JSON
/// lane, and the historical encoder (one 4-char string concat per 3 bytes +
/// `Array.join`) spent ~50ms of QuickJS time on an 868KB envelope. The fused
/// pair-table encoder must stay BYTE-IDENTICAL to that historical output —
/// the strict Dart base64 decoder and every recorded host-side payload pin
/// depend on it.
///
/// This test evals the shipped `jsr.b64encode` against an inlined copy of
/// the historical algorithm over deterministic inputs: every length 0..97
/// (covers both padding tails and short-chunk apply), power-of-two lengths
/// into the chunked path, and pseudo-random/constant 256KB buffers.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets(
    'fused jsr.b64encode stays byte-identical to the historical encoder',
    (WidgetTester tester) async {
      const source = '''
;(function(){
  // Historical algorithm (pre-fusion) — the reference.
  function reference(data){
    var u8;
    if (data instanceof Uint8Array) u8 = data;
    else if (data && data.buffer) {
      u8 = new Uint8Array(data.buffer, data.byteOffset || 0, data.byteLength);
    } else u8 = new Uint8Array(data);
    var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' + '0123456789' + '+/';
    var out = new Array(((u8.length + 2) / 3) | 0);
    var o = 0, i;
    for (i = 0; i + 2 < u8.length; i += 3) {
      var n = (u8[i] << 16) | (u8[i + 1] << 8) | u8[i + 2];
      out[o++] = A[(n >> 18) & 63] + A[(n >> 12) & 63] + A[(n >> 6) & 63] + A[n & 63];
    }
    var rem = u8.length - i;
    if (rem === 1) {
      var n1 = u8[i] << 16;
      out[o++] = A[(n1 >> 18) & 63] + A[(n1 >> 12) & 63] + '==';
    } else if (rem === 2) {
      var n2 = (u8[i] << 16) | (u8[i + 1] << 8);
      out[o++] = A[(n2 >> 18) & 63] + A[(n2 >> 12) & 63] + A[(n2 >> 6) & 63] + '=';
    }
    return out.join('');
  }
  function lcg(seed){ var s = seed >>> 0; return function(){ s = (s * 1664525 + 1013904223) >>> 0; return s >>> 24; }; }
  function buffer(len, kind){
    var u8 = new Uint8Array(len);
    if (kind === 0) { var next = lcg(len + 7); for (var i = 0; i < len; i++) u8[i] = next(); }
    else if (kind === 1) { u8.fill(255); }
    else if (kind === 2) { u8.fill(0); }
    else { for (var j = 0; j < len; j++) u8[j] = (j * 7 + 13) & 255; }
    return u8;
  }
  var failures = [], cases = 0;
  var lens = [];
  for (var l = 0; l <= 97; l++) lens.push(l);
  lens.push(8190, 8191, 8192, 8193, 8194, 8195, 12285, 12288, 16384, 65536, 262144, 262145, 262146);
  for (var li = 0; li < lens.length; li++) {
    var len = lens[li];
    for (var kind = 0; kind < 4; kind++) {
      var u8 = buffer(len, kind);
      var got = jsr.b64encode(u8);
      var want = reference(u8);
      cases++;
      if (got !== want) failures.push({ len: len, kind: kind, gotLen: (got || '').length, wantLen: (want || '').length });
    }
  }
  // Views encode only their visible range (byte-image contract).
  var big = buffer(100, 0);
  var view = big.subarray(10, 31);
  cases++;
  if (jsr.b64encode(view) !== reference(view)) failures.push({ len: 'view', kind: -1 });
  // ArrayBuffer / array-like inputs keep the element-wise contract.
  cases++;
  if (jsr.b64encode([1, 2, 3, 4]) !== reference([1, 2, 3, 4])) failures.push({ len: 'arraylike', kind: -1 });
  jsr.exportState({ b64Fuzz: { cases: cases, failures: failures } });
})();
''';
      final harness = await ThreeQuickjsExampleHarness.bootSource(
        tester,
        source: source,
        instanceId: 'b64-fuzz',
      );
      addTearDown(() => harness.dispose(tester));
      final pin = harness.engine.exportedState?['b64Fuzz'] as Map?;
      expect(pin, isNotNull, reason: 'fuzz probe must publish results');
      expect(pin!['cases'] as int, greaterThan(400));
      expect(
        pin['failures'],
        isEmpty,
        reason: 'fused b64encode diverged from the historical encoder',
      );
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(minutes: 4)),
  );
}
