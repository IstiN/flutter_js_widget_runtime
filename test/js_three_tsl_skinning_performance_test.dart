import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart' show hasQuickjsNativeLib;

/// Perf regression pin for `three-tsl-skinning` (official webgl_tsl_skinning —
/// the Michelle.glb skinned character driven by an AnimationMixer through the
/// bounded TSL fallback).
///
/// The whole frame used to happen on the QuickJS side twice over: the CPU
/// skinning walk ran a per-vertex 4-influence loop for the 16,340-vertex rig
/// (~60ms), and the ~868KB per-frame R1 envelope crossed the host boundary as
/// a base64 JSON string (~40ms of QuickJS encode alone, plus the Dart-side
/// decode). The catalog widget was reported at ~12 FPS.
///
/// The fix keeps the widget untouched and moves both costs into lanes:
///
/// 1. `three.skin` native lane — `_applySkining` hands (bone matrices, skin
///    indices/weights, bind pose) to Dart through `registerHostBytesFn`
///    (call-scoped view, pure local math) and reads the skinned
///    positions/normals back in place. Bit-compatible: when the packet is
///    rejected (non-finite guard) the historical JS loop still runs and the
///    strict decoder sees exactly what it always saw.
/// 2. `__jsrSendBytes` native lane in the persistent worker — the bootstrap's
///    native-lane branch routes R1 envelopes straight to the worker's host
///    bytes callback, which copies the call-scoped view onto a plain port
///    message (never TransferableTypedData — that transfer variant is the
///    disabled SIGBUS lane). Zero b64, zero JSON.
///
/// This test pins the end-to-end budget on the real widget through the
/// catalog's isolated QuickJS backend:
///
/// 1. Animation stays alive: frames keep submitting, the skinned geometry
///    keeps re-uploading (the pose actually moves), and the draw plan stays
///    healthy.
/// 2. Steady-state JS frame budget: the windowed rAF tick average stays far
///    below the ~60ms regression shape (JS skin loop + b64 encode; measured
///    ~16ms on this debug harness after the lanes, which sits at the vsync
///    edge here and is comfortably under it in release builds).
/// 3. Protocol byte bound: one three.r1 envelope stays O(base geometry)
///    (~868KB: position+normal re-uploaded with the pose, plus uv+indices),
///    never O(skin storage) or a re-encoded duplicate stream.
/// 4. Geometry upsert bound: only the skinned geometry re-upserts per frame —
///    no per-frame resource churn beyond the animated character.
/// 5. Native lanes engaged: the worker exposes the skin bytes fn and the
///    renderer drives it every animated frame; envelopes submitted to the
///    host keep up with the envelopes sent from JS (no silent drop stream).
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets(
    'tsl-skinning keeps the skinned-frame budget on the native lanes',
    (WidgetTester tester) async {
      // Structural pin: the R1 renderer must keep the native skinning lane
      // (the per-vertex JS loop is the fallback, not the path).
      final rendererSource = await tester.runAsync(
        () async => File('tool/three/src/native_renderer.js').readAsString(),
      );
      expect(
        rendererSource!.contains('globalThis.__jsrSkinBytes'),
        isTrue,
        reason: '_applySkining must route through the native skin lane',
      );

      const prelude = '''
;(function(){
  globalThis.__TSLPIN__ = {
    ticks: 0, tickMs: 0, frames: 0, bytes: 0,
    skinCalls: 0, noSkinFn: 0, seq: 0
  };
  var jsr = globalThis.jsr;
  var origBin = jsr.hostCallBinary;
  jsr.hostCallBinary = function(name, data) {
    if (name === 'three.r1') {
      var P = globalThis.__TSLPIN__;
      P.frames++;
      P.bytes += (data && data.byteLength) || 0;
    }
    return origBin.call(jsr, name, data);
  };
  if (typeof globalThis.__jsrSkinBytes === 'function') {
    var origSkin = globalThis.__jsrSkinBytes;
    globalThis.__jsrSkinBytes = function(name, data) {
      if (name === 'three.skin') globalThis.__TSLPIN__.skinCalls++;
      return origSkin(name, data);
    };
  } else {
    globalThis.__TSLPIN__.noSkinFn = 1;
  }
  var origRaf = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = function(cb) {
    return origRaf.call(globalThis, function(t) {
      var P = globalThis.__TSLPIN__;
      var t0 = performance.now();
      try { cb(t); } finally { P.ticks++; P.tickMs += performance.now() - t0; }
    });
  };
  setInterval(function() {
    var P = globalThis.__TSLPIN__;
    P.seq++;
    console.log('TSLSKINPIN ' + JSON.stringify({
      seq: P.seq, ticks: P.ticks, tickMs: Math.round(P.tickMs * 10) / 10,
      frames: P.frames, bytes: P.bytes, skinCalls: P.skinCalls,
      noSkinFn: P.noSkinFn
    }));
  }, 250);
})();
''';
      final widgetSource = await tester.runAsync(
        () async =>
            File('example/widgets/three-tsl-skinning/widget.js').readAsString(),
      );
      final harness = await ThreeQuickjsExampleHarness.bootSource(
        tester,
        source: prelude + widgetSource!,
        instanceId: 'three-tsl-skinning-pin',
        useIsolate: true,
        assetLoader: widgetDirAssetLoader('example/widgets/three-tsl-skinning'),
      );
      addTearDown(() => harness.dispose(tester));

      final backend = harness.backend;
      final rows = <Map<String, dynamic>>[];
      void collect() {
        for (final log in backend.flushLogs()) {
          final message = (log['msg'] ?? log['message'])?.toString() ?? '';
          if (!message.startsWith('TSLSKINPIN ')) continue;
          try {
            rows.add(
              jsonDecode(message.substring('TSLSKINPIN '.length))
                  as Map<String, dynamic>,
            );
          } on FormatException {
            // Truncated console line — skip.
          }
        }
      }

      Map<String, dynamic> lastPin() =>
          rows.isEmpty ? <String, dynamic>{} : rows.last;

      // Warm up: the GLB loads asynchronously, the character joins the scene,
      // the skin lane engages, and the diagnostics publisher runs on its
      // 250ms cadence so the probe observes at least one row.
      final warmPlan = await harness.pumpUntil(
        tester,
        (state, plan) {
          collect();
          return plan.draws.length >= 1 &&
              (lastPin()['frames'] as int? ?? 0) >= 20 &&
              state.submittedFrameCount >= 20;
        },
        attempts: 900,
      );
      expect(
        warmPlan,
        isNotNull,
        reason: 'tsl-skinning must reach an animated steady state',
      );
      harness.expectHealthy('webgl_tsl_skinning');

      // Fixed measurement window: 60 pumped frames (~1.5s wall). Windowed
      // deltas keep the load-time spikes (GLB decode, first texture uploads)
      // out of the steady-state budget.
      final state0 = harness.state!;
      collect();
      final pin0 = lastPin();
      final frames0 = state0.submittedFrameCount;
      final geometries0 = state0.geometryUploadCount;
      final textures0 = state0.textureUploadCount;
      final sw = Stopwatch()..start();
      await harness.pumpFrames(tester, 60);
      final windowSeconds = sw.elapsedMicroseconds / 1e6;
      collect();

      final state1 = harness.state!;
      final pin1 = lastPin();
      final submitted = state1.submittedFrameCount - frames0;
      final geometries = state1.geometryUploadCount - geometries0;
      final textures = state1.textureUploadCount - textures0;
      final ticks = (pin1['ticks'] as int? ?? 0) - (pin0['ticks'] as int? ?? 0);
      final tickMs =
          (pin1['tickMs'] as num? ?? 0) - (pin0['tickMs'] as num? ?? 0);
      final jsFrames =
          (pin1['frames'] as int? ?? 0) - (pin0['frames'] as int? ?? 0);
      final jsBytes =
          (pin1['bytes'] as int? ?? 0) - (pin0['bytes'] as int? ?? 0);
      final skinCalls =
          (pin1['skinCalls'] as int? ?? 0) - (pin0['skinCalls'] as int? ?? 0);
      final draws = (const ThreeDrawPlanner().plan(state1)).draws.length;

      // 1. Animation stays alive and plans cleanly.
      expect(submitted, greaterThan(0), reason: 'frames must keep submitting');
      final finalPlan = const ThreeDrawPlanner().plan(state1);
      expect(finalPlan.draws.length, greaterThanOrEqualTo(1));
      expect(finalPlan.diagnostics.warnings, isEmpty);

      // 2. Steady-state JS frame budget. Measured anchors on this harness:
      // ~60ms/tick before the lanes (per-vertex skin loop + b64 encode of the
      // 868KB envelope), ~16ms/tick after (debug JIT; ~4ms in the release
      // worker). The bound keeps ~4x headroom to the fix and fails ~2x below
      // the regression shape.
      final tickAvgMs = ticks > 0 ? tickMs / ticks : 0.0;
      // ignore: avoid_print
      print(
        'TSLSKINPIN window=${windowSeconds.toStringAsFixed(2)}s '
        'submitted=$submitted submittedPerS='
        '${(submitted / windowSeconds).toStringAsFixed(1)} '
        'jsFrames=$jsFrames tickAvgMs=${tickAvgMs.toStringAsFixed(2)} '
        'bytesPerEnvelope='
        '${(jsBytes / (jsFrames < 1 ? 1 : jsFrames)).toStringAsFixed(0)} '
        'skinCalls=$skinCalls geometryUpserts=$geometries '
        'geoPerFrame=${(geometries / (submitted < 1 ? 1 : submitted))
            .toStringAsFixed(2)} textures=$textures draws=$draws',
      );
      expect(
        tickAvgMs,
        lessThan(30),
        reason:
            'steady rAF tick must stay far below the ~60ms '
            'JS-skin-loop + b64 regression shape',
      );

      // 3. Protocol byte bound: ~868KB blended envelope (positions+normals
      // with the pose, uv+indices static), never a duplicated stream or the
      // ~4MB skin-packet payload per frame.
      expect(jsFrames, greaterThan(0), reason: 'envelopes must keep flowing');
      final bytesPerEnvelope = jsBytes / jsFrames;
      expect(
        bytesPerEnvelope,
        lessThan(1200000),
        reason:
            'per-frame envelope must stay O(base geometry) '
            '(position+normal+uv+index), not O(skin storage)',
      );

      // 4. Geometry churn bound: the skinned character's geometry re-upserts
      // per animated frame; nothing else may churn. Textures are all uploaded
      // during warmup — zero in the window.
      expect(
        geometries / (submitted < 1 ? 1 : submitted),
        lessThan(2.5),
        reason: 'only the skinned geometry may re-upsert per frame',
      );
      expect(textures, equals(0), reason: 'textures must not re-upload');

      // 5. Native lanes engaged: the worker exposes the skin bytes fn and
      // drives it on (nearly) every animated frame, and envelopes submitted
      // to the host keep up with envelopes sent from JS (a b64/JSON transport
      // regression or a drop stream would open a gap).
      expect(pin1['noSkinFn'], equals(0), reason: 'skin bytes fn must exist');
      expect(
        skinCalls,
        greaterThanOrEqualTo(jsFrames * 0.5),
        reason: 'the native skin lane must drive the animated frames',
      );
      expect(
        submitted,
        greaterThanOrEqualTo(jsFrames - 2),
        reason: 'envelopes must reach the host (no drop stream)',
      );

      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(minutes: 8)),
  );
}
