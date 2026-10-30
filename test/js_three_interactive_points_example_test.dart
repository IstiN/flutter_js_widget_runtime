import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/three_gap_documentation.dart';
import 'support/widget_logic_helper.dart';

/// webgl_interactive_points — DOCUMENTED FACADE GAP (not a widget bug).
///
/// The official module renders its point cloud with a `THREE.ShaderMaterial`
/// (custom `vertexshader`/`fragmentshader` scripts driving per-point `size`
/// and `customColor` attributes plus the disc.png point sprite). The shared
/// R1 native renderer does not support ShaderMaterial by design:
///
/// - tool/three/src/native_renderer.js:185 — `materialKind()` supports only
///   Basic/Lambert/Standard/Line/Points/Phong/Normal and throws
///   `ThreeCapabilityError: three.unsupported: material (ShaderMaterial);
///   native R1 does not provide this capability; use the 1B backend where
///   available` for anything else (ShaderMaterial included).
/// - tool/three/src/native_renderer.js:193 — `validateMaterial()` has the
///   explicit `unsupported('ShaderMaterial', ...)` guard (line 185 fires
///   first, via `_ensureMaterial` at native_renderer.js:550).
/// - tool/three/src/native_renderer.js:230 — capabilities declare
///   `shaderMaterial: false`.
///
/// The throw happens inside the `setAnimationLoop` callback. Historically
/// `lib/src/runtime/js_widget_engine_quickjs.dart` (`_handleRafTick`)
/// called `rt.eval(...)` without an `errMsg` sink, so the per-frame JS
/// exception was swallowed silently (quickjs_runtime `eval` returns null on
/// error instead of throwing) and the widget rendered a healthy-looking
/// black canvas forever. That engine gap is FIXED: RAF/timer/promise
/// callback exceptions now render the standard error card, which part 1
/// below asserts. What remains unsupported is ShaderMaterial itself.
///
/// This test pins that exact behaviour: healthy boot exports, RAF loop
/// running, disc.png asset resolving, the loud per-frame error card, and
/// the precise capability error text. If R1 ever gains ShaderMaterial
/// support, this test should be rewritten as a normal draw-plan test.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test('interactive points example', () {},
        skip: 'QuickJS native library is not available');
    return;
  }

  testWidgets('webgl_interactive_points boots but cannot render on R1 '
      '(ShaderMaterial facade gap)', (tester) async {
    // Part 1 — the unmodified widget: healthy boot, zero R1 submits.
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-interactive-points',
      instanceId: 'three-interactive-points-test',
    );
    await harness.pumpFrames(tester, 120);

    final exported = harness.engine.exportedState!;
    expect(exported['example'], 'webgl_interactive_points');
    expect(exported['backend'], 'flutterGpu');
    expect(exported['canvasCount'], 1);
    expect(exported['mounted'], isTrue);
    // The disc.png sprite asset is registered by the prepared widget.
    expect(
      (exported['discSprite'] as Map<String, dynamic>)['registered'],
      isTrue,
    );
    // No R1 envelope ever reached the host: no surface, no state, and the
    // module-visible renderer/stats counters never advance past init
    // (render() throws before info.render.frame++ and before
    // stats.update(), both at the tail of each animation tick).
    expectShaderMaterialGapBoot(harness, 'webgl_interactive_points');
    await harness.dispose(tester);

    // Part 2 — instrumented copy of the same widget.js proving the exact
    // per-frame failure: animate() runs on every RAF tick and every
    // renderer.render() throws the ShaderMaterial capability error.
    var source = File(
      'example/widgets/three-interactive-points/widget.js',
    ).readAsStringSync();
    source = source
        .replaceAll(
          'function tt(){rt(),le.update()}',
          'function tt(){console.log("JSR_ANIM");rt(),le.update()}',
        )
        .replaceAll(
          'v.render(_e,N)}})();',
          '(function(){try{return v.render(_e,N)}catch(e){console.error('
          '"JSR_RENDERFAIL code="+e.code+" feature="+e.feature'
          '+" msg="+e.message)}})()}})();'
          'console.log("JSR_GLOBALS createImageBitmap="'
          '+(typeof createImageBitmap));'
          'new THREE.TextureLoader().load("textures/sprites/disc.png",'
          'function(){console.log("JSR_TEX onLoad")},undefined,'
          'function(e){console.error("JSR_TEX onError")});',
        );
    final probe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: source,
      instanceId: 'three-interactive-points-gap-probe',
    );
    await probe.pumpFrames(tester, 20);
    final backend = probe.backend as QuickjsWidgetEngineBackend;
    final logs = backend.peekLogs().map((entry) => entry['msg'] as String);

    // The animation loop ticks — this is NOT a stalled setAnimationLoop,
    // a missing pointer event, or a hung import.
    expect(logs.any((msg) => msg.contains('JSR_ANIM')), isTrue);
    // The disc.png texture pipeline resolves (registered asset path); the
    // PNG base64/decode branch is NOT the cause either.
    expect(logs.any((msg) => msg.contains('JSR_TEX onLoad')), isTrue);
    expect(logs.any((msg) => msg.contains('JSR_TEX onError')), isFalse);

    expectRenderFailLog(logs);
    await probe.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
