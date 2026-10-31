import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  testWidgets('webgl_materials_cubemap_refraction refracts Lucy through a cube env',
      (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-cubemap-refraction',
      instanceId: 'three-materials-cubemap-refraction-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) => state.submittedFrameCount >= 3,
    );
    // Park3Med raw faces + Lucy100k.ply load through promises: give the
    // microtask queue real wall-clock time before sampling the final plan.
    await tester.runAsync(
      () => Future<void>.delayed(const Duration(seconds: 3)),
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
    // CubeRefractionMapping degrades to the cube env lane (reflection-style
    // sampling); the three Lucy statues must render with their env attached.
    final statues = plan.draws
        .where((draw) => draw.material.kind == JsThreeMaterialKind.meshPhong)
        .toList();
    expect(statues, hasLength(3));
    // One cube texture is shared by scene.background and all three envMaps.
    expect(harness.state!.textureUploadCount, greaterThanOrEqualTo(1));
    expect(plan.diagnostics.warnings, isEmpty);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
