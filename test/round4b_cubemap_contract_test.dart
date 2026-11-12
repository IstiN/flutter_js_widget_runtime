import 'package:flutter_test/flutter_test.dart';
import 'support/three_example_render_contract.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;
  testWidgets('pin cubemap Lambert bindings and normals', (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-cubemap',
      instanceId: 'cubemap-probe',
    );
    final plan = await pumpThreeExampleHealthy(
      tester,
      harness,
      'webgl_materials_cubemap',
    );
    final meshes = plan.draws
        .where((d) => d.material.envMapTextureId != 0)
        .toList();
    expect(meshes.length, greaterThanOrEqualTo(3));
    expect(meshes.every((d) => d.geometry.normals != null), isTrue);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 120)));
}
