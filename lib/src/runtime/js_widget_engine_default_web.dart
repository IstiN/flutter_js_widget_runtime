import 'package:js_widget_runtime/src/model/js_runtime_config.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_backend.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_web_worker.dart';

/// Creates the platform-default backend on the web (dedicated Web Worker).
///
/// Web variant of `js_widget_engine_default.dart`, selected via a conditional
/// import in `js_widget_engine_wrapper.dart`.
JsWidgetEngineBackend createDefaultJsWidgetEngineBackend(
  JsRuntimeConfig config,
) => WebWorkerJsWidgetEngineBackend(config: config);
