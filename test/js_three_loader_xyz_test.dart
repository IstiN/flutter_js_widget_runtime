import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';
import 'support/three_patch_once.dart' as patch_support;
import 'support/three_probe_state.dart';

/// webgl_loader_xyz — official r186 XYZLoader example, healthy on the
/// native THREE R1 pipeline.
///
/// The module loads `models/xyz/helix_201.xyz` (embedded as the new
/// application/octet-stream asset lane, 9264 decoded bytes = 203 text
/// lines, of which 2 are `#` comment headers → **201 point vertices**),
/// centers the parsed geometry and renders ONE `THREE.Points` with
/// `PointsMaterial({size: 0.1, vertexColors: false})` (the prepared
/// helix carries no color attribute). The animation loop spins the
/// points (rotation.x += delta*0.2, rotation.y += delta*0.5) via a
/// `THREE.Timer`.
///
/// R1 verdict: PASS. Exactly one draw plan entry (points primitive,
/// pointsBasic material, non-indexed 201 vertices), zero triangles,
/// no lights, and the XYZLoader onLoad probe fires with the exact
/// official data size.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'loader xyz example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_loader_xyz renders the 201-point helix Points from the '
      'embedded octet-stream asset', (tester) async {
    // Part 1 — the unmodified widget renders the official scene.
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-loader-xyz',
      instanceId: 'three-loader-xyz-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount >= 1 &&
          plan.draws.length >= 1 &&
          state.submittedFrameCount >= 1,
    );
    harness.expectHealthy('webgl_loader_xyz');
    final plan = harness.plan!;
    final state = harness.state!;
    final exported = harness.engine.exportedState!;

    // The widget registered its embedded octet-stream model asset.
    final assets = exported['assets'] as Map<String, dynamic>;
    final helix = assets['models/xyz/helix_201.xyz'] as Map<String, dynamic>;
    expect(helix['registered'], isTrue);
    expect(helix['bytes'], 9264);

    // Official data cross-check: 9264 bytes = 203 lines, 2 of which are
    // '#' comments → exactly 201 XYZ points for the draw to carry.
    final xyzLines = File(
      'example/widgets/three-loader-xyz/helix_201.xyz',
    ).readAsLinesSync();
    final dataLines = xyzLines
        .where((line) => line.trim().isNotEmpty && !line.startsWith('#'))
        .length;
    expect(dataLines, 201);
    expect(helix['bytes'], xyzLines.join('\n').length + 1);

    // ONE draw: the helix Points. PointsMaterial size 0.1, white,
    // vertexColors false (no color attribute in the prepared file).
    expect(plan.draws, hasLength(1));
    expect(state.geometryUploadCount, 1);
    expect(state.materials, hasLength(1));
    final draw = plan.draws.single;
    expect(draw.primitive, ThreeDrawPrimitive.points);
    expect(draw.material.kind, JsThreeMaterialKind.pointsBasic);
    expect(draw.geometry.vertexCount, 201);
    expect(draw.drawCount, 201);
    expect(draw.indexed, isFalse);
    expect(draw.geometry.indexCount, 0);
    expect(draw.geometry.colors, isNull);
    expect(draw.material.pointSize, closeTo(0.1, 0.001));
    expect(draw.material.colorR, 1);
    expect(draw.material.colorG, 1);
    expect(draw.material.colorB, 1);
    expect(draw.material.transparent, isFalse);

    // Points draw no triangles and the module registers no lights.
    expect(plan.triangleCount, 0);
    expect(plan.directionalLights, isEmpty);
    expect(plan.spotLights, isEmpty);
    expect(plan.pointLights, isEmpty);
    expect(plan.hemisphereLights, isEmpty);
    final frame = plan.frame!;
    expect(frame.hasShadow, isFalse);

    // PerspectiveCamera(50, aspect, 0.1, 100) at (10, 7, 10).
    expect(plan.cameraPosition.x, closeTo(10, 0.001));
    expect(plan.cameraPosition.y, closeTo(7, 0.001));
    expect(plan.cameraPosition.z, closeTo(10, 0.001));

    await harness.dispose(tester);

    // Part 2 — instrumented copy of the same widget.js proving the
    // XYZLoader pipeline inside QuickJS: the loader onLoad fires with
    // the exact official vertex count, geometry.center() ran on a
    // colorless geometry, and renderer.render() succeeds every tick.
    var source = _xyzProbeSource();
    final probe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: source,
      instanceId: 'three-loader-xyz-probe',
    );
    Map<String, dynamic>? findings;
    for (var attempt = 0; attempt < 120; attempt++) {
      findings = probeFindings(probe);
      final ready = findings != null &&
          (findings['xyzOnLoad'] as int? ?? 0) > 0 &&
          (findings['renders'] as int? ?? 0) > 3;
      if (ready) break;
      await probe.pumpFrame(tester);
    }
    expect(findings, isNotNull, reason: 'probe findings never exported');
    expect(findings!['xyzOnLoad'], 1);
    // XYZLoader parsed exactly the 201 official data lines.
    expect(findings['positionCount'], 201);
    // The prepared helix carries no color attribute → vertexColors false.
    expect(findings['hasColorAttribute'], isFalse);
    // The animation loop renders successfully on R1 — no capability
    // error of any kind on this module.
    expect(findings['renders'] as int, greaterThan(3));
    expect(findings['renderErrors'], 0);
    expect(findings['renderFeature'], '');

    await probe.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}


/// Label-first wrapper around the shared patchOnce (matches exactly once).
String patchOnce(
  String label,
  String source,
  RegExp re,
  String Function(Match) build,
) =>
    patch_support.patchOnce(source, label, re, build);

/// The xyz widget.js instrumented with a state-flag probe. Findings live
/// on `globalThis.__JSR_PROBE` and are re-exported via
/// `jsr.exportState({probe})` — no console-log retention dependence.
///
/// Two structural, name-independent injections (minified identifiers
/// drift on every re-prepare; `$` allowed in identifiers):
/// 1. the XYZLoader onLoad callback, anchored on the registered asset
///    URL, records the parsed position count and color-attribute fact;
/// 2. the module tail's final `render(scene,camera)` call (the bundle
///    ends with it) routes through a guarded wrapper counting successful
///    renders and the first failure, if any.
String _xyzProbeSource() {
  var source = File(
    'example/widgets/three-loader-xyz/widget.js',
  ).readAsStringSync();

  // Anchor 1 — XYZLoader onLoad (unique via the embedded asset URL).
  source = patchOnce(
    'xyz onLoad',
    source,
    RegExp(r'\.load\("models/xyz/helix_201\.xyz",function\(([\w$]+)\)\{'),
    (m) => '${m[0]}globalThis.__JSR_PROBE.xyzOnLoad++,'
        'globalThis.__JSR_PROBE.positionCount='
        '${m[1]}.attributes.position.count,'
        'globalThis.__JSR_PROBE.hasColorAttribute='
        '${m[1]}.hasAttribute("color")===!0,',
  );

  // Anchor 2 — the module tail render call. Scoped to the tail after the
  // asset URL so embedded library code cannot match; anchored at the
  // bundle end `...render(scene,camera)}})();`.
  final moduleStart = source.lastIndexOf('helix_201.xyz');
  final head = source.substring(0, moduleStart);
  var tail = source.substring(moduleStart);
  tail = patchOnce(
    'module tail render',
    tail,
    RegExp(r'([\w$]+)\.render\(([\w$]+),([\w$]+)\)\}\}\)\(\);'),
    (m) => 'globalThis.__JSR_PROBE_RENDER(${m[1]},${m[2]},${m[3]})}})();',
  );

  return head +
      tail +
      'globalThis.__JSR_PROBE={xyzOnLoad:0,positionCount:0,'
          'hasColorAttribute:false,renders:0,renderErrors:0,'
          'renderCode:"",renderFeature:"",renderMsg:""};'
          'globalThis.__JSR_PROBE_EXPORT=function(){try{'
          'var p=globalThis.__JSR_PROBE;'
          'if(globalThis.jsr&&jsr.exportState)jsr.exportState({probe:{'
          'xyzOnLoad:p.xyzOnLoad,positionCount:p.positionCount,'
          'hasColorAttribute:p.hasColorAttribute,renders:p.renders,'
          'renderErrors:p.renderErrors,renderCode:p.renderCode,'
          'renderFeature:p.renderFeature,renderMsg:p.renderMsg}})'
          '}catch(e){}};'
          'globalThis.__JSR_PROBE_RENDER=function(r,s,c){try{'
          'r.render(s,c);globalThis.__JSR_PROBE.renders++}catch(e){'
          'var p=globalThis.__JSR_PROBE;'
          'if(p.renderErrors===0){p.renderCode=String(e.code||"");'
          'p.renderFeature=String(e.feature||"");'
          'p.renderMsg=String(e.message||"")}p.renderErrors++}'
          'globalThis.__JSR_PROBE_EXPORT()};';
}
