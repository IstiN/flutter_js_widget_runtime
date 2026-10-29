import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

const _examples = <(String, String, bool)>[
  (
    'three-interactive-raycasting-points',
    'webgl_interactive_raycasting_points',
    false,
  ),
  ('three-interactive-cubes', 'webgl_interactive_cubes', false),
  ('three-interactive-cubes-ortho', 'webgl_interactive_cubes_ortho', false),
  ('three-math-obb', 'webgl_math_obb', false),
  (
    'three-buffergeometry-points-interleaved',
    'webgl_buffergeometry_points_interleaved',
    false,
  ),
  ('three-interactive-voxelpainter', 'webgl_interactive_voxelpainter', false),
  ('three-panorama-equirectangular', 'webgl_panorama_equirectangular', true),
];

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'expanded native THREE examples',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  for (final (widgetId, exampleId, needsTexture) in _examples) {
    testWidgets('$exampleId renders through native QuickJS R1', (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: widgetId,
        instanceId: '$widgetId-test',
      );
      await harness.pumpUntil(
        tester,
        (state, plan) =>
            state.geometryUploadCount > 0 &&
            (!needsTexture || state.textureUploadCount > 0) &&
            plan.draws.isNotEmpty &&
            state.submittedFrameCount >= 1,
      );

      if (harness.engine.exportedState?['mounted'] != true ||
          harness.plan == null) {
        print(
          '$exampleId diagnostics: exported=${harness.engine.exportedState}; '
          'logs=${harness.engine.peekLogs()}; plan=${harness.plan?.diagnostics}; '
          'render=${harness.renderTrees.isEmpty ? null : harness.renderTrees.last}',
        );
      }
      harness.expectHealthy(exampleId);
      final state = harness.state;
      expect(state, isNotNull);
      expect(state!.geometryUploadCount, greaterThan(0));
      if (needsTexture) expect(state.textureUploadCount, greaterThan(0));
      expect(state.submittedFrameCount, greaterThanOrEqualTo(1));
      expect(state.pendingFrameCount, lessThanOrEqualTo(2));
      expect(harness.plan!.draws, isNotEmpty);
      await harness.dispose(tester);
    }, timeout: const Timeout(Duration(seconds: 120)));
  }
}
