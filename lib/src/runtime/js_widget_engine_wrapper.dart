import 'package:js_widget_runtime/src/model/js_runtime_config.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_backend.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_flutter_js.dart'
    if (dart.library.html) 'package:js_widget_runtime/src/runtime/js_widget_engine_web_worker.dart';

/// Entry point for running a JS widget.
///
/// [JsWidgetEngine] delegates to a [JsWidgetEngineBackend]. By default it
/// chooses `flutter_js` on VM platforms and a Web Worker on the web. Hosts
/// can override the backend via [JsRuntimeConfig.backend], allowing them to
/// plug in a custom engine such as a QuickJS FFI wrapper.
class JsWidgetEngine {
  /// Creates an engine.
  ///
  /// If [config.backend] is set, it is used directly. Otherwise the platform
  /// default backend is created.
  factory JsWidgetEngine({required JsRuntimeConfig config}) {
    final backend = config.backend ?? _defaultBackend(config);
    return JsWidgetEngine._(config, backend);
  }

  JsWidgetEngine._(this._config, this._backend);

  final JsRuntimeConfig _config;
  final JsWidgetEngineBackend _backend;

  /// Initializes the backend.
  Future<void> init() => _backend.init();

  /// Runs the widget JavaScript.
  Future<void> run(String widgetJs) => _backend.run(
        widgetJs,
        hostBootstrapJs: _config.hostBootstrapJs,
        initialTheme: _config.initialTheme,
      );

  /// Dispatches an event to the widget's `handleEvent` function.
  Future<void> callEvent(
    String actionId, [
    Map<String, dynamic>? payload,
  ]) =>
      _backend.callEvent(actionId, payload);

  /// Pushes a theme update into the running JS context.
  void updateTheme(Map<String, dynamic> colors) => _backend.updateTheme(colors);

  /// Releases the backend.
  Future<void> dispose() => _backend.dispose();

  /// Returns and clears the console log buffer.
  List<Map<String, dynamic>> flushLogs() => _backend.flushLogs();

  /// Returns a copy of the console log buffer.
  List<Map<String, dynamic>> peekLogs() => _backend.peekLogs();

  /// Last structured state exported via `jsr.exportState(...)`.
  Map<String, dynamic>? get exportedState => _backend.exportedState;
}

JsWidgetEngineBackend _defaultBackend(JsRuntimeConfig config) {
  // The conditional import above resolves to FlutterJsWidgetEngineBackend on
  // VM platforms and WebWorkerJsWidgetEngineBackend on the web.
  return FlutterJsWidgetEngineBackend(config: config);
}
