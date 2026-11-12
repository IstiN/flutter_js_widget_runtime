import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_example_render_contract.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'example-side THREE regressions',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_materials_blending renders all five texture rows', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-blending',
      instanceId: 'three-materials-blending-render-test',
    );
    final plan = await pumpThreeExampleHealthy(
      tester,
      harness,
      'webgl_materials_blending',
    );
    expect(plan.draws.length, greaterThanOrEqualTo(50));
    expect(harness.state!.textureUploadCount, greaterThanOrEqualTo(6));
    expect((harness.engine.exportedState!['assets'] as Map), hasLength(5));
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_geometry_colors_lookuptable loads pressure and LUT pass', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-geometry-colors-lookuptable',
      instanceId: 'three-geometry-colors-lookuptable-render-test',
    );
    final plan = await pumpThreeExampleHealthy(
      tester,
      harness,
      'webgl_geometry_colors_lookuptable',
      targetFrames: 1,
    );
    // The host retains the final orthographic LUT pass in its draw plan;
    // the pressure mesh was submitted in the preceding pass of the same tick.
    expect(plan.draws, hasLength(1));
    expect(plan.draws.single.material.kind, JsThreeMaterialKind.meshBasic);
    expect(plan.draws.single.material.mapTextureId, greaterThan(0));
    expect(harness.state!.textureUploadCount, 1);
    expect((harness.engine.exportedState!['assets'] as Map), hasLength(1));
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_geometry_terrain generates and draws its local texture', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-geometry-terrain',
      instanceId: 'three-geometry-terrain-render-test',
    );
    final plan = await pumpThreeExampleHealthy(
      tester,
      harness,
      'webgl_geometry_terrain',
    );
    expect(plan.draws, hasLength(1));
    expect(plan.draws.single.material.kind, JsThreeMaterialKind.meshBasic);
    expect(plan.draws.single.material.mapTextureId, greaterThan(0));
    expect(harness.state!.textureUploadCount, 1);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_multiple_scenes_comparison submits both scene passes', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-multiple-scenes-comparison',
      instanceId: 'three-multiple-scenes-comparison-render-test',
    );
    final plan = await pumpThreeExampleHealthy(
      tester,
      harness,
      'webgl_multiple_scenes_comparison',
    );
    // The final retained plan is the right-hand wireframe pass; the left
    // pass is composed before it within each animation tick.
    expect(plan.draws, hasLength(2));
    final sceneDraw = plan.draws
        .where((draw) => draw.material.kind == JsThreeMaterialKind.meshStandard)
        .single;
    expect(sceneDraw.primitive, ThreeDrawPrimitive.lines);
    expect(
      plan.draws.where(
        (draw) => draw.material.kind == JsThreeMaterialKind.scissoredClear,
      ),
      hasLength(1),
      reason: 'the scissored right-hand pass clears depth before drawing',
    );
    expect(harness.state!.textureUploadCount, 0);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets(
    'webgl_materials_envmaps binds six cube faces and equirect asset',
    (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-materials-envmaps',
        instanceId: 'three-materials-envmaps-render-test',
      );
      final plan = await pumpThreeExampleHealthy(
        tester,
        harness,
        'webgl_materials_envmaps',
      );
      expect(plan.draws.length, greaterThanOrEqualTo(2));
      expect(
        plan.draws.map((draw) => draw.material.kind),
        containsAll(<JsThreeMaterialKind>[
          JsThreeMaterialKind.background,
          JsThreeMaterialKind.meshBasic,
        ]),
      );
      // One cube-atlas upload contains all six faces. The equirectangular
      // image is pinned for the GUI switch but is not uploaded initially.
      expect(harness.state!.textureUploadCount, 1);
      expect((harness.engine.exportedState!['assets'] as Map), hasLength(7));
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 180)),
  );

  testWidgets('webgl_materials_wireframe draws both indexed-wire heads', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-wireframe',
      instanceId: 'three-materials-wireframe-render-test',
    );
    final plan = await pumpThreeExampleHealthy(
      tester,
      harness,
      'webgl_materials_wireframe',
      targetFrames: 1,
    );
    expect(plan.draws, hasLength(2));
    expect(
      plan.draws.map((draw) => draw.material.kind),
      everyElement(JsThreeMaterialKind.meshBasic),
    );
    expect(
      plan.draws.map((draw) => draw.primitive),
      everyElement(ThreeDrawPrimitive.lines),
    );
    expect(harness.state!.textureUploadCount, 0);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
