import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'camera array',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_camera_array submits all subcamera viewports', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-camera-array',
      instanceId: 'three-camera-array-test',
    );
    await harness.pumpUntil(
      tester,
      (state, candidate) => state.submittedFrameCount >= 36,
    );
    harness.expectHealthy('webgl_camera_array');
    final frames = harness.state!.pendingFrames;
    expect(frames, hasLength(36));
    expect(harness.state!.coalescedFrameCount, 0);
    expect(frames.map((frame) => frame.viewportX).toSet(), {
      0.0,
      106.0,
      213.0,
      320.0,
      426.0,
      533.0,
    });
    expect(frames.map((frame) => frame.viewportY).toSet(), {
      0.0,
      60.0,
      120.0,
      180.0,
      240.0,
      300.0,
    });
    expect(frames.map((frame) => frame.viewportWidth).toSet(), {107.0});
    expect(frames.map((frame) => frame.viewportHeight).toSet(), {60.0});
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 240)));
}
