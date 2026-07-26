import 'package:js_widget_runtime/js_widget_runtime.dart';

/// A fake [JsWidgetEngineBackend] shared by engine tests: records calls
/// instead of running real JavaScript.
class FakeEngineBackend extends JsWidgetEngineBackend {
  String? ranWidgetJs;
  String? ranHostBootstrapJs;
  String? lastActionId;
  Map<String, dynamic>? lastPayload;
  bool disposed = false;
  final List<String> hostTargets = [];
  final List<Map<String, dynamic>> hostPayloads = [];

  void clear() {
    hostTargets.clear();
    hostPayloads.clear();
  }

  @override
  Future<void> init() async {}

  @override
  Future<void> run(
    String widgetJs, {
    String? hostBootstrapJs,
    Map<String, dynamic> initialTheme = const {},
  }) async {
    ranWidgetJs = widgetJs;
    ranHostBootstrapJs = hostBootstrapJs;
  }

  @override
  Future<void> callEvent(
    String actionId, [
    Map<String, dynamic>? payload,
  ]) async {
    lastActionId = actionId;
    lastPayload = payload;
  }

  @override
  void dispatchHostEvent(String target, Map<String, dynamic> payload) {
    hostTargets.add(target);
    hostPayloads.add(payload);
  }

  @override
  void updateTheme(Map<String, dynamic> colors) {}

  @override
  Future<void> dispose() async {
    disposed = true;
  }

  @override
  List<Map<String, dynamic>> flushLogs() => [];

  @override
  List<Map<String, dynamic>> peekLogs() => [];

  @override
  Map<String, dynamic>? get exportedState => null;
}
