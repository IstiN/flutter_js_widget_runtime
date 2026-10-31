import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

import 'support/three_example_render_contract.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'materials modified example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_materials_modified renders both static normal heads '
      'when shader injection is unavailable', (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-modified',
      instanceId: 'three-materials-modified-render-test',
    );
    final plan = await pumpThreeExampleHealthy(
      tester,
      harness,
      'webgl_materials_modified',
    );

    expect(plan.draws, hasLength(2));
    expect(
      plan.draws.map((draw) => draw.material.kind),
      everyElement(JsThreeMaterialKind.meshNormal),
    );
    expect(harness.state!.textureUploadCount, 0);
    expect(
      harness.backend.peekLogs().map((entry) => entry['msg']).join('\n'),
      contains('onBeforeCompile twist dropped'),
    );
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
