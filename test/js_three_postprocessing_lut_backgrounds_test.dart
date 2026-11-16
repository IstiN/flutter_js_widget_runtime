import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_state.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'postprocessing LUT/background probes',
      () {},
      skip: 'QuickJS is unavailable',
    );
    return;
  }

  Map<String, Map<String, dynamic>> controllers(
    ThreeQuickjsExampleHarness harness,
  ) {
    final gui = harness.engine.exportedState!['gui'] as Map<String, dynamic>;
    return {
      for (final value in (gui['values'] as List).cast<Map<String, dynamic>>())
        value['property'] as String: value,
    };
  }

  List<ThreeDrawPlan> recentPlans(
    ThreeQuickjsExampleHarness harness,
    JsThreeSurfaceState state,
    int count,
  ) {
    final frames = harness.surface!.lastSubmittedFrames;
    return frames
        .skip(frames.length < count ? 0 : frames.length - count)
        .map(
          (frame) => const ThreeDrawPlanner().plan(
            JsThreeFramePlanView.snapshot(state, frame, const []),
            frame: frame,
          ),
        )
        .toList();
  }

  test('3dlut shader preserves linear/output/display pass roles', () {
    final source = File('shaders/three_r1.frag').readAsStringSync();
    expect(source, contains('if (op == 18) {\n    // FXAA'));
    expect(
      source,
      contains('if (op == 14) {\n    // Official paired Gaussian taps'),
    );
    expect(source, isNot(contains('if (op == 14) {\n    // FXAA')));
    expect(source, contains('vec4 post = r1PostColor(textureUv);'));
    expect(source, isNot(contains('postUv.y = 1.0 - postUv.y')));
    expect(source, contains('if (op == 10) return base;'));
    expect(source, contains('if (postOp == 17)'));
    expect(source, contains('outColor = post;'));
    expect(
      source,
      contains('if (postOp == 10 || frame_info.fogFarModeReserved.w < 0.5)'),
    );
    expect(
      source,
      contains(
        'if (frame_info.fogFarModeReserved.w < 0.5) color = applyToneMapping(color);',
      ),
    );
    expect(
      source,
      contains(
        'emissive *= texture(matcapTexture, transformedMapUv(textureUv)).rgb;',
      ),
    );
    expect(
      source,
      isNot(contains('if (op == 10) return vec4(linearToSrgb(base.rgb)')),
    );
  });

  testWidgets('3dlut transports real LUT pixels and live GUI values', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-postprocessing-3dlut',
      instanceId: 'three-postprocessing-3dlut-native-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.materials.values.any(
            (material) =>
                material.kind == JsThreeMaterialKind.postProcessing &&
                material.duboisLeftMatrix.isNotEmpty &&
                material.duboisLeftMatrix[0] == 17 &&
                material.mapRightTextureId != 0,
          ) &&
          state.materials.values.any(
            (material) => material.kind == JsThreeMaterialKind.meshStandard,
          ),
      attempts: 240,
    );
    final state = harness.state!;
    JsThreeMaterialUpsert lut() => state.materials.values.lastWhere(
      (material) =>
          material.kind == JsThreeMaterialKind.postProcessing &&
          material.duboisLeftMatrix.isNotEmpty &&
          material.duboisLeftMatrix[0] == 17,
    );
    final initial = lut();
    expect(initial.duboisLeftMatrix[1], 32);
    expect(initial.duboisLeftMatrix[2], 1);
    final initialAtlas = state.textures[initial.mapRightTextureId]!;
    expect(initialAtlas.width, 1024);
    expect(initialAtlas.height, 32);
    expect(initialAtlas.encoding, JsThreeTextureEncoding.rawRgba8);
    expect(initialAtlas.srgb, isFalse);
    expect(initialAtlas.data.length, 32 * 32 * 32 * 4);
    final background = state.materials.values.lastWhere(
      (material) =>
          material.kind == JsThreeMaterialKind.background &&
          material.envMapTextureId != 0,
    );
    expect(
      state.textures[background.envMapTextureId]!.srgb,
      isTrue,
      reason: 'the bounded UltraHDR SDR base JPEG must be decoded to linear',
    );
    final helmet = state.materials.values.lastWhere(
      (material) => material.kind == JsThreeMaterialKind.meshStandard,
    );
    expect(helmet.emissiveR, 1);
    expect(helmet.emissiveG, 1);
    expect(helmet.emissiveB, 1);
    expect(
      helmet.matcapTextureId,
      isNonZero,
      reason: 'Standard reuses the spare matcap binding for emissiveMap',
    );
    expect(
      state.textures[helmet.matcapTextureId]!.srgb,
      isTrue,
      reason: 'the white emissive factor must be modulated by its sRGB texture',
    );

    final controls = controllers(harness);
    await harness.backend.callEvent(
      controls['intensity']!['action'] as String,
      {'value': 0.25},
    );
    await harness.pumpFrames(tester, 4);
    expect(lut().duboisLeftMatrix[2], 0.25);
    await harness.backend.callEvent(controls['lut']!['action'] as String, {
      'value': 'B&WLUT',
    });
    await harness.pumpUntil(
      tester,
      (state, plan) => lut().mapRightTextureId != initial.mapRightTextureId,
      attempts: 120,
    );
    expect(lut().duboisLeftMatrix[2], 0.25);
    expect(controllers(harness)['lut']!['value'], 'B&WLUT');
    final gui = harness.engine.exportedState!['gui'] as Map<String, dynamic>;
    expect(gui['changes'], greaterThanOrEqualTo(2));

    await harness.backend.callEvent(controls['enabled']!['action'] as String, {
      'value': false,
    });
    await harness.pumpFrames(tester, 4);
    final draws = recentPlans(harness, state, 2).expand((plan) => plan.draws);
    expect(
      draws.any(
        (draw) =>
            draw.material.kind == JsThreeMaterialKind.postProcessing &&
            draw.material.duboisLeftMatrix.isNotEmpty &&
            draw.material.duboisLeftMatrix[0] == 17,
      ),
      isFalse,
    );
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('backgrounds clear, texture, cube and GUI packets are live', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-postprocessing-backgrounds',
      instanceId: 'three-postprocessing-backgrounds-native-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) => state.materials.values.any(
        (material) =>
            material.kind == JsThreeMaterialKind.background &&
            material.envMapTextureId != 0,
      ),
      attempts: 240,
    );
    final state = harness.state!;
    final controls = controllers(harness);
    await harness.backend.callEvent(
      controls['clearColor']!['action'] as String,
      {'value': 'blue'},
    );
    await harness.backend.callEvent(
      controls['clearAlpha']!['action'] as String,
      {'value': 0.5},
    );
    await harness.backend.callEvent(
      controls['texturePassOpacity']!['action'] as String,
      {'value': 0.25},
    );
    await harness.backend.callEvent(
      controls['cubeTexturePassOpacity']!['action'] as String,
      {'value': 0.4},
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.materials.values.any(
            (material) =>
                material.kind == JsThreeMaterialKind.meshBasic &&
                material.opacity == 0.25,
          ) &&
          state.materials.values.any(
            (material) =>
                material.kind == JsThreeMaterialKind.background &&
                material.opacity == 0.4,
          ),
      attempts: 60,
    );
    final texture = state.materials.values.lastWhere(
      (material) =>
          material.kind == JsThreeMaterialKind.meshBasic &&
          material.mapTextureId != 0,
    );
    expect(texture.opacity, 0.25);
    final cube = state.materials.values.lastWhere(
      (material) =>
          material.kind == JsThreeMaterialKind.background &&
          material.envMapTextureId != 0,
    );
    expect(cube.opacity, closeTo(0.4, 1e-6));
    expect(cube.envMapIntensity, -1); // official CubeTexturePass tFlip=-1

    final clearFrame = harness.surface!.lastSubmittedFrames.lastWhere(
      (frame) =>
          frame.backgroundR == 0 &&
          frame.backgroundG == 0 &&
          frame.backgroundB == 1 &&
          frame.backgroundA == 0.5,
    );
    expect(clearFrame.clearColor, isTrue);
    expect(clearFrame.clearDepth, isTrue);
    final clearPlan = const ThreeDrawPlanner().plan(
      JsThreeFramePlanView.snapshot(state, clearFrame, const []),
      frame: clearFrame,
    );
    expect(
      clearPlan.draws,
      isEmpty,
      reason: 'ClearPass is a real clear-only native frame',
    );

    await harness.backend.callEvent(
      controls['texturePass']!['action'] as String,
      {'value': false},
    );
    await harness.backend.callEvent(
      controls['cubeTexturePass']!['action'] as String,
      {'value': false},
    );
    await harness.backend.callEvent(
      controls['renderPass']!['action'] as String,
      {'value': false},
    );
    await harness.pumpFrames(tester, 4);
    final remaining = recentPlans(
      harness,
      state,
      2,
    ).expand((plan) => plan.draws);
    expect(
      remaining.any(
        (draw) =>
            draw.material.kind == JsThreeMaterialKind.meshStandard ||
            draw.material.kind == JsThreeMaterialKind.background ||
            draw.material.mapTextureId == texture.mapTextureId,
      ),
      isFalse,
    );
    final gui = harness.engine.exportedState!['gui'] as Map<String, dynamic>;
    expect(gui['changes'], greaterThanOrEqualTo(7));
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
