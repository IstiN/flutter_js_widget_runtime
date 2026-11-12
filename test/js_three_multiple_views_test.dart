import 'dart:math' as math;

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'multiple views',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_multiple_views draws geometry in every scissored view', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-multiple-views',
      instanceId: 'three-multiple-views-test',
    );
    await harness.pumpUntil(
      tester,
      (state, candidate) => state.submittedFrameCount >= 3,
    );
    harness.expectHealthy('webgl_multiple_views');
    final frames = harness.state!.pendingFrames.take(3).toList();
    expect(frames, hasLength(3));
    expect(harness.state!.coalescedFrameCount, 0);
    expect(frames.map((frame) => frame.viewportY), [0.0, 0.0, 180.0]);
    final expectedBackgrounds =
        [
              [0.5, 0.5, 0.7],
              [0.7, 0.5, 0.5],
              [0.5, 0.7, 0.7],
            ]
            .map(
              (srgb) => srgb
                  .map(
                    (v) => v <= 0.04045
                        ? v / 12.92
                        : math.pow((v + 0.055) / 1.055, 2.4).toDouble(),
                  )
                  .toList(),
            )
            .toList();
    for (var index = 0; index < frames.length; index++) {
      expect(
        frames[index].backgroundR,
        closeTo(expectedBackgrounds[index][0], 1e-5),
      );
      expect(
        frames[index].backgroundG,
        closeTo(expectedBackgrounds[index][1], 1e-5),
      );
      expect(
        frames[index].backgroundB,
        closeTo(expectedBackgrounds[index][2], 1e-5),
      );
    }
    final plans = [
      for (final frame in frames)
        const ThreeDrawPlanner().plan(harness.state!, frame: frame),
    ];
    expect(plans.map((plan) => plan.mainDrawCallCount), [10, 10, 10]);
    expect(plans.map((plan) => plan.mainTriangleCount), [247, 247, 247]);
    for (var index = 0; index < plans.length; index++) {
      final clear = plans[index].draws.singleWhere(
        (draw) => draw.material.kind == JsThreeMaterialKind.scissoredClear,
      );
      expect(clear.culledFromMain, isFalse);
      expect(clear.node.renderOrder, lessThan(-1000000));
      expect(clear.material.depthTest, isFalse);
      expect(clear.material.depthWrite, isTrue);
      expect(clear.material.colorWrite, isTrue);
      // The retained state holds the latest upsert for this shared clear
      // material; packet replay supplies the earlier colors to earlier frames.
      expect(clear.material.colorR, closeTo(frames.last.backgroundR, 1e-6));
      expect(clear.material.colorG, closeTo(frames.last.backgroundG, 1e-6));
      expect(clear.material.colorB, closeTo(frames.last.backgroundB, 1e-6));
      expect(clear.geometry.positions, hasLength(9));
    }
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 240)));
}
