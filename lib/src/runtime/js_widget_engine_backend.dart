import 'dart:async';

/// Abstract backend for the JS widget engine.
///
/// Implementations can use any JavaScript execution technology:
/// `flutter_js`, a custom QuickJS FFI wrapper, a Web Worker, a WebView, etc.
/// The renderer and bridge logic live outside the backend, so hosts can plug
/// in the engine that fits their platform or performance requirements.
abstract class JsWidgetEngineBackend {
  /// Initializes the backend (loads libraries, creates contexts, etc.).
  Future<void> init();

  /// Runs a widget's JavaScript code.
  ///
  /// [widgetJs] is the widget source. [hostBootstrapJs] is evaluated before
  /// the widget code so hosts can inject platform APIs. [initialTheme] is the
  /// starting theme map.
  Future<void> run(
    String widgetJs, {
    String? hostBootstrapJs,
    Map<String, dynamic> initialTheme = const {},
  });

  /// Dispatches an event to the widget's `handleEvent(actionId, payload)`.
  Future<void> callEvent(String actionId, Map<String, dynamic>? payload);

  /// Pushes an updated theme into the running JS context.
  void updateTheme(Map<String, dynamic> colors);

  /// Releases all resources held by the backend.
  Future<void> dispose();

  /// Returns and clears the accumulated console log buffer.
  List<Map<String, dynamic>> flushLogs();

  /// Returns a copy of the console log buffer without clearing it.
  List<Map<String, dynamic>> peekLogs();

  /// Last structured state exported via `jsr.exportState(...)`.
  Map<String, dynamic>? get exportedState;
}
