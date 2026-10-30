import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test('clipping intersection example', () {},
        skip: 'QuickJS native library is not available');
    return;
  }

  testWidgets('webgl_clipping_intersection renders intersected spheres', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-clipping-intersection',
      instanceId: 'three-clipping-intersection-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount > 0 &&
          plan.draws.isNotEmpty &&
          state.submittedFrameCount >= 1,
    );
    harness.expectHealthy('webgl_clipping_intersection');

    final state = harness.state!;
    final plan = harness.plan!;

    // Fifteen nested spheres (radii 1/30 .. 29/30), no ground plane.
    expect(plan.draws, hasLength(15));
    expect(
      plan.draws.fold<int>(0, (total, draw) => total + draw.drawCount ~/ 3),
      greaterThan(30000),
    );

    // Hemisphere-only lighting, no spot/directional and no shadow map.
    expect(plan.hemisphereLights, hasLength(1));
    final hemisphere = plan.hemisphereLights.single;
    expect(hemisphere.intensity, closeTo(4.5, 0.001));
    expect(plan.directionalLights, isEmpty);
    expect(plan.spotLights, isEmpty);
    final frame = plan.frame!;
    expect(frame.hasShadow, isFalse);
    expect(frame.shadowLightType, 0);

    // Every sphere material clips via the same three-plane set with
    // intersection semantics (discard only where all planes clip).
    expect(state.clippings, isNotEmpty);
    final material = plan.draws.first.material;
    expect(material.hasClipping, isTrue);
    expect(material.clipIntersection, isTrue);
    expect(material.clipShadows, isFalse);
    final clipping = state.clippings[material.clipId]!;
    expect(clipping.planeCount, 3);
    // Normalized planes: (1,0,0,0), (0,-1,0,0), (0,0,-1,0).
    expect(clipping.planes[0], closeTo(1, 0.001));
    expect(clipping.planes[5], closeTo(-1, 0.001));
    expect(clipping.planes[10], closeTo(-1, 0.001));
    for (final constant in [clipping.planes[3], clipping.planes[7], clipping.planes[11]]) {
      expect(constant, 0);
    }

    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 120)));
}
