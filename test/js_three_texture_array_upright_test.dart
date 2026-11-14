import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'KTX2 array slices stay upright',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  for (final entry in const [
    ('three-texture2darray-compressed', 'webgl_texture2darray_compressed'),
    ('three-texture2darray-layerupdate', 'webgl_texture2darray_layerupdate'),
  ]) {
    testWidgets('${entry.$2} uploads an upright native array slice', (
      tester,
    ) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: entry.$1,
        instanceId: '${entry.$1}-upright-test',
      );
      addTearDown(() => harness.dispose(tester));
      final plan = await harness.pumpUntilRendered(
        tester,
        (state, candidate) =>
            state.textureUploadCount >= 1 &&
            candidate.draws.isNotEmpty &&
            candidate.draws.every((draw) => draw.material.mapTextureId != 0),
      );
      expect(harness.engine.exportedState!['example'], entry.$2);
      expect(plan.draws, isNotEmpty);
      for (final draw in plan.draws) {
        final texture = harness.state!.textures[draw.material.mapTextureId]!;
        expect(texture.isEncoded, isFalse);
        expect(
          texture.flipY,
          isTrue,
          reason: 'the lowered DataTexture slice must preserve source.flipY',
        );
      }
      expect(
        harness.renderTrees.any(
          (tree) => tree.toString().contains('Widget error:'),
        ),
        isFalse,
      );

      if (entry.$1 == 'three-texture2darray-layerupdate') {
        final exported = harness.engine.exportedState!;
        final gui = exported['gui'] as Map<String, dynamic>;
        final values = (gui['values'] as List).cast<Map<String, dynamic>>();
        final transfer = values.singleWhere(
          (value) => value['property'] == 'transfer',
        );
        final uploads = harness.state!.textureUploadCount;
        await harness.engine.callEvent(transfer['action'] as String);
        await harness.pumpFrames(tester, 2);
        expect(
          harness.state!.textureUploadCount,
          greaterThan(uploads),
          reason:
              'Transfer must copy the selected raw layer and re-upload its slice',
        );
        expect(
          harness.renderTrees.any(
            (tree) => tree.toString().contains('Widget error:'),
          ),
          isFalse,
        );
      }
      await harness.dispose(tester);
    }, timeout: const Timeout(Duration(seconds: 180)));
  }
}
