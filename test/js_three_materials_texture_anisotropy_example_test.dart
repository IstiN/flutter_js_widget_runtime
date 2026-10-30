import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// webgl_materials_texture_anisotropy — the official r186 anisotropic
/// filtering comparison on the native R1 pipeline.
///
/// The module builds two scissored scene halves, each a
/// `MeshPhongMaterial({map: TextureLoader().load('textures/crate.gif')})`
/// floor with `texture.repeat.set(512, 512)` — the left one wired to
/// `renderer.capabilities.getMaxAnisotropy()`, the right one pinned to 1.
///
/// Verdict — DOCUMENTED-GAP, pinned to the boot call: R1 declares no
/// `capabilities.getMaxAnisotropy` at all (the frozen capabilities object in
/// `tool/three/src/runtime.js:390-398` carries only backend/webgl2/r1/
/// shaderMaterial/webgpu/dom), so `init()` dies on the FIRST tick of the
/// official module with `TypeError: not a function` — before the renderer
/// canvas mounts, before the animation loop registers, before either scene
/// exists. The unmodified widget therefore exports `mounted: false`,
/// `renderer.frame: 0` and renders a single capability error card.
///
/// The probe (a copy instrumented only through the boot-time guards) proves
/// the failure stack is THREE layers deep, every layer pinned:
/// 1. `getMaxAnisotropy` is `undefined` on R1 (the recorded typeof);
/// 2. the module's `#val_left`/`#val_right` labels do not exist on the
///    facade (`tool/three_example/example_adapter.js:284` serves only
///    #container, #info and inline shader scripts) — guarded in the probe,
///    fatal in the official module;
/// 3. with both guarded, the crate.gif asset reaches the texture loader and
///    is rejected by the PNG/JPEG/raw gate
///    (`tool/three/src/native_loaders.js:76`, the wave-2 GIF-lane gap
///    shared with three-geometry-cube), and the frames that do render throw
///    `three.unsupported: textureTransform` because the official
///    `repeat.set(512, 512)` is a UV transform (`tool/three/src/
///    native_renderer.js:510`).
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'materials texture anisotropy example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_materials_texture_anisotropy renders both scenes '
      '(getMaxAnisotropy + facade overlay + PNG crate lane all work)',
      (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-texture-anisotropy',
      instanceId: 'three-materials-texture-anisotropy-test',
    );
    await harness.pumpFrames(tester, 20);

    // The facade DOM serves the #val_left/#val_right overlay spans now,
    // so init() completes and the stock module renders both scenes.
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.submittedFrameCount >= 1 &&
          plan.draws.isNotEmpty &&
          state.textureUploadCount >= 1,
      attempts: 400,
    );
    final exported = harness.engine.exportedState!;
    expect(exported['example'], 'webgl_materials_texture_anisotropy');
    expect(exported['backend'], 'flutterGpu');
    expect(exported['canvasCount'], 1);
    expect(exported['mounted'], isTrue);
    final assets = exported['assets'] as Map<String, dynamic>;
    final crate = assets['textures/crate.gif'] as Map<String, dynamic>;
    expect(crate['registered'], isTrue);
    // The pinned three.js crate.gif carries PNG bytes (see geometry_cube).
    expect(crate['bytes'], 119768);
    expect((exported['gui'] as Map<String, dynamic>)['controllers'], 0);
    expect(harness.surface, isNotNull);
    expect(harness.plan!.draws, isNotEmpty);
    expect(
      harness.renderTrees.any(
        (tree) => tree.toString().contains('Widget error'),
      ),
      isFalse,
    );

    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('anisotropy probe: getMaxAnisotropy reports the native clamp '
      '(1) on the live renderer', (tester) async {
    // Append-only probe (no minified anchors): read the capability off the
    // mounted canvas renderer after the stock module booted.
    final source = File(
      'example/widgets/three-materials-texture-anisotropy/widget.js',
    ).readAsStringSync() +
        ';(function(){var orig=jsr.exportState;jsr.exportState=function(s){'
        'try{var c=jsr.three.getCanvas("main");var r=c&&c.renderer;'
        'if(s&&typeof s==="object"&&r)s.probe={'
        'anisoType:typeof r.capabilities.getMaxAnisotropy,'
        'anisoValue:r.capabilities.getMaxAnisotropy()}}catch(e){}'
        'return orig.call(jsr,s)}})();';
    final probe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: source,
      instanceId: 'three-materials-anisotropy-capability-probe',
    );
    Map<String, dynamic>? report;
    for (var attempt = 0; attempt < 200 && report == null; attempt++) {
      await probe.pumpFrame(tester);
      final value = probe.engine.exportedState?['probe'];
      if (value is Map<String, dynamic>) report = value;
    }
    expect(report, isNotNull, reason: 'the append-only probe must export');
    // flutter_gpu has no anisotropic filtering, so the native sampler
    // maximum is exactly 1 — upstream clamps any request to this value.
    expect(report!['anisoType'], 'function');
    expect(report['anisoValue'], 1);
    expect(probe.state!.submittedFrameCount, greaterThanOrEqualTo(1));
    await probe.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}

