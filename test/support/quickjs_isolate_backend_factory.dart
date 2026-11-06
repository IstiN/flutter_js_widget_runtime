// Shared factory for QuickJS isolate-backend tests: builds
// createQuickjsIsolateWidgetEngineBackend instances with the standard
// no-op config, tracks them, and provides the skip guard + teardown used
// by every isolate-suite test file (keeps the duplication gate happy).
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

/// Whether the QuickJS native bridge is loadable; isolate suites skip
/// cleanly when it is not.
final bool isolateNativeLibAvailable = QuickjsFfi.isAvailable;

final List<JsWidgetEngineBackend> _isolateBackends = [];

/// Builds a tracked isolate backend with the standard no-op host config.
JsWidgetEngineBackend buildIsolateBackend(
  String widgetId, {
  void Function(Map<String, dynamic> tree)? onRender,
  void Function(String message)? onLog,
  void Function(String name, Uint8List data)? onBinary,
}) {
  final backend = createQuickjsIsolateWidgetEngineBackend(
    JsRuntimeConfig(
      widgetId: widgetId,
      onRender: onRender ?? (_) {},
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
      onLog: onLog,
      onHostCallBinary: onBinary,
    ),
  );
  _isolateBackends.add(backend);
  return backend;
}

/// Registers the standard tearDown that disposes every backend built by
/// [buildIsolateBackend] in the current test file.
/// Registers a backend that was constructed outside [buildIsolateBackend]
/// (custom configs) so the shared teardown still disposes it.
void trackIsolateBackend(JsWidgetEngineBackend backend) {
  _isolateBackends.add(backend);
}

void teardownIsolateBackends() {
  tearDown(() async {
    for (final backend in _isolateBackends) {
      await backend.dispose();
    }
    _isolateBackends.clear();
    await pumpEventQueue();
  });
}
