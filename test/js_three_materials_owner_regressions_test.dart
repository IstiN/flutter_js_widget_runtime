import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

Future<ThreeQuickjsExampleHarness> _boot(WidgetTester tester, String id) async {
  final harness = await ThreeQuickjsExampleHarness.boot(
    tester,
    widgetId: id,
    instanceId: '$id-owner-regression-test',
  );
  await harness.pumpUntil(
    tester,
    (state, plan) => state.submittedFrameCount >= 1 && plan.draws.isNotEmpty,
    attempts: 400,
  );
  await tester.runAsync(() => Future<void>.delayed(const Duration(seconds: 2)));
  await harness.pumpFrames(tester, 12);
  return harness;
}

List<Map<String, dynamic>> _controls(ThreeQuickjsExampleHarness harness) =>
    (harness.engine.exportedState?['gui']?['values'] as List)
        .cast<Map<String, dynamic>>();

Future<void> _change(
  WidgetTester tester,
  ThreeQuickjsExampleHarness harness,
  String property,
  Object value,
) async {
  final row = _controls(
    harness,
  ).singleWhere((row) => row['property'] == property);
  await harness.engine.callEvent(row['action'] as String, {'value': value});
  await harness.pumpFrames(tester, 2);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets('env EXR binds decoded radiance and dispatches every control', (
    tester,
  ) async {
    final harness = await _boot(tester, 'three-materials-envmaps-exr');
    ThreeDrawPlan plan() => const ThreeDrawPlanner().plan(harness.state!);
    JsThreeMaterialUpsert material() => plan().draws
        .singleWhere(
          (draw) => draw.material.kind == JsThreeMaterialKind.meshStandard,
        )
        .material;

    final exr = material();
    expect(exr.envMapTextureId, isNonZero);
    expect(exr.envMapIntensity, 16);
    final exrTexture = plan().textures[exr.envMapTextureId]!;
    expect(exrTexture.width, 64);
    expect(exrTexture.height, 32);
    expect(exrTexture.data.any((byte) => byte > 0), isTrue);

    await _change(tester, harness, 'roughness', 0.63);
    expect(material().roughness, closeTo(0.63, 1e-6));
    await _change(tester, harness, 'metalness', 0.47);
    expect(material().metalness, closeTo(0.47, 1e-6));
    await _change(tester, harness, 'exposure', 1.37);
    expect(
      harness.state!.currentFrame!.toneMappingExposure,
      closeTo(1.37, 1e-6),
    );
    final beforeDebug = plan().draws.length;
    await _change(tester, harness, 'debug', true);
    expect(plan().draws.length, greaterThan(beforeDebug));
    await _change(tester, harness, 'envMap', 'PNG');
    expect(material().envMapTextureId, isNonZero);
    expect(material().envMapTextureId, isNot(exr.envMapTextureId));
    expect(material().envMapIntensity, 1);
    await _change(tester, harness, 'envMap', 'EXR');
    expect(material().envMapTextureId, exr.envMapTextureId);
    expect(material().envMapIntensity, 16);
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets(
    'physical transmission dispatches all controls into native packets',
    (tester) async {
      final harness = await _boot(
        tester,
        'three-materials-physical-transmission',
      );
      Map<String, dynamic> material() {
        final draw = const ThreeDrawPlanner()
            .plan(harness.state!)
            .draws
            .singleWhere(
              (draw) => draw.material.kind == JsThreeMaterialKind.meshStandard,
            );
        final m = draw.material;
        return {
          'version': m.version,
          'color': [m.colorR, m.colorG, m.colorB],
          'opacity': m.opacity,
          'roughness': m.roughness,
          'metalness': m.metalness,
          'envMapIntensity': m.envMapIntensity,
        };
      }

      final affected = <String, String>{
        'color': 'color',
        'transmission': 'opacity',
        'opacity': 'opacity',
        'metalness': 'metalness',
        'roughness': 'roughness',
        'ior': 'envMapIntensity',
        'thickness': 'opacity',
        'specularIntensity': 'envMapIntensity',
        'specularColor': 'envMapIntensity',
        'envMapIntensity': 'envMapIntensity',
        'transmissionResolutionScale': 'roughness',
      };
      for (final row in _controls(harness)) {
        final property = row['property'] as String;
        final value = switch (property) {
          'color' || 'specularColor' => '#3366cc',
          'transmissionResolutionScale' => 0.2,
          'ior' => 1.8,
          'thickness' => 3.0,
          _ => 0.37,
        };
        final before = material();
        final exposure = harness.state!.currentFrame!.toneMappingExposure;
        await _change(tester, harness, property, value);
        if (property == 'exposure') {
          expect(
            harness.state!.currentFrame!.toneMappingExposure,
            closeTo(0.37, 1e-6),
          );
          expect(
            harness.state!.currentFrame!.toneMappingExposure,
            isNot(exposure),
          );
          continue;
        }
        final after = material();
        expect(affected, contains(property));
        expect(
          after['version'],
          greaterThan(before['version'] as int),
          reason: property,
        );
        expect(
          after[affected[property]],
          isNot(before[affected[property]]),
          reason: property,
        );
      }
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 180)),
  );

  testWidgets(
    'subsurface rabbit is red Phong and every slider changes scattering',
    (tester) async {
      final harness = await _boot(
        tester,
        'three-materials-subsurface-scattering',
      );
      Map<String, dynamic> material() {
        final draw = const ThreeDrawPlanner()
            .plan(harness.state!)
            .draws
            .singleWhere(
              (draw) => draw.material.kind == JsThreeMaterialKind.meshPhong,
            );
        final m = draw.material;
        return {
          'version': m.version,
          'color': [m.colorR, m.colorG, m.colorB],
          'emissive': [m.emissiveR, m.emissiveG, m.emissiveB],
          'emissiveIntensity': m.emissiveIntensity,
          'shininess': m.shininess,
          'map': m.mapTextureId,
        };
      }

      final initial = material();
      expect(initial['color'], [1.0, closeTo(0.2, 1e-6), closeTo(0.2, 1e-6)]);
      expect(initial['emissive'], [0.5, closeTo(0.3, 1e-6), 0.0]);
      expect(initial['map'], isNonZero);
      expect(initial['shininess'], closeTo(500, 1e-5));
      expect(initial['emissiveIntensity'], greaterThan(0));
      for (final row in _controls(harness)) {
        final property = row['property'] as String;
        final before = material();
        await _change(tester, harness, property, 0.73);
        final after = material();
        expect(
          after['version'],
          greaterThan(before['version'] as int),
          reason: property,
        );
        expect(
          after['emissiveIntensity'] != before['emissiveIntensity'] ||
              after['shininess'] != before['shininess'],
          isTrue,
          reason: property,
        );
      }
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 240)),
  );
}
