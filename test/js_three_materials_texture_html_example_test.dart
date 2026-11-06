import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'materials texture html example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_materials_texture_html uploads its RGBA placeholder', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-texture-html',
      instanceId: 'three-materials-texture-html-test',
    );
    final plan = await harness.pumpUntil(
      tester,
      (state, candidate) =>
          state.textures.isNotEmpty &&
          candidate.draws.isNotEmpty &&
          state.submittedFrameCount >= 1,
    );
    harness.expectHealthy('webgl_materials_texture_html');
    final material = plan!.draws.single.material;
    expect(material.envMapTextureId, greaterThan(0));
    expect(harness.state!.textures[material.envMapTextureId], isNotNull);
    final texture = harness.state!.textures[material.mapTextureId];
    expect(texture, isNotNull);
    expect(texture!.width, 256);
    expect(texture.height, 256);
    expect(texture.data.length, 256 * 256 * 4);
    expect(texture.data[0], 238);
    expect(texture.data[1], 242);
    expect(texture.data[2], 248);
    expect(texture.data[3], 255);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 240)));
}
