import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'animation multiple textures',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets(
    'webgl_animation_multiple keeps Soldier textures on shared skins',
    (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-animation-multiple',
        instanceId: 'three-animation-multiple-texture-test',
      );
      await harness.pumpUntil(
        tester,
        (state, candidate) =>
            candidate.draws.length >= 4 && state.submittedFrameCount >= 4,
      );
      final plan = await harness.pumpUntil(
        tester,
        (state, candidate) =>
            state.textures.isNotEmpty &&
            candidate.draws.any(
              (draw) => draw.material.kind.name == 'meshStandard',
            ) &&
            candidate.draws
                .where((draw) => draw.material.kind.name == 'meshStandard')
                .every((draw) => draw.material.mapTextureId != 0),
      );
      harness.expectHealthy('webgl_animation_multiple');
      final meshes = plan!.draws
          .where((draw) => draw.material.kind.name == 'meshStandard')
          .toList();
      expect(meshes, isNotEmpty);
      expect(
        harness.state!.textures,
        isNotEmpty,
        reason: 'Soldier.glb embeds its base-color texture',
      );
      expect(
        meshes.map((draw) => draw.material.mapTextureId),
        everyElement(isNot(0)),
        reason: 'each cloned Soldier must keep the same decoded material map',
      );
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 240)),
  );
}
