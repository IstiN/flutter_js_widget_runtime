import 'dart:math' as math;

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart'
    show
        JsThreeCameraType,
        JsThreeFogMode,
        JsThreeLightType,
        JsThreeMaterialKind,
        JsThreeSide;
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// three.js converts sRGB hex colors (0x0505 backgrounds, 0xcccc ambient,
/// 0x111 clear color) into its linear working space before the R1 wire,
/// via its exact EOTF (SRGBTransfer).
double _srgbToLinear(double channel) =>
    channel < 0.04045
        ? channel * 0.073993808
        : math.pow(channel * 0.9478672986 + 0.0521327014, 2.4).toDouble();

bool _sameMatrix(List<double> left, List<double> right) {
  if (left.length != right.length) return false;
  for (var index = 0; index < left.length; index++) {
    if (left[index] != right[index]) return false;
  }
  return true;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test('buffergeometry/camera examples', () {},
        skip: 'QuickJS native library is not available');
    return;
  }

  testWidgets(
    'webgl_buffergeometry renders 160k rotating vertex-colored triangles',
    (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-buffergeometry',
        instanceId: 'three-buffergeometry-test',
      );
      await harness.pumpUntil(
        tester,
        (state, plan) =>
            state.geometryUploadCount == 1 &&
            state.materialUploadCount == 1 &&
            plan.draws.length == 1 &&
            state.submittedFrameCount >= 2,
      );
      harness.expectHealthy('webgl_buffergeometry');

      final state = harness.state!;
      final plan = harness.plan!;
      final exported = harness.engine.exportedState!;

      // One mesh built by the module loop: 160000 non-indexed triangles from
      // raw position/normal/color attributes (480000 vertices, no indices).
      expect(plan.opaque, isEmpty);
      expect(plan.transparent, hasLength(1)); // material transparent: true
      final draw = plan.transparent.single;
      expect(draw.primitive, ThreeDrawPrimitive.triangles);
      expect(draw.indexed, isFalse);
      expect(draw.geometry.vertexCount, 480000);
      expect(draw.geometry.indexCount, 0);
      expect(draw.drawCount, 480000);
      expect(plan.triangleCount, 160000);
      expect(state.geometryUploadCount, 1);
      expect(state.materialUploadCount, 1);
      expect(state.textureUploadCount, 0);

      // r186 pushes colors with itemSize 4 (RGB plus random alpha per face).
      expect(draw.geometry.colors, isNotNull);
      expect(draw.geometry.colorStride, 4);
      expect(draw.geometry.normals, isNotNull);

      // MeshPhongMaterial { color: 0xd5d5d5, specular: 0xffffff,
      // shiness: 250, side: DoubleSide, vertexColors, transparent }.
      expect(draw.material.kind, JsThreeMaterialKind.meshPhong);
      expect(draw.material.shininess, 250);
      expect(draw.material.specularR, closeTo(1, 1e-6));
      expect(draw.material.specularG, closeTo(1, 1e-6));
      expect(draw.material.specularB, closeTo(1, 1e-6));
      expect(draw.material.colorR, closeTo(_srgbToLinear(213 / 255), 1e-4));
      expect(draw.material.vertexColors, isTrue);
      expect(draw.material.transparent, isTrue);
      expect(draw.material.side, JsThreeSide.double);
      expect(draw.material.mapTextureId, 0);

      // AmbientLight(0xcccc) plus the two directional fills: 1.5 from
      // (1, 1, 1) and 4.5 straight down from (0, -1, 0).
      expect(
        plan.ambient.r,
        closeTo(_srgbToLinear(204 / 255), 1e-4),
      );
      expect(
        plan.ambient.g,
        closeTo(_srgbToLinear(204 / 255), 1e-4),
      );
      expect(
        plan.ambient.b,
        closeTo(_srgbToLinear(204 / 255), 1e-4),
      );
      expect(plan.directionalLights, hasLength(2));
      expect(plan.pointLights, isEmpty);
      expect(plan.spotLights, isEmpty);
      expect(plan.hemisphereLights, isEmpty);
      expect(
        plan.directionalLights.every(
          (light) => light.type == JsThreeLightType.directional,
        ),
        isTrue,
      );
      final intensities =
          plan.directionalLights.map((light) => light.intensity).toList()
            ..sort();
      expect(intensities, [1.5, 4.5]);
      final bottomLight = plan.directionalLights.firstWhere(
        (light) => light.intensity > 4,
      );
      expect(bottomLight.worldPosition[0], closeTo(0, 1e-6));
      expect(bottomLight.worldPosition[1], closeTo(-1, 1e-6));
      expect(bottomLight.worldPosition[2], closeTo(0, 1e-6));
      expect(bottomLight.worldDirection[1], closeTo(-1, 1e-6));

      // Scene background and linear fog share 0x0505 with near/far 2000/3500.
      final frame = plan.frame!;
      expect(frame.fogMode, JsThreeFogMode.linear);
      expect(frame.fogNear, 2000);
      expect(frame.fogFar, 3500);
      expect(
        frame.fogColorR,
        closeTo(_srgbToLinear(5 / 255), 1e-4),
      );
      expect(frame.backgroundR, closeTo(_srgbToLinear(5 / 255), 1e-4));
      expect(frame.backgroundG, closeTo(_srgbToLinear(5 / 255), 1e-4));
      expect(frame.backgroundB, closeTo(_srgbToLinear(5 / 255), 1e-4));
      expect(frame.backgroundA, 1);
      expect(frame.hasShadow, isFalse);

      // 27° perspective camera parked at z = 2750.
      expect(plan.camera!.type, JsThreeCameraType.perspective);
      expect(plan.cameraPosition.x, closeTo(0, 1e-3));
      expect(plan.cameraPosition.y, closeTo(0, 1e-3));
      expect(plan.cameraPosition.z, closeTo(2750, 1e-2));

      // The native renderer info mirrors the single 160k-triangle draw call.
      final renderer = exported['renderer'] as Map<dynamic, dynamic>;
      expect(renderer['calls'], 1);
      expect(renderer['triangles'], 160000);
      expect(renderer['lines'], 0);
      expect(renderer['points'], 0);
      expect(renderer['geometries'], 1);

      // animate() spins the mesh (rotation.x = t * 0.25, y = t * 0.5) while
      // the geometry/material uploads stay at exactly one each.
      final before = draw.node.matrixWorld.toList();
      await harness.pumpUntil(
        tester,
        (currentState, currentPlan) =>
            currentPlan.transparent.length == 1 &&
            !_sameMatrix(
              before,
              currentPlan.transparent.single.node.matrixWorld,
            ),
      );
      expect(state.geometryUploadCount, 1);
      expect(state.materialUploadCount, 1);

      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 180)),
  );

  testWidgets(
    'webgl_camera dual-viewport scene switches to the ortho camera on keydown',
    (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-camera',
        instanceId: 'three-camera-test',
      );
      await harness.pumpUntil(
        tester,
        (state, plan) =>
            state.cameras.length >= 2 &&
            plan.draws.length == 5 &&
            plan.draws.any(
              (draw) => draw.primitive == ThreeDrawPrimitive.lines,
            ) &&
            plan.draws.any(
              (draw) => draw.primitive == ThreeDrawPrimitive.points,
            ) &&
            state.submittedFrameCount >= 2,
      );
      harness.expectHealthy('webgl_camera');

      final state = harness.state!;
      final plan = harness.plan!;
      final exported = harness.engine.exportedState!;

      // The submitted frame is the second render of the pair: the overview
      // render driven by the main PerspectiveCamera(50, ..., 1, 100).
      expect(plan.camera!.type, JsThreeCameraType.perspective);
      expect(plan.cameraPosition.x, closeTo(0, 1e-3));
      expect(plan.cameraPosition.z, closeTo(2500, 1e-1));

      // Only two cameras reach the wire before any key press: the overview
      // camera and the active rig perspective camera. The orthographic rig
      // camera stays unused until keydown 'O' swaps activeCamera.
      expect(state.cameras, hasLength(2));
      expect(
        state.cameras.values.every(
          (camera) => camera.type == JsThreeCameraType.perspective,
        ),
        isTrue,
      );

      // Unlit scene: three wireframe MeshBasicMaterial spheres, the
      // 10000-vertex randFloatSpread(2000) point cloud, one CameraHelper.
      final lineDraws = plan.draws
          .where((draw) => draw.primitive == ThreeDrawPrimitive.lines)
          .toList();
      final pointDraws = plan.draws
          .where((draw) => draw.primitive == ThreeDrawPrimitive.points)
          .toList();
      expect(lineDraws, hasLength(4));
      expect(pointDraws, hasLength(1));
      expect(pointDraws.single.drawCount, 10000);
      expect(pointDraws.single.material.kind, JsThreeMaterialKind.pointsBasic);
      final wireSpheres = lineDraws
          .where((draw) => draw.material.wireframe)
          .toList();
      expect(wireSpheres, hasLength(3));
      for (final sphere in wireSpheres) {
        expect(sphere.material.kind, JsThreeMaterialKind.meshBasic);
        expect(sphere.drawCount % 2, 0);
        expect(sphere.drawCount, greaterThan(0));
      }
      // The CameraHelper is a plain vertex-colored LineSegments.
      final helper = lineDraws.singleWhere(
        (draw) => !draw.material.wireframe,
      );
      expect(helper.material.kind, JsThreeMaterialKind.lineBasic);
      expect(helper.material.vertexColors, isTrue);
      expect(helper.drawCount % 2, 0);
      final helperNodeIdBefore = helper.node.nodeId;

      // No lights at all: MeshBasicMaterial, PointsMaterial, LineBasicMaterial.
      expect(plan.ambient.r, 0);
      expect(plan.ambient.g, 0);
      expect(plan.ambient.b, 0);
      expect(plan.directionalLights, isEmpty);
      expect(plan.pointLights, isEmpty);
      expect(plan.spotLights, isEmpty);
      expect(plan.hemisphereLights, isEmpty);

      // setScissorTest/setViewport are R1 no-ops: the frame keeps the second
      // render's 0x111 clear color, with no fog and no shadow map.
      final frame = plan.frame!;
      expect(frame.fogMode, JsThreeFogMode.none);
      expect(frame.backgroundR, closeTo(_srgbToLinear(17 / 255), 1e-4));
      expect(frame.backgroundG, closeTo(_srgbToLinear(17 / 255), 1e-4));
      expect(frame.backgroundB, closeTo(_srgbToLinear(17 / 255), 1e-4));
      expect(frame.backgroundA, 1);
      expect(frame.hasShadow, isFalse);

      // The official module ships no lil-gui: both viewports are switched
      // purely by the keydown O/P handlers.
      final gui = exported['gui'] as Map<dynamic, dynamic>;
      expect(gui['roots'], 0);
      expect(gui['controllers'], 0);

      // keydown 'O' (keyCode 79) makes cameraOrtho the active camera; the
      // next animate tick renders with it, uploading the ortho camera.
      harness.backend.dispatchHostEvent('key', {
        'key': 'o',
        'code': 'KeyO',
        'keyCode': 79,
      });
      await harness.pumpUntil(
        tester,
        (currentState, currentPlan) =>
            currentState.cameras.values.any(
              (camera) => camera.type == JsThreeCameraType.orthographic,
            ) &&
            currentPlan.draws.length == 5,
      );
      expect(state.cameras, hasLength(3));
      final orthoCamera = state.cameras.values.singleWhere(
        (camera) => camera.type == JsThreeCameraType.orthographic,
      );
      // frustumSize 600: top - bottom stays 600 for any aspect.
      expect(orthoCamera.projectionMatrix[0], greaterThan(0));
      expect(orthoCamera.projectionMatrix[5], closeTo(2 / 600, 1e-5));
      // The visible rig helper swapped to the ortho helper (different
      // upstream object id).
      final helperAfterSwitch = harness.plan!.draws
          .where((draw) => draw.primitive == ThreeDrawPrimitive.lines)
          .singleWhere((draw) => !draw.material.wireframe);
      expect(helperAfterSwitch.node.nodeId, isNot(helperNodeIdBefore));

      // keydown 'P' (keyCode 80) restores the perspective rig helper.
      harness.backend.dispatchHostEvent('key', {
        'key': 'p',
        'code': 'KeyP',
        'keyCode': 80,
      });
      await harness.pumpUntil(
        tester,
        (currentState, currentPlan) =>
            currentPlan.draws.length == 5 &&
            currentPlan.draws
                    .where(
                      (draw) => draw.primitive == ThreeDrawPrimitive.lines,
                    )
                    .singleWhere((draw) => !draw.material.wireframe)
                    .node
                    .nodeId ==
                helperNodeIdBefore,
      );

      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 120)),
  );
}
