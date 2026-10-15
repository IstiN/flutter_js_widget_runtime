import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_bridge.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

/// Shared QuickJS-backend harness for the engine/bridge widget tests:
/// native-lib probe, engine boot, exportState polling and a prebuilt
/// [JsWidgetBridge] for engine-less dispatch tests.
final bool kHasQuickjsNativeLib = File(QuickjsFfi.libraryPath).existsSync();

/// Boots a widget source on the real QuickJS backend. The backend is
/// disposed via [addTearDown].
Future<QuickjsWidgetEngineBackend> bootQuickjsWidget(
  String source, {
  String widgetId = 'quickjs-harness-test',
  void Function(Map<String, dynamic>)? onRender,
  void Function(String name, Map<String, dynamic> args)? onHostCall,
  void Function(String name, Uint8List data)? onHostCallBinary,
}) async {
  final backend = QuickjsWidgetEngineBackend(
    config: JsRuntimeConfig(
      widgetId: widgetId,
      onRender: onRender ?? (_) {},
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
      initialStorage: const {},
      onHostCall: onHostCall == null
          ? null
          : (name, args) {
              onHostCall(name, args);
              return Future<Object?>.value();
            },
      onHostCallBinary: onHostCallBinary,
    ),
  );
  addTearDown(backend.dispose);
  await backend.init();
  await backend.run(source).catchError((_) {});
  return backend;
}

/// Polls until the source has exported its state (or ~1s passes).
Future<Map<String, dynamic>?> exportedStateOf(
  QuickjsWidgetEngineBackend backend,
) async {
  for (var i = 0; i < 100 && backend.exportedState == null; i++) {
    await Future<void>.delayed(const Duration(milliseconds: 10));
  }
  return backend.exportedState;
}

/// A [JsWidgetBridge] with only the binary lane wired — for direct
/// `dispatch` tests that must not require a JS runtime.
JsWidgetBridge buildBinaryTestBridge({
  void Function(String name, Uint8List data)? onHostCallBinary,
}) {
  return JsWidgetBridge(
    widgetId: 'bridge-only',
    onRender: (_) {},
    onSetTitle: (_) {},
    onStorageUpdate: (_) {},
    onLog: (_) {},
    isDisposed: () => false,
    resolveCallback: (_, __) {},
    fetchHandler: (_, __, ___, ____) async {},
    secretsGetHandler: (_, __) async {},
    secretsSetHandler: (_, __, ___) async {},
    loadAssetHandler: (_, __) async {},
    execHandler: (_, __) async {},
    onHostCallBinary: onHostCallBinary,
    intervalTickHandler: (_) {},
    rafTickHandler: (_, __) {},
    initialStorage: const {},
  );
}
