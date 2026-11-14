import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// The native copyTextureToTexture lane requires CPU-readable destination
/// pixels. The prepared R1 example keeps the official 512px / 32px-tile
/// checker layout as RGBA8 DataTexture data instead of trying to write into
/// an encoded JPEG blob. Random 32x32 updates then use the ordinary raw-copy
/// path and re-upload the destination without an error-card interruption.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'materials partialupdate example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets(
    'webgl_materials_texture_partialupdate applies raw partial updates',
    (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-materials-partialupdate',
        instanceId: 'three-materials-partialupdate-test',
      );
      addTearDown(() => harness.dispose(tester));
      await harness.pumpFrames(tester, 40);

      final exported = harness.engine.exportedState!;
      expect(exported['example'], 'webgl_materials_texture_partialupdate');
      expect(exported['backend'], 'flutterGpu');
      expect(exported['canvasCount'], 1);
      expect(exported['mounted'], isTrue);

      final state = harness.state!;
      expect(state.geometryUploadCount, 1);
      expect(state.materials, hasLength(1));
      expect(state.textures, hasLength(1));
      final texture = state.textures.values.single;
      expect(texture.width, 512);
      expect(texture.height, 512);
      expect(texture.isEncoded, isFalse);
      expect(texture.srgb, isTrue);
      expect(texture.mipmaps, isFalse);

      final plan = const ThreeDrawPlanner().plan(state);
      expect(plan.canRender, isTrue);
      expect(plan.diagnostics.warnings, isEmpty);
      expect(plan.draws, hasLength(1));
      final draw = plan.draws.single;
      expect(draw.drawCount, 6);
      expect(draw.material.mapTextureId, texture.textureId);

      expect(state.submittedFrameCount, greaterThan(20));
      expect(
        state.textureUploadCount,
        greaterThan(1),
        reason: 'random 32x32 source tiles must re-upload the raw destination',
      );
      expect(harness.renderTrees.first['type'], 'three');
      expect(harness.renderTrees.first['canvasId'], 'main');
      expect(
        harness.renderTrees.any(
          (tree) => tree.toString().contains('copyTextureToTexture'),
        ),
        isFalse,
        reason: 'the raw destination must not produce a capability error card',
      );

      final uploads = state.textureUploadCount;
      await harness.pumpFrames(tester, 20);
      expect(harness.state!.textureUploadCount, greaterThan(uploads));
      await harness.dispose(tester);

      final isolated = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-materials-partialupdate',
        instanceId: 'three-materials-partialupdate-isolate-test',
        useIsolate: true,
      );
      addTearDown(() => isolated.dispose(tester));
      await isolated.pumpUntil(
        tester,
        (isoState, isoPlan) =>
            isoState.geometryUploadCount > 0 &&
            isoPlan.draws.isNotEmpty &&
            isoState.submittedFrameCount >= 1,
      );
      expect(
        isolated.engine.exportedState!['example'],
        'webgl_materials_texture_partialupdate',
      );
      expect(isolated.plan!.draws, hasLength(1));
      await isolated.pumpFrames(tester, 30);
      expect(isolated.state!.textureUploadCount, greaterThan(1));
      await isolated.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 240)),
  );
}
