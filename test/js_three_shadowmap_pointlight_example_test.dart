
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart'
    show JsThreeShadowLightType;

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// webgl_shadowmap_pointlight — wave-3 REAL alphaMap lane.
///
/// The official module builds two `PointLight(0x0088ff/0xff8888, 200, 20)`
/// units, each with `castShadow = true`, a 128px shadow map, and two child
/// spheres: a glowing `MeshBasicMaterial` ball and a
/// `MeshPhongMaterial({ side: DoubleSide, alphaMap: <CanvasTexture>,
/// alphaTest: 0.5 })` translucent shell; a 30x30x30 back-side Phong box
/// receives shadows.
///
/// Wave-3 (R1 v4) made the alphaMap material texture slot REAL: the
/// protocol carries alphaMapTextureId + per-map UV matrices and
/// shaders/three_r1.frag multiplies texel alpha into the material alpha
/// (alphaTest discard included). The module renders stock on the
/// flutterGpu backend.
///
/// Still silently dropped (documented render-with-gap): R1's shadow-light
/// scan accepts directional + spot lights only, so the official
/// point-light shadows never reach the frame (shadowLightType none,
/// hasShadow false, no error raised).
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
      'webgl_shadowmap_pointlight renders the alphaMap shells on R1 v4 '
      '(point-light shadows still silently dropped)', (tester) async {
    // Wave-3 added the alphaMap material texture slot (R1 v4 protocol +
    // shader alpha multiply): the official Phong
    // `{ side: DoubleSide, alphaMap: <CanvasTexture>, alphaTest: 0.5 }`
    // translucent shells now render stock. The module's alpha texture is a
    // runtime 2x2 canvas (document.createElement('canvas') → native
    // canvas2d), so no external assets register.
    //
    // Remaining documented gap (latent, unchanged): R1's shadow-light scan
    // (native_renderer.js shadow light collection) accepts directional +
    // spot lights only — both official PointLight.castShadow units are
    // SILENTLY DROPPED (shadowLightType stays none, hasShadow false),
    // never errored.
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-shadowmap-pointlight',
      instanceId: 'three-shadowmap-pointlight-test',
    );
    final plan = await harness.pumpUntil(
      tester,
      (state, candidate) =>
          state.geometryUploadCount >= 5 &&
          candidate.draws.length >= 5 &&
          state.submittedFrameCount >= 1,
    );
    final exported = harness.engine.exportedState!;
    expect(exported['example'], 'webgl_shadowmap_pointlight');
    expect(exported['backend'], 'flutterGpu');
    expect(exported['canvasCount'], 1);
    expect(exported['mounted'], isTrue);
    expect(exported['assets'] as Map<String, dynamic>, isEmpty);
    expect((exported['gui'] as Map<String, dynamic>)['roots'], 0);
    harness.expectHealthy('webgl_shadowmap_pointlight');
    expect(plan, isNotNull);
    // The renderer canvas carries the submitted frames (no error cards).
    expect(harness.renderTrees.first['type'], 'three');
    expect(harness.renderTrees.last['type'], 'three');
    expect(harness.surface, isNotNull);

    // 4 spheres (glow ball + alpha shell per light unit) + the back-side
    // receiver box.
    expect(plan!.draws, hasLength(5));
    // Both point lights reach the plan.
    expect(plan.pointLights, hasLength(2));
    // The alpha shells: exactly one draw per unit multiplies a real
    // uploaded alphaMap texture through the v4 alpha slot.
    final alphaShells = plan.draws
        .where((draw) => draw.material.hasAlphaMap)
        .toList();
    expect(alphaShells, hasLength(2));
    for (final shell in alphaShells) {
      expect(shell.material.alphaMapTextureId, greaterThan(0));
      // The alpha CanvasTexture uses no repeat/offset: identity mat3.
      expect(shell.material.alphaMapUvMatrix, everyElement(isNotNull));
      expect(
        harness.state!.textures,
        contains(shell.material.alphaMapTextureId),
        reason: 'each light unit builds its own 2x2 alpha canvas; ids are '
            'upstream THREE ids (id 0 remaps to the 0xffffffff u32 tail per '
            'resourceId() in tool/three/src/r1.js)',
      );
    }
    expect(harness.state!.textures, hasLength(2));

    // R1 v5: the first point light casts — a dual-paraboloid point-shadow
    // lane (front z<=0 + back z>=0 faces, per-texel light-space distance;
    // documented approximation of upstream's six-face cube map).
    final frame = plan.frame!;
    expect(frame.shadowLightType, JsThreeShadowLightType.point.wireValue);
    expect(frame.hasShadow, isTrue);
    expect(frame.hasPointShadow, 1);
    expect(frame.pointShadowFar, greaterThan(0));
    // Frames keep submitting while the loop animates the light positions.
    final submitted = harness.state!.submittedFrameCount;
    await harness.pumpFrames(tester, 6);
    expect(harness.state!.submittedFrameCount, greaterThan(submitted));
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 240)));
}
