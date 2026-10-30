import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/three_probe_state.dart';
import 'support/widget_logic_helper.dart';

/// Official three.js r186 *materials* examples on the native R1 pipeline.
///
/// All three modules land on documented facade gaps rather than green R1
/// draws; each test below pins the exact failure mode instead of forcing
/// a pass:
///
/// - `webgl_materials_bumpmap`: `validateMaterial` rejects every texture
///   slot except `map` — `tool/three/src/native_renderer.js:200-201` lists
///   `bumpMap` among the unsupported `materialTexture` slots. The GLB head
///   and its 4096² displacement jpg both load from the registered offline
///   assets and the lil-gui builds, but the first frame that draws the
///   Phong material throws the capability error card.
/// - `webgl_materials_texture_canvas`: the drawing canvas is an HTML-only
///   element (`<canvas id="drawing-canvas">`, original.html:30) that the
///   prepared facade never synthesizes — `tool/three_example/prepare.mjs`
///   only feeds inline `<script id>` blocks to `getElementById`. The module
///   throws `cannot read property 'getContext' of null` during init, while
///   the already-mounted R1 surface keeps rendering the (untextured) box:
///   the interactive paint path would additionally need the bounded
///   Canvas2D profile to grow `moveTo`/`lineTo`/`stroke`.
/// - `webgl_materials_texture_rotation`: R1 declares no UV transform
///   fields at all (`tool/three/src/native_renderer.js:510`, feature
///   `textureTransform`) and no `capabilities.getMaxAnisotropy`
///   (`tool/three/src/native_renderer.js:226-232`), so the texture onLoad
///   dies at the anisotropy assignment and the loader swallows the throw
///   because the official module passes no onError
///   (`tool/three/src/native_loaders.js:103-109`).
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'materials examples',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets(
    'webgl_materials_bumpmap boots assets and GUI but every frame throws '
    'the bumpMap materialTexture gap',
    (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-materials-bumpmap',
        instanceId: 'three-materials-bumpmap-test',
      );
      await harness.pumpUntil(
        tester,
        (state, plan) =>
            harness.renderTrees.any(
              (tree) => tree.toString().contains('materialTexture'),
            ) ||
            harness.renderTrees.length > 4,
        attempts: 120,
      );

      // Boot facts from the module: both offline assets register (the
      // 4096^2 displacement jpg and the LeePerrySmith GLB) ...
      final exported = harness.engine.exportedState!;
      expect(exported['example'], 'webgl_materials_bumpmap');
      expect(exported['backend'], 'flutterGpu');
      expect(exported['canvasCount'], 1);
      expect(exported['mounted'], isTrue);
      final assets = exported['assets'] as Map<String, dynamic>;
      final jpg =
          assets['models/gltf/LeePerrySmith/'
                  'Infinite-Level_02_Disp_NoSmoothUV-4096.jpg']
              as Map<String, dynamic>;
      final glb =
          assets['models/gltf/LeePerrySmith/LeePerrySmith.glb']
              as Map<String, dynamic>;
      expect(jpg['registered'], isTrue);
      expect(jpg['bytes'] as int, greaterThan(100000));
      expect(glb['registered'], isTrue);
      expect(glb['bytes'] as int, greaterThan(100000));

      // ... and the lil-gui builds both official controllers.
      final gui = exported['gui'] as Map<String, dynamic>;
      expect(gui['native'], isTrue);
      expect(gui['controllers'], 2);
      final values = (gui['values'] as List).cast<Map<String, dynamic>>();
      expect(values, hasLength(2));
      expect(values[0]['property'], 'enableBumpMap');
      expect(values[0]['value'], isTrue);
      expect(values[1]['property'], 'bumpScale');
      expect(values[1]['value'], 10);

      // The GLB geometry loaded (the mesh exists) but the Phong material's
      // bumpMap slot is R1-unsupported: the standard error card carries the
      // exact capability text and no R1 frame was ever submitted.
      final errorCard = harness.renderTrees.last.toString();
      expect(errorCard, contains('three.unsupported: materialTexture'));
      expect(errorCard, contains('(MeshPhongMaterial.bumpMap)'));
      expect(errorCard, contains('native R1 does not provide this capability'));
      expect(harness.surface, isNull);
      expect((exported['renderer'] as Map<String, dynamic>)['frame'], 0);
      expect((exported['stats'] as Map<String, dynamic>)['updates'], 0);

      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 180)),
  );

  testWidgets('webgl_materials_texture_canvas crashes on the HTML-only drawing '
      'canvas while the R1 surface keeps drawing the untextured box', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-texture-canvas',
      instanceId: 'three-materials-texture-canvas-test',
    );
    await harness.pumpFrames(tester, 30);

    final exported = harness.engine.exportedState!;
    expect(exported['example'], 'webgl_materials_texture_canvas');
    expect(exported['backend'], 'flutterGpu');
    expect(exported['canvasCount'], 1);
    expect(exported['mounted'], isTrue);
    // No offline assets and no GUI in this module.
    expect(exported['assets'], isEmpty);
    expect((exported['gui'] as Map<String, dynamic>)['controllers'], 0);

    // setupCanvasDrawing() runs after init() and dies on the facade:
    // getElementById('drawing-canvas') is null because the drawing canvas
    // is declared only in the official HTML, which the facade does not
    // synthesize.
    final errorCard = harness.renderTrees.last.toString();
    expect(errorCard, contains('Widget error:'));
    expect(errorCard, contains("getContext' of null"));

    // The renderer was already mounted before the throw, so the R1
    // surface stays alive: the BoxGeometry(200,200,200) and its
    // MeshBasicMaterial upload once, the RAF loop keeps submitting
    // frames of the rotating box, and the CanvasTexture map never
    // uploads (textureUploadCount stays 0).
    final state = harness.state!;
    expect(state.geometryUploadCount, 1);
    expect(state.materials, hasLength(1));
    expect(state.textureUploadCount, 0);
    final framesAfterBoot = state.submittedFrameCount;
    expect(framesAfterBoot, greaterThan(1));
    await harness.pumpFrames(tester, 5);
    expect(state.submittedFrameCount, greaterThan(framesAfterBoot));

    final plan = const ThreeDrawPlanner().plan(state);
    expect(plan.canRender, isTrue);
    expect(plan.diagnostics.warnings, isEmpty);
    expect(plan.draws, hasLength(1));
    final draw = plan.draws.single;
    expect(draw.drawCount, 36); // 12 triangles: BoxGeometry(200,200,200)
    expect(draw.material.kind, JsThreeMaterialKind.meshBasic);
    expect(draw.material.mapTextureId, 0); // map assignment never ran

    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_materials_texture_rotation boots but cannot render on R1 '
      '(textureTransform + missing getMaxAnisotropy gap)', (tester) async {
    // Part 1 — the unmodified widget: the uv_grid_opengl.jpg registers
    // and the canvas mounts, but no mesh ever appears. The texture
    // onLoad dies at renderer.capabilities.getMaxAnisotropy() (undefined
    // on R1) and JsrTextureLoader's catch swallows the throw because the
    // official module passes no onError — no error card, no surface.
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-texture-rotation',
      instanceId: 'three-materials-texture-rotation-test',
    );
    await harness.pumpFrames(tester, 60);

    final exported = harness.engine.exportedState!;
    expect(exported['example'], 'webgl_materials_texture_rotation');
    expect(exported['backend'], 'flutterGpu');
    expect(exported['canvasCount'], 1);
    expect(exported['mounted'], isTrue);
    final assets = exported['assets'] as Map<String, dynamic>;
    final uvGrid =
        assets['textures/uv_grid_opengl.jpg'] as Map<String, dynamic>;
    expect(uvGrid['registered'], isTrue);
    expect(uvGrid['bytes'] as int, greaterThan(100000));
    // Only the mount envelope was ever submitted: no GUI, no surface.
    expect(harness.renderTrees, hasLength(1));
    expect(harness.renderTrees.first['type'], 'three');
    expect(harness.surface, isNull);
    expect((exported['gui'] as Map<String, dynamic>)['controllers'], 0);
    await harness.dispose(tester);

    // Part 2 — instrumented copy proving both stacked failures. The probe
    // reports through a global collector re-exported via jsr.exportState
    // (state flags, NOT console-log scanning: re-prepared bundles re-minify
    // anchors and RAF-tick error floods can cap backend.peekLogs). With the
    // anisotropy line patched to survive, the mesh builds, the seven
    // official GUI controllers mount, updateUvTransform() applies
    // offset/repeat/center/rotation ... and every renderer.render()
    // throws the R1 textureTransform capability error.
    final probe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: _rotationProbeSource(),
      instanceId: 'three-materials-rotation-gap-probe',
    );
    final report =
        await _awaitProbeFindings(probe, tester) ?? const <String, dynamic>{};

    // The registered-asset texture pipeline resolves and the onLoad runs.
    expect(report['onLoad'] as int? ?? 0, greaterThan(0));
    // R1 declares no capabilities.getMaxAnisotropy at all.
    expect(report['anisoType'], 'undefined');
    // With that patched, every render throws the UV-transform gap; the
    // error itself proves offset/repeat/center/rotation reached the wire.
    expect(report['renderErrors'] as int? ?? 0, greaterThan(0));
    expect(report['renderCode'], 'three.unsupported');
    expect(report['renderFeature'], 'textureTransform');
    expect(report['renderMsg'], contains('R1 v1 has no UV transform fields'));

    await probe.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}

/// The exported probe collector from the instrumented rotation widget, or
/// null until the first probe export has landed.

/// Pumps until the probe has recorded its first renderer.render() failure
/// (the final finding to land) and returns the collector, or null if the
/// budget runs out.
Future<Map<String, dynamic>?> _awaitProbeFindings(
  ThreeQuickjsExampleHarness probe,
  WidgetTester tester,
) async {
  for (var attempt = 0; attempt < 60; attempt++) {
    final findings = probeFindings(probe);
    final ready = findings != null && (findings['renderErrors'] as int?) != 0;
    if (ready) return findings;
    await probe.pumpFrame(tester);
  }
  return probeFindings(probe);
}

/// Loud guard for the structural probe anchors: every anchor must match
/// exactly once in the re-minified bundle or the probe refuses to run.
List<RegExpMatch> _singleAnchor(Iterable<RegExpMatch> matches, String what) {
  final list = matches.toList();
  if (list.length != 1) {
    throw StateError(
      'rotation probe: expected exactly 1 $what anchor, found ${list.length}',
    );
  }
  return list;
}

/// The rotation widget.js instrumented with a state-flag probe. Findings
/// are stored on `globalThis.__JSR_PROBE` and re-exported through
/// `jsr.exportState` so the test never depends on console-log retention.
///
/// The three injections use structural anchors that survive re-minification
/// (the widget gets re-prepared with facade updates):
/// 1. the unique `renderer.capabilities.getMaxAnisotropy()` assignment is
///    guarded — when R1 lacks the method it records the typeof and falls
///    back to anisotropy 1 so the module can proceed to the deeper gap;
/// 2. the texture onLoad callback (anchored on the registered asset URL)
///    counts entries;
/// 3. the module's render function `function xx(){R.render(S,C)}` in the
///    tail after the URL is redirected through a guarded wrapper that
///    records the first renderer.render() failure and re-throws it.
String _rotationProbeSource() {
  const url = 'textures/uv_grid_opengl.jpg';
  var source = File(
    'example/widgets/three-materials-texture-rotation/widget.js',
  ).readAsStringSync();

  // Anchor 1 — the anisotropy assignment (exactly one occurrence).
  final anisotropy = RegExp(r'(\w+)\.capabilities\.getMaxAnisotropy\(\)');
  final renderer = _singleAnchor(
    anisotropy.allMatches(source),
    'getMaxAnisotropy',
  ).single[1]!;
  source = source.replaceFirst(
    '$renderer.capabilities.getMaxAnisotropy()',
    '$renderer.capabilities.getMaxAnisotropy'
        '?$renderer.capabilities.getMaxAnisotropy()'
        ':(globalThis.__JSR_PROBE.anisoType='
        'typeof $renderer.capabilities.getMaxAnisotropy,'
        "console.error('JSR_NOANISO typeof='"
        '+typeof $renderer.capabilities.getMaxAnisotropy),1)',
  );

  // Anchor 2 — the texture onLoad callback (unique via the asset URL).
  final onLoad = RegExp(
    'load\\("${RegExp.escape(url)}",function\\((\\w+)\\)\\{',
  );
  _singleAnchor(onLoad.allMatches(source), 'texture onLoad');
  source = source.replaceFirstMapped(
    onLoad,
    (match) =>
        'load("$url",function(${match[1]}){'
        'globalThis.__JSR_PROBE.onLoad++,'
        'globalThis.__JSR_PROBE_EXPORT();',
  );

  // Anchor 3 — the module render function, scoped to the tail after the
  // texture load call so embedded library code cannot match.
  final moduleStart = source.lastIndexOf(url);
  final head = source.substring(0, moduleStart);
  final tail = source.substring(moduleStart);
  final renderFn = RegExp(
    r'function ([A-Za-z_$][\w$]*)\(\)\{([A-Za-z_$][\w$]*)\.render'
    r'\(([A-Za-z_$][\w$]*),([A-Za-z_$][\w$]*)\)\}',
  );
  _singleAnchor(renderFn.allMatches(tail), 'render in module tail');
  final guardedTail = tail.replaceFirstMapped(
    renderFn,
    (match) =>
        'function ${match[1]}(){'
        'return globalThis.__JSR_PROBE_RENDER('
        '${match[2]},${match[3]},${match[4]})}',
  );

  return head +
      guardedTail +
      'globalThis.__JSR_PROBE={onLoad:0,anisoType:"unreached",'
          'renderCode:"unreached",renderFeature:"unreached",'
          'renderMsg:"unreached",renderErrors:0};'
          'globalThis.__JSR_PROBE_EXPORT=function(){try{'
          'var p=globalThis.__JSR_PROBE;'
          'if(globalThis.jsr&&jsr.exportState)jsr.exportState({probe:{'
          'onLoad:p.onLoad,anisoType:p.anisoType,renderCode:p.renderCode,'
          'renderFeature:p.renderFeature,renderMsg:p.renderMsg,'
          'renderErrors:p.renderErrors}})}catch(e){}};'
          'globalThis.__JSR_PROBE_RENDER=function(r,s,c){try{return r.render(s,c)}'
          'catch(e){var p=globalThis.__JSR_PROBE;'
          'if(p.renderErrors===0){p.renderCode=String(e.code||"");'
          'p.renderFeature=String(e.feature||"");'
          'p.renderMsg=String(e.message||"")}p.renderErrors++;'
          "console.error('JSR_RENDERFAIL code='+e.code+' feature='+e.feature"
          "+' msg='+e.message);globalThis.__JSR_PROBE_EXPORT();throw e}};";
}
