import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets(
    'unmodified official line colors module renders through QuickJS R1',
    (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-lines-colors',
        instanceId: 'three-lines-colors-test',
      );
      await harness.pumpUntil(
        tester,
        (state, plan) =>
            state.geometryUploadCount == 6 &&
            state.materialUploadCount == 1 &&
            plan.draws.isNotEmpty &&
            state.submittedFrameCount >= 3,
      );

      final engine = harness.engine;
      final surface = harness.surface;
      final plan = harness.plan;
      final exported = engine.exportedState;
      harness.expectHealthy('webgl_lines_colors');
      if (surface == null) {
        print('THREE lines diagnostics: $exported; logs=${engine.peekLogs()}');
      }
      expect(surface, isNotNull);
      final state = surface!.state!;
      expect(state.geometryUploadCount, 6);
      expect(state.textureUploadCount, 0);
      expect(state.materialUploadCount, 1);
      expect(state.submittedFrameCount, greaterThanOrEqualTo(3));
      expect(state.pendingFrameCount, lessThanOrEqualTo(2));
      expect(plan!.draws, hasLength(6));
      expect(
        plan.draws.every((draw) => draw.primitive == ThreeDrawPrimitive.lines),
        isTrue,
      );
      expect(
        plan.draws.fold<int>(0, (total, draw) => total + draw.drawCount),
        2676,
      );
      expect(plan.directionalLights, isEmpty);
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 120)),
  );
}
