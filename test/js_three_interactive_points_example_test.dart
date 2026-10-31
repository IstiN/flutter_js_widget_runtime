import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/three_example_render_contract.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  testWidgets('webgl_interactive_points renders the point cloud', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-interactive-points',
      instanceId: 'three-interactive-points-render-test',
    );
    final plan = await pumpThreeExampleHealthy(
      tester,
      harness,
      'webgl_interactive_points',
    );
    final points = plan.draws
        .where((draw) => draw.material.kind == JsThreeMaterialKind.pointsBasic)
        .toList();
    expect(points, isNotEmpty);
    expect(harness.state!.textureUploadCount, greaterThanOrEqualTo(1));
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
