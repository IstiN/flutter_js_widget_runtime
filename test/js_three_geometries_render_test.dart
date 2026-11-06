import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets('webgl_geometries shares its UV-grid map across all 16 meshes', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-geometries',
      instanceId: 'three-geometries-render-test',
    );
    final plan = await harness.pumpUntilRendered(
      tester,
      (state, plan) =>
          state.submittedFrameCount >= 3 &&
          state.textureUploadCount >= 1 &&
          plan.draws.length == 16 &&
          plan.draws.every((draw) => draw.material.mapTextureId != 0),
    );
    final state = harness.state!;
    expect(plan.draws, hasLength(16));
    final textureId = plan.draws.first.material.mapTextureId;
    expect(textureId, greaterThan(0));
    for (final draw in plan.draws) {
      expect(draw.material.kind, JsThreeMaterialKind.meshPhong);
      expect(draw.material.side, JsThreeSide.double);
      expect(draw.material.mapTextureId, textureId);
    }
    final texture = state.textures[textureId]!;
    expect(texture.width, 1024);
    expect(texture.height, 1024);
    expect(texture.encoding, JsThreeTextureEncoding.jpeg);
    expect(texture.srgb, isTrue);
    expect(texture.flipY, isTrue);
    expect(texture.repeatS, isTrue);
    expect(texture.repeatT, isTrue);
    expect(texture.mipmaps, isTrue);
    expect(state.textureUploadCount, 1);
    expect(state.geometryUploadCount, 16);
    expect(harness.engine.peekLogs(), isEmpty);

    final exported = harness.engine.exportedState!;
    expect(exported['assets'], contains('textures/uv_grid_opengl.jpg'));
    expect(exported['uvGrid']['registered'], isTrue);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
