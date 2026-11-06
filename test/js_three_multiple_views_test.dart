import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'multiple views',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_multiple_views draws geometry in every scissored view', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-multiple-views',
      instanceId: 'three-multiple-views-test',
    );
    await harness.pumpUntil(
      tester,
      (state, candidate) => state.submittedFrameCount >= 3,
    );
    harness.expectHealthy('webgl_multiple_views');
    final frames = harness.state!.pendingFrames.take(3).toList();
    expect(frames, hasLength(3));
    expect(harness.state!.coalescedFrameCount, 0);
    expect(frames.map((frame) => frame.viewportY), [0.0, 0.0, 180.0]);
    final plans = [
      for (final frame in frames)
        const ThreeDrawPlanner().plan(harness.state!, frame: frame),
    ];
    expect(plans.map((plan) => plan.mainDrawCallCount), [9, 9, 9]);
    expect(plans.map((plan) => plan.mainTriangleCount), [246, 246, 246]);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 240)));
}
