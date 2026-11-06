import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// Regression for the elevationGrid1 switch stall: the 6.8MB prepared VRML
/// JSON once decoded through a quadratic `+=` string accumulator inside the
/// native facade's decodeUtf8, pinning the QuickJS worker for >6 CPU-minutes
/// (promise_reaction_job -> js_add_slow -> JS_ConcatString) while the same
/// chain loaded in <1s under V8. The chunked array+join decoder plus the
/// byte-exact parity suite (tool/three/test/runtime_utf8_decode_test.mjs)
/// keep the switch inside seconds: the official lil-gui asset switch must
/// reach the 15,842-triangle heightfield well inside the 60s budget below.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test('vrml elevationGrid1 switch timing', () {},
        skip: 'QuickJS is unavailable');
    return;
  }

  testWidgets('vrml switch to elevationGrid1 renders within seconds',
      (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-loader-vrml',
      instanceId: 'vrml-switch-regression',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) => plan.draws.isNotEmpty && state.submittedFrameCount >= 2,
      attempts: 300,
    );

    int triangles(ThreeDrawPlan plan) =>
        plan.draws.fold<int>(0, (t, d) => t + d.drawCount ~/ 3);
    final from = triangles(harness.plan!);
    expect(from, greaterThan(0));

    final rows = harness.engine.exportedState?['gui']?['values'] as List?;
    final row = rows!.whereType<Map>().firstWhere((r) => r['name'] == 'asset');
    final action = row['action'] as String;

    final sw = Stopwatch()..start();
    await harness.backend.callEvent(action, {'value': 'elevationGrid1'});
    var now = from;
    while (sw.elapsed < const Duration(seconds: 60)) {
      await harness.pumpFrame(tester);
      if (harness.state == null) continue;
      harness.plan = const ThreeDrawPlanner().plan(harness.state!);
      now = triangles(harness.plan!);
      if (now != from && now > 0) break;
    }
    final switchMs = sw.elapsedMilliseconds;
    // The heightfield: elevationGrid1 = 15842 triangles (xsection 15843 x
    // zsize 1 indexes). Far above the other grids, so this pins the switch.
    expect(now, 15842, reason: 'elevationGrid1 heightfield triangle count');
    expect(switchMs, lessThan(60000),
        reason: 'quadratic decode regression would exceed this budget');
    // ignore: avoid_print
    print('VRML_SWITCH_MS=$switchMs triangles=$now');
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(minutes: 4)));
}
