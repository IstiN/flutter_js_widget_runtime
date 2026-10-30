import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart'
    show JsThreeShadowLightType;
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/three_gap_documentation.dart';
import 'support/three_patch_once.dart' as patch_support;
import 'support/widget_logic_helper.dart';

/// webgl_shadowmap_pointlight — DOCUMENTED FACADE GAP (not a widget bug).
///
/// The official module builds two `PointLight(0x0088ff/0xff8888, 200, 20)`
/// units, each with `castShadow = true`, a 128px shadow map, and two child
/// spheres: a glowing `MeshBasicMaterial` ball and a
/// `MeshPhongMaterial({ side: DoubleSide, alphaMap: <CanvasTexture>,
/// alphaTest: 0.5 })` translucent shell; a 30x30x30 back-side Phong box
/// receives shadows. init() completes (the alpha CanvasTexture is a 2x2
/// runtime canvas — the facade maps `document.createElement('canvas')` to
/// the native Flutter canvas2d on the flutterGpu backend, no OffscreenCanvas
/// needed), the canvas mounts, and `setAnimationLoop` starts ticking. Then
/// the FIRST `renderer.render()` throws and the frame transaction rolls
/// back — every tick, forever:
///
/// - tool/three/src/native_renderer.js:200 — `validateMaterial()`'s texture
///   slot list `['alphaMap', 'aoMap', 'bumpMap', ..., 'envMap', ...]`
/// - tool/three/src/native_renderer.js:201 — `for (const name of maps) if
///   (material[name]) unsupported('materialTexture',
///   `${material.type}.${name}`)` — the alpha-mapped Phong shell hits it as
///   `materialTexture (MeshPhongMaterial.alphaMap)`.
///
/// The throw happens inside the `setAnimationLoop` callback, so the
/// per-frame failure surfaces as the standard error card (part 1 asserts
/// the exact capability line) and `renderer.frame` stays 0 — the point
/// shadow machinery itself is never reached (the draw plan never uploads).
///
/// Part 2 instruments the same widget: animate() ticks, both point lights
/// carry castShadow + a 128 mapSize, and every render() fails with
/// `feature=materialTexture`, `MeshPhongMaterial.alphaMap` — the exact pin.
///
/// Part 3 strips ONLY `alphaMap` from the Phong shell (one minifier-proof
/// regex): the widget then renders the full official scene — 5 draws (4
/// spheres + the back-side box) over both point lights — proving the module
/// is otherwise R1-healthy. And the rendered plan reports
/// `shadowLightType = none` / `hasShadow = false` even though both lights
/// set `castShadow = true`: R1's shadow-light scan
/// (native_renderer.js:1103-1105) only accepts directional + spot lights,
/// so official point-light shadows are SILENTLY DROPPED, never errored.
/// That drop is a second, latent gap: while the alphaMap throw stands it is
/// unreachable, and it must be documented as render-with-gap whenever the
/// materialTexture slot ever ships (it cannot be probed green today).
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'shadowmap pointlight example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets(
      'webgl_shadowmap_pointlight boots but cannot render on R1 '
      '(Phong alphaMap materialTexture facade gap)', (tester) async {
    // Part 1 — the unmodified widget: healthy boot, zero R1 submits.
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-shadowmap-pointlight',
      instanceId: 'three-shadowmap-pointlight-test',
    );
    await harness.pumpFrames(tester, 120);

    final exported = harness.engine.exportedState!;
    expect(exported['example'], 'webgl_shadowmap_pointlight');
    expect(exported['backend'], 'flutterGpu');
    expect(exported['canvasCount'], 1);
    // init() ran to completion: the renderer canvas was appended.
    expect(exported['mounted'], isTrue);
    // The module registers no external assets — its alpha texture is a
    // runtime 2x2 canvas (document.createElement('canvas') → native
    // Flutter canvas2d).
    expect(exported['assets'] as Map<String, dynamic>, isEmpty);
    // No lil-gui in this official module.
    expect((exported['gui'] as Map<String, dynamic>)['roots'], 0);
    // No R1 envelope ever reached the host: every animation tick's
    // alphaMap failure renders the standard error card.
    expect(harness.renderTrees.first['type'], 'three');
    expect(harness.renderTrees.first['canvasId'], 'main');
    expect(
      harness.renderTrees.last.toString(),
      contains('Widget error: ThreeCapabilityError: three.unsupported: '
          'materialTexture (MeshPhongMaterial.alphaMap); native R1 does not '
          'provide this capability; use the 1B backend where available'),
    );
    expect(harness.surface, isNull);
    expect((exported['renderer'] as Map<String, dynamic>)['frame'], 0);
    expect((exported['stats'] as Map<String, dynamic>)['updates'], 0);
    await harness.dispose(tester);

    // Part 2 — instrumented copy of the same widget.js proving the exact
    // per-frame failure AND that the module is alive: animate() ticks, both
    // PointLights are created with castShadow + 128 shadow maps, and every
    // renderer.render() throws the materialTexture capability error.
    var source = File(
      'example/widgets/three-shadowmap-pointlight/widget.js',
    ).readAsStringSync();
    // Shared structural patch anchor (test/support/three_patch_once.dart).
    String patchOnce(String label, RegExp re, String Function(Match) build) =>
        patch_support.patchOnce(source, label, re, build);

    // animate(): tick marker (this module drives time via performance.now).
    source = patchOnce(
      'animate',
      RegExp(r'function ([A-Za-z_$][\w$]*)\(\)\{let ([A-Za-z_$][\w$]*)='
          r'([A-Za-z_$][\w$]*)\.now\(\)\*\.001;'),
      (m) => 'function ${m[1]}(){console.log("JSR_ANIM");let ${m[2]}='
          '${m[3]}.now()*.001;',
    );
    // PointLight construction inside createLight(): castShadow facts
    // (logged after shadow.mapSize.setScalar(128) so the map size is the
    // official one).
    source = patchOnce(
      'pointLight',
      RegExp(r'([A-Za-z_$][\w$]*)\.shadow\.mapSize\.setScalar\(128\),'),
      (m) => '${m[1]}.shadow.mapSize.setScalar(128),'
          'console.log("JSR_LIGHT isPointLight="+${m[1]}.isPointLight+'
          '" castShadow="+${m[1]}.castShadow+'
          '" shadowMapSize="+${m[1]}.shadow.mapSize.x),',
    );
    // Tail render() inside animate(): capability-failure marker.
    source = patchOnce(
      'render',
      RegExp(r'([A-Za-z_$][\w$]*)\.render\(([A-Za-z_$][\w$]*),'
          r'([A-Za-z_$][\w$]*)\),([A-Za-z_$][\w$]*)\.update\(\)\}'),
      (m) => '(function(){try{return ${m[1]}.render(${m[2]},${m[3]})}catch(e)'
          '{console.error("JSR_RENDERFAIL code="+e.code+" feature="+e.feature'
          '+" msg="+e.message)}})(),${m[4]}.update()}',
    );
    final probe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: source,
      instanceId: 'three-shadowmap-pointlight-gap-probe',
    );
    await probe.pumpFrames(tester, 60);
    final backend = probe.backend as QuickjsWidgetEngineBackend;
    final logs = backend.peekLogs().map((entry) => entry['msg'] as String);

    // The animation loop ticks — this is NOT a stalled setAnimationLoop.
    expect(logs.any((msg) => msg.contains('JSR_ANIM')), isTrue);
    // createLight() ran twice (blue + red units): each light is a real
    // PointLight with castShadow and a 128px shadow map.
    final lights = logs.where((msg) => msg.contains('JSR_LIGHT')).toList();
    expect(lights, hasLength(2));
    for (final light in lights) {
      expect(light, contains('isPointLight=true'));
      expect(light, contains('castShadow=true'));
      expect(light, contains('shadowMapSize=128'));
    }
    // The exact per-frame capability failure — the pinned root cause.
    final failure = expectRenderFailFeature(logs, 'materialTexture');
    expect(
      failure,
      contains('msg=three.unsupported: materialTexture '
          '(MeshPhongMaterial.alphaMap)'),
    );
    await probe.dispose(tester);

    // Part 3 — strip ONLY the alphaMap slot from the Phong shell (the
    // single pinned blocker): the module then renders the full scene,
    // which simultaneously proves (a) the widget is otherwise R1-healthy
    // and (b) that point-light shadows are SILENTLY DROPPED from the R1
    // draw plan (shadowLightType stays none) rather than errored.
    source = source.replaceAllMapped(
      RegExp(r'new ([A-Za-z_$][\w$]*)\(\{side:([A-Za-z_$][\w$]*),'
          r'alphaMap:([A-Za-z_$][\w$]*),alphaTest:\.5\}\)'),
      (m) => 'new ${m[1]}({side:${m[2]},alphaTest:.5})',
    );
    final healthy = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: source,
      instanceId: 'three-shadowmap-pointlight-alpha-stripped-probe',
    );
    await healthy.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount >= 5 &&
          plan.draws.length >= 5 &&
          state.submittedFrameCount >= 1,
    );
    healthy.expectHealthy('webgl_shadowmap_pointlight');
    final plan = healthy.plan!;
    // 4 spheres (glow ball + alpha shell per light unit) + the back-side
    // receiver box.
    expect(plan.draws, hasLength(5));
    // Both point lights reach the plan.
    expect(plan.pointLights, hasLength(2));
    // ...but NEITHER casts: R1's shadow-light scan accepts directional and
    // spot lights only (native_renderer.js:1103-1105) — the official
    // point-light shadows are dropped without any error.
    final frame = plan.frame!;
    expect(frame.shadowLightType, JsThreeShadowLightType.none.wireValue);
    expect(frame.hasShadow, isFalse);
    // Frames keep submitting while the loop animates the light positions.
    final submitted = healthy.state!.submittedFrameCount;
    await healthy.pumpFrames(tester, 6);
    expect(healthy.state!.submittedFrameCount, greaterThan(submitted));
    await healthy.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 240)));
}
