import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test('webgl_clipping_advanced global clipping keeps animating (16-plane R1)', () {},
        skip: 'QuickJS native library is not available');
    return;
  }

  testWidgets('webgl_clipping_advanced global clipping keeps animating (16-plane R1)', (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-clipping-advanced',
      instanceId: 'zz-clipping-advanced-global-probe',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) => state.submittedFrameCount >= 2,
    );
    final before = harness.state!.submittedFrameCount;
    await harness.pumpFrames(tester, 4);
    final animated = harness.state!.submittedFrameCount;
    final gui = harness.engine.exportedState!['gui'] as Map<String, dynamic>;
    final row = (gui['values'] as List<dynamic>)
        .cast<Map<String, dynamic>>()
        .singleWhere((row) => row['folder'] == 'Global Clipping');
    expect(animated, greaterThan(before));
    expect(row['kind'], 'boolean');

    await harness.backend.callEvent(row['action'] as String, {'value': true});
    final enabledCount = harness.state!.submittedFrameCount;
    await harness.pumpFrames(tester, 6);
    final frozenCount = harness.state!.submittedFrameCount;
    // 5 global + 5 local planes = 10: above the old 8-plane limit this
    // threw in every RAF tick and the whole example froze on an error card.
    // R1 v6+ supports up to 16 planes, so animation must continue.
    expect(frozenCount, greaterThan(enabledCount),
        reason: 'global clipping must not freeze the animation');
    final trees = harness.renderTrees.map((tree) => tree.toString()).join('\n');
    expect(trees.contains('Widget error'), isFalse,
        reason: 'no capability error card for 10 clipping planes');

    await harness.backend.callEvent(row['action'] as String, {'value': false});
    final disabledCount = harness.state!.submittedFrameCount;
    await harness.pumpFrames(tester, 6);
    final recoveredCount = harness.state!.submittedFrameCount;
    expect(recoveredCount, greaterThan(disabledCount));

    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 120)));
}
