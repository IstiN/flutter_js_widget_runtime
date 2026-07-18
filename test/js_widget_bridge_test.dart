import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_bridge.dart';

void main() {
  group('JsWidgetBridge', () {
    late List<String> logs;
    late List<Map<String, dynamic>> renders;
    late List<String> titles;
    late List<Map<String, dynamic>> storageUpdates;
    late Map<String, dynamic> resolved;
    late JsWidgetBridge bridge;

    setUp(() {
      logs = [];
      renders = [];
      titles = [];
      storageUpdates = [];
      resolved = {};
      bridge = JsWidgetBridge(
        widgetId: 'test',
        onRender: renders.add,
        onSetTitle: titles.add,
        onStorageUpdate: storageUpdates.add,
        onLog: logs.add,
        isDisposed: () => false,
        resolveCallback: (id, value) => resolved[id] = value,
        fetchHandler: (id, url, method, headers) async {
          resolved[id] = {'url': url, 'method': method};
        },
        secretsGetHandler: (id, key) async => resolved[id] = 'secret:$key',
        secretsSetHandler: (id, key, value) async => resolved[id] = true,
        loadAssetHandler: (id, path) async => resolved[id] = 'asset:$path',
        execHandler: (id, cmd) async => resolved[id] = {'cmd': cmd},
        intervalTickHandler: (id) => resolved[id] = 'tick',
        rafTickHandler: (id, elapsedMs) => resolved[id] = elapsedMs,
        initialStorage: const {'existing': 'value'},
      );
    });

    tearDown(() {
      bridge.dispose();
    });

    test('dispatches render channel', () async {
      await bridge.dispatch('__jsr_render', '{"type":"text","data":"hi"}');
      expect(renders.length, 1);
      expect(renders.first['data'], 'hi');
    });

    test('dispatches set title', () async {
      await bridge.dispatch('__jsr_set_title', 'My title');
      expect(titles, ['My title']);
    });

    test('dispatches storage get/set', () async {
      await bridge.dispatch('__jsr_storage_get', '{"id":"g1","key":"existing"}');
      expect(resolved['g1'], 'value');

      await bridge.dispatch('__jsr_storage_set', '{"key":"new","value":"x"}');
      expect(storageUpdates.last['new'], 'x');

      await bridge.dispatch('__jsr_storage_get', '{"id":"g2","key":"new"}');
      expect(resolved['g2'], 'x');
    });

    test('storage is denied when permission checker rejects', () async {
      final denied = JsWidgetBridge(
        widgetId: 'test',
        onRender: (_) {},
        onSetTitle: (_) {},
        onStorageUpdate: (_) {},
        onLog: (_) {},
        isDisposed: () => false,
        isPermissionAllowed: (_) => false,
        resolveCallback: (id, value) => resolved[id] = value,
        fetchHandler: (_, __, ___, ____) async {},
        secretsGetHandler: (_, __) async {},
        secretsSetHandler: (_, __, ___) async {},
        loadAssetHandler: (_, __) async {},
        execHandler: (_, __) async {},
        intervalTickHandler: (_) {},
        rafTickHandler: (_, __) {},
        initialStorage: const {},
      );
      await denied.dispatch('__jsr_storage_get', '{"id":"g1","key":"k"}');
      expect(resolved['g1'], contains('__error'));
      denied.dispose();
    });

    test('dispatches fetch channel', () async {
      await bridge.dispatch('__jsr_fetch', '{"id":"f1","url":"/api"}');
      expect(resolved['f1'], {'url': '/api', 'method': 'GET'});
    });

    test('dispatches secrets get/set', () async {
      await bridge.dispatch('__jsr_secrets_get', '{"id":"s1","key":"token"}');
      expect(resolved['s1'], 'secret:token');
      await bridge.dispatch('__jsr_secrets_set', '{"id":"s2","key":"token","value":"v"}');
      expect(resolved['s2'], true);
    });

    test('dispatches load asset', () async {
      await bridge.dispatch('__jsr_load_asset', '{"id":"a1","path":"widget.js"}');
      expect(resolved['a1'], 'asset:widget.js');
    });

    test('dispatches exec', () async {
      await bridge.dispatch('__jsr_exec', '{"id":"e1","cmd":"ls"}');
      expect(resolved['e1'], {'cmd': 'ls'});
    });

    test('dispatches log channel', () async {
      await bridge.dispatch('__jsr_log', 'hello');
      expect(logs, ['hello']);
    });

    test('dispatches export state', () async {
      await bridge.dispatch('__jsr_export_state', '{"counter":1}');
      expect(bridge.exportedState, {'counter': 1});
    });

    test('updateThemeJs generates valid JS snippet', () {
      final js = JsWidgetBridge.updateThemeJs(const {'accent': '#fff'});
      expect(js, contains('jsr.theme='));
      expect(js, contains('#fff'));
    });

    test('callEvent completes when event done is signaled', () async {
      final future = bridge.callEvent(() {});
      await bridge.dispatch('__jsr_event_done', '{}');
      await future;
      expect(future, completes);
    });

    test('interval fires through handler', () async {
      await bridge.dispatch('__jsr_set_interval', '{"id":"i1","ms":10}');
      await Future<void>.delayed(const Duration(milliseconds: 40));
      expect(resolved['i1'], 'tick');
      bridge.dispatch('__jsr_clear_interval', 'i1');
    });

    test('dispose cancels intervals and tickers', () {
      bridge.dispose();
      expect(bridge.exportedState, isNull);
    });
  });
}
