import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test('helpers example', () {}, skip: 'QuickJS native library is not available');
    return;
  }

  testWidgets('webgl_helpers renders LeePerrySmith, helper lines and point light', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-helpers',
      instanceId: 'three-helpers-test',
    );
    // Wait until the async GLTFLoader callback has populated the scene: the
    // mesh, its two vertex helpers, the box helpers and the two overlay lines.
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount > 0 &&
          plan.draws.any(
            (draw) => draw.primitive == ThreeDrawPrimitive.triangles,
          ) &&
          plan.draws.any((draw) => draw.primitive == ThreeDrawPrimitive.lines) &&
          state.submittedFrameCount >= 2,
    );
    harness.expectHealthy('webgl_helpers');

    final state = harness.state!;
    final plan = harness.plan!;
    final exported = harness.engine.exportedState!;

    // The GLB asset the adapter pre-registered under its diagnostic key.
    final leePerry = exported['leePerry'];
    expect(leePerry, isA<Map<dynamic, dynamic>>());
    final asset = leePerry as Map<dynamic, dynamic>;
    expect(asset['registered'], isTrue);
    expect(asset['bytes'], 404976);
    expect(asset['url'], contains('LeePerrySmith'));

    // Exactly one filled triangle draw: the LeePerrySmith head from the GLB.
    final triangleDraws = plan.draws
        .where((draw) => draw.primitive == ThreeDrawPrimitive.triangles)
        .toList();
    expect(triangleDraws, hasLength(1));
    expect(triangleDraws.single.drawCount % 3, 0);
    // The bust is a dense head mesh; its GLB payload is ~400 KB.
    expect(triangleDraws.single.drawCount ~/ 3, greaterThan(1000));

    // The other twelve draws are line primitives: PointLightHelper (wireframe
    // sphere mesh), GridHelper, PolarGridHelper, VertexNormalsHelper,
    // VertexTangentsHelper, five BoxHelpers and the wireframe/edges overlays.
    final lineDraws = plan.draws
        .where((draw) => draw.primitive == ThreeDrawPrimitive.lines)
        .toList();
    expect(lineDraws, hasLength(12));
    expect(
      lineDraws.fold<int>(0, (total, draw) => total + draw.drawCount ~/ 2),
      greaterThan(1000),
    );

    // The PointLightHelper renders as a wireframe MeshBasicMaterial.
    final wireframeLines = lineDraws
        .where((draw) => draw.material.wireframe)
        .toList();
    expect(wireframeLines, hasLength(1));

    // r186 VertexNormalsHelper/VertexTangentsHelper use plain-color
    // LineBasicMaterials; only the two grid helpers carry vertex colors
    // (blue center lines vs. gray grid lines).
    final vertexColorLines = lineDraws
        .where((draw) => draw.material.vertexColors)
        .toList();
    expect(vertexColorLines, hasLength(2));
    // GridHelper(400, 40) -> (40+1)*2 = 82 segments; PolarGridHelper(200,16,8,64)
    // -> 8*64 circle segments + 16 spokes = 528 segments.
    expect(
      vertexColorLines.map((draw) => draw.drawCount ~/ 2).toList()..sort(),
      [82, 528],
    );

    // Vertex helpers: one segment per mesh vertex, normals red / tangents cyan.
    final vertexHelperLines = lineDraws
        .where((draw) => draw.drawCount ~/ 2 == 9279)
        .toList();
    expect(vertexHelperLines, hasLength(2));
    expect(
      vertexHelperLines.where(
        (draw) =>
            draw.material.colorR > 0.9 &&
            draw.material.colorG < 0.1 &&
            draw.material.colorB < 0.1,
      ),
      hasLength(1),
      reason: 'VertexNormalsHelper defaults to red',
    );
    expect(
      vertexHelperLines.where(
        (draw) =>
            draw.material.colorR < 0.1 &&
            draw.material.colorG > 0.9 &&
            draw.material.colorB > 0.9,
      ),
      hasLength(1),
      reason: 'VertexTangentsHelper defaults to cyan',
    );

    // The two overlay LineSegments (WireframeGeometry + EdgesGeometry) are
    // transparent 0.25 with depth test disabled.
    final overlays = lineDraws
        .where(
          (draw) =>
              draw.material.transparent &&
              !draw.material.depthTest &&
              draw.material.opacity < 0.3,
        )
        .toList();
    expect(overlays, hasLength(2));

    // Lights: the module adds ONE PointLight (animated by animate()). R1 has
    // no directional/spot/hemisphere light in this scene.
    expect(plan.pointLights, hasLength(1));
    final pointLight = plan.pointLights.single;
    expect(pointLight.intensity, closeTo(1, 0.001));
    expect(plan.directionalLights, isEmpty);
    expect(plan.spotLights, isEmpty);
    expect(plan.hemisphereLights, isEmpty);
    expect(plan.diagnostics.droppedPointLightCount, 0);

    // animate() sweeps the light around the scene every frame; the state's
    // light upsert must refresh as the signature changes across frames.
    final before = pointLight.worldPosition;
    await harness.pumpFrames(tester, 6);
    final liveLight = harness.state!.lights.values
        .singleWhere((light) => light.type == JsThreeLightType.point);
    final after = liveLight.worldPosition;
    var moved = false;
    for (var i = 0; i < 3; i++) {
      if ((before[i] - after[i]).abs() > 1) moved = true;
    }
    expect(moved, isTrue,
        reason: 'animate() must move the point light between frames');

    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 120)));
}
