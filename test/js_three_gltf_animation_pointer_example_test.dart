import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'gltf animation pointer example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_loader_gltf_animation_pointer frames and lights Horse', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-loader-gltf-animation-pointer',
      instanceId: 'three-loader-gltf-animation-pointer-test',
    );
    final plan = await harness.pumpUntil(
      tester,
      (state, candidate) =>
          candidate.draws.isNotEmpty && state.submittedFrameCount >= 1,
    );
    harness.expectHealthy('webgl_loader_gltf_animation_pointer');
    final draw = plan!.draws.single;
    expect(draw.node.matrixWorld[0], closeTo(0.01, 0.0001));
    expect(draw.node.matrixWorld[5], closeTo(0.01, 0.0001));
    expect(draw.node.matrixWorld[10], closeTo(0.01, 0.0001));
    expect(draw.material.envMapTextureId, greaterThan(0));
    expect(draw.material.roughness, closeTo(1, 0.0001));
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 240)));
}
