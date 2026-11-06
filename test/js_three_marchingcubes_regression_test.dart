import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'marching cubes regression',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_marchingcubes keeps bounded live polygonization', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-marchingcubes',
      instanceId: 'three-marchingcubes-test',
      useIsolate: true,
    );
    await harness.pumpUntil(
      tester,
      (state, candidate) => state.submittedFrameCount >= 4,
    );
    harness.expectHealthy('webgl_marchingcubes');
    final before = harness.plan!.draws.single;
    expect(before.geometry.vertexCount, greaterThan(0));
    // The official module runs resolution 28 (28^3 = 21952 grid cells) with
    // 10 animated metaballs, so the exact vertex count varies with the
    // animation phase sampled at the pump point (clock advances by wall
    // time, not by frame). Bound the polygonization by the grid itself —
    // the regression this pins is runaway/unbounded re-polygonization, not
    // the phase-dependent exact size.
    expect(
      before.geometry.vertexCount,
      lessThan(22000),
      reason: 'polygonization must stay bounded by the resolution-28 grid',
    );
    final positions = List<double>.from(before.geometry.positions);
    final beforeCount = harness.state!.submittedFrameCount;

    await harness.pumpUntil(
      tester,
      (state, candidate) => state.submittedFrameCount >= beforeCount + 3,
    );
    final after = harness.plan!.draws.single;
    expect(after.geometry.positions, isNot(orderedEquals(positions)));
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 240)));
}
