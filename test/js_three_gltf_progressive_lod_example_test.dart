import 'dart:math' as math;

import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'gltf progressive lod example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_loader_gltf_progressive_lod composes stand-in scales', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-loader-gltf-progressive-lod',
      instanceId: 'three-loader-gltf-progressive-lod-test',
    );
    final plan = await harness.pumpUntil(
      tester,
      (state, candidate) =>
          candidate.draws.length > 1 && state.submittedFrameCount >= 1,
    );
    expect(plan, isNotNull);
    expect(plan!.draws.length, greaterThan(1));
    // Horse has 984 triangles; Duck and the city retain distinct official
    // geometry and local scales, so they must not share this assertion.
    final horse = plan.draws.singleWhere((draw) => draw.drawCount == 2952);
    final matrix = horse.node.matrixWorld;
    for (final offset in [0, 4, 8]) {
      final scale = math.sqrt(
        matrix[offset] * matrix[offset] +
            matrix[offset + 1] * matrix[offset + 1] +
            matrix[offset + 2] * matrix[offset + 2],
      );
      expect(scale, closeTo(0.01, 0.0001));
    }
    harness.expectHealthy('webgl_loader_gltf_progressive_lod');
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 240)));
}
