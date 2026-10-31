import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

import 'support/three_example_render_contract.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test('render-target effects', () {}, skip: 'QuickJS is unavailable');
    return;
  }

  testWidgets('webgl_rtt renders a bounded target and native procedural quad', (
    tester,
  ) async {
    final (harness, plan) = await renderThreeExampleStrict(tester, 'three-rtt');
    final state = harness.state!;
    expect(plan.draws, isNotEmpty);
    expect(state.renderTargets, hasLength(1));
    expect(state.materials.length, lessThanOrEqualTo(8));
    expect(state.geometries.length, lessThanOrEqualTo(8));
    final target = state.renderTargets.values.single;
    expect(target.width, greaterThan(0));
    expect(target.height, greaterThan(0));
    expect(target.textureId, greaterThan(0));
    expect(target.hasDepth, isTrue);
    expect(state.textures, isEmpty);
    expect(
      state.materials.values.any(
        (material) =>
            material.vertexColors &&
            material.kind == JsThreeMaterialKind.meshBasic,
      ),
      isTrue,
    );
    expect(
      plan.draws.every(
        (draw) => draw.material.mapTextureId == target.textureId,
      ),
      isTrue,
    );
    final frames = harness.surface!.lastSubmittedFrames;
    final batch = frames.sublist(frames.length - 3);
    expect(batch[0].renderTargetId, target.targetId);
    expect(
      (batch[0].targetWidth, batch[0].targetHeight),
      (target.width, target.height),
    );
    expect(batch.skip(1).every((frame) => frame.renderTargetId == 0), isTrue);
    expect(batch[1].clearColor && batch[1].clearDepth, isTrue);
    expect(batch[2].clearColor || batch[2].clearDepth, isFalse);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_effects_anaglyph composites two targets with Dubois', (
    tester,
  ) async {
    final (harness, plan) = await renderThreeExampleStrict(
      tester,
      'three-effects-anaglyph',
    );
    final state = harness.state!;
    expect(plan.draws, isNotEmpty);
    expect(state.renderTargets, hasLength(2));
    expect(state.textures, isEmpty);
    expect(plan.draws, hasLength(1));
    final material = plan.draws.single.material;
    expect(material.kind, JsThreeMaterialKind.anaglyph);
    expect(material.mapTextureId, greaterThan(0));
    expect(material.mapRightTextureId, greaterThan(0));
    expect(material.mapRightTextureId, isNot(material.mapTextureId));
    expect(material.duboisLeftMatrix, hasLength(12));
    expect(material.duboisRightMatrix, hasLength(12));
    expect(material.duboisLeftMatrix.any((value) => value != 0), isTrue);
    expect(material.duboisRightMatrix.any((value) => value != 0), isTrue);
    final targetIds = state.renderTargets.keys.toSet();
    expect(targetIds.map((id) => state.renderTargets[id]!.textureId).toSet(), {
      material.mapTextureId,
      material.mapRightTextureId,
    });
    final frames = harness.surface!.lastSubmittedFrames;
    final batch = frames.sublist(frames.length - 3);
    expect(batch[0].renderTargetId, isNot(0));
    expect(batch[1].renderTargetId, isNot(0));
    expect(batch[0].renderTargetId, isNot(batch[1].renderTargetId));
    expect(batch[2].renderTargetId, 0);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
