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

  testWidgets('webgl_materials_texture_anisotropy dies on the boot-time '
      'capabilities.getMaxAnisotropy TypeError before mounting', (tester) async {
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
    expect(errorCard, contains('not a function'));

    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('anisotropy probe: getMaxAnisotropy is undefined on R1 and '
      'the module then stacks the facade-label, GIF-lane and '
      'textureTransform gaps', (tester) async {
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

    // Layer 1 — the pinned boot gap: R1 has no capabilities.getMaxAnisotropy.
    expect(report['anisoType'], 'undefined');

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

    // Layer 3b — the scenes still cannot render: the official
    // repeat.set(512, 512) is a UV transform, rejected every frame.
    expect(report['renderOk'], 0);
    expect(report['renderErrors'] as int? ?? 0, greaterThan(0));
    expect(report['renderCode'], 'three.unsupported');
    expect(report['renderFeature'], 'textureTransform');
    expect(
      report['renderMsg'],
      contains('R1 v1 has no UV transform fields'),
    );

    // And the probe surface mirrors the unmodified widget: no submitted
    // frame ever survived, no texture ever uploaded.
    final state = probe.state;
    expect(
      state == null || state.submittedFrameCount == 0,
      isTrue,
      reason: 'every module render must throw before a frame submits',
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
    if ((latest['renderErrors'] as int? ?? 0) > 0) return latest;
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
        '?$renderer.capabilities.getMaxAnisotropy()'
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
  return 'globalThis.__JSR_PROBE={anisoType:"unreached",valSet:0,'
          'gifErrors:0,gifMessage:"unreached",renderOk:0,renderErrors:0,'
          'renderCode:"unreached",renderFeature:"unreached",'
          'renderMsg:"unreached"};'
          'globalThis.__JSR_PROBE_EXPORT=function(){try{'
          'var p=globalThis.__JSR_PROBE;'
          'if(globalThis.jsr&&jsr.exportState)jsr.exportState({probe:{'
          'anisoType:p.anisoType,valSet:p.valSet,gifErrors:p.gifErrors,'
          'gifMessage:p.gifMessage,renderOk:p.renderOk,'
          'renderErrors:p.renderErrors,renderCode:p.renderCode,'
          'renderFeature:p.renderFeature,renderMsg:p.renderMsg}})'
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
          'return out}catch(e){'
          'var p=globalThis.__JSR_PROBE;p.renderErrors++;'
          "if(p.renderErrors===1){p.renderCode=String(e.code||'');"
          "p.renderFeature=String(e.feature||'');"
          "p.renderMsg=String(e.message||'')}"
          'globalThis.__JSR_PROBE_EXPORT();throw e}};' +
      head +
      guardedTail;
}
