import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';
import 'support/three_gap_documentation.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// webgl_materials_modified — DOCUMENTED FACADE GAP (not a widget bug).
///
/// The official module loads the LeePerrySmith head twice and deforms both
/// copies with a per-material vertex twist injected through
/// `material.onBeforeCompile` (official_module.js:81-99): the callback
/// prefixes a `time` uniform, rewrites `#include <begin_vertex>` with a
/// sin(theta(position.y)) rotation matrix, and `customProgramCacheKey`
/// keeps the two programs apart (amount +2.0 at x=-3.5, -2.0 at x=3.5).
///
/// R1 runs PREBUILT shaders: there is no shader-source compile path, so an
/// own `onBeforeCompile` property can never run. The runtime makes that a
/// hard, documented capability boundary instead of silently dropping the
/// deformation:
///
/// - tool/three/src/native_renderer.js:199 — `validateMaterial()` throws
///   `ThreeCapabilityError: three.unsupported: onBeforeCompile
///   (arbitrary shaders require 1B); native R1 does not provide this
///   capability; use the 1B backend where available` for any material
///   carrying an own `onBeforeCompile`.
/// - The check fires from `_ensureMaterial` (native_renderer.js:550-552)
///   during command emission, i.e. inside the first `renderer.render()`
///   that sees the twist meshes — after the GLB onLoad callback has added
///   them, before any frame is submitted.
///
/// Everything upstream of the shader injection works: the canvas mounts,
/// the GLB resolves from the registered offline asset, both
/// `buildTwistMaterial` calls run, the OrbitControls/Stats facades build,
/// and the RAF loop ticks. What never happens is an R1 submit: the first
/// render() throws, the engine renders the standard error card, and the
/// module-visible renderer/stats counters stay at zero. This test pins
/// exactly that; if R1 ever grows a shader-injection escape hatch, rewrite
/// it as a normal draw-plan test (two head meshes, MeshNormalMaterial,
/// no lights).
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test('materials modified example', () {},
        skip: 'QuickJS native library is not available');
    return;
  }

  testWidgets(
    'webgl_materials_modified boots assets but every frame throws the '
    'onBeforeCompile capability gap',
    (tester) async {
      // Part 1 — the unmodified widget: healthy boot, zero R1 submits.
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-materials-modified',
        instanceId: 'three-materials-modified-test',
      );
      await harness.pumpUntil(
        tester,
        (state, plan) =>
            harness.renderTrees.any((tree) =>
                tree.toString().contains('onBeforeCompile')) ||
            harness.renderTrees.length > 4,
        attempts: 120,
      );

      final exported = harness.engine.exportedState!;
      expect(exported['example'], 'webgl_materials_modified');
      expect(exported['backend'], 'flutterGpu');
      expect(exported['canvasCount'], 1);
      expect(exported['mounted'], isTrue);

      // The LeePerrySmith GLB registers from the prepared offline assets
      // (prepare pins sha256 402b8a8a..., 404976 bytes) and this module
      // has no lil-gui and no other textures.
      final assets = exported['assets'] as Map<String, dynamic>;
      final glb = assets['models/gltf/LeePerrySmith/LeePerrySmith.glb']
          as Map<String, dynamic>;
      expect(glb['registered'], isTrue);
      expect(glb['bytes'] as int, greaterThan(100000));
      expect((exported['gui'] as Map<String, dynamic>)['controllers'], 0);

      // The GLB geometry loaded (the twist meshes exist) but the injected
      // onBeforeCompile is R1-unsupported: the standard error card carries
      // the exact capability text and no R1 frame was ever submitted —
      // the throw happens before info.render.frame++ / stats.update().
      final errorCard = harness.renderTrees.last.toString();
      expect(errorCard, contains('three.unsupported: onBeforeCompile'));
      expect(errorCard, contains('(arbitrary shaders require 1B)'));
      expect(
        errorCard,
        contains('native R1 does not provide this capability'),
      );
      expect(harness.surface, isNull);
      expect((exported['renderer'] as Map<String, dynamic>)['frame'], 0);
      expect((exported['stats'] as Map<String, dynamic>)['updates'], 0);

      await harness.dispose(tester);

      // Part 2 — instrumented copy of the same widget.js proving the exact
      // per-frame failure chain: both twist materials build with their own
      // onBeforeCompile (JSR_TWIST), the GLB onLoad adds the two meshes
      // (JSR_GLB), animate() keeps ticking (JSR_ANIM), and every
      // renderer.render() throws the onBeforeCompile capability error
      // (JSR_RENDERFAIL) — including on the very first tick.
      final probe = await ThreeQuickjsExampleHarness.bootSource(
        tester,
        source: _modifiedProbeSource(),
        instanceId: 'three-materials-modified-gap-probe',
      );
      await probe.pumpFrames(tester, 30);
      final backend = probe.backend as QuickjsWidgetEngineBackend;
      final logs = backend.peekLogs().map((log) => log['msg'] as String);

      // Both official twist amounts built their MeshNormalMaterial
      // (amount +2.0 at x=-3.5, -2.0 at x=3.5); the JSR_RENDERFAIL below
      // proves each carries the own onBeforeCompile property.
      final twists = logs
          .where((msg) => msg.contains('JSR_TWIST'))
          .toList(growable: false);
      expect(twists, hasLength(2));
      expect(twists[0], contains('amount=2'));
      expect(twists[1], contains('amount=-2'));
      expect(
        twists.every((msg) => msg.contains('type=MeshNormalMaterial')),
        isTrue,
      );

      // The GLB head geometry parsed — the asset pipeline is not the
      // failure — and the animation loop ticks with both official meshes
      // in the scene (this is NOT a stalled setAnimationLoop or a hung
      // GLTF import).
      expect(logs.any((msg) => msg.contains('JSR_GLB')), isTrue);
      expect(
        logs.any((msg) => msg.contains('JSR_ANIM meshes=2')),
        isTrue,
      );

      // Every render() throws the documented R1 capability error.
      final failure = expectRenderFailFeature(logs, 'onBeforeCompile');
      expect(
        failure,
        contains('three.unsupported: onBeforeCompile '
            '(arbitrary shaders require 1B)'),
      );

      await probe.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 180)),
  );
}

/// The modified widget.js with four probes injected: buildTwistMaterial
/// entry (amount + own-property check), GLB onLoad entry (mesh count),
/// animate() entry, and a try/catch around renderer.render() that logs
/// the capability error.
String _modifiedProbeSource() {
  var source = File(
    'example/widgets/three-materials-modified/widget.js',
  ).readAsStringSync();
  source = source
      .replaceAll(
        'function Bn(i){let e=new on;return e.onBeforeCompile=',
        'function Bn(i){let e=new on;'
        'console.log("JSR_TWIST amount="+i+" type="+e.type);'
        'return e.onBeforeCompile=',
      )
      .replaceAll(
        'function(t){let r=t.scene.children[0].geometry,',
        'function(t){let r=t.scene.children[0].geometry;'
        'console.log("JSR_GLB head geometry parsed");',
      )
      .replaceAll(
        'function Er(){xr(),Ot.update()}',
        'function Er(){console.log("JSR_ANIM meshes="+de.children.length)'
        ',xr(),Ot.update()}',
      )
      .replaceAll(
        'X.render(de,re)',
        '(function(){try{X.render(de,re)}catch(e){console.error('
        '"JSR_RENDERFAIL code="+e.code+" feature="+e.feature'
        '+" msg="+e.message)}})()',
      );
  return source;
}
