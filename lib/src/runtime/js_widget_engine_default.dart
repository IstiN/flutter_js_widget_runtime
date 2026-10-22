import 'package:js_widget_runtime/src/model/js_runtime_config.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_backend.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_flutter_js.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

/// Creates the platform-default backend on VM / native platforms.
///
/// Prefers [QuickjsWidgetEngineBackend] (`quickjs_runtime` Native Asset:
/// synchronous host callbacks + zero-copy binary lane on iOS, Android, macOS,
/// Linux, Windows) and falls back to [FlutterJsWidgetEngineBackend] only when
/// the QuickJS native library is unavailable.
///
/// This lives behind a conditional import in `js_widget_engine_wrapper.dart`
/// because `dart:ffi` cannot be compiled for the web — the web variant of this
/// factory is `js_widget_engine_default_web.dart`.
JsWidgetEngineBackend createDefaultJsWidgetEngineBackend(
  JsRuntimeConfig config,
) => QuickjsFfi.isAvailable
    ? QuickjsWidgetEngineBackend(config: config)
    : FlutterJsWidgetEngineBackend(config: config);
