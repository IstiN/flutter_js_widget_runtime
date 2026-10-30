import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// webgl_geometry_cube — the official r186 spinning crate on the native R1
/// pipeline.
///
/// The module is minimal by design: `TextureLoader().load('textures/crate.gif')`
/// feeding a `MeshBasicMaterial({map})` on a stock `BoxGeometry`, animated by
/// `mesh.rotation.x += 0.005; mesh.rotation.y += 0.01` inside
/// `renderer.setAnimationLoop`. It is also the first wave-2 consumer of the
/// NEW `image/gif` asset lane (crate.gif, 119768 bytes, embedded base64;
/// the pinned three.js asset ships PNG bytes under the historic .gif name).
///
/// Verdict — RENDER-WITH-GAP. The scene graph, geometry, material and the
/// RAF rotation loop are fully healthy (1 draw, 36 indices, matrices drifting
/// every frame), but the crate texture never binds. Pinned root cause: the
/// runtime texture lane rejects GIF bytes outright —
/// `tool/three/src/native_loaders.js:76` (`encoding(record)` only accepts PNG
/// magic, JPEG magic, `image/png`/`image/jpeg` mimes, or registered raw
/// RGBA8) throws `assetFailure('only PNG, JPEG, or registered raw RGBA8
/// bytes are supported')` for the `GIF89a` bytes before any
/// `ui.instantiateImageCodec` decode could run. JsrTextureLoader then swallows
/// the failure because the official module passes no `onError`
/// (`tool/three/src/native_loaders.js:120-123`), so the cube keeps rendering
/// untextured white — no error card, `textureUploadCount` stays 0 and the
/// material upsert keeps `mapTextureId == 0`.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'geometry cube example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_geometry_cube renders the rotating textured box: the '
      'crate.gif asset carries PNG bytes and binds through the texture lane',
      (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-geometry-cube',
      instanceId: 'three-geometry-cube-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount >= 1 &&
          plan.draws.isNotEmpty &&
          state.submittedFrameCount >= 2,
    );
    harness.expectHealthy('webgl_geometry_cube');
    final exported = harness.engine.exportedState!;
    final plan = harness.plan!;
    final state = harness.state!;

    // The NEW image/gif asset lane registered the embedded crate bytes.
    final assets = exported['assets'] as Map<String, dynamic>;
    final crate = assets['textures/crate.gif'] as Map<String, dynamic>;
    expect(crate['registered'], isTrue);
    expect(crate['bytes'], 119768);
    // No GUI in this official module.
    expect((exported['gui'] as Map<String, dynamic>)['controllers'], 0);

    // BoxGeometry + MeshBasicMaterial: exactly one indexed draw of the
    // default 24-vertex / 36-index box.
    expect(plan.draws, hasLength(1));
    expect(state.geometryUploadCount, 1);
    expect(state.materials, hasLength(1));
    final draw = plan.draws.single;
    expect(draw.node.objectKind, JsThreeObjectKind.mesh);
    expect(draw.indexed, isTrue);
    expect(draw.drawCount, 36); // 12 BoxGeometry triangles
    expect(draw.geometry.vertexCount, 24);
    expect(draw.geometry.indexCount, 36);
    expect(draw.material.kind, JsThreeMaterialKind.meshBasic);
    // MeshBasicMaterial({map}) keeps the default white base color.
    expect(draw.material.colorR, closeTo(1, 0.001));
    expect(draw.material.colorG, closeTo(1, 0.001));
    expect(draw.material.colorB, closeTo(1, 0.001));

    // The crate.gif asset is PNG-encoded (three.js ships PNG bytes under
    // the historic .gif name), so the PNG/JPEG/raw gate accepts it: the
    // material upsert binds the decoded texture and the lane uploads it.
    expect(draw.material.mapTextureId, greaterThan(0));
    expect(state.textureUploadCount, 1);
    expect(state.textures, hasLength(1));

    // The RAF loop is alive and the official animate() rotation increments
    // reach the wire: the mesh matrixWorld drifts between samples.
    final mesh = state.nodes.values
        .singleWhere((node) => node.objectKind == JsThreeObjectKind.mesh);
    final matrixA = Float32List.fromList(mesh.matrixWorld);
    final framesA = state.submittedFrameCount;
    await harness.pumpFrames(tester, 30);
    final matrixB = Float32List.fromList(
      state.nodes.values
          .singleWhere((node) => node.objectKind == JsThreeObjectKind.mesh)
          .matrixWorld,
    );
    expect(state.submittedFrameCount, greaterThan(framesA + 20));
    var differs = false;
    for (var i = 0; i < matrixA.length; i++) {
      if (matrixA[i] != matrixB[i]) {
        differs = true;
        break;
      }
    }
    expect(differs, isTrue,
        reason: 'rotation.x += 0.005 / rotation.y += 0.01 must drift the '
            'mesh matrixWorld between frames; frame payloads identical');

    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('crate.gif probe: the PNG-encoded asset loads without an '
      'onError while every RAF render succeeds', (tester) async {
    // State-flag probe (no log scraping): an onError callback is appended to
    // the unique texture load call and the animate loop's render call is
    // routed through a counting wrapper. Findings land on
    // globalThis.__JSR_PROBE and are re-exported via jsr.exportState.
    final probe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: _cubeProbeSource(),
      instanceId: 'three-geometry-cube-gap-probe',
    );
    final report = await _awaitProbe(probe, tester) ?? const <String, dynamic>{};

    // The registered asset reaches JsrTextureLoader and decodes as PNG —
    // no onError fires (the historic GIF-rejection gap closed when the
    // pinned three.js asset switched to PNG bytes).
    expect(report['gifErrors'], 0);
    expect(report['gifMessage'], 'unreached');

    // The rest of the pipeline is healthy: the official animate() ran and
    // every renderer.render() succeeded on the untextured fallback.
    expect(report['animateCalls'] as int? ?? 0, greaterThan(10));
    expect(report['renderErrors'], 0);
    expect(report['renderOk'] as int? ?? 0, greaterThan(10));

    // And the probe surface mirrors the unmodified widget: frames submitted
    // with the decoded crate texture uploaded.
    final state = probe.state;
    expect(state, isNotNull);
    expect(state!.submittedFrameCount, greaterThan(10));
    expect(state.textureUploadCount, 1);

    await probe.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}

/// Pumps until the probe has recorded its GIF load failure AND the RAF
/// counter exports have landed (renders export every 5th success), then
/// returns the latest collector.
Future<Map<String, dynamic>?> _awaitProbe(
  ThreeQuickjsExampleHarness probe,
  WidgetTester tester,
) async {
  Map<String, dynamic>? latest;
  for (var attempt = 0; attempt < 90; attempt++) {
    final exported = probe.engine.exportedState;
    final probeState = exported?['probe'];
    if (probeState is Map) {
      latest = probeState.cast<String, dynamic>();
      if ((latest['renderOk'] as int? ?? 0) > 10 &&
          (latest['animateCalls'] as int? ?? 0) > 10) {
        return latest;
      }
    }
    await probe.pumpFrame(tester);
  }
  return latest;
}

/// Loud guard for the structural probe anchors: every anchor must match
/// exactly once in the re-minified bundle or the probe refuses to run
/// (re-prepare changes widget.js bytes and minified identifiers — never
/// anchor on exact minified names).
List<RegExpMatch> _singleAnchor(Iterable<RegExpMatch> matches, String what) {
  final list = matches.toList();
  if (list.length != 1) {
    throw StateError(
      'cube probe: expected exactly 1 $what anchor, found ${list.length}',
    );
  }
  return list;
}

/// The cube widget.js instrumented with a state-flag probe. The injections
/// are structural (string literals + identifier-shape regexes) so they
/// survive re-minification:
/// 1. the unique `load("textures/crate.gif")` call gains an onError callback
///    that records the runtime asset failure;
/// 2. the animate loop's render call is scoped to the module tail (after the
///    asset URL) and wrapped in a counting guard.
String _cubeProbeSource() {
  const url = 'textures/crate.gif';
  var source = File(
    'example/widgets/three-geometry-cube/widget.js',
  ).readAsStringSync();

  // Anchor 1 — the texture load (exactly one occurrence). onError is the
  // 4th load() parameter; the module passes none, which is why the
  // unmodified widget fails silently.
  final load = RegExp('\\.load\\("${RegExp.escape(url)}"\\)');
  _singleAnchor(load.allMatches(source), 'crate.gif load call');
  source = source.replaceFirst(
    '.load("$url")',
    '.load("$url",undefined,undefined,globalThis.__JSR_PROBE_GIFERR)',
  );

  // Anchor 2 — the animate function's render call, scoped to the module tail
  // after the asset URL so embedded library code cannot match.
  final moduleStart = source.lastIndexOf(url);
  final head = source.substring(0, moduleStart);
  final tail = source.substring(moduleStart);
  final renderFn = RegExp(
    r'function ([A-Za-z_$][\w$]*)\(\)\{([A-Za-z_$][\w$]*)\.rotation\.x\+='
    r'\.005,([A-Za-z_$][\w$]*)\.rotation\.y\+=\.01,'
    r'([A-Za-z_$][\w$]*)\.render\(([A-Za-z_$][\w$]*),([A-Za-z_$][\w$]*)\)\}',
  );
  _singleAnchor(renderFn.allMatches(tail), 'animate render in module tail');
  final guardedTail = tail.replaceFirstMapped(
    renderFn,
    (match) =>
        'function ${match[1]}(){'
        'globalThis.__JSR_PROBE.animateCalls++,'
        '${match[2]}.rotation.x+=.005,${match[3]}.rotation.y+=.01,'
        'globalThis.__JSR_PROBE_RENDER(${match[4]},${match[5]},${match[6]})}',
  );

  // The scaffold is PREPENDED: the onError reference is evaluated during
  // module init, before the IIFE tail runs.
  return 'globalThis.__JSR_PROBE={gifErrors:0,gifMessage:"unreached",'
          'animateCalls:0,renderOk:0,renderErrors:0,renderCode:"unreached"};'
          'globalThis.__JSR_PROBE_EXPORT=function(){try{'
          'var p=globalThis.__JSR_PROBE;'
          'if(globalThis.jsr&&jsr.exportState)jsr.exportState({probe:{'
          'gifErrors:p.gifErrors,gifMessage:p.gifMessage,'
          'animateCalls:p.animateCalls,renderOk:p.renderOk,'
          'renderErrors:p.renderErrors,renderCode:p.renderCode}})'
          '}catch(e){}};'
          'globalThis.__JSR_PROBE_GIFERR=function(e){'
          'var p=globalThis.__JSR_PROBE;p.gifErrors++;'
          'p.gifMessage=String(e&&e.message||e);'
          'globalThis.__JSR_PROBE_EXPORT()};'
          'globalThis.__JSR_PROBE_RENDER=function(r,s,c){try{'
          'var out=r.render(s,c);globalThis.__JSR_PROBE.renderOk++;'
          'if(globalThis.__JSR_PROBE.renderOk%5===0)'
          'globalThis.__JSR_PROBE_EXPORT();return out}catch(e){'
          'var p=globalThis.__JSR_PROBE;p.renderErrors++;'
          'p.renderCode=String(e.code||"");'
          'globalThis.__JSR_PROBE_EXPORT();throw e}};' +
      head +
      guardedTail;
}
