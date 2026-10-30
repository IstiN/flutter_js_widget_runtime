import 'dart:io';
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
      'extrude splines and lights physical examples',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets(
      'webgl_geometry_extrude_splines renders the spline tube with a '
      'fully mounted lil-gui panel', (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-geometry-extrude-splines',
      instanceId: 'three-geometry-extrude-splines-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount > 0 &&
          plan.draws.isNotEmpty &&
          state.submittedFrameCount >= 1,
    );
    harness.expectHealthy('webgl_geometry_extrude_splines');

    final state = harness.state!;
    final plan = harness.plan!;

    // addTube() draws the GrannyKnot TubeGeometry exactly twice: once with
    // MeshLambertMaterial(0xff00ff) and once as its transparent black
    // wireframe overlay (MeshBasicMaterial wireframe, opacity 0.3, both
    // meshes share ONE geometry instance). The cameraEye sphere and the
    // splineCamera CameraHelper stay hidden (params.cameraHelper is false),
    // so they never join the plan.
    expect(plan.draws, hasLength(2));
    expect(plan.opaque, hasLength(1));
    expect(plan.transparent, hasLength(1));

    final tube = plan.opaque.single;
    final wire = plan.transparent.single;

    // TubeGeometry(GrannyKnot, tubularSegments 100, radius 2,
    // radialSegments 3, closed): (100+1)*(3+1)=404 vertices and
    // 100*3 quads = 600 triangles = 1800 indices.
    expect(tube.primitive, ThreeDrawPrimitive.triangles);
    expect(tube.geometry.vertexCount, 404);
    expect(tube.drawCount, 1800);
    expect(tube.material.kind.name, 'meshLambert');
    // 0xff00ff magenta in the linear working space: r=b=1, g=0.
    expect(tube.material.colorR, closeTo(1, 0.001));
    expect(tube.material.colorG, closeTo(0, 0.001));
    expect(tube.material.colorB, closeTo(1, 0.001));

    // The wireframe overlay renders as R1 line topology from the geometry's
    // wire indices and is the only transparent draw (opacity 0.3).
    expect(wire.primitive, ThreeDrawPrimitive.lines);
    expect(wire.material.kind.name, 'meshBasic');
    expect(wire.material.wireframe, isTrue);
    expect(wire.material.transparent, isTrue);
    expect(wire.material.opacity, closeTo(0.3, 0.001));
    expect(wire.indexed, isTrue);
    expect(wire.drawCount, greaterThan(0));
    expect(identical(wire.geometry, tube.geometry), isTrue);

    // Only the Lambert mesh contributes triangles (600 of them).
    expect(plan.triangleCount, 600);
    expect(state.geometryUploadCount, greaterThanOrEqualTo(1));

    // init(): AmbientLight(0xffffff) plus DirectionalLight(0xffffff, 1.5)
    // at (0,0,1) pointing at the default origin target.
    expect(plan.ambient.r, closeTo(1, 0.001));
    expect(plan.ambient.g, closeTo(1, 0.001));
    expect(plan.ambient.b, closeTo(1, 0.001));
    expect(plan.directionalLights, hasLength(1));
    final sun = plan.directionalLights.single;
    expect(sun.type.name, 'directional');
    expect(sun.intensity, closeTo(1.5, 0.001));
    expect(sun.worldPosition[0], closeTo(0, 0.001));
    expect(sun.worldPosition[1], closeTo(0, 0.001));
    expect(sun.worldPosition[2], closeTo(1, 0.001));
    expect(sun.worldDirection[2], closeTo(1, 0.001));
    expect(plan.pointLights, isEmpty);
    expect(plan.hemisphereLights, isEmpty);
    expect(plan.spotLights, isEmpty);

    // The module never enables renderer.shadowMap, so no shadow map rides
    // the frame; the 0xf0f0f0 scene background is a light gray.
    final frame = plan.frame!;
    expect(frame.hasShadow, isFalse);
    expect(frame.backgroundR, greaterThan(0.8));
    expect(frame.backgroundR, lessThan(1.01));
    expect(frame.backgroundG, closeTo(frame.backgroundR, 0.001));
    expect(frame.backgroundB, closeTo(frame.backgroundR, 0.001));

    // The module-visible renderer.info cross-checks the draw plan: the
    // animation loop keeps rendering the tube (2 calls = mesh + wireframe,
    // 600 triangles).
    final exported = harness.engine.exportedState!;
    final rendererInfo = exported['renderer'] as Map<String, dynamic>;
    expect(rendererInfo['frame'], greaterThan(0));
    expect(rendererInfo['calls'], 2);
    expect(rendererInfo['triangles'], 600);
    expect(rendererInfo['geometries'], 1);

    // The spline animation keeps submitting frames: the tube travels its
    // 20 s loop and render() succeeds on every tick (stats.update() runs
    // after render in animate()).
    final stats = exported['stats'] as Map<String, dynamic>;
    expect(stats['updates'], greaterThan(0));
    final framesAfterBoot = state.submittedFrameCount;
    final uploadsAfterBoot = state.geometryUploadCount;
    await harness.pumpFrames(tester, 5);
    expect(state.submittedFrameCount, greaterThan(framesAfterBoot));

    // init() now completes: the full lil-gui panel mounts on the bounded
    // native facade. The Geometry folder holds the spline dropdown (kind
    // 'options', value 'GrannyKnot') plus the scale/extrusionSegments/
    // radiusSegments sliders and the closed checkbox; the Camera folder
    // holds the three booleans — 8 controllers over 2 folders. `changes`
    // is exactly 3 because only the module's three chained `.step()`
    // calls (scale .step(2), extrusionSegments .step(50), radiusSegments
    // .step(1)) setValue during construction.
    Map<String, dynamic> guiSnapshot() =>
        harness.engine.exportedState!['gui'] as Map<String, dynamic>;

    final gui = guiSnapshot();
    expect(gui['native'], isTrue);
    expect(gui['roots'], 1);
    expect(gui['controllers'], 8);
    expect(gui['changes'], 3);
    final values = (gui['values'] as List).cast<Map<String, dynamic>>();
    expect(values, hasLength(8));
    final byProperty = {
      for (final value in values) value['property'] as String: value,
    };
    expect(byProperty.keys, containsAll('spline scale extrusionSegments '
        'radiusSegments closed animationView lookAhead cameraHelper'
        .split(' ')));
    expect(byProperty['spline']!['kind'], 'options');
    expect(byProperty['spline']!['folder'], 'Geometry');
    expect(byProperty['spline']!['value'], 'GrannyKnot');
    expect(byProperty['spline']!['action'], 'three.gui.1');
    for (final property
        in 'scale extrusionSegments radiusSegments'.split(' ')) {
      expect(byProperty[property]!['kind'], 'number', reason: property);
      expect(byProperty[property]!['folder'], 'Geometry', reason: property);
    }
    expect(byProperty['scale']!['value'], 4);
    expect(byProperty['extrusionSegments']!['value'], 100);
    expect(byProperty['radiusSegments']!['value'], 3);
    for (final property
        in 'closed animationView lookAhead cameraHelper'.split(' ')) {
      expect(byProperty[property]!['kind'], 'boolean', reason: property);
    }
    expect(byProperty['animationView']!['folder'], 'Camera');

    // No error card ever: every render tree is the mount envelope or a
    // GUI overlay re-render, and the latest overlay carries the rendered
    // dropdown row plus the checkbox rows (host dropdown nodes with
    // onChanged action ids).
    final treeTypes = harness.renderTrees
        .map((tree) => tree['type'] as String)
        .toList();
    expect(treeTypes.first, 'three');
    expect(treeTypes, everyElement(anyOf('three', 'stack')));
    expect(treeTypes.where((type) => type == 'stack').length,
        greaterThanOrEqualTo(8));
    final treesText = harness.renderTrees.toString();
    expect(treesText.contains('lil-gui'), isFalse);
    final overlay = harness.renderTrees.last.toString();
    expect(overlay, contains('dropdown'));
    expect(overlay, contains('GrannyKnot'));
    expect(overlay, contains('cameraHelper'));

    // Interactive dropdown event through the bounded facade: routing
    // {value: 'TorusKnot'} to the spline controller's action id restores
    // the typed member, setValue → onChange → addTube() rebuilds the tube
    // from the TorusKnot curve (fresh geometry upload), and the draw plan
    // stays 2 draws / 600 triangles (identical tubular/radial segment
    // counts) with no warnings.
    await harness.backend
        .callEvent(byProperty['spline']!['action'] as String, {
      'value': 'TorusKnot',
    });
    await harness.pumpFrames(tester, 5);

    final guiAfter = guiSnapshot();
    expect(guiAfter['controllers'], 8);
    expect(guiAfter['changes'], 4);
    expect(guiAfter['finishes'], 1);
    final valuesAfter =
        (guiAfter['values'] as List).cast<Map<String, dynamic>>();
    expect(valuesAfter.first['property'], 'spline');
    expect(valuesAfter.first['value'], 'TorusKnot');
    expect(state.geometryUploadCount, greaterThan(uploadsAfterBoot));

    final rebuilt = const ThreeDrawPlanner().plan(harness.state!);
    expect(rebuilt.draws, hasLength(2));
    expect(rebuilt.triangleCount, 600);
    expect(rebuilt.diagnostics.warnings, isEmpty);
    expect(
      harness.renderTrees.last.toString(),
      contains('TorusKnot'),
      reason: 'the overlay re-renders with the new dropdown selection',
    );

    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 120)));

  testWidgets(
      'webgl_lights_physical renders with Reinhard tone mapping and the v6 '
      'bump/roughness/metalness map slots attached', (tester) async {
    // The official module sets `renderer.toneMapping = THREE
    // .ReinhardToneMapping` (init) and re-asserts `toneMappingExposure =
    // Math.pow(params.exposure, 5.0)` on every animate() tick.
    //
    // Wave-3 made tone mapping REAL on R1: the v4 frame carries the mode +
    // toneMappingExposure and shaders/three_r1.frag implements the three.js
    // r186 tonemapping_pars_fragment math for Linear/Reinhard/Cineon/
    // ACES/AgX/Neutral. The module also sets map.anisotropy = 4 and
    // repeat.set(10, 24) on its floor texture — both now supported
    // (anisotropy clamps to the native sampler maximum of exactly 1 like
    // upstream; repeat composes the R1 v4 map UV transform).
    //
    // Wave-4 (R1 v6) closed the extra material texture family:
    // bumpMap/roughnessMap/metalnessMap bind through the new material
    // slots, so the stock module sustains rendering with all 7 embedded
    // JPEGs attached.
    //
    // Part 1 — the stock widget: GUI fully mounted, Reinhard frames
    // submitted, v6 map slots bound on the standard-material floor.
    // Part 2 — stock probe with only a deterministic tick-counted tone
    // flip injected: the module's OWN ReinhardToneMapping, the exposure
    // GUI controller live-switched through callEvent, and a renderer
    // .toneMapping flip Reinhard -> ACES -> Neutral observed in the plan.

    // Part 1 — the unmodified widget.
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-lights-physical',
      instanceId: 'three-lights-physical-test',
    );
    // Wave-4 (R1 v6) closed the remaining map-slot gap: the stock module
    // now sustains rendering with bump/roughness/metalness maps attached.
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.submittedFrameCount >= 2 &&
          plan.draws.isNotEmpty &&
          state.textureUploadCount >= 7,
      attempts: 400,
    );
    final plan = harness.plan!;
    expect(plan.draws, isNotEmpty);
    // The standard-material floor binds the v6 roughness/metalness/bump
    // slots (no materialTexture error card anymore).
    expect(
      plan.draws.any(
        (draw) =>
            draw.material.bumpMapTextureId > 0 ||
            draw.material.roughnessMapTextureId > 0 ||
            draw.material.metalnessMapTextureId > 0,
      ),
      isTrue,
      reason: 'v6 bump/roughness/metalness slots must bind on the stock '
          'lights_physical floor material',
    );
    final exported = harness.engine.exportedState!;
    expect(exported['example'], 'webgl_lights_physical');
    expect(exported['backend'], 'flutterGpu');
    expect(exported['canvasCount'], 1);
    expect(exported['mounted'], isTrue);
    final assets = exported['assets'] as Map<String, dynamic>;
    expect(assets.length, 7);
    for (final asset in assets.values) {
      expect((asset as Map<String, dynamic>)['registered'], isTrue);
    }

    // The native GUI panel mounts completely: the two luminous-power
    // dropdowns, the exposure slider (0.68) and the shadows checkbox.
    final gui = exported['gui'] as Map<String, dynamic>;
    expect(gui['native'], isTrue);
    expect(gui['roots'], 1);
    expect(gui['controllers'], 4);
    final values = (gui['values'] as List).cast<Map<String, dynamic>>();
    final byProperty = {
      for (final value in values) value['property'] as String: value,
    };
    expect(byProperty.keys,
        containsAll('hemiIrradiance bulbPower exposure shadows'.split(' ')));
    expect(byProperty['exposure']!['kind'], 'number');
    expect(byProperty['exposure']!['value'], 0.68);

    await harness.dispose(tester);

    // Part 2 — stock probe: the module's own tone mapping + exposure kept
    // INTACT, plus a deterministic tick-counted tone mode flip injected
    // into animate().
    var source = File(
      'example/widgets/three-lights-physical/widget.js',
    ).readAsStringSync();
    // Wave-4: the map slots are supported, so no inert-ing is needed —
    // the probe only injects the deterministic tone-mode flip.
    source = source.replaceAll(
      'function pi(){T.toneMappingExposure=Math.pow(F.exposure,5)',
      'function pi(){globalThis.__jsrTickCount=(globalThis.__jsrTickCount'
      '||0)+1,T.toneMapping=globalThis.__jsrTickCount<15?2:'
      '(globalThis.__jsrTickCount<30?4:7),T.toneMappingExposure='
      'Math.pow(F.exposure,5)',
    );
    expect(source.contains('function pi(){globalThis.__jsrTickCount'), isTrue,
        reason: 'the tone mode flip anchor must apply');

    final probe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: source,
      instanceId: 'three-lights-physical-tone-lane-probe',
    );
    // Sustained rendering with the module's Reinhard mode (ticks < 15).
    final reinhardPlan = await probe.pumpUntil(
      tester,
      (state, candidate) =>
          state.geometryUploadCount > 0 &&
          candidate.draws.isNotEmpty &&
          candidate.frame?.toneMapping == JsThreeToneMapping.reinhard,
    );
    expect(reinhardPlan, isNotNull);
    expect(probe.plan!.diagnostics.warnings, isEmpty);
    // Same scene as the pre-wave-3 'R1-legal' pin: bulb + floor + ball +
    // 3 brick boxes, 2246 triangles, the PointLight/HemisphereLight rig.
    expect(probe.plan!.draws.length, greaterThanOrEqualTo(4));
    expect(probe.plan!.draws.length, lessThanOrEqualTo(6));
    expect(probe.plan!.triangleCount, 2246);
    expect(probe.plan!.pointLights, hasLength(1));
    expect(probe.plan!.hemisphereLights, hasLength(1));

    // GUI live-switch through the bounded facade: routing a new value to
    // the exposure controller re-renders with toneMappingExposure updated.
    final guiValues = ((probe.engine.exportedState!['gui']
        as Map<String, dynamic>)['values'] as List)
        .cast<Map<String, dynamic>>();
    final exposureController = guiValues.firstWhere(
      (value) => value['property'] == 'exposure',
    );
    await probe.backend.callEvent(
      exposureController['action'] as String,
      {'value': 0.2},
    );
    final exposurePlan = await probe.pumpUntil(
      tester,
      (state, candidate) =>
          candidate.frame != null &&
          candidate.frame!.exposure < 0.001,
    );
    expect(exposurePlan!.frame!.exposure, closeTo(math.pow(0.2, 5), 1e-6));

    // The deterministic mode flip lands in the frame plan: ACES after 15
    // ticks, Neutral after 30.
    final acesPlan = await probe.pumpUntil(
      tester,
      (state, candidate) =>
          candidate.frame?.toneMapping == JsThreeToneMapping.acesFilmic,
    );
    expect(acesPlan!.frame!.toneMapping, JsThreeToneMapping.acesFilmic);
    final neutralPlan = await probe.pumpUntil(
      tester,
      (state, candidate) =>
          candidate.frame?.toneMapping == JsThreeToneMapping.neutral,
    );
    expect(neutralPlan!.frame!.toneMapping, JsThreeToneMapping.neutral);
    await probe.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 300)));
}
