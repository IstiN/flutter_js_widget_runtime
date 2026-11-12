import 'dart:math' as math;

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

import 'support/three_example_render_contract.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'round4b shader examples',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets(
    'webgl_buffergeometry_attributes_integer binds all three pinned indexed textures',
    (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-buffergeometry-attributes-integer',
        instanceId: 'three-buffergeometry-attributes-integer-test',
      );
      final presentation = await pumpThreeExampleHealthy(
        tester,
        harness,
        'webgl_buffergeometry_attributes_integer',
      );
      expect(presentation.draws, hasLength(3));
      expect(
        presentation.draws.map((draw) => draw.material.mapTextureId).toSet(),
        hasLength(3),
      );
      expect(presentation.mainTriangleCount, 10000);
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 180)),
  );

  testWidgets('webgl_lights_spotlight loads its pinned maps and keeps spot shadow', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-lights-spotlight',
      instanceId: 'three-lights-spotlight-test',
    );
    final presentation = await pumpThreeExampleHealthy(
      tester,
      harness,
      'webgl_lights_spotlight',
    );
    expect(presentation.frame!.hasSpotShadow, isTrue);
    final assets = harness.engine.exportedState!['assets'] as Map;
    for (final path in [
      'textures/colors.png',
      'textures/disturb.jpg',
      'textures/uv_grid_opengl.jpg',
    ]) {
      expect(assets, contains(path));
      expect(assets[path]['registered'], isTrue);
    }
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  for (final id in [
    'three-custom-attributes-points2',
    'three-custom-attributes-points3',
  ]) {
    testWidgets('$id preserves animated point-size groups and the sprite map', (
      tester,
    ) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: id,
        instanceId: '${id}-test',
      );
      final presentation = await pumpThreeExampleHealthy(
        tester,
        harness,
        id.replaceAll('three-', 'webgl_').replaceAll('-', '_'),
      );
      expect(presentation.draws.length, inInclusiveRange(2, 8));
      final sizes = presentation.draws
          .map((draw) => draw.material.pointSize)
          .toList();
      expect(sizes.reduce(math.min), lessThan(20.0));
      expect(sizes.reduce(math.max), greaterThan(25.0));
      for (final draw in presentation.draws) {
        expect(draw.material.kind, JsThreeMaterialKind.pointsBasic);
        expect(
          draw.material.sizeAttenuation,
          isTrue,
          reason: 'both official shaders compute size * (K / -mvPosition.z)',
        );
        expect(draw.material.mapTextureId, isNot(0));
      }
      await harness.dispose(tester);
    }, timeout: const Timeout(Duration(seconds: 180)));
  }
}
