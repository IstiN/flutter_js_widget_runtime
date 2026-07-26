import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_flutter_js.dart';

import 'fake_engine_backend.dart';

JsRuntimeConfig _configFor(
  FakeEngineBackend backend, {
  String? instanceId,
  String? hostBootstrapJs,
}) =>
    JsRuntimeConfig(
      instanceId: instanceId,
      hostBootstrapJs: hostBootstrapJs,
      onRender: (_) {},
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
      backend: backend,
    );

void main() {
  group('JsWidgetEngine backend delegation', () {
    test('uses custom backend from JsRuntimeConfig', () async {
      final backend = FakeEngineBackend();
      final engine = JsWidgetEngine(config: _configFor(backend));
      await engine.run('console.log("hello")');
      expect(backend.ranWidgetJs, 'console.log("hello")');

      await engine.callEvent('tap', {'x': 1});
      expect(backend.lastActionId, 'tap');
      expect(backend.lastPayload, {'x': 1});

      await engine.dispose();
      expect(backend.disposed, isTrue);
    });

    test('injects provided instanceId into bootstrap', () async {
      final backend = FakeEngineBackend();
      await JsWidgetEngine(
        config: _configFor(backend, instanceId: 'panel-42'),
      ).run('1');
      expect(backend.ranHostBootstrapJs, contains('jsr.instanceId = "panel-42"'));
    });

    test('generates a unique instanceId when not provided', () async {
      final backendA = FakeEngineBackend();
      final backendB = FakeEngineBackend();
      await JsWidgetEngine(config: _configFor(backendA)).run('1');
      await JsWidgetEngine(config: _configFor(backendB)).run('1');
      final a = backendA.ranHostBootstrapJs!;
      final b = backendB.ranHostBootstrapJs!;
      expect(a, contains('jsr.instanceId = '));
      expect(b, contains('jsr.instanceId = '));
      expect(a, isNot(b));
    });

    test('appends host bootstrap after instanceId', () async {
      final backend = FakeEngineBackend();
      await JsWidgetEngine(
        config: _configFor(
          backend,
          instanceId: 'p1',
          hostBootstrapJs: 'jsr.custom = 1;',
        ),
      ).run('1');
      expect(backend.ranHostBootstrapJs, contains('jsr.instanceId = "p1"'));
      expect(backend.ranHostBootstrapJs, contains('jsr.custom = 1;'));
    });

    test('dispatchHostEvent delegates to the backend', () async {
      final backend = FakeEngineBackend();
      final engine = JsWidgetEngine(config: _configFor(backend));
      engine.dispatchHostEvent('key', {'key': 'a', 'down': true});
      engine.dispatchHostEvent('scene3d.tap:s1', {'modelId': null});
      expect(backend.hostTargets, ['key', 'scene3d.tap:s1']);
      expect(backend.hostPayloads.first['key'], 'a');
      await engine.dispose();
    });

    test('hostEventJs wraps the bootstrap dispatcher with JSON args', () {
      final js = FlutterJsWidgetEngineBackend.hostEventJs(
        'scene3d.tap:s1',
        const {'modelId': 'box', 'point': [1, 2, 3]},
      );
      expect(js, contains('__jsrHostEvent('));
      expect(js, contains('"scene3d.tap:s1"'));
      expect(js, contains('"modelId":"box"'));
    });
  });
}
