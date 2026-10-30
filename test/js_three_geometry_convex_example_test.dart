import 'dart:math' as math;
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart'
    show JsThreeMaterialKind, JsThreeSide, JsThreeTextureEncoding;
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';
import 'support/three_patch_once.dart';

/// webgl_geometry_convex (three.js r186) — PASS: the ConvexGeometry addon is
/// fully inlined in the prepared widget and the whole scene is R1-clean.
///
/// The official module builds a convex hull over the merged vertices of a
/// DodecahedronGeometry(10): it deletes normal/uv, consolidates duplicate
/// corners with BufferGeometryUtils.mergeVertices (addon, inlined), feeds
/// the unique Vector3s to `new ConvexGeometry(vertices)` (addon
/// geometries/ConvexGeometry.js + math/ConvexHull.js, both inlined — the
/// half-edge/VertexList classes ship inside widget.js), and renders:
///
/// - the 20-point cloud (`Points` with `PointsMaterial({color:0x0080ff,
///   map: disc.png, size:1, alphaTest:0.5})`, geometry via
///   BufferGeometry.setFromPoints — non-indexed),
/// - the hull mesh (`Mesh` with `MeshLambertMaterial({color:0xffffff,
///   opacity:0.5, side:DoubleSide, transparent:true})` — ConvexGeometry
///   emits a non-indexed triangle soup with computed per-face normals; the
///   12 pentagonal hull faces triangulate to 36 ConvexHull faces = 108
///   vertices),
/// - `AxesHelper(20)` (LineSegments with vertex colors),
/// - `AmbientLight(0x666666)` + a camera-attached
///   `PointLight(0xffffff,3,0,0)` — point lights are supported in R1 draw
///   plans (only their SHADOW maps are dropped), and the group rotates
///   +0.005 rad/frame around Y.
///
/// Nothing in the module leaves the R1 profile: Lambert + Points + Line
/// materials, one 32x32 sRGB map (embedded sha-gated disc.png lane), linear
/// tone mapping defaults, no fog, no ShaderMaterial, no sprites.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'geometry convex example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_geometry_convex renders the hull mesh, point cloud and '
      'axes helper on R1', (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-geometry-convex',
      instanceId: 'three-geometry-convex-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount == 3 &&
          state.textureUploadCount == 1 &&
          plan.draws.length == 3 &&
          state.submittedFrameCount >= 2,
      attempts: 400,
    );
    harness.expectHealthy('webgl_geometry_convex');
    final plan = harness.plan!;
    final state = harness.state!;
    final exported = harness.engine.exportedState!;

    // The widget registered its embedded disc.png sprite texture.
    final assets = exported['assets'] as Map;
    final disc = assets['textures/sprites/disc.png'] as Map;
    expect(disc['registered'], isTrue);
    expect(disc['bytes'], 866);

    // Points (opaque) + hull mesh (transparent, DoubleSide) + AxesHelper.
    expect(plan.draws, hasLength(3));
    expect(state.geometryUploadCount, 3);
    expect(state.materials, hasLength(3));

    final mesh = plan.draws.singleWhere(
      (draw) => draw.material.kind == JsThreeMaterialKind.meshLambert,
    );
    final points = plan.draws.singleWhere(
      (draw) => draw.material.kind == JsThreeMaterialKind.pointsBasic,
    );
    final axes = plan.draws.singleWhere(
      (draw) => draw.material.kind == JsThreeMaterialKind.lineBasic,
    );

    // Hull mesh: ConvexGeometry emits a non-indexed position+normal soup.
    // 36 ConvexHull faces over the 12 pentagonal faces of the dodecahedron
    // hull → 108 vertices → 36 triangles.
    expect(mesh.geometry.vertexCount, 108);
    expect(mesh.drawCount, 108);
    expect(mesh.indexed, isFalse);
    expect(mesh.geometry.indexCount, 0);
    expect(mesh.primitive, ThreeDrawPrimitive.triangles);
    expect(mesh.geometry.normals, isNotNull);
    expect(mesh.geometry.normals!.length, 108 * 3);
    expect(mesh.geometry.colors, isNull);
    // MeshLambertMaterial({color: 0xffffff, opacity: .5, side: DoubleSide,
    // transparent: true}).
    expect(mesh.material.colorR, closeTo(1, 0.001));
    expect(mesh.material.colorG, closeTo(1, 0.001));
    expect(mesh.material.colorB, closeTo(1, 0.001));
    expect(mesh.material.opacity, closeTo(0.5, 0.001));
    expect(mesh.material.transparent, isTrue);
    expect(mesh.material.side, JsThreeSide.double);
    expect(mesh.material.mapTextureId, 0);

    // Point cloud: 20 merged dodecahedron corners,
    // PointsMaterial({color:0x0080ff, map:disc.png, size:1, alphaTest:.5}).
    expect(points.geometry.vertexCount, 20);
    expect(points.drawCount, 20);
    expect(points.indexed, isFalse);
    expect(points.primitive, ThreeDrawPrimitive.points);
    expect(points.geometry.positions.length, 20 * 3);
    expect(points.material.mapTextureId, isNot(0));
    expect(points.material.mapTextureId, state.textures.keys.single);
    expect(points.material.pointSize, closeTo(1, 0.001));
    expect(points.material.alphaTest, closeTo(0.5, 0.001));
    expect(points.material.sizeAttenuation, isTrue);
    expect(points.material.colorR, closeTo(0, 0.001));
    expect(points.material.colorG, closeTo(_linearOf(0x80), 0.01));
    expect(points.material.colorB, closeTo(1, 0.001));
    expect(points.geometry.colors, isNull);

    // The one texture upload is disc.png: the 32x32 sRGB PNG passes through
    // the encoded-pixel lane (866 raw PNG bytes, decoded by the host).
    final texture = state.textures.values.single;
    expect(texture.isEncoded, isTrue);
    expect(texture.encoding, JsThreeTextureEncoding.png);
    expect(texture.srgb, isTrue);
    expect(texture.width, 32);
    expect(texture.height, 32);
    expect(texture.data.length, 866);
    expect(texture.data.any((byte) => byte != 0), isTrue);

    // AxesHelper(20): 6 line vertices with per-vertex colors.
    expect(axes.geometry.vertexCount, 6);
    expect(axes.drawCount, 6);
    expect(axes.primitive, ThreeDrawPrimitive.lines);
    expect(axes.material.vertexColors, isTrue);
    expect(axes.geometry.colors, isNotNull);
    expect(axes.geometry.colors!.length, 6 * 3);

    // 36 hull triangles (points/lines never count as triangles).
    expect(plan.triangleCount, 36);

    // AmbientLight(0x666666) + PointLight(0xffffff, 3, 0, 0) attached to
    // the camera at (15, 20, 30). Point shadows are NOT requested here.
    expect(plan.ambient.r, closeTo(_linearOf(0x66), 0.01));
    expect(plan.ambient.g, closeTo(_linearOf(0x66), 0.01));
    expect(plan.ambient.b, closeTo(_linearOf(0x66), 0.01));
    expect(plan.pointLights, hasLength(1));
    final point = plan.pointLights.single;
    expect(point.intensity, closeTo(3, 0.001));
    expect(point.colorR, closeTo(1, 0.001));
    expect(point.worldPosition[0], closeTo(15, 0.001));
    expect(point.worldPosition[1], closeTo(20, 0.001));
    expect(point.worldPosition[2], closeTo(30, 0.001));
    expect(plan.directionalLights, isEmpty);
    expect(plan.spotLights, isEmpty);
    expect(plan.hemisphereLights, isEmpty);
    expect(plan.frame!.hasShadow, isFalse);

    // The official animate() rotates the group +0.005 rad/frame: the hull
    // mesh's world matrix must actually move between frames.
    final before = List<double>.from(mesh.node.matrixWorld);
    await harness.pumpFrames(tester, 30);
    final plan2 = const ThreeDrawPlanner().plan(harness.state!);
    final mesh2 = plan2.draws.singleWhere(
      (draw) => draw.material.kind == JsThreeMaterialKind.meshLambert,
    );
    expect(
      mesh2.node.matrixWorld,
      isNot(before),
      reason: 'the official group.rotation.y rotation must reach the R1 node',
    );
    expect(harness.state!.submittedFrameCount, greaterThan(2));

    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_geometry_convex probe pins the inlined ConvexGeometry '
      'addon pipeline (mergeVertices + ConvexHull)', (tester) async {
    final probe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: _convexProbeSource(),
      instanceId: 'three-geometry-convex-probe',
    );
    for (var attempt = 0; attempt < 300; attempt++) {
      final p = probe.engine.exportedState?['probe'] as Map?;
      if (p != null && p['hullFaces'] != null && (p['ticks'] as int) >= 2) {
        break;
      }
      await probe.pumpFrame(tester);
    }
    final p = probe.engine.exportedState!['probe'] as Map;
    // DodecahedronGeometry(10) at detail 0 is a 108-vertex triangle soup;
    // deleteAttribute(normal/uv) + mergeVertices consolidates it to the 20
    // unique corners that feed the hull.
    expect(p['rawVerts'], 108);
    expect(p['hullInput'], 20);
    // ConvexHull is strictly triangular: the 12 pentagonal hull faces
    // triangulate to 36 faces → 108 position entries in ConvexGeometry.
    expect(p['hullFaces'], 36);
    expect(p['hullVerts'], 108);
    // The animate loop renders successfully — no capability error anywhere.
    expect(p['ticks'], greaterThanOrEqualTo(2));
    expect(p['renderErrors'], 0);
    expect(p['renderCode'], 'unreached');
    await probe.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 120)));
}

/// sRGB channel (0..255) → linear, matching THREE.Color's working space.
double _linearOf(int channel8) {
  final value = channel8 / 255;
  return value <= 0.04045
      ? value / 12.92
      : math.pow((value + 0.055) / 1.055, 2.4).toDouble();
}


/// The convex widget.js instrumented with a state-flag probe pinning the
/// addon pipeline: findings live on `globalThis.__JSR_PROBE` and are
/// re-exported through `jsr.exportState`. Definitions are PREPENDED because
/// init() runs during bundle evaluation.
String _convexProbeSource() {
  const id = '[A-Za-z_\$][\\w\$]*';
  var source =
      File('example/widgets/three-geometry-convex/widget.js').readAsStringSync();

  source = 'globalThis.__JSR_PROBE={rawVerts:0,hullInput:0,hullFaces:null,'
          'hullVerts:0,ticks:0,renderErrors:0,renderCode:"unreached",'
          'renderFeature:"unreached",renderMsg:"unreached"};'
      'globalThis.__JSR_PROBE_EXPORT=function(){try{'
      'var p=globalThis.__JSR_PROBE;'
      'if(globalThis.jsr&&jsr.exportState)jsr.exportState({probe:{'
      'rawVerts:p.rawVerts,hullInput:p.hullInput,hullFaces:p.hullFaces,'
      'hullVerts:p.hullVerts,ticks:p.ticks,renderErrors:p.renderErrors,'
      'renderCode:p.renderCode,renderFeature:p.renderFeature,'
      'renderMsg:p.renderMsg}})}catch(e){}};'
      'globalThis.__JSR_PROBE_RENDER=function(r,s,c){try{return r.render(s,c)}'
      'catch(e){var p=globalThis.__JSR_PROBE;'
      'if(p.renderErrors===0){p.renderCode=String(e.code||"");'
      'p.renderFeature=String(e.feature||"");'
      'p.renderMsg=String(e.message||"")}p.renderErrors++;'
      "console.error('JSR_RENDERFAIL code='+e.code+' feature='+e.feature"
      "+' msg='+e.message);globalThis.__JSR_PROBE_EXPORT();throw e}};\n"
      '$source';

  // init(): dodecahedron vertex count BEFORE mergeVertices.
  source = patchOnce(source, 'preMerge',
      RegExp('($id)\\.deleteAttribute\\("uv"\\),\\1=($id)\\(\\1\\);'),
      (m) => '${m[1]}.deleteAttribute("uv"),'
          'globalThis.__JSR_PROBE.rawVerts='
          '${m[1]}.getAttribute("position").count,'
          '${m[1]}=${m[2]}(${m[1]});');

  // init(): count the unique vectors pushed for the hull.
  source = patchOnce(source, 'hullInput',
      RegExp('($id)=new ($id);\\1\\.fromBufferAttribute\\(($id),($id)\\),($id)\\.push\\(\\1\\)'),
      (m) => '${m[0]},globalThis.__JSR_PROBE.hullInput++');

  // ConvexGeometry: ConvexHull face count (strictly triangular faces).
  source = patchOnce(source, 'hullFaces',
      RegExp('($id)=new ($id)\\(\\)\\.setFromPoints\\(($id)\\)\\.faces;'),
      (m) => '${m[0]}globalThis.__JSR_PROBE.hullFaces=${m[1]}.length;'
          'globalThis.__JSR_PROBE_EXPORT();');

  // ConvexGeometry: position attribute vertex count.
  source = patchOnce(source, 'hullVerts',
      RegExp('this\\.setAttribute\\("normal",new ($id)\\(($id),3\\)\\)\\}'),
      (m) => 'this.setAttribute("normal",new ${m[1]}(${m[2]},3)),'
          'globalThis.__JSR_PROBE.hullVerts=${m[2]}.length/3,'
          'globalThis.__JSR_PROBE_EXPORT()}');

  // animate(): guarded renderer.render (must never fail on this module) and
  // a periodic probe re-export (nothing else exports after init on a healthy
  // module, so the Dart side would otherwise read a stale init snapshot).
  source = patchOnce(source, 'animate',
      RegExp('function ($id)\\(\\)\\{($id)\\.rotation\\.y\\+=\\.005,($id)\\.render\\(($id),($id)\\)\\}'),
      (m) => 'function ${m[1]}(){${m[2]}.rotation.y+=.005;'
          'globalThis.__JSR_PROBE.ticks++,'
          'globalThis.__JSR_PROBE.ticks%5===0&&globalThis.__JSR_PROBE_EXPORT();'
          'return globalThis.__JSR_PROBE_RENDER(${m[3]},${m[4]},${m[5]})}');

  return source;
}
