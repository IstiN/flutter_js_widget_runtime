import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/three_patch_once.dart' as patch_support;
import 'support/widget_logic_helper.dart';

/// webgl_camera_logarithmicdepthbuffer — DOCUMENTED FACADE GAP (not a
/// renderer capability gap).
///
/// The official module splits the viewport into two half-width views of the
/// same micrometer-to-parsec scene: `initView(scene, 'normal', false)` and
/// `initView(scene, 'logzbuf', true)` each build `new WebGLRenderer({
/// antialias, logarithmicDepthBuffer })` and append the canvas to a
/// static DOM scaffold (`#container_normal` / `#container_logzbuf`) with a
/// draggable `#renderer_border` between them. Neither half ever runs on
/// the JSR runtime — the widget dies synchronously inside init(), long
/// before any renderer is constructed:
///
/// - tool/three_example/example_adapter.js:284-291 — the facade's
///   `runtimeDocument.getElementById` materializes ONLY `container`,
///   `info`, and the inline `<script>` blocks of the original HTML;
///   everything else returns null.
/// - official_module.js init() then evaluates
///   `border = document.getElementById('renderer_border')` → null and
///   dereferences it (`border.addEventListener('pointerdown', …)`) —
///   `TypeError: cannot read property 'addEventListener' of null`, thrown
///   before `loader.load('fonts/helvetiker_regular.typeface.json', …)`
///   even resolves, so no renderer, no scene, no animation loop exists.
///
/// The booted widget therefore renders the standard error card (part 1
/// asserts the exact TypeError line) with the embedded typeface asset
/// registered but `mounted: false` and `renderer.frame: 0`.
///
/// Two deeper layers stay latent behind that facade gap, and part 2's
/// instrumented copy pins both:
///
/// - Layer 2 (the assignment's original suspicion): the
///   `logarithmicDepthBuffer` renderer flag is SILENTLY IGNORED — the
///   `JsrWebGLRenderer` constructor (tool/three/src/native_renderer.js
///   :211-235) never reads the parameter and records no such capability
///   key (probe logs `capLogDepth=false`), so R1 has no protocol error for
///   it either; there is no `logarithmicDepthBuffer` anywhere in
///   tool/three/src.
/// - Layer 3: even with the missing DOM scaffold stubbed, the module's
///   SECOND renderer construction hits the runtime's one-active-renderer-
///   per-canvas guard (tool/three/src/native_renderer.js:223 — `canvas
///   already has an active renderer`), because the facade pre-creates the
///   single `main` canvas and `runtime.createCanvas('main')` returns that
///   same canvas for every renderer (tool/three/src/runtime.js:404-409).
///   That plain `Error` (not a ThreeCapabilityError) is thrown inside the
///   FontLoader's promise chain and swallowed (the module passes no
///   onError), so `animate()` never starts and the death is completely
///   silent — no error card, `frame: 0`, and no canvas ever appended.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'camera logarithmicdepthbuffer example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets(
      'webgl_camera_logarithmicdepthbuffer dies in init on the facade DOM '
      'gap (no #renderer_border element)', (tester) async {
    // Part 1 — the unmodified widget: synchronous init() death.
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-camera-logarithmicdepthbuffer',
      instanceId: 'three-camera-logarithmicdepthbuffer-test',
    );
    await harness.pumpFrames(tester, 90);

    final exported = harness.engine.exportedState!;
    expect(exported['example'], 'webgl_camera_logarithmicdepthbuffer');
    expect(exported['backend'], 'flutterGpu');
    expect(exported['canvasCount'], 1);
    // init() died before any renderer appended a canvas to the container.
    expect(exported['mounted'], isFalse);
    // The embedded helvetiker typeface asset is registered by the prepared
    // widget (application/json lane) — the FontLoader never gets to it.
    final assets = exported['assets'] as Map<String, dynamic>;
    expect(
      (assets['fonts/helvetiker_regular.typeface.json']
          as Map<String, dynamic>)['registered'],
      isTrue,
    );
    // The exact null-deref failure from the facade DOM shim — NOT a
    // three.unsupported capability error.
    expect(
      harness.renderTrees.last.toString(),
      contains("Widget error: cannot read property 'addEventListener' "
          'of null'),
    );
    final allTrees = harness.renderTrees.map((tree) => tree.toString());
    expect(allTrees.join('\n'), isNot(contains('three.unsupported')));
    expect(harness.surface, isNull);
    expect((exported['renderer'] as Map<String, dynamic>)['frame'], 0);
    expect((exported['stats'] as Map<String, dynamic>)['updates'], 0);
    await harness.dispose(tester);

    // Part 2 — instrumented copy: stub only the missing DOM scaffold
    // (#renderer_border + the per-view #container_* frames) and instrument
    // the renderer constructions. This pins the layered reality: the font
    // asset resolves, the FIRST renderer constructs (with the
    // logarithmicDepthBuffer flag silently dropped), the SECOND renderer
    // hits the one-canvas-one-renderer guard, the throw is swallowed
    // inside the loader promise chain, and the animation loop never
    // starts.
    var source = File(
      'example/widgets/three-camera-logarithmicdepthbuffer/widget.js',
    ).readAsStringSync();
    // Shared structural patch anchor (test/support/three_patch_once.dart).
    String patchOnce(String label, RegExp re, String Function(Match) build) =>
        patch_support.patchOnce(source, label, re, build);

    // init(): tolerate the missing #renderer_border (facade DOM gap).
    source = patchOnce(
      'rendererBorder',
      RegExp(r'([A-Za-z_$][\w$]*)=([A-Za-z_$][\w$]*)\.getElementById\('
          r'"renderer_border"\),\1\.addEventListener\("pointerdown",'),
      (m) => '${m[1]}=(${m[2]}.getElementById("renderer_border")||'
          '{addEventListener:function(){}}),${m[1]}.addEventListener('
          '"pointerdown",',
    );
    // initView(): tolerate the missing #container_normal/#container_logzbuf
    // frames (same facade DOM gap) — the stubbed appendChild keeps the
    // canvas unmounted, which is exactly the shipped no-frame behavior.
    source = patchOnce(
      'viewContainer',
      RegExp(r'([A-Za-z_$][\w$]*)=([A-Za-z_$][\w$]*)\.getElementById\('
          r'"container_"\+([A-Za-z_$][\w$]*)\),'),
      (m) => '${m[1]}=${m[2]}.getElementById("container_"+${m[3]})||'
          '{style:{},appendChild:function(){}},',
    );
    // FontLoader onLoad: the embedded typeface resolves.
    source = patchOnce(
      'font',
      RegExp(r'"fonts/helvetiker_regular\.typeface\.json",'
          r'function\(([A-Za-z_$][\w$]*)\)\{'),
      (m) => '"fonts/helvetiker_regular.typeface.json",'
          'function(${m[1]}){console.log("JSR_FONT");',
    );
    // initView(): instrument both renderer constructions — capability key
    // facts for the flag (first renderer) and the second-renderer guard.
    source = patchOnce(
      'renderer',
      RegExp(r'let ([A-Za-z_$][\w$]*)=new ([A-Za-z_$][\w$]*)\(\{antialias:'
          r'!0,logarithmicDepthBuffer:([A-Za-z_$][\w$]*)\}\);'),
      (m) => 'let ${m[1]}=(function(){try{let r=new ${m[2]}({antialias:!0,'
          'logarithmicDepthBuffer:${m[3]}});'
          'console.log("JSR_R1 capLogDepth="+'
          '("logarithmicDepthBuffer" in r.capabilities));return r}catch(e)'
          '{console.error("JSR_RENDERER2 code="+(e.code||e.name)+'
          '" msg="+e.message)}})();',
    );
    // animate(): tick marker — must NEVER fire on R1.
    source = patchOnce(
      'animate',
      RegExp(r'function ([A-Za-z_$][\w$]*)\(\)\{requestAnimationFrame\('
          r'([A-Za-z_$][\w$]*)\),([A-Za-z_$][\w$]*)\(\)\}'),
      (m) => 'function ${m[1]}(){console.log("JSR_ANIM"),'
          'requestAnimationFrame(${m[2]}),${m[3]}()}',
    );
    final probe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: source,
      instanceId: 'three-camera-logarithmicdepthbuffer-gap-probe',
    );
    await probe.pumpFrames(tester, 90);
    final backend = probe.backend as QuickjsWidgetEngineBackend;
    final logs = backend.peekLogs().map((entry) => entry['msg'] as String);

    // init() now survives its DOM deref and the font asset resolves.
    expect(logs.any((msg) => msg.contains('JSR_FONT')), isTrue);
    // The FIRST (normal-depth) renderer constructs fine — and R1 silently
    // drops the flag: the capabilities object carries no
    // logarithmicDepthBuffer key at all.
    final caps = logs.firstWhere(
      (msg) => msg.contains('JSR_R1 capLogDepth='),
      orElse: () => '',
    );
    expect(caps, isNotEmpty);
    expect(caps, contains('capLogDepth=false'));
    // The SECOND (logzbuf) renderer hits the one-active-renderer-per-canvas
    // guard — a plain Error, NOT a three.unsupported capability error.
    final second = logs.firstWhere(
      (msg) => msg.contains('JSR_RENDERER2'),
      orElse: () => '',
    );
    expect(second, isNotEmpty);
    expect(
      second,
      contains('msg=three.surface: canvas already has an active renderer'),
    );
    expect(second, contains('code=Error'));
    expect(second, isNot(contains('three.unsupported')));
    // The throw lands inside the FontLoader promise chain and is swallowed
    // (the module passes no onError): the animation loop never starts.
    expect(logs.any((msg) => msg.contains('JSR_ANIM')), isFalse);
    // Silent death: the stubbed per-view containers keep every canvas
    // unmounted, so the facade never renders a tree, no error card
    // renders, and zero frames are ever submitted.
    final probeExported = probe.engine.exportedState!;
    expect(probeExported['mounted'], isFalse);
    expect((probeExported['renderer'] as Map<String, dynamic>)['frame'], 0);
    expect(probe.renderTrees, isEmpty);
    await probe.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
