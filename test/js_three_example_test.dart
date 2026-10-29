import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets(
    'unmodified official Minecraft module renders through QuickJS R1',
    (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-minecraft',
        instanceId: 'three-minecraft-test',
      );
      await harness.pumpUntil(
        tester,
        (state, plan) =>
            state.textureUploadCount == 1 &&
            state.geometryUploadCount == 1 &&
            plan.draws.isNotEmpty &&
            state.submittedFrameCount >= 3,
      );

      final engine = harness.engine;
      final surface = harness.surface;
      final plan = harness.plan;
      final exported = engine.exportedState;
      harness.expectHealthy('webgl_geometry_minecraft');
      if (surface == null) {
        // Surface creation is driven by the first binary envelope; retain the
        // JS renderer/exported state in the failure to distinguish an
        // upstream animation problem from a bridge/protocol rejection.
        print(
          'THREE example diagnostics: $exported; logs=${engine.peekLogs()}',
        );
      }
      expect(surface, isNotNull);
      final state = surface!.state!;
      expect(state.geometryUploadCount, 1);
      expect(state.textureUploadCount, 1);
      expect(state.materialUploadCount, 1);
      expect(state.submittedFrameCount, greaterThanOrEqualTo(3));
      expect(state.pendingFrameCount, lessThanOrEqualTo(2));
      expect(plan!.draws, hasLength(1));
      final triangles = plan.draws.fold<int>(
        0,
        (total, draw) => total + draw.drawCount ~/ 3,
      );
      expect(triangles, greaterThan(1000));
      expect(plan.directionalLights, hasLength(1));
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 120)),
  );
}
