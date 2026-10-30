import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart'
    show JsThreeMaterialKind, JsThreeSide;
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test('clipping advanced + teapot examples', () {},
        skip: 'QuickJS native library is not available');
    return;
  }

  testWidgets('webgl_clipping_advanced renders the clipped instanced volume '
      'with its full GUI', (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-clipping-advanced',
      instanceId: 'three-clipping-advanced-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount > 0 &&
          plan.draws.isNotEmpty &&
          state.submittedFrameCount >= 1,
    );
    harness.expectHealthy('webgl_clipping_advanced');

    final state = harness.state!;
    final plan = harness.plan!;

    // No widget error cards: the former lil-gui.listen() facade gap is gone
    // (controller.listen() is now a silent pass-through in the baked
    // adapter), so init() completes end to end.
    expect(
      harness.renderTrees.map((tree) => tree.toString()).join('\n'),
      isNot(contains('Widget error')),
    );

    // The 125-instance clipped box volume plus the receiving ground plane
    // (official_module.js 195-205, 251-257); the plane-visualization group
    // ships with visible=false and never draws.
    expect(plan.draws, hasLength(2));
    // 125 boxes x 12 triangles + 2 ground triangles.
    expect(
      plan.draws.fold<int>(
        0,
        (total, draw) => total + (draw.drawCount ~/ 3) * draw.instanceCount,
      ),
      1502,
    );

    // Lights (official_module.js 154-179): one spot (angle PI/5, penumbra
    // 0.2) plus one directional fill, both with 1024 shadow maps, over a
    // white ambient.
    expect(plan.spotLights, hasLength(1));
    final spot = plan.spotLights.single;
    expect(spot.spotAngle, closeTo(0.6283, 0.001));
    expect(spot.spotPenumbra, closeTo(0.2, 0.001));
    expect(plan.directionalLights, hasLength(1));
    expect(plan.ambient.b, greaterThan(0));
    final frame = plan.frame!;
    expect(frame.hasShadow, isTrue);
    expect(frame.shadowMapWidth, 1024);

    // The box material clips via its local 4-plane tetrahedron volume with
    // shadow clipping on and DoubleSide (official_module.js 184-191).
    final clipMaterial = plan.draws
        .map((draw) => draw.material)
        .firstWhere((material) => material.shininess == 100);
    expect(clipMaterial.kind, JsThreeMaterialKind.meshPhong);
    expect(clipMaterial.clipShadows, isTrue);
    expect(clipMaterial.hasClipping, isTrue);
    expect(clipMaterial.side, JsThreeSide.double);
    final clipping = state.clippings[clipMaterial.clipId]!;
    expect(clipping.planeCount, 4);
    // Only the drawn box material registers a clipping: the hidden plane
    // visualization group never reaches the wire, and the global plane set
    // is disabled by default (renderer.clippingPlanes starts frozen empty).
    expect(state.clippings, hasLength(1));
    // The ground is the unclipped shininess-10 phong (official_module.js
    // 254-256).
    expect(
      plan.draws.map((draw) => draw.material.shininess),
      contains(10.0),
    );

    // The full GUI now registers: three 'Local Clipping' checkboxes plus
    // the 'Global Clipping' Enabled toggle (false: global planes disabled
    // by default) — official_module.js 292-343.
    final gui = harness.engine.exportedState!['gui'] as Map<String, dynamic>;
    final values = gui['values'] as List<dynamic>;
    expect(gui['roots'], 1);
    expect(values, hasLength(4));
    final controllers = values.cast<Map<String, dynamic>>();
    expect(
      controllers
          .where((controller) => controller['folder'] == 'Local Clipping')
          .map((controller) => controller['name']),
      containsAll(const ['Enabled', 'Shadows', 'Visualize']),
    );
    final globalToggle = controllers.singleWhere(
      (controller) => controller['folder'] == 'Global Clipping',
    );
    expect(globalToggle['name'], 'Enabled');
    expect(globalToggle['value'], isFalse);

    // The setAnimationLoop keeps animating the rotating clipped volume.
    final submitted = state.submittedFrameCount;
    await harness.pumpFrames(tester, 6);
    expect(harness.state!.submittedFrameCount, greaterThan(submitted));

    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 120)));

  testWidgets('webgl_geometry_teapot still aborts on the pisa cube load '
      '(unshimmed CubeTextureLoader); everything else renders', (
    tester,
  ) async {
    // Documented two-layer gap, layer 1 pinned on the unmodified widget:
    // the six pisa cube faces ship as embedded registered assets, but the
    // native bundle only replaces TextureLoader/FileLoader
    // (tool/three/src/native_three_shim.js:4) — upstream CubeTextureLoader
    // still creates one <img> per face, and the wrapper's img path throws
    // `three-geometry-teapot: local web textures require OffscreenCanvas`
    // (tool/three_example/example_adapter.js:189) because the QuickJS host
    // exposes no OffscreenCanvas. init() aborts at official_module.js:71,
    // before setupGui() and before the module's single render() call.
    //
    // Layer 2 (latent, NOT reachable while layer 1 stands): the reflective
    // shading option needs the cube texture as MeshPhongMaterial.envMap,
    // which sits in the rejected materialTexture slots list
    // (lib/src/renderer/nodes/three/native_renderer.js:200) — so even with
    // a cube loader shim, the 'reflective' material would be rejected until
    // envMap slots are supported.
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-geometry-teapot',
      instanceId: 'three-geometry-teapot-test',
    );
    await harness.pumpFrames(tester, 30);

    final exported = harness.engine.exportedState!;
    expect(exported['example'], 'webgl_geometry_teapot');
    expect(exported['backend'], 'flutterGpu');
    expect(exported['canvasCount'], 1);
    expect(exported['mounted'], isTrue);

    // All seven textures ship registered in the prepared widget: the uv
    // grid plus the six cube faces.
    final assets = exported['assets'] as Map<String, dynamic>;
    expect(assets, hasLength(7));
    for (final url in [
      'textures/uv_grid_opengl.jpg',
      'textures/cube/pisa/px.png',
      'textures/cube/pisa/nx.png',
      'textures/cube/pisa/py.png',
      'textures/cube/pisa/ny.png',
      'textures/cube/pisa/pz.png',
      'textures/cube/pisa/nz.png',
    ]) {
      expect((assets[url] as Map<String, dynamic>)['registered'], isTrue,
          reason: '$url must be embedded');
    }

    // init() dies at the cube load: GUI never registers and no frame is
    // ever submitted (this module has no animation loop).
    final gui = exported['gui'] as Map<String, dynamic>;
    expect(gui['roots'], 0);
    expect(gui['controllers'], 0);
    expect(harness.renderTrees.first['type'], 'three');
    expect(harness.renderTrees.first['canvasId'], 'main');
    expect(
      harness.renderTrees.map((tree) => tree.toString()).join('\n'),
      contains('Widget error: three-geometry-teapot: local web textures '
          'require OffscreenCanvas'),
    );
    expect(harness.surface, isNull);
    expect((exported['renderer'] as Map<String, dynamic>)['frame'], 0);
    expect((exported['stats'] as Map<String, dynamic>)['begins'], 0);
    await harness.dispose(tester);

    // Proof that layer 1 is the ONLY boot blocker: the same widget with
    // only the CubeTextureLoader.load statement stubbed out
    // (minifier-resilient regex) boots completely — the dropdown rows now
    // render on the host (second facade unlock), setupGui() registers all
    // seven official controllers, and the default glossy teapot submits a
    // real R1 frame.
    var source = File(
      'example/widgets/three-geometry-teapot/widget.js',
    ).readAsStringSync();
    final cubeLoad = RegExp(
      r'[A-Za-z$_][A-Za-z0-9$_]*=new [A-Za-z$_][A-Za-z0-9$_]*\(\)'
      r'\.setPath\([A-Za-z$_][A-Za-z0-9$_]*\)'
      r'\.load\([A-Za-z$_][A-Za-z0-9$_]*\),',
    );
    expect(cubeLoad.allMatches(source).length, 1);
    final probe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: source.replaceAll(
        cubeLoad,
        'console.log("JSR_CUBE_STUBBED"),',
      ),
      instanceId: 'three-geometry-teapot-stubbed-probe',
    );
    await probe.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount > 0 &&
          plan.draws.isNotEmpty &&
          state.submittedFrameCount >= 1,
    );
    probe.expectHealthy('webgl_geometry_teapot');

    final plan = probe.plan!;
    expect(plan.draws, hasLength(1));
    final teapot = plan.draws.single;
    expect(teapot.material.kind, JsThreeMaterialKind.meshPhong);
    expect(teapot.material.shininess, 300);
    expect(teapot.material.side, JsThreeSide.double);
    // TeapotGeometry at the default tessellation level 15.
    expect(teapot.drawCount, 42840);
    expect(teapot.instanceCount, 1);

    // Lights (official_module.js 43-46): ambient + one directional, no
    // spot, no hemisphere, no shadow maps.
    expect(plan.directionalLights, hasLength(1));
    expect(plan.directionalLights.single.intensity, closeTo(2.0, 0.001));
    expect(plan.spotLights, isEmpty);
    expect(plan.hemisphereLights, isEmpty);
    expect(plan.ambient.r, greaterThan(0));
    expect(plan.ambient.g, greaterThan(0));
    expect(plan.ambient.b, greaterThan(0));
    expect(plan.frame!.hasShadow, isFalse);

    // All seven official GUI controllers survive the bounded facade, both
    // dropdowns included (official_module.js 121-127).
    final guiFixed =
        probe.engine.exportedState!['gui'] as Map<String, dynamic>;
    final values = guiFixed['values'] as List<dynamic>;
    expect(guiFixed['roots'], 1);
    expect(values, hasLength(7));
    final controllers = values.cast<Map<String, dynamic>>();
    expect(
      controllers.map((controller) => controller['name']),
      containsAll(const [
        'Tessellation Level',
        'display lid',
        'display body',
        'display bottom',
        'snug lid',
        'original scale',
        'Shading',
      ]),
    );
    final tess = controllers.singleWhere(
      (controller) => controller['name'] == 'Tessellation Level',
    );
    expect(tess['kind'], 'options');
    expect(tess['value'], 15);
    final shading = controllers.singleWhere(
      (controller) => controller['name'] == 'Shading',
    );
    expect(shading['kind'], 'options');
    expect(shading['value'], 'glossy');
    await probe.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 240)));
}
