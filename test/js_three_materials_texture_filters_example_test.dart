import 'dart:io';
import 'dart:math' as math;

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// webgl_materials_texture_filters — the official r186 side-by-side texture
/// filtering comparison on the native R1 pipeline.
///
/// The r186 module has NO lil-gui (no min/mag dropdowns, no generateMipmaps
/// checkbox — `official_module.js` contains zero GUI references, so there is
/// no dropdown event id to drive): it builds TWO scenes rendered into
/// scissored viewport halves. Each scene carries a 100x100 checkerboard
/// CanvasTexture floor (drawn through the bounded native Canvas2D `fillRect`
/// profile), the 148992-byte Caravaggio jpg as a `TextureLoader` painting
/// plane, a black backdrop plane and a transparent overlay plane; the left
/// floor/painting use linear filtering, the right ones `NearestFilter`
/// clones (`generateMipmaps = false`, `new THREE.Texture()` fed the decoded
/// jpg image). Both scenes add black `Fog(0, 1500, 4000)` and drift the camera
/// each RAF tick.
///
/// Verdict — DOCUMENTED-GAP (two stacked, individually pinned capability
/// failures; the official scene can never render on R1):
///
/// 1. PRIMARY: the official floor textures call
///    `textureCanvas.repeat.set(1000, 1000)` and R1 v1 declares no UV
///    transform fields, so every `renderer.render()` throws
///    `three.unsupported: textureTransform`
///    (`tool/three/src/native_renderer.js:510`) before any frame is
///    assembled — error card every RAF tick, no surface, frame 0.
/// 2. SECONDARY (revealed by the probe neutralizing only that repeat line):
///    the nearest floor is `textureCanvas.clone()`, and r186 `Texture.copy`
///    SHARES the `TextureSource` (`this.source = source.source`) while
///    JSON-cloning `userData` (`src/textures/Texture.js:477,514`), which
///    drops the native-canvas reference. Once `_adoptCanvasTexture` swaps
///    the shared `source.data` for raw RGBA
///    (`tool/three/src/native_renderer.js:474-482`), the clone's `.image` is
///    a plain data object and `_canvasForTexture`
///    (`tool/three/src/native_renderer.js:491-494`) finds no Flutter canvas,
///    so the renderer's internal canvas-refresh renders
///    (`tool/three/src/native_renderer.js:483`) throw
///    `three.unsupported: canvas2d.source` every tick
///    (`tool/three/src/native_renderer.js:502`). Module renders keep
///    succeeding (probe counters), but the scene graph can never fully
///    texture: only ONE floor RGBA and ONE painting jpg ever upload.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'materials texture filters example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_materials_texture_filters boots and mounts but every '
      'frame throws the floor repeat textureTransform gap', (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-texture-filters',
      instanceId: 'three-materials-texture-filters-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          harness.renderTrees.any((tree) => tree.toString().contains(
                'three.unsupported: textureTransform',
              )) ||
          harness.renderTrees.length > 4,
      attempts: 120,
    );

    // Boot facts: the canvas mounts and the embedded painting asset
    // registers, but this module never submits an R1 frame.
    final exported = harness.engine.exportedState!;
    expect(exported['example'], 'webgl_materials_texture_filters');
    expect(exported['backend'], 'flutterGpu');
    expect(exported['canvasCount'], 1);
    expect(exported['mounted'], isTrue);
    final assets = exported['assets'] as Map<String, dynamic>;
    final painting = assets[
        'textures/758px-Canestra_di_frutta_(Caravaggio).jpg']
        as Map<String, dynamic>;
    expect(painting['registered'], isTrue);
    expect(painting['bytes'], 148992);
    // The r186 example carries no lil-gui: no dropdown event ids exist in
    // the widget's gui registry (assignment premise checked and refuted).
    final gui = exported['gui'] as Map<String, dynamic>;
    expect(gui['controllers'], 0);
    expect(gui['values'], isEmpty);

    // No frame was ever submitted: no surface, renderer.frame 0.
    expect(harness.surface, isNull);
    expect((exported['renderer'] as Map<String, dynamic>)['frame'], 0);
    expect((exported['stats'] as Map<String, dynamic>)['updates'], 0);

    // The render tree is the three mount envelope followed by repeating
    // capability error cards.
    expect(harness.renderTrees.first['type'], 'three');
    expect(harness.renderTrees.first['canvasId'], 'main');
    final errorCard = harness.renderTrees.last.toString();
    expect(errorCard, contains('Widget error:'));
    expect(errorCard, contains('three.unsupported: textureTransform'));
    expect(errorCard, contains('R1 v1 has no UV transform fields'));
    expect(errorCard, contains('native R1 does not provide this capability'));

    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('filters probe: the official floor repeat(1000, 1000) is the '
      'pinned textureTransform trigger; neutralizing only that line exposes '
      'the CanvasTexture-clone canvas2d.source gap', (tester) async {
    // State-flag probe (no log scraping): the floor texture's official
    // repeat.set(1e3, 1e3) call is intercepted to record the values R1
    // rejects, then neutralized to (1, 1); the two module render calls are
    // wrapped in counting guards and a prototype-level wrapper (installed
    // after the module IIFE closes, so it also sees the renderer's internal
    // refresh renders) records the deeper failure. Findings land on
    // globalThis.__JSR_PROBE and are re-exported through jsr.exportState.
    final probe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: _filtersProbeSource(),
      instanceId: 'three-materials-filters-gap-probe',
    );
    final report = await _awaitProbeReport(probe, tester);

    // The pinned PRIMARY trigger: the OFFICIAL module sets floor repeat
    // (1000, 1000) on its checkerboard CanvasTextures, which
    // native_renderer.js:510 rejects outright on R1.
    expect(report['floorRepeat'], [1000, 1000]);

    // With only that line neutralized the LINEAR scene renders cleanly every
    // tick while the NEAREST scene's render throws canvas2d.source every tick
    // (once the shared checkerboard CanvasTexture source is mutated by the
    // linear clone's adopt, the nearest clone has no Flutter canvas2d image
    // left to upload). Both counters must therefore grow in lockstep.
    expect(report['renderErrors'] as int? ?? 0, greaterThan(20));
    expect(report['renderOk'] as int? ?? 0, greaterThan(20));
    expect(report['allErrors'] as int? ?? 0, greaterThan(20));
    expect(report['allCode'], 'three.unsupported');
    expect(report['allFeature'], 'canvas2d.source');
    expect(
      report['allMsg'],
      contains('native CanvasTexture requires a Flutter canvas2d image'),
    );
    // And the host surfaces the secondary gap as a repeating error card.
    expect(
      probe.renderTrees.any((tree) =>
          tree.toString().contains('three.unsupported: canvas2d.source')),
      isTrue,
    );

    // Host side: module frames flow, all four official materials upsert,
    // but only ONE floor RGBA texture and ONE painting jpg ever upload —
    // the nearest floor clone never adopts (the shared-TextureSource gap).
    final state = probe.state;
    expect(state, isNotNull);
    expect(state!.submittedFrameCount, greaterThan(20));
    expect(state.materials, hasLength(4));
    expect(state.textureUploadCount, 2);
    final encoded = state.textures.values
        .where((texture) => texture.isEncoded)
        .toList();
    expect(encoded, hasLength(1));
    expect(encoded.single.data.length, 148992); // raw jpg bytes pass through
    expect(encoded.single.srgb, isTrue);
    expect(encoded.single.nearestMag, isFalse);
    expect(encoded.single.nearestMin, isFalse);
    expect(encoded.single.mipmaps, isTrue);
    final rgba = state.textures.values
        .where((texture) => !texture.isEncoded)
        .toList();
    expect(rgba, hasLength(1));
    expect(rgba.single.width, greaterThan(0));
    expect(rgba.single.height, greaterThan(0));

    // The submitted frames carry the scene meshes on shared
    // PlaneGeometry(100, 100) = 6 indices each, with the module's own
    // material colors intact (backdrops black, overlays transparent at
    // 0.75, nearest floor tinted 0xffccaa).
    final plan = const ThreeDrawPlanner().plan(state);
    expect(plan.draws, isNotEmpty);
    for (final draw in plan.draws) {
      expect(draw.drawCount, 6);
      expect(draw.indexed, isTrue);
      expect(draw.material.kind, JsThreeMaterialKind.meshBasic);
    }
    // Only the uploaded textures can bind: the nearest floor clone never
    // adopts (shared TextureSource gap), so exactly the linear floor (RGBA)
    // and the linear painting (jpg) draws carry a texture id; the nearest
    // scene contributes no draws at all (its render throws before any of
    // its materials/textures ever upsert).
    final texturedDraws = plan.draws
        .where((draw) => draw.material.mapTextureId != 0)
        .toList();
    expect(texturedDraws, hasLength(2));
    final boundKinds = texturedDraws.map((draw) {
      final texture =
          state.textures[draw.material.mapTextureId]!;
      return texture.isEncoded ? 'jpg' : 'rgba';
    }).toSet();
    expect(boundKinds, {'jpg', 'rgba'});
    final painting = texturedDraws.map((draw) =>
        state.textures[draw.material.mapTextureId]!).singleWhere(
      (texture) => texture.isEncoded,
    );
    expect(painting.data.length, 148992);
    expect(painting.srgb, isTrue);
    final overlays =
        plan.draws.where((draw) => draw.material.transparent).toList();
    expect(overlays.length, lessThanOrEqualTo(2));
    for (final draw in overlays) {
      expect(draw.material.opacity, closeTo(0.75, 0.001));
    }
    // The sampled frame is the LINEAR scene half: its floor keeps the
    // default white MeshBasicMaterial and both its textured draws bind.
    // (The nearest scene half's tinted 0xffccaa floor never reaches a
    // submitted frame — its CanvasTexture clone is the canvas2d.source
    // casualty documented above.)
    final whiteFloors = plan.draws
        .map((draw) => draw.material)
        .where((material) =>
            !material.transparent &&
            material.colorR > 0.9 &&
            material.colorG > 0.9 &&
            material.colorB > 0.9)
        .toList();
    expect(whiteFloors.length, greaterThanOrEqualTo(1));

    // The rendered scene carries black Fog(0, 1500, 4000) on black.
    final frame = plan.frame!;
    expect(frame.fogMode, JsThreeFogMode.linear);
    expect(frame.fogNear, closeTo(1500, 0.001));
    expect(frame.fogFar, closeTo(4000, 0.001));
    expect(frame.fogColorR, 0);
    expect(frame.fogColorG, 0);
    expect(frame.fogColorB, 0);
    expect(plan.background.r, 0);

    await probe.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}

/// sRGB channel (0..255) → linear, matching THREE.Color's working space.
double _linearOf(int channel8) {
  final value = channel8 / 255;
  return value <= 0.04045
      ? value / 12.92
      : math.pow((value + 0.055) / 1.055, 2.4).toDouble();
}

/// Pumps until the probe report has the floor repeat record and enough
/// render counters to judge, then returns it.
Future<Map<String, dynamic>> _awaitProbeReport(
  ThreeQuickjsExampleHarness probe,
  WidgetTester tester,
) async {
  Map<String, dynamic> latest = const {};
  for (var attempt = 0; attempt < 90; attempt++) {
    final exported = probe.engine.exportedState;
    final probeState = exported?['probe'];
    if (probeState is Map) latest = probeState.cast<String, dynamic>();
    if ((latest['floorRepeat'] as List?) != null &&
        (latest['renderOk'] as int? ?? 0) > 20 &&
        (latest['allErrors'] as int? ?? 0) > 20) {
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
      'filters probe: expected exactly $count $what anchor(s), '
      'found ${list.length}',
    );
  }
  return list;
}

/// The filters widget.js instrumented with a state-flag probe. The
/// injections are structural (string literals + identifier shapes) so they
/// survive re-minification:
/// 1. the unique floor `X.repeat.set(1e3, 1e3)` call is routed through a
///    recorder that stores the official values and then neutralizes them;
/// 2. the two scene render calls in the module tail are wrapped in a
///    counting guard;
/// 3. AFTER the module IIFE closes, `THREE.WebGLRenderer.prototype.render`
///    is wrapped to also observe the renderer-internal refresh renders.
String _filtersProbeSource() {
  const url = 'textures/758px-Canestra_di_frutta_(Caravaggio).jpg';
  var source = File(
    'example/widgets/three-materials-texture-filters/widget.js',
  ).readAsStringSync();

  // Anchor 1 — the floor repeat (exactly one call; the nearest floor is a
  // clone that copies it).
  final repeat = RegExp(r'([A-Za-z_$][\w$]*)\.repeat\.set\(1e3,1e3\)');
  _anchors(repeat.allMatches(source), 'floor repeat.set(1e3,1e3)', 1);
  source = source.replaceFirstMapped(
    repeat,
    (match) => 'globalThis.__JSR_PROBE_FLOOR(${match[1]},1e3,1e3)',
  );

  // Anchor 2 — both scene render calls, scoped to the module tail after the
  // painting asset URL so embedded library code cannot match.
  final moduleStart = source.lastIndexOf(url);
  final head = source.substring(0, moduleStart);
  final tail = source.substring(moduleStart);
  final render = RegExp(
    r'([A-Za-z_$][\w$]*)\.render\(([A-Za-z_$][\w$]*),([A-Za-z_$][\w$]*)\)',
  );
  _anchors(render.allMatches(tail), 'scene render in module tail', 2);
  final guardedTail = tail.replaceAllMapped(
    render,
    (match) =>
        'globalThis.__JSR_PROBE_RENDER(${match[1]},${match[2]},${match[3]})',
  );

  // The scaffold is PREPENDED: the floor recorder runs during module init,
  // before the IIFE tail executes.
  return 'globalThis.__JSR_PROBE={floorRepeat:"unreached",renderOk:0,'
          'renderErrors:0,allOk:0,allErrors:0,allCode:"unreached",'
          'allFeature:"unreached",allMsg:"unreached"};'
          'globalThis.__JSR_PROBE_EXPORT=function(){try{'
          'var p=globalThis.__JSR_PROBE;'
          'if(globalThis.jsr&&jsr.exportState)jsr.exportState({probe:{'
          'floorRepeat:p.floorRepeat,renderOk:p.renderOk,'
          'renderErrors:p.renderErrors,allOk:p.allOk,'
          'allErrors:p.allErrors,allCode:p.allCode,'
          'allFeature:p.allFeature,allMsg:p.allMsg}})'
          '}catch(e){}};'
          'globalThis.__JSR_PROBE_FLOOR=function(tex,x,y){'
          'var p=globalThis.__JSR_PROBE;'
          'p.floorRepeat=[x,y];'
          'tex.repeat.set(1,1);'
          'globalThis.__JSR_PROBE_EXPORT()};'
          'globalThis.__JSR_PROBE_RENDER=function(r,s,c){try{'
          'var out=r.render(s,c);globalThis.__JSR_PROBE.renderOk++;'
          'if(globalThis.__JSR_PROBE.renderOk%5===0)'
          'globalThis.__JSR_PROBE_EXPORT();return out}catch(e){'
          'var p=globalThis.__JSR_PROBE;p.renderErrors++;'
          "if(p.renderErrors===1){p.allCode=String(e.code||'');"
          "p.allFeature=String(e.feature||'');"
          "p.allMsg=String(e.message||'')}"
          'globalThis.__JSR_PROBE_EXPORT();throw e}};'
          ';(function(){var __R=THREE.WebGLRenderer.prototype,__o=__R.render;'
          '__R.render=function(sc,ca){var q=globalThis.__JSR_PROBE;'
          'try{var out=__o.call(this,sc,ca);q.allOk++;'
          'if(q.allOk%3===0)globalThis.__JSR_PROBE_EXPORT();return out}'
          'catch(e){q.allErrors++;'
          "if(q.allErrors===1){q.allCode=String(e.code||'');"
          "q.allFeature=String(e.feature||'');"
          "q.allMsg=String(e.message||'')}"
          'globalThis.__JSR_PROBE_EXPORT();throw e}}})();' +
      head +
      guardedTail;
}
