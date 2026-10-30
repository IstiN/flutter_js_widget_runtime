import 'dart:io';
import 'dart:math' as math;

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart'
    show ThreeDrawPrimitive;

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';
import 'support/three_patch_once.dart' as patch_support;
import 'support/three_probe_state.dart';

/// webgl_geometry_text_shapes — official r186 FontLoader example, healthy
/// on the native THREE R1 pipeline (exercises the NEW application/json
/// asset lane for typeface fonts).
///
/// The module loads `fonts/helvetiker_regular.typeface.json`
/// (embedded base64, 63182 decoded bytes), calls
/// `font.generateShapes('   Three.js\nSimple text.', 100)` and builds:
///
/// - ONE transparent `MeshBasicMaterial` fill mesh: `ShapeGeometry` of
///   all 21 glyph shapes (r186 Earcut triangulation → 2173 verts /
///   6423 indices = 2141 triangles), color 0x0069, opacity 0.4,
///   DoubleSide, positioned at z=-150;
/// - 26 `LineBasicMaterial` outlines (21 glyph shapes + 5 pushed hole
///   contours), sharing `matDark` (same 0x0069, DoubleSide), via
///   `BufferGeometry.setFromPoints(shape.getPoints())`;
/// - an `OrbitControls` that re-renders on change (the module has NO
///   animation loop — `render()` runs once after the font loads).
///
/// Note this example does NOT use `TextGeometry` (that is
/// webgl_geometry_text); the generateShapes+ShapeGeometry path it uses
/// is fully shimmed in R1.
///
/// R1 verdict: PASS.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'geometry text shapes example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_geometry_text_shapes renders the font fill mesh and 26 '
      'outline lines from the embedded typeface.json asset',
      (tester) async {
    // Part 1 — the unmodified widget renders the official scene.
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-geometry-text-shapes',
      instanceId: 'three-geometry-text-shapes-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount >= 27 &&
          plan.draws.length >= 27 &&
          state.submittedFrameCount >= 1,
    );
    harness.expectHealthy('webgl_geometry_text_shapes');
    final plan = harness.plan!;
    final state = harness.state!;
    final exported = harness.engine.exportedState!;

    // NEW asset lane: the typeface font registers as application/json.
    final assets = exported['assets'] as Map<String, dynamic>;
    final font =
        assets['fonts/helvetiker_regular.typeface.json'] as Map<String, dynamic>;
    expect(font['registered'], isTrue);
    expect(font['bytes'], 63182);

    // 26 outline line draws + 1 transparent fill mesh.
    expect(plan.draws, hasLength(27));
    expect(state.geometryUploadCount, 27);
    expect(state.materials, hasLength(2));
    expect(plan.opaque, hasLength(26));
    expect(plan.transparent, hasLength(1));

    // The fill mesh: ShapeGeometry of all glyph shapes.
    final mesh = plan.transparent.single;
    expect(mesh.primitive, ThreeDrawPrimitive.triangles);
    expect(mesh.material.kind, JsThreeMaterialKind.meshBasic);
    expect(mesh.material.transparent, isTrue);
    expect(mesh.material.opacity, closeTo(0.4, 0.001));
    expect(mesh.material.side, JsThreeSide.double);
    // color 0x0069 — sRGB 0x66/0x99 → linear channels.
    expect(mesh.material.colorR, 0);
    expect(mesh.material.colorG, closeTo(_linearOf(0x66), 0.01));
    expect(mesh.material.colorB, closeTo(_linearOf(0x99), 0.01));
    expect(mesh.material.mapTextureId, 0);
    expect(mesh.indexed, isTrue);
    expect(mesh.geometry.vertexCount, 2173);
    expect(mesh.geometry.indexCount, 6423);
    expect(mesh.drawCount, 6423);
    // 6423/3 = 2141 filled triangles.
    expect(mesh.drawCount ~/ 3, 2141);
    expect(plan.triangleCount, 2141);

    // The 26 outline lines share one matDark line material.
    final lines = plan.opaque;
    for (final line in lines) {
      expect(line.primitive, ThreeDrawPrimitive.lines);
      expect(line.material.kind, JsThreeMaterialKind.lineBasic);
      expect(line.material.side, JsThreeSide.double);
      expect(line.material.transparent, isFalse);
      expect(line.material.colorR, 0);
      expect(line.material.colorG, closeTo(_linearOf(0x66), 0.01));
      expect(line.material.colorB, closeTo(_linearOf(0x99), 0.01));
      // Closed shapes: the getPoints list drops the duplicate closing
      // vertex; R1's line-list conversion emits segments*2 indices.
      expect(line.geometry.indexCount, (line.geometry.vertexCount - 1) * 2);
    }
    // Every line draw shares the same material id (single matDark).
    expect(lines.map((line) => line.material.materialId).toSet(), hasLength(1));

    // No lights anywhere (both materials are unlit), background 0xf0f0f0.
    expect(plan.directionalLights, isEmpty);
    expect(plan.pointLights, isEmpty);
    expect(plan.hemisphereLights, isEmpty);
    expect(plan.spotLights, isEmpty);
    expect(plan.background.r, closeTo(_linearOf(0xf0), 0.01));
    expect(plan.background.g, closeTo(_linearOf(0xf0), 0.01));
    expect(plan.background.b, closeTo(_linearOf(0xf0), 0.01));

    await harness.dispose(tester);

    // Part 2 — instrumented copy of the same widget.js proving the
    // FontLoader pipeline inside QuickJS: the typeface.json onLoad fires
    // exactly once, generateShapes produces the official 21 glyph
    // shapes (+5 hole contours → 26 outline lines, matching part 1's
    // line-draw count), and the on-demand render() succeeds on R1.
    final probe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: _textProbeSource(),
      instanceId: 'three-geometry-text-shapes-probe',
    );
    Map<String, dynamic>? findings;
    for (var attempt = 0; attempt < 120; attempt++) {
      findings = probeFindings(probe);
      final ready = findings != null &&
          (findings['fontOnLoad'] as int? ?? 0) > 0 &&
          (findings['shapes'] as int? ?? 0) > 0 &&
          (findings['renders'] as int? ?? 0) > 0;
      if (ready) break;
      await probe.pumpFrame(tester);
    }
    expect(findings, isNotNull, reason: 'probe findings never exported');
    expect(findings!['fontOnLoad'], 1);
    expect(findings['fontType'], isNotEmpty);
    // 21 glyph shapes for '   Three.js\nSimple text.' at size 100.
    expect(findings['shapes'], 21);
    // 5 pushed hole contours (glyph counters: e/e/e/p + one more).
    expect(findings['holes'], 5);
    // 21 + 5 = 26 outline line draws — the part-1 opaque count.
    expect(
      (findings['shapes'] as int) + (findings['holes'] as int),
      26,
    );
    // The module's on-demand render() succeeded on R1.
    expect(findings['renders'] as int, greaterThanOrEqualTo(1));
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

/// The text-shapes widget.js instrumented with a state-flag probe.
/// Findings live on `globalThis.__JSR_PROBE` and are re-exported via
/// `jsr.exportState({probe})` — no console-log retention dependence.
///
/// Structural, name-independent injections (minified identifiers drift
/// on every re-prepare; `$` allowed in identifiers):
/// 1. the FontLoader onLoad callback, anchored on the registered asset
///    URL, counts entries;
/// 2. the `=X.generateShapes(` call site routes through an instance
///    wrapper that records the produced shape count (the wrapper must
///    return the font instance itself — the call site invokes
///    `.generateShapes(...)` on it);
/// 3. the hole-contour spread push (`arr.push(...holes)`) records the
///    hole count;
/// 4. the module tail's `function X(){R.render(S,C)}` routes through a
///    guarded wrapper counting successful renders and the first
///    failure, if any.
String _textProbeSource() {
  var source = File(
    'example/widgets/three-geometry-text-shapes/widget.js',
  ).readAsStringSync();

  source = patchOnce(
    'font onLoad',
    source,
    RegExp(
      r'\.load\("fonts/helvetiker_regular\.typeface\.json",'
      r'function\(([\w$]+)\)\{',
    ),
    (m) => '${m[0]}globalThis.__JSR_PROBE.fontOnLoad++;',
  );

  source = patchOnce(
    'generateShapes call',
    source,
    RegExp(r'=([\w$]+)\.generateShapes\('),
    (m) => '=globalThis.__JSR_PROBE_FONT(${m[1]}).generateShapes(',
  );

  source = patchOnce(
    'holes push',
    source,
    RegExp(r'\.push\(\.\.\.([\w$]+)\)'),
    (m) => '.push(...${m[1]}),globalThis.__JSR_PROBE_HOLES(${m[1]})',
  );

  // The module tail render — scoped to the module code after the font
  // URL so embedded library code cannot match.
  final moduleStart = source.lastIndexOf('helvetiker_regular.typeface.json');
  final head = source.substring(0, moduleStart);
  var tail = source.substring(moduleStart);
  tail = patchOnce(
    'module tail render',
    tail,
    RegExp(r'function ([\w$]+)\(\)\{([\w$]+)\.render\(([\w$]+),([\w$]+)\)\}'),
    (m) => 'function ${m[1]}(){globalThis.__JSR_PROBE_RENDER('
        '${m[2]},${m[3]},${m[4]})}',
  );

  return head +
      tail +
      'globalThis.__JSR_PROBE={fontOnLoad:0,fontType:"unreached",shapes:0,'
      'holes:0,renders:0,renderErrors:0,renderCode:"",renderFeature:"",'
      'renderMsg:""};'
      'globalThis.__JSR_PROBE_FONT=function(f){var p=globalThis.__JSR_PROBE;'
      'p.fontType=f&&f.constructor&&f.constructor.name||"font";'
      'var orig=f.generateShapes;'
      'f.generateShapes=function(msg,size){'
      'var r=orig.call(f,msg,size);p.shapes=r.length;return r};'
      'return f};'
      'globalThis.__JSR_PROBE_HOLES=function(h){var p=globalThis.__JSR_PROBE;'
      'p.holes=h.length};'
      'globalThis.__JSR_PROBE_EXPORT=function(){try{'
      'var p=globalThis.__JSR_PROBE;'
      'if(globalThis.jsr&&jsr.exportState)jsr.exportState({probe:{'
      'fontOnLoad:p.fontOnLoad,fontType:p.fontType,shapes:p.shapes,'
      'holes:p.holes,renders:p.renders,renderErrors:p.renderErrors,'
      'renderCode:p.renderCode,renderFeature:p.renderFeature,'
      'renderMsg:p.renderMsg}})}catch(e){}};'
      'globalThis.__JSR_PROBE_RENDER=function(r,s,c){try{'
      'r.render(s,c);globalThis.__JSR_PROBE.renders++}catch(e){'
      'var p=globalThis.__JSR_PROBE;'
      'if(p.renderErrors===0){p.renderCode=String(e.code||"");'
      'p.renderFeature=String(e.feature||"");'
      'p.renderMsg=String(e.message||"")}p.renderErrors++}'
      'globalThis.__JSR_PROBE_EXPORT()};';
}

/// sRGB channel (0..255) → linear, matching THREE.Color's working space.
double _linearOf(int channel8) {
  final value = channel8 / 255;
  return value <= 0.04045
      ? value / 12.92
      : math.pow((value + 0.055) / 1.055, 2.4).toDouble();
}
