import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test('lights spotlights example', () {},
        skip: 'QuickJS native library is not available');
    return;
  }

  testWidgets('webgl_lights_spotlights renders tweened spot lights', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-lights-spotlights',
      instanceId: 'three-lights-spotlights-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount > 0 &&
          plan.draws.isNotEmpty &&
          state.submittedFrameCount >= 1,
    );
    harness.expectHealthy('webgl_lights_spotlights');

    final state = harness.state!;
    final plan = harness.plan!;

    // The module builds 3 tweened spot lights over a 100x100 floor plane and
    // a shadow-casting box; the SpotLightHelpers add line draws on top.
    expect(plan.draws.length, greaterThanOrEqualTo(2));
    expect(
      plan.draws.fold<int>(0, (total, draw) => total + draw.drawCount),
      greaterThan(40),
    );

    // Spot lights (3 created; distance culling may drop some, cap covers the
    // tween-created population observed by the probe).
    expect(plan.spotLights, isNotEmpty);
    expect(plan.spotLights.length, lessThanOrEqualTo(6));
    // No directional light exists in this scene.
    expect(plan.directionalLights, isEmpty);

    // AmbientLight(0x444444) contributes a gray ambient term.
    expect(plan.ambient.r, greaterThan(0));
    expect(plan.ambient.g, greaterThan(0));
    expect(plan.ambient.b, greaterThan(0));

    // createSpotlight(): intensity 10, distance 50, decay 2; angle/penumbra
    // start at 0.3/0.2 and tween within [0.1, 0.8] / [1.0, 2.0].
    for (final spot in plan.spotLights) {
      expect(spot.type.name, 'spot');
      expect(spot.intensity, closeTo(10, 0.001));
      expect(spot.spotDistance, closeTo(50, 0.001));
      expect(spot.spotDecay, closeTo(2, 0.001));
      expect(spot.spotAngle, inExclusiveRange(0.05, 0.9));
      expect(spot.spotPenumbra, inExclusiveRange(0.1, 2.1));
    }

    // renderer.shadowMap.enabled = true with 3 castShadow spot lights.
    final frame = plan.frame!;
    expect(frame.hasShadow, isTrue);
    expect(frame.hasSpotShadow, isTrue);
    expect(frame.shadowMapWidth, greaterThan(0));

    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 120)));
}
