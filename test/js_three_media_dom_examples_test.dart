import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_example_render_contract.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

Future<(ThreeQuickjsExampleHarness, ThreeDrawPlan)> _render(
  WidgetTester tester,
  String id, {
  bool allowLightCaps = false,
  bool startOnGesture = false,
}) async {
  final harness = await ThreeQuickjsExampleHarness.boot(
    tester,
    widgetId: id,
    instanceId: '$id-media-dom-test',
  );
  if (startOnGesture) {
    harness.backend.dispatchHostEvent('three.input:main', {
      'type': 'pointerdown',
      'pointerId': 1,
      'clientX': 100,
      'clientY': 100,
      'button': 0,
    });
  }
  if (!allowLightCaps) {
    final plan = await pumpThreeExampleHealthy(tester, harness, _exampleId(id));
    return (harness, plan);
  }
  await harness.pumpUntil(
    tester,
    (state, plan) => state.submittedFrameCount >= 3 && plan.draws.isNotEmpty,
    attempts: 80,
  );
  await tester.runAsync(() => Future<void>.delayed(const Duration(seconds: 2)));
  await harness.pumpFrames(tester, 15);
  final plan = const ThreeDrawPlanner().plan(harness.state!);
  harness.plan = plan;
  expect(harness.engine.exportedState!['mounted'], isTrue);
  expect(plan.canRender, isTrue);
  expect(plan.diagnostics.warnings, [
    'directional light cap 4 exceeded; dropped 8 highest ids',
    'hemisphere light cap 4 exceeded; dropped 8 highest ids',
  ]);
  return (harness, plan);
}

String _exampleId(String id) => switch (id) {
  'three-webaudio-visualizer' => 'webaudio_visualizer',
  _ => 'webgl_${id.replaceFirst('three-', '').replaceAll('-', '_')}',
};

void _expectNoJsErrors(ThreeQuickjsExampleHarness harness) {
  expect(
    harness.engine.peekLogs().where(
      (entry) => (entry['msg'] as String).startsWith('[E]'),
    ),
    isEmpty,
  );
}

void _expectWarning(ThreeQuickjsExampleHarness harness, String text) {
  expect(
    harness.engine.peekLogs().any(
      (entry) => (entry['msg'] as String).contains(text),
    ),
    isTrue,
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test('media and DOM examples', () {}, skip: 'QuickJS is unavailable');
    return;
  }

  testWidgets('webgl_multiple_elements lays out visible native scenes', (
    tester,
  ) async {
    final (harness, plan) = await _render(
      tester,
      'three-multiple-elements',
      allowLightCaps: true,
    );
    expect(plan.draws, isNotEmpty);
    expect(harness.state!.submittedFrameCount, greaterThanOrEqualTo(24));
    expect(harness.engine.exportedState!['mounted'], isTrue);
    _expectNoJsErrors(harness);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_multiple_elements_text restores static views and onload', (
    tester,
  ) async {
    final (harness, plan) = await _render(
      tester,
      'three-multiple-elements-text',
    );
    expect(plan.draws, isNotEmpty);
    expect(
      plan.draws.any((draw) => draw.primitive == ThreeDrawPrimitive.points),
      isTrue,
    );
    expect(harness.state!.textureUploadCount, greaterThanOrEqualTo(1));
    _expectNoJsErrors(harness);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  for (final id in [
    'three-multisampled-renderbuffers',
    'three-postprocessing-fxaa',
    'three-postprocessing-unreal-bloom-selective',
  ]) {
    testWidgets('$id submits its native degraded scene', (tester) async {
      final (harness, plan) = await _render(tester, id);
      expect(plan.draws, isNotEmpty);
      _expectNoJsErrors(harness);
      await harness.dispose(tester);
    }, timeout: const Timeout(Duration(seconds: 180)));
  }

  testWidgets('webgl_postprocessing_glitch starts on its official gesture', (
    tester,
  ) async {
    final (harness, plan) = await _render(
      tester,
      'three-postprocessing-glitch',
      startOnGesture: true,
    );
    expect(plan.draws, isNotEmpty);
    _expectWarning(harness, 'stores this render target as RGBA8');
    _expectNoJsErrors(harness);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_shadowmap_viewer keeps the scene with a warned HUD omit', (
    tester,
  ) async {
    final (harness, plan) = await _render(tester, 'three-shadowmap-viewer');
    expect(plan.draws, isNotEmpty);
    _expectWarning(harness, 'omits the ShadowMapViewer HUD');
    _expectNoJsErrors(harness);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_test_memory2 renders its warned native shader fallback', (
    tester,
  ) async {
    final (harness, plan) = await _render(tester, 'three-test-memory2');
    expect(plan.draws, hasLength(100));
    _expectWarning(
      harness,
      'webgl_test_memory2 arbitrary shader is unavailable',
    );
    _expectNoJsErrors(harness);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_materials_video renders its grid with warned fallbacks', (
    tester,
  ) async {
    final (harness, plan) = await _render(tester, 'three-materials-video');
    expect(plan.draws.length, greaterThanOrEqualTo(100));
    expect(harness.state!.textureUploadCount, greaterThanOrEqualTo(1));
    expect(harness.engine.exportedState!['media']['videoTextures'], 1);
    _expectWarning(harness, 'VideoTexture transport is unavailable');
    _expectWarning(harness, 'base video-grid scene renders directly');
    _expectNoJsErrors(harness);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets(
    'webgl_materials_video_webcam never becomes a silent black frame',
    (tester) async {
      final (harness, plan) = await _render(
        tester,
        'three-materials-video-webcam',
      );
      expect(plan.draws, hasLength(128));
      expect(harness.state!.textureUploadCount, greaterThanOrEqualTo(1));
      expect(harness.engine.exportedState!['media']['videoTextures'], 1);
      _expectWarning(harness, 'instead of a black frame');
      _expectNoJsErrors(harness);
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 180)),
  );

  testWidgets('webgl_video_kinect renders explicit native point fallback', (
    tester,
  ) async {
    final (harness, plan) = await _render(tester, 'three-video-kinect');
    expect(plan.draws, hasLength(1));
    expect(plan.draws.single.primitive, ThreeDrawPrimitive.points);
    expect(plan.draws.single.material.kind, JsThreeMaterialKind.pointsBasic);
    expect(harness.engine.exportedState!['media']['shaderFallbacks'], 1);
    expect(harness.engine.exportedState!['media']['videoTextures'], 1);
    _expectWarning(harness, 'point-cloud fallback');
    _expectNoJsErrors(harness);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_video_panorama_equirectangular renders fallback texture', (
    tester,
  ) async {
    final (harness, plan) = await _render(
      tester,
      'three-video-panorama-equirectangular',
    );
    expect(plan.draws, hasLength(1));
    expect(plan.draws.single.material.mapTextureId, greaterThan(0));
    expect(harness.engine.exportedState!['media']['videoTextures'], 1);
    _expectWarning(harness, 'bounded 16x16 RGBA fallback');
    _expectNoJsErrors(harness);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
