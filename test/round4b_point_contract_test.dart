import 'package:flutter_test/flutter_test.dart';
import 'support/three_example_render_contract.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;
  for (final id in [
    'three-custom-attributes-points2',
    'three-custom-attributes-points3',
  ]) {
    testWidgets('pin grouped point sizes for $id', (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: id,
        instanceId: '$id-point-test',
      );
      final plan = await pumpThreeExampleHealthy(
        tester,
        harness,
        id.replaceAll('three-', 'webgl_').replaceAll('-', '_'),
      );
      final points = plan.draws.where((d) => d.material.pointSize > 0).toList();
      expect(points, isNotEmpty);
      expect(points.length, lessThanOrEqualTo(8));
      expect(
        points.any(
          (d) => d.material.pointSize != points.first.material.pointSize,
        ),
        isTrue,
      );
      expect(
        points.every((d) => d.material.sizeAttenuation),
        isTrue,
        reason: 'official points2/3 shaders use size*(K/-mvPosition.z)',
      );
      await harness.dispose(tester);
    }, timeout: const Timeout(Duration(seconds: 120)));
  }
}
