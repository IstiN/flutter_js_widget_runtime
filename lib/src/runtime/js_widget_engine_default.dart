import 'package:js_widget_runtime/src/model/js_runtime_config.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_backend.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_flutter_js.dart';

/// Creates the platform-default backend on VM / native platforms.
///
/// This lives behind a conditional import in `js_widget_engine_wrapper.dart`
/// because `flutter_js` depends on `dart:ffi` and cannot be compiled for the
/// web — the web variant of this factory is `js_widget_engine_default_web.dart`.
JsWidgetEngineBackend createDefaultJsWidgetEngineBackend(
  JsRuntimeConfig config,
) => FlutterJsWidgetEngineBackend(config: config);
