import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart' show hasQuickjsNativeLib;

/// Perf regression pin for `three-loader-md2-control` (official
/// webgl_loader_md2_control — 13 shared-geometry MD2 characters whose ogro
/// body geometry carries all 199 animation frames as CPU morph targets).
///
/// The whole frame used to go into the R1 CPU morph blend: the per-vertex
/// scan walked every morph target per vertex (~2.4M QuickJS inner
/// iterations per frame, ~66ms), the per-frame influence set was stringified
/// on every character mesh, and freshly blended arrays were re-validated
/// float-by-float before upload. The active-target hoist (blend only
/// non-zero influences, bit-identical arithmetic) brings the steady rAF tick
/// to ~9ms and the catalog widget to the vsync ceiling. Structural pins live
/// in `tool/three/test/morph_blend_active_test.js`; this test pins the
/// end-to-end budget on the real widget through the catalog's isolated
/// QuickJS backend:
///
/// 1. Animation stays alive: frames keep submitting, geometry keeps
///    uploading (the pose actually moves), and the draw plan stays healthy.
/// 2. Steady-state JS frame budget: the windowed rAF tick average stays far
///    below the ~66ms regression shape (measured ~9ms after the hoist; the
///    bound keeps >3x headroom to the regression and >2x to the fix).
/// 3. Protocol byte bound: one three.r1 envelope stays O(base geometry),
///    never O(morph storage) — re-uploading the 199-frame morph payload
///    (~9MB) instead of the blended ~75KB envelope would blow it.
/// 4. Geometry upsert bound: shared body+weapon geometry re-upsert at most
///    ~2 geometries per frame with slack — no per-frame resource churn
///    beyond the animated morphs.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets(
    'md2-control keeps the morph frame budget after the active-target hoist',
    (WidgetTester tester) async {
      const prelude = '''
;(function(){
  var P = globalThis.__MD2_PIN__ = { ticks: 0, tickMs: 0, frames: 0, bytes: 0 };
  var jsr = globalThis.jsr;
  var origBinary = jsr.hostCallBinary;
  jsr.hostCallBinary = function(name, data) {
    if (name === 'three.r1') {
      P.frames++;
      P.bytes += (data && data.byteLength) || 0;
    }
    return origBinary.call(jsr, name, data);
  };
  var origRaf = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = function(cb) {
    return origRaf.call(globalThis, function(t) {
      var t0 = performance.now();
      try { cb(t); } finally { P.ticks++; P.tickMs += performance.now() - t0; }
    });
  };
  var origExport = jsr.exportState.bind(jsr);
  jsr.exportState = function(state) {
    origExport(state);
    return origExport(Object.assign({}, state, { md2Pin: {
      ticks: P.ticks,
      tickMs: Math.round(P.tickMs * 10) / 10,
      frames: P.frames,
      bytes: P.bytes
    } }));
  };
})();
''';
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-loader-md2-control',
        instanceId: 'three-loader-md2-control-pin',
        useIsolate: true,
        sourcePrelude: prelude,
      );
      addTearDown(() => harness.dispose(tester));

      Map<String, dynamic> pin() =>
          ((harness.engine.exportedState ?? const {})['md2Pin'] as Map?)
              ?.cast<String, dynamic>() ??
          <String, dynamic>{};

      // Warm up: MD2 decode loads asynchronously, 13 characters join the
      // scene, and the RAF probe must be publishing. The diagnostics
      // publisher runs on the stats cadence, so give the probe time to
      // observe at least one export tick.
      final warmPlan = await harness.pumpUntil(
        tester,
        (state, plan) =>
            plan.draws.length >= 20 &&
            (pin()['frames'] as int? ?? 0) >= 20 &&
            state.submittedFrameCount >= 20,
        attempts: 900,
      );
      expect(
        warmPlan,
        isNotNull,
        reason: 'md2-control must reach an animated steady state',
      );
      harness.expectHealthy('webgl_loader_md2_control');

      // Fixed measurement window: 60 pumped frames (~1.5s wall). Windowed
      // deltas keep the load-time spikes (first frame ~500ms) out of the
      // steady-state budget.
      final state0 = harness.state!;
      final pin0 = pin();
      final frames0 = state0.submittedFrameCount;
      final geometries0 = state0.geometryUploadCount;
      final jsFrames0 = pin0['frames'] as int;
      final jsBytes0 = pin0['bytes'] as int;
      final ticks0 = pin0['ticks'] as int;
      final tickMs0 = pin0['tickMs'] as num;
      final sw = Stopwatch()..start();
      await harness.pumpFrames(tester, 60);
      final windowSeconds = sw.elapsedMicroseconds / 1e6;

      final state1 = harness.state!;
      final pin1 = pin();
      final frames1 = state1.submittedFrameCount - frames0;
      final jsFrames = (pin1['frames'] as int) - jsFrames0;
      final jsBytes = (pin1['bytes'] as int) - jsBytes0;
      final ticks = (pin1['ticks'] as int) - ticks0;
      final tickMs = (pin1['tickMs'] as num) - tickMs0;
      final geometries = state1.geometryUploadCount - geometries0;

      // 1. Animation stays alive and plans cleanly.
      expect(frames1, greaterThan(0), reason: 'frames must keep submitting');
      final finalPlan = const ThreeDrawPlanner().plan(state1);
      expect(finalPlan.draws.length, greaterThanOrEqualTo(20));
      expect(finalPlan.diagnostics.warnings, isEmpty);

      // 2. Steady-state JS frame budget. Measured anchors on this harness:
      // ~66ms/tick before the active-target hoist, ~9ms/tick after. The
      // bound sits closer to the fix so a regression of the hoist (or a
      // return to the O(targets) scan) fails with ~2x margin.
      final tickAvgMs = ticks > 0 ? tickMs / ticks : 0.0;
      // ignore: avoid_print
      print(
        'MD2PIN window=${windowSeconds.toStringAsFixed(2)}s '
        'submitted=$frames1 jsFrames=$jsFrames tickAvgMs='
        '${tickAvgMs.toStringAsFixed(2)} bytesPerEnvelope='
        '${(jsBytes / (jsFrames < 1 ? 1 : jsFrames)).toStringAsFixed(0)} '
        'geometryUpserts=$geometries draws=${finalPlan.draws.length}',
      );
      expect(
        tickAvgMs,
        lessThan(30),
        reason:
            'steady rAF tick must stay far below the 66ms '
            'O(targets) regression shape',
      );

      // 3. Protocol byte bound: ~75KB blended envelope, never the ~9MB
      // full morph storage.
      expect(jsFrames, greaterThan(0), reason: 'envelopes must keep flowing');
      final bytesPerEnvelope = jsBytes / jsFrames;
      expect(
        bytesPerEnvelope,
        lessThan(200000),
        reason:
            'per-frame envelope must stay O(base geometry), '
            'not O(morph storage)',
      );

      // 4. Geometry churn bound: body + weapon re-upsert per animated frame
      // (position content changes), with slack — nothing else may churn.
      expect(frames1, greaterThan(0));
      expect(
        geometries / frames1,
        lessThan(4),
        reason:
            'only the two animated MD2 geometries may re-upsert '
            'per frame',
      );

      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(minutes: 8)),
  );
}
