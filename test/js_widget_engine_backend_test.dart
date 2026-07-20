import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

class _FakeBackend extends JsWidgetEngineBackend {
  String? ranWidgetJs;
  String? lastActionId;
  Map<String, dynamic>? lastPayload;
  bool disposed = false;

  @override
  Future<void> init() async {}

  @override
  Future<void> run(
    String widgetJs, {
    String? hostBootstrapJs,
    Map<String, dynamic> initialTheme = const {},
  }) async {
    ranWidgetJs = widgetJs;
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

void main() {
  group('JsWidgetEngine backend delegation', () {
    test('uses custom backend from JsRuntimeConfig', () async {
      final backend = _FakeBackend();
      final config = JsRuntimeConfig(
        onRender: (_) {},
        onSetTitle: (_) {},
        onStorageUpdate: (_) {},
        backend: backend,
      );
      final engine = JsWidgetEngine(config: config);
      await engine.run('console.log("hello")');
      expect(backend.ranWidgetJs, 'console.log("hello")');

      await engine.callEvent('tap', {'x': 1});
      expect(backend.lastActionId, 'tap');
      expect(backend.lastPayload, {'x': 1});

      await engine.dispose();
      expect(backend.disposed, isTrue);
    });
  });
}
