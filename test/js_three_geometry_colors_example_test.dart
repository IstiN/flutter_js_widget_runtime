import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets(
    'unmodified official geometry colors renders through Flutter Canvas and R1',
    (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-geometry-colors',
        instanceId: 'three-geometry-colors-test',
      );
      await harness.pumpUntil(
        tester,
        (state, plan) =>
            state.geometryUploadCount == 7 &&
            state.textureUploadCount == 1 &&
            state.materialUploadCount >= 3 &&
            plan.draws.length == 9 &&
            state.submittedFrameCount >= 3,
      );

      final engine = harness.engine;
      final surface = harness.surface;
      final plan = harness.plan;
      final exported = engine.exportedState;
      harness.expectHealthy('webgl_geometry_colors');
      if (surface?.state == null) {
        print(
          'THREE geometry colors diagnostics: $exported; '
          'logs=${engine.peekLogs()}',
        );
      }
      final state = surface?.state;
      expect(state, isNotNull);
      // Three solid geometries are upgraded once when their wire child arrives.
      expect(state!.geometryUploadCount, 7);
      expect(state.textureUploadCount, 1);
      // Canvas readiness may precede the first RAF or refresh the shadow material.
      expect(state.materialUploadCount, inExclusiveRange(2, 5));
      expect(state.submittedFrameCount, greaterThanOrEqualTo(3));
      expect(state.pendingFrameCount, lessThanOrEqualTo(2));
      expect(plan!.draws, hasLength(9));
      expect(
        plan.draws.where((draw) => draw.primitive == ThreeDrawPrimitive.lines),
        hasLength(3),
      );
      expect(
        plan.draws.where(
          (draw) => draw.primitive == ThreeDrawPrimitive.triangles,
        ),
        hasLength(6),
      );
      expect(plan.triangleCount, 246);
      expect(plan.directionalLights, hasLength(1));

      final texture = state.textures.values.single;
      expect(texture.width, 128);
      expect(texture.height, 128);
      expect(texture.data.length, 128 * 128 * 4);
      final center = (64 * 128 + 64) * 4;
      expect(texture.data.sublist(center, center + 4), [210, 210, 210, 255]);
      expect(texture.data.sublist(0, 4), [255, 255, 255, 255]);

      final uploads = (
        state.geometryUploadCount,
        state.textureUploadCount,
        state.materialUploadCount,
      );
      await harness.pumpFrames(tester, 4);
      expect(state.geometryUploadCount, uploads.$1);
      expect(state.textureUploadCount, uploads.$2);
      expect(state.materialUploadCount, uploads.$3);

      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 120)),
  );
}
