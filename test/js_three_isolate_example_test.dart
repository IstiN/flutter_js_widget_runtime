import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets(
    'official Minecraft module renders and animates through isolated QuickJS',
    (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-minecraft',
        instanceId: 'three-minecraft-isolate-test',
        useIsolate: true,
      );
      await harness.pumpUntil(
        tester,
        (state, plan) =>
            state.textureUploadCount == 1 &&
            state.geometryUploadCount == 1 &&
            plan.draws.isNotEmpty &&
            state.submittedFrameCount >= 3,
      );

      harness.expectHealthy('webgl_geometry_minecraft');
      expect(harness.state!.submittedFrameCount, greaterThanOrEqualTo(3));
      expect(harness.state!.pendingFrameCount, lessThanOrEqualTo(2));
      expect(harness.plan!.draws, hasLength(1));
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 120)),
  );
}
