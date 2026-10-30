import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// webgl_geometry_spline_editor — R1 with ShadowMaterial (kind 7).
///
/// The official module builds a shadow-catcher plane with
/// `new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.2 })`
/// (official_module.js:67) under a shadow-casting SpotLight, renders a
/// CatmullRomCurve3 through TubeGeometry/line handles and drives lil-gui
/// with folders plus gui.add(function) buttons (addPoint/removePoint/
/// exportSpline). This example motivated the ShadowMaterial wire kind:
/// encoder `materialKind()` (tool/three/src/native_renderer.js), decoder
/// `JsThreeMaterialKind.shadow(7)`
/// (lib/src/renderer/nodes/three/js_three_protocol.dart), the
/// shadow-factor-as-alpha fragment branch (shaders/three_r1.frag) and the
/// mesh-material compatibility row (three_draw_plan.dart).
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test('spline editor example', () {},
        skip: 'QuickJS native library is not available');
    return;
  }

  testWidgets('webgl_geometry_spline_editor renders the spline with a '
      'ShadowMaterial catcher', (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-geometry-spline-editor',
      instanceId: 'three-geometry-spline-editor-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount > 0 &&
          plan.draws.isNotEmpty &&
          state.submittedFrameCount >= 1,
    );
    harness.expectHealthy('webgl_geometry_spline_editor');

    final state = harness.state!;
    final plan = harness.plan!;

    // The spline tube + sample handles + grid helper + shadow plane draw.
    expect(plan.draws, isNotEmpty);
    expect(plan.draws.length, greaterThanOrEqualTo(2));

    // Exactly one SpotLight, and it is the shadow owner (castShadow).
    expect(plan.spotLights, hasLength(1));
    final frame = plan.frame!;
    expect(frame.hasShadow, isTrue);
    expect(frame.hasSpotShadow, isTrue);

    // The ShadowMaterial catcher arrived as the dedicated wire kind and is
    // a transparent draw (invisible where lit, shadowed where shadowed).
    expect(
      state.materials.values.map((material) => material.kind),
      contains(JsThreeMaterialKind.shadow),
    );
    final shadowMaterial = state.materials.values
        .singleWhere((material) => material.kind == JsThreeMaterialKind.shadow);
    expect(shadowMaterial.transparent, isTrue);

    // GUI diagnostics from the module's lil-gui usage: folders with the
    // tension slider and the three function buttons.
    final exported = harness.engine.exportedState!;
    final guiValues =
        (exported['gui'] as Map<String, dynamic>)['values'] as List<dynamic>;
    expect(
      guiValues.map((value) => (value as Map<String, dynamic>)['property']),
      containsAll(<String>['uniform', 'tension', 'addPoint', 'exportSpline']),
    );
    expect(
      guiValues
          .where((value) =>
              (value as Map<String, dynamic>)['kind'] == 'function')
          .length,
      3,
    );

    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 120)));
}
