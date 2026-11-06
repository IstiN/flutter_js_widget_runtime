import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// Regression: animated widgets on the ISOLATED backend froze after a few
/// frames (Spot Lights stopped moving; Clipping Intersection sometimes never
/// presented its first frame). The rAF re-request is an asynchronous
/// worker->host->worker round trip, and the scheduler's short idle-stop
/// grace could kill the ticker while a re-request was still in flight.
/// Guards `JsRafScheduler._stopAfterEmptyTicks` and the isolate RAF lane:
/// frames must keep being submitted across a long pump window.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets('isolate RAF chain stays alive (spotlights)', (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-lights-spotlights',
      instanceId: 'raf-liveness',
      useIsolate: true,
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount > 0 &&
          plan.draws.isNotEmpty &&
          state.submittedFrameCount >= 1,
    );
    final early = harness.state!.submittedFrameCount;

    // Simulate wall clock the way the harness does: a real-async window per
    // frame so worker->host rAF round trips can deliver (bare tester.pump
    // starves real port delivery in fake async).
    for (var i = 0; i < 120; i++) {
      await tester.runAsync(
        () => Future<void>.delayed(const Duration(milliseconds: 20)),
      );
      await tester.pump(const Duration(milliseconds: 50));
    }
    final late = harness.state!.submittedFrameCount;
    // ignore: avoid_print
    print(
      'RAF-LIVENESS early=$early late=$late lastTree=${harness.renderTrees.isNotEmpty ? harness.renderTrees.last['type'] : 'none'}',
    );
    expect(late, greaterThan(early + 20));
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
