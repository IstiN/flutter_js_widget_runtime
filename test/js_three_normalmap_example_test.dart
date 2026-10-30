import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets('normalmap renders the Lee Perry head through native R1 v6',
      (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-normalmap',
      instanceId: 'three-normalmap-example-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.submittedFrameCount >= 1 && plan.draws.isNotEmpty,
      attempts: 400,
    );
    final state = harness.state;
    final plan = harness.plan;
    expect(state, isNotNull,
        reason: '${harness.engine.exportedState}; ${harness.engine.peekLogs()}');
    expect(plan, isNotNull);
    expect(plan!.draws, isNotEmpty);
    // v6 normal-map texture slot bound on the Phong head material.
    expect(state!.textureUploadCount, greaterThan(0));
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 60)));
}
