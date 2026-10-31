import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test('sprites multi-scene', () {}, skip: 'QuickJS native lib missing');
    return;
  }
  testWidgets(
      'webgl_sprites perspective scene survives the ortho HUD pass '
      '(scene-scoped node retirement)', (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-sprites',
      instanceId: 'three-sprites-multiscene-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) => state.pendingFrames.length >= 2,
      attempts: 200,
    );
    final state = harness.state!;
    // Each tick submits TWO renders: the perspective sprite sphere, then the
    // ortho HUD. Unscoped node retirement used to delete the first scene's
    // nodes on the second pass ('frame scene N is missing', empty pass).
    expect(state.pendingFrames.length, greaterThanOrEqualTo(2));
    final first = ThreeDrawPlanner().plan(
      state,
      frame: state.pendingFrames[0],
    );
    final second = ThreeDrawPlanner().plan(
      state,
      frame: state.pendingFrames[1],
    );
    expect(first.diagnostics.warnings, isEmpty);
    expect(first.draws.length, greaterThanOrEqualTo(100),
        reason: 'the perspective sprite sphere must keep its nodes');
    expect(second.draws.length, 5,
        reason: 'the ortho HUD has its five sprites');
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 120)));
}
