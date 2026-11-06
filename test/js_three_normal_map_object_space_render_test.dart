import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets(
    'webgl_materials_normalmap_object_space loads both GLB textures',
    (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-materials-normalmap-object-space',
        instanceId: 'three-normal-map-object-space-render-test',
      );
      final plan = await harness.pumpUntilRendered(
        tester,
        (state, plan) =>
            state.submittedFrameCount >= 1 &&
            state.textureUploadCount >= 2 &&
            plan.draws.length == 1 &&
            plan.draws.single.material.normalMapTextureId != 0,
        attempts: 400,
      );
      final state = harness.state!;
      expect(plan.draws, hasLength(1));
      final draw = plan.draws.single;
      expect(draw.material.kind, JsThreeMaterialKind.meshStandard);
      expect(draw.material.side, JsThreeSide.double);
      expect(draw.drawCount, 58446);
      expect(draw.material.mapTextureId, greaterThan(0));
      expect(draw.material.normalMapTextureId, greaterThan(0));
      expect(
        draw.material.normalMapTextureId,
        isNot(draw.material.mapTextureId),
      );

      // The Nefertiti GLB stores both images in bufferViews. Prepare rewrites
      // those entries to registered relative URIs because native QuickJS has no
      // Blob/object-URL lane; GLTFLoader can then bind color and normal detail.
      final baseColor = state.textures[draw.material.mapTextureId]!;
      final normal = state.textures[draw.material.normalMapTextureId]!;
      for (final texture in [baseColor, normal]) {
        expect(texture.width, 2048);
        expect(texture.height, 2048);
        expect(texture.encoding, JsThreeTextureEncoding.jpeg);
        expect(texture.flipY, isFalse);
        expect(texture.repeatS, isTrue);
        expect(texture.repeatT, isTrue);
        expect(texture.mipmaps, isTrue);
      }
      expect(baseColor.srgb, isTrue);
      expect(normal.srgb, isFalse);
      expect(state.textureUploadCount, 2);
      expect(harness.engine.peekLogs(), isEmpty);

      final exportedAssets =
          harness.engine.exportedState!['assets'] as Map<String, dynamic>;
      expect(
        exportedAssets.keys,
        containsAll([
          'models/gltf/Nefertiti/Nefertiti.glb',
          'models/gltf/Nefertiti/material0_basecolor.jpg',
          'models/gltf/Nefertiti/material0_normal.jpg',
        ]),
      );
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 180)),
  );
}
