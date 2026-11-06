import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test('SVG render order', () {},
        skip: 'QuickJS native library is not available');
    return;
  }

  testWidgets('webgl_loader_svg preserves upstream transparent renderOrder',
      (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-loader-svg',
      instanceId: 'three-loader-svg-order-test',
    );
    final plan = await harness.pumpUntil(
      tester,
      (state, candidate) => candidate.draws.length >= 305,
    );
    harness.expectHealthy('webgl_loader_svg');
    expect(plan!.drawCallCount, 305);
    expect(plan.transparent, hasLength(304));
    expect(
      plan.transparent.map((draw) => draw.node.renderOrder).toSet(),
      hasLength(304),
    );
    for (var index = 1; index < plan.transparent.length; index++) {
      expect(
        plan.transparent[index].node.renderOrder,
        greaterThan(plan.transparent[index - 1].node.renderOrder),
      );
    }
    // The tiger's colored fills were always present; depth-only sorting let a
    // later black shape paint over them. Keep a color guard as well as order.
    expect(
      plan.transparent.where(
        (draw) =>
            draw.material.colorR > 0.05 ||
            draw.material.colorG > 0.05 ||
            draw.material.colorB > 0.05,
      ),
      hasLength(greaterThan(20)),
    );
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 240)));
}
