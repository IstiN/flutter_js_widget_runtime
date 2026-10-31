import 'package:flutter_test/flutter_test.dart';

import 'support/three_example_render_contract.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'camera logarithmicdepthbuffer example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_camera_logarithmicdepthbuffer renders the comparison '
      'through one shared R1 renderer', (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-camera-logarithmicdepthbuffer',
      instanceId: 'three-camera-logarithmicdepthbuffer-render-test',
    );
    final plan = await pumpThreeExampleHealthy(
      tester,
      harness,
      'webgl_camera_logarithmicdepthbuffer',
    );

    // Fifteen text labels and their fifteen scale-marker spheres survive.
    // The second official renderer is a facade alias of the first because
    // JSR owns one native surface; logarithmic depth itself is not emulated.
    expect(plan.draws.length, greaterThanOrEqualTo(30));
    expect(harness.state!.textureUploadCount, 0);
    final assets = harness.engine.exportedState!['assets'] as Map;
    final font = assets['fonts/helvetiker_regular.typeface.json'] as Map;
    expect(font['registered'], isTrue);
    expect(
      harness.backend.peekLogs().map((entry) => entry['msg']).join('\n'),
      contains('shares one standard-depth renderer'),
    );
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_reversed_depth_buffer shares sequential native passes', (
    tester,
  ) async {
    final (harness, plan) = await renderThreeExampleStrict(
      tester,
      'three-reversed-depth-buffer',
    );
    expect(plan.draws, isNotEmpty);
    expect(harness.state!.renderTargets, isNotEmpty);
    final logs = harness.backend
        .peekLogs()
        .map((entry) => entry['msg'])
        .join('\n');
    expect(logs, contains('shares one standard-depth renderer'));
    expect(
      RegExp('reversedDepthBuffer is unavailable').allMatches(logs).length,
      1,
    );
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
