import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// webgl_materials_texture_partialupdate — DOCUMENTED FACADE GAP
/// (renderer.copyTextureToTexture), with the surrounding render path healthy.
///
/// The official module (official_module.js) loads the 512x512
/// FloorsCheckerboard_S_Diffuse.jpg as the plane's `map`, then every 0.1 s
/// (THREE.Timer window) refills a 32x32 DataTexture with a random color and
/// calls `renderer.copyTextureToTexture(dataTexture, diffuseMap, null,
/// position)` — a texSubImage2D partial update of the GPU texture.
///
/// The shared R1 native renderer has no `copyTextureToTexture` at all:
/// `grep -r copyTexture tool/three/src` is empty — `JsrWebGLRenderer`
/// (tool/three/src/native_renderer.js) exposes no such method and the
/// facade built by tool/three_example/prepare.mjs re-exports only
/// native_entry.js symbols. The call therefore throws a raw
/// `TypeError: not a function` inside the setAnimationLoop callback.
///
/// Unlike the ShaderMaterial gaps, this does NOT stop rendering: the throw
/// only happens on the Timer-window boundary tick (`elapsedTime - last >
/// 0.1`); every tick inside a window still calls `renderer.render()`, so
/// the textured plane submits frames continuously and only the partial
/// update itself is missing. The per-boundary exception surfaces through
/// the standard error card (`_reportAsyncError` → `jsr.showError`) instead
/// of being swallowed.
///
/// If R1 ever gains copyTextureToTexture (or a whole-texture re-upload
/// fallback — the task brief's expected alternative), this test should be
/// rewritten to assert per-window re-uploads of the diffuse map texture.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test('materials partialupdate example', () {},
        skip: 'QuickJS native library is not available');
    return;
  }

  testWidgets(
      'webgl_materials_texture_partialupdate renders the checkerboard plane '
      'but partial updates throw (copyTextureToTexture gap)', (tester) async {
    // Part 1 — the unmodified widget: healthy boot, one textured draw,
    // continuous frame submits, and the loud per-0.1s TypeError card.
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-partialupdate',
      instanceId: 'three-materials-partialupdate-test',
    );
    await harness.pumpFrames(tester, 40);

    final exported = harness.engine.exportedState!;
    expect(exported['example'], 'webgl_materials_texture_partialupdate');
    expect(exported['backend'], 'flutterGpu');
    expect(exported['canvasCount'], 1);
    expect(exported['mounted'], isTrue);

    // The pinned r186 checkerboard JPEG registers with its exact byte size.
    // The official adapter exports the assets map keyed by URL (no
    // per-asset diagnostic key in the official prepare definition).
    final assets = exported['assets'] as Map<String, dynamic>;
    expect(assets, hasLength(1));
    final diffuseMap =
        assets['textures/floors/FloorsCheckerboard_S_Diffuse.jpg']
            as Map<String, dynamic>;
    expect(diffuseMap['registered'], isTrue);
    expect(diffuseMap['bytes'], 119418);

    // Surface alive: the single PlaneGeometry(2,2) uploads, one
    // MeshBasicMaterial, and exactly one GPU texture — the 512x512
    // SRGB-encoded (JPEG bytes) checkerboard with mipmaps disabled
    // (generateMipmaps=false, minFilter=LinearFilter in the module).
    final state = harness.state!;
    expect(state.geometryUploadCount, 1);
    expect(state.materials, hasLength(1));
    expect(state.textures, hasLength(1));
    final texture = state.textures.values.single;
    expect(texture.width, 512);
    expect(texture.height, 512);
    expect(texture.isEncoded, isTrue);
    expect(texture.srgb, isTrue);
    expect(texture.mipmaps, isFalse);

    // One draw: the textured plane (2 triangles), map bound to the
    // checkerboard texture, no planner warnings.
    final plan = const ThreeDrawPlanner().plan(state);
    expect(plan.canRender, isTrue);
    expect(plan.diagnostics.warnings, isEmpty);
    expect(plan.draws, hasLength(1));
    final draw = plan.draws.single;
    expect(draw.drawCount, 6);
    expect(draw.material.mapTextureId, texture.textureId);

    // The 32x32 DataTexture never reaches R1: its only upload path is the
    // missing copyTextureToTexture, so the texture count stays at 1.

    // Frames submit on the ticks inside each 0.1 s Timer window — the gap
    // degrades, but does not stop, the render loop.
    expect(state.submittedFrameCount, greaterThan(20));

    // The three envelope arrives first; the boundary-tick TypeErrors later
    // surface as the standard error card, not a silent stall.
    expect(harness.renderTrees.first['type'], 'three');
    expect(harness.renderTrees.first['canvasId'], 'main');
    expect(
      harness.renderTrees
          .any((tree) => tree.toString().contains(
                'Widget error: TypeError: not a function',
              )),
      isTrue,
    );

    // The brief's alternative outcome — R1 re-uploading the whole texture
    // per 0.1 s update — would keep bumping the checkerboard's texture
    // version. Pin that it does NOT happen: after many more Timer windows
    // the upload counter stays at 1 (the initial decode upload).
    expect(state.textureUploadCount, 1);
    await harness.pumpFrames(tester, 20);
    expect(state.textureUploadCount, 1);
    await harness.dispose(tester);

    // Part 2 — instrumented copy of the same widget.js proving the exact
    // failure: copyTextureToTexture is undefined on the facade renderer,
    // while render() keeps succeeding between Timer windows.
    var source = File(
      'example/widgets/three-materials-partialupdate/widget.js',
    ).readAsStringSync();
    final copyNeedle =
        'Ge(N),R.copyTextureToTexture(N,F,null,z)),R.render(\$,b)}';
    expect(copyNeedle.allMatches(source), hasLength(1));
    source = source.replaceAll(
      copyNeedle,
      'Ge(N),(function(){try{return R.copyTextureToTexture(N,F,null,z)}'
      'catch(e){console.error("JSR_COPYFAIL typeof="'
      '+(typeof R.copyTextureToTexture)+" name="+e.name'
      '+" msg="+e.message);throw e}})()),'
      'R.render(\$,b),console.log("JSR_FRAME")}',
    );
    final probe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: source,
      instanceId: 'three-materials-partialupdate-gap-probe',
    );
    await probe.pumpFrames(tester, 40);
    final logs = (probe.backend as QuickjsWidgetEngineBackend)
        .peekLogs()
        .map((entry) => entry['msg'] as String)
        .toList();

    // The 0.1 s Timer window recurs: the copy attempt fires repeatedly.
    final copyFails =
        logs.where((msg) => msg.contains('JSR_COPYFAIL')).toList();
    expect(copyFails, isNotEmpty);
    expect(copyFails.length, greaterThan(1));
    for (final fail in copyFails) {
      expect(fail, contains('typeof=undefined'));
      expect(fail, contains('name=TypeError'));
      expect(fail, contains('msg=not a function'));
    }

    // Renders succeed between the copy attempts: the R1 draw path is
    // healthy — only the partial-update entry point is missing.
    expect(logs.any((msg) => msg.contains('JSR_FRAME')), isTrue);
    await probe.dispose(tester);

    // Part 3 — the same widget on the ISOLATE QuickJS backend: identical
    // degradation (textured plane renders, no texture re-uploads) so the
    // documented gap is not main-isolate-specific.
    final isolated = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-partialupdate',
      instanceId: 'three-materials-partialupdate-isolate-test',
      useIsolate: true,
    );
    await isolated.pumpUntil(
      tester,
      (isoState, isoPlan) =>
          isoState.geometryUploadCount > 0 &&
          isoPlan.draws.isNotEmpty &&
          isoState.submittedFrameCount >= 1,
    );
    expect(isolated.engine.exportedState!['example'],
        'webgl_materials_texture_partialupdate');
    final isoState = isolated.state!;
    expect(isolated.plan!.draws, hasLength(1));
    expect(isoState.textureUploadCount, 1);
    expect(isoState.submittedFrameCount, greaterThan(0));
    await isolated.pumpFrames(tester, 20);
    expect(isoState.textureUploadCount, 1);
    await isolated.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 240)));
}
