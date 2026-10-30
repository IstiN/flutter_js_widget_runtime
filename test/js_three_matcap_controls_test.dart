import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets('matcap OrbitControls drag mutates the R1 camera', (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-matcap',
      instanceId: 'three-matcap-controls-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.submittedFrameCount >= 1 && plan.draws.isNotEmpty,
      attempts: 400,
    );
    final backend = harness.backend;
    final engine = harness.engine;
    final state = harness.state;
    expect(state, isNotNull, reason: '${engine.exportedState}; ${engine.peekLogs()}');

    List<double> cameraMatrix() =>
        List<double>.from(harness.state!.camera!.matrixWorld);
    final initial = cameraMatrix();
    void input(Map<String, dynamic> event) => backend.dispatchHostEvent(
      'three.input:main',
      {'type': event['type'], ...event},
    );
    input({'type': 'pointerdown', 'pointerId': 7, 'pointerType': 'mouse', 'button': 0, 'buttons': 1, 'clientX': 100.0, 'clientY': 100.0, 'pageX': 100.0, 'pageY': 100.0});
    input({'type': 'pointermove', 'pointerId': 7, 'pointerType': 'mouse', 'button': 0, 'buttons': 1, 'clientX': 155.0, 'clientY': 125.0, 'pageX': 155.0, 'pageY': 125.0});
    input({'type': 'pointerup', 'pointerId': 7, 'pointerType': 'mouse', 'button': 0, 'buttons': 0, 'clientX': 155.0, 'clientY': 125.0, 'pageX': 155.0, 'pageY': 125.0});
    for (var attempt = 0; attempt < 80; attempt++) {
      await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 20)));
      await tester.pump(const Duration(milliseconds: 30));
      if (cameraMatrix().join(',') != initial.join(',')) break;
    }
    expect(
      cameraMatrix().join(','),
      isNot(initial.join(',')),
      reason: 'matcap OrbitControls drag must mutate the R1 camera; logs=${engine.peekLogs()}',
    );
    await engine.dispose();
    await tester.pump();
  });

  testWidgets('matcap GUI color and exposure controllers reach JS and rerender', (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-matcap',
      instanceId: 'three-matcap-gui-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) => state.submittedFrameCount >= 1 && plan.draws.isNotEmpty,
      attempts: 400,
    );
    final engine = harness.engine;
    final gui = engine.exportedState?['gui'];
    print('GUI STATE: $gui');
    expect(gui, isNotNull, reason: '${engine.exportedState}');
    final values = (gui['values'] as List).cast<Map<String, dynamic>>();
    print('CONTROLLERS: $values');
    expect(values, isNotEmpty);
    // exposure slider = number controller; color = our new color controller.
    final color = values.firstWhere((v) => v['kind'] == 'color');
    final exposure = values.firstWhere((v) => v['kind'] == 'number' && v['property'] == 'exposure');
    final framesBefore = harness.state!.submittedFrameCount;
    await engine.callEvent(color['action'] as String, {'value': '#ff0000'});
    await engine.callEvent(exposure['action'] as String, {'value': 1.5});
    for (var attempt = 0; attempt < 60; attempt++) {
      await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 20)));
      await tester.pump(const Duration(milliseconds: 30));
      if (harness.state!.submittedFrameCount > framesBefore) break;
    }
    final after = (engine.exportedState?['gui']?['values'] as List).cast<Map<String, dynamic>>();
    print('AFTER: $after');
    expect(after.firstWhere((v) => v['kind'] == 'color')['value'], 0xff0000);
    expect(after.firstWhere((v) => v['property'] == 'exposure')['value'], 1.5);
    expect(harness.state!.submittedFrameCount, greaterThan(framesBefore));
    await engine.dispose();
    await tester.pump();
  });
}
