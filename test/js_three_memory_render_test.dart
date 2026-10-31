import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets('webgl_test_memory uploads each transient canvas texture', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-test-memory',
      instanceId: 'three-test-memory-render-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.submittedFrameCount >= 3 &&
          state.textureUploadCount >= 3 &&
          plan.draws.length == 1 &&
          plan.draws.single.material.mapTextureId != 0,
    );
    await tester.runAsync(
      () => Future<void>.delayed(const Duration(seconds: 2)),
    );
    await harness.pumpFrames(tester, 40);

    final state = harness.state!;
    final plan = const ThreeDrawPlanner().plan(state);
    expect(plan.diagnostics.warnings, isEmpty);
    expect(plan.draws, hasLength(1));
    final draw = plan.draws.single;
    expect(draw.material.kind, JsThreeMaterialKind.meshBasic);
    expect(draw.material.wireframe, isTrue);
    expect(draw.indexed, isTrue);
    expect(draw.material.mapTextureId, greaterThan(0));

    // The official example creates and disposes a 256x256 CanvasTexture on
    // every tick. The local-RGBA canvas lane makes the pixels available before
    // that same-tick disposal, instead of leaving a white, unmapped wireframe.
    final texture = state.textures[draw.material.mapTextureId]!;
    expect(texture.width, 256);
    expect(texture.height, 256);
    expect(texture.encoding, JsThreeTextureEncoding.rawRgba8);
    expect(texture.data, hasLength(256 * 256 * 4));
    expect(state.textureUploadCount, greaterThanOrEqualTo(3));
    expect(state.textures, hasLength(1));
    expect(state.geometries, hasLength(1));
    expect(state.materials, hasLength(1));
    expect(harness.engine.peekLogs(), isEmpty);

    final frames = state.submittedFrameCount;
    await harness.pumpFrames(tester, 3);
    expect(state.submittedFrameCount, greaterThan(frames));
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
