import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// Probe: is the morphtargets-webcam backdrop plane (renderOrder=-1,
/// depthTest:false, z=-100, ~122-unit scale) present in the R1 draw plan?
void main() {
  testWidgets('webcam backdrop plane presence in draw plan', (tester) async {
    if (!hasQuickjsNativeLib) return;
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-morphtargets-webcam',
      instanceId: 'webcam-plane-probe',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) => state.submittedFrameCount >= 3 && plan.draws.isNotEmpty,
      attempts: 80,
    );
    final state = harness.state!;
    final plan = const ThreeDrawPlanner().plan(state);
    // ignore: avoid_print
    print('draws=${plan.draws.length} '
        'mainDrawCallCount=${plan.mainDrawCallCount} '
        'triangles=${plan.mainTriangleCount} '
        'nodes=${state.nodes.length} batches=${state.batches.length}');
    for (final d in plan.draws.take(20)) {
      // ignore: avoid_print
      print('draw node=${d.node.nodeId} tris=${d.drawCount} '
          'viewDepth=${d.viewDepth.toStringAsFixed(1)} '
          'culled=${d.culledFromMain} renderOrder=${d.node.renderOrder} '
          'depthTest=${d.material.depthTest}');
    }
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
