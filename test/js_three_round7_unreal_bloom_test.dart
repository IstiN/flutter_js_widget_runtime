import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

import 'support/three_example_render_contract.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

double _postParam(JsThreeMaterialUpsert material, int index) {
  if (index < 9) {
    return material.duboisLeftMatrix[(index ~/ 3) * 4 + index % 3];
  }
  if (index < 18) {
    final local = index - 9;
    return material.duboisRightMatrix[(local ~/ 3) * 4 + local % 3];
  }
  return material.postParams[index - 18];
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;
  testWidgets(
    'three-postprocessing-unreal-bloom executes the official five-mip chain',
    (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-postprocessing-unreal-bloom',
        instanceId: 'three-unreal-bloom-round7-test',
      );
      final plan = await pumpThreeExampleHealthy(
        tester,
        harness,
        'webgl_postprocessing_unreal_bloom',
      );
      expect(plan.draws, isNotEmpty);
      final materials = harness.state!.materials.values
          .where((material) => material.kind == JsThreeMaterialKind.postProcessing)
          .toList(growable: false);
      final highpass = materials.where((material) => _postParam(material, 0) == 13);
      final blurs = materials.where((material) => _postParam(material, 0) == 14);
      final composites = materials.where((material) => _postParam(material, 0) == 15);
      expect(highpass, isNotEmpty);
      expect(blurs, hasLength(10), reason: 'horizontal and vertical material per mip');
      expect(composites, isNotEmpty);
      expect(
        blurs.map((material) => _postParam(material, 6)).toSet(),
        <double>{3, 5, 7, 9, 11},
        reason: 'UnrealBloomPass kernel sizes 6, 10, 14, 18 and 22',
      );
      expect(_postParam(highpass.last, 1), 0);
      expect(_postParam(highpass.last, 2), closeTo(0.01, 1e-6));
      expect(_postParam(highpass.last, 6), 0);
      final composite = composites.last;
      expect(_postParam(composite, 1), 1);
      expect(_postParam(composite, 2), closeTo(0.5, 1e-6));
      expect(
        [
          composite.mapTextureId,
          composite.mapRightTextureId,
          composite.postTexture3Id,
          composite.postTexture4Id,
          composite.postTexture5Id,
        ].where((id) => id != 0),
        hasLength(5),
      );
      expect(harness.state!.renderTargets, hasLength(13));
      expect(
        harness.state!.renderTargets.values.every(
          (target) => target.width > 0 && target.height > 0,
        ),
        isTrue,
      );
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 180)),
  );
}
