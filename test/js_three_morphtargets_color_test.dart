import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test('morphtargets material color', () {},
        skip: 'QuickJS native library is not available');
    return;
  }

  testWidgets('webgl_morphtargets keeps the red Phong material and lights',
      (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-morphtargets',
      instanceId: 'three-morphtargets-color-test',
    );
    final plan = await harness.pumpUntil(
      tester,
      (state, candidate) =>
          candidate.draws.isNotEmpty && state.submittedFrameCount >= 2,
    );
    harness.expectHealthy('webgl_morphtargets');
    expect(plan!.draws, hasLength(1));
    final material = plan.draws.single.material;
    expect(material.kind, JsThreeMaterialKind.meshPhong);
    expect(material.colorR, closeTo(1, 1e-6));
    expect(material.colorG, closeTo(0, 1e-6));
    expect(material.colorB, closeTo(0, 1e-6));
    expect(material.flatShading, isTrue);
    expect(plan.pointLights, hasLength(1));
    expect(plan.pointLights.single.intensity, closeTo(200, 1e-6));
    expect(plan.pointLights.single.spotDecay, closeTo(2, 1e-6));
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 240)));
}
