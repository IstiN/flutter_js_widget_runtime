import 'dart:async';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

final bool _hasNativeLib = File(QuickjsFfi.libraryPath).existsSync();

void main() {
  if (!_hasNativeLib) return;
  test('voxel-sandbox widget boots on QuickJS and fills the voxel world',
      () async {
    final backend = QuickjsWidgetEngineBackend(
      config: JsRuntimeConfig(
        widgetId: 'voxel-sandbox',
        onRender: (_) {},
        onSetTitle: (_) {},
        onStorageUpdate: (_) {},
      ),
    );
    await backend.init();
    addTearDown(backend.dispose);
    unawaited(
      backend
          .run(File('example/widgets/voxel-sandbox/widget.js').readAsStringSync())
          .catchError((_) {}),
    );
    // Wait until all 9 chunks + camera land in the bridge-owned world.
    for (var i = 0; i < 100; i++) {
      await Future<void>.delayed(const Duration(milliseconds: 20));
      final world = backend.voxelWorld;
      if (world != null && world.chunksOf('sandbox').length == 9) break;
    }
    final world = backend.voxelWorld!;
    expect(world.chunksOf('sandbox').length, 9, reason: '3x3 chunks uploaded');
    var faces = 0;
    for (final c in world.chunksOf('sandbox').values) {
      faces += c.indices.length ~/ 3;
    }
    // ignore: avoid_print
    print('SMOKE faces=$faces');
    expect(faces, greaterThan(500));
    // Dig edit: re-pushes only dirty chunks (world totals unchanged).
    await backend.callEvent('dig');
    expect(world.chunksOf('sandbox').length, 9);
    // Camera event repaints without re-upload.
    await backend.callEvent('cam_left');
  }, timeout: const Timeout(Duration(minutes: 2)));
}
