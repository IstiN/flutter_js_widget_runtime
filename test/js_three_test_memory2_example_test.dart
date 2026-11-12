import 'package:flutter_test/flutter_test.dart';

import 'support/three_example_render_contract.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test('memory2', () {}, skip: 'QuickJS native library is not available');
    return;
  }

  testWidgets('webgl_test_memory2 keeps generated literal shader colors', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-test-memory2',
      instanceId: 'three-test-memory2-test',
    );
    final presentation = await pumpThreeExampleHealthy(
      tester,
      harness,
      'webgl_test_memory2',
    );
    expect(presentation.draws.length, greaterThanOrEqualTo(90));
    final colors = presentation.draws
        .map(
          (draw) =>
              '${draw.material.colorR.toStringAsFixed(4)}:'
              '${draw.material.colorG.toStringAsFixed(4)}:'
              '${draw.material.colorB.toStringAsFixed(4)}',
        )
        .toSet();
    expect(
      colors.length,
      greaterThan(50),
      reason:
          'the generic static-blue compat fallback must not replace the native literal-color lowering',
    );
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
