import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

Future<(ThreeQuickjsExampleHarness, ThreeDrawPlan)> _render(
  WidgetTester tester,
  String id,
) async {
  final harness = await ThreeQuickjsExampleHarness.boot(
    tester,
    widgetId: id,
    instanceId: '$id-lines-instancing-test',
  );
  await harness.pumpUntil(
    tester,
    (state, plan) => state.submittedFrameCount >= 3 && plan.draws.isNotEmpty,
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

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets('webgl_lines_dashed tessellates dash and gap intervals', (
    tester,
  ) async {
    final (harness, plan) = await _render(tester, 'three-lines-dashed');
    expect(plan.draws, hasLength(2));
    for (final draw in plan.draws) {
      expect(draw.primitive, ThreeDrawPrimitive.lines);
      expect(draw.drawCount, greaterThan(0));
      expect(draw.drawCount % 2, 0);
      expect(draw.material.kind, JsThreeMaterialKind.lineBasic);
    }
    final state = harness.state!;
    expect(state.textureUploadCount, 0);
    final geometryUploads = state.geometryUploadCount;
    final textureUploads = state.textureUploadCount;
    await harness.pumpFrames(tester, 5);
    expect(harness.state!.geometryUploadCount, geometryUploads);
    expect(harness.state!.textureUploadCount, textureUploads);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_lines_fat lowers Line2 to real native line segments', (
    tester,
  ) async {
    final (harness, plan) = await _render(tester, 'three-lines-fat');
    expect(plan.draws, hasLength(1));
    final draw = plan.draws.single;
    expect(draw.primitive, ThreeDrawPrimitive.lines);
    expect(draw.drawCount, 1534);
    expect(draw.material.kind, JsThreeMaterialKind.lineBasic);
    expect(draw.material.vertexColors, isTrue);
    expect(harness.state!.textureUploadCount, 0);
    final geometryUploads = harness.state!.geometryUploadCount;
    await harness.pumpFrames(tester, 5);
    expect(harness.state!.geometryUploadCount, geometryUploads);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_instancing_dynamic initializes despite optional PMREM', (
    tester,
  ) async {
    final (harness, plan) = await _render(tester, 'three-instancing-dynamic');
    expect(plan.draws, hasLength(1));
    final draw = plan.draws.single;
    expect(draw.primitive, ThreeDrawPrimitive.triangles);
    expect(draw.drawCount, 36);
    expect(draw.instanceCount, greaterThan(1));
    expect(draw.material.kind, JsThreeMaterialKind.meshStandard);
    expect(draw.material.mapTextureId, greaterThan(0));
    expect(harness.state!.textureUploadCount, 1);
    final textureUploads = harness.state!.textureUploadCount;
    await harness.pumpFrames(tester, 5);
    expect(harness.state!.textureUploadCount, textureUploads);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
