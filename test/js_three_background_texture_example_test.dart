import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/three_example_render_contract.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  testWidgets('three-materials-cubemap renders', (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-cubemap',
      instanceId: 'three-materials-cubemap-test',
    );
    final plan = await pumpThreeExampleHealthy(tester, harness, 'webgl_materials_cubemap');
    final backgrounds = plan.draws
        .where((draw) => draw.material.kind == JsThreeMaterialKind.background)
        .toList();
    expect(backgrounds, hasLength(1), reason: 'scene.background skybox draw');
    final heads = plan.draws
        .where((draw) => draw.material.kind == JsThreeMaterialKind.meshLambert)
        .toList();
    expect(heads, hasLength(3));
    expect(harness.state!.textureUploadCount, greaterThanOrEqualTo(2));
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
