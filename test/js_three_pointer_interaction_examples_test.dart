import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test('official pointer interaction examples', () {},
        skip: 'QuickJS native library is not available');
    return;
  }

  testWidgets('webgl_decals pointermove raycasts and OrbitControls drag moves the camera',
      (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-decals',
      instanceId: 'three-decals-pointer-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) => state.submittedFrameCount >= 3 && plan.draws.isNotEmpty,
    );
    await tester.runAsync(
      () => Future<void>.delayed(const Duration(seconds: 2)),
    );
    await harness.pumpFrames(tester, 30);
    expect(harness.state, isNotNull);
    expect(harness.engine.exportedState?['example'], 'webgl_decals');

    // The official window pointermove listener raycasts the loaded head and
    // rewrites the two-vertex normal-helper Line geometry on a hit.
    final uploadsBeforeHover = harness.state!.geometryUploadCount;
    _input(harness, 'pointermove', 320, 180, 0);
    await harness.pumpFrames(tester, 3);
    expect(
      harness.state!.geometryUploadCount,
      greaterThan(uploadsBeforeHover),
      reason: 'window pointermove must reach checkIntersection and update the line',
    );

    final cameraBefore = harness.state!.camera!.matrixWorld.join(',');
    _input(harness, 'pointerdown', 100, 100, 1);
    _input(harness, 'pointermove', 180, 130, 1);
    await harness.pumpFrames(tester, 8);
    _input(harness, 'pointerup', 180, 130, 0);
    await harness.pumpFrames(tester, 12);
    expect(
      harness.state!.camera!.matrixWorld.join(','),
      isNot(cameraBefore),
      reason: 'the official canvas OrbitControls must receive the complete drag',
    );
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  for (final widgetId in const ['three-geometry-nurbs', 'three-geometry-text']) {
    testWidgets('$widgetId container drag rotates the official group', (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: widgetId,
        instanceId: '$widgetId-pointer-test',
      );
      await harness.pumpUntil(
        tester,
        (state, plan) => state.submittedFrameCount >= 3 && plan.draws.isNotEmpty,
      );
      await tester.runAsync(
        () => Future<void>.delayed(const Duration(seconds: 2)),
      );
      await harness.pumpFrames(tester, 30);
      expect(harness.state, isNotNull);

      final nodesBefore = _nodeMatrices(harness);
      final cameraBefore = harness.state!.camera!.matrixWorld.join(',');
      _input(harness, 'pointerdown', 100, 100, 1);
      _input(harness, 'pointermove', 180, 130, 1);
      await harness.pumpFrames(tester, 8);
      _input(harness, 'pointerup', 180, 130, 0);
      await harness.pumpFrames(tester, 30);

      final nodesAfter = _nodeMatrices(harness);
      final changed = nodesAfter.keys
          .where((id) => nodesBefore[id] != nodesAfter[id])
          .toList();
      expect(
        changed,
        isNotEmpty,
        reason: 'pointerdown on the dynamically-created container must start '
            'document pointermove tracking for the official targetRotation',
      );
      // Neither official module uses OrbitControls: drag rotates group, not camera.
      expect(harness.state!.camera!.matrixWorld.join(','), cameraBefore);
      await harness.dispose(tester);
    }, timeout: const Timeout(Duration(seconds: 180)));
  }
}

void _input(
  ThreeQuickjsExampleHarness harness,
  String type,
  double x,
  double y,
  int buttons,
) {
  harness.backend.dispatchHostEvent('three.input:main', <String, dynamic>{
    'type': type,
    'pointerId': 7,
    'pointerType': 'mouse',
    'isPrimary': true,
    'button': 0,
    'buttons': buttons,
    'clientX': x,
    'clientY': y,
    'pageX': x,
    'pageY': y,
  });
}

Map<int, String> _nodeMatrices(ThreeQuickjsExampleHarness harness) =>
    harness.state!.nodes.map(
      (id, node) => MapEntry(id, node.matrixWorld.join(',')),
    );
