import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/flutter_gpu_three_host.dart'
    show FlutterGpuThreeSurface;
import 'package:js_widget_runtime/src/runtime/js_widget_engine_flutter_js.dart';

import 'support/three_test_config.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('upstream THREE crosses the flutter_js base64 binary lane', () async {
    final host = createFlutterGpuThreeHost();
    final config = threeTestConfig(engineId: 'three-flutter-js', host: host);
    final backend = FlutterJsWidgetEngineBackend(config: config);
    final engine = JsWidgetEngine(config: config.copyWith(backend: backend));
    addTearDown(engine.dispose);
    await engine.init();
    await engine.run(threeSmokeSceneJs());

    FlutterGpuThreeSurface? surface;
    for (var attempt = 0; attempt < 100; attempt++) {
      surface =
          host.findSurface('three-flutter-js', 'main#1')
              as FlutterGpuThreeSurface?;
      if ((surface?.state?.submittedFrameCount ?? 0) >= 1) break;
      await Future<void>.delayed(const Duration(milliseconds: 10));
    }

    expect(engine.exportedState, {
      'revision': '186',
      'backend': 'flutterGpu',
      'rawWebGL': false,
      'frame': 1,
      'geometries': 1,
    });
    expect(surface, isNotNull, reason: '${engine.peekLogs()}');
    final state = surface!.state!;
    expect(state.geometryUploadCount, 1);
    expect(state.textureUploadCount, 0);
    expect(state.materialUploadCount, 1);
    expect(state.submittedFrameCount, 1);
    expect(state.appliedEnvelopeCount, 1);
    expect(state.geometries, hasLength(1));
    expect(state.currentFrame, isNotNull);
  });

  test('flutter_js delivers a small wrapped binary host call', () async {
    final received = <String, List<int>>{};
    final config = JsRuntimeConfig(
      widgetId: 'flutter-js-binary',
      onRender: (_) {},
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
      onHostCallBinary: (name, data) => received[name] = data.toList(),
    );
    final backend = FlutterJsWidgetEngineBackend(config: config);
    final engine = JsWidgetEngine(config: config.copyWith(backend: backend));
    addTearDown(engine.dispose);
    await engine.init();
    await engine.run("jsr.hostCallBinary('probe', new Uint8Array([1, 2, 3]));");
    for (var attempt = 0; attempt < 100 && received.isEmpty; attempt++) {
      await Future<void>.delayed(const Duration(milliseconds: 10));
    }
    expect(received, {
      'probe': [1, 2, 3],
    });
  });

  test(
    'wrapped binary messages route to the owning flutter_js engine',
    () async {
      final received = <String>[];
      Future<JsWidgetEngine> boot(String id) async {
        final config = JsRuntimeConfig(
          widgetId: id,
          instanceId: id,
          onRender: (_) {},
          onSetTitle: (_) {},
          onStorageUpdate: (_) {},
          onHostCallBinary: (name, data) {
            received.add('$id:$name:${data.join(',')}');
          },
        );
        final backend = FlutterJsWidgetEngineBackend(config: config);
        final engine = JsWidgetEngine(
          config: config.copyWith(backend: backend),
        );
        await engine.init();
        return engine;
      }

      final first = await boot('binary-first');
      final second = await boot('binary-second');
      addTearDown(() async {
        await second.dispose();
        await first.dispose();
      });
      await first.run("jsr.hostCallBinary('from-first', new Uint8Array([1]));");
      await second.run(
        "jsr.hostCallBinary('from-second', new Uint8Array([2]));",
      );
      for (var attempt = 0; attempt < 100 && received.length < 2; attempt++) {
        await Future<void>.delayed(const Duration(milliseconds: 10));
      }
      expect(received, hasLength(2));
      expect(
        received,
        unorderedEquals([
          'binary-first:from-first:1',
          'binary-second:from-second:2',
        ]),
      );
    },
  );
}
