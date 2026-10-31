import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

import 'support/three_example_render_contract.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'materials displacementmap example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_materials_displacementmap keeps normal and environment '
      'maps while AO/displacement degrade explicitly', (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-displacementmap',
      instanceId: 'three-materials-displacementmap-render-test',
    );
    final plan = await pumpThreeExampleHealthy(
      tester,
      harness,
      'webgl_materials_displacementmap',
    );

    expect(plan.draws, hasLength(1));
    final draw = plan.draws.single;
    expect(draw.material.kind, JsThreeMaterialKind.meshStandard);
    expect(draw.drawCount, 26652);
    expect(draw.material.normalMapTextureId, greaterThan(0));
    expect(draw.material.envMapTextureId, greaterThan(0));
    // One six-face cube-atlas upload plus the ninja normal map. The peeled
    // AO/displacement assets stay registered but are never GPU-uploaded.
    expect(harness.state!.textureUploadCount, 2);
    final exported = harness.engine.exportedState!;
    expect((exported['assets'] as Map), hasLength(10));
    expect((exported['gui'] as Map)['controllers'], 7);
    expect(
      harness.backend.peekLogs().map((entry) => entry['msg']).join('\n'),
      contains('drops aoMap/displacementMap'),
    );
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
