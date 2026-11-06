import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'loader texture lottie example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_loader_texture_lottie bounds and updates its canvas', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-loader-texture-lottie',
      instanceId: 'three-loader-texture-lottie-test',
    );
    final plan = await harness.pumpUntil(
      tester,
      (state, candidate) =>
          state.submittedFrameCount >= 1 &&
          state.textures.values.any(
            (texture) => texture.width == 192 && texture.height == 192,
          ),
    );
    expect(plan, isNotNull);
    final draw = plan!.draws.single;
    final texture = harness.state!.textures[draw.material.mapTextureId]!;
    expect(texture.width, 192);
    expect(texture.height, 192);
    final uploads = harness.state!.textureUploadCount;
    await harness.pumpFrames(tester, 8);
    expect(harness.state!.textureUploadCount, greaterThan(uploads));
    harness.expectHealthy('webgl_loader_texture_lottie');
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
