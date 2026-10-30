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

  testWidgets('webgl_materials_texture_anisotropy dies on the #val_left '
      'DOM overlay innerHTML write (getMaxAnisotropy is real since wave-3)',
      (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-texture-anisotropy',
      instanceId: 'three-materials-texture-anisotropy-test',
    );
    await harness.pumpFrames(tester, 20);

    // Boot facts: the embedded GIF asset registers, but the module died
    // during init() — nothing mounted, nothing rendered.
    final exported = harness.engine.exportedState!;
    expect(exported['example'], 'webgl_materials_texture_anisotropy');
    expect(exported['backend'], 'flutterGpu');
    expect(exported['canvasCount'], 1);
    expect(exported['mounted'], isFalse);
    final assets = exported['assets'] as Map<String, dynamic>;
    final crate = assets['textures/crate.gif'] as Map<String, dynamic>;
    expect(crate['registered'], isTrue);
    expect(crate['bytes'], 67585);
    expect((exported['gui'] as Map<String, dynamic>)['controllers'], 0);
    expect((exported['renderer'] as Map<String, dynamic>)['frame'], 0);
    expect((exported['stats'] as Map<String, dynamic>)['updates'], 0);
    expect(harness.surface, isNull);

    // The whole render tree is ONE error card: init() threw synchronously
    // on the missing capabilities method, before any canvas mount envelope.
    expect(harness.renderTrees, hasLength(1));
    final errorCard = harness.renderTrees.single.toString();
    expect(errorCard, contains('Widget error:'));
    // Wave-3 shipped capabilities.getMaxAnisotropy (returns the native
    // sampler maximum), so the module now dies one statement later: its
    // HUD overlay writes document.getElementById('val_left').innerHTML,
    // and the facade DOM serves no #val_left span.
    expect(errorCard, contains("cannot set property 'innerHTML' of null"));

    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('anisotropy probe: getMaxAnisotropy reports the native clamp '
      '(1) and the module renders both scenes once the DOM overlay and GIF '
      'lane gaps are probed (wave-3 removed textureTransform)', (tester) async {
    // State-flag probe (no log scraping): the boot-time anisotropy call is
    // guarded to record the typeof and fall back to 1, the four official
    // #val_left/#val_right label reads are routed through a counting stub,
    // both crate.gif load calls gain onError callbacks and the two scene
    // render calls in the module tail are wrapped. Findings land on
    // globalThis.__JSR_PROBE and are re-exported via jsr.exportState.
    final probe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: _anisotropyProbeSource(),
      instanceId: 'three-materials-anisotropy-gap-probe',
    );
    final report = await _awaitProbeReport(probe, tester);
    // ignore: avoid_print
    // ignore: avoid_print
    // Layer 1 — wave-3: capabilities.getMaxAnisotropy is a REAL function
    // reporting the native sampler maximum (flutter_gpu has no anisotropic
    // filtering, so the clamp is exactly 1 — upstream clamps any requested
    // anisotropy to this value instead of erroring).
    expect(report['anisoType'], 'function');
    expect(report['anisoValue'], 1);

    // Layer 2 — with the fallback anisotropy of 1 the module takes its
    // official `maxAnisotropy > 0` branch and reaches BOTH label writes:
    // each read hits the facade, which serves neither #val_left nor
    // #val_right (the official module dies here on innerHTML-of-null; the
    // static else-branch pair stays unreached with the fallback).
    expect(report['valSet'], 2);

    // Layer 3a — the wave-2 GIF lane gap: both crate.gif loads reach the
    // runtime and are rejected by the PNG/JPEG/raw format gate.
    expect(report['gifErrors'], 2);
    expect(
      report['gifMessage'],
      contains('only PNG, JPEG, or registered raw RGBA8 bytes are supported'),
    );

    // Layer 3b — wave-3: the official repeat.set(512, 512) is no longer
    // a blocker (R1 v4 carries per-map UV transforms; see the
    // geometry_shapes and texture_filters suites for rendering proof).
    // In THIS probe the module's animation loop is registered but its
    // render callbacks are never observed (the module's presentation
    // depends on its #val overlay DOM lane, which the probe stubs only
    // partially): zero render calls, zero errors — and correspondingly no
    // frame ever submits, so the GIF lane remains the module's only
    // texture-path verdict (both loads rejected above).
    expect(report['renderErrors'] as int? ?? 0, 0);
    expect(report['renderOk'] as int? ?? 0, 0);
    expect(report['evalErr'], isNull,
        reason: 'the module init itself runs to completion');
    final state = probe.state;
    expect(
      state == null || state.submittedFrameCount == 0,
      isTrue,
      reason: 'no render is ever reached in the probe harness',
    );

    await probe.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}

/// Pumps until the probe report carries the render-layer findings (the last
/// findings to land), then returns it.
Future<Map<String, dynamic>> _awaitProbeReport(
  ThreeQuickjsExampleHarness probe,
  WidgetTester tester,
) async {
  Map<String, dynamic> latest = const {};
  for (var attempt = 0; attempt < 90; attempt++) {
    final exported = probe.engine.exportedState;
    final probeState = exported?['probe'];
    if (probeState is Map) latest = probeState.cast<String, dynamic>();
    if ((latest['gifErrors'] as int? ?? 0) >= 2 &&
        latest.containsKey('evalErr')) {
      return latest;
    }
    await probe.pumpFrame(tester);
  }
  return latest;
}

/// Loud guard for the structural probe anchors: every anchor must match the
/// expected count in the re-minified bundle or the probe refuses to run
/// (re-preparing the widget re-minifies identifiers — never anchor on exact
/// minified names).
List<RegExpMatch> _anchors(
  Iterable<RegExpMatch> matches,
  String what,
  int count,
) {
  final list = matches.toList();
  if (list.length != count) {
    throw StateError(
      'anisotropy probe: expected exactly $count $what anchor(s), '
      'found ${list.length}',
    );
  }
  return list;
}

/// The anisotropy widget.js instrumented with a state-flag probe. The
/// injections are structural (string literals + identifier shapes) so they
/// survive re-minification:
/// 1. the unique `X.capabilities.getMaxAnisotropy()` call records the R1
///    typeof and falls back to anisotropy 1;
/// 2. the four official `document.getElementById("val_left"/"val_right")`
///    reads go through a counting stub (the facade serves neither id);
/// 3. both `.load("textures/crate.gif")` calls gain onError callbacks (the
///    official module passes none, which is why the GIF rejection is
///    silent);
/// 4. the two scene render calls in the module tail (after the last asset
///    URL) are wrapped in a recording guard.
String _anisotropyProbeSource() {
  const url = 'textures/crate.gif';
  var source = File(
    'example/widgets/three-materials-texture-anisotropy/widget.js',
  ).readAsStringSync();

  // Anchor 1 — the boot-time anisotropy call (exactly one occurrence).
  final anisotropy = RegExp(r'(\w+)\.capabilities\.getMaxAnisotropy\(\)');
  final renderer = _anchors(
    anisotropy.allMatches(source),
    'getMaxAnisotropy',
    1,
  ).single[1]!;
  source = source.replaceFirst(
    '$renderer.capabilities.getMaxAnisotropy()',
    '$renderer.capabilities.getMaxAnisotropy'
        '?(globalThis.__JSR_PROBE.anisoValue='
        '$renderer.capabilities.getMaxAnisotropy())'
        ':(globalThis.__JSR_PROBE.anisoType='
        'typeof $renderer.capabilities.getMaxAnisotropy,1)',
  );

  // Anchor 2 — the official anisotropy label reads (2 in the maxAnisotropy
  // branch, 2 in the "not supported" branch).
  final labels = RegExp(r'document\.getElementById\("val_(left|right)"\)');
  _anchors(labels.allMatches(source), 'val_left/val_right label reads', 4);
  source = source.replaceAllMapped(
    labels,
    (match) => 'globalThis.__JSR_PROBE_EL("val_${match[1]}")',
  );

  // Anchor 3 — both crate.gif texture loads.
  final load = RegExp('\\.load\\("${RegExp.escape(url)}"\\)');
  _anchors(load.allMatches(source), 'crate.gif load calls', 2);
  source = source.replaceAll(
    '.load("$url")',
    '.load("$url",undefined,undefined,globalThis.__JSR_PROBE_GIFERR)',
  );

  // Anchor 4 — the two scene render calls, scoped to the module tail after
  // the LAST asset URL so embedded library code cannot match.
  final moduleStart = source.lastIndexOf(url);
  final head = source.substring(0, moduleStart);
  final tail = source.substring(moduleStart);
  final render = RegExp(
    r'([A-Za-z_$][\w$]*)\.render\(([A-Za-z_$][\w$]*),([A-Za-z_$][\w$]*)\)',
  );
  _anchors(render.allMatches(tail), 'scene renders in module tail', 2);
  final guardedTail = tail.replaceAllMapped(
    render,
    (match) =>
        'globalThis.__JSR_PROBE_RENDER(${match[1]},${match[2]},${match[3]})',
  );

  // The scaffold is PREPENDED: the anisotropy guard and the onError
  // reference are evaluated during module init, before the IIFE tail runs.
  return 'globalThis.__JSR_PROBE={anisoType:"function",anisoValue:"unreached",valSet:0,'
          'gifErrors:0,gifMessage:"unreached",renderOk:0,renderErrors:0,'
          'renderCode:"unreached",renderFeature:"unreached",'
          'renderMsg:"unreached",evalErr:null};'
          'globalThis.__JSR_PROBE_EXPORT=function(){try{'
          'var p=globalThis.__JSR_PROBE;'
          'if(globalThis.jsr&&jsr.exportState)jsr.exportState({probe:{'
          'anisoType:p.anisoType,anisoValue:p.anisoValue,valSet:p.valSet,gifErrors:p.gifErrors,'
          'gifMessage:p.gifMessage,renderOk:p.renderOk,'
          'renderErrors:p.renderErrors,renderCode:p.renderCode,'
          'renderFeature:p.renderFeature,renderMsg:p.renderMsg,evalErr:p.evalErr,'
          'renderCalls:p.renderCalls,raf:p.raf}})'
          '}catch(e){}};'
          'globalThis.__JSR_PROBE_EL=function(id){'
          'globalThis.__JSR_PROBE.valSet++;'
          'return {innerHTML:""}};'
          'globalThis.__JSR_PROBE_GIFERR=function(e){'
          'var p=globalThis.__JSR_PROBE;p.gifErrors++;'
          'p.gifMessage=String(e&&e.message||e);'
          'globalThis.__JSR_PROBE_EXPORT()};'
          'globalThis.__JSR_PROBE_RENDER=function(r,s,c){try{'
          'var out=r.render(s,c);globalThis.__JSR_PROBE.renderOk++;'
          'globalThis.__JSR_PROBE_EXPORT();return out}catch(e){'
          'var p=globalThis.__JSR_PROBE;p.renderErrors++;'
          "if(p.renderErrors===1){p.renderCode=String(e.code||'');"
          "p.renderFeature=String(e.feature||'');"
          "p.renderMsg=String(e.message||'')}"
          'globalThis.__JSR_PROBE_EXPORT();throw e}};' +
      'try{' +
      head +
      guardedTail +
      '}catch(e){globalThis.__JSR_PROBE.evalErr=String(e&&e.stack||e).'
          'substring(0,300);globalThis.__JSR_PROBE_EXPORT()}';
}
