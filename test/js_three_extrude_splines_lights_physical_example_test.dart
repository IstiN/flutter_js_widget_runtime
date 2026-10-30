import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';
import 'support/three_gap_documentation.dart';

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
      'webgl_lights_physical boots but cannot render on R1 '
      '(toneMapping gap; GUI panel mounts fully)', (tester) async {
    // The official module sets `renderer.toneMapping = THREE
    // .ReinhardToneMapping` (init) and re-asserts `toneMappingExposure` on
    // every animate() tick. R1 requires NoToneMapping:
    //
    // - tool/three/src/native_renderer.js:1063 — `if (this.toneMapping !==
    //   NoToneMapping) unsupported('toneMapping', 'native R1 requires
    //   NoToneMapping')` inside _render(), before any scene traversal.
    // - tool/three/src/errors.js:6 — the error text is
    //   `three.unsupported: toneMapping (native R1 requires NoToneMapping);
    //   native R1 does not provide this capability; use the 1B backend
    //   where available` (ThreeCapabilityError, code three.unsupported,
    //   feature toneMapping).
    //
    // After the facade unlocks the lil-gui panel mounts FULLY (all 4
    // controllers, dropdown rows rendered) and init() completes — the only
    // remaining blockers are render-side:
    // 1. toneMapping (above) — fires on the very first tick, so the
    //    unmodified widget never submits a frame.
    // 2. texture features — the module's maps carry anisotropy=4 and
    //    repeat.set(10,24) (textureState/textureTransform) and the
    //    floor/cube/ball materials take bumpMap/roughnessMap/metalnessMap
    //    from asynchronously decoded JPEGs; R1 supports only plain `map`
    //    textures (tool/three/src/native_renderer.js:200-201, :509-510),
    //    so with toneMapping neutralized the scene renders only until
    //    those callbacks attach (part 3 pins both halves).
    //
    // The R1-legal half of the module (PointLight + HemisphereLight,
    // MeshStandardMaterial meshes without the extra map slots) IS clean —
    // part 3 proves it by forcing NoToneMapping and snapshotting the draw
    // plan before the texture callbacks land.

    // Part 1 — the unmodified widget: healthy boot, GUI fully mounted,
    // zero R1 submits.
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-lights-physical',
      instanceId: 'three-lights-physical-test',
    );
    // Patient pumping: the 7 embedded JPEG textures decode asynchronously
    // inside QuickJS; give init() and the first RAF ticks real wall clock.
    await harness.pumpFrames(tester, 120);

    final exported = harness.engine.exportedState!;
    expect(exported['example'], 'webgl_lights_physical');
    expect(exported['backend'], 'flutterGpu');
    expect(exported['canvasCount'], 1);
    expect(exported['mounted'], isTrue);
    // The prepared widget registers all 7 module textures
    // (hardwood2 diffuse/bump/roughness, brick diffuse/bump, earth
    // atmos + specular 2048).
    final assets = exported['assets'] as Map<String, dynamic>;
    expect(assets.length, 7);
    for (final asset in assets.values) {
      expect((asset as Map<String, dynamic>)['registered'], isTrue);
    }
    // The native GUI panel mounts completely: the two luminous-power
    // dropdowns (kind 'options'), the exposure slider (kind 'number',
    // value 0.68) and the shadows checkbox (kind 'boolean') — 4
    // controllers with their module default presets.
    final gui = exported['gui'] as Map<String, dynamic>;
    expect(gui['native'], isTrue);
    expect(gui['roots'], 1);
    expect(gui['controllers'], 4);
    final values = (gui['values'] as List).cast<Map<String, dynamic>>();
    expect(values, hasLength(4));
    final byProperty = {
      for (final value in values) value['property'] as String: value,
    };
    expect(byProperty.keys, containsAll('hemiIrradiance bulbPower exposure '
        'shadows'.split(' ')));
    expect(byProperty['hemiIrradiance']!['kind'], 'options');
    expect(byProperty['hemiIrradiance']!['value'],
        '0.0001 lx (Moonless Night)');
    expect(byProperty['bulbPower']!['kind'], 'options');
    expect(byProperty['bulbPower']!['value'], '400 lm (40W)');
    expect(byProperty['exposure']!['kind'], 'number');
    expect(byProperty['exposure']!['value'], 0.68);
    expect(byProperty['shadows']!['kind'], 'boolean');
    expect(byProperty['shadows']!['value'], isTrue);

    // Render trees: the mount 'three' envelope, the GUI overlay
    // re-renders (dropdown/slider/checkbox rows — no lil-gui error card
    // anywhere), then one toneMapping error card per RAF tick.
    expect(harness.renderTrees.first['type'], 'three');
    expect(harness.renderTrees.first['canvasId'], 'main');
    final treeTypes = harness.renderTrees
        .map((tree) => tree['type'] as String)
        .toList();
    expect(treeTypes, contains('stack'));
    expect(treeTypes.indexOf('center'), greaterThan(treeTypes.lastIndexOf(
      'stack',
    )));
    final treesText = harness.renderTrees.toString();
    expect(treesText.contains('lil-gui'), isFalse);
    expect(treesText, contains('dropdown'));
    expect(
      harness.renderTrees.last.toString(),
      contains('toneMapping (native R1 requires NoToneMapping)'),
    );
    // No R1 envelope ever created surface state, and renderer/stats
    // counters stay frozen at 0 (render() throws before
    // info.render.frame++ and stats.update()).
    expect(harness.surface, isNull);
    expect((exported['renderer'] as Map<String, dynamic>)['frame'], 0);
    expect((exported['stats'] as Map<String, dynamic>)['updates'], 0);
    await harness.dispose(tester);

    // Part 2 — instrumented copy proving the exact per-frame failure:
    // animate() ticks on every RAF and every renderer.render() throws the
    // toneMapping capability error. (Anchors are minified names from the
    // current prepared bundle.)
    var source = File(
      'example/widgets/three-lights-physical/widget.js',
    ).readAsStringSync();
    source = source
        .replaceAll(
          'function ni(){T.toneMappingExposure=',
          'function ni(){console.log("JSR_ANIM");T.toneMappingExposure=',
        )
        .replaceAll(
          'T.render(G,\$),Ut.update()}',
          '(function(){try{return T.render(G,\$)}catch(e){console.error('
          '"JSR_RENDERFAIL code="+e.code+" feature="+e.feature'
          '+" msg="+e.message)}})(),Ut.update()}',
        );
    final probe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: source,
      instanceId: 'three-lights-physical-gap-probe',
    );
    await probe.pumpFrames(tester, 20);
    final logs = (probe.backend as QuickjsWidgetEngineBackend)
        .peekLogs()
        .map((entry) => entry['msg'] as String);

    // The animation loop ticks — this is NOT a stalled setAnimationLoop,
    // a hung texture import, or a missing pointer event.
    expect(logs.any((msg) => msg.contains('JSR_ANIM')), isTrue);
    final failure = expectRenderFailFeature(logs, 'toneMapping');
    expect(
      failure,
      contains('three.unsupported: toneMapping (native R1 requires '
          'NoToneMapping)'),
    );
    expect(failure, contains('use the 1B backend where available'));
    await probe.dispose(tester);

    // Part 3 — same widget with toneMapping forced to NoToneMapping
    // (minified anchors from the current prepared bundle:
    // `T.toneMapping=ce` -> `T.toneMapping=Fn`, Fn = NoToneMapping):
    // this exposes the SECOND R1 boundary. With toneMapping neutralized
    // the scene renders clean only until the 7 embedded JPEGs decode and
    // the async TextureLoader callbacks attach the module's bump/roughness/
    // metalness maps — then every render throws
    // `three.unsupported: materialTexture (MeshStandardMaterial.bumpMap)`
    // (tool/three/src/native_renderer.js:200-201: only `map` is an R1
    // material texture; alphaMap/aoMap/bumpMap/displacementMap/emissiveMap/
    // envMap/lightMap/metalnessMap/normalMap/roughnessMap/specularMap all
    // throw). Sustained rendering is 1B-only for this module. Whether the
    // first frames submit before the maps attach is a decode race, so the
    // two halves are pinned by two deterministic probes:
    // - Probe A renames the three unsupported map-slot assignments to
    //   inert properties (diffuse `map` stays) and neutralizes the two
    //   texture-state extras (anisotropy=4 → 1, repeat.set(10,24) →
    //   (1,1); native_renderer.js:509 textureState and :510
    //   textureTransform) and proves the sustained R1-clean render.
    // - Probe B only fixes toneMapping and waits for the texture boundary
    //   failure logs (textureState anisotropy + materialTexture bumpMap),
    //   whichever way the decode race goes.
    var patched = File(
      'example/widgets/three-lights-physical/widget.js',
    ).readAsStringSync();
    final renderInstrumented = patched
        .replaceAll(
          'T.render(G,\$),Ut.update()}',
          '(function(){try{return T.render(G,\$)}catch(e){console.error('
          '"JSR_RENDERFAIL code="+e.code+" feature="+e.feature'
          '+" msg="+e.message)}})(),Ut.update()}',
        );
    final toneOff = renderInstrumented.replaceAll(
      'T.toneMapping=ce,',
      'T.toneMapping=Fn,',
    );
    final r1Legal = toneOff
        .replaceAll('.bumpMap=h,', '.userDataBumpMap=h,')
        .replaceAll('.roughnessMap=h,', '.userDataRoughnessMap=h,')
        .replaceAll('.metalnessMap=h,', '.userDataMetalnessMap=h,')
        .replaceAll('.anisotropy=4,', '.anisotropy=1,')
        .replaceAll('.repeat.set(10,24),', '.repeat.set(1,1),');
    // Guard the minified anchors loudly instead of flaking on drift.
    expect(r1Legal.contains('.bumpMap=h,'), isFalse);
    expect(r1Legal.contains('.roughnessMap=h,'), isFalse);
    expect(r1Legal.contains('.metalnessMap=h,'), isFalse);
    expect(r1Legal.contains('.anisotropy=4,'), isFalse);
    expect(r1Legal.contains('.repeat.set(10,24),'), isFalse);
    expect(r1Legal.contains('.map=h,'), isTrue,
        reason: 'the supported diffuse map assignments must survive');

    // Probe A — sustained R1-clean render (no toneMapping, no unsupported
    // map slots): the full scene renders every frame with no failures.
    final patchedProbe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: r1Legal,
      instanceId: 'three-lights-physical-r1-legal-probe',
    );
    await patchedProbe.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount > 0 &&
          plan.draws.isNotEmpty &&
          state.submittedFrameCount >= 1,
    );
    // Let the (supported) diffuse textures land, then keep rendering.
    await patchedProbe.pumpFrames(tester, 20);
    expect(
      (patchedProbe.backend as QuickjsWidgetEngineBackend)
          .peekLogs()
          .map((entry) => entry['msg'] as String)
          .any((msg) => msg.contains('JSR_RENDERFAIL')),
      isFalse,
      reason: 'the R1-legal variant must render without any failure',
    );
    final plan = const ThreeDrawPlanner().plan(patchedProbe.state!);
    // bulb sphere + floor + ball + 3 brick boxes; auto-instancing may merge
    // the three boxes into one instanced draw (4..6 draw items).
    expect(plan.draws.length, greaterThanOrEqualTo(4));
    expect(plan.draws.length, lessThanOrEqualTo(6));
    // 224 (bulb sphere 16x8) + 2 (floor plane) + 1984 (ball sphere 32x32)
    // + 36 (3 boxes) triangles.
    expect(plan.triangleCount, 2246);

    // Light rig from init(): the 0xffee88 PointLight and the
    // 0xddeeff/0x0f0e0d HemisphereLight; no ambient, directional or spot.
    expect(plan.pointLights, hasLength(1));
    final bulb = plan.pointLights.single;
    expect(bulb.type.name, 'point');
    // animate() sets bulbLight.power = 400 lm ('400 lm (40W)' default);
    // three converts via intensity = power / (4 * PI).
    expect(bulb.intensity, closeTo(400 / (4 * 3.141592653589793), 0.01));
    expect(bulb.colorR, closeTo(1, 0.001));
    expect(bulb.colorG, greaterThan(bulb.colorB));

    expect(plan.hemisphereLights, hasLength(1));
    final hemi = plan.hemisphereLights.single;
    expect(hemi.type.name, 'hemisphere');
    // Default GUI preset '0.0001 lx (Moonless Night)'.
    expect(hemi.intensity, closeTo(0.0001, 0.0006));
    // Sky 0xddeeff is blue-dominant, ground 0x0f0e0d is near-black.
    expect(hemi.colorB, greaterThan(hemi.colorR));
    expect(hemi.groundColorR, lessThan(hemi.colorR));
    expect(hemi.groundColorG, lessThan(hemi.colorG));

    expect(plan.directionalLights, isEmpty);
    expect(plan.spotLights, isEmpty);
    expect(plan.ambient.r, 0);
    expect(plan.ambient.g, 0);
    expect(plan.ambient.b, 0);

    // bulbMat.emissiveIntensity = intensity / 0.02^2 (lumens -> irradiance
    // at the bulb surface) ~ 79577: the emissive sphere glows.
    final bulbMaterial = plan.draws
        .map((draw) => draw.material)
        .firstWhere((material) => material.emissiveIntensity > 1000);
    expect(bulbMaterial.emissiveIntensity, closeTo(79577.5, 2));

    // shadowMap.enabled is true and the bulb casts, but R1 only selects
    // directional/spot shadow lights (native_renderer.js:1103-1105), so
    // the point-light shadow is dropped and no shadow map rides the frame.
    expect(plan.frame!.hasShadow, isFalse);

    await patchedProbe.dispose(tester);

    // Probe B — toneMapping fixed but the module's own texture usage left
    // intact: as the embedded JPEGs decode, the floor's hardwood2_bump.jpg
    // attaches MeshStandardMaterial.bumpMap and every subsequent render
    // throws materialTexture (native_renderer.js:200-201) — validateMaterial
    // runs before texture validation, so this is the boundary the
    // unmodified module actually hits. Sustained rendering on R1 is
    // impossible for it.
    final toneOffProbe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: toneOff,
      instanceId: 'three-lights-physical-tone-off-probe',
    );
    for (var attempt = 0; attempt < 120; attempt++) {
      final sawFailure = (toneOffProbe.backend as QuickjsWidgetEngineBackend)
          .peekLogs()
          .any((entry) => (entry['msg'] as String).contains(
                'feature=materialTexture',
              ));
      if (sawFailure) break;
      await toneOffProbe.pumpFrame(tester);
    }
    final toneOffLogs = (toneOffProbe.backend as QuickjsWidgetEngineBackend)
        .peekLogs()
        .map((entry) => entry['msg'] as String);
    final materialFailure = toneOffLogs.firstWhere(
      (msg) => msg.contains('JSR_RENDERFAIL') &&
          msg.contains('feature=materialTexture'),
      orElse: () => '',
    );
    expect(materialFailure, isNotEmpty);
    expect(materialFailure, contains('code=three.unsupported'));
    expect(materialFailure, contains('MeshStandardMaterial.bumpMap'));
    expect(
      materialFailure,
      contains('native R1 does not provide this capability'),
    );

    await toneOffProbe.dispose(tester);

    // Probe C — same as probe A but keeping the module's anisotropy=4:
    // with the map slots inert the diffuse textures are the first thing
    // validated, and their anisotropy throws textureState
    // (native_renderer.js:509). This is why probe A must neutralize
    // anisotropy, pinned here so the neutralization is evidence-backed.
    final anisotropyProbe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: toneOff
          .replaceAll('.bumpMap=h,', '.userDataBumpMap=h,')
          .replaceAll('.roughnessMap=h,', '.userDataRoughnessMap=h,')
          .replaceAll('.metalnessMap=h,', '.userDataMetalnessMap=h,'),
      instanceId: 'three-lights-physical-anisotropy-probe',
    );
    for (var attempt = 0; attempt < 120; attempt++) {
      final sawFailure = (anisotropyProbe.backend as QuickjsWidgetEngineBackend)
          .peekLogs()
          .any((entry) => (entry['msg'] as String).contains(
                'feature=textureState',
              ));
      if (sawFailure) break;
      await anisotropyProbe.pumpFrame(tester);
    }
    final anisotropyLogs = (anisotropyProbe.backend as QuickjsWidgetEngineBackend)
        .peekLogs()
        .map((entry) => entry['msg'] as String);
    final textureStateFailure = anisotropyLogs.firstWhere(
      (msg) =>
          msg.contains('JSR_RENDERFAIL') &&
          msg.contains('feature=textureState'),
      orElse: () => '',
    );
    expect(textureStateFailure, isNotEmpty);
    expect(textureStateFailure, contains('anisotropy'));

    await anisotropyProbe.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 300)));
}
