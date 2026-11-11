import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'three_quickjs_example_harness.dart';

/// Pumps an official example until real R1 frames exist, then proves that
/// asynchronous asset failures did not replace the canvas with an error card.
Future<ThreeDrawPlan> pumpThreeExampleHealthy(
  WidgetTester tester,
  ThreeQuickjsExampleHarness harness,
  String exampleId, {
  // Per-task envelope batching: one submit per JS task, so the first pump
  // window legitimately shows fewer submitted frames than pre-batching.
  int targetFrames = 2,
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

/// Boots an official example and returns its final plan, asserting zero
/// planner warnings and zero JS error logs (strict variant used by the
/// bounded-shader and lines/instancing regression suites).
Future<(ThreeQuickjsExampleHarness, ThreeDrawPlan)> renderThreeExampleStrict(
  WidgetTester tester,
  String id,
) async {
  final harness = await ThreeQuickjsExampleHarness.boot(
    tester,
    widgetId: id,
    instanceId: '$id-strict-test',
  );
  await harness.pumpUntil(
    tester,
    // Per-task envelope batching counts one submit per JS task; >=2 still
    // proves frames flow (health is draw-plan presence + zero JS errors).
    (state, plan) => state.submittedFrameCount >= 2 && plan.draws.isNotEmpty,
    attempts: 60,
  );
  await tester.runAsync(
    () => Future<void>.delayed(const Duration(milliseconds: 1500)),
  );
  await harness.pumpFrames(tester, 20);
  final plan = const ThreeDrawPlanner().plan(harness.state!);
  expect(plan.diagnostics.warnings, isEmpty);
  expect(
    harness.engine.peekLogs().where(
      (entry) => (entry['msg'] as String).startsWith('[E]'),
    ),
    isEmpty,
  );
  return (harness, plan);
}
