import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/three_example_render_contract.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  testWidgets('three-materials-physical-clearcoat renders', (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-physical-clearcoat',
      instanceId: 'three-materials-physical-clearcoat-test',
    );
    final plan = await pumpThreeExampleHealthy(tester, harness, 'webgl_materials_physical_clearcoat');
    final backgrounds = plan.draws
        .where((draw) => draw.material.kind == JsThreeMaterialKind.background)
        .toList();
    expect(backgrounds, hasLength(1), reason: 'HDR skybox draw');
    final spheres = plan.draws
        .where((draw) => draw.material.kind == JsThreeMaterialKind.meshStandard)
        .toList();
    expect(spheres, hasLength(4));
    expect(harness.state!.textureUploadCount, greaterThanOrEqualTo(6));
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
