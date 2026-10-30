
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// webgl_geometry_shapes — wave-3 REAL UV-transform lane (renders stock).
///
/// The official module builds a 93-object shape zoo — 33 MeshPhong
/// meshes (11 textured ShapeGeometry, 11 ExtrudeGeometry, 11 untextured
/// solid/bending shapes), 30 line loops, 30 point clouds — lit by one
/// PointLight(0xffffff, 2.5) parented to the camera, background
/// 0xf0f0f0, with the whole group rotating (lerp per tick).
///
/// The shape texture is configured for tiled shape UVs:
///
///     texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
///     texture.repeat.set( 0.008, 0.008 );
///
/// Wave-3 (R1 v4) ships per-map texture matrices: repeat/offset/
/// rotation/center compose the three.js Matrix3 uvTransform into the
/// material stream, and shaders/three_r1.frag applies it to the map UV
/// before sampling (the sampler repeats natively).
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'geometry shapes example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets(
      'webgl_geometry_shapes renders the official shape zoo with the R1 v4 '
      'map UV transform (repeat 0.008)', (tester) async {
    // Wave-3 made per-map UV transforms REAL (R1 v4): the module's
    // `texture.wrapS = texture.wrapT = RepeatWrapping;
    //  texture.repeat.set(0.008, 0.008)` now composes the three.js
    // Matrix3 uvTransform (offset/repeat/rotation/center) into the
    // material's mapUvMatrix instead of throwing textureTransform.
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-geometry-shapes',
      instanceId: 'three-geometry-shapes-test',
    );
    final plan = await harness.pumpUntil(
      tester,
      (state, candidate) =>
          candidate.draws.length >= 93 && state.submittedFrameCount >= 1,
    );
    harness.expectHealthy('webgl_geometry_shapes');
    expect(plan, isNotNull);
    final exported = harness.engine.exportedState!;
    expect(exported['example'], 'webgl_geometry_shapes');
    expect(exported['backend'], 'flutterGpu');
    expect(exported['mounted'], isTrue);

    // 33 Phong meshes (11 textured ShapeGeometry + 11 ExtrudeGeometry +
    // 11 untextured), 30 lines, 30 points.
    final triangles = plan!.draws
        .where((d) => d.primitive == ThreeDrawPrimitive.triangles)
        .toList();
    final lines = plan.draws
        .where((d) => d.primitive == ThreeDrawPrimitive.lines)
        .toList();
    final points = plan.draws
        .where((d) => d.primitive == ThreeDrawPrimitive.points)
        .toList();
    expect(triangles, hasLength(33));
    expect(lines, hasLength(30));
    expect(points, hasLength(30));
    expect(plan.pointLights, hasLength(1));
    expect(plan.pointLights.first.colorR, 1);
    expect(plan.pointLights.first.colorG, 1);
    expect(plan.pointLights.first.colorB, 1);
    expect(plan.pointLights.first.intensity, 2.5);

    // The single registered texture rides 11 of the Phong meshes with the
    // repeat 0.008 transform: column-major Matrix3 diag(0.008, 0.008, 1).
    final textured = triangles
        .where((d) => d.material.mapTextureId != 0)
        .toList();
    expect(textured, hasLength(11));
    expect(harness.state!.textures, hasLength(1));
    for (final draw in textured) {
      expect(draw.material.mapUvMatrix[0], closeTo(0.008, 1e-6));
      expect(draw.material.mapUvMatrix[4], closeTo(0.008, 1e-6));
      expect(draw.material.mapUvMatrix[8], closeTo(1, 1e-6));
      expect(draw.material.mapUvMatrix[6], 0);
      expect(draw.material.mapUvMatrix[7], 0);
      expect(draw.material.mapUvMatrix[1], 0);
      expect(draw.material.mapUvMatrix[3], 0);
    }
    // The point light sits on the camera; the module lerps the group
    // rotation every tick, so frames keep submitting.
    final submitted = harness.state!.submittedFrameCount;
    await harness.pumpFrames(tester, 6);
    expect(harness.state!.submittedFrameCount, greaterThan(submitted));
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 240)));
}
