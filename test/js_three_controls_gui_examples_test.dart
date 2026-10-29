import 'dart:math' as math;

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_state.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets('official terrain OrbitControls and generated texture reach R1', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-geometry-terrain-raycast',
      instanceId: 'three-terrain-controls-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount == 2 &&
          state.textureUploadCount == 1 &&
          state.submittedFrameCount >= 3 &&
          plan.draws.length == 2,
      attempts: 400,
    );
    final backend = harness.backend;
    final engine = harness.engine;
    JsThreeSurfaceState? state = harness.state;
    ThreeDrawPlan? plan = harness.plan;
    expect(engine.exportedState?['example'], 'webgl_geometry_terrain_raycast');
    expect(
      state,
      isNotNull,
      reason: '${engine.exportedState}; ${engine.peekLogs()}',
    );
    expect(plan, isNotNull);
    expect(plan!.diagnostics.warnings, isEmpty);
    expect(plan!.triangleCount, 130056);
    final terrain = plan!.draws.singleWhere(
      (draw) => draw.geometry.vertexCount == 65536,
    );
    expect(terrain.drawCount, 390150);
    expect(terrain.indexed, isTrue);
    expect(terrain.material.kind, JsThreeMaterialKind.meshBasic);
    expect(terrain.material.mapTextureId, isNot(0));
    expect(
      plan!.draws.where(
        (draw) => draw.material.kind == JsThreeMaterialKind.meshNormal,
      ),
      hasLength(1),
    );
    final texture = state!.textures.values.single;
    expect(texture.width, 1024);
    expect(texture.height, 1024);
    expect(texture.encoding, JsThreeTextureEncoding.rawRgba8);
    expect(texture.data.length, 1024 * 1024 * 4);
    expect(texture.data.any((byte) => byte != 0), isTrue);

    List<double> cameraMatrix() =>
        List<double>.from(state!.camera!.matrixWorld);
    final initial = cameraMatrix();
    void input(Map<String, dynamic> event) => backend.dispatchHostEvent(
      'three.input:main',
      {'type': event['type'], ...event},
    );
    input({
      'type': 'pointerdown',
      'pointerId': 7,
      'pointerType': 'mouse',
      'button': 0,
      'buttons': 1,
      'clientX': 100.0,
      'clientY': 100.0,
      'pageX': 100.0,
      'pageY': 100.0,
    });
    input({
      'type': 'pointermove',
      'pointerId': 7,
      'pointerType': 'mouse',
      'button': 0,
      'buttons': 1,
      'clientX': 155.0,
      'clientY': 125.0,
      'pageX': 155.0,
      'pageY': 125.0,
    });
    input({
      'type': 'pointerup',
      'pointerId': 7,
      'pointerType': 'mouse',
      'button': 0,
      'buttons': 0,
      'clientX': 155.0,
      'clientY': 125.0,
      'pageX': 155.0,
      'pageY': 125.0,
    });
    for (var attempt = 0; attempt < 80; attempt++) {
      await tester.runAsync(
        () => Future<void>.delayed(const Duration(milliseconds: 20)),
      );
      await tester.pump(const Duration(milliseconds: 30));
      if (cameraMatrix().join(',') != initial.join(',')) break;
    }
    expect(
      cameraMatrix().join(','),
      isNot(initial.join(',')),
      reason: 'pinned OrbitControls drag must mutate the R1 camera',
    );
    final dragged = cameraMatrix();
    input({
      'type': 'wheel',
      'pointerId': 0,
      'deltaY': -120.0,
      'deltaX': 0.0,
      'deltaMode': 0,
      'clientX': 155.0,
      'clientY': 125.0,
    });
    for (var attempt = 0; attempt < 80; attempt++) {
      await tester.runAsync(
        () => Future<void>.delayed(const Duration(milliseconds: 20)),
      );
      await tester.pump(const Duration(milliseconds: 30));
      if (cameraMatrix().join(',') != dragged.join(',')) break;
    }
    expect(
      cameraMatrix().join(','),
      isNot(dragged.join(',')),
      reason: 'pinned OrbitControls wheel must mutate the R1 camera',
    );
    await engine.dispose();
    await tester.pump();
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('official orientation GUI checkbox selects instant lookAt in R1', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-math-orientation-transform',
      instanceId: 'three-orientation-gui-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount == 3 &&
          state.submittedFrameCount >= 3 &&
          plan.draws.length == 3 &&
          harness.engine.exportedState?['gui'] != null,
    );
    final backend = harness.backend;
    final engine = harness.engine;
    JsThreeSurfaceState? state = harness.state;
    ThreeDrawPlan? plan = harness.plan;
    expect(
      engine.exportedState?['example'],
      'webgl_math_orientation_transform',
    );
    expect(plan, isNotNull);
    expect(plan!.diagnostics.warnings, isEmpty);
    expect(plan!.draws, hasLength(3));
    final cone = plan!.draws.singleWhere(
      (draw) => draw.material.kind == JsThreeMaterialKind.meshNormal,
    );
    expect(cone.drawCount, 48);
    final target = plan!.draws.singleWhere(
      (draw) =>
          draw.material.kind == JsThreeMaterialKind.meshBasic &&
          !draw.material.wireframe,
    );
    final gui = engine.exportedState!['gui'] as Map<String, dynamic>;
    final values = gui['values'] as List<dynamic>;
    expect(values, hasLength(1));
    expect(values[0]['value'], isFalse);
    final action = values[0]['action'] as String;
    await backend.callEvent(action, {'value': true});
    expect(
      (engine.exportedState!['gui']['values'] as List)[0]['value'],
      isTrue,
    );

    var aligned = false;
    for (var attempt = 0; attempt < 100; attempt++) {
      await tester.runAsync(
        () => Future<void>.delayed(const Duration(milliseconds: 20)),
      );
      await tester.pump(const Duration(milliseconds: 30));
      state = harness.state;
      if (state == null) continue;
      plan = const ThreeDrawPlanner().plan(state);
      final currentCone = plan.draws.singleWhere(
        (draw) => draw.node.nodeId == cone.node.nodeId,
      );
      final currentTarget = plan.draws.singleWhere(
        (draw) => draw.node.nodeId == target.node.nodeId,
      );
      final matrix = currentCone.node.matrixWorld;
      final targetMatrix = currentTarget.node.matrixWorld;
      final length = math.sqrt(
        targetMatrix[12] * targetMatrix[12] +
            targetMatrix[13] * targetMatrix[13] +
            targetMatrix[14] * targetMatrix[14],
      );
      final dot =
          (matrix[8] * targetMatrix[12] +
              matrix[9] * targetMatrix[13] +
              matrix[10] * targetMatrix[14]) /
          length;
      if ((dot - 1).abs() < 0.0001) {
        aligned = true;
        break;
      }
    }
    expect(
      aligned,
      isTrue,
      reason:
          'the JSR checkbox must switch the official animation to mesh.lookAt',
    );
    await engine.dispose();
    await tester.pump();
  }, timeout: const Timeout(Duration(seconds: 120)));
}
