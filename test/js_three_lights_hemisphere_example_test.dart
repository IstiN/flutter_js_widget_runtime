import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

import 'support/three_example_render_contract.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'hemisphere lights example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_lights_hemisphere renders lights, helpers, ground and '
      'morph flamingo with a solid sky fallback', (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-lights-hemisphere',
      instanceId: 'three-lights-hemisphere-render-test',
    );
    final plan = await pumpThreeExampleHealthy(
      tester,
      harness,
      'webgl_lights_hemisphere',
    );

    expect(plan.draws.length, greaterThanOrEqualTo(3));
    expect(
      plan.draws.map((draw) => draw.material.kind),
      contains(JsThreeMaterialKind.meshLambert),
    );
    expect(harness.state!.textureUploadCount, 0);
    final exported = harness.engine.exportedState!;
    expect((exported['flamingo'] as Map)['registered'], isTrue);
    expect((exported['gui'] as Map)['controllers'], 3);
    expect(
      harness.backend.peekLogs().map((entry) => entry['msg']).join('\n'),
      contains('solid-color sky dome'),
    );
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
