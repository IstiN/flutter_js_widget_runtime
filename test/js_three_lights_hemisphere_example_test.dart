import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/three_gap_documentation.dart';
import 'support/three_patch_once.dart' as patch_support;
import 'support/widget_logic_helper.dart';

/// webgl_lights_hemisphere — DOCUMENTED FACADE GAP (not a widget bug).
///
/// The official module paints its sky dome with a `THREE.ShaderMaterial`
/// (inline `vertexShader`/`fragmentShader` scripts fetched via
/// `document.getElementById`, uniforms `topColor`/`bottomColor`/`offset`/
/// `exponent`, `side: BackSide`). The shared R1 native renderer does not
/// support ShaderMaterial by design:
///
/// - tool/three/src/native_renderer.js:185 — `materialKind()` knows only
///   Basic/Lambert/Standard/Line/Points/Phong/Normal(/Shadow on newer
///   builds) and throws `ThreeCapabilityError: three.unsupported: material
///   (ShaderMaterial); native R1 does not provide this capability; use the
///   1B backend where available` for anything else (ShaderMaterial
///   included; this fires before the explicit ShaderMaterial guard at
///   native_renderer.js:194, via `_ensureMaterial` at :550).
/// - tool/three/src/native_renderer.js:230 — capabilities declare
///   `shaderMaterial: false`.
///
/// The sky dome is added in `init()`, so the FIRST `renderer.render()` of
/// the first animation tick throws, rolls back the whole frame transaction
/// and nothing is ever uploaded: no surface state, zero submitted frames,
/// and the hemisphere/dir lights never become observable in a draw plan.
/// The Flamingo.glb side of the earlier probe suspicion is cleared by part
/// 2 below: the model is morph-target animated (14 weight targets, one
/// `weights` animation channel — NO skeleton/skin in the GLB), its asset
/// resolves and its `GLTFLoader.load` callback runs; the mesh joins the
/// scene just fine. Only the skydome's ShaderMaterial blocks R1 — the same
/// documented 1B-only class as webgl_interactive_points.
///
/// Because the throw happens inside the `setAnimationLoop` callback, the
/// pre-fix engine swallowed it silently (healthy-looking black canvas).
/// With lib/src/runtime/js_widget_engine_quickjs.dart `_reportAsyncError`
/// the per-frame failure now renders the standard error card, which part 1
/// asserts. If R1 ever gains ShaderMaterial support, rewrite this test as
/// a normal draw-plan test (hemisphere light sky=(0.2,0.68,1.0) ground=
/// (1.0,0.785,0.5) intensity 2, one intensity-3 directional light with a
/// 2048 shadow map, >=3 triangle draws incl. the 542-index flamingo).
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'hemisphere lights example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets(
      'webgl_lights_hemisphere boots but cannot render on R1 '
      '(ShaderMaterial skydome facade gap)', (tester) async {
    // Part 1 — the unmodified widget: healthy boot, zero R1 submits.
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-lights-hemisphere',
      instanceId: 'three-lights-hemisphere-test',
    );
    // Patient pumping: the 77 KB Flamingo.glb decodes asynchronously
    // inside QuickJS and the GLB load callback (part 2) needs real wall
    // clock between the fake-clock pumps.
    await harness.pumpFrames(tester, 240);

    final exported = harness.engine.exportedState!;
    expect(exported['example'], 'webgl_lights_hemisphere');
    expect(exported['backend'], 'flutterGpu');
    expect(exported['canvasCount'], 1);
    expect(exported['mounted'], isTrue);
    // The Flamingo.glb model asset is registered by the prepared widget.
    expect((exported['flamingo'] as Map<String, dynamic>)['registered'],
        isTrue);
    // init() ran to completion: the lil-gui panel holds all 3 controllers.
    expect((exported['gui'] as Map<String, dynamic>)['controllers'], 3);
    // No R1 envelope ever reached the host: every animation tick's
    // ShaderMaterial failure renders the standard error card.
    expectShaderMaterialGapBoot(harness, 'webgl_lights_hemisphere');
    await harness.dispose(tester);

    // Part 2 — instrumented copy of the same widget.js proving the exact
    // per-frame failure AND clearing the GLB: animate() ticks, the
    // Flamingo.glb load callback runs (morph-animated, not skinned), and
    // every renderer.render() throws the ShaderMaterial capability error.
    var source = File(
      'example/widgets/three-lights-hemisphere/widget.js',
    ).readAsStringSync();
    // Shared structural patch anchor (test/support/three_patch_once.dart).
    String patchOnce(String label, RegExp re, String Function(Match) build) =>
        patch_support.patchOnce(source, label, re, build);

    // animate(): tick marker.
    source = patchOnce(
      'animate',
      RegExp(r'function (\w+)\(\)\{(\w+)\.update\(\),(\w+)\(\),(\w+)\.update\(\)\}'),
      (m) => 'function ${m[1]}(){console.log("JSR_ANIM"),${m[2]}.update(),'
          '${m[3]}(),${m[4]}.update()}',
    );
    // Tail render(): capability-failure marker.
    source = patchOnce(
      'render',
      RegExp(r'(\w+)\.render\((\w+),(\w+)\)\}\}\)\(\);\n'),
      (m) => '(function(){try{return ${m[1]}.render(${m[2]},${m[3]})}catch(e)'
          '{console.error("JSR_RENDERFAIL code="+e.code+" feature="+e.feature'
          '+" msg="+e.message)}})()}})();',
    );
    // Flamingo GLB onLoad: morph/skinned facts.
    source = patchOnce(
      'flamingo',
      RegExp(r'\.load\("models/gltf/Flamingo\.glb",function\((\w+)\)\{let (\w+)=\1\.scene\.children\[0\]'),
      (m) => '.load("models/gltf/Flamingo.glb",function(${m[1]}){'
          'console.log("JSR_GLB onLoad anims="+${m[1]}.animations.length+'
          '" morphTargets="+(${m[1]}.scene.children[0].morphTargetDictionary?'
          'Object.keys(${m[1]}.scene.children[0].morphTargetDictionary).length:0)+'
          '" skinned="+(${m[1]}.scene.children[0].isSkinnedMesh===true));'
          'let ${m[2]}=${m[1]}.scene.children[0]',
    );
    final probe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: source,
      instanceId: 'three-lights-hemisphere-gap-probe',
    );
    await probe.pumpFrames(tester, 60);
    final backend = probe.backend as QuickjsWidgetEngineBackend;
    final logs = backend.peekLogs().map((entry) => entry['msg'] as String);

    // The animation loop ticks — this is NOT a stalled setAnimationLoop or
    // a hung GLB import.
    expect(logs.any((msg) => msg.contains('JSR_ANIM')), isTrue);
    // The Flamingo.glb pipeline resolves: the load callback runs, the mesh
    // is morph-target animated (14 targets) and NOT skinned — skin decode
    // rejection is NOT the blocker.
    final glb = logs.firstWhere(
      (msg) => msg.contains('JSR_GLB onLoad'),
      orElse: () => '',
    );
    expect(glb, isNotEmpty);
    expect(glb, contains('anims=1'));
    expect(glb, contains('morphTargets=14'));
    expect(glb, contains('skinned=false'));

    expectRenderFailLog(logs);
    await probe.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
