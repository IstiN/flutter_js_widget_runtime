import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_example_render_contract.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets('webgl_lines_dashed tessellates dash and gap intervals', (
    tester,
  ) async {
    final (harness, plan) = await renderThreeExampleStrict(
      tester,
      'three-lines-dashed',
    );
    expect(plan.draws, hasLength(2));
    for (final draw in plan.draws) {
      expect(draw.primitive, ThreeDrawPrimitive.lines);
      expect(draw.drawCount, greaterThan(0));
      expect(draw.drawCount % 2, 0);
      expect(draw.material.kind, JsThreeMaterialKind.lineBasic);
    }
    final state = harness.state!;
    expect(state.textureUploadCount, 0);
    final geometryUploads = state.geometryUploadCount;
    final textureUploads = state.textureUploadCount;
    await harness.pumpFrames(tester, 5);
    expect(harness.state!.geometryUploadCount, geometryUploads);
    expect(harness.state!.textureUploadCount, textureUploads);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_lines_fat lowers Line2 to real native line segments', (
    tester,
  ) async {
    final (harness, plan) = await renderThreeExampleStrict(
      tester,
      'three-lines-fat',
    );
    expect(plan.draws, hasLength(1));
    final draw = plan.draws.single;
    expect(draw.primitive, ThreeDrawPrimitive.lines);
    expect(draw.drawCount, 1534);
    expect(draw.material.kind, JsThreeMaterialKind.lineBasic);
    expect(draw.material.vertexColors, isTrue);
    expect(harness.state!.textureUploadCount, 0);
    final geometryUploads = harness.state!.geometryUploadCount;
    await harness.pumpFrames(tester, 5);
    expect(harness.state!.geometryUploadCount, geometryUploads);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_instancing_dynamic initializes despite optional PMREM', (
    tester,
  ) async {
    final (harness, plan) = await renderThreeExampleStrict(
      tester,
      'three-instancing-dynamic',
    );
    expect(plan.draws, hasLength(1));
    final draw = plan.draws.single;
    expect(draw.primitive, ThreeDrawPrimitive.triangles);
    expect(draw.drawCount, 36);
    expect(draw.instanceCount, greaterThan(1));
    expect(draw.material.kind, JsThreeMaterialKind.meshStandard);
    expect(draw.material.mapTextureId, greaterThan(0));
    expect(draw.material.envMapTextureId, greaterThan(0));
    expect(harness.state!.textureUploadCount, 2);
    final textureUploads = harness.state!.textureUploadCount;
    await harness.pumpFrames(tester, 5);
    expect(harness.state!.textureUploadCount, textureUploads);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_buffergeometry_instancing expands bounded instances', (
    tester,
  ) async {
    final (harness, plan) = await renderThreeExampleStrict(
      tester,
      'three-buffergeometry-instancing',
    );
    final draw = plan.draws.single;
    expect(draw.primitive, ThreeDrawPrimitive.triangles);
    expect(draw.drawCount, greaterThan(3));
    expect(draw.drawCount % 3, 0);
    expect(draw.material.kind, JsThreeMaterialKind.meshBasic);
    expect(draw.material.vertexColors, isTrue);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_instancing_billboards expands indexed circle instances', (
    tester,
  ) async {
    final (harness, plan) = await renderThreeExampleStrict(
      tester,
      'three-buffergeometry-instancing-billboards',
    );
    final draw = plan.draws.single;
    expect(draw.primitive, ThreeDrawPrimitive.triangles);
    expect(draw.drawCount, greaterThan(1000));
    expect(draw.material.vertexColors, isTrue);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_instancing_interleaved uses native instanced attributes', (
    tester,
  ) async {
    final (harness, plan) = await renderThreeExampleStrict(
      tester,
      'three-buffergeometry-instancing-interleaved',
    );
    final draw = plan.draws.single;
    expect(draw.instanceCount, greaterThan(1));
    expect(draw.material.kind, JsThreeMaterialKind.meshBasic);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_lines_fat_wireframe lowers Wireframe to line segments', (
    tester,
  ) async {
    final (harness, plan) = await renderThreeExampleStrict(
      tester,
      'three-lines-fat-wireframe',
    );
    final draw = plan.draws.single;
    expect(draw.primitive, ThreeDrawPrimitive.lines);
    expect(draw.drawCount, greaterThan(0));
    expect(draw.material.kind, JsThreeMaterialKind.lineBasic);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
