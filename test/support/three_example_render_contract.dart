import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'three_quickjs_example_harness.dart';

/// Pumps an official example until real R1 frames exist, then proves that
/// asynchronous asset failures did not replace the canvas with an error card.
Future<ThreeDrawPlan> pumpThreeExampleHealthy(
  WidgetTester tester,
  ThreeQuickjsExampleHarness harness,
  String exampleId, {
  int targetFrames = 3,
}) async {
  await harness.pumpUntil(
    tester,
    (state, plan) =>
        state.submittedFrameCount >= targetFrames && plan.draws.isNotEmpty,
    attempts: 80,
  );
  await tester.runAsync(() => Future<void>.delayed(const Duration(seconds: 2)));
  await harness.pumpFrames(tester, 15);
  final plan = const ThreeDrawPlanner().plan(harness.state!);
  harness.plan = plan;
  harness.expectHealthy(exampleId);
  expect(
    harness.state!.submittedFrameCount,
    greaterThanOrEqualTo(targetFrames),
  );
  expect(plan.draws, isNotEmpty);
  expect(
    harness.renderTrees.where(
      (tree) => tree.toString().contains('Widget error:'),
    ),
    isEmpty,
    reason: '$exampleId must not emit init or RAF error cards',
  );
  return plan;
}
