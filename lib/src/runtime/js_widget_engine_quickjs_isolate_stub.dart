import 'package:js_widget_runtime/src/model/js_runtime_config.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_backend.dart';

/// The isolated QuickJS backend is available only on native VM platforms.
JsWidgetEngineBackend createQuickjsIsolateWidgetEngineBackend(
  JsRuntimeConfig config,
) => throw UnsupportedError('QuickJS isolate backend requires a native VM.');
