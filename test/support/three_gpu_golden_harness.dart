import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/flutter_gpu_three_host.dart'
    show FlutterGpuThreeSurface;
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'three_test_config.dart';

/// Booted pieces of one Flutter GPU golden run. [surface] stays null until
/// [attachThreeGpuGolden] runs (the widget JS `createCanvas` creates it).
final class ThreeGpuGoldenRun {
  // ignore: avoid_init_to_null — set by attachThreeGpuGolden.
  ThreeGpuGoldenRun(this.engineId, this.engine, this.host);

  final String engineId;
  final JsWidgetEngine engine;
  final JsThreeHost host;
  FlutterGpuThreeSurface? surface;
}

/// Loads the bundled R1 runtime and boots a QuickJS engine on the Flutter
/// GPU host. Registers `addTearDown` disposal, so callers must not dispose
/// inline. Run the widget JS next, then call [attachThreeGpuGolden].
Future<ThreeGpuGoldenRun> bootThreeGpuGolden(
  WidgetTester tester,
  String engineId,
  String? threeSource,
) async {
  final host = createFlutterGpuThreeHost();
  final config = threeTestConfig(
    engineId: engineId,
    host: host,
    threeSource: threeSource,
  );
  final backend = QuickjsWidgetEngineBackend(config: config);
  final engine = JsWidgetEngine(config: config.copyWith(backend: backend));
  addTearDown(() async {
    await tester.pumpWidget(const SizedBox.shrink());
    await engine.dispose();
    host.disposeEngine(engineId);
  });
  await engine.init();
  return ThreeGpuGoldenRun(engineId, engine, host);
}

/// Finds the `main#1` surface created by the widget JS, attaches it as a
/// 256x256 widget at DPR 1 and returns it.
Future<FlutterGpuThreeSurface> attachThreeGpuGolden(
  WidgetTester tester,
  ThreeGpuGoldenRun run, {
  bool banner = true,
}) async {
  final surface =
      run.host.findSurface(run.engineId, 'main#1') as FlutterGpuThreeSurface?;
  expect(surface, isNotNull);
  run.host.attach(run.engineId, 'main#1', const {});
  surface!.resize(const Size(256, 256), 1);
  run.surface = surface;
  await tester.pumpWidget(
    MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Center(
        child: SizedBox(
          width: 256,
          height: 256,
          child: AnimatedBuilder(
            animation: surface,
            builder: (context, _) => run.host.build(context, surface, const {}),
          ),
        ),
      ),
    ),
  );
  return surface;
}

/// Polls the surface until [ready] reports green, then captures a PNG.
/// [ready] receives the live diagnostics map; the base gate already covers
/// zero failed presentations, >= 2 presented frames and backend readiness.
Future<Uint8List?> captureThreeGpuGolden(
  WidgetTester tester,
  FlutterGpuThreeSurface surface,
  bool Function(Map<String, num> diagnostics) ready,
) async {
  Uint8List? png;
  for (var attempt = 0; attempt < 400; attempt++) {
    final diagnostics = surface.diagnostics;
    if (diagnostics['failedPresentations'] == 0 &&
        (diagnostics['presentedFrames'] ?? 0) >= 2 &&
        diagnostics['backendReady'] == 1 &&
        ready(diagnostics)) {
      png = await tester.runAsync<Uint8List?>(
        () => surface.capture().timeout(const Duration(seconds: 5)),
      );
      if (png != null) break;
    }
    await tester.pump(const Duration(milliseconds: 25));
    await tester.runAsync(
      () => Future<void>.delayed(const Duration(milliseconds: 25)),
    );
  }
  return png;
}

/// Decodes a captured PNG into straight-RGBA bytes for pixel probes.
Future<ByteData> decodeThreeGpuGolden(
  WidgetTester tester,
  Uint8List png,
) async {
  final rgba = await tester.runAsync(() async {
    final decoded = await ui.instantiateImageCodec(png);
    final frame = await decoded.getNextFrame();
    return frame.image.toByteData(format: ui.ImageByteFormat.rawStraightRgba);
  });
  expect(rgba, isNotNull);
  return rgba!;
}
