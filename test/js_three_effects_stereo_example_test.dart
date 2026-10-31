import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

import 'support/three_example_render_contract.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'effects stereo example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_effects_stereo renders its sphere field with two raw '
      'six-face cube atlases and no RAF textureType errors', (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-effects-stereo',
      instanceId: 'three-effects-stereo-render-test',
    );
    final plan = await pumpThreeExampleHealthy(
      tester,
      harness,
      'webgl_effects_stereo',
    );

    expect(harness.state!.submittedFrameCount, greaterThanOrEqualTo(3));
    expect(plan.draws, isNotEmpty);
    final spheres = plan.draws
        .where((draw) => draw.material.kind == JsThreeMaterialKind.meshBasic)
        .toList();
    // StereoEffect submits the same 500-mesh scene once per eye. Native
    // frustum culling can reduce an individual eye's visible draw count.
    expect(spheres, isNotEmpty);
    expect(spheres.length, lessThanOrEqualTo(500));
    expect(
      plan.draws
          .where((draw) => draw.material.kind == JsThreeMaterialKind.background),
      hasLength(1),
    );

    expect(harness.state!.textureUploadCount, 2);
    expect(harness.state!.textures, hasLength(2));
    for (final texture in harness.state!.textures.values) {
      expect(texture.isCube, isTrue);
      expect(texture.encoding, JsThreeTextureEncoding.rawRgba8);
      expect(texture.data.length, texture.width * texture.height * 24);
    }
    final logs = harness.backend.peekLogs().map((entry) => entry['msg']).join('\n');
    expect(logs, isNot(contains('textureType')));
    expect(logs, isNot(contains('RAF tick error')));

    // Eye-specific setViewport/setScissor rectangles remain a separate
    // native gap and intentionally are not asserted by this example test.
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
