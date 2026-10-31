import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_example_render_contract.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets(
    'webgl_buffergeometry_attributes_none bakes procedural vertices',
    (tester) async {
      final (harness, plan) = await renderThreeExampleStrict(
        tester,
        'three-buffergeometry-attributes-none',
      );
      expect(plan.draws, hasLength(1));
      final draw = plan.draws.single;
      expect(draw.primitive, ThreeDrawPrimitive.triangles);
      expect(draw.drawCount, 30000);
      expect(draw.drawCount % 3, 0);
      expect(draw.material.kind, JsThreeMaterialKind.meshBasic);
      expect(draw.material.vertexColors, isTrue);
      expect(harness.state!.textureUploadCount, 0);
      expect(harness.state!.geometryUploadCount, 1);
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 180)),
  );

  testWidgets('webgl_buffergeometry_selective_draw filters hidden segments', (
    tester,
  ) async {
    final (harness, plan) = await renderThreeExampleStrict(
      tester,
      'three-buffergeometry-selective-draw',
    );
    expect(plan.draws, hasLength(1));
    final draw = plan.draws.single;
    expect(draw.primitive, ThreeDrawPrimitive.lines);
    expect(draw.drawCount, greaterThan(0));
    expect(draw.drawCount % 2, 0);
    expect(draw.material.kind, JsThreeMaterialKind.lineBasic);
    expect(draw.material.vertexColors, isTrue);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_interactive_points retains textured colored points', (
    tester,
  ) async {
    final (harness, plan) = await renderThreeExampleStrict(tester, 'three-interactive-points');
    expect(plan.draws, hasLength(1));
    final draw = plan.draws.single;
    expect(draw.primitive, ThreeDrawPrimitive.points);
    expect(draw.drawCount, 1538);
    expect(draw.material.kind, JsThreeMaterialKind.pointsBasic);
    expect(draw.material.vertexColors, isTrue);
    expect(draw.material.mapTextureId, greaterThan(0));
    expect(draw.material.pointSize, greaterThan(0));
    expect(harness.state!.textureUploadCount, 1);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets(
    'webgl_points_waves animates positions with a native disc sprite',
    (tester) async {
      final (harness, plan) = await renderThreeExampleStrict(tester, 'three-points-waves');
      expect(plan.draws, hasLength(1));
      final draw = plan.draws.single;
      expect(draw.primitive, ThreeDrawPrimitive.points);
      expect(draw.drawCount, 2500);
      expect(draw.material.kind, JsThreeMaterialKind.pointsBasic);
      expect(draw.material.vertexColors, isFalse);
      expect(draw.material.colorR, 1);
      expect(draw.material.colorG, 1);
      expect(draw.material.colorB, 1);
      expect(draw.material.mapTextureId, greaterThan(0));
      expect(draw.material.alphaTest, greaterThan(0));
      expect(harness.state!.textureUploadCount, 1);
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 180)),
  );

  testWidgets('webgl_modifier_tessellation evaluates displacement and color', (
    tester,
  ) async {
    final (harness, plan) = await renderThreeExampleStrict(
      tester,
      'three-modifier-tessellation',
    );
    expect(plan.draws, hasLength(1));
    final draw = plan.draws.single;
    expect(draw.primitive, ThreeDrawPrimitive.triangles);
    expect(draw.drawCount, greaterThan(0));
    expect(draw.drawCount % 3, 0);
    expect(draw.material.kind, JsThreeMaterialKind.meshBasic);
    expect(draw.material.vertexColors, isTrue);
    expect(harness.state!.textureUploadCount, 0);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
