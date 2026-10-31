import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  testWidgets('webgl_materials_physical_clearcoat renders spheres through the HDR cube shim',
      (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-physical-clearcoat',
      instanceId: 'three-materials-physical-clearcoat-bg-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) => state.submittedFrameCount >= 3,
    );
    // HDR faces, carbon maps and flakes canvases load through promises: give the microtask
    // queue real wall-clock time before sampling the final plan.
    await tester.runAsync(
      () => Future<void>.delayed(const Duration(seconds: 2)),
    );
    await harness.pumpFrames(tester, 40);
    final plan = const ThreeDrawPlanner().plan(harness.state!);

    final backgrounds = plan.draws
        .where((draw) => draw.material.kind == JsThreeMaterialKind.background)
        .toList();
    expect(
      backgrounds,
      hasLength(1),
      reason: 'scene.background = CubeTexture injects one skybox draw',
    );
    final heads = plan.draws
        .where((draw) => draw.material.kind == JsThreeMaterialKind.meshStandard)
        .toList();
    expect(heads, hasLength(4));
    // Six pisaHDR RGBE faces transcoded to raw RGBA at prepare time.
    expect(harness.state!.textureUploadCount, greaterThanOrEqualTo(6));
    expect(plan.diagnostics.warnings, isEmpty);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
