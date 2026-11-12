import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_example_render_contract.dart';
import 'support/three_quickjs_example_harness.dart';
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
    expect(state.textures, hasLength(1));
    expect(state.textures.values.single.isCube, isTrue);
    expect(
      state.textures.values.single.data.length,
      state.textures.values.single.width *
          state.textures.values.single.height *
          4 *
          6,
      reason: 'the photographic six-face cubemap survives the two eye passes',
    );
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

  testWidgets('webgl_postprocessing samples composer target textures', (
    tester,
  ) async {
    final (harness, plan) = await renderThreeExampleStrict(
      tester,
      'three-postprocessing',
    );
    expect(plan.draws, isNotEmpty);
    expect(harness.state!.renderTargets, isNotEmpty);
    expect(plan.draws.any((draw) => draw.material.mapTextureId > 0), isTrue);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_portal renders both bounded target views', (tester) async {
    final (harness, plan) = await renderThreeExampleStrict(
      tester,
      'three-portal',
    );
    expect(plan.draws, isNotEmpty);
    expect(harness.state!.renderTargets, hasLength(2));
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_gpgpu_birds keeps compute passes RAF-error free', (
    tester,
  ) async {
    final (harness, plan) = await renderThreeExampleStrict(
      tester,
      'three-gpgpu-birds',
    );
    expect(plan.draws, isNotEmpty);
    // R1 v8: the boids kernels ride the CPU-flock lane (per-tick JS kernels
    // writing the position attribute directly), so the GPU ping-pong render
    // targets are no longer created. The multi-tick pin
    // (tool/three/pins/multitick.mjs three-gpgpu-birds) guards the animated
    // flock instead: 90 ticks of per-tick texel digests, 3-axis spread, and
    // 90 distinct digests — the RT-count assertion here could not catch the
    // collapsed-flock stripe that pin catches.
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_effects_ascii keeps native draws before ASCII readback', (
    tester,
  ) async {
    final (harness, plan) = await renderThreeExampleStrict(
      tester,
      'three-effects-ascii',
    );
    expect(plan.draws, isNotEmpty);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_postprocessing_backgrounds tolerates pending samplers', (
    tester,
  ) async {
    final (harness, plan) = await renderThreeExampleStrict(
      tester,
      'three-postprocessing-backgrounds',
    );
    expect(plan.draws, isNotEmpty);
    expect(harness.state!.renderTargets, isNotEmpty);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_postprocessing_smaa constructs embedded Image textures', (
    tester,
  ) async {
    final (harness, plan) = await renderThreeExampleStrict(
      tester,
      'three-postprocessing-smaa',
    );
    expect(plan.draws, isNotEmpty);
    expect(harness.state!.renderTargets, isNotEmpty);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets(
    'webgl_shadowmap_progressive peels light maps without RAF errors',
    (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-shadowmap-progressive',
        instanceId: 'three-shadowmap-progressive-render-test',
      );
      await harness.pumpUntil(
        tester,
        (state, plan) =>
            state.submittedFrameCount >= 3 && plan.draws.isNotEmpty,
        attempts: 80,
      );
      await tester.runAsync(
        () => Future<void>.delayed(const Duration(seconds: 2)),
      );
      await harness.pumpFrames(tester, 15);
      final plan = const ThreeDrawPlanner().plan(harness.state!);
      expect(plan.diagnostics.warnings, [
        'directional light cap 4 exceeded; dropped 4 highest ids',
      ]);
      expect(
        harness.engine.peekLogs().where(
          (entry) => (entry['msg'] as String).contains('RAF tick error'),
        ),
        isEmpty,
      );
      expect(plan.draws, isNotEmpty);
      expect(harness.state!.renderTargets, isNotEmpty);
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 180)),
  );
}
