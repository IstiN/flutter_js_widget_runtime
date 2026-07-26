import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

class _FakeBackend extends JsWidgetEngineBackend {
  String? ranWidgetJs;
  String? ranHostBootstrapJs;
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

    test('injects provided instanceId into bootstrap', () async {
      final backend = _FakeBackend();
      final config = JsRuntimeConfig(
        instanceId: 'panel-42',
        onRender: (_) {},
        onSetTitle: (_) {},
        onStorageUpdate: (_) {},
        backend: backend,
      );
      final engine = JsWidgetEngine(config: config);
      await engine.run('1');
      expect(backend.ranHostBootstrapJs, contains('jsr.instanceId = "panel-42"'));
    });

    test('generates a unique instanceId when not provided', () async {
      final backendA = _FakeBackend();
      final backendB = _FakeBackend();
      JsRuntimeConfig configFor(_FakeBackend b) => JsRuntimeConfig(
            onRender: (_) {},
            onSetTitle: (_) {},
            onStorageUpdate: (_) {},
            backend: b,
          );
      await JsWidgetEngine(config: configFor(backendA)).run('1');
      await JsWidgetEngine(config: configFor(backendB)).run('1');
      final a = backendA.ranHostBootstrapJs!;
      final b = backendB.ranHostBootstrapJs!;
      expect(a, contains('jsr.instanceId = '));
      expect(b, contains('jsr.instanceId = '));
      expect(a, isNot(b));
    });

    test('appends host bootstrap after instanceId', () async {
      final backend = _FakeBackend();
      final config = JsRuntimeConfig(
        instanceId: 'p1',
        hostBootstrapJs: 'jsr.custom = 1;',
        onRender: (_) {},
        onSetTitle: (_) {},
        onStorageUpdate: (_) {},
        backend: backend,
      );
      await JsWidgetEngine(config: config).run('1');
      expect(backend.ranHostBootstrapJs, contains('jsr.instanceId = "p1"'));
      expect(backend.ranHostBootstrapJs, contains('jsr.custom = 1;'));
    });
  });
}
