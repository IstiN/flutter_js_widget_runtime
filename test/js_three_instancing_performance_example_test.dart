import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/three_example_render_contract.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  testWidgets('webgl_instancing_performance renders 1000 instanced Suzannes',
      (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-instancing-performance',
      instanceId: 'three-instancing-performance-render-test',
    );
    final plan = await pumpThreeExampleHealthy(
      tester,
      harness,
      'webgl_instancing_performance',
    );
    final draws = plan.draws
        .where((draw) => draw.material.kind == JsThreeMaterialKind.meshNormal)
        .toList();
    expect(draws, isNotEmpty);
    expect(harness.state!.submittedFrameCount, greaterThanOrEqualTo(3));
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
