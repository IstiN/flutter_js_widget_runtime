import 'dart:math' as math;

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// webgl_loader_ply + webgl_loader_stl — official r186 loader examples.
///
/// Both modules share one scaffold: a 40x40 Phong ground plane
/// (0xcbcbcb, specular 0x474747), a `HemisphereLight(0x8d7c7c,
/// 0x494966, 3)`, two shadow-casting `DirectionalLight`s
/// (0xffffff/3.5 at (1,1,1) and 0xffd500/3 at (0.5,1,-1)),
/// `Fog(0x72645b, 2, 15)` and an orbiting camera. The prepared
/// widgets embed their model assets in widget.js, so both loaders
/// resolve their `./models/...` URLs and render the full official
/// scenes on the stock harness:
///
/// PLY — dolphins.ply (ASCII, 855 verts / 1689 faces → INDEXED) and
/// Lucy100k.ply (binary LE, 50002 verts / 100000 faces → INDEXED),
/// both `MeshStandardMaterial({color: 0x009cff, flatShading: true})`
/// with computed vertex normals and NO vertex colors (neither PLY
/// carries color properties). The PLY module's addShadowedLight sets
/// 1024x1024 shadow maps with bias -0.001.
///
/// STL — slotted_disk.stl (ASCII, 288 facets), pr2_head_pan.stl
/// (1000), pr2_head_tilt.stl (1052) and colored.stl (2156, "COLOR="
/// header → per-face vertex colors with alpha 255/255 = 1).
/// STLLoader emits NON-INDEXED position+normal geometries; the two
/// pr2 meshes share ONE 0xd5d5d5 material instance and colored.stl's
/// `hasColors` branch swaps in a `vertexColors: true` Phong material.
/// addShadowedLight sets no mapSize here → default 512, bias -0.002.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'loader ply/stl examples',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_loader_ply renders dolphins + Lucy100k from the embedded '
      'model assets', (tester) async {
    await _plyFullSceneTest(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_loader_stl renders 4 non-indexed STL meshes from the '
      'embedded model assets', (tester) async {
    await _stlFullSceneTest(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}

Future<void> _plyFullSceneTest(WidgetTester tester) async {
  final harness = await ThreeQuickjsExampleHarness.boot(
    tester,
    widgetId: 'three-loader-ply',
    instanceId: 'three-loader-ply-test',
  );
  await harness.pumpUntil(
    tester,
    (state, plan) =>
        state.geometryUploadCount >= 3 &&
        plan.draws.length >= 3 &&
        state.submittedFrameCount >= 1,
  );
  harness.expectHealthy('webgl_loader_ply');
  final plan = harness.plan!;
  final state = harness.state!;

  // The widget registered its embedded model assets.
  expect(harness.engine.exportedState!['assets'] as Map, isNotEmpty);

  // Ground plane + dolphins + Lucy100k.
  expect(plan.draws, hasLength(3));
  expect(state.geometryUploadCount, 3);
  expect(state.materials, hasLength(3));

  final ground = plan.draws
      .where((draw) => draw.material.kind == JsThreeMaterialKind.meshPhong)
      .single;
  _expectGroundPlane(ground);

  final plyDraws = plan.draws
      .where((draw) => draw.material.kind == JsThreeMaterialKind.meshStandard)
      .toList();
  expect(plyDraws, hasLength(2));

  // Both PLY materials: color 0x009cff, flatShading, no vertex colors
  // (neither dolphins.ply nor Lucy100k.ply has color properties).
  for (final draw in plyDraws) {
    expect(draw.material.flatShading, isTrue);
    expect(draw.material.vertexColors, isFalse);
    expect(draw.material.colorR, closeTo(0, 0.001));
    expect(draw.material.colorB, closeTo(1, 0.001));
    expect(draw.node.castShadow, isTrue);
    expect(draw.node.receiveShadow, isTrue);
  }

  // dolphins.ply: 855 verts / 1689 faces; Lucy100k.ply: 50002 verts /
  // 100000 faces. PLYLoader keeps the face list as an index buffer.
  final plyTriangles = plyDraws.fold<int>(
    0,
    (total, draw) => total + draw.drawCount ~/ 3,
  );
  expect(plyTriangles, greaterThan(100000));
  expect(
    plyDraws.map((draw) => draw.geometry.vertexCount),
    containsAll(<int>[855, 50002]),
  );
  for (final draw in plyDraws) {
    expect(draw.indexed, isTrue);
    expect(draw.geometry.indexCount, greaterThan(0));
    // computeVertexNormals() ran in both load callbacks.
    expect(draw.geometry.normals, isNotNull);
    expect(draw.geometry.normals!.length, draw.geometry.vertexCount * 3);
    expect(draw.geometry.colors, isNull);
  }

  // Ground (2) + dolphins (1689) + Lucy100k (100000).
  expect(plan.triangleCount, 101691);
  _expectLightRigAndFrame(plan, shadowMapSize: 1024, shadowBias: -0.001);

  await harness.dispose(tester);
}

Future<void> _stlFullSceneTest(WidgetTester tester) async {
  final harness = await ThreeQuickjsExampleHarness.boot(
    tester,
    widgetId: 'three-loader-stl',
    instanceId: 'three-loader-stl-test',
  );
  await harness.pumpUntil(
    tester,
    (state, plan) =>
        state.geometryUploadCount >= 5 &&
        plan.draws.length >= 5 &&
        state.submittedFrameCount >= 1,
  );
  harness.expectHealthy('webgl_loader_stl');
  final plan = harness.plan!;
  final state = harness.state!;

  // The widget registered its embedded model assets.
  expect(harness.engine.exportedState!['assets'] as Map, isNotEmpty);

  // Ground plane + slotted_disk + pr2_head_pan + pr2_head_tilt + colored.
  expect(plan.draws, hasLength(5));
  expect(state.geometryUploadCount, 5);
  // ground + slotted + ONE shared pr2 material + the colored.stl swap.
  expect(state.materials, hasLength(4));

  // The ground plane is the only indexed draw; the 4 STL model draws
  // are the non-indexed ones (STLLoader emits a flat triangle soup).
  _expectGroundPlane(plan.draws.singleWhere((draw) => draw.indexed));
  final stlDraws = plan.draws.where((draw) => !draw.indexed).toList();
  expect(stlDraws, hasLength(4));

  for (final draw in stlDraws) {
    expect(draw.material.kind, JsThreeMaterialKind.meshPhong);
    expect(draw.geometry.indexCount, 0);
    expect(draw.drawCount, draw.geometry.vertexCount);
    expect(draw.node.castShadow, isTrue);
    expect(draw.node.receiveShadow, isTrue);
  }

  // slotted_disk 288*3 verts, pr2_head_pan 1000*3, pr2_head_tilt
  // 1052*3, colored 2156*3.
  expect(
    stlDraws.map((draw) => draw.drawCount).toSet(),
    containsAll(<int>{864, 3000, 3156, 6468}),
  );

  // slotted_disk (0xff9c7c) and the shared pr2 base material
  // (0xd5d5d5) both set shininess 200; colored.stl's hasColors branch
  // swaps in {opacity, vertexColors} which keeps the default 30.
  for (final draw in stlDraws.where((draw) => !draw.material.vertexColors)) {
    expect(draw.material.shininess, closeTo(200, 0.001));
  }

  // slotted_disk keeps its explicit 0xff9c7c material; the two pr2
  // meshes share 0xd5d5d5; colored.stl's hasColors branch swaps in
  // {opacity, vertexColors} with the DEFAULT white color (r = g = b = 1).
  final slottedDraw = stlDraws.singleWhere(
    (draw) => !draw.material.vertexColors && draw.material.colorR > 0.9,
  );
  expect(slottedDraw.material.colorG, closeTo(_linearOf(0x9c), 0.01));
  expect(slottedDraw.material.colorB, closeTo(_linearOf(0x7c), 0.01));
  final pr2Draws = stlDraws
      .where((draw) => !draw.material.vertexColors)
      .where((draw) => draw.material.colorR < 0.9)
      .toList();
  expect(pr2Draws, hasLength(2));
  for (final draw in pr2Draws) {
    expect(draw.material.colorR, closeTo(_linearOf(0xd5), 0.01));
  }
  final coloredDraw = stlDraws.singleWhere(
    (draw) => draw.material.vertexColors,
  );
  expect(coloredDraw.geometry.colors, isNotNull);
  expect(coloredDraw.geometry.colorStride, 3);
  // The "COLOR=" header default alpha is 255 → geometry.alpha = 1.
  expect(coloredDraw.material.opacity, closeTo(1, 0.001));
  expect(
    stlDraws
        .where((draw) => !draw.material.vertexColors)
        .every((draw) => draw.geometry.colors == null),
    isTrue,
  );

  // Ground (2) + slotted (288) + pan (1000) + tilt (1052) + colored
  // (2156) triangles.
  expect(plan.triangleCount, 4498);
  _expectLightRigAndFrame(plan, shadowMapSize: 512, shadowBias: -0.002);

  await harness.dispose(tester);
}

/// The 40x40 Phong ground plane both scaffold share:
/// PlaneGeometry(40, 40) = 2 indexed triangles, 0xcbcbcb with
/// specular 0x474747.
void _expectGroundPlane(ThreeDrawItem draw) {
  expect(draw.drawCount, 6);
  expect(draw.indexed, isTrue);
  expect(draw.material.kind, JsThreeMaterialKind.meshPhong);
  for (final channel in [
    draw.material.colorR,
    draw.material.colorG,
    draw.material.colorB,
  ]) {
    expect(channel, closeTo(_linearOf(0xcb), 0.01));
  }
  for (final channel in [
    draw.material.specularR,
    draw.material.specularG,
    draw.material.specularB,
  ]) {
    expect(channel, closeTo(_linearOf(0x47), 0.01));
  }
}

void _expectLightRigAndFrame(
  ThreeDrawPlan plan, {
  required int shadowMapSize,
  required double shadowBias,
}) {
  // HemisphereLight(0x8d7c7c, 0x494966, 3).
  expect(plan.hemisphereLights, hasLength(1));
  final hemisphere = plan.hemisphereLights.single;
  expect(hemisphere.intensity, closeTo(3, 0.001));
  expect(hemisphere.colorR, closeTo(_linearOf(0x8d), 0.01));
  expect(hemisphere.colorG, closeTo(_linearOf(0x7c), 0.01));
  expect(hemisphere.groundColorR, closeTo(_linearOf(0x49), 0.01));
  expect(hemisphere.groundColorB, closeTo(_linearOf(0x66), 0.01));
  expect(plan.ambient.r, 0);

  // addShadowedLight(1,1,1, 0xffffff, 3.5) + (0.5,1,-1, 0xffd500, 3).
  expect(plan.directionalLights, hasLength(2));
  expect(plan.spotLights, isEmpty);
  expect(plan.pointLights, isEmpty);
  final byIntensity = plan.directionalLights.toList()
    ..sort((a, b) => b.intensity.compareTo(a.intensity));
  final white = byIntensity[0];
  expect(white.intensity, closeTo(3.5, 0.001));
  expect(white.colorR, closeTo(1, 0.001));
  expect(white.worldPosition[0], closeTo(1, 0.001));
  expect(white.worldPosition[2], closeTo(1, 0.001));
  final yellow = byIntensity[1];
  expect(yellow.intensity, closeTo(3, 0.001));
  expect(yellow.colorR, closeTo(1, 0.001));
  expect(yellow.colorG, closeTo(_linearOf(0xd5), 0.01));
  expect(yellow.colorB, closeTo(0, 0.001));
  expect(yellow.worldPosition[0], closeTo(0.5, 0.001));
  expect(yellow.worldPosition[2], closeTo(-1, 0.001));

  // Shadow map owned by a directional light; the PLY module sets 1024
  // maps, the STL module leaves the default 512.
  final frame = plan.frame!;
  expect(frame.hasShadow, isTrue);
  expect(frame.hasSpotShadow, isFalse);
  expect(frame.shadowLightType, JsThreeShadowLightType.directional.wireValue);
  expect(frame.shadowMapWidth, shadowMapSize);
  expect(frame.shadowMapHeight, shadowMapSize);
  // directionalLight.shadow.bias: -0.001 (PLY) / -0.002 (STL).
  expect(frame.shadowBias, closeTo(shadowBias, 0.0000001));

  // Fog(0x72645b, 2, 15) and the matching scene background.
  expect(frame.fogMode, JsThreeFogMode.linear);
  expect(frame.fogNear, closeTo(2, 0.001));
  expect(frame.fogFar, closeTo(15, 0.001));
  expect(frame.fogColorR, closeTo(_linearOf(0x72), 0.01));
  expect(frame.fogColorG, closeTo(_linearOf(0x64), 0.01));
  expect(frame.fogColorB, closeTo(_linearOf(0x5b), 0.01));
  expect(plan.background.r, closeTo(_linearOf(0x72), 0.01));
}

/// sRGB channel (0..255) → linear, matching THREE.Color's working space.
double _linearOf(int channel8) {
  final value = channel8 / 255;
  return value <= 0.04045
      ? value / 12.92
      : math.pow((value + 0.055) / 1.055, 2.4).toDouble();
}
