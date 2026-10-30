import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test('clipping example', () {}, skip: 'QuickJS native library is not available');
    return;
  }

  testWidgets('webgl_clipping renders spot shadows and clip planes', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-clipping',
      instanceId: 'three-clipping-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount > 0 &&
          plan.draws.isNotEmpty &&
          state.submittedFrameCount >= 1,
    );
    harness.expectHealthy('webgl_clipping');

    final state = harness.state!;
    final plan = harness.plan!;

    // The torus knot plus the receiving ground plane.
    expect(plan.draws, hasLength(2));
    expect(
      plan.draws.fold<int>(0, (total, draw) => total + draw.drawCount ~/ 3),
      greaterThan(3000),
    );

    // One spot light (angle PI/5, penumbra 0.2) and a fill directional light.
    expect(plan.spotLights, hasLength(1));
    final spot = plan.spotLights.single;
    expect(spot.spotAngle, closeTo(0.6283, 0.001));
    expect(spot.spotPenumbra, closeTo(0.2, 0.001));
    expect(plan.directionalLights, hasLength(1));
    expect(plan.ambient.b, greaterThan(0));

    // The frame's single shadow map belongs to the spot light.
    final frame = plan.frame!;
    expect(frame.hasShadow, isTrue);
    expect(frame.shadowLightType, 2);
    expect(frame.shadowMapWidth, 1024);

    // The knot material clips via its local plane (the module ships with the
    // GLOBAL set disabled: renderer.clippingPlanes starts as a frozen empty
    // array, so only clipShadows+local plane reach the wire by default).
    expect(state.clippings, isNotEmpty);
    final knotMaterial = plan.draws
        .map((draw) => draw.material)
        .firstWhere((material) => material.shininess == 100);
    expect(knotMaterial.clipShadows, isTrue);
    final clipping = state.clippings[knotMaterial.clipId]!;
    expect(clipping.planeCount, 1);
    expect(clipping.planes[1], closeTo(-1, 0.001));
    expect(clipping.planes[3], closeTo(0.8, 0.001));

    // ---- Live overlay switch: the Shadows checkbox (clipShadows). ----
    // The overlay checkbox routes through the wrapper's live `material`
    // reference, so flipping it must reach the wire as a material upsert
    // with clipShadows=false and then back to true.
    final guiValues = harness.engine.exportedState?['gui'];
    expect(guiValues, isNotNull);
    final shadowRow = (guiValues!['values'] as List<dynamic>)
        .map((row) => row as Map<dynamic, dynamic>)
        .firstWhere((row) => row['name'] == 'Shadows');
    final shadowsAction = shadowRow['action'] as String;
    await harness.backend.callEvent(shadowsAction, {'value': false});
    bool knotClipShadows() => const ThreeDrawPlanner()
        .plan(harness.state!)
        .draws
        .map((draw) => draw.material)
        .firstWhere((material) => material.shininess == 100)
        .clipShadows;
    await harness.pumpUntil(
      tester,
      (state, plan) => !knotClipShadows(),
    );
    expect(knotClipShadows(), isFalse);
    await harness.backend.callEvent(shadowsAction, {'value': true});
    await harness.pumpUntil(
      tester,
      (state, plan) => knotClipShadows(),
    );

    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 120)));
}
