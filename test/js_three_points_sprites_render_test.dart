import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets(
    'webgl_points_sprites renders five textured additive point clouds',
    (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-points-sprites',
        instanceId: 'three-points-sprites-render-test',
      );
      await harness.pumpUntil(
        tester,
        (state, plan) =>
            state.submittedFrameCount >= 3 &&
            state.textureUploadCount >= 5 &&
            plan.draws.length == 5 &&
            plan.draws.every((draw) => draw.material.mapTextureId != 0),
      );
      await tester.runAsync(
        () => Future<void>.delayed(const Duration(seconds: 2)),
      );
      await harness.pumpFrames(tester, 40);

      final state = harness.state!;
      final plan = const ThreeDrawPlanner().plan(state);
      expect(plan.diagnostics.warnings, isEmpty);
      expect(plan.draws, hasLength(5));
      expect(
        plan.draws.map((draw) => draw.material.pointSize),
        unorderedEquals([20, 15, 10, 8, 5]),
      );
      for (final draw in plan.draws) {
        expect(draw.primitive, ThreeDrawPrimitive.points);
        expect(draw.drawCount, 10000);
        expect(draw.material.kind, JsThreeMaterialKind.pointsBasic);
        expect(draw.material.transparent, isTrue);
        expect(draw.material.blending, 2); // THREE.AdditiveBlending
        expect(draw.material.depthTest, isFalse);
        expect(draw.material.mapTextureId, greaterThan(0));
        expect(draw.material.colorR, greaterThan(0));
        expect(draw.material.colorG, greaterThan(0));
        expect(draw.material.colorB, greaterThan(0));
        final texture = state.textures[draw.material.mapTextureId]!;
        expect(texture.width, 32);
        expect(texture.height, 32);
        expect(texture.encoding, JsThreeTextureEncoding.rawRgba8);
        expect(texture.data, hasLength(32 * 32 * 4));
        expect(texture.srgb, isTrue);
        expect(texture.data.any((byte) => byte != 0), isTrue);
      }
      expect(state.textureUploadCount, 5);
      expect(state.geometryUploadCount, 1);
      expect(harness.engine.peekLogs(), isEmpty);
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 180)),
  );
}
