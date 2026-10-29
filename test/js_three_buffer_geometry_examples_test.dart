import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/flutter_gpu_three_host.dart'
    show FlutterGpuThreeSurface;
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart'
    show JsThreeLightType;
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/widget_logic_helper.dart';

final class _BufferGeometryExample {
  const _BufferGeometryExample({
    required this.exampleId,
    required this.widgetId,
    required this.primitive,
    required this.vertexCount,
    required this.indexCount,
    this.triangleCount = 0,
    this.directionalLightCount = 0,
    this.hemisphereLightCount = 0,
    this.normalizedIntegerAttributes = false,
  });

  final String exampleId;
  final String widgetId;
  final ThreeDrawPrimitive primitive;
  final int vertexCount;
  final int indexCount;
  final int triangleCount;
  final int directionalLightCount;
  final int hemisphereLightCount;
  final bool normalizedIntegerAttributes;

  int get drawCount => indexCount == 0 ? vertexCount : indexCount;
}

const _examples = [
  _BufferGeometryExample(
    exampleId: 'webgl_buffergeometry_uint',
    widgetId: 'three-buffergeometry-uint',
    primitive: ThreeDrawPrimitive.triangles,
    vertexCount: 1500000,
    indexCount: 0,
    triangleCount: 500000,
    directionalLightCount: 2,
    normalizedIntegerAttributes: true,
  ),
  _BufferGeometryExample(
    exampleId: 'webgl_buffergeometry_indexed',
    widgetId: 'three-buffergeometry-indexed',
    primitive: ThreeDrawPrimitive.triangles,
    vertexCount: 121,
    indexCount: 600,
    triangleCount: 200,
    hemisphereLightCount: 1,
  ),
  _BufferGeometryExample(
    exampleId: 'webgl_buffergeometry_lines_indexed',
    widgetId: 'three-buffergeometry-lines-indexed',
    primitive: ThreeDrawPrimitive.lines,
    vertexCount: 1376,
    indexCount: 2720,
  ),
  _BufferGeometryExample(
    exampleId: 'webgl_buffergeometry_points',
    widgetId: 'three-buffergeometry-points',
    primitive: ThreeDrawPrimitive.points,
    vertexCount: 500000,
    indexCount: 0,
  ),
];

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  for (final example in _examples) {
    testWidgets(
      'unmodified official ${example.exampleId} renders through QuickJS R1',
      (tester) async {
        final sources = await tester.runAsync(() async {
          return (
            three: await rootBundle.loadString('assets/three/three.native.js'),
            widget: await File(
              'example/widgets/${example.widgetId}/widget.js',
            ).readAsString(),
          );
        });
        final host = createFlutterGpuThreeHost();
        final instanceId = '${example.widgetId}-test';
        final config = JsRuntimeConfig(
          widgetId: example.widgetId,
          instanceId: instanceId,
          threeEnabled: true,
          threeSource: sources!.three,
          threeHost: host,
          onRender: (_) {},
          onSetTitle: (_) {},
          onStorageUpdate: (_) {},
        );
        final backend = QuickjsWidgetEngineBackend(config: config);
        final engine = JsWidgetEngine(
          config: config.copyWith(backend: backend),
        );
        addTearDown(engine.dispose);
        await engine.init();
        await engine.run(sources.widget);

        FlutterGpuThreeSurface? surface;
        ThreeDrawPlan? plan;
        for (var attempt = 0; attempt < 300; attempt++) {
          surface =
              host.findSurface(instanceId, 'main#1') as FlutterGpuThreeSurface?;
          final state = surface?.state;
          if (state != null) {
            plan = const ThreeDrawPlanner().plan(state);
            if (state.geometryUploadCount == 1 &&
                state.materialUploadCount == 1 &&
                plan.draws.length == 1 &&
                state.submittedFrameCount >= 3) {
              break;
            }
          }
          await tester.runAsync(
            () => Future<void>.delayed(const Duration(milliseconds: 20)),
          );
          await tester.pump(const Duration(milliseconds: 50));
        }

        final exported = engine.exportedState;
        expect(exported, isNotNull);
        expect(exported!['example'], example.exampleId);
        expect(exported['backend'], 'flutterGpu');
        expect(exported['canvasCount'], 1);
        expect(exported['mounted'], isTrue);
        if (surface?.state == null) {
          print(
            'THREE ${example.exampleId} diagnostics: $exported; '
            'logs=${engine.peekLogs()}',
          );
        }
        final state = surface?.state;
        expect(state, isNotNull);
        expect(state!.geometryUploadCount, 1);
        expect(state.textureUploadCount, 0);
        expect(state.textures, isEmpty);
        expect(state.materialUploadCount, 1);
        expect(state.submittedFrameCount, greaterThanOrEqualTo(3));
        expect(state.pendingFrameCount, lessThanOrEqualTo(2));
        expect(plan, isNotNull);
        expect(plan!.canRender, isTrue);
        expect(plan!.draws, hasLength(1));
        expect(plan!.triangleCount, example.triangleCount);
        expect(
          plan!.directionalLights,
          hasLength(example.directionalLightCount),
        );
        expect(plan!.hemisphereLights, hasLength(example.hemisphereLightCount));
        expect(plan!.diagnostics.warnings, isEmpty);
        if (example.hemisphereLightCount != 0) {
          final light = plan!.hemisphereLights.single;
          expect(light.type, JsThreeLightType.hemisphere);
          expect(light.intensity, closeTo(3, 0.00001));
          expect(light.colorR, closeTo(1, 0.00001));
          expect(light.colorG, closeTo(1, 0.00001));
          expect(light.colorB, closeTo(1, 0.00001));
          expect(light.groundColorR, closeTo(1, 0.00001));
          expect(light.groundColorG, closeTo(1, 0.00001));
          expect(light.groundColorB, closeTo(1, 0.00001));
          expect(light.worldDirection[0], closeTo(0, 0.00001));
          expect(light.worldDirection[1], closeTo(1, 0.00001));
          expect(light.worldDirection[2], closeTo(0, 0.00001));
        }

        final draw = plan!.draws.single;
        expect(draw.primitive, example.primitive);
        expect(draw.drawCount, example.drawCount);
        expect(draw.indexed, example.indexCount != 0);
        expect(draw.material.mapTextureId, 0);
        expect(draw.material.vertexColors, isTrue);
        expect(draw.geometry.vertexCount, example.vertexCount);
        expect(draw.geometry.indexCount, example.indexCount);
        expect(draw.geometry.colors, isNotNull);

        if (example.normalizedIntegerAttributes) {
          final normals = draw.geometry.normals!;
          final colors = draw.geometry.colors!;
          for (final value in normals.take(300)) {
            expect(value, inInclusiveRange(-1.00001, 1.00001));
          }
          for (final value in colors.take(300)) {
            expect(value, inInclusiveRange(-0.00001, 1.00001));
          }
          expect(
            colors.take(300).any((value) => value > 0 && value < 1),
            isTrue,
          );
        }

        final uploads = (
          state.geometryUploadCount,
          state.textureUploadCount,
          state.materialUploadCount,
        );
        for (var frame = 0; frame < 3; frame++) {
          await tester.runAsync(
            () => Future<void>.delayed(const Duration(milliseconds: 20)),
          );
          await tester.pump(const Duration(milliseconds: 50));
        }
        expect(state.geometryUploadCount, uploads.$1);
        expect(state.textureUploadCount, uploads.$2);
        expect(state.materialUploadCount, uploads.$3);

        await engine.dispose();
        await tester.pump();
      },
      timeout: const Timeout(Duration(seconds: 180)),
    );
  }
}
