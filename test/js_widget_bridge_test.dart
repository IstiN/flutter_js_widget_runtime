import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_3d_host.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_bridge.dart';

JsWidgetBridge _makeBridge({
  required Map<String, dynamic> resolved,
  Js3dHost? host,
  bool allowPermissions = true,
}) =>
    JsWidgetBridge(
      widgetId: 'test',
      onRender: (_) {},
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
      onLog: (_) {},
      isDisposed: () => false,
      isPermissionAllowed: allowPermissions ? (_) => true : (_) => false,
      resolveCallback: (id, value) => resolved[id] = value,
      fetchHandler: (_, __, ___, ____) async {},
      secretsGetHandler: (_, __) async {},
      secretsSetHandler: (_, __, ___) async {},
      loadAssetHandler: (_, __) async {},
      execHandler: (_, __) async {},
      intervalTickHandler: (_) {},
      rafTickHandler: (_, __) => {},
      js3dHost: host,
      initialStorage: const {},
    );

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
      await bridge.dispatch(
        '__jsr_storage_get',
        '{"id":"g1","key":"existing"}',
      );
      expect(resolved['g1'], 'value');

      await bridge.dispatch('__jsr_storage_set', '{"key":"new","value":"x"}');
      expect(storageUpdates.last['new'], 'x');

      await bridge.dispatch('__jsr_storage_get', '{"id":"g2","key":"new"}');
      expect(resolved['g2'], 'x');
    });

    test('storage is denied when permission checker rejects', () async {
      final denied = _makeBridge(
        resolved: resolved,
        allowPermissions: false,
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
      await bridge.dispatch(
        '__jsr_secrets_set',
        '{"id":"s2","key":"token","value":"v"}',
      );
      expect(resolved['s2'], true);
    });

    test('dispatches load asset', () async {
      await bridge.dispatch(
        '__jsr_load_asset',
        '{"id":"a1","path":"widget.js"}',
      );
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

    test('rapid-fire callEvents serialize and never crash', () async {
      // Regression: tap-down/tap-up/tap fire three callEvents back to back.
      // A stale done used to complete the next completer early, and the
      // following callEvent crashed with "Future already completed".
      final order = <int>[];
      final futures = [
        for (var i = 0; i < 5; i++) bridge.callEvent(() => order.add(i)),
      ];
      await pumpEventQueue();
      // Sends are queued: only the first has run so far.
      expect(order, [0]);
      for (var i = 1; i < 5; i++) {
        await bridge.dispatch('__jsr_event_done', '{}');
        await pumpEventQueue();
        // After each done the next queued send runs, in order.
        expect(order, [for (var j = 0; j <= i; j++) j]);
      }
      await bridge.dispatch('__jsr_event_done', '{}');
      await Future.wait(futures);
      // The bridge stays healthy afterwards.
      final again = bridge.callEvent(() {});
      await bridge.dispatch('__jsr_event_done', '{}');
      await again;
      expect(again, completes);
    });

    test('a stray done with nothing pending is ignored', () async {
      final first = bridge.callEvent(() {});
      await bridge.dispatch('__jsr_event_done', '{}');
      await first;
      // A duplicated done arriving while nothing is pending must not
      // poison the next event (take-and-null in _handleEventDone).
      await bridge.dispatch('__jsr_event_done', '{}');
      final second = bridge.callEvent(() {});
      await pumpEventQueue();
      var completed = false;
      second.then((_) => completed = true).ignore();
      await Future<void>.delayed(const Duration(milliseconds: 20));
      expect(completed, isFalse);
      await bridge.dispatch('__jsr_event_done', '{}');
      await second;
      expect(completed, isTrue);
    });

    test('a queued callEvent never sends after dispose', () async {
      // Regression (TestFlight SIGSEGV in JSC::JSLock::lock): an event queued
      // behind an in-flight one ran its send after the engine was disposed —
      // dispose() completes the pending completer, draining the queue — and
      // evaluated JS in the released JSContextGroup (use-after-free).
      var disposed = false;
      final raceBridge = JsWidgetBridge(
        widgetId: 'test',
        onRender: (_) {},
        onSetTitle: (_) {},
        onStorageUpdate: (_) {},
        onLog: (_) {},
        isDisposed: () => disposed,
        resolveCallback: (_, __) {},
        fetchHandler: (_, __, ___, ____) async {},
        secretsGetHandler: (_, __) async {},
        secretsSetHandler: (_, __, ___) async {},
        loadAssetHandler: (_, __) async {},
        execHandler: (_, __) async {},
        intervalTickHandler: (_) {},
        rafTickHandler: (_, __) {},
        initialStorage: const {},
      );
      // Event #1 stays in flight (its done never arrives); event #2 queues.
      final first = raceBridge.callEvent(() {});
      var secondSent = false;
      final second = raceBridge.callEvent(() => secondSent = true);
      await pumpEventQueue();
      // Engine teardown: completes the in-flight completer, draining the
      // queue into event #2's send — which must now no-op.
      disposed = true;
      raceBridge.dispose();
      await first;
      await second;
      expect(secondSent, isFalse);
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

    group('scene3d', () {
      late List<Js3dCommand> commands;
      late _Test3dHost host;
      late JsWidgetBridge sceneBridge;

      setUp(() {
        commands = [];
        host = _Test3dHost(commands.add);
        sceneBridge = _makeBridge(resolved: {}, host: host);
      });

      tearDown(() {
        sceneBridge.dispose();
      });

      test('create initializes a controller', () async {
        await sceneBridge.dispatch(
          '__jsr_scene3d_command',
          '{"kind":"create","sceneId":"s1","payload":{"camera":{}}}',
        );
        expect(commands, isEmpty);
        expect(host.controllers, contains('s1'));
      });

      test('addModel forwards command to controller', () async {
        await sceneBridge.dispatch(
          '__jsr_scene3d_command',
          '{"kind":"create","sceneId":"s1","payload":{}}',
        );
        await sceneBridge.dispatch(
          '__jsr_scene3d_command',
          '{"kind":"addModel","sceneId":"s1","payload":{"modelId":"m1","src":"a.glb"}}',
        );
        expect(commands.length, 1);
        expect(commands.first.kind, 'addModel');
        expect(commands.first.modelId, 'm1');
        expect(commands.first.payload?['src'], 'a.glb');
      });

      test('setTransforms fans out to one setTransform per item', () async {
        await sceneBridge.dispatch(
          '__jsr_scene3d_command',
          '{"kind":"create","sceneId":"s1","payload":{}}',
        );
        await sceneBridge.dispatch(
          '__jsr_scene3d_command',
          '{"kind":"setTransforms","sceneId":"s1","payload":{"items":['
          '{"modelId":"a","position":[1,0,0]},'
          '{"modelId":"b","scale":[2,2,2]}'
          ']}}',
        );
        expect(commands.length, 2);
        expect(commands[0].kind, 'setTransform');
        expect(commands[0].sceneId, 's1');
        expect(commands[0].modelId, 'a');
        expect(commands[0].payload?['position'], [1, 0, 0]);
        expect(commands[1].kind, 'setTransform');
        expect(commands[1].modelId, 'b');
        expect(commands[1].payload?['scale'], [2, 2, 2]);
      });

      test('setTransforms skips non-map items and unknown scenes', () async {
        // No controller for the scene: nothing is applied.
        await sceneBridge.dispatch(
          '__jsr_scene3d_command',
          '{"kind":"setTransforms","sceneId":"nope","payload":{"items":[{"modelId":"a"}]}}',
        );
        expect(commands, isEmpty);

        await sceneBridge.dispatch(
          '__jsr_scene3d_command',
          '{"kind":"create","sceneId":"s1","payload":{}}',
        );
        await sceneBridge.dispatch(
          '__jsr_scene3d_command',
          '{"kind":"setTransforms","sceneId":"s1","payload":{"items":["junk",{"modelId":"a"}]}}',
        );
        expect(commands.length, 1);
        expect(commands.single.modelId, 'a');
      });

      test('destroy disposes controller', () async {
        await sceneBridge.dispatch(
          '__jsr_scene3d_command',
          '{"kind":"create","sceneId":"s1","payload":{}}',
        );
        final controller = host.controllers['s1'];
        expect(controller, isNotNull);
        expect(controller!.disposed, isFalse);
        await sceneBridge.dispatch(
          '__jsr_scene3d_command',
          '{"kind":"destroy","sceneId":"s1"}',
        );
        expect(controller.disposed, isTrue);
      });

      test('command without host is ignored', () async {
        final noHost = _makeBridge(resolved: {});
        await noHost.dispatch(
          '__jsr_scene3d_command',
          '{"kind":"create","sceneId":"s1","payload":{}}',
        );
        noHost.dispose();
      });
    });
  });
}

class _Test3dController extends Js3dController {
  _Test3dController(this.onApply);
  final void Function(Js3dCommand) onApply;
  bool disposed = false;

  @override
  void apply(Js3dCommand command) {
    onApply(command);
    notifyListeners();
  }

  @override
  void dispose() {
    disposed = true;
    super.dispose();
  }
}

class _Test3dHost extends Js3dHost {
  _Test3dHost(this.onCommand);
  final void Function(Js3dCommand) onCommand;
  final Map<String, _Test3dController> controllers = {};

  @override
  Js3dController createController(
    String sceneId,
    Map<String, dynamic> config,
  ) {
    final c = _Test3dController(onCommand);
    controllers[sceneId] = c;
    return c;
  }

  @override
  Widget build(
    BuildContext context,
    Js3dController controller,
    Map<String, dynamic> config,
  ) =>
      const SizedBox.shrink();
}
