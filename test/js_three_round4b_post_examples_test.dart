import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

import 'support/three_example_render_contract.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;
  for (final id in [
    'three-postprocessing-sobel',
    'three-postprocessing-afterimage',
    'three-postprocessing-rgb-halftone',
    'three-postprocessing-advanced',
  ]) {
    testWidgets('$id uses native postprocessing kernels', (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: id,
        instanceId: '$id-post-test',
      );
      final plan = await pumpThreeExampleHealthy(
        tester,
        harness,
        id.replaceAll('three-', 'webgl_').replaceAll('-', '_'),
      );
      final post = plan.draws.where(
        (draw) => draw.material.kind == JsThreeMaterialKind.postProcessing,
      );
      expect(
        post,
        isNotEmpty,
        reason: '$id must not fall back to pass-through shaders',
      );
      await harness.dispose(tester);
    }, timeout: const Timeout(Duration(seconds: 180)));
  }

  for (final id in [
    'three-effects-anaglyph',
    'three-effects-parallaxbarrier',
  ]) {
    testWidgets(
      '$id loads the official Pisa cube and reaches the stereo pass',
      (tester) async {
        final harness = await ThreeQuickjsExampleHarness.boot(
          tester,
          widgetId: id,
          instanceId: '$id-stereo-test',
        );
        final plan = await pumpThreeExampleHealthy(
          tester,
          harness,
          id.replaceAll('three-', 'webgl_').replaceAll('-', '_'),
        );
        if (id == 'three-effects-anaglyph') {
          expect(
            plan.draws.any(
              (draw) => draw.material.kind == JsThreeMaterialKind.anaglyph,
            ),
            isTrue,
          );
        } else {
          expect(plan.draws, isNotEmpty);
        }
        expect(plan.textures.values.any((texture) => texture.isCube), isTrue);
        await harness.dispose(tester);
      },
      timeout: const Timeout(Duration(seconds: 180)),
    );
  }
}
