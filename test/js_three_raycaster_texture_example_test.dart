import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

import 'support/three_example_render_contract.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'raycaster texture example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_raycaster_texture uploads the decoded UV grid and '
      'rasterized cross on all three textured meshes', (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-raycaster-texture',
      instanceId: 'three-raycaster-texture-render-test',
    );
    final plan = await pumpThreeExampleHealthy(
      tester,
      harness,
      'webgl_raycaster_texture',
    );

    expect(plan.draws, hasLength(3));
    final textureIds = <int>{};
    for (final draw in plan.draws) {
      expect(draw.material.kind, JsThreeMaterialKind.meshBasic);
      expect(draw.material.mapTextureId, greaterThan(0));
      textureIds.add(draw.material.mapTextureId);
    }
    expect(textureIds, hasLength(3));
    expect(harness.state!.textureUploadCount, greaterThanOrEqualTo(3));

    final textures = textureIds
        .map((id) => harness.state!.textures[id])
        .toList(growable: false);
    expect(textures, everyElement(isNotNull));
    for (final texture in textures) {
      expect(texture!.width, 1024);
      expect(texture.height, 1024);
      expect(texture.encoding, JsThreeTextureEncoding.rawRgba8);
      expect(texture.isCube, isFalse);
      expect(texture.data.length, 1024 * 1024 * 4);
    }

    // Sampling the uploaded bytes proves this is the host-decoded UV grid,
    // not a flat/transparent fallback canvas. The official yellow cross is
    // then stroked over it at the initial UV position (0, 0); its visible
    // positive-quadrant diagonal passes through pixel (3, 3).
    final data = textures.first!.data;
    final colors = <int>{};
    var opaqueSamples = 0;
    for (var offset = 0; offset < data.length; offset += 4 * 251) {
      if (data[offset + 3] == 255) opaqueSamples++;
      colors.add(
        (data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2],
      );
    }
    expect(opaqueSamples, greaterThan(4000));
    expect(colors.length, greaterThan(32));
    final cross = ((3 * 1024 + 3) * 4);
    expect(data.sublist(cross, cross + 4), [255, 255, 0, 255]);

    // Reaching lil-gui also proves init completed instead of leaving the
    // circleTexture undefined and throwing from every subsequent RAF.
    expect((harness.engine.exportedState!['gui'] as Map)['controllers'], 7);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
